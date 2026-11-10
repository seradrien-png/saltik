import test from 'node:test';
import assert from 'node:assert/strict';
import {createBossTank,bossGeometry,advanceBossTank,advanceBossWeapons,bossRoofAt} from '../src/boss-tank.js';
import {createGame,update,terrainHeight} from '../src/engine.js';

const tick=(g,input={},frames=1)=>{for(let i=0;i<frames&&g.status==='playing';i++)update(g,input,1/60);};
function arena(){const g=createGame();g.schedule=[];g.enemies=[];g.obstacles=[];g.pickups=[];g.bossActivated=true;g.boss=createBossTank(17520,terrainHeight);return g;}

test('charge snapshots the viewport and traverses roughly three quarters of it inside the arena',()=>{
  const b=createBossTank(17520,terrainHeight),viewport={x:16600,y:0,w:1000,h:720};
  b.chargeClock=0;advanceBossTank(b,1/60,{viewport,groundAt:terrainHeight});
  assert.equal(b.chargePhase,'telegraph');assert.equal(b.chargeStartX,17520);
  assert.ok(Math.abs(b.chargeTargetX-(17520-750))<1);
  viewport.w=4000;viewport.x=10000;
  for(let i=0;i<168;i++)advanceBossTank(b,1/60,{viewport,groundAt:terrainHeight});
  assert.ok(b.x>=16400&&b.x<=17800);assert.ok(Math.abs(b.x-(17520-750))<1);
  assert.equal(b.chargePhase,'recover');
});

test('the slower charge gives a readable warning and travels the same swept distance',()=>{
  const b=createBossTank(17520,terrainHeight),viewport={x:16600,y:0,w:1000,h:720};
  b.chargeClock=0;advanceBossTank(b,1/60,{viewport,groundAt:terrainHeight});
  for(let i=0;i<50;i++)advanceBossTank(b,1/60,{viewport,groundAt:terrainHeight});
  assert.equal(b.chargePhase,'telegraph');assert.equal(b.x,17520);
  advanceBossTank(b,1/60,{viewport,groundAt:terrainHeight});
  assert.equal(b.chargePhase,'charge');
  assert.equal(b.chargeDuration,1.65/.85);
  for(let i=0;i<60;i++)advanceBossTank(b,1/60,{viewport,groundAt:terrainHeight});
  assert.ok(Math.abs((17520-b.x)-(750/(1.65/.85)))<1,'forward velocity is 15 percent slower');
  for(let i=0;i<57;i++)advanceBossTank(b,1/60,{viewport,groundAt:terrainHeight});
  assert.equal(b.chargePhase,'recover');assert.equal(b.x,16770);
  for(let i=0;i<89;i++)advanceBossTank(b,1/60,{viewport,groundAt:terrainHeight});
  assert.equal(b.chargePhase,'recover');
  advanceBossTank(b,1/60,{viewport,groundAt:terrainHeight});
  assert.equal(b.chargePhase,'idle');assert.equal(b.x,17520);
});

test('geometry follows the native chassis and exposes walkable deck and turret roof',()=>{
  const b=createBossTank(17520,terrainHeight),r=bossGeometry(b);
  assert.deepEqual(r.sprite,{x:b.x-177,y:b.y-183,w:370,h:176});
  assert.ok(r.front.x<r.hull.x&&r.front.x>=r.sprite.x);
  assert.equal(bossRoofAt(b,b.x-85)?.y,r.roof.y);
  assert.equal(bossRoofAt(b,b.x+35)?.y,r.turretRoof.y);
  assert.equal(bossRoofAt(b,b.x-200),null);
});

