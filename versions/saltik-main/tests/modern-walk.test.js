import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene} from '../src/ink-scene.js';
import {inkSaltikGeometry} from '../src/ink-saltik.js';
import {inkEnemySaltikGeometry} from '../src/ink-enemy-saltik.js';
const limbs=g=>g.modernLegs??g.nativeLegs??g.btNative?.legs;
for(const character of ['striker','gatling','bt'])test(`${character} keeps a fixed rolling leg stance across distance and time in all worlds`,()=>{
 for(const level of [1,2,3,4,5])for(const dir of [-1,1])for(const artScale of [.55,1,1.4]){
  const p={...createInkScene({level,character}).player,x:1000,y:600,supportY:600,supportPose:null,onGround:true,turn:null,vx:230,motionLean:0,motionHeave:0,dir,artScale};
  const a=inkSaltikGeometry({...p,motionDistance:5},{time:1}),b=inkSaltikGeometry({...p,motionDistance:125},{time:4});
  assert.deepEqual(limbs(a).map(l=>[l.roll,l.offset,l.contact]),limbs(b).map(l=>[l.roll,l.offset,l.contact]));
  for(const l of limbs(a))assert(Math.abs(l.contact.y-600)<=3*artScale,`${character} keeps the native resting wheel height`);
 }
});
test('enemy BT rolling legs do not stride or lift while travelling',()=>{
 for(const btVariant of [undefined,'desert']){
  const e={x:1000,y:600,hp:40,dir:1,vx:120,onGround:true,btVariant};
  const a=inkEnemySaltikGeometry({...e,motionDistance:5},1),b=inkEnemySaltikGeometry({...e,motionDistance:125},4);
  assert.deepEqual(a.legs.map(l=>[l.roll,l.offset,l.contact]),b.legs.map(l=>[l.roll,l.offset,l.contact]));
 }
});
