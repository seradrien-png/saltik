import test from 'node:test';
import assert from 'node:assert/strict';
import * as pods from '../src/ink-pods.js';
import {inkSaltikGeometry} from '../src/ink-saltik.js';
const p={x:200,y:550,dir:1,onGround:true};
test('three live player pod mouths sit at the centers of existing native tube rings in both facings',()=>{
 assert.equal(typeof pods.inkPlayerPodGeometry,'function');
 for(const dir of [-1,1]){
  const geo=inkSaltikGeometry({...p,dir}),slots=pods.inkPlayerPodGeometry({...p,dir},geo).filter(s=>s.activeIndex>=0);
  assert.equal(slots.length,3);
  for(const slot of slots){assert.deepEqual(slot.muzzle,geo.sourcePoint(slot.center));assert.ok(Math.abs(Math.hypot(slot.axis.x,slot.axis.y)-1)<1e-9);}
 }
});
test('fired tubes stay empty until the refill window and fresh rounds arrive sequentially',()=>{
 const e={podCycle:{elapsed:.5,duration:9.5,fired:[true,true,true]}};
 for(let i=0;i<3;i++)assert.equal(pods.podSlotPresentation(e,i).round,0);
 e.podCycle.elapsed=9.01;const levels=[0,1,2].map(i=>pods.podSlotPresentation(e,i).round);
 assert.ok(levels[0]>levels[2]);assert.ok(levels[0]<1);
 e.podCycle.elapsed=9.5;for(let i=0;i<3;i++)assert.equal(pods.podSlotPresentation(e,i).round,1);
});
test('an untouched reserved tube retains its round until its actual physical launch',()=>{
 const a={podCycle:{elapsed:.04,duration:9.5,fired:[true,false,false]}};
 assert.equal(pods.podSlotPresentation(a,0).round,0);assert.equal(pods.podSlotPresentation(a,1).round,1);
});

test('all painted sockets show their physical pod group readiness without adding launch mouths',async()=>{
 const {inkEnemySaltikGeometry}=await import('../src/ink-enemy-saltik.js');
 const ready=pods.inkPlayerPodGeometry(p,inkSaltikGeometry(p));
 assert.equal(ready.filter(s=>s.activeIndex>=0).length,3);
 assert.ok(ready.every(s=>s.round===1),'decorative holes also contain a solid nose when their pod is ready');
 const firing={...p,podCycle:{elapsed:.04,duration:9.5,fired:[true,false,true]}};
 const playerSlots=pods.inkPlayerPodGeometry(firing,inkSaltikGeometry(firing));
 assert.deepEqual(playerSlots.map(s=>s.round),[0,0,0,0,1,1,0,0]);
 assert.ok(playerSlots.filter(s=>s.activeIndex<0).every(s=>s.flash===0),'only actual launch mouths flash');
 const enemy={x:600,y:550,dir:1,podCycle:{elapsed:.04,duration:2.2,fired:[true,false]}};
 const enemySlots=pods.inkEnemyPodGeometry(enemy,inkEnemySaltikGeometry(enemy));
 assert.equal(enemySlots.filter(s=>s.activeIndex>=0).length,2);
 assert.deepEqual(enemySlots.map(s=>s.round),[0,0,0,0,1,1,1,1]);
 const turned={...firing,turn:{active:true,yaw:3*Math.PI/4}};
 assert.deepEqual(pods.inkPlayerPodGeometry(turned,inkSaltikGeometry(turned)).map(s=>s.round),[1,1,0,0,0,0,0,0]);
});

test('turning keeps pod round state registered to all three native turnaround views',async()=>{
 const {inkTurnGeometry}=await import('../src/ink-turn.js');
 const centers=[[168,328.5],[821,337.5],[2003.5,328.5]];
 for(let frame=1;frame<=3;frame++){
  const actor={...p,turn:{active:true,yaw:frame*Math.PI/4},podCycle:{elapsed:1,duration:9.5,fired:[true,true,true]}};
  const native=inkTurnGeometry(actor),slot=pods.inkPlayerPodGeometry(actor,inkSaltikGeometry(actor)).find(s=>s.activeIndex===0);
  assert.deepEqual(slot.muzzle,native.point(centers[frame-1]));assert.equal(slot.round,0);
 }
});

test('a committed missile uses the same rear-plane scale as a held evade render',async()=>{
 const {inkWeaponGeometry}=await import('../src/ink-scene.js');
 const actor={...p,evasion:{active:true}},regular=pods.inkPlayerPodGeometry(p,inkSaltikGeometry(p)).filter(s=>s.activeIndex>=0);
 const actual=inkWeaponGeometry(actor,0);
 for(let i=0;i<3;i++){
  assert.ok(Math.abs(actual.cabinTubes[i].muzzle.x-(p.x+(regular[i].muzzle.x-p.x)*.92))<1e-8);
  assert.ok(Math.abs(actual.cabinTubes[i].muzzle.y-(p.y+(regular[i].muzzle.y-p.y)*.92))<1e-8);
 }
});
