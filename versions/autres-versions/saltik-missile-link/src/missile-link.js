import {alliedBackgroundPoint} from './canyon-placement.js';
// Allied support travels from the painted canyon into the foreground.
// Hostile battery rockets use the existing projectile simulation from launch.
import {terrainHeight} from './world.js';
import {missileBatteryGeometry} from './missile-battery.js';
export const SUPPORT_COOLDOWN=7.5;
export const BATTERY_START=8900;
export const LINK_INTRO_DURATION=7;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const emit=(g,type,x,y,extra={})=>g.events.push({type,x,y,...extra});
export function createMissileLink(){return {cooldown:0,held:false,aiming:false,aim:null,lock:null,laserFlash:0,launchFlash:0,nextFlightId:1,flights:[],salvos:0,interceptions:0,introLine:-1};}
export function cancelMissileLink(g){if(!g.missileLink)return;g.missileLink.held=false;g.missileLink.aiming=false;g.missileLink.lock=null;g.missileLink.laserFlash=0;}
export function linkIntroLine(g){
  if(!(g.introElapsed<g.introDuration)||g.introDuration<LINK_INTRO_DURATION)return null;
  const t=g.introElapsed;
  if(t<2.4)return {index:0,speaker:'STRIKER',text:'Limule and Regalec ready.',ally:false};
  if(t<5.1)return {index:1,speaker:'RELAIS',text:'Mark the target. I’ll cover you!',ally:true};
  if(t<6.6)return {index:2,speaker:'STRIKER',text:'Let’s go!',ally:false};
  return null;
}
export function advanceLinkIntro(g){const line=linkIntroLine(g);if(line&&line.index!==g.missileLink.introLine){g.missileLink.introLine=line.index;if(line.index>0)emit(g,line.ally?'support-ready':'support-go',g.player.x,g.player.y);}}
function targets(g){
  const v=g.viewport??{x:g.player.x-360,y:0,w:1280,h:720};
  return [...(g.enemies??[]),...(g.obstacles??[]),...(g.boss?[g.boss]:[])].filter(e=>e.hp>0&&e.type!=='crate'&&e.x>=v.x-30&&e.x<=v.x+v.w+30);
}
const targetPoint=e=>e.type==='battery'?missileBatteryGeometry(e).target:({x:e.x,y:e.type==='drone'?e.y:e.y-(e.type==='boss'?95:(e.h??84)*.5)});
export function supportAim(g,input={}){
  const v=g.viewport??{x:g.player.x-360,y:0,w:1280,h:720};
  let point=input.supportAim;
  if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y)){
    const ahead=targets(g).filter(e=>(e.x-g.player.x)*(g.player.dir||1)>-50).sort((a,b)=>Math.abs(a.x-g.player.x)-Math.abs(b.x-g.player.x));
    point=ahead.length?targetPoint(ahead[0]):{x:g.player.x+(g.player.dir||1)*420,y:g.player.y-125};
  }
  point={x:clamp(point.x,v.x+12,v.x+v.w-12),y:clamp(point.y,v.y+35,v.y+v.h-20)};
  const candidate=targets(g).map(e=>({e,d:distance(point,targetPoint(e))})).sort((a,b)=>a.d-b.d)[0];
  if(candidate&&candidate.d<(candidate.e.type==='boss'?125:65))return {point:targetPoint(candidate.e),type:'enemy',id:candidate.e.id};
  return {point,type:'point',id:null};
}
function threats(g){
  return g.projectiles.filter(p=>p.team==='enemy'&&p.kind==='enemy-missile'&&p.life>0)
    .map(p=>({type:'projectile',id:p.id,object:p}))
    .filter(t=>distance(t.object,g.player)<1400).sort((a,b)=>distance(a.object,g.player)-distance(b.object,g.player));
}
function allyOrigin(g){
  if(g.missileCompanion?.active){const a=g.missileCompanion;return {x:a.x,y:a.y-76,spread:4};}
  if(g.player.x<650)return {x:30,y:terrainHeight(30)-70};
  if(g.maxX>=BATTERY_START){const p=alliedBackgroundPoint(g.viewport??{x:g.player.x-360,y:0,w:1280});return {x:p.x,y:p.y-p.height*.7,spread:1};}
  const v=g.viewport??{x:g.player.x-360,y:0};return {x:v.x-65,y:v.y+120};
}
function assign(f,lock){f.targetType=lock.type;f.targetId=lock.id;f.goal={...lock.point};}
export function launchSupport(g,{reserved=false}={}){
  if(g.status!=='playing'||g.missileLink.cooldown>0&&!reserved)return false;
  const s=g.missileLink,lock=s.lock??supportAim(g),origin=allyOrigin(g),incoming=threats(g);
  for(let i=0;i<6;i++){
    const f={id:'support-'+s.nextFlightId++,team:'player',x:origin.x+(i-2.5)*(origin.spread??5),y:origin.y,origin:{...origin},vx:100+(i-2.5)*65,vy:-240-i*15,age:0,life:6,index:i,trail:[]};
    const threat=incoming[i];assign(f,threat?{type:threat.type,id:threat.id,point:threat.object}:lock);s.flights.push(f);
  }
  s.salvos++;if(!reserved)s.cooldown=SUPPORT_COOLDOWN;s.launchFlash=.6;s.laserFlash=.85;
  emit(g,'support-launch',g.player.x,g.player.y-75,{count:6,defensive:Math.min(incoming.length,6)});return true;
}
function resolveGoal(g,f){
  if(f.targetType==='flare'){const v=g.countermeasures?.find(v=>v.id===f.targetId&&v.life>0);return {point:v??f.goal,decoy:true};}
  if(f.targetType==='projectile'){
    const t=g.projectiles.find(p=>p.id===f.targetId&&p.life>0&&p.team==='enemy');
    if(t)return {point:{x:t.x,y:t.y},object:t,intercept:true};
  }else if(f.targetType==='enemy'){
    const t=targets(g).find(e=>e.id===f.targetId);if(t)return {point:targetPoint(t),object:t};
  }else if(f.targetType==='point')return {point:f.goal};
  // A destroyed target cannot keep a missile circling or damage a stale actor.
  const reserved=new Set(g.missileLink.flights.filter(p=>p!==f&&p.team==='player'&&p.life>0).map(p=>p.targetType+':'+p.targetId));
  const incoming=threats(g).find(t=>!reserved.has(t.type+':'+t.id));
  if(incoming){assign(f,{type:incoming.type,id:incoming.id,point:incoming.object});return {point:{x:incoming.object.x,y:incoming.object.y},object:incoming.object,intercept:true};}
  const lock=supportAim(g,{supportAim:f.goal});assign(f,lock);
  if(lock.type==='point')return {point:f.goal};
  return resolveGoal(g,f);
}
function segmentDistance(a,b,p){const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy;const t=d?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/d,0,1):0;return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);}
function impact(g,f,goal,hooks){
  const s=g.missileLink;f.life=0;
  if(goal.decoy){emit(g,'intercept',f.x,f.y,{radius:44,artillery:true});return;}
  if(goal.intercept){goal.object.life=0;goal.object.hp=0;s.interceptions++;g.stats.interceptions++;emit(g,'intercept',f.x,f.y,{radius:44,artillery:true});return;}
  if(goal.object)hooks.damage?.(goal.object,goal.object.type==='boss'?10:18);
  else for(const t of targets(g))if(distance(targetPoint(t),goal.point)<72)hooks.damage?.(t,t.type==='boss'?6:12);
  emit(g,'explosion',f.x,f.y,{radius:95,big:false,artillery:true});
}
export function advanceMissileLink(g,input,dt,hooks={}){
  const s=g.missileLink;if(!s)return;
  if(g.status!=='playing'){cancelMissileLink(g);return;}
  if(g.duel||g.batteryClash||g.bossBreach||g.pendingVictory||g.introElapsed<g.introDuration){cancelMissileLink(g);return;}
  dt=clamp(dt,0,1/30);if(!dt)return;
  for(const key of ['cooldown','laserFlash','launchFlash'])s[key]=Math.max(0,s[key]-dt);
  const held=!!input.support;
  if(held){s.aiming=s.cooldown===0;s.lock=supportAim(g,input);s.aim={...s.lock.point};}
  if(s.held&&!held&&s.aiming&&s.cooldown===0)launchSupport(g);
  if(!held)s.aiming=false;s.held=held;
  for(const f of s.flights){
    if(f.life<=0)continue;f.age+=dt;f.life-=dt;const old={x:f.x,y:f.y};
    const goal=resolveGoal(g,f),dx=goal.point.x-f.x,dy=goal.point.y-f.y,d=Math.hypot(dx,dy)||1;
    const speed=goal.intercept?780:630,blend=1-Math.exp(-dt*10);
    if(f.age>.17+f.index*.025){f.vx+=(dx/d*speed-f.vx)*blend;f.vy+=(dy/d*speed-f.vy)*blend;}
    f.x+=f.vx*dt;f.y+=f.vy*dt;
    if(segmentDistance(old,f,goal.point)<(goal.intercept?25:24))impact(g,f,goal,hooks);
    f.trail.push({x:f.x,y:f.y});if(f.trail.length>24)f.trail.shift();
    if(g.status!=='playing'){s.flights=[];cancelMissileLink(g);return;}
  }
  s.flights=s.flights.filter(f=>f.life>0&&Number.isFinite(f.x)&&Number.isFinite(f.y));
}
