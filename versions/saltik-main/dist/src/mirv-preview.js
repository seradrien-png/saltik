import {predictMirvImpact} from './engine.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const INK='#343634',CORAL='#e45f50',PAPER='#f5e7c4';
// Small fixed irregularities preserve the drawn scope style without moving
// its measured impact center or using random per-frame screen noise.
function roughOval(c,x,y,rx,ry,seed=0){
 c.beginPath();for(let i=0;i<=40;i++){const a=i/40*Math.PI*2,j=Math.sin(i*2.31+seed)*.75;const xx=x+Math.cos(a)*(rx+j),yy=y+Math.sin(a)*(ry+j*.55);if(i)c.lineTo(xx,yy);else c.moveTo(xx,yy);}c.closePath();
}
export function createMirvPreview({predict=predictMirvImpact}={}){
 let cached=null,lastGame=null,lastAt=-Infinity,lastX=0,lastY=0,lastDir=0,lastAngle=0;
 function reset(){cached=null;lastGame=null;lastAt=-Infinity;}
 function draw(c,g,{camera=0,cameraY=0,width=1280,height=720}={}){
  const p=g?.player;
  if(!p?.mirvAiming||!['playing','paused'].includes(g.status)||g.duel||g.bossBreach||g.carrierShutdown||p.evasion?.active||p.turn?.active){reset();return null;}
  if(g!==lastGame||g.time<lastAt||g.time-lastAt>=1/12-1e-8||p.dir!==lastDir||Math.hypot(p.x-lastX,p.y-lastY)>10||Math.abs(p.cannonElevation-lastAngle)>.14){
   cached=predict(g,p);lastGame=g;lastAt=g.time;lastX=p.x;lastY=p.y;lastDir=p.dir;lastAngle=p.cannonElevation;
  }
  if(!cached?.zone)return null;
  const {zone,impacts=[],points=[]}=cached;
  const left=zone.minX-zone.radius-camera,right=zone.maxX+zone.radius-camera,x=zone.x-camera;
  const offscreen=x<24?-1:x>width-24?1:0;
  c.save();c.lineJoin='round';c.lineCap='round';
  // The sampled arc is decoration; the same physical predictor supplies the
  // ground footprints, including a platform or cover that catches a bomblet.
  if(points.length>1){
   c.strokeStyle=INK;c.globalAlpha=.9;c.lineWidth=7;c.setLineDash([7,8]);c.beginPath();
   const stride=Math.max(1,Math.ceil(points.length/64));
   for(let i=0;i<points.length;i+=stride){const p=points[i];if(i===0)c.moveTo(p.x-camera,p.y);else c.lineTo(p.x-camera+Math.sin(i*2.19)*.65,p.y+Math.cos(i*1.71)*.65);}
   const end=points.at(-1);c.lineTo(end.x-camera,end.y);c.stroke();c.strokeStyle=CORAL;c.lineWidth=3.8;c.stroke();c.setLineDash([]);
  }
  if(right>=0&&left<=width){
   const rx=Math.max(28,(right-left)/2),cy=zone.y;
   c.globalAlpha=.20;c.fillStyle=CORAL;c.beginPath();c.ellipse(x,cy,rx,13,0,0,Math.PI*2);c.fill();
   c.globalAlpha=.95;c.strokeStyle=INK;c.lineWidth=7;roughOval(c,x,cy,rx,13);c.stroke();
   c.strokeStyle=CORAL;c.lineWidth=4;c.setLineDash([11,5]);roughOval(c,x,cy,rx,13);c.stroke();c.setLineDash([]);
   for(const point of impacts){if(point.x-camera<-30||point.x-camera>width+30)continue;
    c.globalAlpha=.95;c.strokeStyle=PAPER;c.lineWidth=6;c.beginPath();c.ellipse(point.x-camera,point.y,22,6,0,0,Math.PI*2);c.stroke();c.strokeStyle=CORAL;c.lineWidth=3.5;roughOval(c,point.x-camera,point.y,22,6,point.x*.01);c.stroke();
    c.strokeStyle=CORAL;c.beginPath();c.moveTo(point.x-camera-5,point.y);c.lineTo(point.x-camera+5,point.y);c.moveTo(point.x-camera,point.y-5);c.lineTo(point.x-camera,point.y+5);c.stroke();
   }
  }
  const bx=clamp(x,88,width-88),labelBand=clamp(height*.30,115,210)-cameraY;
  const by=offscreen?labelBand:Math.min(zone.y-36,labelBand);
  const distance=Math.round(Math.abs(zone.x-p.x)/10)*10;
  c.globalAlpha=.88;c.fillStyle=INK;c.beginPath();c.roundRect(bx-66,by-17,132,34,8);c.fill();
  c.strokeStyle=CORAL;c.lineWidth=2.5;c.stroke();c.fillStyle=PAPER;c.font='18px "InkLettering", sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(`MIRV · ${distance}`,bx,by);
  if(offscreen){
   const tip=offscreen>0?width-17:17,tail=tip-offscreen*14;
   c.strokeStyle=INK;c.lineWidth=8;c.beginPath();c.moveTo(tail,by-9);c.lineTo(tip,by);c.lineTo(tail,by+9);c.stroke();
   c.strokeStyle=CORAL;c.lineWidth=4.5;c.stroke();
  }
  c.restore();return {prediction:cached,offscreen};
 }
 return {draw,reset};
}
