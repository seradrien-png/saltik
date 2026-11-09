import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,terrainHeight,availableBossAssault,canStartBossBreach} from '../src/engine.js';
import {createBossTank,bossGeometry} from '../src/boss-tank.js';
import {createEnemySaltik} from '../src/enemy-saltik.js';

const tick=(g,input={},frames=1)=>{for(let i=0;i<frames&&g.status==='playing';i++)update(g,input,1/60);};
function arena(hp=200){
  const g=createGame();g.schedule=[];g.enemies=[];g.obstacles=[];g.platforms=[];g.pickups=[];
  g.bossActivated=true;g.boss=createBossTank(17520,terrainHeight);g.boss.hp=hp;
  g.boss.chargeClock=99;g.player.invulnerable=99;
  Object.assign(g.player,{x:17250,y:terrainHeight(17250),onGround:true,vy:0});
  return g;
}
function launchRealPodVolley(g){
  const b=g.boss;
  b.weaponElapsed=2;
  for(let frame=0;frame<50&&b.podVolleysFired!==1;frame++)tick(g);
  assert.equal(b.podVolleysFired,1,'the native raised pod must launch real rockets');
  assert.equal(g.events.filter(e=>e.type==='boss-pod-volley').length,1);
  assert.equal(g.events.find(e=>e.type==='boss-pod-volley').count,8);
  assert.equal(g.projectiles.filter(s=>s.kind==='enemy-missile').length,8);
}
function finishAssault(g){
  tick(g,{bossAction:true});tick(g,{},110);
  assert.equal(g.bossBreach?.phase,'qte');
  for(let i=0;i<3;i++){tick(g,{bossAction:true});tick(g,{});}
  tick(g,{},240);
  assert.equal(g.bossBreach,null);
  assert.equal(g.player.onGround,true);
}

test('pod assault unlocks only after the native pod physically launches a volley',()=>{
  const g=arena(),b=g.boss;
  assert.equal(b.podVolleysFired,0);assert.equal(availableBossAssault(g),null);
  b.weaponElapsed=2;
  tick(g,{bossAction:true});assert.equal(b.podPhase,'raising');
  tick(g,{bossAction:true},30);
  assert.equal(b.podVolleysFired,0);assert.equal(availableBossAssault(g),null);
  assert.equal(g.events.filter(e=>e.type==='boss-pod-volley').length,0);
  g.status='paused';const raised=b.podRaise;tick(g,{bossAction:true},60);
  assert.equal(b.podRaise,raised);assert.equal(b.podVolleysFired,0);
  g.status='playing';
  for(let frame=0;frame<30&&b.podVolleysFired===0;frame++)tick(g,{bossAction:true});
  assert.equal(b.podVolleysFired,1);assert.equal(g.events.filter(e=>e.type==='boss-pod-volley').length,1);
  assert.equal(availableBossAssault(g),'pod');assert.equal(g.bossBreach,null,'a held prelaunch press must not start the QTE');
  tick(g,{});tick(g,{bossAction:true});assert.equal(g.bossBreach?.kind,'pod');
});

test('pod assault requires proximity, disables rockets and leaves hull available at 45 percent',()=>{
  const g=arena(),b=g.boss,p=g.player;launchRealPodVolley(g);
  p.x=b.x-500;p.y=terrainHeight(p.x);
  assert.equal(availableBossAssault(g),null);assert.equal(canStartBossBreach(g),false);
  p.x=b.x-420;p.y=terrainHeight(p.x);
  assert.equal(availableBossAssault(g),'pod');
  const initialHp=b.hp;finishAssault(g);
  assert.equal(b.hp,initialHp-20);assert.equal(b.podDestroyed,true);
  assert.equal(g.events.filter(e=>e.type==='pod-destroyed').length,1);
  assert.equal(availableBossAssault(g),null);
  b.hp=89;assert.equal(availableBossAssault(g),'hull');
  p.x=b.x-300;p.y=terrainHeight(p.x);
  const hullHp=b.hp;finishAssault(g);
  assert.equal(b.hp,hullHp-60);assert.equal(g.bossBreachUsed,true);
  assert.equal(g.events.filter(e=>e.type==='breach-shot'&&e.kind==='hull').length,6);
  assert.equal(g.events.filter(e=>e.type==='breach-fire'&&e.kind==='hull').length,1);
  assert.equal(availableBossAssault(g),null);
});

test('hull action takes priority at 45 percent from afar without pod progress, and pod stays optional afterward',()=>{
  const g=arena(91),b=g.boss,p=g.player;
  p.x=16410;p.y=terrainHeight(p.x);
  assert.equal(availableBossAssault(g),null);
  b.hp=90;
  assert.equal(b.podVolleysFired,0);assert.equal(g.bossPodLandedAt,null);
  assert.equal(availableBossAssault(g),'hull');
  g.status='paused';assert.equal(availableBossAssault(g),null);g.status='playing';
  g.introDuration=2;assert.equal(availableBossAssault(g),null);g.introElapsed=2;
  g.duel={phase:'qte'};assert.equal(availableBossAssault(g),null);g.duel=null;
  finishAssault(g);
  assert.equal(b.hp,30);assert.equal(g.bossBreachUsed,true);
  assert.equal(g.bossPodUsed,false);assert.equal(availableBossAssault(g),null);
  Object.assign(p,{x:b.x-270,y:terrainHeight(b.x-270),onGround:true,bossSupport:null});
  launchRealPodVolley(g);
  assert.equal(availableBossAssault(g),'pod');
});

