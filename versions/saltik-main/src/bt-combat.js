// BT is an independent arsenal. Clocks advance only with simulation time.
export const BT_TUNING=Object.freeze({capacity:8,acquire:.25,burstShots:3,burstDuration:.4,burstInterval:1.2,cannonDamage:3,missileDamage:8,blastRadius:45,refillDelay:5,refillInterval:2});
const EPS=1e-9;
export function initializeBT(p){
 if(p.character!=='bt')return null;
 return p.bt??={loaded:Array(8).fill(true),locks:[],locking:false,lockClock:0,missileHeld:false,fireHeld:false,panicHeld:false,suppressed:false,burstRemaining:0,burstClock:0,burstCooldown:0,refillClock:0,quiet:0,panicFlash:0,launchFlash:0,lastTube:-1};
}
export function stopBT(p){const s=initializeBT(p);if(!s)return;s.locks=[];s.locking=false;s.lockClock=0;s.missileHeld=false;s.fireHeld=false;s.panicHeld=false;s.suppressed=false;s.burstRemaining=0;s.burstClock=0;}
export function advanceBT(p,input,dt,{targets=[],shot,rocket,event=()=>{}}){
 const s=initializeBT(p);if(!s)return;
 const held=input.missileHeld??!!input.missile,fireHeld=input.fireHeld??!!input.fire,panic=!!input.homing;
 const release=!!input.missileReleased||s.missileHeld&&!held;
 const press=!!input.fire&&!s.fireHeld,available=()=>s.loaded.flatMap((loaded,i)=>loaded?[i]:[]);
 const live=targets.filter(t=>t.hp>0),valid=new Map(live.map(t=>[t.id,t]));
 s.panicFlash=Math.max(0,s.panicFlash-dt);s.launchFlash=Math.max(0,s.launchFlash-dt);s.burstCooldown=Math.max(0,s.burstCooldown-dt);
 s.locks=s.locks.filter(l=>valid.has(l.targetId));
 const launch=(tube,target,guided,index,count)=>{s.loaded[tube]=false;s.lastTube=tube;s.launchFlash=.18;s.quiet=0;s.refillClock=0;rocket({tube,targetId:target?.id,guided,index,count});};
 // Panic has priority over a release in the same frame.
 if(panic&&!s.panicHeld){
  const tubes=available();s.locks=[];s.lockClock=0;s.locking=false;s.suppressed=held;
  tubes.forEach((tube,index)=>launch(tube,null,false,index,tubes.length));
  if(tubes.length){s.panicFlash=.65;event('bt-panic');}else event('bt-empty');
 }else if(input.missileCancelled){s.locks=[];s.lockClock=0;s.locking=false;s.suppressed=held;}
 else if(release){
  if(!s.suppressed){const locks=s.locks.filter(l=>valid.has(l.targetId)),tubes=available();locks.slice(0,tubes.length).forEach((l,i)=>launch(tubes[i],valid.get(l.targetId),true,i,locks.length));if(locks.length)event('bt-launch');}
  s.locks=[];s.lockClock=0;s.locking=false;
 }else if(held&&!s.suppressed){
  s.locking=true;s.lockClock+=dt;
  while(s.lockClock>=BT_TUNING.acquire-EPS&&s.locks.length<available().length&&s.locks.length<8&&live.length){
   s.lockClock-=BT_TUNING.acquire;
   const counts=new Map();for(const l of s.locks)counts.set(l.targetId,(counts.get(l.targetId)??0)+1);
   const target=live.reduce((best,t)=>(counts.get(t.id)??0)<(counts.get(best.id)??0)?t:best,live[0]);
   s.locks.push({targetId:target.id});event('bt-lock');
  }
  // Do not bank acquisition time while there is nothing visible to acquire.
  if(!live.length||s.locks.length>=available().length)s.lockClock=0;
 }
 if(!held){s.suppressed=false;s.locking=false;}
 const blocked=p.turn?.active;
 if(blocked)s.burstRemaining=0;
 if(press&&!blocked&&s.burstCooldown<=EPS){s.burstCooldown=BT_TUNING.burstInterval;s.burstRemaining=3;s.burstClock=0;}
 if(s.burstRemaining){let at=s.burstClock;while(s.burstRemaining&&at<dt+EPS){shot();s.burstRemaining--;at+=BT_TUNING.burstDuration/2;}s.burstClock=at-dt;}
 // Reload only outside a lock session; stock belongs to real native tube slots.
 if(!s.locking){const old=s.quiet;s.quiet+=dt;const active=Math.max(0,s.quiet-BT_TUNING.refillDelay)-Math.max(0,old-BT_TUNING.refillDelay);s.refillClock+=active;while(s.refillClock>=BT_TUNING.refillInterval-EPS){const empty=s.loaded.indexOf(false);if(empty<0){s.refillClock=0;break;}s.loaded[empty]=true;s.refillClock-=BT_TUNING.refillInterval;event('bt-refill');}}
 s.aimPoints=s.locks.map(l=>valid.get(l.targetId)?.target).filter(Boolean);
 s.missileHeld=held;s.fireHeld=fireHeld;s.panicHeld=panic;
}
