import test from 'node:test';
import assert from 'node:assert/strict';
import {inkBackdropTiles} from '../src/ink-renderer.js';
test('the painted canyon never flips when the camera crosses the world origin',()=>{
 const tiles=[-1,0,1].map(camera=>inkBackdropTiles(camera,1300,620,2048,768).find(t=>t.index===0));
 assert.ok(tiles.every(t=>t&&!t.flip));assert.ok(Math.abs(tiles[0].x-tiles[2].x-.14)<1e-8);
 for(const camera of [-100,0,25000,50000]){const [a,b]=inkBackdropTiles(camera,1300,620,2048,768);assert.ok(a.x<=0&&b.x+b.w>=1300);assert.ok(Math.abs(a.x+a.w-b.x)<1e-8);assert.notEqual(a.flip,b.flip);}
});
