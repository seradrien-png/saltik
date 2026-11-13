import {ROYAL_END} from './royal-layout.js';
// Resolve the generated cutout once; no translucent scenery or per-frame pixel reads.
export function prepareRoyalEel(images){
 const source=images['royal-eel'];if(!source)return;
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
 const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(source,0,0);
 const pixels=c.getImageData(0,0,canvas.width,canvas.height);
 for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=128?255:0;
 c.putImageData(pixels,0,0);images['royal-eel']=canvas;
}
const clamp=n=>Math.max(0,Math.min(1,n));
export const ROYAL_EEL_PASSES=Object.freeze([{at:.6,duration:8},{at:.85,duration:7}]);
export const createRoyalAtmosphere=()=>({clock:0,active:-1,age:0,triggered:[false,false],nextAllowed:0});
export function advanceRoyalAtmosphere(g,dt){
 if(g.level!==3||g.status!=='playing'||!(dt>0)||!Number.isFinite(dt)||g.introElapsed<g.introDuration)return;
 const s=g.royal.atmosphere??(g.royal.atmosphere=createRoyalAtmosphere());s.clock+=dt;
 if(s.active>=0){s.age+=dt;if(s.age>=ROYAL_EEL_PASSES[s.active].duration){s.active=-1;s.age=0;s.nextAllowed=s.clock+12;}}
 if(s.active<0&&s.clock>=s.nextAllowed){const progress=Math.max(g.maxX??0,g.player.x)/ROYAL_END;const next=ROYAL_EEL_PASSES.findIndex((p,i)=>!s.triggered[i]&&progress>=p.at);if(next>=0){s.active=next;s.age=0;s.triggered[next]=true;}}
}
export function royalEelVisual(s,{width,height,aspect=3}={}){
 if(!s||s.active<0)return null;const far=s.active===1,u=clamp(s.age/ROYAL_EEL_PASSES[s.active].duration),w=far?height*.22*aspect:width*2.8,h=w/aspect;
 return{far,x:far?-w+u*(width+w):width-u*(width+w),y:height*(far?.25:.46)-h*.5+Math.sin(s.age*.9)*height*(far?.008:.025),w,h,flip:far?-1:1,age:s.age};
}
export function drawRoyalEel(c,image,state,{width,height,far=false}={}){
 if(!image)return;const pose=royalEelVisual(state,{width,height,aspect:image.width/image.height});if(!pose||pose.far!==far)return;
 c.save();c.globalAlpha=1;c.translate(pose.x+(pose.flip<0?pose.w:0),pose.y);c.scale(pose.flip,1);
 const count=64;for(let i=0;i<count;i++){const sx=i*image.width/count,sw=Math.min(image.width-sx,image.width/count+1),dy=Math.sin(pose.age*2.4-i/count*8)*pose.h*.018;c.drawImage(image,sx,0,sw,image.height,i*pose.w/count,dy,sw/image.width*pose.w+1,pose.h);}
 c.restore();
}
