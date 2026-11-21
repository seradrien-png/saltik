import test from 'node:test';
import assert from 'node:assert/strict';
import {createRedArmySchedule,createRedArmyHooks} from '../src/red-army.js';
import {createInkScene} from '../src/ink-scene.js';
import {update,combatBounds,combatTarget} from '../src/engine.js';
import {enemyRustStrikerGeometry} from '../src/enemy-rust-striker-art.js';
import {applyRedWastesLevel} from '../src/red-wastes-level.js';
const floor=()=>620;
function soldier(role='gunner',type='soldier'){
 const e={id:role,type,x:2000,y:620,hp:40,maxHp:40,armyRole:role,armyGroup:'test',anchorX:2000,patrolMin:1800,patrolMax:2200,phase:0,hit:0,cooldown:0,dir:-1};
 createRedArmyHooks().initialize(e);return e;
}
function context(e){return {g:{player:{x:1500,y:620,hp:100},time:0,projectiles:[]},dt:1/60,groundAt:floor,geometry:()=>({muzzle:{x:e.x-50,y:e.y-42},podMuzzles:[{x:e.x-20,y:e.y-70},{x:e.x+20,y:e.y-70}]})};}
function simulate(e,seconds){const hook=createRedArmyHooks(),ctx=context(e),shots=[],events=[];for(let n=0;n<seconds*60;n++){ctx.g.time=n/60;const result=hook.advance(e,ctx);shots.push(...result.shots);events.push(...result.events);}return {shots,events};}

test('army consists of simultaneous authored squads at landmarks and dunes',()=>{
 const schedule=createRedArmySchedule();assert(schedule.length>=80&&schedule.length<=110);
 const groups=Map.groupBy(schedule,e=>e.armyGroup);assert(groups.size>=16);
 for(const group of groups.values()){assert(group.length>=4);assert(Math.max(...group.map(e=>e.x))-Math.min(...group.map(e=>e.x))<=650);}
 assert.equal(schedule.filter(e=>e.enemyModel==='rust-striker'&&e.type==='saltik').length,3);
 for(const site of ['west-bunker','eye-passage','east-bunker'])assert(schedule.some(e=>e.armyGroup===site&&e.platformId));
 assert(schedule.some(e=>e.armyRole==='flanker'));assert(schedule.some(e=>e.armyRole==='missile-team'));
 assert(schedule.every((e,i)=>!i||schedule[i-1].x<=e.x));
});
test('gunners hold ground while patrols and flankers move inside their defensive sector',()=>{
 const fixed=soldier(),patrol=soldier('patrol'),flanker=soldier('flanker');simulate(fixed,5);simulate(patrol,5);simulate(flanker,5);
 assert.equal(fixed.x,2000);assert.notEqual(patrol.x,2000);assert.notEqual(flanker.x,patrol.x);
 for(const e of [patrol,flanker])assert(e.x>=e.patrolMin&&e.x<=e.patrolMax);
});
test('rust Striker streams its main with reload gaps and both guided pods and MIRV',()=>{
 const heavy=soldier('heavy','saltik');heavy.enemyModel='rust-striker';const {shots,events}=simulate(heavy,20);
 const reports=events.filter(e=>e.type==='red-army-cannon');assert(reports.length>100);
 assert(reports.some((e,i)=>i&&e.time-reports[i-1].time>1.3));
 assert(shots.some(s=>s.kind==='enemy-missile'&&s.hp===1));assert(shots.some(s=>s.kind==='enemy-mirv'&&s.hp===1));
 assert(shots.every(s=>s.team==='enemy'&&s.damage>0&&s.life>0&&Number.isFinite(s.vx)&&Number.isFinite(s.vy)));
});
test('missile teams telegraph locks and fire real interceptable guided projectiles',()=>{
 const {shots,events}=simulate(soldier('missile-team','walker'),10);
 assert(events.some(e=>e.type==='enemy-lock'));assert(shots.length>=2);assert(shots.every(s=>s.kind==='enemy-missile'&&s.hp===1&&s.trail.length));
});
test('integrated soldiers are initialized beyond view and remain anchored instead of drifting from a spawn edge',()=>{
 const g=applyRedWastesLevel(createInkScene());g.schedule=[{id:'position',type:'turret',x:1750,anchorX:1750,armyGroup:'test',armyRole:'gunner'}];g.enemies=[];g.nextSpawn=0;g.player.invulnerable=999;
 update(g,{},1/60);assert.equal(g.enemies.length,1);const e=g.enemies[0];assert(e.x>g.viewport.x+g.viewport.w+200);
 for(let n=0;n<300;n++)update(g,{},1/60);assert.equal(e.x,1750);assert.equal(e.y,g.groundAt(e.x));
});
test('army rockets use native swept collision and armor rather than decorative fire',()=>{
 const g=applyRedWastesLevel(createInkScene());g.schedule=[];g.enemies=[];g.pickups=[];g.player.invulnerable=0;
 const p=g.player;g.projectiles=[{id:1,kind:'enemy-rocket',armyRocket:true,team:'enemy',x:p.x+200,y:p.y-35,vx:-10000,vy:0,damage:7,splash:35,radius:5,life:2}];
 update(g,{},1/30);assert.equal(p.hp,93);assert.equal(g.projectiles.length,0);
});

