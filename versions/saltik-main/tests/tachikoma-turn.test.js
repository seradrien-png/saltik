import test from 'node:test';
import assert from 'node:assert/strict';
import {TURN_DURATION,createTachikomaTurn,advanceTachikomaTurn,tachikomaTurnFrame} from '../src/tachikoma-turn.js';

test('a full reversal shows every authored front direction in both directions before settling',()=>{
  assert.equal(TURN_DURATION,.60);
  for(const dir of [1,-1]){
    const turn=createTachikomaTurn(dir),frames=[tachikomaTurnFrame(turn)];
    for(let i=0;i<Math.round(TURN_DURATION*60)-1;i++){
      advanceTachikomaTurn(turn,-dir,1/60);
      const frame=tachikomaTurnFrame(turn);if(frame!==frames.at(-1))frames.push(frame);
      assert.equal(turn.active,true);
    }
    advanceTachikomaTurn(turn,-dir,1/60);
    const frame=tachikomaTurnFrame(turn);if(frame!==frames.at(-1))frames.push(frame);
    assert.deepEqual(frames,dir===1?[0,1,2,3,4]:[4,3,2,1,0]);
    assert.equal(turn.active,false);assert.equal(turn.yaw,dir===1?Math.PI:0);
  }
});

test('the heavy cabin is still turning at .30 seconds and becomes weapon-ready at .60 seconds',()=>{
  for(const dir of [1,-1]){
    const turn=createTachikomaTurn(dir);
    advanceTachikomaTurn(turn,-dir,.30);
    assert.equal(turn.active,true);assert.equal(tachikomaTurnFrame(turn),2);
    advanceTachikomaTurn(turn,-dir,TURN_DURATION-.30);
    assert.equal(turn.active,false);assert.equal(turn.yaw,dir===1?Math.PI:0);
  }
});

test('every intermediate front octant survives an eight-step render interval in either direction',()=>{
  for(const dir of [1,-1]){
    const turn=createTachikomaTurn(dir),frames=[tachikomaTurnFrame(turn)];
    for(let elapsed=0;elapsed<TURN_DURATION;){
      const dt=Math.min(8/60,TURN_DURATION-elapsed);advanceTachikomaTurn(turn,-dir,dt);elapsed+=dt;
      const frame=tachikomaTurnFrame(turn);if(frame!==frames.at(-1))frames.push(frame);
    }
    assert.deepEqual(frames,dir===1?[0,1,2,3,4]:[4,3,2,1,0]);assert.equal(turn.active,false);
  }
});

test('retargeting a half-finished turn continues from its actual yaw without a snap',()=>{
  const turn=createTachikomaTurn(1);
  advanceTachikomaTurn(turn,-1,.12);const before=turn.yaw;
  advanceTachikomaTurn(turn,1,1/60);
  assert.ok(turn.yaw>0&&turn.yaw<before);
  assert.ok(Math.abs(before-turn.yaw)<=Math.PI/TURN_DURATION/60+1e-12);
  assert.equal(turn.active,true);
  advanceTachikomaTurn(turn,1,.12);assert.equal(turn.yaw,0);assert.equal(turn.active,false);
});

test('invalid deltas do not corrupt orientation and every native octant has its own frame',()=>{
  const turn=createTachikomaTurn(1);
  for(const dt of [NaN,Infinity,-1])advanceTachikomaTurn(turn,-1,dt);
  assert.equal(turn.yaw,0);
  for(let frame=0;frame<8;frame++)assert.equal(tachikomaTurnFrame({yaw:frame*Math.PI/4}),frame);
});
