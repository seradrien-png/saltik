// Playable contours and their eroded undersides share world coordinates.
import {bossRoofAt} from './boss-tank.js';
import {walkableSupportHeight} from './walkable-routes.js';
export const TIER_HEIGHT=138;
// Kept for callers that still import the former projection constant.
export const DEPTH_LANE_RISE=0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
function contour(profile,u){
  const at=clamp(u,0,1)*(profile.length-1),i=Math.min(Math.floor(at),profile.length-2);
  return profile[i]+(profile[i+1]-profile[i])*smooth(at-i);
}
// These are physical terrain changes, rather than palette changes on the same
// repeated wave: root knolls, a collapsed hull basin, a wet gorge, a military
// apron, an exposed scree climb and the last descent into the boss approach.
export const EXPEDITION_SCENARIOS=Object.freeze([
  {id:'rooted-talus',label:'TALUS ENRACINÉ',x1:0,x2:3200,material:'rooted',ground:[0,-20,-61,-32,-76,-21,0],roughness:2.2,wavelength:44},
  {id:'wreck-passage',label:'PASSAGE DE L’ÉPAVE',x1:3200,x2:6200,material:'hull',ground:[0,27,68,48,3,-22,0],roughness:1.5,wavelength:34},
  {id:'wet-gorge',label:'GORGE HUMIDE',x1:6200,x2:9200,material:'wetstone',ground:[0,15,65,74,38,12,0],roughness:1.1,wavelength:84},
  {id:'military-checkpoint',label:'POSTE MILITAIRE',x1:9200,x2:12100,material:'concrete',ground:[0,-18,-26,-21,-18,15,0],roughness:.3,wavelength:118},
  {id:'scree-escarpment',label:'ESCARPEMENT',x1:12100,x2:14900,material:'scree',ground:[0,-42,-114,-166,-84,18,0],roughness:3.4,wavelength:31},
  {id:'final-approach',label:'APPROCHE FINALE',x1:14900,x2:17800,material:'breachstone',ground:[0,28,44,-20,-68,-23,0],roughness:1.8,wavelength:66}
].map(s=>Object.freeze({...s,ground:Object.freeze(s.ground)})));
export function scenarioAt(x){return EXPEDITION_SCENARIOS.find(s=>x>=s.x1&&x<s.x2)??EXPEDITION_SCENARIOS[x<0?0:5];}
export function terrainHeight(x){
  const s=scenarioAt(x),u=clamp((x-s.x1)/(s.x2-s.x1),0,1),envelope=Math.sin(Math.PI*u)**2;
  return 570-Math.sin(x/740)*18-Math.sin(x/211)*7-Math.sin(x/97)*3+contour(s.ground,u)+Math.sin(x/s.wavelength)*s.roughness*envelope;
}
export function terrainAt(world,x){return (world?.groundAt??terrainHeight)(x);}
export function projectDepthPoint(x,y,depth=0){return {x,y};}
export function projectPlayer(p){return {x:p.x,y:p.y,groundY:p.supportY??p.y,depth:0,scale:1};}

function authoredHeight(points,x){
  const i=Math.max(0,points.findIndex((point,index)=>index<points.length-1&&x<=points[index+1][0]));
  const a=points[x>=points.at(-1)[0]?points.length-2:i],b=points[x>=points.at(-1)[0]?points.length-1:i+1];
  return a[1]+(b[1]-a[1])*smooth(clamp((x-a[0])/(b[0]-a[0]),0,1));
}
export function surfaceHeight(platform,x){
  if(platform.points)return authoredHeight(platform.points,x);
  // Retain the small ad-hoc test/platform format used by engine callers.
  if(!platform.profile)return terrainHeight(x)-platform.tier*TIER_HEIGHT;
  const rise=contour(platform.profile,(x-platform.x1)/(platform.x2-platform.x1));
  return platform.relative&&platform.lower?surfaceHeight(platform.lower,x)-rise:terrainHeight(x)-rise;
}

