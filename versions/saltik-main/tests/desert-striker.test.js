import test from 'node:test';
import assert from 'node:assert/strict';
import * as pods from '../src/ink-pods.js';

test('desert Striker covers follow the three native launch groups without inventing five rounds',()=>{
 assert.equal(typeof pods.desertPodPresentation,'function');
 const actor={podCycle:{elapsed:.2,duration:9.5,fired:[true,false,false],firedAt:[0,null,null]}};
 const slots=Array.from({length:8},(_,i)=>pods.desertPodPresentation(actor,i));
 assert.deepEqual(slots.map(s=>s.round),[0,0,0,0,1,1,1,1]);
 assert.equal(slots[4].round,1);
 assert.equal(slots[7].round,1);
 assert.deepEqual(slots.filter(s=>s.activeIndex>=0).map(s=>s.activeIndex),[0,1,2]);
 assert.ok(slots.filter(s=>s.activeIndex<0).every(s=>s.flash===0));
});

test('desert launch covers stay open until native recharge completes',()=>{
 assert.equal(typeof pods.desertPodPresentation,'function');
 const actor={homingIn:.01,podCycle:{elapsed:9.49,duration:9.5,fired:[true,true,true],firedAt:[0,.085,.17]}};
 for(const i of [2,4,7])assert.equal(pods.desertPodPresentation(actor,i).round,0);
 actor.podCycle.elapsed=9.5;actor.homingIn=0;
 for(const i of [2,4,7])assert.equal(pods.desertPodPresentation(actor,i).round,1);
 actor.podCycle=null;
 for(const i of [2,4,7])assert.equal(pods.desertPodPresentation(actor,i).round,1);
});

import {nativeTurnView,nativeTurnSockets} from '../src/character-turns.js';
const desert={x:200,y:550,character:'striker',visualModel:'modern-striker',strikerVariant:'desert',dir:1,onGround:true};
test('rusted Striker has eight individually registered turn frames and eight finite physical sockets',()=>{
 const crops=new Set();
 for(let i=0;i<8;i++){
  const actor={...desert,turn:{active:true,yaw:i*Math.PI/4}},view=nativeTurnView(actor);
  assert.ok(view,'desert direction '+i+' has its own drawing');
  assert.equal(view.model,'desert-striker');
  crops.add(view.crop.join(','));
  const tubes=nativeTurnSockets(actor);assert.equal(tubes.length,8);
  assert.ok(tubes.every(t=>Number.isFinite(t.muzzle.x)&&Number.isFinite(t.muzzle.y)));
 }
 assert.equal(crops.size,8);
});

import {inkSaltikGeometry} from '../src/ink-saltik.js';
test('rusted Striker geometry uses its own source pixels at one uniform gameplay height',()=>{
 const geo=inkSaltikGeometry(desert),crouch=inkSaltikGeometry({...desert,crouching:true});
 assert.equal(geo.modernProfile?.id,'desert-striker');
 assert.equal(geo.nativeK,126/1075);
 assert.deepEqual(geo.modernProfile.size,[1448,1086]);
 assert.ok(geo.modernLegs.every(l=>Math.abs(l.contact.y-desert.y)<.01));
 assert.ok(crouch.modernLegs.every(l=>Math.abs(l.contact.y-desert.y)<.01));
 assert.equal(geo.modernTubes.length,8);
 assert.deepEqual(geo.modernTubes[2].muzzle,geo.nativePoint([420,472]));
 assert.deepEqual(geo.modernGuns[0].muzzle,geo.nativePoint([1182,207]));
});

import {DESERT_STRIKER_TURN_LEGS} from '../src/desert-striker-art.js';
test('desert turn suspension masks keep both face eyes in the rigid cabin',()=>{
 const inside=([x,y],poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)yes=!yes;}return yes;};
 const eyes=[[[314,260],[348,260]],[[264,260],[303,260]],[[194,260],[244,260]],[[145,260],[180,260]],[[125,268],[156,267]]];
 for(let i=0;i<eyes.length;i++)for(const eye of eyes[i])assert.ok(DESERT_STRIKER_TURN_LEGS[i].every(l=>!inside(eye,l.poly)),'frame '+i+' keeps eye '+eye);
});
