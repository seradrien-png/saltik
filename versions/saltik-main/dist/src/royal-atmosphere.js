import {drawRoyalEelSprite} from './royal-eel-frames.js';
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
export const ROYAL_EEL_PASSES=Object.freeze([{at:.6,duration:12},{at:.85,duration:18}]);
export const createRoyalAtmosphere=()=>({clock:0,active:-1,age:0,triggered:[false,false],nextAllowed:0});
export function advanceRoyalAtmosphere(g,dt){
 if(g.level!==3||g.status!=='playing'||!(dt>0)||!Number.isFinite(dt)||g.introElapsed<g.introDuration)return;
 const s=g.royal.atmosphere??(g.royal.atmosphere=createRoyalAtmosphere());s.clock+=dt;
 if(s.active>=0){s.age+=dt;if(s.age>=ROYAL_EEL_PASSES[s.active].duration){s.active=-1;s.age=0;s.nextAllowed=s.clock+12;}}
 if(s.active<0&&s.clock>=s.nextAllowed){const progress=Math.max(g.maxX??0,g.player.x)/ROYAL_END;const next=ROYAL_EEL_PASSES.findIndex((p,i)=>!s.triggered[i]&&progress>=p.at);if(next>=0){s.active=next;s.age=0;s.triggered[next]=true;}}
}
export function royalEelVisual(s,{width,height,aspect=1024/340}={}){
 if(!s||s.active<0)return null;const far=s.active===1,u=clamp(s.age/ROYAL_EEL_PASSES[s.active].duration),w=width*(far?1.65:2.8),h=w/aspect;
 return{far,x:far?-w+u*(width+w):width-u*(width+w),y:height*(far?.43:.46)-h*.5,w,h,flip:far?-1:1,age:s.age};
}
export function drawRoyalEel(c,image,state,{width,height,far=false}={}){
 if(!image)return;const pose=royalEelVisual(state,{width,height});if(!pose||pose.far!==far)return;drawRoyalEelSprite(c,image,{...pose,time:pose.age});
}

// A handful of nocturnal insects stay near the painted foliage, never the HUD.
export function royalGardenLights(time=0){
 return [[284,382],[323,430],[582,510],[1410,542]].map(([x,y],i)=>({x:x+Math.sin(time*.31+i*2)*10,y:y+Math.sin(time*.43+i)*6,alpha:.12+.34*Math.max(0,Math.sin(time*.8+i*1.7))**2}));
}
export function drawRoyalGardenLife(c,{x=0,y=0,scale=1,scaleY=scale,time=0}={}){
 c.save();c.translate(x,y);c.scale(scale,scaleY);c.fillStyle='#ffed9a';
 for(const p of royalGardenLights(time)){c.globalAlpha=p.alpha*.2;c.beginPath();c.arc(p.x,p.y,3.2,0,Math.PI*2);c.fill();c.globalAlpha=p.alpha;c.beginPath();c.arc(p.x,p.y,.9,0,Math.PI*2);c.fill();}
 c.restore();
}
