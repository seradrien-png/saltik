import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,terrainHeight,surfaceHeight} from '../src/engine.js';

const step=(g,input={},frames=1)=>{for(let i=0;i<frames;i++)update(g,input,1/60);};
function quiet(dir=1){
  const g=createGame();g.schedule=[];g.obstacles=[];g.platforms=[];
  Object.assign(g.player,{x:900,y:terrainHeight(900),supportY:terrainHeight(900),dir,turn:null});return g;
}
function heavy(g,id=1,dx=78,hp=30){return{id,type:'turret',x:g.player.x+dx,y:g.player.y,origin:g.player.x+dx,hp,maxHp:hp,cooldown:99,phase:0};}

test('automatic forward contact winds up, hits once for six, and returns without another control',()=>{
  for(const dir of [-1,1]){
    const g=quiet(dir),e=heavy(g,1,78*dir);g.enemies=[e];
    step(g);assert.equal(e.hp,30);assert.equal(g.player.melee?.phase,'windup');
    step(g,{},5);assert.equal(e.hp,24);assert.equal(g.player.melee.hit,true);
    step(g,{},10);assert.equal(e.hp,24,'the impact is one hit across its entire hold');
    assert.equal(g.events.filter(e=>e.type==='melee-hit').length,1);
    step(g,{},20);assert.equal(g.player.melee.phase,'idle');
  }
});

test('a target leaving or dying during windup cannot be struck remotely or replaced',()=>{
  for(const outcome of ['escape','death']){
    const g=quiet(),first=heavy(g),second=heavy(g,2,82);g.enemies=[first,second];
    step(g);assert.equal(g.player.melee?.phase,'windup');
    if(outcome==='escape')first.x+=350;else first.hp=0;
    step(g,{},12);assert.equal(second.hp,30);assert.equal(first.hp,outcome==='escape'?30:0);
    assert.equal(g.events.filter(e=>e.type==='melee-hit').length,0);
  }
});

test('backward, vertically separated and distant targets never start an automatic punch',()=>{
  for(const place of ['behind','above','far']){
    const g=quiet(),e=heavy(g,1,place==='behind'?-78:place==='far'?240:78);if(place==='above')e.y-=170;g.enemies=[e];
    step(g,{},20);assert.equal(e.hp,30);assert.equal(g.player.melee?.phase,'idle');
    assert.equal(g.events.filter(e=>e.type==='melee').length,0);
  }
});

test('living solid cover shields an otherwise reachable enemy throughout the punch',()=>{
  const g=quiet(),e=heavy(g);g.enemies=[e];
  g.obstacles=[{id:'shield',type:'barricade',x:g.player.x+47,y:g.player.y,w:18,h:100,hp:40,maxHp:40,hit:0}];
  step(g,{},20);assert.equal(e.hp,30);assert.equal(g.obstacles[0].hp,34,'the measured hand hits the intervening cover instead of the enemy');
});

test('windup grace protects only the acquired front enemy body, while projectiles remain harmful',()=>{
  const g=quiet(),chosen=heavy(g,1,65);g.enemies=[chosen];step(g);
  assert.equal(g.player.melee?.phase,'windup');assert.equal(g.player.hp,100);
  g.projectiles=[{x:g.player.x-100,y:g.player.y-30,vx:12000,vy:0,team:'enemy',damage:8,life:1,radius:2}];
  step(g);assert.equal(g.player.hp,92,'melee is not projectile invulnerability');
  const other=quiet();other.enemies=[heavy(other,1,65),heavy(other,2,-65)];step(other);
  assert.equal(other.player.hp,90,'an unacquired enemy still deals contact damage');
});

test('ESQUIVE and genuine body turns cancel windup; pause freezes phase, recharge and damage',()=>{
  for(const action of [{shift:true},{left:true}]){
    const g=quiet(),e=heavy(g);g.enemies=[e];step(g);step(g,action);step(g,{},7);
    assert.equal(e.hp,30);assert.equal(g.player.melee?.phase,'idle');
  }
  const g=quiet(),e=heavy(g);g.enemies=[e];step(g);g.status='paused';const state={...g.player.melee};
  step(g,{},50);assert.deepEqual(g.player.melee,state);assert.equal(e.hp,30);
  g.status='playing';step(g,{},5);assert.equal(e.hp,24);
});

