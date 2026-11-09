import test from 'node:test';
import assert from 'node:assert/strict';
import {enemyProfile,enemyGeometry,drawGroundEnemy} from '../src/enemy-art.js';

test('only the two bipeds contract to 85 percent around their native boot anchors',()=>{
  for(const [type,original] of Object.entries({walker:{w:44,h:75},soldier:{w:42,h:74}})){
    const profile=enemyProfile(type),e={type,x:700,y:540,vx:0};
    assert.equal(profile.scale,.30*.85);assert.equal(profile.w,original.w*.85);assert.equal(profile.h,original.h*.85);
    const geo=enemyGeometry(e,0);assert.equal(geo.bounds.y+geo.bounds.h,e.y);
    assert.equal(geo.bounds.w,original.w*.85);assert.equal(geo.bounds.h,original.h*.85);
    assert.ok(Math.abs((e.y-geo.targetY)/(original.h*.52)-.85)<1e-12);
    const originalMuzzle={walker:[230-357,106-274],soldier:[664-783,106-274]}[type];
    assert.ok(Math.abs((geo.muzzle.x-e.x)-originalMuzzle[0]*.30*.85)<1e-12);
    assert.ok(Math.abs((geo.muzzle.y-e.y)-originalMuzzle[1]*.30*.85)<1e-12);
  }
  assert.deepEqual(enemyProfile('turret'),{column:2,w:66,h:89,scale:.34,speed:0});
  const heavy=enemyGeometry({type:'turret',x:700,y:540,vx:0},0);
  assert.deepEqual(heavy.bounds,{x:667,y:451,w:66,h:89});
  assert.equal(heavy.muzzle.x,700+(1050-1214)*.34);
  assert.equal(heavy.muzzle.y,540+(122-273)*.34);
});

test('the three ground enemies use their own columns and measured nonuniform action rows',()=>{
  for(const [column,type] of ['walker','soldier','turret'].entries()){
    const idle=enemyGeometry({type,x:700,y:540,vx:0},0);
    assert.equal(idle.column,column);assert.equal(idle.row,0);
    const fire=enemyGeometry({type,x:700,y:540,firePose:.1},0);
    assert.equal(fire.row,3);assert.ok(fire.crop.y>=787&&fire.crop.y<=790);
    assert.ok(fire.crop.y+fire.crop.h>1011,'custom crop retains the lowest boot');
    if(type!=='turret'){
      assert.equal(enemyGeometry({type,x:0,y:0,vx:-23},0).row,1);
      assert.equal(enemyGeometry({type,x:0,y:0,vx:-23},1/7).row,2);
    }
  }
});

test('drawing registers each foot anchor at the real route while the heavy robot remains moderately larger',()=>{
  const images={enemies:{width:1536,height:1024}},calls=[];
  const c={save(){},restore(){},drawImage(...args){calls.push(args);}};
  for(const type of ['walker','soldier','turret'])for(const firePose of [0,.1]){
    const e={type,x:700,y:440,vx:0,firePose},geo=enemyGeometry(e,0);
    assert.equal(drawGroundEnemy(c,images,e,0,{camera:80}),true);
    const call=calls.at(-1);
    assert.equal(call[5]+(geo.anchor.x-geo.crop.x)*geo.scale,e.x-80);
    assert.equal(call[6]+(geo.anchor.y-geo.crop.y)*geo.scale,e.y);
    assert.ok(geo.muzzle.x<e.x&&geo.muzzle.y<e.y-35);
  }
  const robot=enemyProfile('walker'),heavy=enemyProfile('turret');
  assert.ok(heavy.h>robot.h*1.1&&heavy.h<robot.h*1.4);
  assert.equal(drawGroundEnemy(c,images,{type:'drone'},0),false);
  assert.equal(drawGroundEnemy(c,{}, {type:'walker'},0),false);
});
