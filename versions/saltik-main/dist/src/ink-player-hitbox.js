import {nativeTurnView} from './character-turns.js';
import {NATIVE_TURN_HITBOXES} from './native-turn-hitboxes.js';
import {inkSaltikGeometry} from './ink-saltik.js';
import {jumpLegPoint} from './jump-leg-pose.js';

const corners=([x,y,w,h])=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
function bounds(points){
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);
 return{x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};
}
function rotate([x,y],pivot,angle=0){
 const dx=x-pivot[0],dy=y-pivot[1],co=Math.cos(angle),si=Math.sin(angle);
 return[pivot[0]+dx*co-dy*si,pivot[1]+dx*si+dy*co];
}
function limbs(rects,legs,point){
 for(const leg of legs){
  const transform=q=>point(jumpLegPoint(leg.jumpPose??{angle:0},q));
  const strut=leg.strut??leg.strutPolygon,wheel=leg.wheel??leg.wheelPolygon;
  if(strut)rects.push(bounds(strut.map(([x,y])=>transform([x+(y-leg.hinge)*leg.roll/(leg.wheelTop-leg.hinge),leg.hinge+(y-leg.hinge)*leg.stretch]))));
  if(wheel)rects.push(bounds(wheel.map(([x,y])=>transform([x+leg.roll,y+leg.offset]))));
 }
}

function nativeTurnHitboxes(p){
 const view=nativeTurnView(p),parts=view&&NATIVE_TURN_HITBOXES[view.model]?.[view.index]?.[p.crouching?'crouching':'standing'];
 if(!parts)return null;
 const scale=(p.artScale??1)*(p.evasion?.active ? .92 : 1),k=view.targetHeight/view.height*scale;
 const angle=p.supportPose?.tilt??0,co=Math.cos(angle),si=Math.sin(angle),[ax,ay]=view.anchor;
 const point=([x,y])=>{
  const xx=(x-ax)*k,yy=(y-ay)*k;
  return{x:p.x+xx*co-yy*si,y:p.y+xx*si+yy*co};
 };
 return parts.map(part=>bounds(corners(part).map(point)));
}

// Separate cabin and articulated parts leave the transparent gaps between
// raised launchers and above the wheels open. All transforms are the same
// world-space transforms used to draw the native rig; no camera enters here.
export function inkPlayerHitboxes(p,time=0){
 const turn=nativeTurnHitboxes(p);if(turn)return turn;
 const q=inkSaltikGeometry(p,{time,scale:p.evasion?.active ? .92 : 1}),rects=[];
 if(q.modern||q.gatlingGuns){
  const point=q.nativePoint,profile=q.modernProfile??q.nativeProfile;
  // Cabin extents measured in each native illustration, excluding the
  // surrounding transparent atlas margins and separately articulated parts.
  const cabin=q.modern?(profile.id==='desert-striker'?[340,350,840,455]:[180,250,460,285]):(profile.key?[135,275,430,160]:[410,460,810,300]);
  rects.push(bounds(corners(cabin).map(point)));
  const guns=q.modernGuns??q.gatlingGuns;
  for(const gun of guns)rects.push(bounds(gun.polygon.map(gun.point)));
  for(const arm of q.modernArms??q.nativeArms)rects.push(bounds(arm.polygon.map(arm.handPoint)));
  limbs(rects,q.modernLegs??q.nativeLegs,point);
  const rockets=profile.rockets,radius=profile.rocketRadius??(profile.id==='desert-striker'?[29,31]:q.modern?[12,13]:[21,23]);
  for(const [x,y]of rockets)rects.push(bounds(corners([x-radius[0],y-radius[1],radius[0]*2,radius[1]*2]).map(point)));
  return rects;
 }
 if(q.btNative){
  const n=q.btNative;
  rects.push(bounds(corners(n.frame.body).map(n.sourcePoint)));
  if(n.view==='side'){
   rects.push(bounds(n.cannonPart.polygon.map(n.cannonPoint)));
   for(const [i,pod]of n.podParts.entries())rects.push(bounds(pod.polygon.map(point=>n.podSourcePoint(point,i))));
   for(const arm of n.arms)rects.push(bounds(arm.polygon.map(point=>n.sourcePoint(rotate(point,arm.pivot,arm.rotation)))));
   limbs(rects,n.legs,n.sourcePoint);
  }else for(const pod of n.podSlots)rects.push({x:pod.muzzle.x-pod.rx*n.k,y:pod.muzzle.y-pod.ry*n.k,w:pod.rx*n.k*2,h:pod.ry*n.k*2});
  return rects;
 }
 return[q.bounds];
}
