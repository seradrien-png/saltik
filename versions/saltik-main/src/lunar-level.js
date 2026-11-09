import {clearPlayerWeaponQueue} from './engine.js';
export const LUNAR_END=17800;
export const LUNAR_GAPS=Object.freeze([[2520,2660],[4470,4630],[6820,6990],[10940,11100],[13920,14090]].map(Object.freeze));
export const lunarGapAt=x=>LUNAR_GAPS.some(([a,b])=>x>a&&x<b);
const anchors=[[0,574],[1700,535],[3300,585],[5400,510],[7800,565],[9400,565],[11600,490],[13200,535],[14900,575],[16300,550],[17800,550]];
export function lunarGroundAt(x){
 if(lunarGapAt(x))return 1800;
 const i=Math.max(0,anchors.findIndex((a,i)=>i<anchors.length-1&&x<=anchors[i+1][0])),a=anchors[i],b=anchors[i+1];
 const t=Math.max(0,Math.min(1,(x-a[0])/(b[0]-a[0])));return a[1]+(b[1]-a[1])*t;
}
export function createLunarRoutes(){
 return [[950,2050,410],[3540,4240,400],[5410,6580,360],[7460,8260,410],[11750,13000,355],[14500,15700,410]].map(([x1,x2,y],i)=>({
  id:`lunar-terrace-${i}`,tier:1,x1,x2,points:[[x1,y],[x1+180,y-12],[x2-160,y-12],[x2,y]],bodyDepth:65,seed:300+i,
  walkableEntries:[{id:`lunar-stairs-${i}`,lowerId:null,points:[[x1-300,lunarGroundAt(x1-300)],[x1,y]],stepRun:22}],
 }));
}
export function applyLunarLevel(g){
 g.level=2;g.levelTitle='Les Archives lunaires';g.levelEnd=LUNAR_END;g.disableBoss=true;g.groundAt=lunarGroundAt;g.isGroundGap=lunarGapAt;
 g.platforms=createLunarRoutes();g.obstacles=[];
 g.schedule=[['soldier',1260],['drone',2200],['turret',3700],['drone',4010],['walker',5160],['saltik',7650],['drone',8050],['saltik',8660],['carrier',8940],['turret',10150],['drone',11480],['walker',12360],['saltik',13140],['drone',14350],['turret',15320],['soldier',15920]].map(([type,x],i)=>({id:`lunar-encounter-${i}`,type,x}));
 // Carrier native movement remains in its approved arena; its escort is the second Saltik.
 g.schedule.find(e=>e.type==='carrier').guardianId='lunar-encounter-7';g.schedule[7].protectsCarrierId='lunar-encounter-8';
 for(const [i,p] of g.platforms.entries())g.schedule.push({id:`lunar-roof-${i}`,type:i%2?'turret':'soldier',x:p.x1+470,platformId:p.id,tier:1});
 g.schedule.sort((a,b)=>a.x-b.x);g.nextSpawn=0;
 g.pickups=[2100,4900,7350,9750,11500,14250,16200].map(x=>({x,y:lunarGroundAt(x)-30,type:'repair'}));
 for(const p of g.platforms)g.pickups.push({x:p.x2-140,y:p.points.at(-1)[1]-40,type:'repair'});
 g.player.y=lunarGroundAt(g.player.x);g.player.supportY=g.player.y;g.player.supportPose=null;
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
 // Checkpoints are the centers of broad safe ground, never the edge of a gap.
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
