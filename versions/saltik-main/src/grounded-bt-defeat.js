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
// Collapse articulated supports in their native rigs. Never rotate, tint or
// flatten the entire painting: the chassis settles down between planted wheels.
export function groundedBTDefeatPose(e,time=0,{contacts=[]}={}){
 const progress=Math.max(0,Math.min(1,(time-(e.defeatStartedAt??time))/BT_COLLAPSE_SECONDS));
 const settled=progress*progress*(3-2*progress);
 let penetration=-Infinity;
 for(const point of contacts){
  const surface=sampleSupportSurface(e.supportPose,point.x),floor=Number.isFinite(surface)?surface:e.y;
  penetration=Math.max(penetration,point.y-floor);
 }
 return{progress,settled,rotation:0,scaleY:1,offsetY:Number.isFinite(penetration)?-penetration:0};
}

export function drawGroundedBTDefeat(c,draw,e,{camera=0,time=0,contacts=[],silhouette=contacts}={}){
 const pose=groundedBTDefeatPose(e,time,{contacts,silhouette});
 c.save();c.translate(e.x-camera,e.y+pose.offsetY);c.scale(1,pose.scaleY);c.rotate(pose.rotation);c.translate(-(e.x-camera),-e.y);
 draw();c.restore();return pose;
}

// Preserve the native eye pixels and costume palette. A narrow closed lid is
// enough to convey shutdown without filling or recoloring either eye.
export function drawNativeKOEyes(c,eyes,{radius=9}={}){
 c.save();c.lineWidth=Math.max(2,radius*.12);c.lineCap='round';c.strokeStyle='#241f1a';
 for(const [x,y,rx=radius,ry=radius*.7] of eyes){c.beginPath();c.moveTo(x-rx*.7,y);c.quadraticCurveTo(x,y+ry*.25,x+rx*.7,y);c.stroke();}
 c.restore();
}
