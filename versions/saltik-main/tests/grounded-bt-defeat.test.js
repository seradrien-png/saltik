import test from 'node:test';
import assert from 'node:assert/strict';
import {groundedBTDefeatPose,BT_COLLAPSE_SECONDS} from '../src/grounded-bt-defeat.js';
import {inkEnemySaltikGeometry,drawInkEnemySaltik} from '../src/ink-enemy-saltik.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('BT collapse keeps its lowest tire on the support in both directions and freezes after settling',()=>{
 for(const dir of [-1,1])for(const slope of [0,.12,-.1]){
  const e={x:500,y:600,dir,defeatStartedAt:10,supportPose:{surface:{x:300,step:10,heights:Array.from({length:41},(_,i)=>600+(300+i*10-500)*slope)}}};
  const contacts=[-60,0,70].map(x=>({x:e.x+x,y:e.y+x*slope}));
  for(const elapsed of [0,.12,.3,BT_COLLAPSE_SECONDS,10]){
   const pose=groundedBTDefeatPose(e,10+elapsed,{contacts}),co=Math.cos(pose.rotation),si=Math.sin(pose.rotation);
   const gaps=contacts.map(point=>{const x=point.x-e.x,y=point.y-e.y,xx=e.x+x*co-y*si,yy=e.y+pose.offsetY+x*si+y*co;return yy-(600+(xx-500)*slope);});
   near(Math.max(...gaps),0);assert.ok(gaps.every(gap=>gap<1e-7));
  }
  assert.deepEqual(groundedBTDefeatPose(e,11,{contacts}),groundedBTDefeatPose(e,100,{contacts}));
 }
});

test('native BT stance stays fixed across walking distance while jumps and crouching remain distinct',()=>{
 const e={x:500,y:600,dir:1,hp:40,onGround:true,vx:120,motionDistance:0};
 const a=inkEnemySaltikGeometry(e,1),b=inkEnemySaltikGeometry({...e,motionDistance:400},5);
 assert.equal(a.bodyDrop,b.bodyDrop);assert.deepEqual(a.legs.map(p=>p.contact),b.legs.map(p=>p.contact));
 assert.ok(a.legs.every(p=>p.lift===0));assert.deepEqual(a.arms.map(p=>p.rotation),b.arms.map(p=>p.rotation));
 const crouch=inkEnemySaltikGeometry({...e,bt:{loaded:[],aimPoints:[]},crouching:true});assert.equal(crouch.bodyDrop,12);
 const jump=inkEnemySaltikGeometry({...e,onGround:false});assert.ok(jump.legs.some(p=>p.offset!==a.legs[0].offset));
});

test('a defeated BT draws the original costume while leaving simulation and position intact',()=>{
 const image={id:'original-desert-costume'},e={x:500,y:600,dir:-1,hp:0,groundedDefeat:true,defeatStartedAt:10,btVariant:'desert',neutralized:true,firePose:1,guard:true};
 const calls=[],c=new Proxy({globalAlpha:1,drawImage:(...args)=>calls.push(args)}, {get:(target,key)=>key in target?target[key]:()=>{}}),before=structuredClone(e);
 const geo=drawInkEnemySaltik(c,image,e,{camera:300,time:11});
 assert.ok(geo);assert.ok(calls.length>0);assert.ok(calls.every(call=>call[0]===image));assert.deepEqual(e,before);
 assert.equal(drawInkEnemySaltik(c,image,{...e,groundedDefeat:false}),null);
});
