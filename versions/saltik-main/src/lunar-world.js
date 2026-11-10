import {lunarGroundAt} from './lunar-level.js';
import {LUNAR_SITES,LUNAR_PORTAL,lunarPaintedBounds,paintLunarCutout} from './lunar-landmarks.js';
const INK='#353b39',GOLD='#cda35f',TAU=Math.PI*2;
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
function path(c,pts,fill,stroke=INK,lineWidth=1){
 c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();
 if(stroke){c.strokeStyle=stroke;c.lineWidth=lineWidth;c.stroke();}
}
export function drawLunarBackdrop(c,{camera,width,height,time,image,art,layers}){
 c.fillStyle='#77818a';c.fillRect(0,0,width,height);
 if(image){const h=Math.max(height,width*image.height/image.width),w=h*image.width/image.height;c.drawImage(image,(width-w)/2-camera*.004,0,w+100,h);}
 // A single fully opaque painting establishes the coherent distant world.
 // One small nearer island group adds parallax below/right of the clear face.
 if(layers){
  const h=height*.27,w=h*1001/819,x=width*.83-camera*.012;
  c.drawImage(layers,920,0,1001,819,x,height*.65,w,h);
 }
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
export function drawLunarWorld(c,g,{camera,width,time,texture,art}){
 ground(c,{camera,width,texture});
 for(const site of LUNAR_SITES){
  const b=lunarPaintedBounds(site);if(b.x+b.w<camera-100||b.x>camera+width+100)continue;
  paintLunarCutout(c,art,site.kind,{x:b.x-camera,y:b.y,w:b.w,h:b.h});
 }
 const l=g.lunar,x=l.portalX-camera,y=LUNAR_PORTAL.top+300*LUNAR_PORTAL.scale;
 if(x>-1000&&x<width+1000){
  c.save();c.globalAlpha=l.phase==='open'?.7:.12+l.wave*.1;c.fillStyle='#ffe5a5';
  c.beginPath();c.ellipse(x+16,y-323,43+Math.sin(time*2)*3,43,0,0,TAU);c.fill();
  for(let i=0;i<3;i++){c.fillStyle=i<l.wave?GOLD:'#6a7267';c.beginPath();c.arc(x-27+i*27,y-310,6,0,TAU);c.fill();}c.restore();
 }
}
export function drawLunarForeground(c,{camera,width,time}){
 // Low rooted plants frame the player. No decorative building pretends to
 // offer an unusable staircase or platform in the physical foreground.
 const rate=1.04,step=420,first=Math.floor(camera*rate/step)-1;
 for(let i=first;i<first+Math.ceil(width/step)+3;i++){
  const x=i*step-camera*rate,world=x+camera,y=lunarGroundAt(world)+25;
  if(x<-70||x>width+70)continue;
  c.save();c.strokeStyle='#735737';c.lineWidth=1.4;c.beginPath();c.moveTo(x,y+11);c.quadraticCurveTo(x+7,y,x+4,y-18);c.stroke();
  for(let j=0;j<4;j++){c.fillStyle=j%2?'#a7663b':'#707e47';c.beginPath();c.ellipse(x+(j%2?8:-1),y-j*6,8,2.5,j%2?-.4:.5,0,TAU);c.fill();}c.restore();
 }
}
