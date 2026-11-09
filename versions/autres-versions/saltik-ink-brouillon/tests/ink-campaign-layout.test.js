import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame} from '../src/engine.js';
import {createRoutes,surfaceHeight,routeThickness} from '../src/world.js';
import * as ink from '../src/ink-demo-layout.js';

test('ink campaign retains every V1 support and repair region',()=>{
  const g=ink.applyInkLandmarkLayout(createGame()),ids=createRoutes().map(p=>p.id);
  for(const id of ids)assert.ok(g.platforms.some(p=>p.id===id));
  assert.ok(g.platforms.some(p=>p.id==='breach-landing'));
  assert.ok(g.platforms.some(p=>p.id==='checkpoint-turn'));
  for(const x of [3600,7400,11600,15800])assert.ok(g.pickups.some(p=>p.x===x&&!p.platformId),`ground repair at ${x}`);
  for(const p of g.platforms){
    assert.ok(p.inkNative,`${p.id} has individual native foreground artwork`);
    const repair=g.pickups.find(item=>item.platformId===p.id);assert.ok(repair,`${p.id} repair`);
    assert.equal(repair.y,surfaceHeight(p,repair.x)-30);
  }
  assert.ok(g.obstacles.some(o=>o.x>15000),'the final campaign section retains cover');
  for(const obstacle of g.obstacles){
    const p=g.platforms.find(p=>p.id===obstacle.platformId);
    if(p)assert.ok(obstacle.x-obstacle.w/2>=p.x1&&obstacle.x+obstacle.w/2<=p.x2,`${obstacle.id} complete elevated support`);
    assert.equal(obstacle.y,p?surfaceHeight(p,obstacle.x):g.groundAt(obstacle.x));
  }
});

test('every new native atlas source is inside its shipped transparent PNG',()=>{
  const dimensions={};
  for(const asset of ink.INK_LANDMARK_ASSETS){
    const png=readFileSync(new URL(`../dist/assets/${asset.file}`,import.meta.url));
    assert.equal(png.toString('ascii',1,4),'PNG');
    dimensions[asset.name]={w:png.readUInt32BE(16),h:png.readUInt32BE(20)};
    assert.equal(png[25],6,'native cutouts retain their alpha channel');
  }
  for(const descriptor of Object.values(ink.INK_WORLD_ART)){
    if(!descriptor.source)continue;
    const image=dimensions[descriptor.asset],s=descriptor.source;assert.ok(image);
    assert.ok(s.x>=0&&s.y>=0&&s.x+s.w<=image.w&&s.y+s.h<=image.h,'source rectangle stays inside its native atlas');
  }
});

test('every illustrated upper route retains standing clearance and continuous lower ground',()=>{
  const g=ink.applyInkLandmarkLayout(createGame());
  for(const p of g.platforms){
    const lower=x=>p.lower?surfaceHeight(p.lower,x):g.groundAt(x);
    for(let x=p.x1;x<=p.x2;x+=2){
      const gap=lower(x)-surfaceHeight(p,x)-routeThickness(p,x);
      const minimum=p.id==='checkpoint-turn'?112:143.99;
      assert.ok(gap>=minimum,`${p.id} clearance ${gap} at ${x}`);
    }
    if(!p.lower)for(const edge of [p.x1,p.x2])assert.ok(Math.abs(g.groundAt(edge-.01)-g.groundAt(edge+.01))<.1,`${p.id} continuous shoulder`);
  }
});

test('native stairs connect real lower supports to exact upper walking edges',()=>{
  const g=ink.applyInkLandmarkLayout(createGame());
  assert.ok(Array.isArray(ink.INK_STAIRS)&&ink.INK_STAIRS.length>=7);
  for(const p of g.platforms){
    if(p.id==='ledge-5'){assert.equal(p.walkableEntries.length,0,'broken turbine roof has no invented access stair');continue;}
    assert.ok(p.walkableEntries?.length,`${p.id} stair entry`);
    for(const stair of p.walkableEntries){
      const [bottom,top]=[stair.points[0],stair.points.at(-1)];
      assert.ok(bottom[1]>top[1],`${stair.id} rises from lower floor`);
      const lower=g.platforms.find(p=>p.id===stair.lowerId);
      assert.ok(Math.abs(bottom[1]-(lower?surfaceHeight(lower,bottom[0]):g.groundAt(bottom[0])))<.01);
      assert.ok(top[0]>=p.x1&&top[0]<=p.x2);
      assert.ok(Math.abs(top[1]-surfaceHeight(p,top[0]))<.01);
      for(let i=1;i<stair.points.length;i++){
        const a=stair.points[i-1],b=stair.points[i];
        assert.ok(Math.abs((b[1]-a[1])/(b[0]-a[0]))<1.5,`${stair.id} traversable slope`);
      }
    }
  }
});
