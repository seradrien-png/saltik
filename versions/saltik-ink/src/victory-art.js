import {tachikomaGeometry} from './tachikoma-pose.js';
import {drawNativeBody} from './tachikoma-art.js';

// These are the ordinary idle sprite's two little wrists, in atlas pixels.
// Their masks stay below the rigid cabin, optics and original service housing.
const HANDS=[
  {pivot:[117,887],polygon:[[108,880],[119,880],[125,886],[128,895],[126,905],[122,913],[116,917],[109,916],[104,911],[102,902],[103,891]]},
  {pivot:[206,886],polygon:[[184,888],[192,885],[204,891],[209,898],[208,907],[201,916],[187,920],[175,915],[168,909],[165,902],[169,894],[176,892]]},
];
export function victoryGeometry(p,{camera=0,age=0}={}){
  const pose={...p,vx:0,vy:0,onGround:true,crouching:false,damagePose:false,
    melee:null,evasion:null,deflect:null,turn:null,cannonElevation:0};
  const g=tachikomaGeometry(pose,0,{camera});
  const phase=Math.max(0,age)%2,frame=phase<.32?0:phase<.8?1:phase<1.16?2:3;
  const lift=Math.sin(Math.PI*phase/2)**2,flutter=Math.sin(phase*Math.PI*6)*lift;
  const rotations=[-.48*lift+.14*flutter,.50*lift+.16*flutter];
  const point=([x,y])=>[(x-g.feet[0])*g.k,(y-512-g.feet[1])*g.k];
  const arms=HANDS.map((hand,i)=>({pivot:point(hand.pivot),polygon:hand.polygon.map(point),
    sourcePolygon:hand.polygon,rotation:rotations[i]}));
  return {...g,bodyFrame:g.frame,frame,arms,height:99,foot:{x:p.x-camera,y:p.y}};
}
export function drawVictory(c,images,p,options={}){
  const sheet=images.tachikoma;if(!sheet)return false;
  const g=victoryGeometry(p,options);
  c.save();c.imageSmoothingEnabled=false;
  c.translate(g.x+g.bodyOffsetX,g.y+g.heave);c.rotate(g.tilt);c.scale(g.mirror,1);
  drawNativeBody(c,sheet,g,g.arms);c.restore();return true;
}
