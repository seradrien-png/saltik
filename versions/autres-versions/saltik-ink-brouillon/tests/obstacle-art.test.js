import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const modulePath=new URL('../src/obstacle-art.js',import.meta.url);
test('cover artwork has a measured isolated crop and true physical feet',async()=>{
  assert.ok(fs.existsSync(modulePath),'measured obstacle art module must exist');
  const {obstacleGeometry}=await import(modulePath);
  const expected={rock:[4,202,376,265],barricade:[385,257,381,207],checkpoint:[771,106,381,360],hull:[1152,191,382,274]};
  for(const [type,crop] of Object.entries(expected)){
    const o={type,x:720,y:550,w:90,h:90*crop[3]/crop[2],hp:10,maxHp:10};
    const a=obstacleGeometry(o,{camera:100});
    assert.deepEqual(a.crop,{x:crop[0],y:crop[1],w:crop[2],h:crop[3]});
    assert.deepEqual(a.bounds,{x:575,y:550-o.h,w:90,h:o.h});
    assert.equal(a.feet.x,620);assert.equal(a.feet.y,550);
    assert.equal(a.draw.w/a.draw.h,a.crop.w/a.crop.h,'painted silhouettes retain native proportions');
    const damaged=obstacleGeometry({...o,hp:4},{camera:100});
    assert.ok(damaged.crop.y>=512);assert.equal(damaged.feet.y,550);
    assert.deepEqual(damaged.bounds,a.bounds,'damage art cannot change solid collision');
  }
});
test('atlas draw uses only its measured isolated crop and disappears after destruction',async()=>{
  assert.ok(fs.existsSync(modulePath),'measured obstacle art module must exist');
  const {drawObstacle,obstacleGeometry}=await import(modulePath),calls=[];
  const c={save(){},restore(){},beginPath(){},ellipse(){},fill(){},drawImage(...args){calls.push(args);},fillRect(){}};
  const atlas={},o={type:'hull',x:720,y:550,w:98,h:98*274/382,hp:5,maxHp:10,hit:0};
  assert.equal(drawObstacle(c,{destructibles:atlas},o,{camera:100}),true);
  const a=obstacleGeometry(o,{camera:100});
  assert.deepEqual(calls[0],[atlas,a.crop.x,a.crop.y,a.crop.w,a.crop.h,a.draw.x,a.draw.y,a.draw.w,a.draw.h]);
  assert.equal(drawObstacle(c,{destructibles:atlas},{...o,hp:0}),false);assert.equal(calls.length,1);
  assert.equal(drawObstacle(c,{},o),false);
});
