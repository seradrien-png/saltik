import {clearPlayerWeaponQueue} from './engine.js';
import {LUNAR_SITES} from './lunar-landmarks.js';
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
// Broad banks and ridges give the lower traversal a native silhouette.
const anchors=[[0,580],[1100,540],[2300,601],[3500,556],[4800,592],[6100,516],[7600,570],[9100,536],[10500,584],[11800,505],[13200,562],[14800,590],[16200,530],[17800,550]];
export function lunarGroundAt(x){
 const at=Math.max(0,Math.min(LUNAR_END,x));
 const i=Math.max(0,Math.min(anchors.length-2,anchors.findIndex((a,i)=>i<anchors.length-1&&at<=anchors[i+1][0]))),a=anchors[i],b=anchors[i+1];
 const t=(at-a[0])/(b[0]-a[0]),smooth=t*t*(3-2*t);
 // Crest and eroded shoulders meet every anchor without a discontinuity.
 const ridge=Math.sin(Math.PI*t)*(22*Math.sin(at/440+i*1.27)+8*Math.sin(at/128));
 let floor=a[1]+(b[1]-a[1])*smooth+ridge;
 for(const site of LUNAR_SITES){
  const bankStart=Math.min(site.x1,site.nativeStair?.[0][0]??site.x1),bankEnd=Math.max(site.x2,site.nativeStair?.[0][0]??site.x2);
  const at=Math.max(bankStart,Math.min(bankEnd,x)),outside=Math.abs(x-at),weight=Math.max(0,1-outside/380);
  // Eroded lower banks expose the full painted arches and foundations.
  // Blend into adjoining terrain; never introduce a pit or a hidden wall.
  let foundation=site.floor;
  if(site.groundPoints){
   const pts=site.groundPoints,index=pts.findIndex((p,i)=>i<pts.length-1&&at<=pts[i+1][0]);
   const a=pts[Math.max(0,index<0?pts.length-2:index)],b=pts[Math.max(1,index<0?pts.length-1:index+1)];
   const u=Math.max(0,Math.min(1,(at-a[0])/(b[0]-a[0])));
   foundation=Math.min(880,a[1]+(b[1]-a[1])*u);
  }
  floor=Math.max(floor,floor+(foundation-floor)*weight*weight*(3-2*weight));
 }
 return floor;
}
export function createLunarRoutes(){
 return LUNAR_SITES.map(({id,x1,x2,y,points,kind,nativeStair},i)=>({
  id,tier:1,x1,x2,points:points.map(p=>[...p]),bodyDepth:65,seed:300+i,lunarKind:kind,
  walkableEntries:[{id:`lunar-stairs-${i}`,lowerId:null,nativeArt:!!nativeStair,points:nativeStair?.map(p=>[...p])??[[x1-300,lunarGroundAt(x1-300)],[x1,y]],stepRun:22}],
 }));
}
export function applyLunarLevel(g){
 g.level=2;g.levelTitle='Les Archives lunaires';g.levelEnd=LUNAR_END;g.disableBoss=true;g.groundAt=lunarGroundAt;g.isGroundGap=LUNAR_GAPS.length?lunarGapAt:undefined;
 g.platforms=createLunarRoutes();g.obstacles=[];
 g.schedule=[['soldier',1260],['drone',2200],['turret',3700],['drone',4010],['walker',5160],['saltik',7650],['drone',8050],['saltik',8660],['carrier',8940],['turret',10150],['drone',11480],['walker',12360],['saltik',13140],['drone',14350],['turret',15320],['soldier',15920]].map(([type,x],i)=>({id:`lunar-encounter-${i}`,type,x}));
 // Carrier native movement remains in its approved arena; its escort is the second Saltik.
 g.schedule.find(e=>e.type==='carrier').guardianId='lunar-encounter-7';g.schedule[7].protectsCarrierId='lunar-encounter-8';
 for(const [i,p] of g.platforms.entries())g.schedule.push({id:`lunar-roof-${i}`,type:i%2?'turret':'soldier',x:p.x1+470,platformId:p.id,tier:1});
 g.schedule.sort((a,b)=>a.x-b.x);g.nextSpawn=0;
 g.pickups=[2100,4900,7350,9750,11500,14250,16200].map(x=>({x,y:lunarGroundAt(x)-30,type:'repair'}));
 for(const p of g.platforms)g.pickups.push({x:p.x2-140,y:p.points.at(-1)[1]-40,type:'repair'});
 g.player.artScale=.8;g.player.y=lunarGroundAt(g.player.x);g.player.supportY=g.player.y;g.player.supportPose=null;
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
 else{l.phase='intermission';l.elapsed=0;g.pickups.push({x:16700,y:520,type:'repair'});}
}
