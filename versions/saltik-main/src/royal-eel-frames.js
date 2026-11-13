import {largestOpaqueComponent} from './gatling-registration.js';
// Keep the original sheet as a fallback. The large passes use eight full-width
// drawings: the approved original plus seven independently redrawn swim poses.
export const ROYAL_EEL_POSE_ASSETS=Object.freeze(Array.from({length:7},(_,i)=>`royal-eel-pose-${i+1}`));
export const ROYAL_EEL_FRAMES=[[65,3,783,214],[953,2,790,226],[65,226,789,223],[953,226,791,226],[65,449,789,221],[953,449,789,215],[65,671,785,212],[953,669,784,215]];
export function royalEelFrameAt(time=0){const clock=((time%2.4)+2.4)%2.4/.3,index=Math.floor(clock)%8,phase=clock-Math.floor(clock);return{index,next:(index+1)%8,mix:Math.max(0,(phase-.93)/.07)};}
export function prepareRoyalEelFrames(images){
 const sheet=images['royal-eel-swim'],eel=images['royal-eel'];if(!eel)return;
 const native=[eel,...ROYAL_EEL_POSE_ASSETS.map(name=>images[name])],fullResolution=native.every(Boolean);
 if(!fullResolution&&!sheet)return;
 eel.swimFrames=ROYAL_EEL_FRAMES.map((rect,index)=>{
  const frame=document.createElement('canvas'),source=fullResolution?native[index]:sheet;
  // Preserve the actual source pixels. In particular, never reduce the 2172px
  // drawings to the old 1024px staging canvas before enlarging them on screen.
  frame.width=fullResolution?source.width:Math.ceil(rect[2]/.9375);
  frame.height=fullResolution?source.height:Math.round(frame.width*340/1024);
  const c=frame.getContext('2d',{willReadFrequently:true});
  if(fullResolution)c.drawImage(source,0,0);
  else c.drawImage(source,...rect,Math.round((frame.width-rect[2])/2),Math.round((frame.height-rect[3])/2),rect[2],rect[3]);
  const data=c.getImageData(0,0,frame.width,frame.height);largestOpaqueComponent(data.data,frame.width,frame.height);c.putImageData(data,0,0);
  const at=Math.round(frame.width*.58);let back=frame.height*.22;
  for(let y=0;y<frame.height;y++)if(data.data[(y*frame.width+at)*4+3]>200){back=y;break;}
  frame.backSocket={x:.58,y:back/frame.height};return frame;
 });
}
export function drawRoyalEelSprite(c,image,{x,y,w,h,flip=1,time=0}={}){
 if(!image)return;const frames=image.swimFrames,pose=royalEelFrameAt(time),a=frames?.[pose.index]??image,b=frames?.[pose.next];c.save();c.translate(x+(flip<0?w:0),y);c.scale(flip,1);
 // Every pose is a different drawing. The very short dissolve softens the
 // exposure change; no fixed-image mesh warp supplies the swimming movement.
 if(b&&pose.mix>0){c.globalAlpha=1;c.drawImage(a,0,0,w,h);c.globalAlpha=pose.mix;c.drawImage(b,0,0,w,h);}else{c.globalAlpha=1;c.drawImage(a,0,0,w,h);}c.restore();
}
export function royalEelBackSocket(image,time=0){const p=royalEelFrameAt(time),frames=image?.swimFrames,a=frames?.[p.index]?.backSocket??{x:.58,y:.22},b=frames?.[p.next]?.backSocket??a;return{x:a.x,y:a.y+(b.y-a.y)*p.mix};}
