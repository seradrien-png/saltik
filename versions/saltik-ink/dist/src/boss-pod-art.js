import {bossGeometry} from './boss-tank.js';

// The native sheet is three 512px cells per row. The lower middle cells
// include Saltik and belong to the assault painter, not the tank painter.
const CELL=512;
const SCALE=.25;
const SOLO_ANCHOR=[256,488];
const FIRING_ANCHOR=[331,488];
const SOCKET_CROP=[1140,720,396,304],SOCKET_ANCHOR=[187,259];

export function bossPodVisual(boss,{camera=0,breach=null}={}){
  if(!boss)return null;
  if(breach?.kind==='pod'&&['qte','fire','tear'].includes(breach.phase))return null;
  const raise=Math.max(0,Math.min(1,boss.podRaise||0));
  const ruined=boss.podDestroyed||boss.podPhase==='destroyed';
  let frame=ruined?5:0;
  if(!ruined&&boss.podPhase==='firing'&&boss.podFlash>0)frame=2;
  else if(!ruined&&raise>0)frame=1;
  const mount=bossGeometry(boss).podMount;
  return {frame,crop:frame===5?SOCKET_CROP:[frame%3*CELL,Math.floor(frame/3)*CELL,CELL,CELL],
    anchor:frame===5?SOCKET_ANCHOR:frame===2?FIRING_ANCHOR:SOLO_ANCHOR,
    x:mount.x-camera,y:mount.y,scale:SCALE,raise};
}

export function drawBossPod(c,images,boss,options={}){
  const sheet=images['boss-pod'],v=bossPodVisual(boss,options);
  if(!sheet||!v)return false;
  const [sx,sy,w,h]=v.crop,[ax,ay]=v.anchor;
  c.save();c.translate(v.x,v.y);c.scale(v.scale,v.scale);c.imageSmoothingEnabled=true;
  if(v.frame===1&&v.raise<1){
    // The mount remains bolted to the turret while the painted launcher box
    // climbs on its native hydraulic struts. Only the strut crop is stretched.
    const strutTop=250,strutBottom=445,boxBottom=270,footTop=440;
    const strutH=(strutBottom-strutTop)*v.raise;
    c.drawImage(sheet,CELL,strutTop,CELL,strutBottom-strutTop,
      -ax,strutBottom-strutH-ay,CELL,strutH);
    c.drawImage(sheet,CELL,0,CELL,boxBottom,
      -ax,175*(1-v.raise)-ay,CELL,boxBottom);
    c.drawImage(sheet,0,footTop,CELL,CELL-footTop,
      -ax,footTop-ay,CELL,CELL-footTop);
  }else c.drawImage(sheet,sx,sy,w,h,-ax,-ay,w,h);
  c.restore();
  return true;
}
