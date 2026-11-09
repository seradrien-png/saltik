import test from 'node:test';
import assert from 'node:assert/strict';
import * as world from '../src/world.js';

test('six scenarios have driven hills and basins, with the scree climb entirely on ground',()=>{
  assert.equal(world.EXPEDITION_SCENARIOS.length,6);
  for(const s of world.EXPEDITION_SCENARIOS){
    const samples=Array.from({length:120},(_,i)=>world.terrainHeight(s.x1+(s.x2-s.x1)*i/119));
    assert.ok(Math.max(...samples)-Math.min(...samples)>30,`${s.id} needs a real ascent or descent`);
  }
  assert.ok(!world.createRoutes().some(p=>p.scenario==='scree-escarpment'));
  for(let x=0;x<=17800;x+=5){assert.ok(Number.isFinite(world.terrainHeight(x)));assert.ok(Math.abs(world.terrainHeight(x+1)-world.terrainHeight(x))<.65,`driveable terrain at ${x}`);}
});
test('campaign has long one-path stretches, separate short alternatives and one brief triple crossing',()=>{
  const routes=world.createRoutes(),coverage=[0,0,0,0];
  assert.equal(routes.length,7);
  assert.equal(routes.filter(p=>p.tier===2).length,1);
  for(let x=0;x<17800;x+=10){const count=1+routes.filter(p=>x>=p.x1&&x<p.x2).length;coverage[count]+=10;}
  assert.ok(coverage[1]/17800>.64&&coverage[1]/17800<.7,`one path ${coverage[1]}`);
  assert.ok(coverage[2]/17800>.27&&coverage[2]/17800<.33,`two paths ${coverage[2]}`);
  assert.ok(coverage[3]>350&&coverage[3]<700,`triple path ${coverage[3]}`);
  assert.deepEqual(routes.filter(p=>p.scenario==='wreck-passage').map(p=>[p.x1,p.x2]),[[3600,4940],[5270,5760]]);
  for(const x of [300,2300,3100,5050,6100,6700,8600,9000,11650,12500,13600,14600,16200,17000])assert.equal(routes.filter(p=>x>=p.x1&&x<=p.x2).length,0,`ground-only x=${x}`);
});
test('cover keeps native material families and every named support exists',()=>{
  const platforms=world.createRoutes(),obstacles=world.createObstacles(platforms);
  assert.deepEqual([...new Set(obstacles.map(o=>o.type))].sort(),['barricade','checkpoint','hull','rock']);
  assert.equal(new Set(obstacles.map(o=>o.id)).size,obstacles.length);
  for(const o of obstacles){
    const p=platforms.find(p=>p.id===o.platformId);
    assert.equal(o.y,p?world.surfaceHeight(p,o.x):world.terrainHeight(o.x));assert.equal(o.tier,p?.tier??0);
    assert.ok(o.w>55&&o.h>45&&o.h<102&&o.hp>0);
    if(p){assert.ok(o.x-o.w/2>=p.x1+160,`${o.id} keeps the entry free`);assert.ok(o.x+o.w/2<=p.x2-90,`${o.id} stays inside the finite ledge`);}
    for(let x=o.x-o.w/2;x<=o.x+o.w/2;x+=8)for(const dx of [-58,0,58])for(const roof of platforms){
      const xx=x+dx;if(roof.id===o.platformId||xx<roof.x1||xx>roof.x2)continue;
      const ceiling=world.surfaceHeight(roof,xx)+world.routeThickness(roof,xx);
      if(ceiling<o.y)assert.ok(o.y-o.h-ceiling>=107,`${o.id} cover top has ${o.y-o.h-ceiling} headroom below ${roof.id}`);
    }
  }
});
test('checkpoint authoring preserves count, identity and classes while assigning real support',async()=>{
  const {createGame}=await import('../src/engine.js'),g=createGame(),before=g.schedule.map(e=>{const copy={...e};delete copy.checkpointId;return copy;}),original=structuredClone(before);
  const after=world.authorCheckpointGuards(before,g.obstacles,g.platforms);
  assert.equal(after.length,before.length);assert.equal(after.length,40);
  assert.deepEqual(after.map(e=>[e.id,e.type]).sort((a,b)=>a[0]-b[0]),before.map(e=>[e.id,e.type]).sort((a,b)=>a[0]-b[0]));
  assert.deepEqual(before,original);assert.ok(after.every((e,i)=>!i||e.x>=after[i-1].x));
  for(const checkpoint of g.obstacles.filter(o=>o.type==='checkpoint')){
    const guards=after.filter(e=>e.checkpointId===checkpoint.id);assert.equal(guards.length,2);
    assert.equal(new Set(guards.map(e=>e.x)).size,2,'defenders must not stack at a clamped route edge');
    for(const e of guards){assert.equal(e.tier,checkpoint.tier);assert.equal(e.platformId,checkpoint.platformId);assert.ok(Math.abs(e.x-checkpoint.x)<440);const p=g.platforms.find(p=>p.id===e.platformId);if(p)assert.ok(e.x>=p.x1+50&&e.x<=p.x2-50);}
  }
});
test('support sampling ends with the physical crown and the living cover footprint',()=>{
  const platforms=world.createRoutes(),p=platforms[0],o={id:'cover',x:p.x1+350,y:400,w:90,h:62,hp:8},g={platforms,obstacles:[o]};
  assert.equal(world.supportHeight(g,{},o.x),world.terrainHeight(o.x));
  assert.equal(world.supportHeight(g,{platformId:p.id},p.x1+10),world.surfaceHeight(p,p.x1+10));
  for(const x of [p.x1-.001,p.x2+.001])assert.equal(world.supportHeight(g,{platformId:p.id},x),null);
  assert.equal(world.supportHeight(g,{obstacleId:o.id},o.x+44.9),338);assert.equal(world.supportHeight(g,{obstacleId:o.id},o.x+45.1),null);
  o.hp=0;assert.equal(world.supportHeight(g,{obstacleId:o.id},o.x),null);assert.equal(world.supportHeight(g,{platformId:'missing'},o.x),null);
});
