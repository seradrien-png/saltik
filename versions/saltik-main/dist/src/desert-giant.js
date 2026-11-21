// A cosmetic passage, driven solely by the fixed simulation clock. Both atlas
// regions contain lower bones only: no upper leg, knee, pelvis, or body exists.
export const DESERT_GIANT_DURATION=8;
export const DESERT_GIANT_TRIGGER_X=2800;
const TAU=Math.PI*2;
const smooth=t=>t*t*(3-2*t);
export function advanceDesertGiant(g,dt){
 if(![4,5].includes(g.level)||!(g.redWastes??g.desert))return;
 const d=g.redWastes??g.desert,s=d.giant??(d.giant={triggered:false,elapsed:0,complete:false});
 if(!(dt>0)||!Number.isFinite(dt)||g.status!=='playing'||(d.phase??'outbound')!=='outbound'||g.introElapsed<g.introDuration||g.duel||g.carrierShutdown)return;
 if(!s.triggered&&g.player.x>=(g.level===5?9200:DESERT_GIANT_TRIGGER_X))s.triggered=true;
 if(!s.triggered||s.complete)return;
 const previous=s.elapsed;
 s.elapsed=Math.min(DESERT_GIANT_DURATION,s.elapsed+dt);
 // A foot lands at the wrap from its lifted swing to a planted stance.
 // Detect crossings, not rendering frames, to avoid duplicate or paused beats.
 for(const index of [0,1]){
  const offset=index*1.2;
  if(Math.floor((previous+offset+1e-8)/2.4)<Math.floor((s.elapsed+offset+1e-8)/2.4)){
   const landing=Math.round((s.elapsed+offset)/2.4)*2.4-offset;
   const foot=desertGiantPose(landing,{x:0,y:0,w:1,h:1})[index];
   const centre=foot.x+foot.footWidth*(g.level===5?1.4:1)*.24;
   if(centre>=-.08&&centre<=1.15){
    const strength=Math.max(.45,1-Math.abs(centre-.5)*.5)*(g.level===5?.48:1);
    g.shake=Math.max(g.shake??0,strength*3.5);
    g.events?.push({type:'desert-giant-step',x:g.player.x,y:g.groundAt?.(g.player.x)??g.player.y,index,strength,landing});
   }
  }
 }
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
 const state=g.redWastes??g.desert,s=state?.giant;if(!image||!s?.triggered||s.complete||!['outbound','entering'].includes(state.phase??'outbound'))return;
 c.save();c.beginPath();c.rect(box.x,box.y,box.w,box.h);c.clip();
 // Far leg first. Ground shadows contract as each foot rises and never follow
 // wall time, so pausing produces a pixel-identical articulated pose.
 for(const native of desertGiantPose(s.elapsed,box).reverse()){
  // The red desert uses a farther contact plane while retaining vast tibias.
  // Its native sand pass supplies the occlusion, without a foreground shadow.
  const size=g.level===5?1.4:1,p={...native,groundY:native.groundY-(g.level===5?box.h*.13:0),footWidth:native.footWidth*size,shinWidth:native.shinWidth*size};
  const k=p.footWidth/734,ankleY=p.groundY-p.lift-240*k;
  if(g.level!==5){c.fillStyle=p.index?'#752e20':'#63281d';c.beginPath();c.ellipse(p.x+p.footWidth*.24,p.groundY+2,p.footWidth*(.41-p.lift/box.h*.7),box.h*.009,0,0,TAU);c.fill();}
  // Seat the tibia inside the socket, with overlap hidden by the foot rim.
  // The shaft artwork has transparent padding and a concave ankle end.
  c.save();c.translate(p.x,ankleY);c.rotate(p.shinAngle);
  c.drawImage(image,145,0,280,1190,-p.shinWidth*.48,-p.shinHeight+80*k,p.shinWidth,p.shinHeight);c.restore();
  c.save();c.translate(p.x,ankleY);c.rotate(p.footAngle);
  c.drawImage(image,520,890,734,310,-170*k,-60*k,p.footWidth,310*k);c.restore();
 }
 c.restore();
}
