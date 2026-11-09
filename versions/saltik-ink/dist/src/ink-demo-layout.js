import {createObstacles,surfaceHeight,terrainHeight,routeThickness,authorCheckpointGuards} from './world.js';
import {INK_BRIDGE,INK_OBSERVATORY} from './ink-campaign-art.js';
export {INK_BRIDGE,INK_OBSERVATORY,INK_LANDMARK_ASSETS,INK_WORLD_ART,inkLandmarkArt} from './ink-campaign-art.js';

// These walking contours are sampled on the actual native cutouts.
const bridgeCap=[[0,376],[200,374],[390,373],[470,381],[540,369],[620,364],
  [690,348],[770,322],[860,288],[950,262],[1040,248],[1150,250],[1240,278],
  [1340,311],[1430,338],[1540,373],[1660,407],[1760,433],[1900,441],[1991,447]];
const observatoryCap=[[0,566],[120,563],[240,579],[370,579],[560,570],[740,559],
  [940,556],[1120,574],[1320,586],[1520,610],[1690,638],[1774,655]];
const fromCutout=(bounds,cap,k)=>cap.map(([x,y])=>[bounds.x+x*k,bounds.y+y*k]);
const definitions=[
  {id:'ledge-0',points:fromCutout(INK_BRIDGE,bridgeCap,.8),bodyDepth:78,seed:13},
  {id:'ledge-1',points:fromCutout(INK_OBSERVATORY,observatoryCap,.78),bodyDepth:20,seed:44},
  {id:'wreck-perch',points:fromCutout({x:5110,y:297},[[0,170],[120,80],[300,66],[540,60],[680,72],[824,120]],1.3),bodyDepth:74,seed:75},
  {id:'ledge-2',points:fromCutout({x:6900,y:140},[[0,228],[120,225],[250,230],[390,232],[550,236],[720,231],[880,226],[1011,232]],1.3),bodyDepth:88,seed:106},
  {id:'ledge-3',points:fromCutout({x:9360,y:-55},[[340,431],[600,429],[900,430],[1150,434],[1400,445],[1630,455],[1810,483],[1983,527]],1.05),bodyDepth:76,seed:137},
  {id:'bridge-3',lowerId:'ledge-3',points:fromCutout({x:9360,y:-55},[[1140,273],[1200,268],[1280,270],[1360,265],[1430,269]],1.05),bodyDepth:3,seed:174},
  // Walk the low native stone/root shelf in front of the turbine. Its outer
  // metal crown is scenery; the shelf ends before the right-hand building.
  {id:'ledge-5',points:fromCutout({x:14980,y:-160},[[40,440],[120,408],[190,389],[270,373]],1.5),bodyDepth:38,seed:199},
  {id:'breach-landing',points:fromCutout({x:14980,y:-160},[[490,350],[560,350],[650,349],[720,365]],1.5),bodyDepth:38,seed:200},
  {id:'checkpoint-turn',points:fromCutout({x:9360,y:-55},[[100,590],[210,590]],1.05),bodyDepth:3,seed:138}
];
export const INK_LANDMARK_ROUTES=definitions.map(p=>({...p,x1:p.points[0][0],x2:p.points.at(-1)[0]}));
for(const p of INK_LANDMARK_ROUTES)p.lower=INK_LANDMARK_ROUTES.find(lower=>lower.id===p.lowerId);

export function inkGroundHeight(x){
  // Open ravines remain traversable below every engraved vault. Shoulder
  // blending prevents a vertical ground cut at native image boundaries.
  const u=Math.max(0,Math.min(1,(x-620)/1320));
  let floor=terrainHeight(x)+150*Math.sin(Math.PI*u)**2;
  for(const p of INK_LANDMARK_ROUTES){
    if(p.lower)continue;
    const at=Math.max(p.x1,Math.min(p.x2,x)),outside=Math.abs(x-at),blend=Math.max(0,1-outside/320);
    if(!blend)continue;
    const clearance=surfaceHeight(p,at)+routeThickness(p,at)+144;
    const shoulder=terrainHeight(x)+(clearance-terrainHeight(at))*blend*blend*(3-2*blend);
    floor=Math.max(floor,outside?shoulder:clearance);
  }
  // Native stair feet are part of the illustration, rather than a newly
  // invented approach suspended above it. Blend the earth into those feet.
  for(const [footX,footY] of [[4018.7,651.48],[9769.5,695.75],[16217.5,608]]){
    const weight=Math.max(0,Math.min(1,1-(Math.abs(x-footX)-80)/320));
    floor+=(footY-floor)*weight*weight*(3-2*weight);
  }
  return floor;
}

