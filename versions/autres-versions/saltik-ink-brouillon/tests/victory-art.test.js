import test from 'node:test';
import assert from 'node:assert/strict';
import {victoryGeometry,drawVictory} from '../src/victory-art.js';
import {tachikomaGeometry} from '../src/tachikoma-pose.js';

const player={x:17500,y:560,tilt:.08,dir:1,onGround:true};
const ages=[0,.55,.95,1.45,2.55];

test('victory keeps the ordinary idle Saltik cabin, service module, scale and grounded registration',()=>{
  const normal=tachikomaGeometry(player,0,{camera:17000});
  for(const age of ages){
    const g=victoryGeometry(player,{camera:17000,age});
    assert.equal(g.atlas,'tachikoma');assert.equal(g.bodyFrame,4);
    assert.deepEqual(g.crop,normal.crop);assert.deepEqual(g.feet,normal.feet);
    for(const key of ['x','y','k','dx','dy','tilt','mirror','heave'])assert.equal(g[key],normal[key],key);
    assert.equal(g.height,99);assert.deepEqual(g.foot,{x:500,y:560});
  }
});

test('only two small native hands articulate while the body and lower-eye housing remain rigid',()=>{
  const snapshots=ages.map(age=>victoryGeometry(player,{age}));
  assert.ok(new Set(snapshots.map(g=>g.arms.map(a=>a.rotation.toFixed(4)).join(','))).size>=4);
  for(const g of snapshots){
    assert.equal(g.arms.length,2);
    for(const arm of g.arms){
      assert.ok(Math.abs(arm.rotation)<.8);
      assert.ok(arm.sourcePolygon.every(([,y])=>y>=880),'small wrist patches stay below the fixed service housing');
    }
  }
});

test('victory paints exclusively from the canonical game atlas rather than a redrawn character',()=>{
  const image={},foreign={},calls=[],noop=()=>{},c=new Proxy({drawImage(...a){calls.push(a);}},{get:(t,k)=>k in t?t[k]:noop});
  for(const age of ages)assert.equal(drawVictory(c,{tachikoma:image,'saltik-victory':foreign},player,{camera:17000,age}),true);
  assert.ok(calls.length>=ages.length);
  for(const call of calls){assert.equal(call[0],image);assert.deepEqual(call.slice(1,5),[20,603,373,339]);}
  assert.equal(drawVictory(c,{'saltik-victory':foreign},player,{}),false);
});
