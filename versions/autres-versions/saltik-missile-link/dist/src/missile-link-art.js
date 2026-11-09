import {batterySpriteSize,missileBatteryGeometry} from './missile-battery.js';
export {batterySpriteSize} from './missile-battery.js';
import {ALLY_ROCK_ANCHOR,canyonProjection} from './canyon-placement.js';
import {BATTERY_START,linkIntroLine} from './missile-link.js';
import {terrainHeight} from './world.js';
import {tachikomaGeometry} from './tachikoma-pose.js';
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function batterySprite(team,pose='idle'){return {crop:[(pose==='fire'?2:0)*512,team==='enemy'?512:0,512,512],foot:500};}
export function batteryStage(g){const present=!!g.missileCompanion?.active;return {nearAlly:!present&&g.player.x<700,farAlly:!present&&g.maxX>=BATTERY_START&&g.player.x>=700};}
function shape(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
function ellipse(c,x,y,w,h,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,w,h,0,0,TAU);c.fill();}
export function drawBatteryNative(c,sheet,team,x,y,size,pose='idle',dead=false,time=0,parts=[],pass='all'){
  if(!sheet)return;const {crop,foot}=batterySprite(team,pose),k=size/512;
  c.save();c.imageSmoothingEnabled=true;
  if(dead)c.filter='grayscale(1) brightness(.55)';
  c.translate(x-size*.5,y-foot*k);c.scale(k,k);
  const draw=()=>c.drawImage(sheet,...crop,0,0,512,512);
  if(parts.length){
    if(pass!=='arms'){c.save();c.beginPath();c.rect(0,0,512,512);for(const part of parts){part.polygon.forEach(([xx,yy],i)=>i?c.lineTo(xx,yy):c.moveTo(xx,yy));c.closePath();}c.clip('evenodd');draw();c.restore();}
    if(pass!=='body')for(const part of parts){c.save();c.translate(...part.pivot);c.rotate(part.rotation);c.scale(part.stretch??1,part.stretch??1);c.translate(-part.pivot[0],-part.pivot[1]);shape(c,part.polygon);c.clip();draw();c.restore();}
  }else if(pose==='wave'&&team==='ally'){
    // Reuse one of the two native small hands. Remove it from the body before
    // rotating its own pixels; the generated wave cell had an extra arm.
    const hand=[[301,395],[324,390],[345,401],[359,419],[354,440],[339,451],[319,446],[304,430],[296,413]];
    c.save();c.beginPath();c.rect(0,0,512,512);hand.forEach(([xx,yy],i)=>i?c.lineTo(xx,yy):c.moveTo(xx,yy));c.closePath();c.clip('evenodd');draw();c.restore();
    c.save();c.translate(314,400);c.rotate(-.18-.16*Math.sin(time*8));c.translate(-314,-400);shape(c,hand);c.clip();draw();c.restore();
  }else draw();
  c.restore();
}
const sprite=drawBatteryNative;
// Called inside the original canyon tile transform, before every near layer.
export function drawBackgroundAlly(c,images,g,{width}={}){
  if(!g.missileLink||!batteryStage(g).farAlly)return false;
  const bg=canyonProjection(0,width),a=ALLY_ROCK_ANCHOR;
  c.save();c.scale(bg.scaleX,bg.scaleY);
  ellipse(c,a.x,a.y,10,1.2,'#203b3759');
  c.filter='saturate(1.12) contrast(1.08) brightness(1.10)';
  sprite(c,images['missile-batteries'],'ally',a.x,a.y,batterySpriteSize('ally',a.height));
  c.filter='none';
  if(g.missileLink.launchFlash>0)ellipse(c,a.x+8,a.y-18,1.8,1,'#edf7ba');
  c.restore();return true;
}
export function drawMissileBatteries(c,images,g,{camera=0,layer='near'}={}){
  if(!g.missileLink)return;const state=batteryStage(g),s=g.missileLink,sheet=images['missile-batteries'];
  if(layer==='near'){
    if(!state.nearAlly)return;
    const x=30-camera,y=terrainHeight(30),line=linkIntroLine(g),pose=s.launchFlash>0?'fire':line?.ally?'wave':'idle';
    ellipse(c,x,y,43,4,'#091c1a66');sprite(c,sheet,'ally',x,y,batterySpriteSize('ally'),pose,false,g.time);return;
  }
}

export function drawMissileBattery(c,images,e,{camera=0}={}){
  const geo=missileBatteryGeometry(e);
  c.save();c.translate(e.x-camera,e.y);c.rotate(geo.tilt);c.scale(geo.flip,1);
  if(e.hit>0)c.filter='brightness(1.5)';
  sprite(c,images['missile-batteries'],'enemy',0,0,geo.size,e.firePose>0?'fire':'idle');
  c.restore();
}
export function drawLinkFlights(c,g,{camera=0}={}){
  if(!g.missileLink||g.status==='won'||g.status==='dead')return;
  for(const f of g.missileLink.flights){
    if(f.life<=0)continue;const allied=f.team==='player',scale=allied?clamp(.3+f.age*.9,.3,1.1):.3+.7*clamp(f.age/f.duration,0,1);
    c.save();
    for(let i=1;i<f.trail.length;i++){c.strokeStyle=allied?`rgba(203,226,172,${i/f.trail.length*.45})`:`rgba(217,167,139,${i/f.trail.length*.42})`;c.lineWidth=(1+i/f.trail.length*2.8)*scale;c.beginPath();c.moveTo(f.trail[i-1].x-camera,f.trail[i-1].y);c.lineTo(f.trail[i].x-camera,f.trail[i].y);c.stroke();}
    c.translate(f.x-camera,f.y);c.rotate(Math.atan2(f.vy,f.vx));c.scale(scale,scale);
    shape(c,[[-12,-3],[7,-3],[14,0],[7,3],[-12,3]]);c.fillStyle='#d7dbd1';c.fill();
    shape(c,[[6,-3],[14,0],[6,3]]);c.fillStyle=allied?'#b4ee43':'#ed6456';c.fill();
    c.fillStyle=allied?'#3980a5':'#263342';c.fillRect(-11,-5,5,2);c.fillRect(-11,3,5,2);c.fillRect(-4,-3,2,6);
    shape(c,[[-12,-2],[-23-Math.sin(g.time*51+f.index)*3,0],[-12,2]]);c.fillStyle='#f6b66b';c.fill();c.fillStyle='#fff4cc';c.fillRect(-16,-1,6,2);c.restore();
  }
}
export function drawMissileLinkOverlay(c,g,{camera=0}={}){
  const s=g.missileLink;if(!s||(!s.aiming&&s.laserFlash<=0)||!s.aim)return {laser:false};
  const origin=tachikomaGeometry(g.player,g.time,{camera}).arm,x=s.aim.x-camera,y=s.aim.y;
  c.save();c.strokeStyle='#baf277';c.shadowColor='#a4f36c';c.shadowBlur=5;c.lineWidth=1.2;c.globalAlpha=s.aiming?.85:clamp(s.laserFlash/.85,0,.8);
  c.beginPath();c.moveTo(origin.x,origin.y);c.lineTo(x,y);c.stroke();
  c.shadowBlur=0;c.lineWidth=1.5;c.beginPath();c.arc(x,y,s.lock?.type==='point'?12:17,0,TAU);c.stroke();
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){c.beginPath();c.moveTo(x+dx*10,y+dy*10);c.lineTo(x+dx*23,y+dy*23);c.stroke();}
  c.restore();return {laser:true,origin,endpoint:{x,y}};
}