export function createRoutes(){
  // Only the launch windows borrow the lower floor's contour. The rest is
  // independent rock/deck geometry, with its own climb, saddle and descent.
  const definitions=[
    {id:'ledge-0',x1:820,x2:1820,scenario:'rooted-talus',material:'rooted',kind:'root-arch',interior:[[1240,280],[1460,295],[1670,329],[1820,360]],bodyDepth:78,mass:{kind:'root-bank',left:350,right:470,openings:[]},seed:13},
    {id:'ledge-1',x1:3600,x2:4940,scenario:'wreck-passage',material:'hull',kind:'broken-deck',interior:[[4050,385],[4380,375],[4670,408],[4940,455]],bodyDepth:94,mass:{kind:'buried-wreck',left:430,right:310,openings:[[.78,.96]]},seed:44},
    {id:'wreck-perch',x1:5270,x2:5760,scenario:'wreck-passage',material:'rooted',kind:'rubble-perch',interior:[[5610,335],[5760,386]],bodyDepth:74,mass:{kind:'rubble-bank',left:155,right:260,openings:[]},seed:75},
    {id:'ledge-2',x1:7180,x2:7960,scenario:'wet-gorge',material:'wetstone',kind:'gorge-arch',interior:[[7605,414],[7780,429],[7960,501]],bodyDepth:88,mass:{kind:'wet-vault',left:440,right:240,openings:[[.035,.96]]},seed:106},
    {id:'ledge-3',x1:9640,x2:11180,scenario:'military-checkpoint',material:'concrete',kind:'ruined-gallery',interior:[[10080,340],[10370,305],[10660,335],[10900,360],[11180,397]],bodyDepth:76,mass:{kind:'stepped-ruin',left:330,right:510,openings:[[.2,.37],[.78,.95]]},seed:137},
    {id:'bridge-3',x1:10080,x2:10660,tier:2,scenario:'military-checkpoint',material:'concrete',kind:'broken-roof',lowerId:'ledge-3',interior:[[10398,130],[10502,130],[10660,195]],bodyDepth:60,openings:[],seed:174},
    {id:'ledge-5',x1:15160,x2:15880,scenario:'final-approach',material:'breachstone',kind:'broken-spur',interior:[[15570,355],[15650,375],[15880,466]],bodyDepth:82,mass:{kind:'breached-bank',left:235,right:420,openings:[]},seed:199}
  ];
  const routes=[];
  for(const d of definitions){
    const lower=routes.find(p=>p.id===d.lowerId),floor=x=>lower?surfaceHeight(lower,x):terrainHeight(x);
    const points=[[d.x1,floor(d.x1)-140],[d.x1+180,floor(d.x1+180)-140],...d.interior];
    routes.push({...d,tier:d.tier??1,lower,points,profile:points.map(p=>p[1]),entry:{x1:d.x1,x2:d.x1+160,lowerId:lower?.id??null}});
  }
  return routes;
}

// The stone/hull/masonry depth is physical. Entry lips stay reachable while
// the independent climb builds substantial vaults over the lower passage.
export function routeThickness(p,x){
  const edge=clamp(Math.min(x-p.x1,p.x2-x)/38,0,1),bevel=smooth(edge);
  if(!p.bodyDepth)return 3+(15+Math.sin(x/173+p.seed)*1.5+Math.sin(x/61+p.seed*.7))*bevel;
  const lower=xx=>p.lower?surfaceHeight(p.lower,xx):terrainHeight(xx);
  // A standing hull can be centered 58 units either side of this roof sample.
  const available=Math.min(lower(x-58),lower(x),lower(x+58))-surfaceHeight(p,x)-112;
  const growth=smooth(clamp((x-p.x1-160)/210,0,1))*smooth(clamp((p.x2-x-40)/180,0,1));
  const desired=18+p.bodyDepth*growth+Math.sin(x/137+p.seed)*2;
  return 3+(Math.max(3,Math.min(desired,available))-3)*bevel;
}

