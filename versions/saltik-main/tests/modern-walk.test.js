import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene} from '../src/ink-scene.js';
import {inkSaltikGeometry} from '../src/ink-saltik.js';
const legs=g=>g.modernLegs??g.nativeLegs;
const actor=(character,level=1)=>({...createInkScene({character,level}).player,x:1000,y:600,supportY:600,supportPose:null,onGround:true,turn:null,vx:180});
for(const character of ['striker','gatling']){
 test(`${character} advances restrained alternating feet by travelled distance on every mission`,()=>{
  for(const level of [1,2,3,4])for(const dir of [-1,1])for(const artScale of [.55,1,1.4]){
   const p={...actor(character,level),dir,artScale},a=inkSaltikGeometry({...p,motionDistance:11*Math.PI/2}),b=inkSaltikGeometry({...p,motionDistance:11*Math.PI*1.5});
   for(const [i,leg]of legs(a).entries()){
    assert(Math.abs(leg.stride*a.nativeK)>0.3*artScale,'moving feet must articulate');
    assert(Math.abs(leg.stride*a.nativeK)<=1.5*artScale+1e-9);
    assert(leg.stride*legs(b)[i].stride<0,'successive half-strides must alternate');
    assert(Math.abs(leg.contact.x-legs(b)[i].contact.x)>.6*artScale,'rendered wheel contact must move with its leg');
    assert(Math.abs(leg.contact.y-(600-leg.lift))<1e-6,'foot must meet its terrain ray minus a small lift');
    assert(leg.lift>=0&&leg.lift<=.65*artScale+1e-9);
   }
   assert(legs(a)[0].stride*legs(a)[1].stride<0,'middle leg must oppose outer legs');
   const same=inkSaltikGeometry({...p,motionDistance:11*Math.PI/2},{time:19});
   assert.deepEqual(legs(a).map(l=>[l.stride,l.lift]),legs(same).map(l=>[l.stride,l.lift]));
  }
 });
 test(`${character} keeps idle, airborne, turns and scripted poses outside the walking gait`,()=>{
  for(const pose of [{vx:0},{onGround:false},{turn:{active:true,yaw:Math.PI/4}},{knockedOut:true},{modernStage:{}},{gatlingStage:{}},{gatlingInteraction:true},{jumpLegs:{spread:.4}}]){
   const p={...actor(character),...pose},a=inkSaltikGeometry({...p,motionDistance:5}),b=inkSaltikGeometry({...p,motionDistance:28});
   assert.deepEqual(legs(a).map(l=>[l.roll,l.offset,l.contact]),legs(b).map(l=>[l.roll,l.offset,l.contact]));
  }
 });
 test(`${character} walking leaves measured weapon geometry intact and retains crouch support`,()=>{
  const p={...actor(character),crouching:true},a=inkSaltikGeometry({...p,motionDistance:0}),b=inkSaltikGeometry({...p,motionDistance:11*Math.PI/2});
  assert.deepEqual(a.cannon,b.cannon);assert.deepEqual(a.arm,b.arm);
  for(const leg of legs(b))assert(Math.abs(leg.contact.y-(600-leg.lift))<1e-6);
 });
}

test('alternate desert Striker and original Gatling chassis use the same restrained walking envelope',()=>{
 for(const p of [{...actor('striker'),strikerVariant:'desert'},{...actor('gatling'),visualModel:undefined}]){
  const g=inkSaltikGeometry({...p,motionDistance:11*Math.PI/2});
  for(const leg of legs(g)){assert(Math.abs(leg.stride*g.nativeK)>1);assert(Math.abs(leg.contact.y-(600-leg.lift))<1e-6);}
 }
});
