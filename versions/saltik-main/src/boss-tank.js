// Native tank image: 1817 × 866, drawn at 370 × 176 with its tracks on b.y.
// Every world-space hull, roof and muzzle anchor is measured from that draw box.
export const BOSS_ARENA={minX:16400,maxX:17800};
export const BOSS_RIDER_DWELL=3.2;
export const BOSS_POD_WARNING=.72;
const BOSS_POD_FIRE_TIME=.24,BOSS_POD_RETRACT_TIME=.4;
const FIRST_POD_WAIT=2,CANNON_AFTER_POD=4.5,NEXT_POD_AFTER_LAUNCH=12,FALLBACK_CANNON_WAIT=5;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

// The renderer reads the same schedule as combat; no separate cannon timer.
export function bossCannonWarningProgress(b){
  const phase=b.weaponPhase;
  if(b.podDestroyed&&phase!=='fallback')return 0;
  const wait=phase==='after-pod'?CANNON_AFTER_POD:phase==='fallback'?FALLBACK_CANNON_WAIT:Infinity;
  const remaining=wait-(b.weaponElapsed??0);
  return remaining>0&&remaining<.65?1-remaining/.65:0;
}

export function bossGeometry(b){
  const x=b.x,y=b.y;
  const sprite={x:x-177,y:y-183,w:370,h:176};
  const hull={x:x-156,y:y-85,w:325,h:78};
  const front={x:x-177,y:y-111,w:54,h:98};
  const roof={x1:x-125,x2:x+147,y:y-85};
  const turretRoof={x1:x+17,x2:x+55,y:y-151};
  const turretPivot={x:x+35,y:y-96};
  const recoil=clamp(b.cannonRecoil||0,0,1);
  const muzzle=b.breached?{x:x-167+13*recoil,y:y-143}:{x:x-173+13*recoil,y:y-100};
  const podMount={x:x+95,y:y-151};
  // V2's launcher lifts from the native rear shoulder cassette on a short
  // armored guide. Combat and painting share this measured tube mouth.
  const podMuzzle={x:x+56,y:y-157-35*clamp(b.podRaise||0,0,1)};
  const access={x:x+35,y:y-151};
  const bounds={x:x-177,y:y-151,w:370,h:144};
  const hitBounds={x:x-156,y:y-85,w:325,h:78};
  const target={x:x-52,y:y-41};
  return {sprite,hull,front,roof,turretRoof,turretPivot,muzzle,podMount,podMuzzle,access,bounds,hitBounds,target};
}

export function bossRoofAt(b,x,preferred=null){
  if(!b||b.hp<=0)return null;
  const {roof,turretRoof}=bossGeometry(b);
  if(preferred==='deck'&&x>=roof.x1&&x<=roof.x2)return {...roof,id:'deck'};
  if(x>=turretRoof.x1&&x<=turretRoof.x2)return {...turretRoof,id:'turret'};
  if(x>=roof.x1&&x<=roof.x2)return {...roof,id:'deck'};
  return null;
}

export function createBossTank(x,groundAt){
  return {id:999,type:'boss',x,y:groundAt(x),hp:200,maxHp:200,phase:0,attack:0,hit:0,
    chargePhase:'idle',chargeClock:2.4,chargeElapsed:0,chargeDuration:0,chargeStartX:x,chargeTargetX:x,
    chargeProgress:0,chargeHit:false,dx:0,dy:0,turretSpin:0,riderTime:0,
    cannonRecoil:0,podRaise:0,podPhase:'stowed',podDestroyed:false,podFlash:0,podVolleysFired:0,
    weaponPhase:'pod-wait',weaponElapsed:0};
}

