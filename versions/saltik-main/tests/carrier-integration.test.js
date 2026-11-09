import test from 'node:test';import assert from 'node:assert/strict';
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
import {createDroneCarrier,damageCarrierBay} from '../src/drone-carrier.js';
import {inkCarrierGeometry} from '../src/ink-carrier.js';
import {availableCarrierShutdown,navigationContext} from '../src/engine.js';
import {createEnemySaltik} from '../src/enemy-saltik.js';
function fixture(){const g=createInkScene();g.schedule=[];g.obstacles=[];g.platforms=[];g.groundAt=()=>600;g.player.x=8700;g.player.y=600;g.player.supportY=600;g.player.invulnerable=99;g.maxX=8700;g.enemies=[createDroneCarrier({id:901,x:8940,guardianId:902},{y:600,random:.3}),createEnemySaltik({id:902,x:8800,protectsCarrierId:901},{y:600,random:.5})];return g;}
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)updateInkScene(g,input,1/60);};
test('midpoint carrier has its own escort while preserving the three existing Saltiks',()=>{const g=createInkScene(),e=g.schedule.find(e=>e.type==='carrier');assert.ok(e.x>8000&&e.x<9600);assert.equal(g.schedule.filter(e=>e.type==='saltik').length,3);const guard=g.schedule.find(a=>a.id===e.guardianId);assert.equal(guard.protectsCarrierId,e.id);assert.ok(Math.abs(guard.x-e.x)<300);});
test('physical bullets exhaust combat readiness and knock out the intact occupied carrier',()=>{
 const g=fixture(),e=g.enemies[0];g.enemies=[e];e.cooldown=99;e.droneSlots.forEach(s=>s.recharge=99);
 for(let i=0;i<10&&!e.immobilized;i++){
  const r=inkCarrierGeometry(e,g.time).bodyBounds;
  g.projectiles=[{id:900+i,team:'player',kind:'bullet',x:r.x+r.w/2,y:r.y-2,vx:0,vy:600,life:1,radius:1,damage:20}];tick(g,3);
 }
 assert.ok(e.disabled);assert.equal(e.hp,0);assert.equal(g.stats.kills,0);assert.equal(g.events.filter(e=>e.type==='explosion').length,0);assert.ok(!navigationContext(g).targets.some(a=>a.id===e.id));
});
test('carrier releases at most three normal native drones, each undocks before firing, and pause freezes them',()=>{const g=fixture();tick(g,210);const drones=g.enemies.filter(e=>e.carrierId===901);assert.equal(drones.length,3);assert.ok(drones.every(d=>d.scale===1));const shots=g.events.filter(e=>e.type==='enemyshot'&&e.carrierId===901);assert.ok(shots.length);const before=structuredClone(g.enemies);g.status='paused';tick(g,60);assert.deepEqual(g.enemies,before);});
test('guardian gates automatic contact unplug; the settled body remains intact and escorts retire without a kill',()=>{
 const g=fixture(),e=g.enemies[0];tick(g,190);e.bays.forEach((_,i)=>damageCarrierBay(e,i,100));g.player.x=e.x-100;g.player.y=e.y;g.player.onGround=true;assert.equal(availableCarrierShutdown(g),null);
 tick(g,40);const guard=g.enemies.find(a=>a.id===902);guard.neutralized=true;guard.harmless=true;assert.equal(availableCarrierShutdown(g),e);const kills=g.stats.kills;
 tick(g,1);assert.ok(g.carrierShutdown);assert.equal(e.shutdownSettled,true);const prior=structuredClone(g.carrierShutdown);g.status='paused';tick(g,20);assert.deepEqual(g.carrierShutdown,prior);g.status='playing';tick(g,160);
 assert.equal(g.carrierShutdown,null);assert.equal(e.neutralized,true);assert.equal(e.hp,0);assert.equal(g.stats.kills,kills);assert.equal(g.stats.neutralized,1);assert.equal(g.events.filter(e=>e.type==='carrier-disconnected').length,1);
 tick(g,90);assert.equal(g.enemies.filter(a=>a.carrierId===901).length,0);assert.ok(g.enemies.includes(e));assert.equal(g.stats.kills,kills);assert.equal(g.events.filter(e=>e.type==='explosion').length,0);
});
