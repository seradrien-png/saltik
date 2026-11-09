import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,terrainHeight,surfaceHeight} from '../src/engine.js';
import {createEnemySaltik} from '../src/enemy-saltik.js';

function quiet(){const g=createGame();g.schedule=[];g.obstacles=[];g.platforms=[];g.pickups=[];return g;}
function saltik(g,{id=1,x=g.player.x+100,platformId=null,tier=0}={}){
  const y=platformId?surfaceHeight(g.platforms.find(p=>p.id===platformId),x):terrainHeight(x);
  return createEnemySaltik({id,x,platformId,tier},{y,random:0});
}
const step=(g,input={},frames=1)=>{for(let i=0;i<frames;i++)update(g,input,1/60);};
function strike(g,e,damage=100,kind='bullet'){
  g.projectiles.push({kind,team:'player',x:e.x-100,y:e.y-43,vx:12000,vy:0,damage,radius:3,life:1});
  step(g);
}

test('the first oversized ranged hit clamps Saltik at 6 and later ranged hits deflect without kills',()=>{
  const g=quiet(),e=saltik(g);g.enemies=[e];g.player.melee.cooldown=99;
  strike(g,e,100);assert.equal(e.hp,6);assert.equal(e.guard,true);
  assert.equal(g.events.filter(v=>v.type==='enemy-guard').length,1);
  strike(g,e,100);assert.equal(e.hp,6);assert.equal(g.stats.kills,0);
  assert.equal(g.events.filter(v=>v.type==='enemy-deflect').length,1);
});

test('Saltik takes ranged damage above 6 HP and guards only when the hit reaches 6',()=>{
  const g=quiet(),e=saltik(g,{x:g.player.x+400});g.enemies=[e];
  strike(g,e,17);assert.equal(e.hp,7);assert.equal(e.guard,false);
  assert.equal(g.events.filter(event=>event.type==='enemy-guard').length,0);
  strike(g,e,1);assert.equal(e.hp,6);assert.equal(e.guard,true);
  assert.equal(g.events.filter(event=>event.type==='enemy-guard').length,1);
});

test('an oversized melee hit also stops at 6 HP without killing the Saltik',()=>{
  const g=quiet(),p=g.player,e=saltik(g,{x:p.x+65});g.enemies=[e];e.hp=7;
  Object.assign(p.melee,{phase:'impact',elapsed:0,cooldown:99,targetKey:'enemy:1',hit:false});
  step(g);
  assert.equal(e.hp,6);assert.equal(e.guard,true);assert.equal(g.duel?.phase,'engage');
  assert.equal(g.stats.kills,0);
});

test('a single blast and sequential queued explosions cannot skip the guard',()=>{
  const g=quiet(),e=saltik(g,{x:g.player.x+400});g.enemies=[e];
  for(let i=0;i<3;i++)g.projectiles.push({kind:'grenade',team:'player',x:e.x,y:e.y-35,vx:0,vy:0,damage:100,radius:5,splash:100,life:.001});
  step(g);assert.equal(e.hp,6);assert.equal(e.guard,true);assert.equal(g.stats.kills,0);
  assert.equal(g.events.filter(v=>v.type==='enemy-guard').length,1);
  assert.equal(g.events.filter(v=>v.type==='enemy-deflect').length,2);
});

test('guard contact requires grounded feet on the same support, without moving either actor',()=>{
  const g=quiet(),e=saltik(g,{x:g.player.x+65});g.enemies=[e];e.hp=6;e.guard=true;
  const x=g.player.x,y=g.player.y;
  g.player.y=y-80;g.player.onGround=false;step(g);assert.equal(g.duel,null);
  g.player.onGround=true;g.player.y=y;g.player.vy=0;e.platformId='other';step(g);assert.equal(g.duel,null);
  e.platformId=null;step(g);assert.equal(g.duel?.phase,'engage');
  assert.deepEqual([g.player.x,g.player.y,e.x,e.y],[x,y,x+65,terrainHeight(x+65)]);
  assert.equal(g.events.filter(v=>v.type==='duel-start').length,1);
});

test('two actors on the same sloped ledge can grapple at close range, but one below it cannot',()=>{
  const g=createGame();g.schedule=[];g.obstacles=[];g.pickups=[];
  const route=g.platforms.find(r=>r.tier===1),x=route.x1+200,p=g.player;
  Object.assign(p,{x,y:terrainHeight(x),supportY:terrainHeight(x),platformId:null,tier:0});
  const e=saltik(g,{id:44,x:x+65,platformId:route.id,tier:route.tier});e.hp=6;e.guard=true;g.enemies=[e];
  step(g);assert.equal(g.duel,null);
  Object.assign(p,{y:surfaceHeight(route,x),supportY:surfaceHeight(route,x),platformId:route.id,tier:route.tier,onGround:true,vy:0});
  step(g);assert.equal(g.duel?.enemyId,44);
  assert.equal(g.duel.playerY,surfaceHeight(route,x));assert.equal(g.duel.enemyY,surfaceHeight(route,x+65));
});

