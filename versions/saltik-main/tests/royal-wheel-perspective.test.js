import test from 'node:test';
import assert from 'node:assert/strict';
import * as wheel from '../src/royal-wheel-water.js';
const site={left:200,top:50,scale:2};
test('one phase moves connected near and far paddles through a fixed perspective axle',()=>{
 assert.equal(typeof wheel.royalWheelGeometry,'function','whole-wheel geometry must exist');
 const a=wheel.royalWheelGeometry(site,0),b=wheel.royalWheelGeometry(site,2);
 assert.deepEqual(a.axle,b.axle);assert.deepEqual(a,wheel.royalWheelGeometry(site,0));
 assert.equal(a.paddles.length,12);assert.notDeepEqual(a.paddles[0].near,b.paddles[0].near);assert.notDeepEqual(a.paddles[0].far,b.paddles[0].far);
 for(const p of a.paddles){assert(Math.abs(p.near.x-p.far.x)>140);assert(Math.abs(p.near.y-p.far.y)>50);}
 assert(a.paddles.some(p=>p.far.x<site.left+300*site.scale),'paddles reach the left waterfall');
});
test('projection keeps the three-quarter rim orientation fixed while material phase changes',()=>{
 assert.equal(typeof wheel.royalWheelGeometry,'function');
 const a=wheel.royalWheelGeometry(site,0),b=wheel.royalWheelGeometry(site,4);
 assert.deepEqual(a.basis,b.basis);assert(a.basis.u.y>0);assert(a.basis.v.x<0);assert.equal(a.angle,wheel.royalWheelFrame(site,0).angle);
});
