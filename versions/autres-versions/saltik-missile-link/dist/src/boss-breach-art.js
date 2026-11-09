import {drawBossPod} from './boss-pod-art.js';
import {bossGeometry} from './boss-tank.js';

// Native painted pairs. Tracks are measured separately in every cell; source
// rows have different empty gutters, never different physical floor heights.
const FRAMES=[
  {crop:[0,0,512,512],anchor:[265,494]},
  {crop:[512,0,512,512],anchor:[260,494]},
  {crop:[1024,0,512,512],anchor:[255,494]},
  {crop:[0,512,512,512],anchor:[265,434]},
  {crop:[512,512,512,512],anchor:[260,434]},
  {crop:[1024,512,512,512],anchor:[255,434]},
];
const SCALE=370/498;
const CELL=512,FIRE_SCALE=.25,POD_SCALE=.25;
const FIRE_FEET_Y=[456,456,456,458,447,457];
const POD_PAIR={
  3:{crop:[0,512,578,512],anchor:[182,466]},
  4:{crop:[580,512,532,512],anchor:[160,466]},
};
const IMPACT={x:132,y:291,w:94,h:69,anchor:[265,434]};
export function bossBreachVisual(breach,boss,{camera=0}={}){
  if(!breach||!boss)return null;
  const kind=breach.kind||'hull';
  let frame;
  if(breach.phase==='qte'){
    const pulling=(breach.effortsCompleted??0)<(breach.taps??0);
    const effort=pulling?Math.sin(Math.PI*(breach.effortElapsed??0)/.32):0;
    frame=effort>.35?1:0;
  }else if(breach.phase==='tear')frame=2;
  else if(breach.phase==='fire')frame=3;
  else return null;
  if(kind==='pod'){
    frame=frame===0?3:4;
    const access=bossGeometry(boss).access;
    return {frame,sheet:'boss-pod',paintsTank:false,
      ...POD_PAIR[frame],
      x:access.x-camera,y:access.y,scale:POD_SCALE};
  }
  if(breach.phase==='fire'){
    const shots=Math.max(0,Math.min(6,breach.shotsFired||0));
    const since=shots?(breach.elapsed||0)-(.1+(shots-1)*.2):Infinity;
    frame=shots?(since<.07?[1,3,5][(shots-1)%3]:[2,4,0][(shots-1)%3]):0;
    const brace=Math.max(0,Math.min(1,(breach.elapsed||0)/.1));
    return {frame,sheet:'saltik-breach-fire',paintsTank:false,
      crop:[frame%3*CELL,Math.floor(frame/3)*CELL,CELL,CELL],anchor:[256,FIRE_FEET_Y[frame]],
      x:boss.x-camera-85+35*brace,y:boss.y-85,scale:FIRE_SCALE};
  }
  return {frame,sheet:'boss-assault',paintsTank:true,
    ...FRAMES[frame],x:boss.x-camera+8,y:boss.y-7,scale:SCALE};
}
export function drawBossBreach(c,images,breach,boss,options={}){
  const v=bossBreachVisual(breach,boss,options),sheet=images[v?.sheet];
  if(!v||!sheet)return false;
  const [x,y,w,h]=v.crop,[ax,ay]=v.anchor;
  c.save();c.translate(v.x,v.y);c.scale(v.scale,v.scale);c.imageSmoothingEnabled=true;
  c.drawImage(sheet,x,y,w,h,-ax,-ay,w,h);c.restore();
  if(breach.kind==='hull'&&breach.phase==='fire'&&v.frame%2===1&&images['boss-assault']){
    const p=IMPACT,[ix,iy]=p.anchor;
    c.drawImage(images['boss-assault'],p.x,CELL+p.y,p.w,p.h,
      boss.x-(options.camera||0)+8+(p.x-ix)*SCALE+7,boss.y-7+(p.y-iy)*SCALE+10,
      p.w*SCALE,p.h*SCALE);
  }
  if(breach.kind==='pod'&&breach.phase==='qte'&&(breach.elapsed??Infinity)<.12&&images['boss-assault']){
    const p=IMPACT;
    c.drawImage(images['boss-assault'],p.x,CELL+p.y,p.w,p.h,
      boss.x-(options.camera||0)+40,boss.y-215,p.w*SCALE,p.h*SCALE);
  }
  if(v.paintsTank)drawBossPod(c,images,boss,options);
  return true;
}
export function drawBreachedTank(c,images,boss,{camera=0,breach=null}={}){
  const sheet=images['boss-assault'];if(!sheet)return false;
  const [sx,sy,w,h]=FRAMES[5].crop,[ax,ay]=FRAMES[5].anchor;
  const x=boss.x-camera+8,y=boss.y-7,split=ay-85/SCALE;
  // The lower chassis always remains on the shared floor. The tank's own
  // painted upper layer sweeps its cannon to release the physical actor.
  c.save();c.translate(x,y);c.scale(SCALE,SCALE);c.imageSmoothingEnabled=true;
  c.drawImage(sheet,sx,sy+split,w,h-split,-ax,split-ay,w,h-split);
  c.save();
  const eject=breach?.phase==='eject';
  const angle=eject?-.28*Math.sin(Math.PI*Math.min(1,breach.elapsed/.4)):0;
  c.translate(35/SCALE,-96/SCALE);c.rotate(angle);c.scale(Math.cos(boss.turretSpin||0),1);c.translate(-35/SCALE,96/SCALE);
  const recoil=Math.max(0,Math.min(1,boss.cannonRecoil||0));
  if(recoil>0){
    const barrelX=0,barrelY=175,barrelW=212,barrelH=95;
    c.drawImage(sheet,sx,sy,w,barrelY,-ax,-ay,w,barrelY);
    c.drawImage(sheet,sx,sy+barrelY+barrelH,w,split-barrelY-barrelH,
      -ax,barrelY+barrelH-ay,w,split-barrelY-barrelH);
    c.drawImage(sheet,sx+barrelX,sy+barrelY,barrelW,barrelH,
      barrelX-ax+13*recoil/SCALE,barrelY-ay,barrelW,barrelH);
    c.drawImage(sheet,sx+barrelW,sy+barrelY,w-barrelW,barrelH,
      barrelW-ax,barrelY-ay,w-barrelW,barrelH);
  }else c.drawImage(sheet,sx,sy,w,split,-ax,-ay,w,split);
  c.restore();c.restore();return true;
}
