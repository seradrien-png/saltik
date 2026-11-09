import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine.js';
import {enemyGeometry} from '../src/enemy-art.js';
import {projectPlayer,projectDepthPoint} from '../src/world.js';
import {TURN_DURATION} from '../src/tachikoma-turn.js';
const {createGame,update,terrainHeight}=engine;
const step=(g,input={},seconds=1)=>{for(let i=0;i<Math.ceil(seconds*60);i++)update(g,input,1/60);};
function quiet(){const g=createGame();g.schedule=[];g.obstacles=[];g.platforms=[];return g;}
function enemy(g,id=1,x=600,type='turret'){return{id,type,x,y:type==='drone'?terrainHeight(x)-140:terrainHeight(x),origin:x,hp:100,maxHp:100,cooldown:99,phase:0};}

test('arm fire keeps the original rapid cadence and aims at the weighted forward target',()=>{
  const g=quiet();g.enemies=[enemy(g,1,600),enemy(g,2,900,'drone')];
  update(g,{fire:true},1/60);
  const shot=g.projectiles.find(s=>s.team==='player');
  assert.equal(shot.kind,'bullet');assert.equal(g.player.muzzle,.07);
  assert.ok(Math.abs(Math.hypot(shot.vx,shot.vy)-1025)<.001);
  assert.ok(shot.vx>0&&Math.abs(shot.vy)<100,'near ground target wins the original weighted aim');
  step(g,{fire:true},.31);assert.equal(g.stats.shots,4);
});
test('MIRV launches up from the central cannon then fans into exactly five falling grenades',()=>{
  const g=quiet();update(g,{missile:true},1/60);step(g,{},.24);
  assert.equal(g.projectiles.filter(s=>s.kind==='mirv').length,1);
  const parent=g.projectiles.find(s=>s.kind==='mirv');assert.ok(parent.vx>0&&parent.vy<0);
  step(g,{},.71);
  assert.equal(g.projectiles.filter(s=>s.kind==='mirv').length,0);
  const grenades=g.projectiles.filter(s=>s.kind==='grenade');assert.equal(grenades.length,5);
  assert.equal(new Set(grenades.map(s=>s.vx)).size,5);assert.ok(grenades.every(s=>s.vy>0));
  assert.ok(grenades.some(s=>s.vx<0)&&grenades.some(s=>s.vx>0));
  step(g,{},2);assert.ok(g.events.filter(e=>e.type==='explosion').length>=5);
  assert.equal(g.projectiles.filter(s=>s.kind==='grenade').length,0);
});
test('MIRV carriers deploy all five grenades when nearby turrets or moving drones cross their ascent',()=>{
  for(const type of ['turret','drone'])for(const ahead of [70,90,110]){
    const g=quiet();g.player.melee.cooldown=1;g.enemies=[enemy(g,1,g.player.x+ahead,type)];
    update(g,{missile:true},1/60);step(g,{},57/60);
    assert.equal(g.projectiles.filter(s=>s.kind==='grenade').length,5,`${type} ${ahead} ahead must not detonate the carrier`);
    assert.equal(g.enemies[0].hp,100,'only deployed grenades can deal MIRV damage');
    assert.equal(g.events.filter(e=>e.type==='explosion').length,0);
    assert.equal(g.events.filter(e=>e.type==='cluster').length,1);
  }
});
test('MIRV grenades explode on their actual raised surface or terrain after a ledge edge',()=>{
  const g=createGame();g.schedule=[];g.obstacles=[];g.player.x=1300;g.player.y=terrainHeight(1300);
  update(g,{missile:true},1/60);step(g,{},57/60);
  assert.equal(g.projectiles.filter(s=>s.kind==='grenade').length,5);
  assert.equal(g.events.filter(e=>e.type==='explosion').length,0);
  step(g,{},1.5);
  const blasts=g.events.filter(e=>e.type==='explosion');assert.equal(blasts.length,5);
  const upper=g.platforms.find(p=>p.id==='ledge-0');
  assert.ok(blasts.filter(blast=>blast.x>=upper.x1&&blast.x<=upper.x2).length>=3,'carrier clears the real raised route');
  for(const blast of blasts){
    const floor=blast.x>=upper.x1&&blast.x<=upper.x2?engine.surfaceHeight(upper,blast.x):terrainHeight(blast.x)-3;
    assert.ok(Math.abs(blast.y-floor)<.1,'grenades detonate on the first real supporting surface');
  }
});
test('MIRV terrain blasts damage a nearby living enemy and destroy solid cover',()=>{
  const g=quiet(),x=600,y=terrainHeight(x);
  g.enemies=[enemy(g,1,x+45)];g.obstacles=[{id:'cover',x:x-35,y,w:65,h:60,hp:8,maxHp:8,type:'rock'}];
  g.projectiles=[{kind:'grenade',team:'player',x,y:y-80,vx:0,vy:450,age:0,life:3,radius:5,damage:9,splash:148,trail:[]}];
  step(g,{},.3);
  assert.equal(g.obstacles[0].hp,0);assert.ok(g.enemies[0].hp<100);assert.ok(g.events.some(e=>e.type==='explosion'));
});
test('MIRV preparation, guided salvo and primary reload have independent clocks',()=>{
  const g=quiet();g.enemies=[enemy(g,1,1000)];update(g,{fire:true,missile:true,homing:true},1/60);
  assert.equal(g.stats.shots,1);assert.equal(g.stats.mirvs,0);assert.equal(g.player.mirvPending,true);assert.equal(g.stats.homingSalvos,1);
  assert.equal(g.projectiles.filter(s=>s.kind==='homing').length,3);
  assert.equal(g.player.mirvIn,0);assert.equal(g.player.homingIn,9.5);
  step(g,{fire:true,missile:true,homing:true},5.8);
  assert.equal(g.stats.mirvs,2);assert.equal(g.stats.homingSalvos,1);assert.ok(g.stats.shots>40);
});
test('a guided salvo distributes real enemy targets and excludes crates',()=>{
  const g=quiet();g.enemies=[enemy(g,1,550),enemy(g,2,650,'drone'),enemy(g,3,750),enemy(g,4,350,'crate')];
  update(g,{homing:true},1/60);
  const missiles=g.projectiles.filter(s=>s.kind==='homing');assert.equal(missiles.length,3);
  assert.deepEqual(new Set(missiles.map(s=>s.targetId)),new Set([1,2,3]));
});
test('guided missiles curve toward a moving target and reacquire a living enemy when it dies',()=>{
  const g=quiet();g.enemies=[enemy(g,1,850,'drone'),enemy(g,2,1150,'drone')];update(g,{homing:true},1/60);
  const missile=g.projectiles.find(s=>s.kind==='homing'&&s.targetId===1);assert.ok(missile);
  step(g,{},.25);const before={x:missile.x,y:missile.y,angle:Math.atan2(missile.vy,missile.vx)};
  g.enemies[0].x=950;g.enemies[0].origin=950;g.enemies[0].phase=2;
  update(g,{},1/60);
  assert.ok(Math.hypot(missile.x-before.x,missile.y-before.y)<15,'guidance moves continuously');
  assert.notEqual(Math.atan2(missile.vy,missile.vx),before.angle);
  g.enemies[0].hp=0;update(g,{},1/60);assert.equal(missile.targetId,2);
  step(g,{},5);assert.ok(g.enemies[0].hp<100,'salvo reaches a real moving enemy');
  assert.ok(g.projectiles.every(s=>[s.x,s.y,s.vx,s.vy].every(Number.isFinite)));
});
test('a guided shot with no enemy leaves the recharge ready and reports no target once per press',()=>{
  const g=quiet();g.enemies=[enemy(g,1,500,'crate')];step(g,{homing:true},.4);
  assert.equal(g.player.homingIn,0);assert.equal(g.stats.homingSalvos,0);assert.equal(g.projectiles.length,0);
  assert.equal(g.events.filter(e=>e.type==='no-target').length,1);
  update(g,{},1/60);update(g,{homing:true},1/60);assert.equal(g.events.filter(e=>e.type==='no-target').length,2);
});
test('guided missiles navigate solid cover and expire safely after target loss',()=>{
  const g=quiet();g.enemies=[enemy(g,1,800)];
  g.obstacles=[{id:'wall',type:'rock',x:600,y:terrainHeight(600),w:70,h:180,hp:100,maxHp:100}];
  update(g,{homing:true},1/60);step(g,{},5);
  assert.ok(g.enemies[0].hp<100,'at least one missile finds the open route around the wall');
  const lost=quiet();lost.enemies=[enemy(lost,1,850)];update(lost,{homing:true},1/60);lost.enemies=[];step(lost,{},9);
  assert.equal(lost.projectiles.length,0);
});
test('crouching slows movement to the original 100 and lets high shots pass over the reduced hitbox',()=>{
  const standing=quiet(),crouched=quiet();
  step(standing,{right:true},.5);step(crouched,{right:true,crouch:true},.5);
  assert.equal(standing.player.vx,230);assert.equal(crouched.player.vx,100);
  assert.ok(crouched.player.h<standing.player.h*.6);
  for(const g of [standing,crouched])g.projectiles=[{x:g.player.x-100,y:g.player.y-52,vx:12000,vy:0,team:'enemy',damage:8,life:1,radius:2}];
  update(standing,{},1/60);update(crouched,{crouch:true},1/60);
  assert.equal(standing.player.hp,92);assert.equal(crouched.player.hp,100);
});
test('ESQUIVE locks weapons and requires releasing before reuse without depth immunity',()=>{
  const g=quiet();g.enemies=[enemy(g,1,850)];
  g.projectiles=[{kind:'plasma',x:g.player.x-100,y:g.player.y-30,vx:12000,vy:0,team:'enemy',damage:8,life:1,radius:2}];
  update(g,{shift:true,fire:true,missile:true,homing:true},1/60);
  assert.ok(g.player.evasion.active);assert.equal(g.player.hp,100,'held rear protects immediately');assert.equal(g.stats.shots,0);
  assert.equal(g.stats.mirvs,0);assert.equal(g.stats.homingSalvos,0);
  step(g,{shift:true},3.8);assert.equal(g.player.evasion.active,true);assert.equal(g.player.evasion.cooldown,0);
  assert.equal(g.events.filter(e=>e.type==='shift').length,1);
  update(g,{},1/60);update(g,{shift:true},1/60);assert.equal(g.events.filter(e=>e.type==='shift').length,2);
});
test('jump is immediate, works from crouch, and never auto-repeats while held',()=>{
  const g=quiet();update(g,{crouch:true},1/60);update(g,{jump:true,crouch:true},1/60);
  assert.equal(g.player.onGround,false);assert.ok(g.player.vy<0);assert.equal(g.player.crouching,false);
  step(g,{jump:true},3);assert.equal(g.events.filter(e=>e.type==='jump').length,1);assert.ok(g.player.onGround);
});
test('invalid time deltas cannot corrupt weapon guidance or player positions',()=>{
  const g=quiet();g.enemies=[enemy(g,1,700)];update(g,{homing:true},1/60);
  for(const dt of [NaN,Infinity,-1])update(g,{right:true,homing:true},dt);
  assert.ok([g.time,g.player.x,g.player.y,...g.projectiles.flatMap(s=>[s.x,s.y,s.vx,s.vy])].every(Number.isFinite));
});

