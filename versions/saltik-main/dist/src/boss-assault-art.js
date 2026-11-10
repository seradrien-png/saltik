import {bossGeometry,bossFrenzied,bossCannonWarningProgress} from './boss-tank.js';
import {inkFlash} from './ink-actors.js';

// Transparent reference atlas: intact, pod destroyed, frenzy, permanent wreck.
// Cell anchors register the bottom of each tread chassis to the same ground.
export const BOSS_ASSAULT_FRAMES=Object.freeze([
 {sx:0,sy:0,anchor:[384,465]}, {sx:768,sy:0,anchor:[384,465]},
 {sx:0,sy:512,anchor:[384,477]}, {sx:768,sy:512,anchor:[384,480]},
]);
export function bossAssaultFrame(b){return b.hp<=0?3:bossFrenzied(b)?2:b.podDestroyed?1:0;}
const POD=[[508,34],[654,36],[722,75],[723,159],[655,205],[514,169]];
export function bossAssaultPodPose(b,{camera=0,breach=null}={}){
 const f=BOSS_ASSAULT_FRAMES[bossAssaultFrame(b)],x=b.x-camera-f.anchor[0]*.5,y=b.y-f.anchor[1]*.5;
 const pulling=breach?.kind==='pod'&&['qte','tear'].includes(breach.phase);
 const u=breach?.phase==='tear'?Math.max(0,Math.min(1,(breach.elapsed??0)/.42)):0,tear=u*u*(3-2*u);
 const effort=pulling&&breach.phase==='qte'&&(breach.effortsCompleted??0)<(breach.taps??0)?Math.sin(Math.PI*Math.min(1,(breach.effortElapsed??0)/.32)):0;
 const dx=-5*effort-16*tear,dy=7*effort-30*tear;
 return {x,y,dx,dy,pulling,box:{x:x+254+dx,y:y+17+dy,w:107,h:85.5}};
}
function podClip(c,x,y){c.beginPath();POD.forEach(([px,py],i)=>c[i?'lineTo':'moveTo'](x+px*.5,y+py*.5));c.closePath();c.clip();}
export function drawBossAssault(c,image,b,{camera=0,time=0,breach=null}={}){
 if(!b||!image)return false;
 const index=bossAssaultFrame(b),f=BOSS_ASSAULT_FRAMES[index],x=b.x-camera-f.anchor[0]*.5,y=b.y-f.anchor[1]*.5;
 c.save();
 if(b.hp>0&&b.hit>0)c.globalAlpha*=.8;
 const pose=bossAssaultPodPose(b,{camera,breach});
 if(pose.pulling&&!b.podDestroyed){
  // Replace the pocket underneath the gripped pod with its ruined reference.
  c.drawImage(image,768,0,768,512,x,y,384,256);
  c.save();c.beginPath();c.rect(x,y,384,256);POD.forEach(([px,py],i)=>c[i?'lineTo':'moveTo'](x+px*.5,y+py*.5));c.closePath();c.clip('evenodd');
  c.drawImage(image,f.sx,f.sy,768,512,x,y,384,256);c.restore();
  c.save();podClip(c,x+pose.dx,y+pose.dy);c.drawImage(image,0,0,768,512,x+pose.dx,y+pose.dy,384,256);c.restore();
 }else c.drawImage(image,f.sx,f.sy,768,512,x,y,384,256);
 // The supplied frenzy illustration has a broken pod. If it has not been
 // torn away in combat, restore its actual intact reference silhouette.
 if(index===2&&!b.podDestroyed&&!pose.pulling){
  c.save();podClip(c,x,y);c.drawImage(image,0,0,768,512,x,y,384,256);c.restore();
 }
 c.restore();
 if(b.hp<=0)return true;
 const g=bossGeometry(b),m={x:g.muzzle.x-camera,y:g.muzzle.y};
 if(b.cannonRecoil>.6)inkFlash(c,m,Math.PI,1.8);
 if(b.podFlash>0&&!b.podDestroyed)inkFlash(c,{x:g.podMuzzle.x-camera,y:g.podMuzzle.y},Math.PI,1.2);
 if(b.frontFlash>0){const p=g.frontMuzzles[b.frontGun??0];inkFlash(c,{x:p.x-camera,y:p.y},Math.PI,.7);}
 const warning=bossCannonWarningProgress(b);
 if(warning>0){
  c.save();c.globalAlpha=warning*.65;c.strokeStyle='#ffb15b';c.lineWidth=2;c.setLineDash([11,14]);
  c.beginPath();c.moveTo(m.x,m.y);c.lineTo(m.x-850,m.y+80);c.stroke();c.restore();
 }
 return true;
}
