import {clearPlayerWeaponQueue} from './engine.js';
import {LUNAR_SITES,lunarFoundationAt} from './lunar-landmarks.js';
import {lunarBaseGroundAt} from './lunar-terrain.js';
export const LUNAR_END=17800;
// The Archives are a continuous, traversable world; no forced pit-jump sections.
export const LUNAR_GAPS=Object.freeze([]);
export const lunarGapAt=x=>LUNAR_GAPS.some(([a,b])=>x>a&&x<b);
export function lunarMissionLabel(g){
 const l=g.lunar;
 if(l.phase==='open')return 'ARCHIVES · PORTAIL OUVERT';
 if(l.phase==='defense')return `PORTE DES ARCHIVES · VAGUE ${l.wave}/3`;
 if(l.phase==='intermission')return `PRÉPAREZ-VOUS · VAGUE ${l.wave+1}/3`;
 if(g.player.x>=15400)return 'REJOIGNEZ LA PORTE DES ARCHIVES';
 if(g.player.x>=11000)return 'TRAVERSEZ LES REMPARTS';
 if(g.player.x>=7300)return 'FRANCHISSEZ L’OBSERVATOIRE';
 return 'EXPLOREZ LES CITADELLES LUNAIRES';
}
// Paint and physics share the same authored lower contours. Under a real
// building the soil can rise as well as fall to meet its actual stone foot.
export function lunarGroundAt(x){
 const inside=LUNAR_SITES.find(site=>x>=site.groundLeft&&x<=site.groundRight);
 if(inside)return lunarFoundationAt(inside,x);
 const nearest=LUNAR_SITES.map(site=>({site,distance:Math.min(Math.abs(x-site.groundLeft),Math.abs(x-site.groundRight))})).sort((a,b)=>a.distance-b.distance)[0];
 const base=lunarBaseGroundAt(x);if(!nearest)return base;
 const left=LUNAR_SITES.filter(site=>site.groundRight<x).at(-1),right=LUNAR_SITES.find(site=>site.groundLeft>x);
 if(left&&right&&right.groundLeft-left.groundRight<360){
  const t=(x-left.groundRight)/(right.groundLeft-left.groundRight),u=t*t*(3-2*t);
  return lunarFoundationAt(left,left.groundRight)*(1-u)+lunarFoundationAt(right,right.groundLeft)*u;
 }
 const weight=Math.max(0,1-nearest.distance/180),smooth=weight*weight*(3-2*weight);
 const edge=x<nearest.site.groundLeft?nearest.site.groundLeft:nearest.site.groundRight;
 return base+(lunarFoundationAt(nearest.site,edge)-base)*smooth;
}
export function createLunarRoutes(){
 return LUNAR_SITES.map(({id,x1,x2,y,points,kind,stairs,encounters},i)=>({
  id,tier:1,x1,x2,points:points.map(p=>[...p]),bodyDepth:65,seed:300+i,lunarKind:kind,encounters,
  walkableEntries:stairs.map((points,j)=>({id:`${id}-stairs-${j}`,lowerId:null,nativeArt:true,points:points.map(p=>[...p]),stepRun:22})),
 }));
}
export function applyLunarLevel(g){
 g.level=2;g.levelTitle='Les Archives lunaires';g.levelEnd=LUNAR_END;g.disableBoss=true;g.groundAt=lunarGroundAt;g.isGroundGap=LUNAR_GAPS.length?lunarGapAt:undefined;
 g.platforms=createLunarRoutes();g.obstacles=[];
 g.schedule=[['soldier',1260],['drone',2200],['turret',3700],['drone',4010],['walker',5160],['saltik',7650],['drone',8050],['saltik',8660],['carrier',8940],['turret',10150],['drone',11480],['walker',12360],['saltik',13140],['drone',14350],['turret',15320],['soldier',15920]].map(([type,x],i)=>({id:`lunar-encounter-${i}`,type,x}));
 // Carrier native movement remains in its approved arena; its escort is the second Saltik.
 g.schedule.find(e=>e.type==='carrier').guardianId='lunar-encounter-7';g.schedule[7].protectsCarrierId='lunar-encounter-8';
 for(const [i,p] of g.platforms.filter(p=>p.encounters).entries())g.schedule.push({id:`lunar-roof-${i}`,type:i%2?'turret':'soldier',x:p.x1+470,platformId:p.id,tier:1});
 g.schedule.sort((a,b)=>a.x-b.x);g.nextSpawn=0;
 g.pickups=[2100,4900,7350,9750,11500,14250,16200].map(x=>({x,y:lunarGroundAt(x)-30,type:'repair'}));
 for(const p of g.platforms.filter(p=>p.encounters))g.pickups.push({x:p.x2-140,y:p.points.at(-1)[1]-40,type:'repair'});
 g.enemyArtScale=1;g.player.skin='lunar';g.player.artScale=1;g.player.y=lunarGroundAt(g.player.x);g.player.supportY=g.player.y;g.player.supportPose=null;
 g.lunar={phase:'approach',wave:0,elapsed:0,checkpoint:180,falls:0,portalX:17050};return g;
}
function startWave(g){
 const l=g.lunar;l.wave++;l.phase='defense';l.elapsed=0;
 const types=[['drone','soldier','drone'],['walker','drone','turret','drone'],['turret','walker','drone','soldier','drone']][l.wave-1];
 const additions=types.map((type,i)=>({id:`lunar-wave-${l.wave}-${i}`,type,x:16840+i*155,lunarWave:l.wave}));
 // Only append after all traversal encounters have been scheduled. maxX at the
 // gate causes these descriptors to enter through the same native spawn path.
 g.schedule.push(...additions);g.events.push({type:'lunar-wave',wave:l.wave,x:l.portalX,y:550});
}
export function advanceLunarObjective(g,dt){
 if(!(dt>0)||!Number.isFinite(dt)||g.level!==2||g.status!=='playing'||g.introElapsed<g.introDuration||g.duel||g.carrierShutdown)return;
 const l=g.lunar,p=g.player;l.elapsed+=Math.max(0,dt);
 if(p.y>930){
  p.hp=Math.max(0,p.hp-10);l.falls++;
  Object.assign(p,{x:l.checkpoint,y:lunarGroundAt(l.checkpoint),vx:0,vy:0,onGround:true,platformId:null,obstacleId:null,bossSupport:null,rampId:null,dropThrough:null,tier:0,supportPose:null,invulnerable:2,turn:null});
  p.supportY=p.y;clearPlayerWeaponQueue(p);g.projectiles=[];g.events.push({type:'lunar-fall',x:p.x,y:p.y});
  if(!p.hp){g.status='dead';p.knockedOut=true;}return;
 }
 // Checkpoints remain available after combat knockback or unexpected falls.
 for(const x of [180,2820,4830,7200,9750,11300,14300,16200])if(p.x>=x&&p.onGround&&!p.platformId&&!p.obstacleId&&x>l.checkpoint)l.checkpoint=x;
 if(l.phase==='approach'&&p.x>=16550){startWave(g);return;}
 if(l.phase==='intermission'){if(l.elapsed>=2.6)startWave(g);return;}
 if(l.phase!=='defense')return;
 const pending=g.schedule.slice(g.nextSpawn).some(e=>e.lunarWave===l.wave);
 const alive=g.enemies.some(e=>e.lunarWave===l.wave&&e.hp>0&&!e.neutralized);
 if(pending||alive)return;
 if(l.wave===3){l.phase='open';g.status='won';g.progress=1;g.projectiles=[];g.events.push({type:'lunar-open',x:l.portalX,y:550});}
 else{l.phase='intermission';l.elapsed=0;g.pickups.push({x:16700,y:lunarGroundAt(16700)-30,type:'repair'});}
}
