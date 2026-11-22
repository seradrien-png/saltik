// Presentation-only walking rig. This module is never imported by the game.
import {MODERN_STRIKER} from '../src/modern-striker-art.js';
import {MODERN_GATLING_NATIVE} from '../src/modern-gatling-profile.js';
import {INK_ENEMY_SALTIK_PARTS,INK_ENEMY_SALTIK_VIEWS} from '../src/ink-enemy-saltik.js';
import {drawFriendlyEyes} from '../src/bt-art.js';
import {wheelRollPhase,drawWheelRoll} from '../src/wheel-roll.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=u=>u*u*(3-2*u);
export const walkSpeed=amplitude=>clamp(amplitude,0,3)*8*2*1.15/.68;
export function walkFoot(time,index,amplitude=1.8){
 const a=clamp(amplitude,0,3),phase=((time*1.15+index/3)%1+1)%1,stance=phase<.68,stride=a*8;
 if(stance)return{phase,stance,dx:stride*(1-2*phase/.68),lift:0,bend:0};
 const u=(phase-.68)/.32,m=-2*stride*.32/.68,arch=Math.sin(Math.PI*u)**2;
 // Match the backward ground speed at take-off and touchdown; the foot
 // returns in an arc without snapping or sliding at the support transition.
 return{phase,stance,dx:-stride+2*stride*smooth(u)+m*(2*u*u*u-3*u*u+u),lift:arch*a*3.3,bend:arch*a*1.3};
}
function split(points,y,lower){const out=[],inside=p=>lower?p[1]>=y:p[1]<=y;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],aa=inside(a),bb=inside(b);if(aa)out.push(a);if(aa!==bb){const t=(y-a[1])/(b[1]-a[1]);out.push([a[0]+(b[0]-a[0])*t,y]);}}return out;}
function polygon(c,points){c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();}
export function drawWalkingActor(c,image,character,time,amplitude){
 const bt=character==='bt',p=bt?INK_ENEMY_SALTIK_PARTS:character==='gatling'?MODERN_GATLING_NATIVE:MODERN_STRIKER;
 const crop=bt?INK_ENEMY_SALTIK_VIEWS.side.crop:character==='gatling'?[0,0,627,627]:[0,0,724,724],anchor=bt?INK_ENEMY_SALTIK_VIEWS.side.anchor:p.anchor,k=bt?70/393:126/(p.standingHeight??p.height),bob=Math.sin(time*1.15*Math.PI*4)*amplitude*.12;
 const draw=()=>c.drawImage(image,...crop,...crop),arms=p.arms??[];
 const drawLeg=()=>{c.save();for(const arm of arms){c.beginPath();c.rect(...crop);polygon(c,arm.polygon);c.clip('evenodd');}draw();c.restore();};
 const patch=points=>{if(points.length<3)return;c.save();c.beginPath();polygon(c,points);c.clip();drawLeg();c.restore();};
 c.save();c.translate(0,bob);c.scale(k,k);c.translate(-anchor[0],-anchor[1]);
 for(const [index,leg]of p.legs.entries()){
  const step=walkFoot(time,index,amplitude),roll=step.dx/k,offset=anchor[1]-leg.foot[1]+(-step.lift-bob)/k;
  const knee=leg.hinge+(leg.wheelTop-leg.hinge)*.54,kneeRoll=roll*.46+step.bend/k,kneeOffset=offset*.46;
  // Original shoulder/hip pixels stay fixed. Two connected strips flex at the
  // knee and reach the rigid foot patch, so no limb is translated off its root.
  patch(split(leg.polygon,leg.hinge,false));
  c.save();c.translate(0,leg.hinge);c.transform(1,0,kneeRoll/(knee-leg.hinge),1+kneeOffset/(knee-leg.hinge),0,0);c.translate(0,-leg.hinge);patch(split(split(leg.polygon,leg.hinge,true),knee,false));c.restore();
  c.save();c.translate(kneeRoll,kneeOffset);c.translate(0,knee);c.transform(1,0,(roll-kneeRoll)/(leg.wheelTop-knee),1+(offset-kneeOffset)/(leg.wheelTop-knee),0,0);c.translate(0,-knee);patch(split(split(leg.polygon,knee,true),leg.wheelTop,false));c.restore();
  c.save();c.translate(roll,offset);c.beginPath();polygon(c,split(leg.polygon,leg.wheelTop,true));c.clip();drawLeg();drawWheelRoll(c,{hub:leg.hub,spin:wheelRollPhase({motionDistance:time*walkSpeed(amplitude)},leg.hub,k)});c.restore();
 }
 c.save();if(character==='striker'){c.beginPath();c.rect(0,0,724,540);c.clip();}c.beginPath();c.rect(...crop);for(const part of [...p.legs,...arms])polygon(c,part.polygon);c.clip('evenodd');draw();c.restore();
 for(const [i,arm]of arms.entries()){c.save();c.translate(...arm.pivot);c.rotate(Math.sin(time*5+i*Math.PI)*.025);c.translate(-arm.pivot[0],-arm.pivot[1]);c.beginPath();polygon(c,arm.polygon);c.clip();draw();c.restore();}
 c.restore();
 if(bt)drawFriendlyEyes(c,{view:'side',x:0,y:bob,offsetX:0,heave:0,bodyDrop:0,rotation:0,k,flip:1,anchor});
}
