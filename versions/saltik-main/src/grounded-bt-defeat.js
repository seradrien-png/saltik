import {sampleSupportSurface} from './support-pose.js';

export const BT_COLLAPSE_SECONDS=1.05;
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

// Paint no wreck pixels through its own solid support, including small native
// claw outlines that extend beyond the calibrated articulation masks.
export function clipDefeatedSupport(c,e,{camera=0}={}){
 const span=300*(e.artScale??1),left=e.x-span,right=e.x+span;
 c.beginPath();c.moveTo(left-camera,e.y-500);c.lineTo(right-camera,e.y-500);
 for(let x=right;x>=left;x-=10){const floor=sampleSupportSurface(e.supportPose,x);c.lineTo(x-camera,(Number.isFinite(floor)?floor:e.y)+1);}
 c.closePath();c.clip();
}
export function drawGroundedBTDefeat(c,draw,e,{camera=0,time=0,contacts=[],silhouette=contacts}={}){
 const pose=groundedBTDefeatPose(e,time,{contacts,silhouette});
 c.save();clipDefeatedSupport(c,e,{camera});c.translate(e.x-camera,e.y+pose.offsetY);c.scale(1,pose.scaleY);c.rotate(pose.rotation);c.translate(-(e.x-camera),-e.y);
 draw();c.restore();return pose;
}

// Electrical shutdown affects only the calibrated eye glass. The costume
// keeps its original material and color throughout the short collapse.
export function drawNativeKOEyes(c,eyes,{radius=9,progress=1}={}){
 const fade=Math.max(0,Math.min(1,(progress-.12)/.48));
 const flicker=progress<.5&&Math.sin(progress*55)>0?.35:1;
 const alpha=c.globalAlpha;c.save();c.fillStyle='#131a19';c.strokeStyle='#343d39';
 for(const [x,y,rx=radius,ry=radius*.7] of eyes){c.save();c.globalAlpha*=fade*flicker;c.beginPath();c.ellipse(x,y,rx*.85,ry*.85,0,0,Math.PI*2);c.fill();c.lineWidth=Math.max(1,rx*.06);c.stroke();c.restore();c.globalAlpha=alpha;}
 c.restore();c.globalAlpha=alpha;
}
