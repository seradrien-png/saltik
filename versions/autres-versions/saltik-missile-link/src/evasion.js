// The rear stance is a physical hold. The old move timings below remain only
// as native atlas metadata; they do not govern defense or its duration.
export const EVASION_RECHARGE=0,DEFLECT_RECHARGE=0;
export const EVASION_MOVES=Object.freeze({
  tilt:Object.freeze({row:0,duration:1.9,window:Object.freeze([.2,1.7]),frames:Object.freeze([.2,.61,1.7]),cycle:.72}),
  spin:Object.freeze({row:1,duration:1.35,window:Object.freeze([.22,1.10]),frames:Object.freeze([.22,.66,1.10]),cycle:.88}),
});
export const DEFLECT_MOVE=Object.freeze({row:2,duration:.78,window:Object.freeze([.10,.26]),frames:Object.freeze([.10,.26,.55])});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const seconds=n=>Number.isFinite(n)?Math.max(0,n):0;
const smallShot=s=>(['plasma','bullet'].includes(s?.kind)||s?.kind==='enemy-missile'&&s.handDeflectable===true)&&(s.radius??0)<=8;
const emptyPose=()=>({kind:null,atlas:null,frame:0,rear:0,depthScale:1,bodyOffsetX:0,bodyOffsetY:0,roll:0,armShake:0,weaponsLocked:false});
const hitTime=(state,{dt=0,fraction=0}={})=>seconds(state.elapsed)+seconds(dt)*clamp(Number.isFinite(fraction)?fraction:0,0,1);
function advance(state,dt){
  const step=seconds(dt);state.cooldown=Math.max(0,state.cooldown-step);if(state.cooldown<1e-9)state.cooldown=0;
  if(!state.active)return;
  state.elapsed=Math.min(state.duration,state.elapsed+step);if(state.elapsed>=state.duration-1e-9)state.active=false;
}
export function createEvasionState(){return {kind:null,active:false,held:false,elapsed:0,duration:0,cooldown:0};}
export function beginEvasion(state){
  if(!state||state.active)return false;
  Object.assign(state,{kind:'tilt',active:true,held:true,elapsed:0,duration:0,cooldown:0});return true;
}
export function advanceEvasion(state,dt){if(state?.active&&state.held)state.elapsed=Math.min(1e9,seconds(state.elapsed)+seconds(dt));}
export function endEvasion(state){if(state)Object.assign(state,{kind:null,active:false,held:false,elapsed:0,duration:0,cooldown:0});}
export function isEvasionProtected(state,step={}){return !!(state?.active&&state.held&&state.kind==='tilt');}
export function resolveEvasionHit(state,shot,step={}){return isEvasionProtected(state,step)?'avoid':'hit';}
export function evasionPose(state){
  if(!isEvasionProtected(state))return emptyPose();
  return {kind:'tilt',atlas:'saltik-dodge',frame:1,rear:1,depthScale:.92,
    bodyOffsetX:-5,bodyOffsetY:0,roll:0,armShake:0,weaponsLocked:true};
}
export function createDeflectState(){return {active:false,elapsed:0,duration:DEFLECT_MOVE.duration,cooldown:0,deflected:false};}
export function beginDeflect(state){
  if(!state)return false;
  Object.assign(state,{active:true,elapsed:0,duration:DEFLECT_MOVE.duration,cooldown:DEFLECT_RECHARGE,deflected:false});return true;
}
export function advanceDeflect(state,dt){advance(state,dt);}
export function deflectPose(state){
  if(!state?.active)return emptyPose();
  const frame=DEFLECT_MOVE.frames.filter(at=>state.elapsed>=at).length;
  return {kind:'deflect',atlas:'saltik-evasion',frame:8+frame,rear:0,depthScale:1,bodyOffsetX:0,bodyOffsetY:0,roll:0,
    armShake:frame===2?.14*Math.sin(Math.PI*(state.elapsed-.26)/.29)*Math.sin((state.elapsed-.26)*Math.PI*18):0,weaponsLocked:true};
}
export function resolveDeflectHit(state,shot,step={}){
  if(!state?.active||state.deflected||!smallShot(shot))return 'hit';
  const time=hitTime(state,step),[start,end]=DEFLECT_MOVE.window;if(time<start||time>=end)return 'hit';
  state.deflected=true;return 'deflect';
}