test('duel freezes combat and pause, then scores one kill and permits a second encounter',()=>{
  const g=quiet(),e=saltik(g,{x:g.player.x+65});g.enemies=[e];e.hp=6;e.guard=true;
  step(g);assert.equal(g.duel?.phase,'engage');
  const p=g.player;g.projectiles=[{kind:'plasma',team:'enemy',x:p.x,y:p.y-30,vx:100,vy:0,damage:100,radius:4,life:1}];
  const frozen={x:p.x,hp:p.hp,fireSpent:p.fireSpent,projectileX:g.projectiles[0].x};
  step(g,{right:true,fire:true,shift:true,missile:true,homing:true},30);
  assert.deepEqual([p.x,p.hp,p.fireSpent,g.projectiles[0].x],[frozen.x,frozen.hp,frozen.fireSpent,frozen.projectileX]);
  assert.equal(g.duel.phase,'qte');
  g.status='paused';const paused=structuredClone(g.duel);step(g,{qte:true},180);assert.deepEqual(g.duel,paused);g.status='playing';
  step(g,{qte:true},1);assert.equal(g.duel.taps,0,'pause cannot buffer a press');
  for(let i=0;i<5;i++){step(g,{qte:false});step(g,{qte:true});}
  assert.equal(g.duel.phase,'qte');
  const effortBeforePause=[g.duel.effortsCompleted,g.duel.effortElapsed];
  g.status='paused';step(g,{qte:true},120);
  assert.deepEqual([g.duel.effortsCompleted,g.duel.effortElapsed],effortBeforePause);
  g.status='playing';step(g,{},210);assert.equal(g.duel,null);
  assert.equal(g.stats.kills,1);assert.equal(g.stats.score,250);
  assert.equal(g.events.filter(v=>v.type==='duel-impact').length,1);
  assert.equal(g.events.filter(v=>v.type==='duel-end').length,1);
  const second=saltik(g,{id:2,x:p.x-65});second.guard=true;second.hp=6;g.enemies=[second];
  step(g);assert.equal(g.duel?.enemyId,2);
  step(g,{},30);
  for(let i=0;i<5;i++){step(g,{qte:false});step(g,{qte:true});}
  step(g,{},210);
  assert.equal(g.duel,null);assert.equal(g.stats.kills,2);assert.equal(g.stats.score,500);
  assert.equal(g.events.filter(v=>v.type==='duel-impact').length,2);
});

test('duel shake and damage flash decay on the game clock but freeze during pause',()=>{
  const g=quiet(),e=saltik(g,{x:g.player.x+65});e.hp=6;e.guard=true;g.enemies=[e];step(g);
  g.shake=9;g.flash=.24;step(g,{},6);
  assert.ok(g.shake<9&&g.flash<.24);
  g.status='paused';const frozen=[g.shake,g.flash,g.duel.elapsed];step(g,{},60);
  assert.deepEqual([g.shake,g.flash,g.duel.elapsed],frozen);
  g.status='playing';step(g,{},60);
  assert.equal(g.shake,0);assert.equal(g.flash,0);assert.equal(g.duel.phase,'qte');
});

test('melee at guard range cannot push a guarded Saltik away from the approaching player',()=>{
  const g=quiet(),x=g.player.x+85,e=saltik(g,{x});e.hp=6;e.guard=true;g.enemies=[e];
  step(g,{},12);
  assert.equal(e.x,x);assert.equal(e.hp,6);assert.equal(g.duel,null);
  step(g,{right:true},3);assert.equal(g.duel?.enemyId,e.id);
});

test('a close melee threshold hit starts the duel before contact damage or weapons in the same tick',()=>{
  const g=quiet(),p=g.player,e=saltik(g,{x:p.x+65});e.hp=7;g.enemies=[e];
  Object.assign(p.melee,{phase:'impact',elapsed:0,cooldown:99,targetKey:'enemy:1',hit:false});
  const position=[p.x,p.y,e.x,e.y];
  step(g,{fire:true,missile:true,homing:true});
  assert.equal(e.hp,6);assert.equal(e.guard,true);assert.equal(g.duel?.phase,'engage');
  assert.equal(p.hp,100);assert.equal(g.stats.shots,0);assert.equal(g.stats.mirvs,0);
  assert.deepEqual([p.x,p.y,e.x,e.y],position);
  assert.deepEqual(g.events.filter(event=>['enemy-guard','duel-start','damage'].includes(event.type)).map(event=>event.type),['enemy-guard','duel-start']);
});
