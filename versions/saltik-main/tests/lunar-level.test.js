import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
import {LUNAR_GAPS,LUNAR_END,advanceLunarObjective,lunarMissionLabel} from '../src/lunar-level.js';
test('lunar objectives identify the route and the real portal wave state',()=>{
 const g=createInkScene({level:2});
 assert.match(lunarMissionLabel(g),/CITADELLES/);
 g.player.x=8600;assert.match(lunarMissionLabel(g),/OBSERVATOIRE/);
 g.player.x=12000;assert.match(lunarMissionLabel(g),/REMPARTS/);
 g.lunar.phase='defense';g.lunar.wave=2;assert.match(lunarMissionLabel(g),/VAGUE 2\/3/);
 g.lunar.phase='intermission';assert.match(lunarMissionLabel(g),/VAGUE 3\/3/);
 g.lunar.phase='open';assert.match(lunarMissionLabel(g),/PORTAIL OUVERT/);
});
test('waiting without firing cannot clear a live portal defense wave through native distance cleanup',()=>{
 const g=createInkScene({level:2});g.schedule=[];g.enemies=[];g.pickups=[];g.player.x=17650;g.player.y=g.groundAt(17650);g.player.supportY=g.player.y;g.player.invulnerable=1000;
 for(let i=0;i<7200;i++)updateInkScene(g,{},1/60);
 assert.equal(g.lunar.wave,1);assert.equal(g.lunar.phase,'defense');assert.equal(g.stats.kills,0);
 assert.equal(g.enemies.filter(e=>e.lunarWave===1&&e.hp>0).length,3);
 assert.ok(g.enemies.filter(e=>e.lunarWave===1).every(e=>e.x>=16350&&e.x<=17650));
});
test('lunar campaign has its own route and encounter order at canyon duration scale',()=>{
 const a=createInkScene(),b=createInkScene({level:2});assert.equal(a.level,1);assert.equal(b.level,2);assert.equal(b.levelTitle,'Les Archives lunaires');assert.equal(LUNAR_END,17800);
 assert.notDeepEqual(a.platforms.map(p=>p.x1),b.platforms.map(p=>p.x1));assert.notDeepEqual(a.schedule.map(p=>[p.type,p.x]),b.schedule.map(p=>[p.type,p.x]));assert.ok(b.schedule.some(e=>e.type==='carrier'));
 b.player.x=16500;updateInkScene(b,{},1/60);assert.equal(b.boss,null);
});
test('lunar landscape is continuous across all five former gap locations',()=>{
 const g=createInkScene({level:2});
 assert.equal(LUNAR_GAPS.length,0);
 for(const [a,b] of [[2520,2660],[4470,4630],[6820,6990],[10940,11100],[13920,14090]]){
  for(let x=a-4;x<=b+4;x+=4){
   assert.equal(g.isGroundGap(x),false);
   assert.ok(Number.isFinite(g.groundAt(x)));
   assert.ok(Math.abs(g.groundAt(x+1)-g.groundAt(x))<4);
  }
 }
});
test('portal requires three actually defeated waves and freezes during pause',()=>{
 const g=createInkScene({level:2});g.schedule=[];g.player.x=16650;advanceLunarObjective(g,1/60);assert.equal(g.lunar.wave,1);assert.equal(g.status,'playing');
 for(let wave=1;wave<=3;wave++){
  assert.equal(g.lunar.wave,wave);const scheduled=g.schedule.filter(s=>s.lunarWave===wave);assert.ok(scheduled.length>=3);
  g.enemies=scheduled.map(s=>({...s,hp:5}));g.nextSpawn=g.schedule.length;advanceLunarObjective(g,10);assert.equal(g.lunar.wave,wave);
  g.enemies=[];advanceLunarObjective(g,1/60);
  if(wave<3){const before=g.lunar.elapsed;g.status='paused';advanceLunarObjective(g,10);assert.equal(g.lunar.elapsed,before);g.status='playing';advanceLunarObjective(g,3);}
 }
 assert.equal(g.status,'won');assert.equal(g.lunar.phase,'open');assert.equal(g.boss,null);
});
test('each monumental terrace keeps its real walkable stair entry',()=>{
 for(const route of createInkScene({level:2}).platforms){
  const g=createInkScene({level:2});g.schedule=[];g.pickups=[];
  const p=g.player;p.x=route.x1-330;p.y=g.groundAt(p.x);p.supportY=p.y;
  for(let i=0;i<120;i++)updateInkScene(g,{right:true},1/60);
  assert.equal(p.platformId,route.id);assert.equal(p.onGround,true);
 }
});
test('paused falls freeze and fatal falls end the campaign without softlocking',()=>{
 const g=createInkScene({level:2});g.schedule=[];g.player.x=3200;g.player.y=1000;g.player.onGround=false;g.player.hp=10;g.status='paused';
 updateInkScene(g,{},1/30);assert.equal(g.player.hp,10);assert.equal(g.player.y,1000);assert.equal(g.lunar.falls,0);
 g.status='playing';updateInkScene(g,{},1/30);assert.equal(g.status,'dead');assert.equal(g.player.hp,0);assert.equal(g.lunar.falls,1);
 const fresh=createInkScene({level:2});assert.equal(fresh.lunar.phase,'approach');assert.equal(fresh.lunar.wave,0);assert.equal(fresh.lunar.falls,0);
});

