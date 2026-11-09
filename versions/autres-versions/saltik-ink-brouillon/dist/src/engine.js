// All positions use world units. The renderer alone knows pixels and camera offsets.
export const PARALLAX_LAYERS = Object.freeze([
  {name:'sky',speed:0.025},{name:'ridges',speed:0.075},
  {name:'cliffs',speed:0.16},{name:'waterfalls',speed:0.27},
  {name:'jungle',speed:0.42},{name:'ruins',speed:0.65},
  {name:'terrain',speed:1},{name:'foreground',speed:1.28}
]);
export const LEVEL_END=17800, BOSS_TRIGGER=16400;
export const MIRV_RECHARGE=5.2,HOMING_RECHARGE=9.5,MIRV_PREPARE=.24,PRIMARY_FIRE_TIME=3,PRIMARY_RELOAD=1.32;
export {EVASION_RECHARGE as SHIFT_RECHARGE} from './evasion.js';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export {terrainHeight,TIER_HEIGHT,surfaceHeight} from './world.js';
import {terrainHeight,terrainAt,TIER_HEIGHT,surfaceHeight,routeThickness,createRoutes,createObstacles,authorCheckpointGuards,supportHeight} from './world.js';
import {tachikomaGeometry,tachikomaMeleeReach} from './tachikoma-pose.js';
import {computeSupportPose} from './support-pose.js';
import {advanceWalkableSupport,walkableLanding} from './walkable-routes.js';
import {createMeleeState,beginMelee,advanceMelee,cancelMelee,MELEE_DAMAGE} from './melee-state.js';
import {createTachikomaTurn,advanceTachikomaTurn} from './tachikoma-turn.js';
import {enemyGeometry} from './enemy-art.js';
import {createEvasionState,beginEvasion,endEvasion,advanceEvasion,isEvasionProtected,createDeflectState,beginDeflect,advanceDeflect,resolveDeflectHit} from './evasion.js';
import {createBossTank,bossGeometry,bossRoofAt,advanceBossTank,advanceBossWeapons,BOSS_RIDER_DWELL} from './boss-tank.js';
import {createBossBreach,advanceBossBreach,BREACH_PHASE_SECONDS} from './boss-breach.js';
import {selectGuidedTargets,initializeGuidedShot,steerGuidedProjectile} from './guided-navigation.js';
import {createEnemySaltik,advanceEnemySaltik,SALTIK_GUARD_HP} from './enemy-saltik.js';
import {enemySaltikGeometry} from './enemy-saltik-art.js';
import {createSaltikDuel,advanceSaltikDuel} from './saltik-duel.js';
const HULL_HALF=58;
const PLAYER_COLLISION_SCALE=1.25;
// Artwork scale can change without changing the original combat ballistics.
const BULLET_SPEED=1025,MIRV_X=325,MIRV_Y=-600,MIRV_GRAVITY=125,GRENADE_GRAVITY=775,MIRV_SPLASH=147.5;
const WEAPONS={fire:'fireIn',missile:'mirvIn',homing:'homingIn'};
const CANNON_ELEVATION=Math.atan2(600,325);
export function clearPlayerWeaponQueue(p){
  p.weaponQueue={fire:false,missile:false,homing:false};
  p.weaponHeld={fire:false,missile:false,homing:false};
}
function random(g){g.seed=(Math.imul(g.seed,1664525)+1013904223)>>>0;return g.seed/4294967296;}
export function createGame({seed=92741,intro=false}={}) {
  // Armor stays on the canyon's 100-point scale; feet are the world-space y.
  const player={x:180,y:terrainHeight(180),vx:0,vy:0,dir:1,hp:100,maxHp:100,w:76*PLAYER_COLLISION_SCALE,h:54*PLAYER_COLLISION_SCALE,
    onGround:true,tier:0,platformId:null,obstacleId:null,bossSupport:null,bossPush:false,dropThrough:null,invulnerable:0,damagePose:false,
    fireIn:0,fireSpent:0,reloadIn:0,mirvIn:0,mirvPending:false,mirvPrepare:0,cannonElevation:0,cannonHold:0,homingIn:0,muzzle:0,mirvFlash:0,homingFlash:0,aim:0,crouching:false,
    evasion:createEvasionState(),shiftHeld:false,deflect:createDeflectState(),deflectHeld:false,tilt:0,landingCompression:0,supportY:terrainHeight(180),supportPose:null,supportClearance:Infinity,turn:null,melee:createMeleeState(),
    weaponQueue:{fire:false,missile:false,homing:false},weaponHeld:{fire:false,missile:false,homing:false}};
  const schedule=[];let id=10;
  for(let x=1350,i=0;x<16000;x+=680,i++){
    const type=['walker','drone','turret','soldier','drone'][i%5];
    schedule.push({id:id++,x,type});
    if(i%3===2)schedule.push({id:id++,x:x+260,type:'drone'});
    if(i%5===3)schedule.push({id:id++,x:x+380,type:'crate'});
  }
  const platforms=createRoutes(),obstacles=createObstacles(platforms);
  for(const p of platforms){const x=Math.min(p.x1+(p.tier===1?680:720),p.x2-90);schedule.push({id:id++,x,type:p.tier===1?'walker':'turret',tier:p.tier,platformId:p.id});}
  const guardedSchedule=authorCheckpointGuards(schedule,obstacles,platforms);
  // Replace existing ground heavy encounters; never add encounter density.
  const heavies=guardedSchedule.filter(e=>!e.platformId&&(e.type==='walker'||e.type==='turret'));
  for(const x of [5430,9510,13590]){
    const candidate=heavies.filter(e=>e.type!=='saltik').sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0];
    if(candidate)candidate.type='saltik';
  }
  const elevatedRepairs=platforms.map(p=>({x:p.x2-180,y:surfaceHeight(p,p.x2-180)-30,type:'repair'}));
  const viewport={x:player.x-360,y:0,w:1280,h:720};
  return {viewport,_defaultViewport:viewport,nextProjectileId:1,platforms,obstacles,status:'playing',time:0,introDuration:intro?2.2:0,introElapsed:0,seed,player,enemies:[],duel:null,duelInputSuspended:false,bossBreach:null,bossBreachUsed:false,bossPodUsed:false,bossPodLandedAt:null,bossBreachInputSuspended:false,bossActionHeld:false,bossActionSuspended:false,projectiles:[],events:[],pickups:[3600,7400,11600,15800].map(x=>({x,y:terrainHeight(x)-30,type:'repair'})).concat(elevatedRepairs),schedule:guardedSchedule,nextSpawn:0,boss:null,bossActivated:false,progress:0,maxX:180,jumpHeld:false,dropHeld:false,homingHeld:false,noTargetNotified:false,stats:{kills:0,shots:0,mirvs:0,homingSalvos:0,meleeSwings:0,meleeHits:0,interceptions:0,score:0,obstacles:0},shake:0,flash:0};
}
function emit(g,type,x,y,extra={}){g.events.push({type,x,y,...extra});}
function saltikVisible(g,e){
  const viewport=g.viewport;
  if(!viewport)return false;
  const r=enemySaltikGeometry(e,g.time).bounds;
  return r.x<viewport.x+viewport.w&&r.x+r.w>viewport.x&&
    r.y<viewport.y+viewport.h&&r.y+r.h>viewport.y;
}
function emitSaltikVoiceCues(g){
  for(const e of g.enemies){
    if(e.type!=='saltik'||e.hp<=0||!saltikVisible(g,e))continue;
    if(!e.voiceDetected){e.voiceDetected=true;emit(g,'saltik-detected',e.x,e.y-45,{enemyId:e.id});}
    if(e.guard&&!e.duelStarted&&!e.voiceGrabReady){
      e.voiceGrabReady=true;emit(g,'saltik-grab-ready',e.x,e.y-45,{enemyId:e.id});
    }
  }
}
export function combatBounds(e,time=0){if(e.type==='saltik')return enemySaltikGeometry(e,time).bounds;if(e.w&&e.h)return{x:e.x-e.w/2,y:e.y-e.h,w:e.w,h:e.h};if(e.type==='boss')return bossGeometry(e).hitBounds;if(e.type==='drone')return{x:e.x-34,y:e.y-22,w:68,h:44};if(e.type==='crate')return{x:e.x-24,y:e.y-47,w:48,h:47};return enemyGeometry(e)?.bounds??{x:e.x-34,y:e.y-70,w:68,h:70};}
const bounds=combatBounds;
// Slab intersection tests the entire motion segment, preventing tunnelling.
function segmentRectInterval(x0,y0,x1,y1,r,pad=0){
  let lo=0,hi=1;const dx=x1-x0,dy=y1-y0;
  for(const [origin,delta,min,max] of [[x0,dx,r.x-pad,r.x+r.w+pad],[y0,dy,r.y-pad,r.y+r.h+pad]]){
    if(Math.abs(delta)<1e-8){if(origin<min||origin>max)return null;continue;}
    const a=(min-origin)/delta,b=(max-origin)/delta;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi)return null;
  }return {entry:lo,exit:hi};
}
function segmentRect(x0,y0,x1,y1,r,pad=0){return segmentRectInterval(x0,y0,x1,y1,r,pad)?.entry??null;}
function playerCollisionFraction(x0,y0,x1,y1,r,pad,evasion,dt){
  const overlap=segmentRectInterval(x0,y0,x1,y1,r,pad);if(!overlap)return null;
  return isEvasionProtected(evasion,{dt,fraction:overlap.entry})?null:overlap.entry;
}
function hurtPlayer(g,damage,collision={}){const p=g.player;if(p.invulnerable>0||g.status!=='playing'||isEvasionProtected(p.evasion,collision))return;p.hp=Math.max(0,p.hp-damage);p.invulnerable=1.4;p.damagePose=true;g.shake=9;g.flash=.24;emit(g,'damage',p.x,p.y-35);if(p.hp===0){g.status='dead';cancelMelee(p.melee);emit(g,'explosion',p.x,p.y-30,{big:true});}}
function contactPlayer(g,damage,dt){
  // Body overlap is sampled after movement at this step's endpoint.
  const collision={dt,fraction:1};if(isEvasionProtected(g.player.evasion,collision))return;
  hurtPlayer(g,damage,collision);
}
function playerHitbox(p){return{x:p.x-22.5*PLAYER_COLLISION_SCALE,y:p.y-p.h/2-(p.crouching?10:19)*PLAYER_COLLISION_SCALE,w:45*PLAYER_COLLISION_SCALE,h:(p.crouching?20:38)*PLAYER_COLLISION_SCALE};}
function hurtEnemy(g,e,damage,{ranged=false}={}){
  if(e.hp<=0)return;
  if(e.type==='saltik'){
    if(e.guard||e.hp<=SALTIK_GUARD_HP){
      e.guard=true;
      if(ranged){
        e.guardCount=(e.guardCount??0)+1;e.guardResponse=e.guardCount%2?'deflect':'dodge';e.guardFlash=.25;
        emit(g,'enemy-deflect',e.x,e.y-43,{enemyId:e.id,response:e.guardResponse});
      }
      return;
    }
    e.hp=Math.max(SALTIK_GUARD_HP,e.hp-damage);e.hit=.09;
    if(e.hp===SALTIK_GUARD_HP){e.guard=true;e.guardFlash=.35;e.guardResponse='dodge';emit(g,'enemy-guard',e.x,e.y-43,{enemyId:e.id});}
    else emit(g,'spark',e.x,e.y-40);
    return;
  }
  e.hp-=damage;e.hit=.09;if(e.hp>0){emit(g,'spark',e.x,e.type==='drone'?e.y:e.y-40);return;}g.stats.kills++;g.stats.score+=e.type==='boss'?5000:e.type==='crate'?100:250;emit(g,'explosion',e.x,e.type==='drone'?e.y:e.y-35,{big:e.type==='boss'});g.shake=e.type==='boss'?22:5;
  if(e.type==='boss'){
    g.projectiles=[];g.progress=1;
    if(g.bossBreach){g.pendingVictory=true;return;}
    if(g.player.bossSupport||!g.player.onGround){
      if(g.player.bossSupport){g.player.bossSupport=null;g.player.onGround=false;g.player.vy=0;}
      g.pendingVictory=true;
    }
    else g.status='won';
  }
  else if(e.type==='crate'||g.stats.kills%7===0)g.pickups.push({x:e.x,y:e.y-30,type:'repair'});
}
function hurtObstacle(g,o,damage){
  if(o.hp<=0)return;o.hp=Math.max(0,o.hp-damage);o.hit=.12;
  if(o.hp){emit(g,'spark',o.x,o.y-o.h*.6);return;}
  g.stats.obstacles++;g.stats.score+=125;g.shake=6;
  emit(g,'debris',o.x,o.y-o.h*.5,{material:o.type});emit(g,'explosion',o.x,o.y-o.h*.5);
}
function hurtTarget(g,e,damage,options){if(e.w&&e.h)hurtObstacle(g,e,damage);else hurtEnemy(g,e,damage,options);}
function canGrapple(p,e){
  return e.type==='saltik'&&e.hp===SALTIK_GUARD_HP&&e.guard&&!e.duelStarted&&p.onGround&&!p.obstacleId&&
    (p.platformId??null)===(e.platformId??null)&&p.tier===(e.tier??0)&&
    Math.abs(p.x-e.x)<=75&&Math.abs(p.y-e.y)<=48;
}
function startDuel(g,e){
  const p=g.player;e.duelStarted=true;g.duel=createSaltikDuel(p,e);
  clearPlayerWeaponQueue(p);cancelMelee(p.melee);g.projectiles=[];
  if(p.evasion.active)endEvasion(p.evasion);
  if(p.deflect.active){p.deflect.active=false;p.deflect.elapsed=p.deflect.duration;}
  emit(g,'duel-start',g.duel.x,g.duel.y,{enemyId:e.id});
}
function finishDuelEnemy(g,enemyId){
  const e=g.enemies.find(enemy=>enemy.id===enemyId);
  if(!e||e.hp<=0||e.duelFinished)return;
  e.duelFinished=true;e.hp=0;g.stats.kills++;g.stats.score+=250;g.shake=Math.max(g.shake,9);
}
const targetY=e=>e.type==='saltik'?enemySaltikGeometry(e).targetY:e.w?e.y-e.h*.65:e.type==='drone'?e.y:e.type==='boss'?bossGeometry(e).target.y:enemyGeometry(e)?.targetY??e.y-38;
const allTargets=g=>[...g.obstacles,...g.enemies,...(g.boss&&g.boss.hp>0?[g.boss]:[])];
const targetKey=e=>`${e.w&&e.h?'obstacle':e.type==='boss'?'boss':'enemy'}:${e.id}`;
function reachable(g,target,reach){
  const p=g.player,r=bounds(target);
  if(target.hp<=0||(target.x-p.x)*p.dir<=0)return false;
  const dx=Math.max(r.x-reach.fist.x,0,reach.fist.x-r.x-r.w),dy=Math.max(r.y-reach.fist.y,0,reach.fist.y-r.y-r.h);
  if(Math.hypot(dx,dy)>reach.radius)return false;
  const end=segmentRect(reach.origin.x,reach.origin.y,reach.fist.x,reach.fist.y,r)??1;
  return !g.obstacles.some(o=>{
    if(o===target||o.hp<=0)return false;
    const hit=segmentRect(reach.origin.x,reach.origin.y,reach.fist.x,reach.fist.y,bounds(o));
    return hit!==null&&hit<end;
  });
}
function shoveEnemy(g,e){
  if(e.hp<=0||e.w&&e.h||e.type==='boss'||e.type==='crate')return;
  const ledge=g.platforms.find(a=>a.id===e.platformId),push=18*g.player.dir;
  e.x=ledge?clamp(e.x+push,ledge.x1+50,ledge.x2-50):e.x+push;
  if(e.type==='drone'){e.origin=(e.origin??e.x-push)+push;return;}
  e.y=ledge?surfaceHeight(ledge,e.x):terrainAt(g,e.x);
}
function updatePlayerMelee(g){
  const p=g.player,state=p.melee;
  if(p.evasion?.active||p.deflect?.active||p.turn?.active||g.status!=='playing'){cancelMelee(state);return;}
  const reach=tachikomaMeleeReach(p,g.time);
  if(state.phase==='idle'&&state.cooldown<=0){
    const candidates=allTargets(g).filter(e=>reachable(g,e,reach));
    candidates.sort((a,b)=>Math.abs(a.x-reach.origin.x)-Math.abs(b.x-reach.origin.x));
    if(candidates.length){beginMelee(state,targetKey(candidates[0]));g.stats.meleeSwings++;emit(g,'melee',reach.fist.x,reach.fist.y,{dir:p.dir});}
  }
  if(state.phase==='impact'&&!state.hit){
    state.hit=true;
    const target=allTargets(g).find(e=>targetKey(e)===state.targetKey);
    if(target&&reachable(g,target,reach)){
      hurtTarget(g,target,MELEE_DAMAGE);
      if(!(target.type==='saltik'&&target.guard))shoveEnemy(g,target);
      g.stats.meleeHits++;
      g.shake=Math.max(g.shake,3);emit(g,'melee-hit',reach.fist.x,reach.fist.y,{dir:p.dir});
    }
  }
}
const meleeGuard=(p,e)=>p.melee.phase==='windup'&&p.melee.targetKey===targetKey(e);
function pointDefenseAim(g,mount){
  const p=g.player,candidates=[],viewport=g.viewport;
  for(const shot of g.projectiles){
    if(shot.team!=='enemy'||shot.kind!=='enemy-missile'||shot.life<=0||(shot.hp??1)<=0)continue;
    const radius=shot.radius??6;
    if(viewport&&(shot.x+radius<viewport.x-40||shot.x-radius>viewport.x+viewport.w+40||shot.y+radius<viewport.y-40||shot.y-radius>viewport.y+viewport.h+40))continue;
    const x=shot.x-mount.x,y=shot.y-mount.y,forward=x*p.dir,range=Math.hypot(x,y);
    if(forward<8||range>950||Math.abs(y)>Math.max(120,forward*.9)||x*shot.vx+y*shot.vy>=0)continue;
    const a=shot.vx**2+shot.vy**2-BULLET_SPEED**2,b=2*(x*shot.vx+y*shot.vy),c=x*x+y*y;
    const discriminant=b*b-4*a*c;if(discriminant<0)continue;
    const flight=(-b-Math.sqrt(discriminant))/(2*a);
    if(!(flight>=0)||flight>shot.life)continue;
    candidates.push({x:shot.x+shot.vx*flight,y:shot.y+shot.vy*flight,range});
  }
  if(!candidates.length)return null;
  const context=navigationContext(g);
  for(const target of candidates.sort((a,b)=>a.range-b.range)){
    if(context.blockers.some(r=>segmentRect(mount.x,mount.y,target.x,target.y,r,3)!==null))continue;
    const steps=Math.max(1,Math.ceil(Math.hypot(target.x-mount.x,target.y-mount.y)/16));
    let clear=true;
    for(let i=0;i<=steps;i++){
      const t=i/steps,x=mount.x+(target.x-mount.x)*t,y=mount.y+(target.y-mount.y)*t;
      if(y+3>=terrainAt(g,x)){clear=false;break;}
    }
    if(clear)return Math.atan2(target.y-mount.y,target.x-mount.x);
  }
  return null;
}
function aim(g,mount){
  const p=g.player;let angle=p.dir===1?0:Math.PI,best=Infinity;
  if(p.bossSupport&&g.boss?.hp>0){
    const target=bossGeometry(g.boss).target;
    p.aim=Math.atan2(target.y-mount.y,target.x-mount.x);
    return p.aim;
  }
  const defense=pointDefenseAim(g,mount);
  if(defense!==null){p.aim=defense;return defense;}
  // Same forward cone and distance + vertical-offset weighting as Tachikoma.
  for(const e of allTargets(g)){
    if(e.hp<=0)continue;
    const dx=(e.x-mount.x)*p.dir,dy=targetY(e)-mount.y,score=dx+Math.abs(dy)*.3;
    if(dx>25&&dx<1050&&Math.abs(dy)<Math.max(100,dx*.7)&&score<best){best=score;angle=Math.atan2(dy,e.x-mount.x);}
  }
  p.aim=angle;return angle;
}
function projectile(g,mount,values){
  const shot={id:g.nextProjectileId++,x:mount.x,y:mount.y,launchX:mount.x,launchY:mount.y,team:'player',age:0,...values};
  g.projectiles.push(shot);return shot;
}
function shoot(g){
  const p=g.player,mount=(g.weaponGeometry?.(p,g.time)??tachikomaGeometry(p,g.time)).arm,a=aim(g,mount),speed=BULLET_SPEED;
  projectile(g,mount,{vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,damage:1,life:1.5,radius:3,kind:'bullet'});
  p.muzzle=.07;p.fireIn=.095;g.stats.shots++;emit(g,'shot',mount.x,mount.y,{dir:p.dir});
}
function launchMirv(g){
  const p=g.player,pose=g.weaponGeometry?.(p,g.time)??tachikomaGeometry(p,g.time),mount=pose.cannon;
  const direction=pose.cannonDirection;
  const speed=Math.hypot(MIRV_X,MIRV_Y);
  projectile(g,mount,{kind:'mirv',vx:direction.x*speed,vy:direction.y*speed,
    dir:p.dir,damage:9,life:4,radius:6,splash:MIRV_SPLASH,trail:[{...mount}]});
  p.mirvPending=false;p.mirvPrepare=0;p.cannonHold=.12;
  p.mirvIn=MIRV_RECHARGE;p.mirvFlash=.18;g.stats.mirvs++;emit(g,'missile',mount.x,mount.y,{dir:p.dir});
}
export function combatTarget(e,time=0){
  const geometry=e.type==='saltik'?enemySaltikGeometry(e,time):enemyGeometry(e,time);
  const rect=bounds(e,time),target=geometry?.target??{x:e.x,y:targetY(e)};
  return {id:e.id,type:e.type,hp:e.hp,x:e.x,y:e.y,vx:e.vx??0,vy:e.vy??0,bounds:rect,target};
}
export function navigationContext(g){
  const blockers=g.obstacles.filter(o=>o.hp>0).map(o=>({...bounds(o),id:o.id,material:o.type,obstacle:true}));
  for(const route of g.platforms){
    const count=Math.ceil((route.x2-route.x1)/40),width=(route.x2-route.x1)/count;
    for(let i=0;i<count;i++){
      const x=route.x1+i*width,right=x+width,mid=(x+right)/2;
      const y=Math.min(surfaceHeight(route,x),surfaceHeight(route,mid),surfaceHeight(route,right));
      const bottom=Math.max(...[x,mid,right].map(xx=>surfaceHeight(route,xx)+routeThickness(route,xx)));
      blockers.push({x,y,w:width,h:bottom-y,id:route.id,material:route.material});
    }
  }
  return {targets:[...g.enemies,...(g.boss&&g.boss.hp>0?[g.boss]:[])].filter(e=>e.hp>0&&e.type!=='crate').map(e=>combatTarget(e,g.time)),
    projectiles:g.projectiles,viewport:g.viewport??{x:g.player.x-360,y:0,w:1280,h:720},blockers,groundAt:g.groundAt??terrainHeight};
}
function launchHoming(g){
  const p=g.player,pose=g.weaponGeometry?.(p,g.time)??tachikomaGeometry(p,g.time),context=navigationContext(g);
  const targets=selectGuidedTargets(context.targets,{x:p.x,y:p.y},context.viewport);
  if(!targets.length){
    if(!g.noTargetNotified)emit(g,'no-target',p.x,p.y-100);
    g.noTargetNotified=true;return;
  }
  for(const [i,tube] of pose.cabinTubes.entries()){
    const dx=tube.muzzle.x-tube.base.x,dy=tube.muzzle.y-tube.base.y,d=Math.hypot(dx,dy);
    const shot=projectile(g,tube.muzzle,{kind:'homing',vx:dx/d*390,vy:dy/d*390,damage:8,life:6.5,radius:5,splash:45,
      targetId:targets[i%targets.length].id,salvoIndex:i,salvoCount:3,trail:[{...tube.muzzle}]});
    initializeGuidedShot(shot,{index:i,count:3,target:targets[i%targets.length],context});
  }
  p.homingIn=HOMING_RECHARGE;p.homingFlash=.22;g.stats.homingSalvos++;emit(g,'homing',pose.tubes[1].x,pose.tubes[1].y);
}
function hostileShot(g,e,spread=0,speed=285){
 const p=g.player;if(g.enemyWeaponGeometry&&e.type!=='boss')e.dir=p.x>=e.x?1:-1;
 if(g.enemyWeaponGeometry&&e.type==='drone')e.aimRotation=0;
 let geometry=g.enemyWeaponGeometry?.(e,g.time)??(e.type==='boss'?bossGeometry(e):enemyGeometry(e,g.time));
 if(g.enemyWeaponGeometry&&e.type==='drone'&&geometry?.muzzleDirection){
  // Tilting moves the native mouth as well as its axis. Re-measure the same
  // painted geometry so the airborne attacker retains V1 ground targeting.
  for(let i=0;i<4;i++){
   const axis=geometry.muzzleDirection,mouth=geometry.muzzle;
   const delta=Math.atan2(p.y-32-mouth.y,p.x-mouth.x)-Math.atan2(axis.y,axis.x);
   e.aimRotation+=Math.atan2(Math.sin(delta),Math.cos(delta));
   geometry=g.enemyWeaponGeometry(e,g.time);
  }
 }
 const mount=geometry?.muzzle,axis=geometry?.muzzleDirection,x=mount?.x??e.x-32,y=mount?.y??(e.type==='drone'?e.y:e.y-43);
 const a=(axis?Math.atan2(axis.y,axis.x):Math.atan2(p.y-32-y,p.x-x))+spread;
 g.projectiles.push({id:g.nextProjectileId++,x,y,launchX:x,launchY:y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,team:'enemy',damage:e.type==='boss'?12:8,life:5,radius:e.type==='boss'?8:5,kind:'plasma'});emit(g,'enemyshot',x,y);
}
function bossRocketVolley(g,b){
  const mouth=bossGeometry(b).podMuzzle;
  for(const vy of [-165,-125,-85,-45,-5,35,75,115]){
    g.projectiles.push({id:g.nextProjectileId++,kind:'enemy-missile',team:'enemy',x:mouth.x,y:mouth.y,
      launchX:mouth.x,launchY:mouth.y,vx:-225,vy,damage:9,radius:6,life:5,hp:1,
      locking:true,age:0,trail:[{...mouth}]});
  }
  b.podVolleysFired++;
  emit(g,'boss-pod-volley',mouth.x,mouth.y,{count:8});
}
function spawn(g,s){
  const route=g.platforms.find(p=>p.id===s.platformId),y=s.type==='drone'?terrainAt(g,s.x)-140:route?surfaceHeight(route,s.x):terrainAt(g,s.x);
  if(s.type==='saltik'){g.enemies.push(createEnemySaltik(s,{y,random:random(g)}));return;}
  const hp={walker:5,soldier:5,drone:3,turret:9,crate:3}[s.type];
  g.enemies.push({...s,y,origin:s.x,hp,maxHp:hp,cooldown:1.5+random(g)*1.4,phase:random(g)*6.28,hit:0,firePose:0});
}
function obstacleHasWheelSupport(p,o){
  const top=o.y-o.h,pose=computeSupportPose({...p,y:top,onGround:true,turn:null,supportClearance:Infinity},
    x=>x>=o.x-o.w/2&&x<=o.x+o.w/2?top:null,null,0);
  return pose.contacts.some(contact=>contact.grounded);
}
function movePlayer(g,input,dt){
  const p=g.player;
  if(p.bossSupport&&g.boss?.hp>0){p.x+=g.boss.dx||0;p.y+=g.boss.dy||0;}
  const oldX=p.x,oldY=p.y;
  const jumpNow=input.jump&&!g.jumpHeld;
  p.crouching=!!input.crouch&&p.onGround&&!jumpNow;p.h=(p.crouching?30:54)*PLAYER_COLLISION_SCALE;
  const move=(input.right?1:0)-(input.left?1:0);p.turn??=createTachikomaTurn(p.dir);
  p.vx=move*(p.crouching?100:230);if(move)p.dir=move;advanceTachikomaTurn(p.turn,p.dir,dt);
  const dropping=input.drop&&!g.dropHeld&&p.onGround&&(p.platformId||p.bossSupport||p.rampId);
  if(dropping){p.dropThrough=p.rampId||p.platformId||`boss:${p.bossSupport}`;p.rampId=null;p.platformId=null;p.bossSupport=null;p.onGround=false;p.vy=45;emit(g,'drop',p.x,p.y);}
  // Original immediate jump response; canyon gravity/apex retain all 3 routes.
  else if(jumpNow&&p.onGround){p.vy=-720;p.onGround=false;p.rampId=null;p.platformId=null;p.obstacleId=null;p.bossSupport=null;p.landingCompression=0;emit(g,'jump',p.x,p.y);}
  g.jumpHeld=!!input.jump;g.dropHeld=!!input.drop;
  if(p.bossEject?.time>0){p.vx=p.bossEject.vx;p.bossEject.time=Math.max(0,p.bossEject.time-dt);}
  p.x=clamp(p.x+p.vx*dt,70,LEVEL_END-150);
  if(p.bossPush&&g.boss?.hp>0){
    if(g.boss.dx<0&&!input.shift){p.x=bossGeometry(g.boss).front.x-HULL_HALF;p.vx=g.boss.dx/dt;}
    else p.bossPush=false;
  }
  if(g.boss?.hp>0&&!isEvasionProtected(p.evasion)){
    const r=bossGeometry(g.boss).front;
    const playerTop=Math.min(oldY,p.y)-p.h,playerBottom=Math.max(oldY,p.y)-4;
    if(playerBottom>r.y&&playerTop<r.y+r.h&&!p.bossSupport){
      if(oldX+HULL_HALF<=r.x+.01&&p.x+HULL_HALF>r.x){p.x=r.x-HULL_HALF;p.vx=0;}
      else if(oldX-HULL_HALF>=r.x+r.w-.01&&p.x-HULL_HALF<r.x+r.w){p.x=r.x+r.w+HULL_HALF;p.vx=0;}
    }
  }
  const solids=g.obstacles.filter(o=>o.hp>0&&Math.abs(o.x-p.x)<220);
  for(const o of solids){const r=bounds(o);if(oldY-4<=r.y||oldY-p.h>=r.y+r.h)continue;
    if(oldX+HULL_HALF<=r.x+.01&&p.x+HULL_HALF>r.x){p.x=r.x-HULL_HALF;p.vx=0;}
    else if(oldX-HULL_HALF>=r.x+r.w-.01&&p.x-HULL_HALF<r.x+r.w){p.x=r.x+r.w+HULL_HALF;p.vx=0;}
  }
  const stairY=advanceWalkableSupport(g,p,oldX,oldY,{surfaceHeight,terrainAt});
  // Existing support follows its contour; walking across a stair junction keeps contact.
  const support=g.platforms.find(a=>a.id===p.platformId&&p.x>=a.x1&&p.x<=a.x2);
  const obstacleSupport=solids.find(o=>o.id===p.obstacleId&&obstacleHasWheelSupport(p,o));
  const tankRoof=p.bossSupport?bossRoofAt(g.boss,p.x,p.bossSupport):null;
  if(p.onGround&&p.platformId&&!support){p.onGround=false;p.platformId=null;}
  if(p.onGround&&p.obstacleId&&!obstacleSupport){p.onGround=false;p.obstacleId=null;}
  if(p.onGround&&p.bossSupport&&tankRoof?.id!==p.bossSupport){p.onGround=false;p.bossSupport=null;}
  if(p.onGround){p.y=stairY??(p.bossSupport&&tankRoof?.id===p.bossSupport?tankRoof.y:obstacleSupport?obstacleSupport.y-obstacleSupport.h:support?surfaceHeight(support,p.x):terrainAt(g,p.x));p.vy=0;}
  else {
    p.vy+=1550*dt;p.y+=p.vy*dt;
    // Crates are solid underneath as well as at their sides and tops.
    if(p.vy<0)for(const o of solids){if(Math.abs(p.x-o.x)>=o.w/2+HULL_HALF-8)continue;if(oldY-p.h>=o.y&&p.y-p.h<o.y){p.y=o.y+p.h;p.vy=0;}}
    if(p.vy>=0){let landing={y:terrainAt(g,p.x),tier:0,id:null,obstacleId:null,bossSupport:null};
      for(const a of g.platforms){if(a.id===p.dropThrough||p.x<a.x1||p.x>a.x2)continue;const y=surfaceHeight(a,p.x);if(oldY<=surfaceHeight(a,oldX)+1&&p.y>=y&&y<landing.y)landing={y,tier:a.tier,id:a.id,obstacleId:null};}
      for(const stair of walkableLanding(g,p,oldX,oldY))if(stair.y<landing.y)landing=stair;
      for(const o of solids){const y=o.y-o.h;if(oldY<=y+1&&p.y>=y&&y<landing.y&&obstacleHasWheelSupport(p,o))landing={y,tier:o.tier,id:null,obstacleId:o.id};}
      const roof=bossRoofAt(g.boss,p.x);
      if(roof&&!p.bossEject?.clearTank&&p.dropThrough!==`boss:${roof.id}`&&oldY<=roof.y+1&&p.y>=roof.y&&roof.y<landing.y)landing={y:roof.y,tier:0,id:null,obstacleId:null,bossSupport:roof.id};
      if(p.y>=landing.y){if(p.vy>200){p.landingCompression=clamp(p.vy/520,.35,1);emit(g,'land',p.x,landing.y);}p.y=landing.y;p.vy=0;p.onGround=true;p.tier=landing.tier;p.platformId=landing.id;p.obstacleId=landing.obstacleId;p.bossSupport=landing.bossSupport;p.rampId=landing.rampId??null;}
    }
  }
  if(p.onGround&&p.bossEject)p.bossEject.clearTank=false;
  if(p.dropThrough){
    if(p.dropThrough.startsWith('boss:')){if(!g.boss||p.y>bossGeometry(g.boss).roof.y+12)p.dropThrough=null;}
    else {const ignored=g.platforms.find(a=>a.id===p.dropThrough);const stair=g.platforms.flatMap(a=>a.walkableEntries??[]).find(a=>a.id===p.dropThrough);if(stair){if(p.y>Math.max(...stair.points.map(point=>point[1]))+12)p.dropThrough=null;}else if(!ignored||p.y>surfaceHeight(ignored,p.x)+12)p.dropThrough=null;}
  }
  // Support stays on the same physical floor during every evasion pose.
  const floors=[terrainAt(g,p.x),...g.platforms.filter(a=>a.id!==p.dropThrough&&p.x>=a.x1&&p.x<=a.x2).map(a=>surfaceHeight(a,p.x)),
    ...solids.filter(o=>obstacleHasWheelSupport(p,o)).map(o=>o.y-o.h),bossRoofAt(g.boss,p.x)?.y].filter(Number.isFinite);
  p.supportY=p.onGround?p.y:Math.min(...floors.filter(y=>y>=p.y-1));
  if(!Number.isFinite(p.supportY))p.supportY=terrainAt(g,p.x);
  p.supportClearance=Infinity;
  if(p.onGround)for(const roof of g.platforms){
    if(roof.id===p.platformId||roof.walkableEntries?.some(entry=>entry.id===p.rampId))continue;
    for(const x of [p.x-58,p.x,p.x+58]){
      if(x<roof.x1||x>roof.x2)continue;
      const crown=surfaceHeight(roof,x),ceiling=crown+routeThickness(roof,x);
      if(crown<p.y-1&&ceiling<p.y)p.supportClearance=Math.min(p.supportClearance,p.y-ceiling);
    }
  }
  p.supportPose=computeSupportPose(p,x=>supportHeight(g,p,x),p.supportPose,dt,{retainSurface:!!g.inkCampaign});p.tilt=p.supportPose.tilt;
}

