const TAU=Math.PI*2,mod=(n,d)=>((n%d)+d)%d;
// Positions are authored against the 768x512 logical wheel module, independent
// of its HD source pixels and of camera movement.
export function royalWheelFrame(s,time=0){return{x:s.left+483*s.scale,y:s.top+205*s.scale,rx:139*s.scale,ry:165*s.scale,angle:-time*.18};}
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
// Authored three-quarter axes in the original 768×512 painting. Both wheel
// faces and every bucket share this projection and the simulation phase.
const wheelBasis={u:{x:139,y:25},v:{x:-24,y:165},depth:{x:-86,y:-32}};
export function royalWheelGeometry(s,time=0){
 const angle=-time*.18,point=(theta,z=0,r=1)=>({x:s.left+(483+wheelBasis.u.x*Math.cos(theta)*r+wheelBasis.v.x*Math.sin(theta)*r+wheelBasis.depth.x*z)*s.scale,y:s.top+(205+wheelBasis.u.y*Math.cos(theta)*r+wheelBasis.v.y*Math.sin(theta)*r+wheelBasis.depth.y*z)*s.scale});
 return{angle,axle:{near:{x:s.left+483*s.scale,y:s.top+205*s.scale},far:{x:s.left+397*s.scale,y:s.top+173*s.scale}},basis:wheelBasis,paddles:Array.from({length:12},(_,i)=>{const theta=angle+i*TAU/12;return{theta,near:point(theta),far:point(theta,1),corners:[point(theta-.036,0,.9),point(theta-.036,1,.9),point(theta-.036,1,1.015),point(theta-.036,0,1.015)],cap:[point(theta-.036,0,1.015),point(theta-.036,1,1.015),point(theta+.036,1,1.015),point(theta+.036,0,1.015)]};})};
}
const wheelCache=new WeakMap(),faceCache=new WeakMap();
function inSupport(x,y){return (x>=495&&x<=550&&y>=216)||(x>=576&&x<=624&&y>=273);}
function bridgeEdge(x){return 269+Math.pow((x-382)/1.55,2)/430;}
function wheelHull(x,y){const q=(cx,cy)=>{const xx=x-cx,yy=y-cy,det=139*165+24*25,u=(165*xx+24*yy)/det,v=(-25*xx+139*yy)/det;return u*u+v*v<1.34;};return (x>220&&x<640&&y<230)||q(483,205)||q(397,173)||(x>270&&x<525&&y>35&&y<230);}
// A cached replacement for the base module removes only the moving mechanism.
// Native water, pillars and the walking bridge are retained pixel for pixel.
export function royalWheelStaticImage(image){
 if(wheelCache.has(image))return wheelCache.get(image);
 if(typeof document==='undefined'||!image?.width)return image;
 const w=image.naturalWidth??image.width,h=image.naturalHeight??image.height,base=document.createElement('canvas');base.width=w;base.height=h;const c=base.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const pixels=c.getImageData(0,0,w,h),a=pixels.data;
 for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const x=xx*768/w,y=yy*512/h;if(y>=bridgeEdge(x)||inSupport(x,y)||!wheelHull(x,y))continue;const i=(yy*w+xx)*4,water=a[i+1]>70&&a[i+2]>130&&a[i+1]>a[i]*1.12&&a[i+2]>a[i+1]*1.025;if(!water)a[i+3]=0;}
 c.putImageData(pixels,0,0);wheelCache.set(image,base);return base;
}
function wheelFace(rotor){
 if(faceCache.has(rotor))return faceCache.get(rotor);
 if(typeof document==='undefined')return rotor;
 const n=1024,face=document.createElement('canvas');face.width=face.height=n;const c=face.getContext('2d');
 // Open gaps replace the rejected solid ornamental plate. The actual native
 // rim, eight decorated spokes and floral nave remain, without repainting.
 c.save();c.translate(n/2,n/2);c.beginPath();c.arc(0,0,n*.495,0,TAU);c.arc(0,0,n*.392,0,TAU,true);c.clip('evenodd');c.drawImage(rotor,-n/2,-n/2,n,n);c.restore();
 for(let i=0;i<8;i++){const a=i*TAU/8,ux=Math.cos(a),uy=Math.sin(a),vx=-uy,vy=ux;c.save();c.translate(n/2,n/2);c.beginPath();c.moveTo(vx*24,vy*24);c.lineTo(ux*n*.43+vx*30,uy*n*.43+vy*30);c.lineTo(ux*n*.43-vx*30,uy*n*.43-vy*30);c.lineTo(-vx*24,-vy*24);c.closePath();c.clip();c.drawImage(rotor,-n/2,-n/2,n,n);c.restore();}
 c.save();c.translate(n/2,n/2);c.beginPath();c.arc(0,0,n*.155,0,TAU);c.clip();c.drawImage(rotor,-n/2,-n/2,n,n);c.restore();faceCache.set(rotor,face);return face;
}
function texturedQuad(c,image,points){
 const iw=image.naturalWidth??image.width,ih=image.naturalHeight??image.height;
 const [p,a,b,d]=points;c.save();c.beginPath();points.forEach((q,i)=>c[i?'lineTo':'moveTo'](q.x,q.y));c.closePath();c.clip();
 // A native embossed spoke supplies the bucket plank's gold carving. It is
 // mapped over the entire physical bucket, including its visible outer lip.
 c.transform((a.x-p.x)/210,(a.y-p.y)/210,(d.x-p.x)/75,(d.y-p.y)/75,p.x,p.y);c.drawImage(image,iw*.43,ih*.455,iw*.24,ih*.075,0,0,210,75);c.restore();
}
function drawWheelFace(c,face,s,angle,z,camera){
 const co=Math.cos(angle),si=Math.sin(angle),u=wheelBasis.u,v=wheelBasis.v,p={x:483+wheelBasis.depth.x*z,y:205+wheelBasis.depth.y*z};
 c.save();c.translate(s.left-camera+p.x*s.scale,s.top+p.y*s.scale);c.transform((u.x*co+v.x*si)*s.scale,(u.y*co+v.y*si)*s.scale,(-u.x*si+v.x*co)*s.scale,(-u.y*si+v.y*co)*s.scale,0,0);c.drawImage(face,-1,-1,2,2);c.restore();
}
function drawPerspectiveWheel(c,image,rotor,s,camera,time){
 const g=royalWheelGeometry(s,time),face=wheelFace(rotor);drawWheelFace(c,face,s,g.angle,1,camera);
 // Bucket faces connect both rims. Opposite buckets change foreshortening
 // together; the waterfall-side return never stays frozen behind a disk.
 const buckets=[...g.paddles].sort((a,b)=>Math.sin(a.theta)-Math.sin(b.theta));
 for(const bucket of buckets)for(const points of [bucket.corners,bucket.cap])texturedQuad(c,rotor,points.map(p=>({x:p.x-camera,y:p.y})));
 drawWheelFace(c,face,s,g.angle,0,camera);
 // Restore the exact foreground pixels; the axle pedestal and walking lane
 // occlude the wheel instead of rotating along with it.
 c.save();c.translate(s.left-camera,s.top);c.scale(s.scale,s.scale);c.beginPath();c.moveTo(0,bridgeEdge(0));for(let x=0;x<=768;x+=4)c.lineTo(x,bridgeEdge(x));c.lineTo(768,512);c.lineTo(0,512);c.closePath();c.rect(495,216,55,150);c.rect(576,273,48,110);c.clip();c.drawImage(image,0,0,image.naturalWidth??image.width,image.naturalHeight??image.height,0,0,768,512);c.restore();
}

export function drawRoyalWheelWater(c,image,s,{camera=0,time=0,rotor=null}={}){
 if(!image)return;
 if(rotor)drawPerspectiveWheel(c,image,rotor,s,camera,time);
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