test('native engine spawns all three portal waves and only actual cleared waves advance',()=>{
 const g=createInkScene({level:2});g.schedule=[];g.pickups=[];g.player.x=16560;g.player.y=g.groundAt(g.player.x);g.player.supportY=g.player.y;
 updateInkScene(g,{},1/60);
 for(let wave=1;wave<=3;wave++){
  updateInkScene(g,{},1/60);
  assert.equal(g.lunar.wave,wave);const enemies=g.enemies.filter(e=>e.lunarWave===wave);assert.equal(enemies.length,[3,4,5][wave-1]);
  updateInkScene(g,{},1/60);assert.equal(g.lunar.phase,'defense');
  // Standing at the furthest allowed endpoint keeps even the first wave's
  // leftmost actor inside the native cleanup distance (there is no free despawn).
  g.player.x=17650;updateInkScene(g,{},1/60);assert.ok(g.enemies.some(e=>e.lunarWave===wave));
  for(const e of g.enemies)e.hp=0;updateInkScene(g,{},1/60);
  if(wave<3)for(let i=0;i<160;i++)updateInkScene(g,{},1/60);
 }
 assert.equal(g.status,'won');assert.equal(g.lunar.wave,3);assert.equal(g.boss,null);
});

test('former pits are ordinary safe ground and need no forced jumps',()=>{
 const former=[[2520,2660],[4470,4630],[6820,6990],[10940,11100],[13920,14090]];
 for(const [a,b] of former){
  const g=createInkScene({level:2});g.schedule=[];g.pickups=[];g.platforms=[];
  const p=g.player;p.x=a-35;p.y=g.groundAt(p.x);p.supportY=p.y;p.onGround=true;
  for(let i=0;i<90;i++)updateInkScene(g,{right:true},1/60);
  assert.ok(p.x>b);assert.equal(g.lunar.falls,0);assert.equal(p.hp,100);assert.equal(p.onGround,true);
 }
});
test('ordinary controls complete the distinct lunar campaign with native armor in comparable time',()=>{
 const g=createInkScene({level:2}),jumped=new Set();
 for(let i=0;i<60*150&&g.status==='playing';i++){
  const p=g.player,gap=LUNAR_GAPS.find(([a],j)=>!jumped.has(j)&&p.x>=a-25&&p.x<a);
  if(gap)jumped.add(LUNAR_GAPS.indexOf(gap));
  updateInkScene(g,{right:p.x<16700,fire:true,missile:i%220<60,homing:true,jump:!!gap,qte:i%10<5},1/60);
 }
 assert.equal(g.status,'won');assert.equal(g.lunar.wave,3);assert.equal(g.lunar.falls,0);assert.ok(g.player.hp>0);assert.equal(g.player.maxHp,100);
 assert.ok(g.time>=55&&g.time<=125,`campaign duration ${g.time}`);assert.equal(g.boss,null);
});

test('zero simulation time cannot start or clear a portal wave',()=>{
 const g=createInkScene({level:2});g.schedule=[];g.player.x=16700;advanceLunarObjective(g,0);assert.equal(g.lunar.phase,'approach');assert.equal(g.lunar.wave,0);
 advanceLunarObjective(g,1/60);g.nextSpawn=g.schedule.length;advanceLunarObjective(g,0);assert.equal(g.lunar.phase,'defense');assert.equal(g.lunar.wave,1);
});