function updateBossRider(g,dt){
  const b=g.boss,p=g.player;
  if(!b||b.hp<=0)return;
  if(!p.bossSupport){b.riderTime=0;b.turretSpin=Math.max(0,(b.turretSpin||0)-dt*3.5);return;}
  b.riderTime=(b.riderTime||0)+dt;
  if(b.riderTime>=BOSS_RIDER_DWELL-.25)b.turretSpin=Math.min(1.05,(b.riderTime-(BOSS_RIDER_DWELL-.25))/.25*1.05);
  if(b.riderTime<BOSS_RIDER_DWELL)return;
  p.bossSupport=null;p.onGround=false;p.vy=-520;p.bossEject={vx:-460,time:.72,clearTank:true};
  p.invulnerable=Math.max(p.invulnerable,1.1);
  b.riderTime=0;emit(g,'boss-eject',p.x,p.y-50);
}

function chargeNoseContact(g,playerStart,dt){
  const b=g.boss,p=g.player;
  const travelling=b&&(b.chargePhase==='charge'||(b.chargePhase==='recover'&&b.dx<0));
  if(!b||b.hp<=0||!travelling||b.chargeHit||p.bossSupport||p.bossEject?.time>0||isEvasionProtected(p.evasion))return;
  const roof=bossGeometry(b).roof;
  if(Math.min(playerStart.y-(b.y-b.dy),p.y-b.y)<=roof.y-b.y-4)return;
  const relativeNose={x:-177,y:-111,w:54,h:98};
  const impact=segmentRectInterval(playerStart.x-(b.x-b.dx),playerStart.y-(b.y-b.dy)-35,
    p.x-b.x,p.y-b.y-35,relativeNose,HULL_HALF);
  if(!impact)return;
  b.chargeHit=true;p.bossPush=true;p.x=bossGeometry(b).front.x-HULL_HALF;
  if(p.onGround){p.y=terrainAt(g,p.x);p.supportY=p.y;p.supportPose=computeSupportPose(p,x=>supportHeight(g,p,x),p.supportPose,dt);}
  hurtPlayer(g,15,{dt,fraction:impact.entry});
}

