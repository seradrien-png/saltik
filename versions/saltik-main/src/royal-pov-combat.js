import {advanceRoyalWeaponSimulation,damageRoyalPovPlayer,clearPlayerWeaponQueue} from './engine.js';

// These are the native drone's three hit points, combat silhouette and rewards.
// Only their flight paths belong to the finale; weapons remain engine weapons.
const ORIGIN={x:180,y:500},MUZZLE={x:224,y:460};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createRoyalPovCombat(g){
 const finale=g.royal?.finale;if(!finale)return null;
 return finale.combat??={elapsed:0,enemies:[],projectiles:[],effects:[],locks:[],wave:0,nextWave:0,nextEnemy:0,defeats:0,score:0,closed:false,aim:null};
}
function geometry(g){
 const alive=g.enemies.filter(e=>e.hp>0&&e.x>MUZZLE.x+25);
 const target=alive.sort((a,b)=>(a.x+Math.abs(a.y-MUZZLE.y)*.3)-(b.x+Math.abs(b.y-MUZZLE.y)*.3))[0];
 const angle=target?Math.atan2(target.y-MUZZLE.y,target.x-MUZZLE.x):0;
 const axis={x:Math.cos(angle),y:Math.sin(angle)},point={...MUZZLE};
 // MIRV receives the same automatic aim as the coax; native ballistic gravity,
 // splitting, splash and recharge still run in engine.js.
 return {arm:point,cannon:point,armDirection:axis,cannonDirection:axis,turretArticulated:true,
  cabinTubes:[0,1,2].map(i=>({base:{x:point.x-12,y:point.y+i*5},muzzle:{x:point.x,y:point.y+i*5}})),
  gatlingMuzzles:[point,{x:point.x,y:point.y+8}],rocketMuzzles:Array.from({length:8},()=>point),
  btTubes:Array.from({length:8},()=>({muzzle:point,axis}))};
}
function spawnWave(s){
 const wave=s.wave++;
 for(let i=0;i<3;i++){
  const lane=((i+wave)%3-1)*.65;
  s.enemies.push({id:`royal-flight-${s.nextEnemy++}`,type:'drone',x:970+i*75,y:460+lane*125,baseY:460+lane*125,lane,
   hp:3,maxHp:3,hit:0,phase:wave+i*2,scale:i===1?1.2:1,speed:72+wave%3*7,dir:-1});
 }
}
export function advanceRoyalPovCombat(g,input={},dt=1/60){
 if(g.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;
 const s=createRoyalPovCombat(g);if(!s||s.closed)return;
 dt=Math.min(dt,1/30);s.elapsed+=dt;
 if(!input.homing)g.noTargetNotified=false;
 if(s.elapsed>=s.nextWave){spawnWave(s);s.nextWave+=3.8;}
 for(const e of s.enemies){e.x-=e.speed*dt;e.y=e.baseY+Math.sin(s.elapsed*1.7+e.phase)*14;e.hit=Math.max(0,e.hit-dt);}
 s.effects=s.effects.filter(e=>(e.life-=dt)>0);
 const p=g.player,saved={x:p.x,y:p.y,dir:p.dir,vx:p.vx,vy:p.vy};
 const sandbox={...g,player:p,enemies:s.enemies,projectiles:s.projectiles,platforms:[],obstacles:[],pickups:[],boss:null,
  groundAt:()=>850,viewport:{x:100,y:100,w:1150,h:650},weaponGeometry:()=>geometry(sandbox)};
 const eventStart=g.events.length,kills=g.stats.kills,score=g.stats.score;
 Object.assign(p,ORIGIN,{dir:1,vx:0,vy:0});
 try{
  advanceRoyalWeaponSimulation(sandbox,input,dt);
  for(const e of s.enemies)if(e.hp>0&&e.x<265){damageRoyalPovPlayer(sandbox,8);e.passed=true;}
  s.projectiles=sandbox.projectiles;g.projectiles=s.projectiles;s.aim=geometry(sandbox).armDirection;s.locks=(p.bt?.locks??[]).map(lock=>({...lock}));
  for(const event of g.events.slice(eventStart))if(event.type==='spark'||event.type==='explosion')s.effects.push({...event,life:event.type==='explosion'?.55:.18,maxLife:event.type==='explosion'?.55:.18});
  s.enemies=s.enemies.filter(e=>e.hp>0&&!e.passed);s.defeats+=g.stats.kills-kills;s.score+=g.stats.score-score;
  g.noTargetNotified=sandbox.noTargetNotified;g.nextProjectileId=sandbox.nextProjectileId;g.seed=sandbox.seed;g.shake=sandbox.shake;g.flash=sandbox.flash;g.status=sandbox.status;
 }finally{Object.assign(p,saved);}
}
export function clearRoyalPovCombat(g){
 const s=g.royal?.finale?.combat;if(!s)return;
 s.enemies=[];s.projectiles=[];g.projectiles=[];s.effects=[];s.locks=[];s.aim=null;s.closed=true;
 // A released button cannot leave a held lock or queued launch on the landing.
 // Native ammo, accumulated heat and recharge clocks belong to the same player.
 clearPlayerWeaponQueue(g.player);g.player.podCycle=null;
}

// A shared projection keeps enemies, native rounds, hit sparks and BT locks
// registered to the same depth plane. x is distance along the flight corridor.
export function projectRoyalPovPoint(point,width,height){
 const distance=Math.max(20,point.x-ORIGIN.x),depth=clamp(1-distance/1050,0,1),scale=.24+depth*1.65;
 return {x:width*(.5+(point.y-460)/125*.31*scale),y:height*(.38+depth*depth*.16),scale,depth};
}

// Native guided rounds cache a navigation world containing ray-test functions.
// Public snapshots expose motion/aim data, never those private live planners.
export function royalPovCombatSnapshot(state){
 if(!state)return null;
 const projectiles=state.projectiles.map(({guidance,...shot})=>({...shot,guidance:guidance?{avoiding:!!guidance.avoiding}:undefined}));
 return structuredClone({...state,projectiles});
}
