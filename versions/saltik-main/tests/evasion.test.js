import test from 'node:test';
import assert from 'node:assert/strict';
import * as defense from '../src/evasion.js';

const plasma={kind:'plasma',radius:5};
const missile={kind:'enemy-missile',radius:6};

test('ESQUIVE uses the one native rear stance and no recharge',()=>{
  const state=defense.createEvasionState();
  assert.equal(defense.EVASION_RECHARGE,0);
  assert.equal(defense.beginEvasion(state),true);
  assert.equal(state.kind,'tilt');
  assert.equal(state.held,true);
  assert.equal(state.cooldown,0);
  assert.equal(defense.beginEvasion(state),false,'holding cannot restart the stance');
  const pose=defense.evasionPose(state);
  assert.equal(pose.atlas,'saltik-dodge');
  assert.equal(pose.frame,1);
  assert.equal(pose.rear,1);
  assert.equal(pose.bodyOffsetX,-5);
  assert.equal(pose.bodyOffsetY,0);
  assert.equal(pose.roll,0);
  assert.equal(pose.weaponsLocked,true);
});

test('rear protection keeps its native pose before the two-second cap, then exhausts',()=>{
 const state=defense.createEvasionState();defense.beginEvasion(state);
 defense.advanceEvasion(state,1.8);assert.equal(defense.evasionPose(state).frame,1);
 assert.equal(defense.resolveEvasionHit(state,missile),'avoid');
 defense.advanceEvasion(state,.2);assert.equal(state.active,false);assert.equal(state.elapsed,2);
 assert.equal(defense.beginEvasion(state),false,'held exhausted press cannot restart');
});

test('release immediately restores the front and permits the next hold',()=>{
  const state=defense.createEvasionState();
  defense.beginEvasion(state);
  defense.advanceEvasion(state,.6);
  defense.endEvasion(state);
  assert.equal(state.active,false);
  assert.equal(state.held,false);
  assert.equal(defense.isEvasionProtected(state,{dt:1,fraction:0}),false);
  assert.equal(defense.resolveEvasionHit(state,{kind:'contact'}),'hit');
  assert.equal(defense.evasionPose(state).rear,0);
  assert.equal(defense.evasionPose(state).weaponsLocked,false);
  assert.equal(defense.beginEvasion(state),true);
  assert.equal(defense.isEvasionProtected(state),true);
});

test('only a held active tilt can protect, even from swept contact',()=>{
  for(const changes of [{active:false},{held:false},{kind:'spin'},{kind:'burrow'},{kind:null}]){
    const state=defense.createEvasionState();
    defense.beginEvasion(state);
    Object.assign(state,changes);
    assert.equal(defense.isEvasionProtected(state,{dt:.4,fraction:.9}),false);
    assert.equal(defense.resolveEvasionHit(state,plasma,{dt:.4,fraction:.9}),'hit');
  }
});

test('DÉVIER restarts for a fresh press without recharge and resets one-shot reflection',()=>{
  const state=defense.createDeflectState();
  assert.equal(defense.DEFLECT_RECHARGE,0);
  assert.equal(defense.beginDeflect(state),true);
  assert.equal(state.duration,.78);
  assert.equal(state.cooldown,0);
  defense.advanceDeflect(state,.15);
  assert.equal(defense.resolveDeflectHit(state,plasma),'deflect');
  assert.equal(defense.resolveDeflectHit(state,plasma),'hit');
  defense.advanceDeflect(state,.3);
  assert.equal(defense.beginDeflect(state),true,'a new press restarts the active hand');
  assert.equal(state.elapsed,0);
  assert.equal(state.deflected,false);
  defense.advanceDeflect(state,.15);
  assert.equal(defense.resolveDeflectHit(state,plasma),'deflect');
  defense.advanceDeflect(state,.78);
  assert.equal(state.active,false);
  assert.equal(defense.beginDeflect(state),true,'there is no recharge after recovery');
});

test('manual hand keeps its original one-shot timing, target size and arm-only pain',()=>{
  for(const shot of [plasma,{...plasma,kind:'bullet'}]){
    const state=defense.createDeflectState();defense.beginDeflect(state);
    defense.advanceDeflect(state,.095);
    assert.equal(defense.resolveDeflectHit(state,shot,{dt:.02,fraction:.1}),'hit');
    assert.equal(defense.resolveDeflectHit(state,shot,{dt:.02,fraction:.9}),'deflect');
    assert.equal(defense.resolveDeflectHit(state,shot,{dt:.02,fraction:.9}),'hit');
  }
  for(const shot of [missile,{kind:'contact'},{kind:'explosion'},{...plasma,radius:9}]){
    const state=defense.createDeflectState();defense.beginDeflect(state);defense.advanceDeflect(state,.15);
    assert.equal(defense.resolveDeflectHit(state,shot),'hit');
  }
  for(const elapsed of [0,.05,.10,.15,.259,.26,.31,.37,.549,.55,.779]){
    const state=defense.createDeflectState();defense.beginDeflect(state);defense.advanceDeflect(state,elapsed);
    const frame=elapsed<.10?0:elapsed<.26?1:elapsed<.55?2:3,p=defense.deflectPose(state);
    assert.equal(p.atlas,'saltik-evasion');assert.equal(p.frame,8+frame);
    assert.equal(p.roll,0);assert.equal(p.bodyOffsetY,0);assert.equal(p.depthScale,1);
    assert.equal(p.armShake,frame===2?.14*Math.sin(Math.PI*(elapsed-.26)/.29)*Math.sin((elapsed-.26)*Math.PI*18):0);
  }
});