test('movement reverses immediately but all weapons wait for the real body turn and retain a released tap',()=>{
  const g=quiet();g.enemies=[enemy(g,1,850)];const x=g.player.x;
  update(g,{left:true,fire:true,missile:true,homing:true},1/60);
  assert.ok(g.player.x<x);assert.equal(g.player.dir,-1);assert.equal(g.player.vx,-230);
  assert.equal(g.player.turn.active,true);assert.equal(g.stats.shots,0);assert.equal(g.stats.mirvs,0);assert.equal(g.stats.homingSalvos,0);
  for(let frame=1;frame<Math.round(TURN_DURATION*60)-1;frame++){
    update(g,{},1/60);assert.equal(g.player.turn.active,true);
    assert.equal(g.stats.shots,0);assert.equal(g.stats.mirvs,0);assert.equal(g.stats.homingSalvos,0);
  }
  update(g,{},1/60);assert.equal(g.player.turn.active,false);
  assert.equal(g.stats.shots,1);assert.equal(g.stats.mirvs,0);assert.equal(g.player.mirvPending,true);assert.equal(g.stats.homingSalvos,1);
  step(g,{},.3);assert.equal(g.stats.shots,1);assert.equal(g.stats.mirvs,1);assert.equal(g.stats.homingSalvos,1);
});

