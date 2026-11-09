import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoutes,terrainHeight,surfaceHeight,projectDepthPoint,projectPlayer,DEPTH_LANE_RISE} from '../src/world.js';

test('legacy projection is identity for every former depth value',()=>{
  assert.equal(DEPTH_LANE_RISE,0);
  for(const depth of [-2,0,.5,1,3])assert.deepEqual(projectDepthPoint(345,540,depth),{x:345,y:540});
});
test('physical feet and support retain their height on ground, routes, cover and in air',()=>{
  const route=createRoutes()[0],x=route.x1+380;
  for(const supportY of [terrainHeight(x),surfaceHeight(route,x),420])for(const depth of [-1,0,.5,1,2]){
    assert.deepEqual(projectPlayer({x,y:supportY,supportY,depth}),{x,y:supportY,groundY:supportY,depth:0,scale:1});
    const airborne=projectPlayer({x,y:supportY-160,supportY,depth});
    assert.equal(airborne.groundY-airborne.y,160);
    assert.equal(airborne.depth,0);
  }
});
