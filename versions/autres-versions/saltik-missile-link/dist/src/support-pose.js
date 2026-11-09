// Three visible wheel contacts measured on the native settled Saltik cell.
// Coordinates are world units at scale 1, facing right; the fourth wheel is
// behind the cabin. These are the painted wheels, not the collision half-width.
const K=.30*330/335;
export const SUPPORT_CONTACTS=[
  {id:'front',x:(205.5-43)*K,y:(426-428)*K},
  {id:'rear-near',x:(205.5-278)*K,y:0},
  {id:'rear-far',x:(205.5-376)*K,y:(426-428)*K},
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
// Keep the callback private (snapshots remain serializable), with a compact
// sampled fallback for geometry built from a read-only JSON snapshot.
const supportSamplers=new WeakMap();
export function sampleSupportSurface(pose,x){
  const sampler=pose&&supportSamplers.get(pose);
  if(sampler){const y=sampler(x);return Number.isFinite(y)?y:null;}
  const surface=pose?.surface;if(!surface)return null;
  const at=(x-surface.x)/surface.step,i=Math.floor(at),f=at-i;
  if(i<0||i>=surface.heights.length)return null;
  const left=surface.heights[i];if(f<1e-8)return left;
  const right=surface.heights[i+1];return Number.isFinite(left)&&Number.isFinite(right)?left+(right-left)*f:null;
}
const MAX_TILT=.20,MAX_HEAVE=6,MAX_TRAVEL=9;
// Conservative native body rectangle, including the antenna and crop margins.
const BODY_RISE=101,BODY_HALF_WIDTH=70;
function ceilingSafe(tilt,heave,clearance){
  if(!Number.isFinite(clearance))return {tilt,heave};
  const rise=a=>BODY_RISE*Math.cos(a)+BODY_HALF_WIDTH*Math.abs(Math.sin(a));
  heave=clamp(Math.max(heave,rise(tilt)-clearance),-MAX_HEAVE,MAX_HEAVE);
  if(rise(tilt)-heave>clearance){
    const sign=Math.sign(tilt);let lo=0,hi=Math.abs(tilt);
    for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(rise(mid)-heave<=clearance)lo=mid;else hi=mid;}
    tilt=sign*lo;
  }
  return {tilt,heave};
}

export function computeSupportPose(player,sampleHeight,previous=null,dt=1/60){
  const seconds=clamp(finite(dt),0,.10),dir=player.dir===-1?-1:1;
  const x=finite(player.x),y=finite(player.y),oldTilt=clamp(finite(previous?.tilt),-MAX_TILT,MAX_TILT);
  const oldHeave=clamp(finite(previous?.heave),-MAX_HEAVE,MAX_HEAVE);
  const eligible=player.onGround!==false&&!player.turn?.active;
  const points=SUPPORT_CONTACTS.map(c=>({...c,x:c.x*dir}));
  const sample=at=>{const height=sampleHeight(at);return Number.isFinite(height)?height:null;};
  const values=eligible?points.map(c=>sample(x+c.x)):points.map(()=>null);
  const valid=points.filter((_,i)=>values[i]!==null);
  let tilt=0,heave=0;
  if(valid.length){
    const meanX=valid.reduce((s,c)=>s+c.x,0)/valid.length;
    const meanY=points.reduce((s,c,i)=>values[i]===null?s:s+values[i]-y-c.y,0)/valid.length;
    let numerator=0,denominator=0;
    points.forEach((c,i)=>{if(values[i]!==null){numerator+=(c.x-meanX)*(values[i]-y-c.y-meanY);denominator+=(c.x-meanX)**2;}});
    tilt=clamp(denominator>1e-8?Math.atan(numerator/denominator):0,-MAX_TILT,MAX_TILT);
    heave=points.reduce((s,c,i)=>values[i]===null?s:s+values[i]-y-c.x*Math.sin(tilt)-c.y*Math.cos(tilt),0)/valid.length;
    heave=clamp(heave,-MAX_HEAVE,MAX_HEAVE);
  }
  if(previous){
    const blend=1-Math.exp(-seconds*(valid.length?18:10));
    tilt=oldTilt+(tilt-oldTilt)*blend;heave=oldHeave+(heave-oldHeave)*blend;
  }
  ({tilt,heave}=ceilingSafe(tilt,heave,player.supportClearance));
  const sin=Math.sin(tilt),cos=Math.cos(tilt);
  const contacts=points.map((c,i)=>{
    const baseX=x+c.x*cos-c.y*sin,baseY=y+heave+c.x*sin+c.y*cos;
    let height=eligible&&values[i]!==null?sample(baseX):null;
    let offset=0,contactX=baseX;
    if(height!==null){
      // The suspension travels on the body's local vertical axis. Resample
      // after that travel so a pitched wheel follows the same terrain point.
      for(let j=0;j<5;j++){
        offset=clamp((height-baseY)/cos,-MAX_TRAVEL,MAX_TRAVEL);
        contactX=baseX-offset*sin;height=sample(contactX);if(height===null)break;
      }
    }else if(previous){
      const before=finite(previous.contacts?.find(old=>old.id===c.id)?.offset);
      offset=clamp(before*Math.exp(-seconds*10),-MAX_TRAVEL,MAX_TRAVEL);contactX=baseX-offset*sin;
    }
    const grounded=height!==null&&Math.abs(baseY+offset*cos-height)<.05;
    return {id:c.id,x:contactX,y:height,offset,grounded};
  });
  const result={tilt,heave,contacts,grounded:contacts.some(c=>c.grounded)};
  if(eligible){
    result.surface={x:x-96,step:1,heights:Array.from({length:193},(_,i)=>sample(x-96+i))};
    supportSamplers.set(result,sample);
  }
  return result;
}