// A single clock owns both weapons. Pod painting follows the same elapsed
// time, so it cannot accidentally add a second independent firing timer.
export function advanceBossWeapons(b,dt,{targetInRange=true}={}){
  b.weaponPhase??='pod-wait';b.weaponElapsed??=0;
  if(b.podDestroyed){
    b.podPhase='destroyed';b.podRaise=0;b.podFlash=0;
    if(b.weaponPhase!=='fallback'){b.weaponPhase='fallback';b.weaponElapsed=0;return null;}
    b.weaponElapsed+=dt;
    if(b.weaponElapsed+1e-9>=FALLBACK_CANNON_WAIT){b.weaponElapsed-=FALLBACK_CANNON_WAIT;return 'cannon-volley';}
    return null;
  }
  b.weaponElapsed+=dt;
  if(b.weaponPhase==='pod-wait'||b.weaponPhase==='after-cannon'){
    const wait=b.weaponPhase==='pod-wait'?FIRST_POD_WAIT:NEXT_POD_AFTER_LAUNCH-CANNON_AFTER_POD;
    if(b.weaponElapsed+1e-9>=wait&&targetInRange){
      b.weaponPhase='pod-raising';b.weaponElapsed=0;b.podPhase='raising';b.podRaise=0;return 'pod-warning';
    }
  }else if(b.weaponPhase==='pod-raising'){
    b.podRaise=clamp(b.weaponElapsed/BOSS_POD_WARNING,0,1);
    if(b.podRaise>=1){
      b.weaponPhase='after-pod';b.weaponElapsed=0;b.podPhase='firing';b.podFlash=BOSS_POD_FIRE_TIME;
      return 'pod-volley';
    }
  }else if(b.weaponPhase==='after-pod'){
    const elapsed=b.weaponElapsed;
    b.podFlash=Math.max(0,BOSS_POD_FIRE_TIME-elapsed);
    if(elapsed<BOSS_POD_FIRE_TIME){b.podPhase='firing';b.podRaise=1;}
    else if(elapsed<BOSS_POD_FIRE_TIME+BOSS_POD_RETRACT_TIME){
      b.podPhase='retracting';b.podRaise=1-clamp((elapsed-BOSS_POD_FIRE_TIME)/BOSS_POD_RETRACT_TIME,0,1);
    }else{b.podPhase='stowed';b.podRaise=0;}
    if(elapsed+1e-9>=CANNON_AFTER_POD){
      b.weaponPhase='after-cannon';b.weaponElapsed=0;return 'cannon-volley';
    }
  }
  return null;
}

export function advanceBossTank(b,dt,{viewport,groundAt}){
  const priorX=b.x,priorY=b.y;
  b.phase=(b.phase||0)+dt;b.hit=Math.max(0,(b.hit||0)-dt);
  b.cannonRecoil=Math.max(0,(b.cannonRecoil||0)-dt/.2);
  if(!b.chargePhase)b.chargePhase='idle';
  if(b.chargePhase==='idle'){
    b.chargeClock=(b.chargeClock??2.4)-dt;
    if(b.chargeClock<=0){
      b.chargePhase='telegraph';b.chargeElapsed=0;b.chargeDuration=.85;
      b.chargeStartX=b.x;
      const visibleWidth=viewport?.w>0?viewport.w:1280;
      b.chargeTargetX=clamp(b.x-visibleWidth*.75,BOSS_ARENA.minX,BOSS_ARENA.maxX);
      b.chargeProgress=0;b.chargeHit=false;
    }
  }else{
    b.chargeElapsed=(b.chargeElapsed||0)+dt;
    if(b.chargePhase==='telegraph'&&b.chargeElapsed>=b.chargeDuration-1e-9){
      b.chargePhase='charge';b.chargeElapsed=0;b.chargeDuration=1.65/.85;
    }else if(b.chargePhase==='charge'){
      b.chargeProgress=b.chargeElapsed>=b.chargeDuration-1e-9?1:clamp(b.chargeElapsed/b.chargeDuration,0,1);
      b.x=b.chargeStartX+(b.chargeTargetX-b.chargeStartX)*b.chargeProgress;
      if(b.chargeProgress>=1){b.chargePhase='recover';b.chargeElapsed=0;b.chargeDuration=1.5;}
    }else if(b.chargePhase==='recover'){
      const t=b.chargeElapsed>=b.chargeDuration-1e-9?1:clamp(b.chargeElapsed/b.chargeDuration,0,1);
      b.x=b.chargeTargetX+(b.chargeStartX-b.chargeTargetX)*t;
      if(t>=1){b.chargePhase='idle';b.chargeElapsed=0;b.chargeClock=3.8;}
    }
  }
  b.x=clamp(b.x,BOSS_ARENA.minX,BOSS_ARENA.maxX);b.y=groundAt(b.x);
  b.dx=b.x-priorX;b.dy=b.y-priorY;
  return b;
}
