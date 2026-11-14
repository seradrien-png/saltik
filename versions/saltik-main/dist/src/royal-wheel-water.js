const TAU=Math.PI*2,mod=(n,d)=>((n%d)+d)%d;
// Positions are authored against the 768x512 logical wheel module, independent
// of its HD source pixels and of camera movement.
export function royalWheelFrame(s,time=0){return{x:s.left+483*s.scale,y:s.top+173*s.scale,rx:130*s.scale,ry:146*s.scale,angle:-time*.18};}
export function royalRunoffGeometry(s){return{startX:s.left+400*s.scale,startY:s.top+475*s.scale,mouthWidth:136*s.scale,lipX:s.left+425*s.scale,lipY:s.top+520*s.scale,lipWidth:176*s.scale,bottom:1420};}
const materialCache=new WeakMap();
function materials(image){
 if(materialCache.has(image))return materialCache.get(image);
 if(typeof document==='undefined'||!image?.width)return null;
 const w=image.naturalWidth??image.width,h=image.naturalHeight??image.height,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const data=c.getImageData(0,0,w,h),a=data.data;
 const blue=new Uint8Array(w*h);
 for(let p=0;p<blue.length;p++){const i=p*4;blue[p]=a[i+3]>120&&a[i+1]>70&&a[i+2]>130&&a[i+1]>a[i]*1.12&&a[i+2]>a[i+1]*1.025?1:0;}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=y*w+x,i=p*4;let water=blue[p];if(!water&&a[i]>165&&a[i+1]>190&&a[i+2]>195){for(const [dx,dy] of [[-3,0],[3,0],[0,-3],[0,3]]){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h&&blue[yy*w+xx]){water=1;break;}}}a[i+3]=water?255:0;}
 c.putImageData(data,0,0);
 const pool=document.createElement('canvas');pool.width=320;pool.height=150;pool.getContext('2d').drawImage(canvas,635*w/1536,790*h/1024,320*w/1536,150*h/1024,0,0,320,150);
 const path=typeof Path2D==='undefined'?null:new Path2D();if(path)for(let yy=0;yy<h;yy+=2){let start=-1;for(let xx=0;xx<=w;xx+=2){const wet=xx<w&&a[(yy*w+xx)*4+3]>128;if(wet&&start<0)start=xx;if(!wet&&start>=0){path.rect(start*768/w,yy*512/h,(xx-start)*768/w,2*512/h);start=-1;}}}
 const result={water:canvas,pool,w,h,path};materialCache.set(image,result);return result;
}
function wheelWater(c,image,s,camera,time){
 const m=materials(image);if(!m)return;
 c.save();c.translate(s.left-camera,s.top);c.scale(s.scale,s.scale);
 // The mask stays fixed to the actual water; advected highlights cannot
 // paint over gold carvings, foliage or the stationary supporting pillars.
 if(m.path)c.clip(m.path);
 c.drawImage(m.water,0,0,m.w,m.h,0,0,768,512);
 for(const phase of [0,.5]){const travel=mod(time*44+phase*32,32);c.globalAlpha=Math.sin(travel/32*Math.PI)*.7;c.drawImage(m.water,0,0,m.w,m.h,0,travel,768,512);}
 c.restore();
}
export function drawRoyalWheelWater(c,image,s,{camera=0,time=0,rotor=null}={}){
 if(!image)return;
 if(rotor){const p=royalWheelFrame(s,time);c.save();c.translate(p.x-camera,p.y);c.scale(p.rx,p.ry);c.beginPath();c.arc(0,0,1,0,TAU);c.clip();c.rotate(p.angle);c.drawImage(rotor,0,0,rotor.naturalWidth??rotor.width,rotor.naturalHeight??rotor.height,-1,-1,2,2);c.restore();
  // The near axle pedestal is part of the stationary structure, in front of
  // the disk. Restore only its narrow native polygon, never the whole image.
  c.save();c.translate(s.left-camera,s.top);c.scale(s.scale,s.scale);c.beginPath();for(const [i,q] of [[499,218],[535,219],[541,249],[549,252],[548,358],[506,357],[506,254],[494,251]].entries())c[i?'lineTo':'moveTo'](...q);c.closePath();c.clip();c.drawImage(image,0,0,image.naturalWidth??image.width,image.naturalHeight??image.height,0,0,768,512);c.restore();
 }
 wheelWater(c,image,s,camera,time);
}
function channel(c,p,camera){const x=p.startX-camera,y=p.startY,l=p.lipX-camera,w=p.mouthWidth/2,r=p.lipWidth/2;c.beginPath();c.moveTo(x-w,y);c.bezierCurveTo(x-w-20,y+40,l-r,y+60,l-r,p.lipY);c.lineTo(l+r,p.lipY);c.bezierCurveTo(l+r,y+60,x+w+25,y+30,x+w,y);c.closePath();}
function falling(c,p,camera){const x=p.lipX-camera,w=p.lipWidth/2;c.beginPath();c.moveTo(x-w,p.lipY);c.bezierCurveTo(x-w-8,p.lipY+100,x-w+8,p.bottom-90,x-w-15,p.bottom);c.lineTo(x+w+15,p.bottom);c.bezierCurveTo(x+w+8,p.bottom-90,x+w+8,p.lipY+100,x+w,p.lipY);c.closePath();}
function flowTexture(c,m,x,y,w,h,time,speed){
 const tileH=Math.max(65,w*.5),offset=mod(time*speed,tileH);if(!m)return;
 for(let yy=y-tileH+offset;yy<y+h;yy+=tileH)c.drawImage(m.pool,0,0,320,150,x,yy,w,tileH+1);
}
function movingWater(m,time){
 if(!m)return null;
 if(!m.frame){m.frame=document.createElement('canvas');m.frame.width=m.w;m.frame.height=m.h;m.frameContext=m.frame.getContext('2d');}
 if(m.frameTime===time)return m.frame;m.frameTime=time;
 const c=m.frameContext;c.clearRect(0,0,m.w,m.h);c.globalCompositeOperation='source-over';
 for(const phase of [0,.5]){const u=mod(time*.7+phase,1);c.globalAlpha=Math.sin(u*Math.PI)*.85;c.drawImage(m.water,0,u*55);}
 c.globalAlpha=1;c.globalCompositeOperation='destination-in';c.drawImage(m.water,0,0);c.globalCompositeOperation='source-over';return m.frame;
}
function paintedRunoff(c,image,p,camera,time){
 const m=materials(image),flow=movingWater(m,time),iw=image.naturalWidth??image.width,ih=image.naturalHeight??image.height,crest=245*ih/1254;
 const paint=(sy,sh,x,y,w,h)=>{c.drawImage(image,0,sy,iw,sh,x-camera-w*.48,y,w,h);if(flow)c.drawImage(flow,0,sy,iw,sh,x-camera-w*.48,y,w,h);};
 // Warp only the short perspective reach to match the native river mouth;
 // the following curtain shares the exact painted crest row, without a box.
 for(let sy=0;sy<crest;sy+=10){const sh=Math.min(10,crest-sy),t=(sy+sh*.5)/crest,x=p.startX+(p.lipX-p.startX)*t,w=p.mouthWidth/.28+(p.lipWidth/.72-p.mouthWidth/.28)*t;paint(sy,sh,x,p.startY+sy/crest*(p.lipY-p.startY),w,sh/crest*(p.lipY-p.startY)+.6);}
 paint(crest,ih-crest,p.lipX,p.lipY,p.lipWidth/.72,p.bottom-p.lipY);
}
export function drawRoyalWheelRunoff(c,image,s,{camera=0,time=0,runoff=null}={}){
 if(!image)return;const p=royalRunoffGeometry(s);if(runoff){paintedRunoff(c,runoff,p,camera,time);return;}const m=materials(image),x=p.lipX-camera,w=p.lipWidth;
 c.save();channel(c,p,camera);c.fillStyle='#0c76a1';c.fill();c.save();c.clip();flowTexture(c,m,x-w/2-40,p.startY,w+80,p.lipY-p.startY,time,38);c.restore();
 // A restrained velvet/gold channel edge ties the water to the purple plinth.
 channel(c,p,camera);c.strokeStyle='#174b4b';c.lineWidth=5;c.stroke();c.strokeStyle='#d6af5b';c.lineWidth=1.2;c.stroke();
 falling(c,p,camera);const depth=c.createLinearGradient(x-w/2,0,x+w/2,0);depth.addColorStop(0,'#086598');depth.addColorStop(.45,'#52cfee');depth.addColorStop(1,'#086598');c.fillStyle=depth;c.fill();c.save();c.clip();flowTexture(c,m,x-w/2-18,p.lipY,w+36,p.bottom-p.lipY,time,110);
 c.lineCap='round';for(let i=0;i<19;i++){const travel=mod(time*(85+i%4*13)+i*61,p.bottom-p.lipY+60),xx=x-w/2+w*(i+.5)/19;c.strokeStyle=i%3?'#d4ffff':'#88e3ff';c.globalAlpha=.3+.2*(i%2);c.lineWidth=1+(i%3)*.5;c.beginPath();c.moveTo(xx,p.lipY+travel-36);c.quadraticCurveTo(xx+Math.sin(i+time)*2,p.lipY+travel-14,xx,p.lipY+travel);c.stroke();}c.restore();
 c.globalAlpha=.9;c.strokeStyle='#e5ffff';c.lineWidth=3;c.beginPath();c.ellipse(x,p.lipY,w/2,4,0,0,TAU);c.stroke();c.restore();
}
