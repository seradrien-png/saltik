import {advanceJumpLegPose} from './jump-leg-pose.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Fixed-step cosmetic feedback; no collision or weapon timing is changed.
export function advanceMotorMotion(actor,dt,{previousVx=actor.vx??0,distance=0}={}){
 if(!(dt>0))return;
 advanceJumpLegPose(actor,dt);
 const vx=Number.isFinite(actor.vx)?actor.vx:0,impulse=clamp((vx-previousVx)/230,-1,1);
 const decay=Math.exp(-dt*12);
 // Velocity changes kick the springs by the same amount at 30/60/120 Hz;
 // damping then settles them instead of shrinking a one-frame acceleration.
 actor.motionLean=clamp((actor.motionLean||0)*decay-impulse*.04,-.055,.055);
 actor.motionHeave=clamp((actor.motionHeave||0)*decay+Math.abs(impulse)*.7,-1.35,1.35);
 actor.motionDistance=(actor.motionDistance||0)+(Number.isFinite(distance)?distance:0);
}