export function createObstacles(platforms,groundAt=terrainHeight){
  // Explicit support names prevent a removed route from silently becoming an
  // unsupported tier. Ground cover sits in open spans, away from low roofs.
  const placements=[
    [580,null,'rock'],[2260,null,'rock'],[2880,null,'rock'],[1500,'ledge-0','rock'],
    [3330,null,'hull'],[5105,null,'hull'],[6010,null,'barricade'],[4520,'ledge-1','hull'],[5570,'wreck-perch','barricade'],
    [6600,null,'rock'],[8390,null,'rock'],[8940,null,'rock'],[7710,'ledge-2','rock'],
    [9300,null,'checkpoint'],[11520,null,'barricade'],[10900,'ledge-3','checkpoint'],[10450,'bridge-3','barricade'],
    [12580,null,'rock'],[13220,null,'rock'],[14210,null,'rock'],
    [15000,null,'hull'],[16020,null,'checkpoint'],[15660,'ledge-5','barricade']
  ];
  const sizes={rock:{w:88,h:88*265/376,hp:10},barricade:{w:104,h:104*207/381,hp:7},checkpoint:{w:100,h:100*360/381,hp:12},hull:{w:98,h:98*274/382,hp:10}};
  const obstacles=[];
  for(const [index,[x,platformId,type]] of placements.entries()){
    const route=platformId?platforms.find(p=>p.id===platformId):null;if(platformId&&!route)continue;
    const size=sizes[type],y=route?surfaceHeight(route,x):groundAt(x);
    const safe=platforms.every(roof=>{
      if(roof===route)return true;
      for(let xx=x-size.w/2-58;xx<=x+size.w/2+58;xx+=6){
        if(xx<roof.x1||xx>roof.x2)continue;
        const ceiling=surfaceHeight(roof,xx)+routeThickness(roof,xx);
        if(ceiling<y&&y-size.h-ceiling<107)return false;
      }
      return true;
    });
    if(!safe)continue;
    obstacles.push({id:`obstacle-${index}`,x,y,tier:route?.tier??0,platformId:route?.id??null,type,...size,maxHp:size.hp,hit:0,scenario:scenarioAt(x).id});
  }
  return obstacles;
}

export function authorCheckpointGuards(schedule,obstacles,platforms){
  const authored=schedule.map(e=>({...e})),used=new Set();
  for(const o of obstacles.filter(o=>o.type==='checkpoint')){
    const route=platforms.find(p=>p.id===o.platformId);
    const candidates=authored.filter(e=>!used.has(e.id)&&['walker','soldier','turret'].includes(e.type))
      .sort((a,b)=>(Math.abs(a.x-o.x)+(a.tier===o.tier||(!a.tier&&!o.tier)?0:720))-(Math.abs(b.x-o.x)+(b.tier===o.tier||(!b.tier&&!o.tier)?0:720)));
    for(const [i,e] of candidates.slice(0,2).entries()){
      used.add(e.id);e.x=clamp(o.x+[185,330][i],route?route.x1+50:100,route?route.x2-50:16300);
      e.tier=o.tier;e.platformId=o.platformId;e.checkpointId=o.id;
    }
  }
  return authored.sort((a,b)=>a.x-b.x||a.id-b.id);
}

export function supportHeight(world,player,x){
  if(!Number.isFinite(x))return null;
  if(player.rampId){const y=walkableSupportHeight(world,player,x,{surfaceHeight,terrainAt});if(y!==undefined)return y;}
  if(player.bossSupport){
    const roof=bossRoofAt(world.boss,x,player.bossSupport);
    return roof?.id===player.bossSupport?roof.y:null;
  }
  if(player.obstacleId){
    const o=world.obstacles.find(o=>o.id===player.obstacleId&&o.hp>0);
    return o&&x>=o.x-o.w/2&&x<=o.x+o.w/2?o.y-o.h:null;
  }
  if(player.platformId){
    const p=world.platforms.find(p=>p.id===player.platformId);
    return p&&x>=p.x1&&x<=p.x2?surfaceHeight(p,x):null;
  }
  return terrainAt(world,x);
}
