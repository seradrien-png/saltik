import {applyInkLandmarkLayout,inkGroundHeight} from './ink-demo-layout.js';
import {surfaceHeight,routeThickness} from './world.js';
import {createRedArmyHooks} from './red-army.js';
import {clearPlayerWeaponQueue} from './engine.js';
export const RED_CANYON_END=21000;
export function applyRedCanyonLevel(g){
 applyInkLandmarkLayout(g);
 const terrace={id:'red-finale-terrace',x1:18300,x2:19800,tier:1,material:'breachstone',kind:'native-landing',bodyDepth:76,seed:321,
  points:[[18300,370],[18600,345],[19100,340],[19500,350],[19800,370]],mass:{left:0,right:0},walkableEntries:[]};
 const upper={id:'red-finale-crown',x1:19000,x2:19600,tier:2,material:'concrete',kind:'native-landing',bodyDepth:55,seed:322,lowerId:terrace.id,lower:terrace,
  points:[[19000,205],[19300,197],[19600,205]],mass:{left:0,right:0},walkableEntries:[]};
 const ground=x=>{
  let y=inkGroundHeight(x);
  const at=Math.max(terrace.x1,Math.min(terrace.x2,x)),outside=Math.abs(x-at),u=Math.max(0,1-outside/320);
  if(u)y=Math.max(y,surfaceHeight(terrace,at)+routeThickness(terrace,at)+144*u*u*(3-2*u));
  return y;
 };
 const entry=(id,p,lower,from,to)=>({id,platformId:p.id,lowerId:lower?.id??null,stepRun:22,points:[[from,lower?surfaceHeight(lower,from):ground(from)],[to,surfaceHeight(p,to)]]});
 terrace.walkableEntries=[entry('red-finale-west',terrace,null,17900,18480),entry('red-finale-east',terrace,null,20200,19650)];
 upper.walkableEntries=[entry('red-finale-upper-west',upper,terrace,18520,19050),entry('red-finale-upper-east',upper,terrace,19740,19550)];
 g.platforms.push(terrace,upper);
 g.groundAt=ground;for(const p of g.platforms)if(p.inkNative)p.inkGroundAt=ground;
 Object.assign(g,{level:6,levelTitle:'Fossiles rouges II',levelEnd:RED_CANYON_END+150,disableBoss:true,boss:null,bossActivated:false,
  redCanyon:{end:RED_CANYON_END,elapsed:0,complete:false},redWastes:{elapsed:0,complete:false},armyHooks:createRedArmyHooks()});
 for(const [i,[type,x,route,role,model]]of [
  ['soldier',18100,null,'patrol'],['turret',18630,terrace,'gunner'],['walker',19200,upper,'missile-team'],
  ['soldier',19450,upper,'patrol'],['saltik',19150,terrace,'heavy','black-gold'],['saltik',19520,upper,'bt-support'],['drone',20100,null,'overwatch']
 ].entries())g.schedule.push({id:`red-canyon-final-${i}`,type,x,anchorX:x,armyRole:role,armyGroup:'red-canyon-final',enemyModel:model,platformId:route?.id,tier:route?.tier??0,patrolMin:route?route.x1+55:x-140,patrolMax:route?route.x2-55:x+140});
 g.schedule.sort((a,b)=>(a.spawnAt??a.x)-(b.spawnAt??b.x));
 g.pickups.push({x:19400,y:surfaceHeight(upper,19400)-30,type:'repair',platformId:upper.id},{x:20300,y:ground(20300)-30,type:'repair'});
 Object.assign(g.player,{x:180,y:ground(180),supportY:ground(180),onGround:true,supportPose:null});
 return g;
}
export function advanceRedCanyonObjective(g,dt){
 if(g.level!==6||g.status!=='playing'||!(dt>0)||g.introElapsed<g.introDuration)return;
 g.redCanyon.elapsed+=dt;g.progress=Math.min(.99,(g.maxX-180)/(RED_CANYON_END-180));
 if(g.player.x<RED_CANYON_END-.01)return;
 g.redCanyon.complete=true;g.status='won';g.progress=1;clearPlayerWeaponQueue(g.player);g.projectiles=[];
 Object.assign(g.player,{vx:0,vy:0,muzzle:0,mirvFlash:0,homingFlash:0});
 g.events.push({type:'red-canyon-complete',x:g.player.x,y:g.player.y});
}
