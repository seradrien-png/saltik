import test from 'node:test';
import assert from 'node:assert/strict';
import * as pose from '../src/tachikoma-pose.js';
import {createEvasionState,beginEvasion,advanceEvasion} from '../src/evasion.js';
import {computeSupportPose} from '../src/support-pose.js';
const base={x:300,y:550,supportY:550,onGround:true,vx:0,vy:0,dir:1};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} versus ${b}`);
const evade=elapsed=>{const state=createEvasionState();beginEvasion(state);advanceEvasion(state,elapsed);return state;};

test('rear dodge retains native measured crops while the tilt holds one raised-leg silhouette',()=>{
  assert.equal(pose.DODGE_ATLAS?.length,8);assert.equal(pose.DODGE_ATLAS_WIDTH,1536);assert.equal(pose.DODGE_ATLAS_HEIGHT,1024);
  assert.ok(pose.DODGE_ATLAS[1].crop[0]+pose.DODGE_ATLAS[1].crop[2]>768,'raised-leg silhouette crosses its nominal cell boundary');
  for(const elapsed of [0,.2,1.5,1.9])for(const dir of [-1,1]){
    const p={...base,dir,evasion:evade(elapsed),melee:{phase:'impact'},turn:{active:true,yaw:Math.PI/2}},geo=pose.tachikomaGeometry(p);
    assert.equal(geo.atlas,'saltik-dodge');assert.equal(geo.frame,1);assert.equal(geo.distalParts.length,0);assert.equal(geo.weaponsLocked,true);
    assert.equal(p.y,550);assert.equal(geo.y,550);assert.ok(geo.bounds.h>45&&geo.bounds.h<135);
    for(const value of [...Object.values(geo.bounds),...Object.values(geo.cannon),...Object.values(geo.cannonDirection)])assert.ok(Number.isFinite(value));
  }
});
test('depth remnants never shift body, support or melee world registration',()=>{
  for(const depth of [.2,1]){
    const original=pose.tachikomaGeometry(base),old=pose.tachikomaGeometry({...base,depth,shiftIn:.5});assert.deepEqual(old.bounds,original.bounds);
    assert.deepEqual(pose.tachikomaMeleeReach({...base,depth}),pose.tachikomaMeleeReach(base));
  }
});
test('main barrel uses the measured pivot and aperture for its raised native axis in every action and melee stance',()=>{
  const elevation=Math.atan2(600,325);
  for(const dir of [-1,1])for(const state of [{},{vx:200,time:.02},{vx:200,time:.12},{vx:200,time:.22},{vx:200,time:.32},{crouching:true},{onGround:false,vy:-100},{damagePose:true},...['windup','impact','recovery'].map(phase=>({melee:{phase}}))]){
    const p={...base,dir,tilt:.17,...state},flat=pose.tachikomaGeometry(p,state.time),geo=pose.tachikomaGeometry({...p,cannonElevation:elevation},state.time);
    const raw={x:325*dir,y:-600},speed=Math.hypot(raw.x,raw.y),want={x:(raw.x*Math.cos(.17)-raw.y*Math.sin(.17))/speed,y:(raw.x*Math.sin(.17)+raw.y*Math.cos(.17))/speed};
    close(geo.cannonDirection.x,want.x);close(geo.cannonDirection.y,want.y);close(Math.hypot(geo.cannonDirection.x,geo.cannonDirection.y),1);
    close(geo.cannonAngle,Math.atan2(want.y,want.x));assert.deepEqual(geo.cannonBase,flat.cannonBase);
    const length=Math.hypot(flat.cannon.x-flat.cannonBase.x,flat.cannon.y-flat.cannonBase.y);
    close(geo.cannon.x,geo.cannonBase.x+want.x*length);close(geo.cannon.y,geo.cannonBase.y+want.y*length);
    assert.deepEqual(geo.arm,flat.arm);assert.deepEqual(geo.tubes,flat.tubes);assert.ok(geo.cannonPart.polygon.length>=4);
    for(const point of geo.cannonPart.worldPolygon)assert.ok(point.x>=geo.bounds.x-1e-8&&point.x<=geo.bounds.x+geo.bounds.w+1e-8&&point.y>=geo.bounds.y-1e-8&&point.y<=geo.bounds.y+geo.bounds.h+1e-8);
  }
});
test('all native turn cells publish finite cannon axes and cancellation keeps cannon settled during evasion',()=>{
  for(let frame=0;frame<8;frame++){
    const geo=pose.tachikomaGeometry({...base,cannonElevation:1,turn:{active:true,yaw:frame*Math.PI/4}});
    assert.ok(Number.isFinite(geo.cannonAngle));close(Math.hypot(geo.cannonDirection.x,geo.cannonDirection.y),1);assert.equal(geo.cannonPart.rotation,0);
  }
  const rear=pose.tachikomaGeometry({...base,cannonElevation:1,evasion:evade(1)});assert.equal(rear.cannonPart.rotation,0);
});
test('native evasion lift respects available overhead support clearance without moving physical feet',()=>{
  for(const dir of [-1,1])for(const elapsed of [0,.5,1.5,1.9]){
    const p={...base,dir,supportClearance:107,evasion:evade(elapsed)},supportPose=computeSupportPose(p,x=>550+(x-300)*.15),geo=pose.tachikomaGeometry({...p,supportPose,tilt:supportPose.tilt});
    assert.ok(geo.bounds.y>=443-1e-6,`hold ${elapsed} top ${geo.bounds.y}`);assert.equal(p.y,550);assert.equal(geo.distalParts.length,0);
  }
});

test('the native cannon mask contains the whole aperture rim and sleeve while retaining the separate coax',()=>{
  const geo=pose.tachikomaGeometry({...base,dir:-1}),m=geo.measurement;
  const inside=([x,y])=>{let hit=false;const points=geo.cannonPart.polygon.map(([xx,yy])=>[xx/geo.k+m.feet[0],yy/geo.k+m.feet[1]]);for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
  for(const pixel of [[56,147],[70,130],[71,166],[171,174]])assert.equal(inside(pixel),true,`native barrel edge ${pixel}`);
  assert.equal(inside(m.coax),false);assert.equal(inside([218,128]),false,'roof scope remains fixed');
});

test('held rear stance retains its native action, fixed physical support and safe headroom in both facings',()=>{
  for(const dir of [-1,1])for(const elapsed of [0,1.2,1.9]){
    const p={...base,dir,supportClearance:107,evasion:evade(elapsed)},supportPose=computeSupportPose(p,x=>550+(x-300)*.15);
    const geo=pose.tachikomaGeometry({...p,supportPose,tilt:supportPose.tilt});
    assert.equal(geo.atlas,'saltik-dodge');assert.equal(geo.frame,1);assert.equal(geo.weaponsLocked,true);
    assert.equal(geo.distalParts.length,0);assert.equal(p.y,550);assert.equal(geo.y,550);assert.equal(geo.groundY,550);assert.ok(geo.top>=443-1e-6);
  }
});
