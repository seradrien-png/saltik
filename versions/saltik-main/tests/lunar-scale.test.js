import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene} from '../src/ink-scene.js';
import {inkSaltikGeometry} from '../src/ink-saltik.js';
import {computeSupportPose} from '../src/support-pose.js';
import {inkTurnGeometry} from '../src/ink-turn.js';
test('reduced quarter and front turn views plant their wheels on actual world steps',()=>{
 const floor=x=>600-Math.floor((x-900)/22)*8;
 for(const frame of [1,2,3]){
  const p={x:1000,y:floor(1000),supportY:floor(1000),onGround:true,artScale:.8,turn:{yaw:frame*Math.PI/4}};
  const geo=inkTurnGeometry(p,{camera:137,scale:inkSaltikGeometry(p).scale,sampleGround:floor});
  assert.ok(geo.legs.every(leg=>Math.abs(leg.contact.y-floor(leg.contact.x+137))<.1));
 }
});
test('reduced lunar wheels follow the actual stair heights instead of scaling the terrain',()=>{
 const floor=x=>600-Math.floor((x-900)/22)*8;
 const p={x:1000,y:floor(1000),supportY:floor(1000),onGround:true,artScale:.8};
 p.supportPose=computeSupportPose(p,floor,null,1/60,{retainSurface:true});
 const pose=inkSaltikGeometry(p,{sampleGround:floor});
 assert.ok(pose.legs.every(leg=>Math.abs(leg.contact.y-floor(leg.contact.x))<.1));
});
test('lunar Striker shrinks by twenty percent with its painted weapon mouths, leaving canyon size intact',()=>{
 const canyon=createInkScene(),lunar=createInkScene({level:2});
 for(const dir of [-1,1]){
  const fixed={x:1000,y:600,supportY:600,supportPose:null,tilt:0,dir};
  Object.assign(canyon.player,fixed);Object.assign(lunar.player,fixed);
  const a=inkSaltikGeometry(canyon.player),b=inkSaltikGeometry(lunar.player);
  assert.equal(a.visibleHeight,126);assert.ok(Math.abs(b.visibleHeight-100.8)<1e-8);
  for(const key of ['arm','cannon']){
   assert.ok(Math.abs((b[key].x-1000)-(a[key].x-1000)*.8)<1e-7);
   assert.ok(Math.abs((b[key].y-600)-(a[key].y-600)*.8)<1e-7);
  }
  const weapon=lunar.weaponGeometry(lunar.player,0);assert.deepEqual(weapon.cannon,b.cannon);
 }
});