test('a surviving stationary heavy is shoved and immediately anchored to its real supporting floor',()=>{
  for(const elevated of [false,true]){
    const g=quiet();if(elevated){g.platforms=[{id:'slope',tier:1,x1:500,x2:1500,profile:[130,146,132],seed:5}];g.player.platformId='slope';g.player.tier=1;g.player.y=surfaceHeight(g.platforms[0],900);}
    const e=heavy(g);if(elevated){e.platformId='slope';e.tier=1;e.y=surfaceHeight(g.platforms[0],e.x);}g.enemies=[e];const x=e.x;
    step(g,{},6);assert.equal(e.hp,24);assert.equal(e.x,x+18);assert.equal(e.y,elevated?surfaceHeight(g.platforms[0],e.x):terrainHeight(e.x));
  }
});

test('roof weapons remain independent during a punch and invalid deltas cannot advance its state',()=>{
  const g=quiet();g.enemies=[heavy(g,1,78,100)];step(g);
  step(g,{fire:true,missile:true,homing:true});
  assert.equal(g.stats.shots,1);assert.equal(g.stats.mirvs,0);assert.equal(g.player.mirvPending,true);assert.equal(g.stats.homingSalvos,1);
  step(g,{},14);assert.equal(g.stats.mirvs,1);
  const state={...g.player.melee};for(const dt of [NaN,Infinity,-1])update(g,{},dt);assert.deepEqual(g.player.melee,state);
});

test('a lethal contact punch resolves before that enemy can deal body-contact damage',()=>{
  const g=quiet();g.enemies=[heavy(g,1,65,5)];step(g,{},7);
  assert.equal(g.stats.kills,1);assert.equal(g.player.hp,100);assert.equal(g.enemies.length,0);
});

test('a lethal projectile cancels an unfinished punch and dead simulation cannot hit later',()=>{
  const g=quiet(),e=heavy(g);g.enemies=[e];g.player.hp=8;step(g);
  g.projectiles=[{x:g.player.x-100,y:g.player.y-30,vx:12000,vy:0,team:'enemy',damage:8,life:1,radius:2}];
  step(g);assert.equal(g.status,'dead');assert.equal(g.player.melee?.phase,'idle');step(g,{},20);assert.equal(e.hp,30);
});

test('automatic contact recharges from acquisition before it can begin a second blow',()=>{
  const g=quiet();g.enemies=[heavy(g)];step(g,{},42);
  assert.equal(g.stats.meleeSwings,1);assert.equal(g.stats.meleeHits,1);
  step(g);assert.equal(g.stats.meleeSwings,2);assert.equal(g.stats.meleeHits,1);
  step(g,{},5);assert.equal(g.stats.meleeHits,2);
});

test('an airborne hand hits a reachable drone but cannot hit through a vertical separation',()=>{
  for(const height of [100,70]){
    const g=quiet();g.player.y-=height;g.player.onGround=false;g.player.vy=0;
    g.enemies=[{id:1,type:'drone',x:965,y:0,origin:965,hp:30,maxHp:30,phase:0,cooldown:99}];
    step(g,{},6);assert.equal(g.enemies[0].hp,height===100?24:30);
    assert.equal(g.stats.meleeHits,height===100?1:0);
  }
});

test('a heavy shoved at an upper crown edge stays inside the crown and follows its exact floor',()=>{
  const g=quiet(),route={id:'edge-slope',tier:1,x1:500,x2:1000,profile:[130,146,132],seed:5};g.platforms=[route];
  Object.assign(g.player,{x:872,y:surfaceHeight(route,872),platformId:route.id,tier:1});
  const e=heavy(g);Object.assign(e,{platformId:route.id,tier:1,y:surfaceHeight(route,950)});g.enemies=[e];
  step(g,{},6);assert.equal(e.hp,24);assert.equal(e.x,950);assert.equal(e.y,surfaceHeight(route,950));
});