// Bottom-to-top points drive both engraved treads and suspension samples.
const stair=(id,platformId,bottomX,topX,{lowerId=null,stepRun=22,via=[]}={})=>{
  const roof=INK_LANDMARK_ROUTES.find(p=>p.id===platformId),lower=INK_LANDMARK_ROUTES.find(p=>p.id===lowerId);
  return {id,platformId,lowerId,stepRun,points:[[bottomX,lower?surfaceHeight(lower,bottomX):inkGroundHeight(bottomX)],...via,[topX,surfaceHeight(roof,topX)]]};
};
const nativeStair=(id,platformId,bounds,k,points,lowerId=null)=>({
  id,platformId,lowerId,nativeArt:true,stepRun:10000,points:fromCutout(bounds,points,k)
});
export const INK_STAIRS=[
  stair('root-approach','ledge-0',260,620),
  nativeStair('observatory-stairs','ledge-1',INK_OBSERVATORY,.78,[[665,816],[588,789],[522,763],[465,735],[412,705],[358,676],[330,648],[305,632],[280,616],[255,600],[225,579]]),
  stair('wreck-stairs','wreck-perch',4930,5410,{stepRun:24}),
  stair('gorge-west-stairs','ledge-2',6500,7060),
  stair('gorge-east-stairs','ledge-2',8600,8090),
  nativeStair('checkpoint-lower-stairs','checkpoint-turn',{x:9360,y:-55},1.05,[[390,715],[330,689],[277,664],[223,640],[179,614],[145,590]]),
  nativeStair('checkpoint-west-stairs','ledge-3',{x:9360,y:-55},1.05,[[145,590],[170,565],[210,539],[250,513],[290,486],[330,459],[350,440],[370,431]],'checkpoint-turn'),
  stair('checkpoint-east-stairs','ledge-3',11800,11100,{stepRun:24}),
  stair('radio-gallery-stairs','bridge-3',10000,10650,{lowerId:'ledge-3',stepRun:24}),
  nativeStair('breach-east-stairs','breach-landing',{x:14980,y:-160},1.5,[[825,512],[790,493],[758,473],[724,454],[692,435],[662,415],[630,395],[598,375],[565,350]])
];

// The last native sample meets the measured terrace exactly. Intermediate
// samples remain the centers of the existing illustrated stone treads.
for(const entry of INK_STAIRS.filter(entry=>entry.nativeArt)){
  const roof=INK_LANDMARK_ROUTES.find(p=>p.id===entry.platformId),last=entry.points.at(-1);
  last[1]=surfaceHeight(roof,last[0]);
}

export function applyInkLandmarkLayout(g){
  const turbineCover=g.obstacles.find(o=>o.platformId==='ledge-5');
  g.groundAt=inkGroundHeight;
  for(const authored of INK_LANDMARK_ROUTES){
    let p=g.platforms.find(p=>p.id===authored.id);
    if(!p){p={id:authored.id,tier:1,material:'concrete',kind:'native-landing',mass:{}};g.platforms.push(p);}
    Object.assign(p,{x1:authored.x1,x2:authored.x2,bodyDepth:authored.bodyDepth,seed:authored.seed});
    p.points=authored.points.map(point=>[...point]);p.profile=p.points.map(point=>point[1]);
    p.inkNative=true;p.inkGroundAt=g.groundAt;p.mass={...p.mass,left:0,right:0};
    p.entry={x1:p.x1,x2:Math.min(p.x2,p.x1+160),lowerId:authored.lowerId??null};
    p.walkableEntries=INK_STAIRS.filter(stair=>stair.platformId===p.id).map(stair=>({...stair,points:stair.points.map(point=>[...point])}));
  }
  for(const authored of INK_LANDMARK_ROUTES){
    const p=g.platforms.find(p=>p.id===authored.id);if(p&&authored.lowerId)p.lower=g.platforms.find(lower=>lower.id===authored.lowerId);
  }
  g.obstacles=createObstacles(g.platforms,g.groundAt);
  // Keep the existing barricade on the shortened shelf. The generic author
  // checks its old x before native coordinates are clamped below.
  if(turbineCover&&!g.obstacles.some(o=>o.id===turbineCover.id))g.obstacles.push({...turbineCover});
  for(const obstacle of g.obstacles){
    const p=g.platforms.find(p=>p.id===obstacle.platformId);if(!p)continue;
    obstacle.x=Math.max(p.x1+obstacle.w*.5+18,Math.min(p.x2-obstacle.w*.5-18,obstacle.x));
    obstacle.y=surfaceHeight(p,obstacle.x);
  }
  g.pickups=[3600,7400,11600,15800].map(x=>({x,y:g.groundAt(x)-30,type:'repair'})).concat(g.platforms.map(p=>{
    const x=p.x2-Math.min(180,(p.x2-p.x1)*.2);return {x,y:surfaceHeight(p,x)-30,type:'repair',platformId:p.id};
  }));
  if(g.schedule){
    for(const spawn of g.schedule){
      const p=g.platforms.find(p=>p.id===spawn.platformId);if(p)spawn.x=Math.max(p.x1+70,Math.min(p.x2-70,spawn.x));
    }
    g.schedule=authorCheckpointGuards(g.schedule,g.obstacles,g.platforms);
  }
  return g;
}
