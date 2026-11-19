// A cosmetic passage, driven solely by the fixed simulation clock. Both atlas
// regions contain lower bones only: no upper leg, knee, pelvis, or body exists.
export const DESERT_GIANT_DURATION=8;
export const DESERT_GIANT_TRIGGER_X=2800;
const TAU=Math.PI*2;
const smooth=t=>t*t*(3-2*t);
export function advanceDesertGiant(g,dt){
 if(g.level!==4||!g.desert)return;
 const d=g.desert,s=d.giant??(d.giant={triggered:false,elapsed:0,complete:false});
 if(!(dt>0)||!Number.isFinite(dt)||g.status!=='playing'||d.phase!=='outbound'||g.introElapsed<g.introDuration||g.duel||g.carrierShutdown)return;
 if(!s.triggered&&g.player.x>=DESERT_GIANT_TRIGGER_X)s.triggered=true;
 if(!s.triggered||s.complete)return;
 s.elapsed=Math.min(DESERT_GIANT_DURATION,s.elapsed+dt);
 if(s.elapsed>=DESERT_GIANT_DURATION-1e-8){s.elapsed=DESERT_GIANT_DURATION;s.complete=true;}
}
// A stance occupies half a 2.4s stride and has a genuinely fixed world contact.
// During the other half the foot travels to its next contact on a smooth arc.
// The second leg is half a stride ahead, so one foot supports each slow step.
export function desertGiantPose(elapsed,box){
 const stride=2.4,stance=stride/2,speed=box.w*.23,start=box.x-box.w*.35;
 return [0,1].map(index=>{
  const offset=index*stance,t=elapsed+offset,cycle=Math.floor(t/stride),phase=t-cycle*stride;
  const swing=phase>=stance,u=swing?(phase-stance)/stance:0;
  const lift=swing?Math.sin(Math.PI*u)**2*box.h*.16:0;
  return {index,x:start+speed*(cycle*stride-offset+stride*smooth(u)),groundY:box.y+box.h*(.82-index*.018),lift,
   footAngle:swing?-.24*Math.sin(TAU*u):0,shinAngle:swing?.055*Math.sin(TAU*u):-.012,
   footWidth:box.w*(index?.225:.24),shinHeight:box.h*3,shinWidth:box.w*(index?.077:.082),contact:!swing};
 });
}
export function drawDesertGiant(c,image,g,{box}){
 const s=g.desert?.giant;if(!image||!s?.triggered||s.complete||!['outbound','entering'].includes(g.desert.phase))return;
 c.save();c.beginPath();c.rect(box.x,box.y,box.w,box.h);c.clip();
 // Far leg first. Ground shadows contract as each foot rises and never follow
 // wall time, so pausing produces a pixel-identical articulated pose.
 for(const p of desertGiantPose(s.elapsed,box).reverse()){
  const k=p.footWidth/734,ankleY=p.groundY-p.lift-240*k;
  c.fillStyle=p.index?'#752e20':'#63281d';c.beginPath();c.ellipse(p.x+p.footWidth*.24,p.groundY+2,p.footWidth*(.41-p.lift/box.h*.7),box.h*.009,0,0,TAU);c.fill();
  // Seat the tibia inside the socket, with overlap hidden by the foot rim.
  // The shaft artwork has transparent padding and a concave ankle end.
  c.save();c.translate(p.x,ankleY);c.rotate(p.shinAngle);
  c.drawImage(image,145,0,280,1190,-p.shinWidth*.48,-p.shinHeight+80*k,p.shinWidth,p.shinHeight);c.restore();
  c.save();c.translate(p.x,ankleY);c.rotate(p.footAngle);
  c.drawImage(image,520,890,734,310,-170*k,-60*k,p.footWidth,310*k);c.restore();
 }
 c.restore();
}
