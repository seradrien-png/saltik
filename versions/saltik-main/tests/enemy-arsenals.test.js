import test from 'node:test';
import assert from 'node:assert/strict';
import {createRedArmyHooks} from '../src/red-army.js';
import {createEnemySaltik,advanceEnemySaltik} from '../src/enemy-saltik.js';
import {createInkScene} from '../src/ink-scene.js';
import {update} from '../src/engine.js';
const geometry=e=>({target:{x:e.x,y:580},muzzle:{x:e.x-40,y:570},muzzleDirection:{x:-1,y:0},podMuzzles:[{x:e.x-20,y:530},{x:e.x+20,y:530}],podDirections:[{x:-.2,y:-1},{x:.2,y:-1}]});
function army(role,seconds=25){const hook=createRedArmyHooks(),e={id:role,type:'saltik',hp:40,x:700,y:620,armyRole:role,enemyModel:role==='heavy'?'rust-striker':undefined,patrolMin:700,patrolMax:700};hook.initialize(e);const shots=[],events=[],frames=[];const g={player:{x:200,y:620,hp:100},projectiles:[],time:0,enemies:[e]};for(let i=0;i<seconds*120;i++){g.time=i/120;const out=hook.advance(e,{g,dt:1/120,groundAt:()=>620,geometry});shots.push(...out.shots.map(s=>({...s,time:g.time})));events.push(...out.events);frames.push({...e});}return {e,shots,events,frames};}
test('rust main uses playable continuous fire and reload while guided and MIRV remain independent',()=>{const r=army('heavy',12),main=r.shots.filter(s=>s.kind==='plasma');assert(main.length>60);assert(main.some((s,i)=>i&&s.time-main[i-1].time>.095-.01&&s.time-main[i-1].time<.11));assert(r.frames.some(e=>e.armyMainReload>1));assert(r.shots.some(s=>s.kind==='enemy-mirv'&&s.hp===1));assert(r.shots.some(s=>s.kind==='enemy-missile'&&s.hostileLoft));});
test('BT progressively locks physical 2/4/8-round salvos and always fires heavy triples',()=>{const r=army('bt-support',40),counts=r.events.filter(e=>e.type==='enemy-lock').map(e=>e.salvoCount);assert(counts.includes(2)&&counts.includes(4)&&counts.includes(8));assert(r.shots.filter(s=>s.kind==='plasma').every(s=>s.btHeavy&&s.damage===3));assert(r.shots.filter(s=>s.kind==='enemy-missile').every(s=>s.hp===1&&s.hostileLoft));});
test('native BT has exact three cannon rounds and progressive missile capacity',()=>{const e=createEnemySaltik({id:'native',x:700},{y:620,random:.2}),shots=[];for(let i=0;i<40*120;i++)shots.push(...advanceEnemySaltik(e,{player:{x:200,y:620,hp:100},dt:1/120,time:i/120,geometry}).shots);assert(shots.filter(s=>s.kind==='plasma').every(s=>s.btHeavy));assert(shots.some(s=>s.salvoCount>=8));});
function scene(){const g=createInkScene({character:'gatling'});Object.assign(g,{schedule:[],enemies:[],pickups:[],obstacles:[],platforms:[],worldSolids:[],groundAt:()=>620});Object.assign(g.player,{x:200,y:620,supportY:620,invulnerable:999});return g;}
test('hostile missile physically rises to a peak then dives, and Gatling bullet intercepts its dive',()=>{const g=scene(),s={id:1,kind:'enemy-missile',team:'enemy',x:650,y:510,vx:-65,vy:-245,hostileLoft:true,hp:1,damage:8,life:7,radius:6,age:0};g.projectiles=[s];let peak=510,descended=false;for(let i=0;i<240;i++){update(g,{},1/120);if(!g.projectiles.includes(s))break;peak=Math.min(peak,s.y);if(i===71)assert(s.y<385,'missile keeps a readable full ascent before steering toward the player');if(s.vy>60&&s.y>peak+20){descended=true;break;}}assert(peak<410);assert(descended);for(let i=0;i<180&&g.projectiles.includes(s);i++)update(g,{fire:true},1/120);assert(g.stats.shots>0);assert.equal(g.stats.interceptions,1);assert(!g.projectiles.includes(s));});
test('hostile MIRV splits into native ballistic enemy children without friendly blasts',()=>{const g=scene();g.projectiles=[{id:1,kind:'enemy-mirv',team:'enemy',sourceEnemyId:'rust',x:600,y:250,vx:-200,vy:-100,age:.71,life:4,hp:1,damage:6,splash:65,radius:6,dir:-1,trail:[]}];update(g,{},1/60);assert.equal(g.projectiles.length,5);assert(g.projectiles.every(s=>s.team==='enemy'&&s.kind==='enemy-cluster'&&s.hp===1));});
test('Striker stream duration and reload match the playable constants without out-of-range catch-up',async()=>{
 const {PRIMARY_FIRE_TIME,PRIMARY_RELOAD}=await import('../src/engine.js');const r=army('heavy',6),main=r.shots.filter(s=>s.kind==='plasma');
 const gap=main.findIndex((s,i)=>i&&s.time-main[i-1].time>.5);assert(gap>0);
 assert(Math.abs(main[gap-1].time-main[0].time-PRIMARY_FIRE_TIME)<.16);
 assert(Math.abs(main[gap].time-main[0].time-(PRIMARY_FIRE_TIME+PRIMARY_RELOAD))<.04);
 const hook=createRedArmyHooks(),e=r.e,g={player:{x:5000,y:620,hp:100},projectiles:[],time:0,enemies:[e]};
 for(let i=0;i<300;i++)hook.advance(e,{g,dt:1/60,groundAt:()=>620,geometry});g.player.x=200;
 assert(hook.advance(e,{g,dt:1/60,groundAt:()=>620,geometry}).shots.filter(s=>s.kind==='plasma').length<=1);
});
test('BT actual tube stock refills after five quiet seconds at two-second intervals',()=>{
 const e=createEnemySaltik({id:'stock',x:700},{y:620,random:0});Object.assign(e,{missileStock:0,missileLoaded:Array(16).fill(false),missileCooldown:100,btMainClock:100});
 const step=()=>advanceEnemySaltik(e,{player:{x:200,y:620,hp:100},dt:.01,geometry});
 for(let i=0;i<690;i++)step();assert.equal(e.missileStock,0);
 for(let i=0;i<20;i++)step();assert.equal(e.missileStock,1);assert.equal(e.missileLoaded.filter(Boolean).length,1);
 for(let i=0;i<200;i++)step();assert.equal(e.missileStock,2);
});
test('KO and player death cancel army queued launches, while enemy physical shots remain bounded',()=>{
 const hook=createRedArmyHooks(),e={id:'dead',type:'saltik',hp:40,x:700,y:620,armyRole:'heavy',patrolMin:700,patrolMax:700};hook.initialize(e);
 const g={player:{x:200,y:620,hp:100},projectiles:[],time:0,enemies:[e]};e.armyNext=0;hook.advance(e,{g,dt:.01,groundAt:()=>620,geometry});assert(e.armyPending.length);
 e.hp=0;assert.equal(hook.advance(e,{g,dt:3,groundAt:()=>620,geometry}).shots.length,0);assert.equal(e.armyPending.length,0);
 const bt=createEnemySaltik({id:'cap',x:700},{y:620,random:0});bt.cooldown=0;bt.missileCooldown=0;
 for(let i=0;i<100;i++)assert.equal(advanceEnemySaltik(bt,{player:g.player,dt:.1,geometry,enemyProjectileCount:48}).shots.length,0);
 assert.equal(bt.missileStock,16);
});