test('retargeting during a turn holds the queued shot until the actual final facing is ready',()=>{
  const g=quiet();update(g,{left:true,fire:true},1/60);step(g,{left:true},.10);
  const yaw=g.player.turn.yaw;update(g,{right:true},1/60);
  assert.ok(g.player.turn.yaw<yaw&&g.player.turn.yaw>0);assert.equal(g.stats.shots,0);
  step(g,{right:true},.2);assert.equal(g.player.turn.active,false);assert.equal(g.player.dir,1);assert.equal(g.stats.shots,1);
  step(g,{},.3);assert.equal(g.stats.shots,1);
});

test('clearing input discards delayed shots and evasion cannot interrupt a genuine body turn',()=>{
  assert.equal(typeof engine.clearPlayerWeaponQueue,'function');
  const g=quiet();g.enemies=[enemy(g,1,850)];update(g,{left:true,fire:true,missile:true,homing:true},1/60);
  update(g,{shift:true},1/60);assert.equal(g.player.evasion.active,false,'turn has priority');
  engine.clearPlayerWeaponQueue(g.player);g.status='paused';update(g,{},.2);g.status='playing';
  step(g,{},1.5);assert.equal(g.stats.shots,0);assert.equal(g.stats.mirvs,0);assert.equal(g.stats.homingSalvos,0);
  update(g,{fire:true},1/60);assert.equal(g.stats.shots,1);
});

