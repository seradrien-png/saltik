import test from 'node:test';
import assert from 'node:assert/strict';
import {MELEE_ATLAS,MELEE_PIXEL_SCALE,tachikomaGeometry,tachikomaMeleeReach} from '../src/tachikoma-pose.js';
import {computeSupportPose} from '../src/support-pose.js';
const base={x:200,y:500,supportY:500,onGround:true,dir:1,vx:0,vy:0};
const close=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} versus ${b}`);

test('six native melee cells retain boundary-crossing hand pixels and the standing body scale',()=>{
  assert.deepEqual(MELEE_ATLAS.map(m=>m.crop),[[26,82,458,406],[503,83,512,405],[1057,82,463,406],[33,539,449,392],[491,539,526,409],[1058,540,456,406]]);
  for(const airborne of [false,true])for(const [i,phase] of ['windup','impact','recovery'].entries()){
    const geo=tachikomaGeometry({...base,onGround:!airborne,melee:{phase}});
    assert.equal(geo.atlas,'saltik-melee');assert.equal(geo.frame,i+(airborne?3:0));close(geo.k,MELEE_PIXEL_SCALE);
    assert.ok(geo.visibleHeight>95&&geo.visibleHeight<100,'native action keeps established ~99-unit body');
    assert.equal(geo.cabinTubes.length,3);assert.ok(geo.cannon.y<geo.arm.y);
  }
});

test('idle acquisition and visible impact share the actual native hand in both directions, legacy depth values, pitch and scale',()=>{
  for(const dir of [-1,1])for(const airborne of [false,true])for(const depth of [0,1]){
    const p={...base,dir,onGround:!airborne,depth,tilt:.17,supportPose:{heave:-3}},options={camera:37,scale:1.3};
    const idle=tachikomaMeleeReach(p,.4,options),active=tachikomaMeleeReach({...p,melee:{phase:'impact'}},.4,options);
    assert.deepEqual(idle,active);assert.ok(idle.radius<=12*options.scale);assert.ok((idle.fist.x-idle.origin.x)*dir>25);
    const geo=tachikomaGeometry({...p,depth:0,melee:{phase:'impact'}},.4,options),m=MELEE_ATLAS[airborne?4:1];
    const expected=geo.spritePoint(m.fist);close(idle.fist.x,expected.x);close(idle.fist.y,expected.y);
    assert.ok(idle.fist.x>=idle.hitbox.x&&idle.fist.x<=idle.hitbox.x+idle.hitbox.w);
    assert.ok(idle.fist.y>=idle.hitbox.y&&idle.fist.y<=idle.hitbox.y+idle.hitbox.h);
  }
});

test('measured roof/coax/lateral apertures retain native body registration during a punch',()=>{
  const idle=tachikomaGeometry(base);
  for(const phase of ['windup','impact','recovery']){
    const geo=tachikomaGeometry({...base,melee:{phase}}),m=MELEE_ATLAS[geo.frame];
    assert.deepEqual(geo.arm,geo.spritePoint(m.coax));assert.deepEqual(geo.cannon,geo.spritePoint(m.main));
    assert.ok(Math.hypot(geo.arm.x-idle.arm.x,geo.arm.y-idle.arm.y)<1.1);
    assert.ok(Math.hypot(geo.cannon.x-idle.cannon.x,geo.cannon.y-idle.cannon.y)<1.1);
    geo.cabinTubes.forEach((tube,i)=>{assert.deepEqual(tube.muzzle,geo.spritePoint(m.mouths[i]));assert.ok((tube.muzzle.x-tube.base.x)>0);});
  }
});

test('active evasion and native turns take precedence over the melee body',()=>{
  for(const extra of [{evasion:{kind:'tilt',active:true,held:true,elapsed:.3,duration:0}},{turn:{active:true,yaw:Math.PI/2}}]){
    assert.notEqual(tachikomaGeometry({...base,...extra,melee:{phase:'impact'}}).atlas,'saltik-melee');
  }
});

test('active punch keeps all three visible native wheel assemblies planted on rough sloping floors',()=>{
  for(const dir of [-1,1])for(const phase of ['windup','impact','recovery']){
    const floor=x=>500+(x-200)*.10+Math.sin((x-200)/16)*2,p={...base,dir};
    const supportPose=computeSupportPose(p,floor),geo=tachikomaGeometry({...p,tilt:supportPose.tilt,supportPose,melee:{phase}});
    assert.equal(geo.distalParts.length,3);
    for(const part of geo.distalParts){assert.equal(part.grounded,true);close(part.contact.y,floor(part.contact.x),.001);assert.ok(Math.abs(part.offset)<=9);}
  }
});

test('a projectile damage pose cannot hide the native arm animation, while idle damage remains authored',()=>{
  for(const phase of ['windup','impact','recovery'])assert.equal(tachikomaGeometry({...base,damagePose:true,melee:{phase}}).atlas,'saltik-melee');
  assert.equal(tachikomaGeometry({...base,damagePose:true,melee:{phase:'idle'}}).frame,7);
});
