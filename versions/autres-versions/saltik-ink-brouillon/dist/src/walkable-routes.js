const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const entries=world=>world.platforms.flatMap(platform=>(platform.walkableEntries??[]).map(entry=>({platform,entry})));
const progress=(entry,x)=>(x-entry.points[0][0])/(entry.points.at(-1)[0]-entry.points[0][0]);
function section(entry,x){
  const points=entry.points,dir=Math.sign(points.at(-1)[0]-points[0][0]);
  const found=points.findIndex((point,i)=>i<points.length-1&&(x-points[i+1][0])*dir<=0);
  const index=found<0?points.length-2:found;
  const a=points[index],b=points[index+1],u=clamp((x-a[0])/(b[0]-a[0]),0,1);
  return {a,b,u,count:Math.max(1,Math.ceil(Math.abs(b[0]-a[0])/(entry.stepRun??18)))};
}

// The cabin follows the continuous climb; each original wheel follows the
// horizontal painted tread. Both use the same bottom-to-top authored points.
export function stairCenterHeight(entry,x){
  const {a,b,u}=section(entry,x);return a[1]+(b[1]-a[1])*u;
}
export function stairSurfaceHeight(entry,x){
  const {a,b,u,count}=section(entry,x);
  return a[1]+(b[1]-a[1])*Math.min(count,Math.floor(u*count+1e-8))/count;
}
export function stairTreads(entry){
  return entry.points.slice(0,-1).flatMap((a,index)=>{
    const b=entry.points[index+1],count=Math.max(1,Math.ceil(Math.abs(b[0]-a[0])/(entry.stepRun??18)));
    return Array.from({length:count},(_,i)=>({x1:a[0]+(b[0]-a[0])*i/count,x2:a[0]+(b[0]-a[0])*(i+1)/count,y:a[1]+(b[1]-a[1])*i/count}));
  });
}

function lowerHeight(world,entry,x,{surfaceHeight,terrainAt}){
  const lower=world.platforms.find(platform=>platform.id===entry.lowerId);
  return lower&&x>=lower.x1&&x<=lower.x2?surfaceHeight(lower,x):terrainAt(world,x);
}
export function walkableSupportHeight(world,player,x,geometry){
  let found;
  for(const platform of world.platforms){const entry=platform.walkableEntries?.find(entry=>entry.id===player.rampId);if(entry){found={platform,entry};break;}}
  if(!found)return undefined;
  const {platform,entry}=found,t=progress(entry,x);
  if(t<=0)return lowerHeight(world,entry,x,geometry);
  if(t>=1)return x>=platform.x1&&x<=platform.x2?geometry.surfaceHeight(platform,x):null;
  return stairSurfaceHeight(entry,x);
}

// Grounded movement changes support only at the two real stair junctions.
// Walking underneath an elevated path never pulls the player onto its roof.
export function advanceWalkableSupport(world,player,oldX,oldY,geometry){
  if(!player.onGround||player.obstacleId||player.bossSupport){player.rampId=null;return null;}
  const all=entries(world);let found=all.find(({entry})=>entry.id===player.rampId);
  if(!found){
    player.rampId=null;
    // At an illustrated switchback, both flights leave the same landing
    // in the same horizontal direction. Down/crouch selects the descending
    // flight; ordinary movement continues up the next flight.
    const nativeJunction=player.crouching&&all.some(({platform,entry})=>entry.nativeArt&&platform.id===player.platformId);
    const candidates=nativeJunction?[...all].sort((a,b)=>Number(b.platform.id===player.platformId)-Number(a.platform.id===player.platformId)):all;
    found=candidates.find(({platform,entry})=>{
      const before=progress(entry,oldX),now=progress(entry,player.x);
      const fromLower=(player.platformId??null)===(entry.lowerId??null)&&before<=1e-6&&now>=0&&now<1&&Math.abs(oldY-lowerHeight(world,entry,oldX,geometry))<14;
      const fromUpper=player.platformId===platform.id&&before>=1-1e-6&&now<1&&now>0&&Math.abs(oldY-geometry.surfaceHeight(platform,oldX))<14;
      return fromLower||fromUpper;
    });
    if(!found)return null;
    player.rampId=found.entry.id;
  }
  const {platform,entry}=found,t=progress(entry,player.x);
  if(t>=1){
    player.rampId=null;player.platformId=platform.id;player.tier=platform.tier;
    return geometry.surfaceHeight(platform,player.x);
  }
  if(t<=0){
    const lower=world.platforms.find(platform=>platform.id===entry.lowerId);
    player.rampId=null;player.platformId=lower?.id??null;player.tier=lower?.tier??0;
    return lowerHeight(world,entry,player.x,geometry);
  }
  player.platformId=null;player.tier=platform.tier;
  return stairCenterHeight(entry,player.x);
}

export function walkableLanding(world,player,oldX,oldY){
  return entries(world).filter(({entry})=>{
    const t=progress(entry,player.x);if(t<0||t>1||player.dropThrough===entry.id)return false;
    return oldY<=stairCenterHeight(entry,oldX)+1&&player.y>=stairCenterHeight(entry,player.x);
  }).map(({entry,platform})=>({y:stairCenterHeight(entry,player.x),tier:platform.tier,id:null,obstacleId:null,bossSupport:null,rampId:entry.id}));
}
