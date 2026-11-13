import test from 'node:test';
import assert from 'node:assert/strict';
import * as water from '../src/royal-bridge-water.js';
test('native waterfall texture travels visibly downward across its full width',()=>{
 assert.equal(typeof water.bridgeWaterFlow,'function','the painted texture needs downward transport, beyond stationary refraction');
 const a=water.bridgeWaterFlow(0),b=water.bridgeWaterFlow(.1);
 assert.equal(a.length,2);
 assert(a.every((p,i)=>b[i].dy-p.dy>=4));
 assert(a.reduce((n,p)=>n+p.alpha,0)>=.7);
 assert.deepEqual(b,water.bridgeWaterFlow(.1),'a paused simulation produces the same source samples');
});