test('boss shots launch from the visible barrel in each armor state',()=>{
  const g=arena(),b=g.boss;
  b.podDestroyed=true;b.weaponPhase='fallback';b.weaponElapsed=5;tick(g);
  let shots=g.projectiles.filter(s=>s.team==='enemy');
  assert.ok(shots.length>0);
  assert.ok(shots.every(s=>s.launchX===b.x-140&&s.launchY===b.y-180));
  assert.deepEqual(bossGeometry(b).muzzle,{x:b.x-140,y:b.y-180});
  g.projectiles=[];b.breached=true;b.weaponElapsed=5;tick(g);
  shots=g.projectiles.filter(s=>s.team==='enemy');
  assert.ok(shots.length>0);
  assert.ok(shots.every(s=>s.launchX===b.x-140&&s.launchY===b.y-180));
  assert.deepEqual(bossGeometry(b).muzzle,{x:b.x-140,y:b.y-180});
});

test('fallback main burst has three timed large rounds at normal and frenzy HP',()=>{
  for(const hp of [200,41,40]){
    const g=arena(),b=g.boss;Object.assign(b,{hp,podDestroyed:true,weaponPhase:'fallback',weaponElapsed:5,chargeClock:99});g.player.invulnerable=99;
    tick(g,{},40);
    const shots=g.events.filter(e=>e.type==='boss-main-shot');
    assert.equal(shots.length,3);assert.ok(shots[1].time>shots[0].time&&shots[2].time>shots[1].time);
    const rounds=g.projectiles.filter(s=>s.kind==='plasma'&&s.radius===9);
    assert.ok(rounds.every(s=>s.damage===12&&Math.abs(Math.hypot(s.vx,s.vy)-330)<1e-8));
  }
});

test('one weapon clock schedules pod, cannon, then pod with native pod motion',()=>{
  const b=createBossTank(17520,terrainHeight),events=[];
  for(let frame=1;frame<=1000;frame++){
    const signal=advanceBossWeapons(b,1/60);
    if(signal)events.push({signal,time:frame/60,phase:b.podPhase,raise:b.podRaise});
    if(events.filter(e=>e.signal==='pod-volley').length===2)break;
  }
  assert.deepEqual(events.map(e=>e.signal),['pod-warning','pod-volley','cannon-volley','pod-warning','pod-volley']);
  assert.ok(Math.abs(events[0].time-2)<1/60+1e-9);
  assert.ok(Math.abs(events[1].time-events[0].time-.72)<1/60+1e-9);
  assert.ok(Math.abs(events[2].time-events[1].time-4.5)<1/60+1e-9);
  assert.ok(events[3].time-events[1].time>=12-1/60-1e-9);
  assert.equal(events[1].phase,'firing');assert.equal(events[1].raise,1);
});

test('destroying the pod cancels its pending launch and fires cannon every five seconds',()=>{
  const b=createBossTank(17520,terrainHeight);
  for(let i=0;i<130;i++)advanceBossWeapons(b,1/60);
  assert.equal(b.podPhase,'raising');b.podDestroyed=true;
  const events=[];
  for(let frame=1;frame<=610;frame++){
    const signal=advanceBossWeapons(b,1/60);
    if(signal)events.push({signal,time:frame/60});
  }
  assert.equal(b.podPhase,'destroyed');assert.equal(b.podRaise,0);
  assert.deepEqual(events.map(e=>e.signal),['cannon-volley','cannon-volley']);
  assert.ok(Math.abs(events[0].time-5)<1/60+1e-9);
  assert.ok(Math.abs(events[1].time-10)<1/60+1e-9);
});

test('descending player lands on moving deck, rides, and can jump off',()=>{
  const g=arena(),b=g.boss,p=g.player,roof=bossGeometry(b).roof;
  Object.assign(p,{x:b.x-90,y:roof.y-60,vy:160,onGround:false,platformId:null,obstacleId:null,bossSupport:null});
  tick(g,{},25);assert.equal(p.bossSupport,'deck');assert.equal(p.onGround,true);
  const delta=b.x-p.x;b.chargePhase='charge';b.chargeStartX=b.x;b.chargeTargetX=b.x-300;b.chargeElapsed=0;b.chargeDuration=.6;
  tick(g,{},18);assert.ok(Math.abs((b.x-p.x)-delta)<2,'rider travels with tank');
  tick(g,{jump:true});assert.equal(p.bossSupport,null);assert.equal(p.onGround,false);
});