test('held fire resumes its original cadence after a turn without duplicating the queued first shot',()=>{
  const g=quiet();step(g,{left:true,fire:true},TURN_DURATION+.30);
  assert.equal(g.player.turn.active,false);assert.equal(g.stats.shots,4);
});

test('a queued guided request with no target is consumed once without spending recharge',()=>{
  const g=quiet();update(g,{left:true,homing:true},1/60);step(g,{},TURN_DURATION+.30);
  assert.equal(g.player.homingIn,0);assert.equal(g.stats.homingSalvos,0);
  assert.equal(g.events.filter(e=>e.type==='no-target').length,1);
  g.enemies=[enemy(g,1,850)];step(g,{},.2);assert.equal(g.stats.homingSalvos,0);
});

test('body scaling does not alter the original effective MIRV and grenade ballistics',()=>{
  const g=quiet();update(g,{missile:true},1/60);step(g,{},.24);const carrier=g.projectiles.find(s=>s.kind==='mirv');
  const a=g.player.tilt,vx=carrier.vx,vy=carrier.vy-125*carrier.age;
  assert.ok(Math.abs(vx*Math.cos(a)+vy*Math.sin(a)-325)<1e-9);
  assert.ok(Math.abs(-vx*Math.sin(a)+vy*Math.cos(a)+600)<1e-9);assert.equal(carrier.splash,147.5);
  step(g,{},.71);const grenades=g.projectiles.filter(s=>s.kind==='grenade');
  assert.equal(grenades.length,5);assert.deepEqual(grenades.map(s=>s.vx),[-81.25,43.75,168.75,293.75,418.75]);
});

test('all three ground classes appear without adding encounters and hostile fire leaves the drawn rifle mouth',()=>{
  const scheduled=createGame().schedule.filter(e=>e.type!=='battery');
  assert.equal(scheduled.length,40);assert.equal(scheduled.filter(e=>e.type==='saltik').length,3);
  for(const type of ['walker','soldier','turret'])assert.ok(scheduled.some(e=>e.type===type));
  for(const type of ['walker','soldier','turret']){
    const g=quiet();g.enemies=[{...enemy(g,1,600,type),cooldown:0}];update(g,{},1/60);
    const e=g.enemies[0],mount=enemyGeometry(e,g.time).muzzle,shot=g.projectiles.find(s=>s.team==='enemy');
    assert.ok(e.firePose>0);assert.equal(shot.launchX,mount.x);assert.equal(shot.launchY,mount.y);
    assert.equal(e.y,terrainHeight(e.x));
  }
});

test('ESQUIVE engine support remains grounded through action and recovery on every tier and an obstacle top',()=>{
  for(const tier of [0,1,2,'obstacle']){
    const g=createGame();g.schedule=[];g.obstacles=[];const p=g.player;
    if(tier==='obstacle'){
      g.platforms=[];const o={id:'top',type:'rock',x:800,y:terrainHeight(800),w:86,h:60,hp:10,maxHp:10};
      g.obstacles=[o];p.x=o.x;p.y=o.y-o.h;p.obstacleId=o.id;
    }else if(tier){
      const route=g.platforms.find(a=>a.tier===tier);p.x=route.x1+300;p.platformId=route.id;p.tier=tier;p.y=engine.surfaceHeight(route,p.x);
    }
    p.supportY=p.y;const support=p.y;let previous=p.y,sawEvasion=false;
    for(let frame=0;frame<75;frame++){
      update(g,{shift:frame===0},1/60);const at=projectPlayer(p),floor=projectDepthPoint(p.x,support,p.depth);
      assert.equal(p.onGround,true);assert.equal(p.supportY,support);assert.equal(at.y,floor.y);assert.equal(at.y,at.groundY);assert.equal(at.scale,1);
      assert.ok(Math.abs(at.y-previous)<6,'crossing the terrace cannot teleport through terrain');previous=at.y;sawEvasion||=p.evasion.active;
    }
    assert.equal(sawEvasion,true);assert.equal(p.depth,undefined);assert.equal(projectPlayer(p).y,support);
  }
});

test('an airborne ESQUIVE keeps precisely the same physical jump arc',()=>{
  const front=quiet(),rear=quiet();
  for(let frame=0;frame<50;frame++){
    update(front,{jump:frame===0},1/60);update(rear,{jump:frame===0,shift:frame===8},1/60);
    assert.equal(rear.player.y,front.player.y);assert.equal(rear.player.vy,front.player.vy);
    const p=rear.player,at=projectPlayer(p);
    assert.ok(Math.abs((at.groundY-at.y)-(p.supportY-p.y))<1e-9);assert.equal(at.scale,1);
  }
});
