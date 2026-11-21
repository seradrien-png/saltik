import test from 'node:test';
import assert from 'node:assert/strict';
import {wheelRollPhase,drawWheelRoll} from '../src/wheel-roll.js';
test('rolling depends on signed travelled distance, freezes with time, and reverses in either facing',()=>{
 for(const dir of [-1,1]){
  const e={motionDistance:31,dir},hub=[20,30,10,15];
  const phase=wheelRollPhase(e,hub,.2,dir);
  assert.equal(phase,wheelRollPhase({...e,time:999,vx:0},hub,.2,dir));
  assert.equal(wheelRollPhase({...e,motionDistance:-31},hub,.2,dir),-phase);
  assert.equal(wheelRollPhase({...e,groundedDefeat:true},hub,.2,dir),0);
 }
});
test('projected wheel texture is ellipse constrained and never rotates the tire silhouette',()=>{
 const calls=[],c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args])});
 drawWheelRoll(c,{hub:[20,30,10,15,.25],spin:1.2});
 assert(calls.some(([k])=>k==='clip'));assert(calls.some(([k])=>k==='ellipse'));
 assert(!calls.some(([k])=>k==='drawImage'));assert(!calls.some(([k])=>k==='rotate'));
});

test('native Striker, Gatling and BT roll in place across costumes and facings without walking their roots',async()=>{
 const {createInkScene}=await import('../src/ink-scene.js');
 const {inkSaltikGeometry}=await import('../src/ink-saltik.js');
 const {inkEnemySaltikGeometry}=await import('../src/ink-enemy-saltik.js');
 const {enemyRustStrikerGeometry}=await import('../src/enemy-rust-striker-art.js');
 for(const dir of [-1,1]){
  const samples=[];
  for(const character of ['striker','gatling'])for(const level of [1,5]){
   const p={...createInkScene({character,level}).player,x:500,y:600,onGround:true,supportY:600,supportPose:null,dir,turn:null,motionDistance:0};
   samples.push([p,(p,t)=>{const g=inkSaltikGeometry(p,{time:t});return{legs:g.modernLegs??g.nativeLegs,root:[g.x,g.y,g.tilt,g.bodyDrop,g.heave]};}]);
  }
  for(const btVariant of [undefined,'desert'])samples.push([{x:500,y:600,onGround:true,dir,hp:40,btVariant,motionDistance:0},(p,t)=>{const g=inkEnemySaltikGeometry(p,t);return{legs:g.legs,root:[g.x,g.y,g.rotation,g.bodyDrop,g.heave]};}]);
  samples.push([{x:500,y:600,dir,hp:40,motionDistance:0},(p,t)=>{const g=enemyRustStrikerGeometry(p,t);return{legs:g.legs,root:[g.x,g.y,g.rotation]};}]);
  for(const [p,geometry]of samples){
   const a=geometry(p,0),b=geometry({...p,motionDistance:37},0),paused=geometry({...p,motionDistance:37},400);
   assert.deepEqual(a.root,b.root);assert.deepEqual(a.legs.map(l=>l.contact),b.legs.map(l=>l.contact));
   assert(b.legs.every(l=>Number.isFinite(l.spin)&&Math.abs(l.spin)>.01));
   assert.deepEqual(b.legs.map(l=>l.spin),paused.legs.map(l=>l.spin));
   assert.deepEqual(a.legs.map(l=>l.jumpPose),b.legs.map(l=>l.jumpPose));
  }
 }
});

test('native enemy launch mouths retain measured upward physical axes during lock and launch',async()=>{
 const {inkEnemySaltikGeometry}=await import('../src/ink-enemy-saltik.js');
 const {enemyRustStrikerGeometry}=await import('../src/enemy-rust-striker-art.js');
 for(const dir of [-1,1])for(const btVariant of [undefined,'desert'])for(const attackPhase of ['lock','launch']){
  const e={x:500,y:600,dir,hp:40,btVariant,podRaise:1,attackPhase,lockProgress:1};
  for(const g of [inkEnemySaltikGeometry(e),enemyRustStrikerGeometry(e)]){
   for(const slot of g.podSlots){assert(slot.axis.y<-.7);assert(Math.abs(Math.hypot(slot.axis.x,slot.axis.y)-1)<1e-8);assert(slot.muzzle.y<slot.base.y);}
  }
 }
});
