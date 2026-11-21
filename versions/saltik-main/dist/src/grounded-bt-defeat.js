import {sampleSupportSurface} from './support-pose.js';

export const BT_COLLAPSE_SECONDS=.48;

// Rotate the original costume about its tires, then lift by the deepest tire
// penetration. No world position changes or screen-space finish is involved.
export function groundedBTDefeatPose(e,time=0,{contacts=[]}={}){
 const progress=Math.max(0,Math.min(1,(time-(e.defeatStartedAt??time))/BT_COLLAPSE_SECONDS));
 const settled=progress*progress*(3-2*progress),rotation=(e.dir===-1?-1:1)*.62*settled;
 const co=Math.cos(rotation),si=Math.sin(rotation);
 let penetration=-Infinity;
 for(const point of contacts){
  const x=point.x-e.x,y=point.y-e.y,worldX=e.x+x*co-y*si,worldY=e.y+x*si+y*co;
  const surface=sampleSupportSurface(e.supportPose,worldX),floor=Number.isFinite(surface)?surface:e.y;
  penetration=Math.max(penetration,worldY-floor);
 }
 return{progress,rotation,offsetY:Number.isFinite(penetration)?-penetration:0};
}

export function drawGroundedBTDefeat(c,draw,e,{camera=0,time=0,contacts=[]}={}){
 const pose=groundedBTDefeatPose(e,time,{contacts});
 c.save();c.translate(e.x-camera,e.y+pose.offsetY);c.rotate(pose.rotation);c.translate(-(e.x-camera),-e.y);
 draw();c.restore();return pose;
}
