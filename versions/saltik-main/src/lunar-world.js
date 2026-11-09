import {lunarGroundAt} from './lunar-level.js';
import {LUNAR_SITES,LUNAR_CELLS,lunarPaintedBounds,paintLunarCutout,paintLunarStair} from './lunar-landmarks.js';
const INK='#353b39',GOLD='#cda35f',TAU=Math.PI*2;
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
function path(c,pts,fill,stroke=INK,lineWidth=1){
 c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();
 if(stroke){c.strokeStyle=stroke;c.lineWidth=lineWidth;c.stroke();}
}
export function drawLunarBackdrop(c,{camera,width,height,time,image,art,layers}){
 c.fillStyle='#77818a';c.fillRect(0,0,width,height);
 if(image){const h=Math.max(height,width*image.height/image.width),w=h*image.width/image.height;c.drawImage(image,(width-w)/2-camera*.004,0,w+100,h);}
 // The former flat background is reconstructed from independent painted
 // silhouettes. Transparent openings reveal the moon and cloud plate.
 if(layers)for(const layer of [
  {crop:[0,0,880,819],rate:.075,step:3100,w:850,top:.035,alpha:.65,offset:-80},
  {crop:[920,0,1001,819],rate:.135,step:2300,w:1120,top:.10,alpha:.84,offset:620},
 ]){
  const first=Math.floor((camera*layer.rate-layer.offset)/layer.step)-1;
  for(let i=first;i<first+Math.ceil(width/layer.step)+3;i++){
   const x=i*layer.step+layer.offset-camera*layer.rate,h=layer.w*layer.crop[3]/layer.crop[2];
   if(x+layer.w<0||x>width)continue;c.save();c.globalAlpha=layer.alpha;
   c.drawImage(layers,...layer.crop,x,height*layer.top,layer.w,h);c.restore();
  }
 }
 // Nearer city districts have their own illustration, silhouette and speed.
 // No single flat wash separates the walker from the world.
 for(const layer of [{rate:.20,step:1600,w:1080,base:1.02,alpha:.42},{rate:.47,step:1900,w:1350,base:1.20,alpha:.72}]){
  const first=Math.floor(camera*layer.rate/layer.step)-1;
  for(let i=first;i<first+Math.ceil(width/layer.step)+3;i++){
   const kind=['aqueduct','observatory','bastion','gate'][((i%4)+4)%4],cell=LUNAR_CELLS[kind],h=layer.w*cell.crop[3]/cell.crop[2];
   paintLunarCutout(c,art,kind,{x:i*layer.step-camera*layer.rate,y:height*layer.base-h,w:layer.w,h,alpha:layer.alpha});
  }
 }
 c.save();c.globalAlpha=.07;c.fillStyle='#fff1d9';
 for(let i=-1;i<5;i++){const x=i*520-camera*.09%520;c.beginPath();c.ellipse(x,height*.82+Math.sin(i)*28,360,33,0,0,TAU);c.fill();}c.restore();
}
function ground(c,{camera,width,texture}){
 const left=Math.floor((camera-100)/20)*20,right=camera+width+120,points=[];
 for(let x=left;x<=right;x+=20)points.push([x-camera,lunarGroundAt(x)]);
 const bottom=1320;
 c.save();c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.lineTo(right-camera,bottom);c.lineTo(left-camera,bottom);c.closePath();
 c.fillStyle='#b18a55';c.fill();c.clip();
 if(texture){
  const tileW=460,tileH=tileW*texture.height/texture.width,top=Math.min(...points.map(p=>p[1]));
  for(let x=Math.floor(left/tileW)*tileW;x<right;x+=tileW)for(let y=Math.floor(top/tileH)*tileH;y<bottom;y+=tileH)c.drawImage(texture,x-camera,y,tileW,tileH);
 }
 // Deep beveled strata, chips and irregular cut faces, anchored in world space.
 for(let x=Math.floor(left/120)*120;x<right;x+=120){
  const y=lunarGroundAt(x),seed=Math.floor(x/120);
  path(c,[[x-camera-70,y+23],[x-camera+16,y+17],[x-camera+73,y+95],[x-camera+21,y+178],[x-camera-72,y+133]],seed%2?'#be90501c':'#694d2e20',null);
  c.strokeStyle='#7d5b3d66';c.lineWidth=1;c.beginPath();c.moveTo(x-camera+15,y+44);c.lineTo(x-camera+7,y+78);c.lineTo(x-camera+22,y+104);c.lineTo(x-camera+14,y+141);c.stroke();
  for(let j=0;j<8;j++){const xx=x-camera+hash(seed*33+j)*110-55,yy=y+35+hash(j*19+seed)*180;c.strokeStyle=j%3?'#77553444':'#f6ddb466';c.beginPath();c.moveTo(xx,yy);c.lineTo(xx-4,yy+7);c.stroke();}
 }
 c.restore();
 c.strokeStyle='#705333';c.lineWidth=2;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
 c.strokeStyle='#e8c890';c.lineWidth=3;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y+3):c.moveTo(x,y+3));c.stroke();
}
function plantedRuins(c,art,{camera,width}){
 for(const [i,x] of [340,2860,4870,10240,13600,16100].entries()){
  const kind=i%2?'bastion':'observatory',cell=LUNAR_CELLS[kind],w=880+(i%2)*160,h=w*cell.crop[3]/cell.crop[2];if(x<camera-w||x>camera+width+w)continue;
  // Register the actual painted foot rather than an arbitrary 86% of height.
  paintLunarCutout(c,art,kind,{x:x-camera-w*.5,y:lunarGroundAt(x)-h*(cell.foot??475)/cell.crop[3],w,h});
 }
}
export function drawLunarWorld(c,g,{camera,width,time,texture,art}){
 plantedRuins(c,art,{camera,width});
 ground(c,{camera,width,texture});
 for(const site of LUNAR_SITES){
  const b=lunarPaintedBounds(site);if(b.x+b.w<camera-100||b.x>camera+width+100)continue;
  paintLunarCutout(c,art,site.kind,{x:b.x-camera,y:b.y,w:b.w,h:b.h});
  const route=g.platforms.find(p=>p.id===site.id);if(route)for(const entry of route.walkableEntries??[])if(!entry.nativeArt)paintLunarStair(c,art,entry,camera);
 }
 const l=g.lunar,x=l.portalX-camera,y=lunarGroundAt(l.portalX);
 if(x>-1000&&x<width+1000){
  // The illustrated gate's real stone threshold sits on native ground.
  const w=1600,h=w*512/768;
  paintLunarCutout(c,art,'gate',{x:x-w*.5,y:y-h*300/512,w,h});
  c.save();c.globalAlpha=l.phase==='open'?.7:.12+l.wave*.1;c.fillStyle='#ffe5a5';
  c.beginPath();c.ellipse(x+5,y-365,48+Math.sin(time*2)*3,51,0,0,TAU);c.fill();
  for(let i=0;i<3;i++){c.fillStyle=i<l.wave?GOLD:'#6a7267';c.beginPath();c.arc(x-27+i*27,y-310,6,0,TAU);c.fill();}c.restore();
 }
}
export function drawLunarForeground(c,{camera,width,time,art}){
 // Closest plane: cropped native foundation rocks, never a veil over actors.
 const rate=1.09,step=1550,first=Math.floor(camera*rate/step)-1;
 for(let i=first;i<first+Math.ceil(width/step)+3;i++){
  const wx=i*step,x=wx-camera*rate,y=lunarGroundAt(wx)+210;
  if(!art)continue;c.save();c.globalAlpha=.97;
  paintLunarCutout(c,art,'bastion',{x,y,w:900,h:600});c.restore();
 }
}
