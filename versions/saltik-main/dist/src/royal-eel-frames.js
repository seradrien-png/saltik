import {largestOpaqueComponent} from './gatling-registration.js';
// Eight independently drawn swim poses, measured on the generated native sheet.
export const ROYAL_EEL_FRAMES=[[65,3,783,214],[953,2,790,226],[65,226,789,223],[953,226,791,226],[65,449,789,221],[953,449,789,215],[65,671,785,212],[953,669,784,215]];
export function royalEelFrameAt(time=0){const clock=((time%2.4)+2.4)%2.4/.3,index=Math.floor(clock)%8,phase=clock-Math.floor(clock);return{index,next:(index+1)%8,mix:Math.max(0,(phase-.93)/.07)};}
export function prepareRoyalEelFrames(images){
 const sheet=images['royal-eel-swim'],eel=images['royal-eel'];if(!sheet||!eel)return;
 eel.swimFrames=ROYAL_EEL_FRAMES.map(rect=>{const raw=document.createElement('canvas');raw.width=rect[2];raw.height=rect[3];const r=raw.getContext('2d',{willReadFrequently:true});r.drawImage(sheet,...rect,0,0,raw.width,raw.height);const pixels=r.getImageData(0,0,raw.width,raw.height);largestOpaqueComponent(pixels.data,raw.width,raw.height);r.putImageData(pixels,0,0);
  const frame=document.createElement('canvas');frame.width=1024;frame.height=340;const c=frame.getContext('2d',{willReadFrequently:true});c.drawImage(raw,32,8,960,304);const data=c.getImageData(0,0,1024,340);largestOpaqueComponent(data.data,1024,340);c.putImageData(data,0,0);
  const at=Math.round(1024*.58);let back=100;for(let y=0;y<340;y++)if(data.data[(y*1024+at)*4+3]>200){back=y;break;}frame.backSocket={x:.58,y:back/340};return frame;});
}
export function drawRoyalEelSprite(c,image,{x,y,w,h,flip=1,time=0}={}){
 if(!image)return;const frames=image.swimFrames,pose=royalEelFrameAt(time),a=frames?.[pose.index]??image,b=frames?.[pose.next];c.save();c.translate(x+(flip<0?w:0),y);c.scale(flip,1);
 // Every pose is a different drawing. The very short dissolve softens the
 // exposure change; no fixed-image mesh warp supplies the swimming movement.
 if(b&&pose.mix>0){c.globalAlpha=1;c.drawImage(a,0,0,w,h);c.globalAlpha=pose.mix;c.drawImage(b,0,0,w,h);}else{c.globalAlpha=1;c.drawImage(a,0,0,w,h);}c.restore();
}
export function royalEelBackSocket(image,time=0){const p=royalEelFrameAt(time),frames=image?.swimFrames,a=frames?.[p.index]?.backSocket??{x:.58,y:.22},b=frames?.[p.next]?.backSocket??a;return{x:a.x,y:a.y+(b.y-a.y)*p.mix};}
