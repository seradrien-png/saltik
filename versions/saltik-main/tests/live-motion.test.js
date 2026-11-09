import test from 'node:test';
import assert from 'node:assert/strict';
import * as motion from '../src/motor-motion.js';
test('motion leans back on acceleration, forward on braking, and accumulates actual travel',()=>{
 assert.equal(typeof motion.advanceMotorMotion,'function');
 const a={vx:230};motion.advanceMotorMotion(a,1/60,{previousVx:0,distance:230/60});
 assert.ok(a.motionLean<=-.035&&a.motionLean>=-.055);assert.equal(a.motionDistance,230/60);
 a.vx=0;for(let i=0;i<4;i++)motion.advanceMotorMotion(a,1/60,{previousVx:230,distance:0});assert.ok(a.motionLean>0&&a.motionLean<=.055);
 for(let i=0;i<120;i++)motion.advanceMotorMotion(a,1/60,{previousVx:0,distance:0});assert.ok(Math.abs(a.motionLean)<1e-5);
});
test('zero elapsed simulation never advances motor presentation state',()=>{
 const a={vx:230,motionLean:.02,motionHeave:.3,motionDistance:10};const before={...a};motion.advanceMotorMotion(a,0,{previousVx:0,distance:10});assert.deepEqual(a,before);
});
