// Isolated rolling/suspension preview. No walking pose or game physics changes.
import {demoRig,drawDemoRig,walkSpeed} from './walk-cycle.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const rollingSpeed=walkSpeed(1.8);
export function terrainHeight(x,roughness=1.8){
 const q=((x+70)%360+360)%360;
 return roughness/1.8*(1.8*Math.sin(x/65)-8*Math.exp(-(((q-115)/21)**2))+5.5*Math.exp(-(((q-238)/30)**2))-4*Math.exp(-(((q-318)/18)**2)));
}
function wheelSupport(x,travel,rx,ry,roughness){
 let height=Infinity;
 // The projected tire can bridge a small hollow and meet a bump on its rim.
 // This finds the highest supporting tangent rather than sinking half a tire
 // into a rising surface simply to keep its bottom at one sampled point.
 for(let i=-8;i<=8;i++){
  const u=i/8,dx=u*rx,lift=ry*(1-Math.sqrt(Math.max(0,1-u*u)));
  height=Math.min(height,terrainHeight(x+dx+travel,roughness)+lift);
 }
 return height;
}
export function hybridRigPose(character,time,roughness=1.8){
 const {p,anchor,k}=demoRig(character),feetX=p.legs.map(l=>(l.foot[0]-anchor[0])*k),travel=time*rollingSpeed;
 let weight=0,y=0,tilt=0;
 // A short damped response keeps the cabin calmer than the individual wheels.
 // Pure time sampling also makes pause and frame-by-frame inspection exact.
 for(let i=0;i<15;i++){
  const lag=(i+.5)*.025,w=lag*Math.exp(-lag/.09),distance=travel-lag*rollingSpeed;
  const values=feetX.map(x=>terrainHeight(x+distance,roughness)),mx=feetX.reduce((s,x)=>s+x,0)/feetX.length,my=values.reduce((s,v)=>s+v,0)/values.length;
  let numerator=0,denominator=0;for(let j=0;j<feetX.length;j++){numerator+=(feetX[j]-mx)*(values[j]-my);denominator+=(feetX[j]-mx)**2;}
  const slope=numerator/(denominator||1);
  y+=(my-slope*mx)*w;tilt+=Math.atan(slope)*w;weight+=w;
 }
 y=clamp(y/weight,-9,9);tilt=clamp(tilt/weight*.7,-.12,.12);
 const co=Math.cos(tilt),si=Math.sin(tilt);
 const contacts=[],steps=p.legs.map((leg,index)=>{
  const x=feetX[index],slope=(terrainHeight(x+travel+2,roughness)-terrainHeight(x+travel-2,roughness))/4;
  const targetX=x+clamp(slope*3,-2.5,2.5),rx=leg.hub[2]*k,ry=leg.hub[3]*k,targetY=wheelSupport(targetX,travel,rx,ry,roughness);
  // Transform the terrain contact back into the cabin frame. The hip stays
  // attached while the linked knee and wheel absorb each local height change.
  const xx=(targetX*co+(targetY-y)*si)/k+anchor[0],yy=(-targetX*si+(targetY-y)*co)/k+anchor[1];
  const roll=xx-leg.foot[0],offset=yy-leg.foot[1],bend=Math.sign(x)*clamp(-offset*k,-3,6)*.35;
  contacts.push({x:targetX,y:targetY,terrain:terrainHeight(targetX+travel,roughness),radiusX:rx,radiusY:ry});
  return{roll,offset,bend};
 });
 return{y,tilt,steps,contacts,travel};
}
export function drawRollingActor(c,image,character,time,roughness){
 const pose=hybridRigPose(character,time,roughness);drawDemoRig(c,image,character,time,pose,pose.steps,pose.travel);return pose;
}
