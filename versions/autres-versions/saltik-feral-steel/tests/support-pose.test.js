import test from 'node:test';
import assert from 'node:assert/strict';
import {computeSupportPose,SUPPORT_CONTACTS} from '../src/support-pose.js';
import {terrainHeight} from '../src/world.js';
import {tachikomaGeometry} from '../src/tachikoma-pose.js';
const player={x:400,y:500,supportY:500,dir:1,onGround:true,vy:0};
const close=(a,b,tolerance=1e-7)=>assert.ok(Math.abs(a-b)<tolerance,`${a} versus ${b}`);

test('measured native wheelbase spans the front and both rear visible wheels',()=>{
  assert.deepEqual(SUPPORT_CONTACTS.map(c=>c.id),['front','rear-near','rear-far']);
  assert.ok(Math.max(...SUPPORT_CONTACTS.map(c=>c.x))-Math.min(...SUPPORT_CONTACTS.map(c=>c.x))>95);
});

test('best-fit native support plants every wheel on rising and falling terrain in either facing',()=>{
  for(const dir of [-1,1])for(const slope of [-.16,.16]){
    const p={...player,dir},floor=x=>500+(x-400)*slope,pose=computeSupportPose(p,floor);
    assert.equal(p.y,500);assert.equal(pose.grounded,true);assert.equal(Math.sign(pose.tilt),Math.sign(slope));
    close(pose.tilt,Math.atan(slope),.002);
    for(const contact of pose.contacts){assert.equal(contact.grounded,true);close(contact.y,floor(contact.x));assert.ok(Math.abs(contact.offset)<=9);}
    const geo=tachikomaGeometry({...p,supportPose:pose,tilt:pose.tilt});
    for(const part of geo.distalParts){const contact=pose.contacts.find(c=>c.id===part.id);close(part.contact.y,contact.y,.04);}
  }
});

test('rough terrain uses different native distal travel without moving physical feet',()=>{
  const floor=x=>500+Math.sin((x-400)/13)*5,p={...player},pose=computeSupportPose(p,floor);
  assert.equal(p.y,500);assert.ok(Math.abs(pose.tilt)<=.20);assert.ok(Math.abs(pose.heave)<=6);
  assert.ok(new Set(pose.contacts.map(c=>c.offset.toFixed(2))).size>1);
  for(const c of pose.contacts){assert.ok(Math.abs(c.offset)<=9);if(c.grounded)close(c.y,floor(c.x));}
});

test('edge nulls stay unplanted and never sample an unrelated lower floor',()=>{
  const pose=computeSupportPose(player,x=>x>420?null:500);
  const edge=pose.contacts.find(c=>c.id==='front');assert.equal(edge.grounded,false);assert.equal(edge.y,null);
  assert.ok(pose.contacts.some(c=>c.grounded));
  const empty=computeSupportPose(player,()=>null,pose,.03);assert.equal(empty.grounded,false);
  assert.ok(empty.contacts.every(c=>!c.grounded&&c.y===null));
});

test('jump and native turns relax support without planting any wheel',()=>{
  const initial=computeSupportPose(player,x=>500+(x-400)*.18);
  for(const state of [{onGround:false,vy:-100},{turn:{active:true,yaw:Math.PI/4}}]){
    let pose=initial;for(let i=0;i<45;i++)pose=computeSupportPose({...player,...state},()=>{throw Error('air/turn sampled ground');},pose,1/60);
    assert.equal(pose.grounded,false);assert.ok(Math.abs(pose.tilt)<.002);assert.ok(Math.abs(pose.heave)<.02);
    assert.ok(pose.contacts.every(c=>!c.grounded&&Math.abs(c.offset)<.02));
  }
});

test('support envelope respects upper-slab clearance and keeps exact physical world registration',()=>{
  const p={...player,supportClearance:107},pose=computeSupportPose(p,x=>500+(x-400)*.25);
  const front=tachikomaGeometry({...p,supportPose:pose,tilt:pose.tilt,depth:0});
  const plan=tachikomaGeometry({...p,supportPose:pose,tilt:pose.tilt,depth:1});
  assert.ok(front.bounds.y>=500-107-1e-6);close(plan.y,front.y);close(plan.top,front.top);close(plan.k,front.k);assert.equal(p.y,500);
  for(let i=0;i<front.distalParts.length;i++)close(plan.distalParts[i].contact.y,front.distalParts[i].contact.y);
});

test('invalid sample values and elapsed times never create nonfinite support geometry',()=>{
  for(const dt of [NaN,Infinity,-1,0,.016]){
    const pose=computeSupportPose(player,()=>NaN,{tilt:NaN,heave:Infinity,contacts:[]},dt);
    assert.ok(Number.isFinite(pose.tilt)&&Number.isFinite(pose.heave));
    assert.ok(pose.contacts.every(c=>Number.isFinite(c.x)&&Number.isFinite(c.offset)&&c.y===null));
  }
});

test('each gait, crouch and punch wheel samples the actual native painted X in either direction',()=>{
  for(const dir of [-1,1])for(const state of [
    {vx:230,time:.02},{vx:230,time:.12},{vx:230,time:.22},{vx:230,time:1.1167},
    {crouching:true},{melee:{phase:'windup'}},{melee:{phase:'impact'}},{melee:{phase:'recovery'}},
  ]){
    const x=14256.833,p={...player,x,y:terrainHeight(x),dir,...state};
    const supportPose=computeSupportPose(p,terrainHeight),geo=tachikomaGeometry({...p,tilt:supportPose.tilt,supportPose},state.time||0);
    assert.equal(geo.distalParts.length,3);
    assert.ok(geo.distalParts.some(part=>part.grounded));
    for(const part of geo.distalParts)if(part.grounded)close(part.contact.y,terrainHeight(part.contact.x),.05);
    // At the new canyon's steeper shoulders, a wheel may reach its actual
    // nine-unit travel limit and remain unplanted instead of stretching.
    // Read-only browser snapshots have no live callback; their sampled surface
    // must reproduce the same floor with subpixel error as well.
    const snapshot=tachikomaGeometry({...p,tilt:supportPose.tilt,supportPose:JSON.parse(JSON.stringify(supportPose))},state.time||0);
    for(const part of snapshot.distalParts)if(part.grounded)close(part.contact.y,terrainHeight(part.contact.x),.05);
  }
});

test('the full melee hand crop also fits the nearest upper-slab envelope on a steep floor',()=>{
  for(const dir of [-1,1])for(const slope of [-.3,.3])for(const phase of ['windup','impact','recovery']){
    const p={...player,dir,supportClearance:107},supportPose=computeSupportPose(p,x=>500+(x-400)*slope);
    const geo=tachikomaGeometry({...p,tilt:supportPose.tilt,supportPose,melee:{phase}});
    assert.ok(geo.bounds.y>=393-1e-6,`melee ${phase} top ${geo.bounds.y} crossed ceiling 393`);
  }
});