test('a defensive line permits at most three concurrent attack sequences',()=>{
 const hook=createRedArmyHooks(),enemies=Array.from({length:8},()=>soldier('missile-team','walker'));
 const g={enemies,player:{x:1500,y:620,hp:100},time:1,projectiles:[]};
 for(const e of enemies){e.armyNext=0;hook.advance(e,{g,dt:1/60,groundAt:floor});}
 assert.equal(enemies.filter(e=>e.armyPending.length).length,3);
});

test('the complete first squad is already present before any defender enters view',()=>{
 const g=applyRedWastesLevel(createInkScene());update(g,{},1/60);
 const squad=g.enemies.filter(e=>e.armyGroup==='west-dunes');assert.equal(squad.length,5);
 assert(squad.every(e=>e.x-55>g.viewport.x+g.viewport.w));
});


test('rust Striker collisions and guided target use the same rig as its painting',()=>{
 const e=soldier('heavy','saltik');e.enemyModel='rust-striker';
 const geometry=enemyRustStrikerGeometry(e,1);
 assert.deepEqual(combatBounds(e,1),geometry.bounds);
 assert.deepEqual(combatTarget(e,1).target,geometry.target);
});

test('heavy cannon projectiles leave along the measured painted barrel axis',()=>{
 const e=soldier('heavy','saltik');e.enemyModel='rust-striker';e.armyNext=0;
 const ctx=context(e);ctx.geometry=()=>({muzzle:{x:1980,y:550},muzzleDirection:{x:-.8,y:-.6}});
 const result=createRedArmyHooks().advance(e,ctx),round=result.shots.find(s=>s.kind==='plasma');
 assert(round);assert(Math.abs(round.vx/330+.8)<1e-9);assert(Math.abs(round.vy/330+.6)<1e-9);
});

test('command posts retain three native BT supports beside three additional rust Strikers',()=>{
 const schedule=createRedArmySchedule();assert.equal(schedule.length,96);
 const bts=schedule.filter(e=>e.type==='saltik'&&!e.enemyModel);assert.equal(bts.length,3);
 assert.deepEqual(bts.map(e=>e.armyGroup),['west-bunker','eye-passage','east-bunker']);
 assert(bts.every(e=>e.armyRole==='bt-support'&&e.platformId));
});
test('BT support holds its post with independent heavy triples and rising guided salvos',()=>{
 const e=soldier('bt-support','saltik'),{shots}=simulate(e,22);
 assert.equal(e.x,2000);assert.deepEqual(e.btAimTarget,{x:1500,y:585});
 assert(shots.filter(s=>s.kind==='plasma').every(s=>s.btHeavy&&s.damage===3));
 assert(shots.some(s=>s.kind==='enemy-missile'&&s.salvoCount===8));assert(!shots.some(s=>s.armyRocket));
});

test('native BT and additional rust Striker both fall and persist on their support after real fire',()=>{
 const g=applyRedWastesLevel(createInkScene({level:5}));
 Object.assign(g,{groundAt:floor,platforms:[],worldSolids:[],obstacles:[],pickups:[]});
 Object.assign(g.player,{x:180,y:620,supportY:620,invulnerable:999});
 g.schedule=[{id:'bt-post',type:'saltik',armyRole:'bt-support',armyGroup:'test',x:650,anchorX:650},
  {id:'rust-post',type:'saltik',enemyModel:'rust-striker',armyRole:'heavy',armyGroup:'test',x:1000,anchorX:1000,patrolMin:1000,patrolMax:1000}];
 for(let frame=0;frame<900;frame++)update(g,{fire:true,homing:frame%600===0,missile:frame%330===0},1/60);
 const wrecks=g.enemies.filter(e=>e.groundedDefeat);assert.equal(wrecks.length,2);
 assert(wrecks.some(e=>!e.enemyModel));assert(wrecks.some(e=>e.enemyModel==='rust-striker'));
 const positions=wrecks.map(e=>({x:e.x,y:e.y}));g.player.x=10000;g.schedule=[];
 for(let frame=0;frame<120;frame++)update(g,{},1/60);
 assert.equal(g.enemies.filter(e=>e.groundedDefeat).length,2);
 assert.deepEqual(wrecks.map(e=>({x:e.x,y:e.y})),positions);assert.equal(g.duel,null);
});

test('walker missiles leave their measured weapon mouth along its painted barrel',async()=>{
 const {inkEnemyGeometry}=await import('../src/ink-actors.js');
 const e=soldier('missile-team','walker'),hook=createRedArmyHooks(),ctx=context(e);ctx.geometry=inkEnemyGeometry;
 let missile;
 for(let i=0;i<360&&!missile;i++){ctx.g.time=i/60;const out=hook.advance(e,ctx);missile=out.shots.find(s=>s.kind==='enemy-missile');}
 assert(missile);const geo=inkEnemyGeometry(e,ctx.g.time);
 assert(Math.hypot(missile.x-geo.muzzle.x,missile.y-geo.muzzle.y)<1e-8,'no missile appears from a synthetic point in empty air');
 const speed=Math.hypot(missile.vx,missile.vy);assert(Math.abs(missile.vx/speed-geo.muzzleDirection.x)<1e-8);assert(Math.abs(missile.vy/speed-geo.muzzleDirection.y)<1e-8);
});
