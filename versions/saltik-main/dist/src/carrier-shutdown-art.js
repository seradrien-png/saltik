import {inkSaltikGeometry,drawInkSaltik,INK_SALTIK_PARTS,INK_SALTIK_CROP,INK_SALTIK_ANCHOR} from './ink-saltik.js';
import {carrierShutdownPlacement,inkCarrierGeometry} from './ink-carrier.js';
import {CARRIER_SHUTDOWN_PHASE_SECONDS} from './carrier-shutdown.js';
import {nativeReach,drawGripArm} from './ink-encounters.js';
const HANDS=[[870,1030],[1086,1007]],clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
const polygon=(c,points)=>{c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();};
export function carrierShutdownGeometry(q,e,{camera=0,time=0,player={}}={}){
 if(!q||!e)return null;
 const placement=carrierShutdownPlacement(e),p={...player,x:player.x??q.x??placement.x,y:player.y??q.y??placement.y,dir:q.dir??placement.dir,turn:null,onGround:q.phase!=='approach',supportPose:q.phase==='approach'?null:player.supportPose,tilt:player.tilt??0,motionLean:0,motionHeave:0,vx:0,vy:0,muzzle:0,mirvFlash:0,cannonElevation:0,cannonRecoil:0,turretLift:0,crouching:false,invulnerable:0,melee:null,evasion:null,deflect:null};
 const geo=inkSaltikGeometry(p,{camera,time:0}),carrier=inkCarrierGeometry(e,time,{camera}),port={x:(q.port??placement.port).x-camera,y:(q.port??placement.port).y};
 const elapsed=Number.isFinite(q.elapsed)?q.elapsed:0,settling=q.phase==='settle',unplugging=q.phase==='unplug',progress=unplugging?clamp(elapsed/CARRIER_SHUTDOWN_PHASE_SECONDS.unplug):settling?1:0;
 const coverOpen=settling?1:unplugging?smooth(elapsed/.32):0;
 const grip=settling?1:unplugging?smooth((elapsed-.27)/.15):0;
 const extraction=settling?1:unplugging?smooth((elapsed-.60)/.45):0;
 const activeHand=1,rest=geo.sourcePoint(HANDS[activeHand]),reach=unplugging?smooth(elapsed/.24):settling?1:0;
 const final={x:port.x-geo.orientation*extraction*7,y:port.y+extraction*(settling?3+smooth(elapsed/.6)*3:1.5)};
 // The first short reach lifts the cover, then the same original claw takes
 // the connector and draws it seven world units out along the service lead.
 const target={x:rest.x+(final.x-rest.x)*reach,y:rest.y+(final.y-rest.y)*reach};
 const arms=geo.arms.map((part,i)=>i===activeHand&&q.phase!=='approach'?nativeReach(part,HANDS[i],target,geo,i):{...part,wristY:i?936:957,stretchY:i?880:885,k:geo.k,extension:0,handPoint:point=>geo.sourcePoint(point)});
 const handPoints=arms.map((a,i)=>a.handPoint(HANDS[i]));
 return {player:p,geo,carrier,arms,activeHand,handPoints,connector:handPoints[activeHand],port,target,progress,coverOpen,grip,extraction};
}
function drawServiceCover(c,g){
 const {port,carrier,coverOpen,connector,grip,extraction}=g;
 c.save();c.translate(port.x,port.y);c.rotate(carrier.tilt);c.scale(carrier.flip,1);
 // Replace the closed painted access face with a dark recessed socket; its
 // little ivory lid hinges upward instead of a giant new arm appearing.
 c.fillStyle='#1c2930';c.strokeStyle='#172027';c.lineWidth=.8;c.beginPath();c.rect(-3.5,-2.8,7,5.6);c.fill();c.stroke();
 c.fillStyle='#8c9d9c';c.beginPath();c.rect(-1.3,-1.5,2.6,3);c.fill();
 c.save();c.translate(-3.5,-2.8);c.rotate(-coverOpen*1.9);c.fillStyle='#ddd0b1';c.strokeStyle='#172027';c.lineWidth=.7;c.beginPath();c.rect(0,0,7,5.6);c.fill();c.stroke();c.restore();c.restore();
 if(grip>.2){
  const end=extraction>0?connector:port;c.save();c.strokeStyle='#15232a';c.lineWidth=1.8;c.lineCap='round';c.beginPath();c.moveTo(port.x,port.y);c.lineTo(end.x,end.y);c.stroke();
  c.strokeStyle='#8ca5a0';c.lineWidth=.6;c.stroke();c.translate(end.x,end.y);c.rotate(carrier.tilt);c.fillStyle='#d9d0b7';c.strokeStyle='#16242b';c.lineWidth=.7;c.beginPath();c.rect(-1.7,-1.1,3.4,2.2);c.fill();c.stroke();c.restore();
 }
}
export function drawCarrierShutdown(c,images,q,e,options={}){
 const g=carrierShutdownGeometry(q,e,options),image=images['ink-saltik'];if(!g||!image)return false;
 if(q.phase!=='approach')drawServiceCover(c,g);
 if(g.player.character==='gatling'){
  const targets=[null,{x:g.connector.x+(options.camera??0),y:g.connector.y}];
  drawInkSaltik(c,image,{...g.player,gatlingInteraction:true,gatlingGripTargets:q.phase==='approach'?null:targets},{...options,time:0});return true;
 }
 const {geo,arms}=g,part=INK_SALTIK_PARTS.arms[1];
 // Remove the small resting native hand before drawing its rigid moving claw.
 c.save();c.beginPath();c.rect(-100000,-100000,200000,200000);polygon(c,part.polygon.map(geo.sourcePoint).map(p=>[p.x,p.y]));c.clip('evenodd');drawInkSaltik(c,image,g.player,{...options,time:0,turnImage:null});c.restore();
 c.save();c.translate(geo.x,geo.y+geo.heave+geo.bodyDrop);c.rotate(geo.tilt);c.scale(geo.k*geo.orientation,geo.k);c.translate(-INK_SALTIK_ANCHOR[0],-INK_SALTIK_ANCHOR[1]);
 drawGripArm(c,image,INK_SALTIK_CROP,arms[1]);c.restore();
 return true;
}
