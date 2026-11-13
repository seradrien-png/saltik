import {MODERN_GATLING_TURN_FRAMES} from './modern-gatling-profile.js';
// Native character sheets can contain a thin disconnected strip from the next
// cell. Keep only the robot's connected silhouette; do not recolor its ink.
export function largestOpaqueComponent(pixels,w,h){
 const n=w*h,labels=new Uint32Array(n),queue=new Uint32Array(n);let id=0,best=0,count=0,box=null;
 for(let start=0;start<n;start++){
  if(labels[start]||!(pixels[start*4+3]>=128))continue;
  id++;let head=0,tail=1,x0=w,y0=h,x1=0,y1=0;queue[0]=start;labels[start]=id;
  while(head<tail){const at=queue[head++],x=at%w,y=(at-x)/w;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);
   for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){const q=yy*w+xx;if(!labels[q]&&pixels[q*4+3]>=128){labels[q]=id;queue[tail++]=q;}}
  }
  if(tail>count){count=tail;best=id;box={x:x0,y:y0,w:x1-x0,h:y1-y0};}
 }
 for(let i=0;i<n;i++)pixels[i*4+3]=best&&labels[i]===best?255:0;
 return box;
}
export function opaqueGatlingCell(image,x,y,size){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,x,y,size,size,0,0,size,size);const pixels=c.getImageData(0,0,size,size),box=largestOpaqueComponent(pixels.data,size,size);c.putImageData(pixels,0,0);return{canvas,box};
}
export function registerGatlingTurn(image){
 const atlas=document.createElement('canvas');atlas.width=2172;atlas.height=724;const c=atlas.getContext('2d'),transforms=[];
 for(let i=0;i<3;i++){const {canvas,box}=opaqueGatlingCell(image,i*724,0,724),frame=MODERN_GATLING_TURN_FRAMES[i],ratio=box?frame.height/box.h:1,x=box?frame.anchor[0]-(box.x+box.w/2)*ratio:0,y=box?frame.anchor[1]-(box.y+box.h)*ratio:0;transforms.push({ratio,x,y});c.save();c.beginPath();c.rect(i*724,0,724,724);c.clip();c.drawImage(canvas,i*724+x,y,724*ratio,724*ratio);c.restore();}
 atlas.gatlingTurnTransforms=transforms;return atlas;
}
