import {clearPlayerWeaponQueue} from './engine.js';
import {ROYAL_END,royalGroundAt,createRoyalRoutes,royalDepthScaleAt} from './royal-layout.js';
export const ROYAL_SHRINES=[{x:4800,name:'LA CLAIRIÈRE BRODÉE',types:['drone','soldier','turret']},{x:10400,name:'LE BELVÉDÈRE DES CASCADES',types:['walker','drone','turret','drone']},{x:16450,name:'LE SANCTUAIRE D’OR',types:['turret','walker','drone','soldier']}];
export function royalMissionLabel(g){const r=g.royal;if(r.phase==='open')return 'JARDINS DE VELOURS · SANCTUAIRE LIBÉRÉ';if(r.phase==='clearing')return `${ROYAL_SHRINES[r.seals].name} · BRISER LE SCEAU ${r.seals+1}/3`;return r.seals===0?'TRAVERSEZ LES JARDINS DE VELOURS':r.seals===1?'REJOIGNEZ LE BELVÉDÈRE DES CASCADES':r.seals===2?'REJOIGNEZ LE SANCTUAIRE D’OR':'FRANCHISSEZ L’ARCHE DU SANCTUAIRE';}
export function applyRoyalLevel(g){
 Object.assign(g,{level:3,levelTitle:'Les Jardins de velours',levelEnd:ROYAL_END,disableBoss:true,groundAt:royalGroundAt,isGroundGap:undefined,platforms:createRoyalRoutes(),obstacles:[],nextSpawn:0});
 g.schedule=[['soldier',800],['drone',2120],['drone',4190],['drone',6250],['saltik',8620],['drone',9210],['saltik',11380],['drone',13800],['soldier',15260]].map(([type,x],i)=>({id:`royal-travel-${i}`,type,x}));
 for(const [i,shrine] of ROYAL_SHRINES.entries())for(const [j,type] of shrine.types.entries())g.schedule.push({id:`royal-seal-${i+1}-${j}`,type,x:shrine.x+90+j*135,royalSeal:i+1,arenaMin:shrine.x-550,arenaMax:shrine.x+550});
 // Elevated defenders belong to the actual illustrated deck, never thin extra platforms.
 for(const route of g.platforms.filter(p=>['tree','terrace'].includes(p.royalKind)))g.schedule.push({id:`${route.id}-guard`,type:'soldier',x:route.x1+(route.x2-route.x1)*.58,platformId:route.id,tier:1});
 g.schedule.sort((a,b)=>a.x-b.x);g.pickups=[2100,4200,6400,8500,11200,13700,15700].map(x=>({x,y:royalGroundAt(x)-30,type:'repair'}));
 for(const p of g.platforms.filter(p=>p.royalKind!=='bridge'))g.pickups.push({x:p.x2-80,y:p.points.at(-1)[1]-30,type:'repair'});
 Object.assign(g.player,{skin:'royal',artScale:royalDepthScaleAt(g.player.x),y:royalGroundAt(g.player.x),supportY:royalGroundAt(g.player.x),supportPose:null});g.royal={phase:'traverse',seals:0,elapsed:0,checkpoint:180,falls:0};return g;
}
export function advanceRoyalObjective(g,dt){
 if(!(dt>0)||!Number.isFinite(dt)||g.level!==3||g.status!=='playing'||g.introElapsed<g.introDuration||g.duel||g.carrierShutdown)return;
 const r=g.royal,p=g.player;r.elapsed+=dt;p.artScale=royalDepthScaleAt(p.x);
 if(p.y>1050){p.hp=Math.max(0,p.hp-10);r.falls++;Object.assign(p,{x:r.checkpoint,y:royalGroundAt(r.checkpoint),vx:0,vy:0,onGround:true,platformId:null,rampId:null,tier:0,obstacleId:null,bossSupport:null,dropThrough:null,supportPose:null,invulnerable:2,turn:null});p.supportY=p.y;clearPlayerWeaponQueue(p);g.projectiles=[];if(!p.hp){g.status='dead';p.knockedOut=true;}return;}
 if(p.onGround&&!p.platformId&&!p.rampId&&p.x>r.checkpoint+1200)r.checkpoint=p.x;
 const shrine=ROYAL_SHRINES[r.seals];
 if(shrine&&p.x>=shrine.x-300){
  if(r.phase!=='clearing'){r.phase='clearing';g.events.push({type:'royal-seal-warning',x:shrine.x,y:royalGroundAt(shrine.x)});}
  if(p.x>shrine.x+550){p.x=shrine.x+550;p.vx=Math.min(p.vx,0);}
  const pending=g.schedule.slice(g.nextSpawn).some(e=>e.royalSeal===r.seals+1),alive=g.enemies.some(e=>e.royalSeal===r.seals+1&&e.hp>0&&!e.neutralized);
  if(!pending&&!alive){r.seals++;r.phase='traverse';g.projectiles=g.projectiles.filter(s=>s.team!=='enemy');g.pickups.push({x:p.x+90,y:royalGroundAt(p.x+90)-30,type:'repair'});g.events.push({type:'royal-seal-open',x:shrine.x,y:royalGroundAt(shrine.x)});}
 }
 if(r.seals===3&&p.x>=17450){r.phase='open';g.status='won';g.progress=1;g.projectiles=[];g.events.push({type:'royal-open',x:p.x,y:p.y});}
}
