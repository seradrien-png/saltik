import {clearPlayerWeaponQueue} from './engine.js';
import {redWastesGroundAt,createRedWastesRoutes} from './red-wastes-layout.js';
export {redWastesGroundAt} from './red-wastes-layout.js';

// The Red Wastes use the canyon's native world, movement and combat clocks.
// At the native 230 units/second, this route takes about 99 seconds to cross.
export const RED_WASTES_END=23000;

export function applyRedWastesLevel(g){
 const types=['soldier','drone','turret','walker','drone','soldier','walker','turret'];
 const schedule=Array.from({length:32},(_,i)=>({
  id:`red-wastes-patrol-${i}`,type:types[i%types.length],x:1250+i*660,
 }));
 for(const [i,x] of [7000,11400,17600].entries())schedule.push({id:`red-wastes-saltik-${i}`,type:'saltik',x});
 schedule.sort((a,b)=>a.x-b.x);
 Object.assign(g,{level:5,levelTitle:'Les Fossiles rouges',levelEnd:RED_WASTES_END+150,
  disableBoss:true,boss:null,bossActivated:false,groundAt:redWastesGroundAt,
  platforms:createRedWastesRoutes(),obstacles:[],schedule,nextSpawn:0,enemies:[],projectiles:[],
  pickups:[3400,7000,10600,14900,18100,21400].map(x=>({x,y:redWastesGroundAt(x)-30,type:'repair'})),
  maxX:180,progress:0,redWastes:{elapsed:0,complete:false}});
 // Only placement changes here. Character weapons, armor, physics, and inputs
 // continue through engine.update without a replacement combat simulation.
 Object.assign(g.player,{x:180,y:redWastesGroundAt(180),supportY:redWastesGroundAt(180),
  vx:0,vy:0,onGround:true,tier:0,platformId:null,obstacleId:null,bossSupport:null,
  supportPose:null,supportClearance:Infinity});
 return g;
}

export function advanceRedWastesObjective(g,dt){
 if(g.level!==5||g.status!=='playing'||!(dt>0)||!Number.isFinite(dt)||g.introElapsed<g.introDuration)return;
 g.redWastes.elapsed+=dt;
 g.progress=Math.min(.99,Math.max(0,(g.maxX-180)/(RED_WASTES_END-180)));
 // Reaching the far edge is an escape through the patrols. Rearward survivors
 // never become invisible mandatory guards, and there is no waiting timer.
 if(g.player.x>=RED_WASTES_END-.01){
  g.redWastes.complete=true;g.status='won';g.progress=1;
  clearPlayerWeaponQueue(g.player);g.projectiles=[];
  Object.assign(g.player,{vx:0,vy:0,muzzle:0,mirvFlash:0,homingFlash:0});
  if(g.player.gatling)g.player.gatling.rocketFlash=0;
  if(g.player.bt){g.player.bt.launchFlash=0;g.player.bt.panicFlash=0;}
  g.events.push({type:'red-wastes-complete',x:g.player.x,y:g.player.y});
 }
}
