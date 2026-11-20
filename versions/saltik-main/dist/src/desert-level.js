import {clearPlayerWeaponQueue} from './engine.js';
import {DESERT_TRAVEL_END,DESERT_INTERIOR_END,DESERT_ROOMS,desertDepthAt,desertTravelAt,desertInteriorGroundAt,createDesertRoutes} from './desert-layout.js';
export function desertInput(g,input){
 if(g.level!==4||g.desert.phase==='interior')return input;
 if(['entering','exiting','complete'].includes(g.desert.phase))return {};
 return{left:!!input.left,right:!!input.right};
}
function place(g,x,dir=1){const p=g.player;Object.assign(p,{x,y:g.groundAt(x),supportY:g.groundAt(x),vx:0,vy:0,dir,onGround:true,platformId:null,rampId:null,tier:0,obstacleId:null,bossSupport:null,dropThrough:null,supportPose:null,turn:null,shiftHeld:false});p.evasion.active=false;p.evasion.held=false;clearPlayerWeaponQueue(p);g.projectiles=[];g.maxX=x;g.jumpHeld=false;g.dropHeld=false;g.bossActionHeld=false;g.bossActionSuspended=true;}
export function applyDesertLevel(g){
 Object.assign(g,{level:4,levelTitle:'Le Désert rouge',disableBoss:true,levelEnd:DESERT_TRAVEL_END+150,platforms:[],obstacles:[],schedule:[],nextSpawn:0,pickups:[],enemies:[],desert:{phase:'outbound',phaseElapsed:0,elapsed:0,roomsCleared:0,checkpoint:180,falls:0,interiorVisits:0}});
 g.groundAt=x=>['interior','exiting'].includes(g.desert.phase)?desertInteriorGroundAt(x):620;
 place(g,180);g.player.artScale=1;return g;
}
function transition(g,phase){g.desert.phase=phase;g.desert.phaseElapsed=0;clearPlayerWeaponQueue(g.player);g.projectiles=[];g.player.vx=0;}
function enterInterior(g){
 const d=g.desert;d.phase='interior';d.phaseElapsed=0;d.interiorVisits++;d.checkpoint=180;
 g.levelEnd=DESERT_INTERIOR_END;g.platforms=createDesertRoutes();g.nextSpawn=0;g.enemies=[];
 g.schedule=DESERT_ROOMS.flatMap((room,i)=>room.types.map((type,j)=>({id:`desert-room-${i}-${j}`,type,x:room.center-250+j*115,desertRoom:i,arenaMin:room.center-450,arenaMax:room.gate-120,...(type==='turret'&&i===0?{platformId:'desert-dais',tier:1}:{})}))).sort((a,b)=>a.x-b.x);
 g.pickups=[850,3000,5600,7200].map(x=>({x,y:desertInteriorGroundAt(x)-30,type:'repair'}));
 place(g,180);g.player.artScale=1;g.events.push({type:'desert-entry',x:180,y:620});
}
function leaveInterior(g){const d=g.desert;d.phase='return';d.phaseElapsed=0;g.levelEnd=DESERT_TRAVEL_END+150;g.platforms=[];g.obstacles=[];g.schedule=[];g.enemies=[];g.pickups=[];g.nextSpawn=0;place(g,DESERT_TRAVEL_END,-1);g.player.artScale=desertDepthAt(g.player.x);}
export function desertMissionLabel(g){const d=g.desert;if(d.phase==='outbound')return 'C-07 · SUIVEZ LA PISTE VERS LE BÂTIMENT →';if(d.phase==='entering')return 'ENTRÉE DANS C-07';if(d.phase==='exiting')return 'C-07 NETTOYÉ · RETOUR AU DÉSERT';if(d.phase==='return')return '← REJOIGNEZ LE PREMIER PLAN';if(d.phase==='complete')return 'C-07 NETTOYÉ · TRAVERSÉE ACCOMPLIE';return d.roomsCleared<3?`${DESERT_ROOMS[d.roomsCleared].name} · NETTOYEZ LA ZONE ${d.roomsCleared+1}/3`:'LES GARDES SONT NEUTRALISÉS · REJOIGNEZ LA SORTIE →';}
export function advanceDesertObjective(g,dt){
 if(!(dt>0)||!Number.isFinite(dt)||g.level!==4||g.status!=='playing'||g.introElapsed<g.introDuration||g.duel||g.carrierShutdown)return;
 const d=g.desert,p=g.player;d.elapsed+=dt;d.phaseElapsed+=dt;
 if(d.phase==='entering'){if(d.phaseElapsed>=.8)enterInterior(g);return;}
 if(d.phase==='exiting'){if(d.phaseElapsed>=.8)leaveInterior(g);return;}
 if(d.phase==='outbound'||d.phase==='return'){
  p.artScale=desertDepthAt(p.x);p.onGround=true;p.y=620;p.supportY=620;p.vy=0;
  g.progress=d.phase==='outbound'?desertTravelAt(p.x)*.25:.75+(1-desertTravelAt(p.x))*.25;
  if(d.phase==='outbound'&&p.x>=DESERT_TRAVEL_END-.1)transition(g,'entering');
  else if(d.phase==='return'&&p.x<=185){d.phase='complete';g.status='won';g.progress=1;clearPlayerWeaponQueue(p);g.projectiles=[];g.events.push({type:'desert-complete',x:p.x,y:p.y});}
  return;
 }
 if(d.phase!=='interior')return;p.artScale=1;g.progress=.25+.5*(d.roomsCleared/3);
 if(p.y>980){p.hp=Math.max(0,p.hp-10);d.falls++;place(g,d.checkpoint);p.invulnerable=2;if(!p.hp){g.status='dead';p.knockedOut=true;}return;}
 const room=DESERT_ROOMS[d.roomsCleared];
 if(room){
  if(p.x>room.gate){p.x=room.gate;p.vx=Math.min(0,p.vx);}
  const pending=g.schedule.slice(g.nextSpawn).some(e=>e.desertRoom===d.roomsCleared),alive=g.enemies.some(e=>e.desertRoom===d.roomsCleared&&e.hp>0&&!e.neutralized&&!e.duelFinished);
  if(!pending&&!alive){d.roomsCleared++;d.checkpoint=room.gate;g.projectiles=g.projectiles.filter(s=>s.team!=='enemy');g.pickups.push({x:room.gate+65,y:desertInteriorGroundAt(room.gate+65)-30,type:'repair'});g.events.push({type:'desert-clear',x:room.gate,y:p.y});}
 }
 if(d.roomsCleared===3&&p.x>=7480)transition(g,'exiting');
}
