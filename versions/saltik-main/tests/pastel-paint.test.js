import test from 'node:test';
import assert from 'node:assert/strict';
import {applyPastelPixels,mapWithConcurrency} from '../src/pastel-paint.js';

test('paint retains every original alpha value and neutral native black outlines',()=>{
 const base=new Uint8ClampedArray(256*4),wash=new Uint8ClampedArray(base.length);
 for(let i=0;i<256;i++){base.set([0,0,0,i],i*4);wash.set([230,180,120,255],i*4);}
 applyPastelPixels(base,wash);
 for(let i=0;i<256;i++){assert.equal(base[i*4+3],i);assert.equal(base[i*4],0);assert.equal(base[i*4+1],0);assert.equal(base[i*4+2],0);}
});
test('warm material color keeps native texture luminosity and ignores invented map outlines',()=>{
 const base=new Uint8ClampedArray([240,240,240,255,120,120,120,128,240,240,240,255]);
 applyPastelPixels(base,new Uint8ClampedArray([230,180,120,255,230,180,120,255,12,14,13,255]),{strength:1,gain:1});
 assert.ok(base[0]>base[1]&&base[1]>base[2]);assert.ok(Math.abs(base[0]/base[4]-2)<.03);
 assert.equal(base[7],128);assert.equal(base[8],240);assert.equal(base[9],240);assert.equal(base[10],240);
 assert.throws(()=>applyPastelPixels(new Uint8ClampedArray(4),new Uint8ClampedArray(8)));
});
test('loading paints is bounded and preserves manifest order',async()=>{
 let active=0,peak=0;
 const results=await mapWithConcurrency([1,2,3,4,5],2,async n=>{
  peak=Math.max(peak,++active);await new Promise(r=>setTimeout(r,2));active--;return n*2;
 });
 assert.equal(peak,2);assert.equal(active,0);assert.deepEqual(results,[2,4,6,8,10]);
});