test('a normal jump from the blocked front edge reaches the tank deck',()=>{
  const g=arena(),b=g.boss,p=g.player;
  Object.assign(p,{x:b.x-235,y:terrainHeight(b.x-235),onGround:true,vy:0,turn:null});
  tick(g,{right:true,jump:true},50);
  assert.equal(p.bossSupport,'deck');assert.equal(p.onGround,true);
  assert.ok(p.x>=bossGeometry(b).roof.x1&&p.x<=bossGeometry(b).roof.x2);
});

test('mounted primary fire travels from the muzzle into the tank',()=>{
  const g=arena(),b=g.boss,p=g.player,r=bossGeometry(b);
  Object.assign(p,{x:b.x-90,y:r.roof.y,vy:0,onGround:true,bossSupport:'deck',platformId:null,obstacleId:null,dir:1,turn:null});
  p.melee.cooldown=99;const hp=b.hp;tick(g,{fire:true});
  const launched=g.projectiles.find(s=>s.team==='player'&&s.kind==='bullet');
  assert.ok(launched);assert.ok(launched.vy>0);assert.ok(launched.launchY<r.hitBounds.y);
  tick(g,{fire:true},49);assert.ok(g.stats.shots>0);assert.ok(b.hp<hp,`boss hp ${b.hp}`);
});

test('dwell rotates turret and ejects player harmlessly without support leak on defeat',()=>{
  const g=arena(),b=g.boss,p=g.player,r=bossGeometry(b);
  Object.assign(p,{x:b.x-90,y:r.roof.y,vy:0,onGround:true,bossSupport:'deck',platformId:null,obstacleId:null});
  const hp=p.hp;tick(g,{},194);
  assert.ok(b.turretSpin>0);assert.equal(p.bossSupport,null);assert.equal(p.onGround,false);assert.ok(p.vy<0);assert.equal(p.hp,hp);
  tick(g,{},100);assert.equal(p.bossSupport,null);assert.equal(p.onGround,true);assert.equal(p.hp,hp);
  assert.equal(b.turretSpin,0,'the turret returns to its native forward profile after ejecting');
  b.hp=0;tick(g,{},1);assert.equal(p.bossSupport,null);
});

test('charge nose hits exposed ground player once but passes a rider, high jumper and held rear',()=>{
  for(const evade of ['none','rear','high','rider']){
    const g=arena(),b=g.boss,p=g.player;
    b.x=17520;b.y=terrainHeight(b.x);b.chargePhase='charge';b.chargeStartX=b.x;b.chargeTargetX=b.x-750;b.chargeElapsed=0;b.chargeDuration=.55;
    Object.assign(p,{x:17280,y:terrainHeight(17280),onGround:true,vy:0,invulnerable:0});
    if(evade==='rear'){p.evasion.active=true;p.evasion.held=true;p.evasion.kind='tilt';p.shiftHeld=true;}
    if(evade==='high'){p.y-=220;p.onGround=false;p.vy=0;}
    if(evade==='rider'){p.x=b.x-90;p.y=bossGeometry(b).roof.y;p.bossSupport='deck';}
    tick(g,evade==='rear'?{shift:true}:{},40);
    assert.equal(p.hp,evade==='none'?85:100,`${evade} hp`);
    if(evade==='rear')assert.ok(b.x<p.x,'rear plane allows the charge to pass through');
  }
});

test('an exposed ground player stays on the nose side throughout the charge',()=>{
  const g=arena(),b=g.boss,p=g.player;
  b.chargePhase='charge';b.chargeStartX=b.x;b.chargeTargetX=b.x-750;b.chargeElapsed=0;b.chargeDuration=.55;
  Object.assign(p,{x:17280,y:terrainHeight(17280),onGround:true,vy:0});
  tick(g,{},34);
  assert.equal(b.chargePhase,'recover');
  assert.ok(p.x<=bossGeometry(b).front.x-58,`player ${p.x}, front ${bossGeometry(b).front.x}`);
  assert.equal(p.hp,85);
});

