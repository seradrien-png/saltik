import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene,updateInkScene,inkWeaponGeometry} from '../src/ink-scene.js';
import {podSlotPresentation} from '../src/ink-pods.js';
function quiet(){const g=createInkScene();g.schedule=[];g.platforms=[];g.obstacles=[];g.pickups=[];g.groundAt=()=>620;Object.assign(g.player,{x:200,y:620,supportY:620});g.player.melee.cooldown=99;g.enemies=[{id:700,type:'turret',x:700,y:620,hp:100,maxHp:100,cooldown:99,phase:0}];return g;}
const tick=(g,input={},n=1)=>{for(let i=0;i<n;i++)updateInkScene(g,input,1/120);};
test('actual player salvo empties three slots sequentially at the actual moving native apertures',()=>{
 const g=quiet();tick(g,{homing:true});assert.equal(g.projectiles.filter(s=>s.kind==='homing').length,1);
 assert.deepEqual(g.player.podCycle.fired,[true,false,false]);
 tick(g,{right:true},11);assert.equal(g.projectiles.filter(s=>s.kind==='homing').length,2);
 const second=g.projectiles.find(s=>s.salvoIndex===1);assert.ok(second);assert.ok(second.launchX>200);
 tick(g,{},12);assert.equal(g.projectiles.filter(s=>s.kind==='homing').length,3);
 assert.deepEqual(g.player.podCycle.fired,[true,true,true]);
 assert.equal(g.stats.homingSalvos,1);for(let i=0;i<3;i++)assert.equal(podSlotPresentation(g.player,i).round,0);
});
test('pause freezes delayed pod launch/refill and reload eventually restores all three ready slots',()=>{
 const g=quiet();tick(g,{homing:true});const before=structuredClone(g.player.podCycle);g.status='paused';tick(g,{},300);assert.deepEqual(g.player.podCycle,before);assert.equal(g.projectiles.filter(s=>s.kind==='homing').length,1);
 g.status='playing';tick(g,{},1180);assert.equal(g.player.homingIn,0);for(let i=0;i<3;i++)assert.equal(podSlotPresentation(g.player,i).round,1);
 assert.equal(g.stats.homingSalvos,1);
});

test('three sequential native pod launches still deliver their three physical guided impacts',()=>{
 const g=quiet(),target=g.enemies[0];tick(g,{homing:true});tick(g,{},600);
 assert.equal(target.hp,76);assert.equal(g.stats.homingSalvos,1);
});

test('enemy pods visibly and physically empty as their two missiles leave, and pause freezes the second tube',async()=>{
 const {createEnemySaltik}=await import('../src/enemy-saltik.js');
 const {inkEnemySaltikGeometry}=await import('../src/ink-enemy-saltik.js');
 const g=quiet(),e=createEnemySaltik({id:701,x:700},{y:620,random:.5});e.nextAttack='missile';e.cooldown=0;g.enemies=[e];
 for(let i=0;i<180&&!e.podCycle;i++)tick(g);
 assert.ok(e.podCycle);assert.deepEqual(e.podCycle.fired,[true,false]);
 const shot=g.projectiles.find(s=>s.kind==='enemy-missile'),mouth=inkEnemySaltikGeometry(e,g.time).podMuzzles[0];
 assert.ok(Math.hypot(shot.launchX-mouth.x,shot.launchY-mouth.y)<1e-6);
 const before=structuredClone(e.podCycle);g.status='paused';tick(g,{},60);assert.deepEqual(e.podCycle,before);
 g.status='playing';tick(g,{},14);assert.deepEqual(e.podCycle.fired,[true,true]);
 assert.equal(g.events.filter(event=>event.type==='enemy-missile').length,2);
 assert.equal(podSlotPresentation(e,0).round,0);assert.equal(podSlotPresentation(e,1).round,0);
});

test('starting a boss assault cancels reserved launches instead of firing them after the cinematic',async()=>{
 const {createBossTank}=await import('../src/boss-tank.js');const g=quiet();tick(g,{homing:true});
 g.boss=createBossTank(800,()=>620);g.boss.hp=g.boss.maxHp*.4;g.bossActivated=true;
 tick(g,{bossAction:true});assert.ok(g.bossBreach);assert.deepEqual(g.player.podCycle.pending,[]);
});