function updatePlayerWeapons(g,input,dt){
  const p=g.player,defending=p.evasion.active||p.deflect.active,locked=defending||p.turn.active;
  const wasReloading=p.reloadIn>0,oldReload=p.reloadIn;
  let available=dt;
  if(wasReloading){
    p.weaponQueue.fire=false;p.reloadIn=Math.max(0,p.reloadIn-dt);available=Math.max(0,dt-oldReload);
    if(p.reloadIn<1e-9){p.reloadIn=0;p.fireSpent=0;emit(g,'reload-end',p.x,p.y-45);}
  }
  const previousFireIn=p.fireIn;p.fireIn=Math.max(0,p.fireIn-dt);
  for(const [action,recharge] of Object.entries(WEAPONS)){
    const held=!!input[action],pressed=held&&!p.weaponHeld[action];
    if(defending)p.weaponQueue[action]=false;
    else if(action==='fire'&&wasReloading)p.weaponQueue.fire=false;
    else if(p.turn.active){if(pressed&&p[recharge]<=0)p.weaponQueue[action]=true;}
    if(!locked&&(held||p.weaponQueue[action])&&!(action==='fire'&&wasReloading&&input.fireHeld===false)){
      if(action==='fire'&&p.reloadIn===0&&available>1e-9){
        p.weaponQueue.fire=false;
        const eligible=Math.min(available,PRIMARY_FIRE_TIME-p.fireSpent),start=dt-available;
        let shotAt=Math.max(start,previousFireIn);
        while(shotAt<start+eligible-1e-9){shoot(g);p.fireIn=Math.max(0,.095-(dt-shotAt));shotAt+=.095;}
        p.fireSpent=Math.min(PRIMARY_FIRE_TIME,p.fireSpent+eligible);
        if(p.fireSpent>=PRIMARY_FIRE_TIME-1e-9){
          p.fireSpent=PRIMARY_FIRE_TIME;p.reloadIn=PRIMARY_RELOAD;p.weaponQueue.fire=false;emit(g,'reload-start',p.x,p.y-45);
        }
      }else if(action==='missile'&&p.mirvIn<=0&&!p.mirvPending){
        p.weaponQueue.missile=false;p.mirvPending=true;p.mirvPrepare=MIRV_PREPARE;p.cannonHold=0;
      }else if(action==='homing'&&p.homingIn<=0){p.weaponQueue.homing=false;launchHoming(g);}
    }
    p.weaponHeld[action]=held;
  }
  if(locked&&p.mirvPending){p.mirvPending=false;p.mirvPrepare=0;p.cannonHold=0;}
  if(p.mirvPending){
    p.mirvPrepare=Math.max(0,p.mirvPrepare-dt);p.cannonElevation=CANNON_ELEVATION*(1-p.mirvPrepare/MIRV_PREPARE);
    if(p.mirvPrepare<=1e-9){p.cannonElevation=CANNON_ELEVATION;launchMirv(g);}
  }else if(p.cannonHold>0)p.cannonHold=Math.max(0,p.cannonHold-dt);
  else p.cannonElevation=Math.max(0,p.cannonElevation-CANNON_ELEVATION*dt/.20);
}
function areaBlast(g,x,y,radius,damage,{fraction=1,dt=0,team='player'}={}){
  emit(g,'explosion',x,y,{radius});g.shake=Math.max(g.shake,7);
  if(team==='enemy'){
    const r=playerHitbox(g.player),dx=Math.max(r.x-x,0,x-r.x-r.w),dy=Math.max(r.y-y,0,y-r.y-r.h);
    if(Math.hypot(dx,dy)<=radius)hurtPlayer(g,damage,{dt,fraction});
    return;
  }
  for(const target of allTargets(g)){
    if(target.hp<=0)continue;const r=bounds(target);
    const dx=Math.max(r.x-x,0,x-r.x-r.w),dy=Math.max(r.y-y,0,y-r.y-r.h);
    if(Math.hypot(dx,dy)<=radius)hurtTarget(g,target,damage,{ranged:true});
  }
  // The original MIRV's blast also clears hostile bullets in its radius.
  for(const shot of g.projectiles){
    const segment=shot._segment,xx=segment?segment.x0+(segment.x1-segment.x0)*fraction:shot.x,yy=segment?segment.y0+(segment.y1-segment.y0)*fraction:shot.y;
    if(shot.team==='enemy'&&shot.life>0&&Math.hypot(xx-x,yy-y)<=radius+(shot.radius||0)){
      if(shot.kind==='enemy-missile'){
        shot.hp=0;g.stats.interceptions++;emit(g,'intercept',xx,yy);
      }
      shot.life=0;
    }
  }
}
function terrainImpact(g,x0,y0,x1,y1,groundOffset=3){
  let closest=null;
  const surfaces=[null,...(y1>y0?g.platforms:[])],steps=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)/12));
  for(const surface of surfaces){
    const floor=x=>surface?surfaceHeight(surface,x):terrainAt(g,x)-groundOffset;
    const valid=x=>!surface||(x>=surface.x1&&x<=surface.x2);
    let previous=y0-floor(x0),previousT=0,previousX=x0;
    if(!surface&&previous>=0){closest=0;break;}
    for(let i=1;i<=steps;i++){
      const t=i/steps,x=x0+(x1-x0)*t,y=y0+(y1-y0)*t,value=y-floor(x);
      if(valid(x)&&valid(previousX)&&previous<=0&&value>=0){
        let lo=previousT,hi=t;
        for(let j=0;j<8;j++){const mid=(lo+hi)/2,xx=x0+(x1-x0)*mid,yy=y0+(y1-y0)*mid;if(yy>=floor(xx))hi=mid;else lo=mid;}
        if(closest===null||hi<closest)closest=hi;break;
      }
      previous=value;previousT=t;previousX=x;
    }
  }
  return closest;
}
function steerHostileMissile(g,shot,dt){
  if(shot.age<=.10)return;
  const p=g.player,heading=Math.atan2(shot.vy,shot.vx),goal=Math.atan2(p.y-35-shot.y,p.x-shot.x);
  const error=Math.atan2(Math.sin(goal-heading),Math.cos(goal-heading)),angle=heading+clamp(error,-2.5*dt,2.5*dt);
  const speed=Math.min(310,Math.max(180,Math.hypot(shot.vx,shot.vy))+dt*100);
  shot.vx=Math.cos(angle)*speed;shot.vy=Math.sin(angle)*speed;
}
function relativeImpact(a,b){
  const aa=a._segment,bb=b._segment,rx=aa.x0-bb.x0,ry=aa.y0-bb.y0;
  const vx=(aa.x1-aa.x0)-(bb.x1-bb.x0),vy=(aa.y1-aa.y0)-(bb.y1-bb.y0),radius=(a.radius||0)+(b.radius||0);
  const c=rx*rx+ry*ry-radius*radius;if(c<=0)return 0;
  const quadratic=vx*vx+vy*vy;if(quadratic<1e-12)return null;
  const linear=2*(rx*vx+ry*vy),discriminant=linear*linear-4*quadratic*c;
  if(discriminant<0)return null;const fraction=(-linear-Math.sqrt(discriminant))/(2*quadratic);
  return fraction>=0&&fraction<=1?fraction:null;
}
function updateProjectiles(g,dt,playerMovement){
  const children=[],p=g.player,context=navigationContext(g),collisions=[],resolved=new Set();
  const hitbox=playerHitbox(p);
  const startHitbox={...hitbox,x:hitbox.x-playerMovement.x,y:hitbox.y-playerMovement.y};
  for(const shot of g.projectiles){
    if(shot.life<=0)continue;
    if(!Number.isInteger(shot.id))shot.id=g.nextProjectileId++;
    else g.nextProjectileId=Math.max(g.nextProjectileId,shot.id+1);
    const x0=shot.x,y0=shot.y,lifetime=shot.life;shot.age=(shot.age||0)+dt;shot.life=Math.max(1e-9,lifetime-dt);
    if(lifetime<=dt)collisions.push({fraction:lifetime/dt,kind:'expire',shot});
    if(shot.kind==='mirv')shot.vy+=MIRV_GRAVITY*dt;
    else if(shot.kind==='grenade')shot.vy+=GRENADE_GRAVITY*dt;
    else if(shot.kind==='homing')steerGuidedProjectile(shot,context,dt);
    else if(shot.kind==='enemy-missile')steerHostileMissile(g,shot,dt);
    shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;
    shot._segment={x0,y0,x1:shot.x,y1:shot.y};
    if(shot.trail){shot.trail.push({x:shot.x,y:shot.y});if(shot.trail.length>18)shot.trail.shift();}
    // MIRV carrier preserves its original uninterrupted deployment phase.
    if(shot.kind==='mirv'){
      if(shot.age>=.72||shot.y<48){
        for(let i=0;i<5;i++)children.push({id:g.nextProjectileId++,kind:'grenade',team:'player',x:shot.x,y:shot.y,vx:(-81.25+i*125)*(shot.dir||1),vy:93.75+i*15,
          age:0,spin:i,life:3,radius:5,damage:9,splash:MIRV_SPLASH,trail:[]});
        emit(g,'cluster',shot.x,shot.y);emit(g,'spark',shot.x,shot.y);shot.life=0;
      }
      continue;
    }
    for(const target of shot.team==='player'?allTargets(g):g.obstacles){
      if(target.hp<=0)continue;
      const fraction=segmentRect(x0,y0,shot.x,shot.y,bounds(target,g.time),shot.radius||0);
      if(fraction!==null)collisions.push({fraction,kind:'target',shot,target});
    }
    if(shot.team==='enemy'){
      const fraction=playerCollisionFraction(x0,y0,shot.x-playerMovement.x,shot.y-playerMovement.y,startHitbox,shot.radius||0,p.evasion,dt);
      if(fraction!==null)collisions.push({fraction,kind:'player',shot});
    }
    const groundPad=shot.kind==='homing'||shot.kind==='enemy-missile'?shot.radius||0:0;
    let fraction=terrainImpact(g,x0,y0+groundPad,shot.x,shot.y+groundPad,groundPad?0:3);
    if(shot.kind==='homing'||shot.kind==='enemy-missile'){
      for(const blocker of context.blockers){
        if(blocker.obstacle)continue; // Live obstacle candidates already carry their actual damageable target.
        const t=segmentRect(x0,y0,shot.x,shot.y,blocker,shot.radius||0);
        if(t!==null&&(fraction===null||t<fraction))fraction=t;
      }
    }
    if(fraction!==null)collisions.push({fraction,kind:'world',shot});
  }
  const bullets=g.projectiles.filter(s=>s.team==='player'&&s.kind==='bullet'&&s.life>0);
  for(const missile of g.projectiles.filter(s=>s.team==='enemy'&&s.kind==='enemy-missile'&&s.life>0))for(const bullet of bullets){
    const fraction=relativeImpact(bullet,missile);if(fraction!==null)collisions.push({fraction,kind:'intercept',shot:bullet,target:missile});
  }
  collisions.sort((a,b)=>a.fraction-b.fraction||Number(b.kind==='intercept')-Number(a.kind==='intercept')||a.shot.id-b.shot.id);
  for(const collision of collisions){
    const {shot,target,fraction,kind}=collision;
    if(shot.life<=0||resolved.has(shot.id))continue;
    if(target&&(kind==='intercept'?target.life<=0:target.hp<=0))continue;
    const segment=shot._segment,point={x:segment.x0+(segment.x1-segment.x0)*fraction,y:segment.y0+(segment.y1-segment.y0)*fraction};
    if(kind==='intercept'){
      shot.life=0;target.hp=(target.hp??1)-shot.damage;
      if(target.hp<=0){target.life=0;g.stats.interceptions++;emit(g,'intercept',point.x,point.y);}
      continue;
    }
    const response=kind==='player'?(isEvasionProtected(p.evasion,{dt,fraction})?'avoid':resolveDeflectHit(p.deflect,shot,{dt,fraction})):null;
    // The rear body never intersects the projectile's forward plane. Keep its
    // real segment end and allow later physical cover/expiry candidates to win.
    if(response==='avoid')continue;
    shot.x=point.x;shot.y=point.y;
    if(kind==='expire'){
      if(shot.kind==='grenade'||shot.team==='enemy'&&shot.splash)areaBlast(g,point.x,point.y,shot.splash,shot.damage,{dt,fraction,team:shot.team});
      shot.life=0;continue;
    }
    if(kind==='player'){
      if(response==='deflect'){
        const speed=Math.max(500,Math.hypot(shot.vx,shot.vy)),length=Math.hypot(shot.vx,shot.vy)||1;
        shot.vx=-shot.vx/length*speed;shot.vy=-shot.vy/length*speed;shot.team='player';shot.damage=Math.max(1,shot.damage||1);shot.life=Math.max(1,shot.life);
        shot.x+=shot.vx/speed*(shot.radius||4)*2;shot.y+=shot.vy/speed*(shot.radius||4)*2;resolved.add(shot.id);emit(g,'deflect',point.x,point.y);continue;
      }
      if(shot.splash)areaBlast(g,point.x,point.y,shot.splash,shot.damage,{dt,fraction,team:shot.team});
      else if(response==='hit')hurtPlayer(g,shot.damage,{dt,fraction});
      emit(g,'spark',point.x,point.y);
    }else if(shot.team==='player'){
      if(shot.splash)areaBlast(g,point.x,point.y,shot.splash,shot.damage,{dt,fraction});
      else if(kind==='target')hurtTarget(g,target,shot.damage,{ranged:true});
      else emit(g,'spark',point.x,point.y);
    }else if(shot.splash)areaBlast(g,point.x,point.y,shot.splash,shot.damage,{dt,fraction,team:shot.team});
    else emit(g,'spark',point.x,point.y);
    shot.life=0;
  }
  for(const shot of g.projectiles){
    delete shot._segment;
  }
  g.projectiles=g.status==='won'?[]:g.projectiles.filter(shot=>shot.life>0&&[shot.x,shot.y,shot.vx,shot.vy].every(Number.isFinite)&&shot.x>=-250&&shot.x<=LEVEL_END+500&&shot.y>=-900&&shot.y<900).concat(children);
}
export function availableBossAssault(g){
  const b=g.boss,p=g.player;
  if(g.status!=='playing'||g.introElapsed<g.introDuration||g.duel||g.bossBreach||
    !(b?.hp>0))return null;
  if(!g.bossBreachUsed&&b.hp<=b.maxHp*.45)return 'hull';
  if(!(Math.abs(p.x-b.x)<=430||p.bossSupport))return null;
  if(!b.podDestroyed&&!g.bossPodUsed&&b.podVolleysFired>=1)return 'pod';
  return null;
}
export function canStartBossBreach(g){return availableBossAssault(g)!==null;}
function startBossBreach(g,held,kind){
  const p=g.player;
  g.bossBreach=createBossBreach(p,g.boss,held,kind);
  if(kind==='pod')g.bossPodUsed=true;else g.bossBreachUsed=true;
  clearPlayerWeaponQueue(p);cancelMelee(p.melee);g.projectiles=[];
  if(p.evasion.active)endEvasion(p.evasion);
  if(p.deflect.active){p.deflect.active=false;p.deflect.elapsed=p.deflect.duration;}
  p.onGround=false;p.bossSupport=null;p.platformId=null;p.obstacleId=null;
  p.bossPush=false;p.bossEject=null;p.vx=0;p.vy=0;
  g.boss.riderTime=0;
  emit(g,'breach-start',p.x,p.y,{kind});
}
function syncBossBreachActor(g){
  const q=g.bossBreach,p=g.player,b=g.boss;
  if(q.phase==='leap'){
    const t=clamp(q.elapsed/(q.leapDuration??BREACH_PHASE_SECONDS.leap),0,1);
    p.x=q.fromX+(q.deckX-q.fromX)*t;
    p.y=q.fromY+(q.deckY-q.fromY)*t-Math.sin(Math.PI*t)*(q.leapHeight??Math.max(90,Math.abs(q.fromY-q.deckY)*.4));
    p.onGround=false;p.bossSupport=null;
  }else if(q.phase==='eject'){
    const t=clamp(q.elapsed/BREACH_PHASE_SECONDS.eject,0,1);
    p.x=q.deckX+(bossGeometry(b).front.x-HULL_HALF-30-q.deckX)*t;
    p.y=q.deckY-50*t;
    p.onGround=false;p.bossSupport=null;
  }else if(q.phase!=='return'){
    p.x=q.deckX;p.y=q.deckY;p.onGround=true;p.bossSupport=q.kind==='pod'?'turret':'deck';p.vx=0;p.vy=0;
  }
  q.x=p.x;q.y=p.y;
  p.supportY=p.onGround?p.y:terrainAt(g,p.x);
  if(!g.viewport||g.viewport===g._defaultViewport){
    g._defaultViewport={x:p.x-360,y:0,w:1280,h:720};g.viewport=g._defaultViewport;
  }
}
function updateBossBreach(g,held,dt){
  const q=g.bossBreach,p=g.player,kind=q.kind;
  g.shake=Math.max(0,g.shake-dt*30);g.flash=Math.max(0,g.flash-dt);p.damagePose=g.flash>.17;
  if(g.bossBreachInputSuspended){q.qteHeld=held;q.qteArmed=false;g.bossBreachInputSuspended=false;}
  if(q.phase==='return'){
    movePlayer(g,{},dt);q.x=p.x;q.y=p.y;
    if(!g.viewport||g.viewport===g._defaultViewport){
      g._defaultViewport={x:p.x-360,y:0,w:1280,h:720};g.viewport=g._defaultViewport;
    }
    const result=advanceBossBreach(q,held,dt,{grounded:p.onGround&&!p.bossSupport});
    g.bossBreach=result.breach;
    if(!g.bossBreach){p.bossEject=null;p.invulnerable=Math.max(p.invulnerable,.9);
      if(kind==='pod')g.bossPodLandedAt=g.time;
      if(g.pendingVictory){g.pendingVictory=false;g.status='won';}}
    for(const event of result.events)emit(g,event.type,p.x,p.y,{kind});
    return;
  }
  const result=advanceBossBreach(q,held,dt);
  g.bossBreach=result.breach;
  syncBossBreachActor(g);
  for(const event of result.events){
    emit(g,event.type,p.x,p.y,{kind,taps:event.taps,shot:event.shot});
    if(event.type==='breach-hole')g.boss.breached=true;
    if(event.type==='breach-fire')hurtEnemy(g,g.boss,60);
    if(event.type==='pod-destroyed'){
      g.boss.podDestroyed=true;g.boss.podPhase='destroyed';g.boss.podRaise=0;
      hurtEnemy(g,g.boss,20);
    }
    if(event.type==='breach-return'){
      p.bossSupport=null;p.onGround=false;p.vy=-400;
      p.bossEject={vx:-400,time:.72,clearTank:true};
      p.invulnerable=Math.max(p.invulnerable,1.2);
    }
  }
  if(g.events.length>200)g.events.splice(0,g.events.length-200);
}
export function update(g,input={},dt=1/60){
  if(g.status!=='playing'){
    if(g.duel)g.duelInputSuspended=true;
    if(g.bossBreach)g.bossBreachInputSuspended=true;
    else g.bossActionSuspended=true;
    return;
  }
  dt=clamp(Number.isFinite(dt)?dt:0,0,1/30);if(dt===0)return;g.time+=dt;const p=g.player;
  const bossHeld=!!input.bossAction;
  const bossPressed=!g.bossActionSuspended&&bossHeld&&!g.bossActionHeld;
  g.bossActionHeld=bossHeld;g.bossActionSuspended=false;
  if(g.bossBreach){updateBossBreach(g,bossHeld,dt);return;}
  if(g.pendingVictory){
    if(p.bossSupport){p.bossSupport=null;p.onGround=false;p.vy=0;}
    movePlayer(g,{},dt);
    if(p.onGround){g.pendingVictory=false;g.status='won';}
    return;
  }
  if(g.introElapsed<g.introDuration){
    g.introElapsed=Math.min(g.introDuration,g.introElapsed+dt);
    if(g.introElapsed>=g.introDuration-1e-9){
      g.introElapsed=g.introDuration;
      emit(g,'intro-end',p.x,p.y);
    }
    return;
  }
  const availableAssault=bossPressed?availableBossAssault(g):null;
  if(availableAssault){
    startBossBreach(g,bossHeld,availableAssault);updateBossBreach(g,bossHeld,dt);return;
  }
  if(g.duel){
    g.shake=Math.max(0,g.shake-dt*30);g.flash=Math.max(0,g.flash-dt);p.damagePose=g.flash>.17;
    if(g.duelInputSuspended){g.duel.qteArmed=false;g.duel.qteHeld=!!input.qte;g.duelInputSuspended=false;}
    const result=advanceSaltikDuel(g.duel,!!input.qte,dt);
    g.duel=result.duel;
    for(const event of result.events){
      g.events.push(event);
      if(event.type==='duel-impact')finishDuelEnemy(g,event.enemyId);
      if(event.type==='duel-end'){g.projectiles=[];clearPlayerWeaponQueue(p);}
    }
    if(g.events.length>200)g.events.splice(0,g.events.length-200);
    return;
  }
  p.evasion??=createEvasionState();p.deflect??=createDeflectState();
  if(p.evasion.active&&!input.shift)endEvasion(p.evasion);
  p.melee??=createMeleeState();advanceMelee(p.melee,dt);
  p.landingCompression=Math.max(0,p.landingCompression-dt/.18);
  for(const field of ['invulnerable','mirvIn','homingIn','muzzle','mirvFlash','homingFlash'])p[field]=Math.max(0,p[field]-dt);
  g.shake=Math.max(0,g.shake-dt*30);g.flash=Math.max(0,g.flash-dt);
  p.damagePose=g.flash>.17;
  if(g.boss?.hp>0)advanceBossTank(g.boss,dt,{viewport:g.viewport,groundAt:g.groundAt??terrainHeight});
  const playerStart={x:p.x,y:p.y};movePlayer(g,input,dt);
  if(p.evasion.active&&(!p.onGround||!input.shift))endEvasion(p.evasion);
  if(!g.viewport||g.viewport===g._defaultViewport){g._defaultViewport={x:p.x-360,y:0,w:1280,h:720};g.viewport=g._defaultViewport;}
  if(input.shift&&p.onGround&&!p.turn.active&&!p.evasion.active&&!p.deflect.active){
    const threats=g.projectiles.filter(s=>s.team==='enemy'&&s.life>0&&Math.hypot(s.x-p.x,s.y-(p.y-35))<650&&(s.vx*(p.x-s.x)+s.vy*(p.y-35-s.y))>0);
    if(beginEvasion(p.evasion,{grounded:p.onGround,threats,random:random(g)})){clearPlayerWeaponQueue(p);cancelMelee(p.melee);emit(g,'shift',p.x,p.y,{kind:p.evasion.kind});}
  }
  p.shiftHeld=!!input.shift;
  if((input.deflectPressed??(input.deflect&&!p.deflectHeld))&&!p.turn.active&&!p.evasion.active&&beginDeflect(p.deflect)){
    clearPlayerWeaponQueue(p);cancelMelee(p.melee);emit(g,'parry-start',p.x,p.y);
  }
  p.deflectHeld=!!input.deflect;
  for(const o of g.obstacles)o.hit=Math.max(0,o.hit-dt);
  g.maxX=Math.max(g.maxX,p.x);g.progress=clamp(g.maxX/LEVEL_END,0,.96);
  while(g.nextSpawn<g.schedule.length&&g.schedule[g.nextSpawn].x<g.maxX+940)spawn(g,g.schedule[g.nextSpawn++]);
  if(!g.bossActivated&&p.x>=BOSS_TRIGGER){g.bossActivated=true;g.boss=createBossTank(17520,g.groundAt??terrainHeight);emit(g,'boss',g.boss.x,g.boss.y);}
  emitSaltikVoiceCues(g);
  const grappler=g.enemies.find(e=>canGrapple(p,e));
  if(grappler){startDuel(g,grappler);return;}
  if(!input.homing)g.noTargetNotified=false;
  for(const e of g.enemies){e.hit=Math.max(0,(e.hit||0)-dt);if(e.type!=='saltik')e.firePose=Math.max(0,(e.firePose||0)-dt);if(e.hp<=0||e.type==='crate')continue;if(e.type!=='saltik')e.phase+=dt;
    if(e.type==='saltik'){
      const route=g.platforms.find(a=>a.id===e.platformId);e.y=route?surfaceHeight(route,e.x):terrainAt(g,e.x);
      const result=advanceEnemySaltik(e,{player:p,dt,time:g.time,groundAt:g.groundAt??terrainHeight,geometry:g.enemySaltikGeometry??enemySaltikGeometry});
      for(const descriptor of result.shots)projectile(g,descriptor,descriptor);
      for(const event of result.events)g.events.push(event);continue;
    }
    if(e.type==='drone'){e.y=terrainAt(g,e.origin??e.x)-140+Math.sin(e.phase*2.1)*38;e.x-=dt*12;}
    if(e.type==='walker'||e.type==='soldier'){e.vx=-23;e.x+=dt*e.vx;const ledge=g.platforms.find(a=>a.id===e.platformId);if(ledge)e.x=clamp(e.x,ledge.x1+50,ledge.x2-50);e.y=ledge?surfaceHeight(ledge,e.x):terrainAt(g,e.x);}
    e.cooldown-=dt;if(e.cooldown<=0&&Math.abs(e.x-p.x)<1050){e.firePose=.16;hostileShot(g,e);e.cooldown=e.type==='turret'?1.8:2.7+random(g)*.7;}
  }
  updateBossRider(g,dt);
  chargeNoseContact(g,playerStart,dt);
  updatePlayerMelee(g);
  emitSaltikVoiceCues(g);
  const meleeGrappler=g.enemies.find(e=>canGrapple(p,e));
  if(meleeGrappler){startDuel(g,meleeGrappler);return;}
  updatePlayerWeapons(g,input,dt);
  if(!input.fire||p.evasion.active||p.deflect.active||p.turn.active)p.aim+=((p.dir===1?0:Math.PI)-p.aim)*Math.min(1,dt*10);
  for(const e of g.enemies)if(e.hp>0&&e.type!=='crate'&&Math.abs(e.x-p.x)<70&&Math.abs(e.y-p.y)<75&&!meleeGuard(p,e))contactPlayer(g,10,dt);
  if(g.boss&&g.boss.hp>0){const b=g.boss;
    const signal=advanceBossWeapons(b,dt,{targetInRange:Math.abs(b.x-p.x)<900});
    if(signal==='pod-warning')emit(g,'boss-pod-warning',b.x+95,b.y-151);
    else if(signal==='pod-volley')bossRocketVolley(g,b);
    else if(signal==='cannon-volley'){
      b.attack++;b.cannonRecoil=1;
      const enraged=b.hp<b.maxHp*.45;
      for(const a of (enraged?[-.25,-.12,0,.12,.25]:[-.16,0,.16]))hostileShot(g,b,a,enraged?330:285);
      g.shake=5;
    }
  }
  updateProjectiles(g,dt,{x:p.x-playerStart.x,y:p.y-playerStart.y});
  emitSaltikVoiceCues(g);
  advanceEvasion(p.evasion,dt);
  advanceDeflect(p.deflect,dt);
  g.enemies=g.enemies.filter(e=>e.hp>0&&e.x>p.x-1800);
  g.pickups=g.pickups.filter(item=>{if(Math.abs(item.x-p.x)<75&&Math.abs(item.y-(p.y-30))<80){p.hp=Math.min(p.maxHp,p.hp+30);g.stats.score+=75;emit(g,'repair',item.x,item.y);return false;}return item.x>p.x-1500;});
  if(g.events.length>200)g.events.splice(0,g.events.length-200);
}