test('the final charge travel frame still damages a newly reached player',()=>{
  const g=arena(),b=g.boss,p=g.player;
  b.chargePhase='charge';b.chargeStartX=17520;b.chargeTargetX=16770;b.chargeDuration=.72;b.chargeElapsed=.72-1/60;
  b.x=b.chargeStartX+(b.chargeTargetX-b.chargeStartX)*b.chargeElapsed/b.chargeDuration;b.y=terrainHeight(b.x);
  Object.assign(p,{x:16540,y:terrainHeight(16540),onGround:true,vy:0});
  tick(g,{},1);assert.equal(b.chargePhase,'recover');assert.equal(p.hp,85);
});

test('a mounted final hit removes tank support and victory waits for a natural landing',()=>{
  const g=arena(),b=g.boss,p=g.player,r=bossGeometry(b);
  Object.assign(p,{x:b.x-90,y:r.roof.y,vy:0,onGround:true,bossSupport:'deck',platformId:null,obstacleId:null,dir:1,turn:null});
  p.melee.cooldown=99;b.hp=1;const startY=p.y;
  tick(g,{fire:true},20);
  assert.equal(b.hp,0);assert.equal(p.bossSupport,null);assert.equal(g.pendingVictory,true);
  assert.ok(p.y>startY&&p.y<terrainHeight(p.x));
  tick(g,{},30);assert.equal(g.status,'won');assert.equal(p.y,terrainHeight(p.x));
});

test('a killing shot during an ordinary jump also waits for grounded victory',()=>{
  const g=arena(),b=g.boss,p=g.player;
  Object.assign(p,{x:b.x-260,y:terrainHeight(b.x-260)-160,vy:0,onGround:false,bossSupport:null});
  b.hp=1;
  g.projectiles.push({id:g.nextProjectileId++,team:'player',kind:'bullet',x:b.x-180,y:b.y-50,vx:1800,vy:0,radius:3,damage:1,life:2});
  tick(g,{},2);
  assert.equal(b.hp,0);assert.equal(g.status,'playing');assert.equal(g.pendingVictory,true);
  assert.equal(p.onGround,false);
  tick(g,{},70);assert.equal(g.status,'won');assert.equal(p.y,terrainHeight(p.x));
});

test('turret ejection during a charge never attaches Saltik to the nose',()=>{
  const g=arena(),b=g.boss,p=g.player,r=bossGeometry(b);
  Object.assign(p,{x:b.x-90,y:r.roof.y,vy:0,onGround:true,bossSupport:'deck',platformId:null,obstacleId:null});
  b.riderTime=3.18;b.chargePhase='charge';b.chargeStartX=b.x;b.chargeTargetX=b.x-750;b.chargeElapsed=0;b.chargeDuration=.72;
  const hp=p.hp;tick(g,{},4);
  assert.equal(p.bossSupport,null);assert.equal(p.bossPush,false);assert.equal(p.hp,hp);
  assert.ok(p.vy<0);assert.ok(p.x>bossGeometry(b).front.x-58);
});

test('a charge passing under the ejection arc cannot catch Saltik back on its roof',()=>{
  const g=arena(),b=g.boss,p=g.player;
  b.chargeClock=2.9;
  Object.assign(p,{x:b.x-90,y:bossGeometry(b).roof.y,onGround:true,bossSupport:'deck'});
  let airborne=false,landed=false;
  for(let i=0;i<300;i++){
    tick(g);if(!p.onGround)airborne=true;
    if(airborne&&p.onGround){landed=true;break;}
  }
  assert.equal(landed,true);assert.equal(p.bossSupport,null);assert.equal(p.y,terrainHeight(p.x));
});
