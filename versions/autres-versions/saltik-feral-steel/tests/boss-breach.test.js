import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,terrainHeight} from '../src/engine.js';
import {createBossTank,bossGeometry} from '../src/boss-tank.js';

const tick=(g,input={},frames=1)=>{for(let i=0;i<frames;i++)update(g,input,1/60);};
function arena(hp=90){
  const g=createGame();g.schedule=[];g.enemies=[];g.obstacles=[];g.platforms=[];g.pickups=[];
  g.bossActivated=true;g.boss=createBossTank(17520,terrainHeight);g.boss.hp=hp;g.boss.cooldown=99;
  g.boss.podDestroyed=true;g.boss.podPhase='destroyed';g.bossPodUsed=true;g.bossPodLandedAt=-3;
  Object.assign(g.player,{x:17250,y:terrainHeight(17250),onGround:true,vy:0});
  return g;
}
function mounted(g){tick(g,{bossAction:true});tick(g,{},50);assert.equal(g.bossBreach?.phase,'qte');}

test('hull assault starts manually below 45 percent and leaps from the current physical position',()=>{
  const g=arena(91),p=g.player,startX=p.x,startY=p.y;
  tick(g,{bossAction:true});assert.equal(g.bossBreach,null);
  tick(g,{});g.boss.hp=90;tick(g,{bossAction:true});
  assert.equal(g.bossBreach?.phase,'leap');assert.equal(g.bossBreach.fromX,startX);
  assert.equal(g.bossBreach.kind,'hull');
  assert.equal(g.bossBreach.fromY,startY);assert.equal(p.onGround,false);
  assert.equal(g.bossBreach.leapDuration,.72);
  assert.equal(g.boss.x,17520);
  tick(g,{},20);assert.ok(p.x>startX&&p.x<bossGeometry(g.boss).roof.x2);
  assert.ok(p.y<startY);
  tick(g,{},30);assert.equal(g.bossBreach?.phase,'qte');
  assert.equal(p.bossSupport,'deck');assert.equal(p.onGround,true);
  assert.equal(p.y,bossGeometry(g.boss).roof.y);
});

test('a distant hull assault leaps from Saltik’s current position to the deck',()=>{
  const g=arena(),p=g.player,b=g.boss;
  p.x=16410;p.y=terrainHeight(p.x);
  tick(g,{bossAction:true});
  assert.equal(g.bossBreach.phase,'leap');
  assert.equal(g.bossBreach.fromX,16410);
  assert.ok(g.bossBreach.leapDuration>1.5);
  tick(g,{},20);assert.ok(p.y<terrainHeight(p.x)-40);
  tick(g,{},90);assert.equal(g.bossBreach.phase,'qte');
  assert.equal(p.bossSupport,'deck');assert.equal(p.y,bossGeometry(b).roof.y);
});

test('three distinct presses queue three full efforts, ignoring held and preheld input',()=>{
  const g=arena();mounted(g);
  tick(g,{bossAction:true},30);assert.equal(g.bossBreach.taps,1);
  assert.equal(g.bossBreach.effortsCompleted,1);
  tick(g,{bossAction:true},30);assert.equal(g.bossBreach.taps,1);
  tick(g,{});tick(g,{bossAction:true});tick(g,{});tick(g,{bossAction:true});
  assert.equal(g.bossBreach.taps,3);assert.equal(g.bossBreach.phase,'qte');
  assert.equal(g.bossBreach.effortsCompleted,1);
  tick(g,{},42);assert.equal(g.bossBreach.phase,'tear');
  assert.equal(g.bossBreach.effortsCompleted,3);
  const preheld=arena();tick(preheld,{bossAction:true},55);
  assert.equal(preheld.bossBreach.phase,'qte');assert.equal(preheld.bossBreach.taps,0);
  tick(preheld,{});tick(preheld,{bossAction:true});assert.equal(preheld.bossBreach.taps,1);
});

test('assault freezes combat and pause, and never accepts a press held through resume',()=>{
  const g=arena(),p=g.player;mounted(g);
  g.projectiles.push({team:'enemy',kind:'plasma',x:p.x,y:p.y-40,vx:100,vy:0,damage:30,radius:5,life:2});
  const frozen={hp:p.hp,shotX:g.projectiles[0].x,bossX:g.boss.x,time:g.boss.phase,weaponTime:g.boss.weaponElapsed};
  tick(g,{right:true,fire:true,missile:true,homing:true},30);
  assert.deepEqual({hp:p.hp,shotX:g.projectiles[0].x,bossX:g.boss.x,time:g.boss.phase,weaponTime:g.boss.weaponElapsed},frozen);
  g.status='paused';const before=structuredClone(g.bossBreach);tick(g,{bossAction:true},40);
  assert.deepEqual(g.bossBreach,before);g.status='playing';tick(g,{bossAction:true});
  assert.equal(g.bossBreach.taps,0);
  tick(g,{});tick(g,{bossAction:true});assert.equal(g.bossBreach.taps,1);
});

test('assault effects fade during play and freeze while paused',()=>{
  const g=arena();mounted(g);g.shake=22;g.flash=.24;g.player.damagePose=true;
  g.status='paused';tick(g,{},40);
  assert.equal(g.shake,22);assert.equal(g.flash,.24);
  g.status='playing';tick(g,{},50);
  assert.equal(g.bossBreach.phase,'qte');assert.equal(g.shake,0);
  assert.equal(g.flash,0);assert.equal(g.player.damagePose,false);
});

test('armor tears before one shot damages the boss; cannon returns Saltik safely before a fatal win',()=>{
  const g=arena(50),b=g.boss,p=g.player;mounted(g);
  for(let i=0;i<3;i++){tick(g,{});tick(g,{bossAction:true});}
  tick(g,{},60);assert.equal(g.bossBreach.phase,'tear');assert.equal(b.hp,50);
  tick(g,{},25);assert.equal(g.bossBreach.phase,'fire');assert.equal(b.hp,50);
  tick(g,{},75);assert.equal(g.bossBreach.phase,'eject');assert.equal(b.hp,-10);
  assert.equal(g.status,'playing');assert.equal(g.pendingVictory,true);
  assert.equal(g.viewport.x,p.x-360);
  assert.equal(g.events.filter(e=>e.type==='breach-fire').length,1);
  tick(g,{},25);assert.equal(g.bossBreach.phase,'return');assert.equal(p.bossSupport,null);
  assert.equal(p.onGround,false);
  tick(g,{},100);assert.equal(g.bossBreach,null);assert.equal(g.status,'won');
  assert.equal(p.onGround,true);assert.equal(p.y,terrainHeight(p.x));
  assert.equal(g.pendingVictory,false);assert.equal(g.shake,0);
  assert.equal(g.viewport.x,p.x-360);
  assert.equal(g.bossBreachUsed,true);assert.equal(g.events.filter(e=>e.type==='breach-fire').length,1);
});

test('surviving boss resumes ordinary combat and the optional assault stays used',()=>{
  const g=arena(90);mounted(g);
  for(let i=0;i<3;i++){tick(g,{});tick(g,{bossAction:true});}
  tick(g,{},260);
  assert.equal(g.bossBreach,null);assert.equal(g.boss.hp,30);assert.equal(g.status,'playing');
  assert.equal(g.bossBreachUsed,true);
  tick(g,{bossAction:true});assert.equal(g.bossBreach,null);
  g.boss.hp=1;g.projectiles.push({team:'player',kind:'bullet',x:g.boss.x-190,y:g.boss.y-80,vx:1800,vy:0,damage:2,radius:5,life:2});
  tick(g,{},2);assert.equal(g.status,'won');
});
