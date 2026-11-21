import {sampleSupportSurface} from './support-pose.js';

export const BT_COLLAPSE_SECONDS=.48;
const hulls=new WeakMap();
// Read the existing cutout's opaque boundary once. Using the actual painting
// prevents the empty corners of a crop rectangle from holding a wreck aloft.
export function nativeDefeatSilhouette(image,point,{crop,fallback=[]}={}){
 if(!image||typeof document==='undefined')return fallback;
 let cached=hulls.get(image);if(!cached){cached=new Map();hulls.set(image,cached);}
 const box=crop??[0,0,image.naturalWidth??image.width,image.naturalHeight??image.height],key=box.join(',');
 let boundary=cached.get(key);
 if(!boundary){
  try{
   const [x,y,w,h]=box,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,x,y,w,h,0,0,w,h);
   const data=ctx.getImageData(0,0,w,h).data;boundary=[];
   for(let row=0;row<h;row++){let first=-1,last=-1;for(let col=0;col<w;col++)if(data[(row*w+col)*4+3]>40){if(first<0)first=col;last=col;}
    if(first>=0){boundary.push([x+first,y+row],[x+last+1,y+row+1]);}}
   cached.set(key,boundary);
  }catch{return fallback;}
 }
 return boundary.length?boundary.map(point):fallback;
}
// A quarter turn puts the original cabin on its flank. Vertical compression
// settles the hanging wheels and pods into a low, horizontal grounded wreck.
export function groundedBTDefeatPose(e,time=0,{contacts=[],silhouette=contacts}={}){
 const progress=Math.max(0,Math.min(1,(time-(e.defeatStartedAt??time))/BT_COLLAPSE_SECONDS));
 const settled=progress*progress*(3-2*progress),rotation=(e.dir===-1?-1:1)*Math.PI/2*settled,scaleY=1-.52*settled;
 const co=Math.cos(rotation),si=Math.sin(rotation);
 let penetration=-Infinity;
 for(const point of silhouette){
  const x=point.x-e.x,y=point.y-e.y,worldX=e.x+x*co-y*si,worldY=e.y+(x*si+y*co)*scaleY;
  const surface=sampleSupportSurface(e.supportPose,worldX),floor=Number.isFinite(surface)?surface:e.y;
  penetration=Math.max(penetration,worldY-floor);
 }
 return{progress,rotation,scaleY,offsetY:Number.isFinite(penetration)?-penetration:0};
}

export function drawGroundedBTDefeat(c,draw,e,{camera=0,time=0,contacts=[],silhouette=contacts}={}){
 const pose=groundedBTDefeatPose(e,time,{contacts,silhouette});
 c.save();c.translate(e.x-camera,e.y+pose.offsetY);c.scale(1,pose.scaleY);c.rotate(pose.rotation);c.translate(-(e.x-camera),-e.y);
 draw();c.restore();return pose;
}

export function drawNativeKOEyes(c,eyes,{radius=9}={}){
 c.save();c.lineWidth=Math.max(2,radius*.24);c.lineCap='round';c.strokeStyle='#241f1a';
 for(const eye of eyes){const [x,y,rx=radius,ry=radius*.7]=eye;c.save();c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.clip();
  c.fillStyle='#b1a48a';c.globalAlpha*=.85;c.fill();c.globalAlpha/= .85;c.beginPath();
  c.moveTo(x-rx*.65,y-ry*.65);c.lineTo(x+rx*.65,y+ry*.65);c.moveTo(x-rx*.65,y+ry*.65);c.lineTo(x+rx*.65,y-ry*.65);c.stroke();c.restore();}
 c.restore();
}
