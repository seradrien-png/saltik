import {btFinishHold} from './bt-finish-timing.js';
const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n);},lerp=(a,b,t)=>a+(b-a)*t;
// One choice per duel. All pose changes and holds read simulation time only.
export function btFinishVisual(q,{camera=0,cameraY=0,width=1280,height=720}={},nativeHeight){
 const variant=q.throwVariant;if(!Number.isInteger(variant)||!['throw','impact','slide','recover'].includes(q.phase))return null;
 const anchors=[[.48,.43],[.77,.33],[.24,.36],[.73,.27]],mirror=q.dir===-1;
 const [ax,ay]=anchors[variant]??anchors[0],crackX=width*(mirror?1-ax:ax),crackY=height*ay,h=height*(variant===3?.53:.66),scale=h/nativeHeight,foot=crackY+h*.5,dir=mirror?-1:1;
 const result={world:false,effort:0,dir,crackX,crackY,cracks:0,screen:null};
 const pose=(x,y,s,angle,frame)=>({x,y,scale:s,angle,alpha:1,frame,underside:variant===1});
 if(q.phase==='throw'){
  const u=smooth(q.elapsed/.48),arc=Math.sin(u*Math.PI);
  result.screen=pose(lerp(q.enemyX-camera,crackX,u)+(variant===3?-dir*100*arc:0),lerp(q.enemyY+cameraY,foot,u)-(variant===1?60:variant===3?110:30)*arc,lerp(1,scale,u),variant===1?-.35*arc:variant===3?dir*arc*1.3:-.18*dir*arc,variant===1?(u<.42?0:3):variant===3?(u<.5?4:5):u<.6?0:1);
 }else if(q.phase==='impact'){
  // The puzzled face is held, with no shaking during the comic beat.
  result.screen=pose(crackX,foot,scale,variant===1?-.12:variant===3?dir*.28:0,variant===1?3:1);result.cracks=variant===2||variant===3?0:1;
 }else if(q.phase==='slide'){
  const hold=btFinishHold(q),u=clamp((q.elapsed-hold)/(.95-hold)),fall=smooth(u);
  const frame=u===0?(variant===1?3:1):variant===1?3:variant===3?(Math.floor(u*6)%2?4:5):(Math.floor(u*7)%2?2:4);
  if(variant===3){const travel=smooth(u);result.screen=pose(crackX-dir*travel*width*1.65,foot-Math.sin(u*Math.PI)*height*.3+fall*height*.8,scale*(1-.38*travel),dir*(.28+travel*Math.PI*3),frame);}
  else result.screen=pose(crackX+dir*fall*(variant===1?-110:variant===2?18:65),foot+fall*(height+h),scale*(1-.08*fall),variant===1?-.12-fall*.75:variant===2?Math.sin(u*Math.PI*5)*.06:dir*fall*.24,frame);
  result.cracks=variant===2||variant===3?0:1-.25*fall;
 }else result.cracks=variant===2||variant===3?0:.75*(1-clamp(q.elapsed/.2));
 return result;
}
