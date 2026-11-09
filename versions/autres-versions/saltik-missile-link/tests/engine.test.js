import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, update, terrainHeight, PARALLAX_LAYERS} from '../src/engine.js';
const step=(g,input={},seconds=1)=>{for(let i=0;i<seconds*60;i++)update(g,input,1/60);};
test('the world has exactly eight distinct parallax depths',()=>{assert.equal(PARALLAX_LAYERS.length,8);assert.equal(new Set(PARALLAX_LAYERS.map(l=>l.speed)).size,8);});
test('driving changes position; a jump rises and lands on terrain',()=>{const g=createGame();step(g,{right:true},1);assert.ok(g.player.x>350);const floor=terrainHeight(g.player.x);step(g,{jump:true},.2);assert.ok(g.player.y<floor-40);step(g,{},2);assert.equal(g.player.y,terrainHeight(g.player.x));});
test('holding jump produces one jump until the button is released',()=>{const g=createGame();step(g,{jump:true},3);assert.equal(g.player.y,terrainHeight(g.player.x));step(g,{},.05);step(g,{jump:true},.15);assert.ok(g.player.y<terrainHeight(g.player.x)-20);});
test('arm fire damages a ground enemy and the original MIRV has a cooldown',()=>{const g=createGame();g.enemies=[{id:1,type:'walker',x:460,y:terrainHeight(460),hp:8,maxHp:8,cooldown:99,phase:0}];step(g,{fire:true,missile:true},.5);assert.ok(g.enemies.length===0||g.enemies[0].hp<8);assert.equal(g.stats.mirvs,1);assert.ok(g.player.mirvIn>0);});
test('a repair pickup restores armor without exceeding maximum',()=>{const g=createGame();g.player.hp=80;g.pickups=[{x:g.player.x,y:g.player.y-35,type:'repair'}];step(g,{},.1);assert.equal(g.player.hp,100);assert.equal(g.pickups.length,0);});
test('paused games do not move or fire',()=>{const g=createGame();g.status='paused';const x=g.player.x;step(g,{right:true,fire:true},5);assert.equal(g.player.x,x);assert.equal(g.stats.shots,0);});
test('opt-in intro advances only its clock, freezes all simulation, and emits one end event',()=>{
  const g=createGame({intro:true});g.schedule=[];
  g.enemies=[{id:1,type:'walker',x:500,y:terrainHeight(500),hp:5,maxHp:5,cooldown:1,phase:0,hit:0,firePose:0}];
  g.projectiles=[{x:400,y:g.player.y-30,vx:100,vy:0,team:'enemy',damage:8,life:3,radius:4}];
  g.player.fireIn=.8;g.player.mirvIn=2;g.player.reloadIn=.6;
  const before={x:g.player.x,y:g.player.y,enemyX:g.enemies[0].x,enemyPhase:g.enemies[0].phase,projectileX:g.projectiles[0].x,
    fireIn:g.player.fireIn,mirvIn:g.player.mirvIn,reloadIn:g.player.reloadIn,nextSpawn:g.nextSpawn};
  assert.deepEqual([g.introDuration,g.introElapsed],[7,0]);
  step(g,{right:true,fire:true,missile:true,homing:true,jump:true,shift:true,deflect:true},1);
  assert.ok(Math.abs(g.introElapsed-1)<1e-9);
  assert.deepEqual({x:g.player.x,y:g.player.y,enemyX:g.enemies[0].x,enemyPhase:g.enemies[0].phase,projectileX:g.projectiles[0].x,
    fireIn:g.player.fireIn,mirvIn:g.player.mirvIn,reloadIn:g.player.reloadIn,nextSpawn:g.nextSpawn},before);
  assert.deepEqual(g.player.weaponQueue,{fire:false,missile:false,homing:false});
  g.status='paused';const paused=[g.introElapsed,g.time];step(g,{right:true,fire:true},1);
  assert.deepEqual([g.introElapsed,g.time],paused);
  g.status='playing';step(g,{right:true,fire:true},6);
  assert.equal(g.introElapsed,7);assert.equal(g.player.x,before.x);assert.equal(g.stats.shots,0);
  assert.equal(g.events.filter(event=>event.type==='intro-end').length,1);
  update(g,{},1/60);assert.equal(g.events.filter(event=>event.type==='intro-end').length,1);
  assert.equal(g.stats.shots,0);
});
test('default game starts without presentation delay',()=>{const g=createGame();assert.deepEqual([g.introDuration,g.introElapsed],[0,0]);step(g,{right:true},.1);assert.ok(g.player.x>180);});
test('waiting at the starting point has no timeout',()=>{const g=createGame();step(g,{},300);assert.equal(g.status,'playing');assert.equal(g.player.hp,100);});
test('enemy fire can defeat the player, and a fresh run resets state',()=>{const g=createGame();g.player.hp=5;g.projectiles.push({x:g.player.x-10,y:g.player.y-30,vx:300,vy:0,team:'enemy',damage:8,life:2,radius:7});step(g,{},.1);assert.equal(g.status,'dead');const fresh=createGame();assert.equal(fresh.status,'playing');assert.equal(fresh.player.hp,100);assert.equal(fresh.stats.kills,0);});
test('the final boss activates by distance and defeating it wins the mission',()=>{const g=createGame();g.player.x=16600;g.player.y=terrainHeight(g.player.x);step(g,{},.1);assert.ok(g.boss);g.boss.hp=1;g.projectiles.push({x:g.boss.x-190,y:g.boss.y-80,vx:1000,vy:0,team:'player',damage:10,life:2,radius:8,kind:'bullet'});step(g,{},.5);assert.equal(g.status,'won');});
test('the boss front blocks ordinary driving until Saltik jumps over it',()=>{const g=createGame();g.player.x=17000;g.player.y=terrainHeight(17000);step(g,{},.05);g.boss.chargeClock=99;step(g,{right:true},3);assert.ok(g.player.x<=g.boss.x-225);});
test('a fast projectile crossing the whole Tachikoma between frames still hits',()=>{const g=createGame();g.projectiles.push({x:400,y:g.player.y-30,vx:-30000,vy:0,team:'enemy',damage:8,life:1,radius:3});update(g,{},1/60);assert.equal(g.player.hp,92);assert.equal(g.projectiles.length,0);});
