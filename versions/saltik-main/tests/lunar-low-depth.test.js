import test from 'node:test';
import assert from 'node:assert/strict';
import {lunarLowPlanes,drawLunarLowDepth,opaqueLunarDepthPixels} from '../src/lunar-midground.js';
import {lunarGroundAt} from '../src/lunar-level.js';
test('two tangible low planes leave the upper sky clear and cover the viewport throughout the route',()=>{
 for(const width of [844,1280])for(const camera of [0,4600,9100,16500])for(const cameraY of [-180,0,80]){
  const height=720,planes=lunarLowPlanes({camera,cameraY,width,height,groundAt:lunarGroundAt});assert.equal(planes.length,2);
  for(const plane of planes){assert.ok(plane.tiles[0].x<=0);assert.ok(plane.tiles.at(-1).x+plane.w>=width);assert.ok(plane.y>=height*.55);for(const t of plane.tiles)assert.ok([t.x,plane.y,plane.w,plane.h].every(Number.isFinite));for(let x=0;x<width;x+=40)assert.ok(plane.y+plane.h>=lunarGroundAt(camera+x)+cameraY);}
  assert.notEqual(planes[0].rate,planes[1].rate);
 }
});
test('both low layers draw with full opacity, below a protected sky region, and restore canvas state',()=>{
 const draws=[],clips=[],stack=[],c={globalAlpha:.4,save(){stack.push(this.globalAlpha)},restore(){this.globalAlpha=stack.pop()},beginPath(){},rect(...v){clips.push(v)},clip(){},translate(){},scale(){},fillRect(){},drawImage(...v){draws.push({v,alpha:this.globalAlpha})}};
 drawLunarLowDepth(c,{camera:4000,cameraY:-100,width:1280,height:720,groundAt:lunarGroundAt,image:{width:2048,height:1024}});assert.ok(draws.length>=4);assert.ok(draws.every(d=>d.alpha===1));assert.ok(Math.abs(clips[0][1]-396)<1e-8);assert.equal(clips[0][2],1280);assert.equal(c.globalAlpha,.4);
});
test('generated stone interiors become fully opaque and empty cutout space stays empty',()=>{
 const pixels=new Uint8ClampedArray([150,120,80,251,180,140,90,128,0,0,0,0,130,100,70,12]);opaqueLunarDepthPixels(pixels);assert.deepEqual([...pixels],[150,120,80,255,180,140,90,255,0,0,0,0,130,100,70,0]);
});