test('pod arrival shot has a QTE presentation clock that freezes with pause',()=>{
  const g=arena();launchRealPodVolley(g);tick(g,{bossAction:true});tick(g,{},50);
  assert.equal(g.bossBreach.kind,'pod');assert.equal(g.bossBreach.phase,'qte');
  const before=g.bossBreach.elapsed;
  tick(g,{},6);assert.ok(g.bossBreach.elapsed>before);
  const elapsed=g.bossBreach.elapsed;
  g.status='paused';tick(g,{},30);
  assert.equal(g.bossBreach.elapsed,elapsed);
  g.status='playing';tick(g,{});
  assert.ok(g.bossBreach.elapsed>elapsed);
  assert.equal(g.bossBreach.taps,0);
});

test('hull assault grounds Saltik before its 1.25 second burst deals damage once',()=>{
  const g=arena(120),b=g.boss;launchRealPodVolley(g);finishAssault(g);
  b.hp=80;g.player.x=b.x-300;g.player.y=terrainHeight(g.player.x);
  assert.equal(availableBossAssault(g),'hull');
  tick(g,{bossAction:true});assert.equal(g.bossBreach.kind,'hull');
  tick(g,{},110);
  for(let i=0;i<3;i++){tick(g,{bossAction:true});tick(g,{});}
  tick(g,{},90);assert.equal(g.bossBreach.phase,'fire');
  const hp=b.hp;
  tick(g,{},60);assert.equal(b.hp,hp);assert.ok(g.bossBreach.shotsFired>0);
  tick(g,{},20);assert.equal(b.hp,hp-60);
  tick(g,{},100);assert.equal(b.hp,hp-60);
});

test('pod rockets launch from their mouth together, with no cannon during the pod cycle',()=>{
  const g=arena(),b=g.boss,p=g.player;
  b.weaponElapsed=2;
  tick(g);assert.equal(b.cannonRecoil,0);
  assert.equal(b.podPhase,'raising');
  tick(g,{},20);assert.equal(g.projectiles.filter(s=>s.kind==='enemy-missile').length,0);
  assert.equal(g.projectiles.filter(s=>s.kind==='plasma').length,0);
  tick(g,{},24);
  const rockets=g.projectiles.filter(s=>s.kind==='enemy-missile');
  assert.equal(rockets.length,8);
  assert.deepEqual(bossGeometry(b).podMuzzle,{x:b.x+56,y:b.y-192});
  assert.ok(rockets.every(s=>s.team==='enemy'&&s.hp===1&&s.launchX===bossGeometry(b).podMuzzle.x));
  assert.ok(rockets.every(s=>s.launchY===b.y-192));
  assert.equal(new Set(rockets.map(s=>s.vy)).size,8,'the rockets fan apart before homing');
  assert.equal(g.events.filter(e=>e.type==='boss-pod-volley').length,1);
  assert.equal(g.events.find(e=>e.type==='boss-pod-volley').count,8);
  assert.ok(g.events.some(e=>e.type==='boss-pod-warning'));
  assert.equal(b.attack,0);
  g.projectiles=[];tick(g,{},269);assert.equal(b.attack,0);
  tick(g);assert.equal(b.attack,1);assert.equal(b.cannonRecoil,1);
  const cannon=g.projectiles.filter(s=>s.kind==='plasma');
  assert.equal(cannon.length,3);assert.ok(cannon.every(s=>s.launchX===bossGeometry(b).muzzle.x));
  b.podDestroyed=true;g.projectiles=[];
  tick(g,{},300);assert.equal(g.projectiles.some(s=>s.kind==='enemy-missile'),false);
  assert.equal(p.hp>0,true);
});

test('enemy Saltik sighting and ready guard are voiced only when visible and once per enemy',()=>{
  const g=arena();g.boss=null;g.bossActivated=false;
  g.player.x=300;g.player.y=terrainHeight(300);
  const e=createEnemySaltik({id:72,x:1300,type:'saltik'},{y:terrainHeight(1300),random:0});
  g.enemies=[e];g.viewport={x:0,y:0,w:900,h:720};
  tick(g,{},30);assert.equal(g.events.some(v=>v.type==='saltik-detected'),false);
  e.guard=true;e.hp=6;tick(g);assert.equal(g.events.some(v=>v.type==='saltik-grab-ready'),false);
  g.viewport={x:800,y:0,w:900,h:720};tick(g);
  assert.equal(g.events.filter(v=>v.type==='saltik-detected'&&v.enemyId===72).length,1);
  assert.equal(g.events.filter(v=>v.type==='saltik-grab-ready'&&v.enemyId===72).length,1);
  tick(g,{},30);
  assert.equal(g.events.filter(v=>v.type==='saltik-detected'&&v.enemyId===72).length,1);
  assert.equal(g.events.filter(v=>v.type==='saltik-grab-ready'&&v.enemyId===72).length,1);
});
