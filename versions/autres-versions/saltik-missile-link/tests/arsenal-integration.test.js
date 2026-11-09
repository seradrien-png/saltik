import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,terrainHeight} from '../src/engine.js';
import {createInput} from '../src/input.js';
const step=(g,input={},frames=1)=>{for(let i=0;i<frames;i++)update(g,input,1/60);};
function quiet(){const g=createGame();g.schedule=[];g.obstacles=[];g.platforms=[];g.pickups=[];return g;}
const enemy=(g,id,x)=>({id,type:'turret',x,y:terrainHeight(x),hp:60,maxHp:60,cooldown:99,phase:0});

test('primary reload spends exactly three seconds of actual trigger time and freezes during pause',()=>{
  const g=quiet(),p=g.player;step(g,{fire:true},120);step(g,{},120);assert.ok(Math.abs(p.fireSpent-2)<1e-9);
  g.status='paused';step(g,{fire:true},60);assert.ok(Math.abs(p.fireSpent-2)<1e-9);g.status='playing';
  step(g,{fire:true},60);assert.equal(p.fireSpent,3);assert.ok(Math.abs(p.reloadIn-1.32)<1e-9);
  assert.equal(g.events.filter(e=>e.type==='reload-start').length,1);const shots=g.stats.shots;
  step(g,{},79);assert.equal(g.stats.shots,shots);assert.ok(p.reloadIn>0);step(g,{},1);
  assert.equal(p.reloadIn,0);assert.equal(p.fireSpent,0);assert.equal(g.events.filter(e=>e.type==='reload-end').length,1);
});
test('turns and evasion do not consume primary firing time and released reload taps cannot queue',()=>{
  const g=quiet(),p=g.player;step(g,{left:true,fire:true},20);assert.equal(p.fireSpent,0);p.weaponQueue.fire=false;
  step(g,{},30);step(g,{shift:true,fire:true});assert.equal(p.fireSpent,0);
  step(g,{},100);p.reloadIn=.3;p.fireSpent=3;step(g,{left:true,fire:true});step(g,{},60);
  assert.equal(p.weaponQueue.fire,false);assert.equal(g.stats.shots,0);
});
test('primary threshold restricts a crossing step to its eligible firing subinterval',()=>{
  const g=quiet(),p=g.player;p.fireSpent=2.995;p.fireIn=.012;update(g,{fire:true},1/60);
  assert.equal(g.stats.shots,0);assert.equal(p.fireSpent,3);assert.equal(p.reloadIn,1.32);
});
test('MIRV elevates for .24 seconds before its first launch and turn cancels preparation without charge',()=>{
  const g=quiet(),p=g.player;step(g,{missile:true});assert.equal(g.stats.mirvs,0);assert.equal(p.mirvPending,true);assert.ok(p.cannonElevation>0);
  step(g,{},13);assert.equal(g.stats.mirvs,0);step(g,{},1);assert.equal(g.stats.mirvs,1);assert.ok(p.cannonElevation>1);
  const other=quiet();step(other,{missile:true},6);step(other,{left:true});assert.equal(other.stats.mirvs,0);assert.equal(other.player.mirvIn,0);assert.equal(other.player.mirvPending,false);
  step(other,{},60);assert.equal(other.stats.mirvs,0);assert.equal(other.player.cannonElevation,0);
});
test('held rear keeps physical feet unchanged and protects immediately until release',()=>{
  const a=quiet(),b=quiet(),y=a.player.y;step(a,{shift:true});step(b,{shift:true});
  assert.equal(a.player.evasion.active,true);assert.equal(a.player.evasion.kind,b.player.evasion.kind);assert.equal(a.player.y,y);
  assert.equal(a.player.depth,undefined);assert.equal(a.player.shiftIn,undefined);
  a.player.melee.cooldown=99;a.enemies=[enemy(a,1,a.player.x+20)];step(a,{shift:true});assert.equal(a.player.hp,100);
  step(a,{});assert.equal(a.player.hp,90);
});
test('held rear ends when jumping, dropping or walking off its support',()=>{
  for(const kind of ['tilt'])for(const action of [{jump:true},{drop:true},{right:true}]){
    const g=quiet(),p=g.player;g.platforms=[{id:'edge',tier:1,x1:600,x2:900,profile:[138,138],seed:1}];
    Object.assign(p,{x:899,y:terrainHeight(899)-138,supportY:terrainHeight(899)-138,platformId:'edge',tier:1});
    Object.assign(p.evasion,{kind,active:true,held:true,elapsed:.15,duration:0,cooldown:0});
    step(g,{...action,shift:true});assert.equal(p.onGround,false);assert.equal(p.evasion.active,false);
    assert.equal(p.evasion.elapsed,0);assert.equal(p.evasion.cooldown,0);
  }
});
test('airborne shift does not briefly start the grounded balance',()=>{
  const g=quiet();g.player.onGround=false;g.player.y-=100;
  step(g,{shift:true});assert.equal(g.player.evasion.active,false);
  assert.equal(g.events.some(event=>event.type==='shift'),false);
});
test('guided acquisition requires visible target bounds and default viewport follows player',()=>{
  const g=quiet();g.viewport={x:0,y:0,w:500,h:720};g.enemies=[enemy(g,1,1100)];step(g,{homing:true});assert.equal(g.stats.homingSalvos,0);
  g.viewport={x:850,y:0,w:650,h:720};step(g,{});step(g,{homing:true});assert.equal(g.stats.homingSalvos,1);
  const h=quiet();assert.deepEqual(h.viewport,{x:-180,y:0,w:1280,h:720});h.player.x=4200;h.player.y=terrainHeight(4200);step(h);assert.equal(h.viewport.x,3840);
});
test('the expedition replaces exactly three existing ground heavy encounters with green Saltiks',()=>{
  const g=createGame(),saltiks=g.schedule.filter(e=>e.type==='saltik');assert.equal(saltiks.length,3);
  assert.ok(saltiks.every(e=>!e.platformId));assert.ok(saltiks[0].x>4000);assert.ok(saltiks[2].x-saltiks[0].x>5000);
});
test('bullets intercept hostile missiles before player damage regardless of projectile array order',()=>{
  for(const reverse of [false,true]){
    const g=quiet(),p=g.player,y=p.y-35;
    const missile={kind:'enemy-missile',team:'enemy',x:p.x+44,y,vx:-310,vy:0,damage:10,hp:1,radius:6,life:2,age:.2};
    const bullet={kind:'bullet',team:'player',x:p.x+20,y,vx:1025,vy:0,damage:1,radius:3,life:1};
    g.projectiles=reverse?[bullet,missile]:[missile,bullet];update(g,{},1/30);
    assert.equal(p.hp,100);assert.equal(g.projectiles.length,0);assert.equal(g.events.filter(e=>e.type==='intercept').length,1);assert.equal(g.stats.interceptions,1);
  }
});
test('ordinary primary input leads a visible incoming locking missile before aiming at a distant body',()=>{
  const g=quiet(),p=g.player;
  g.platforms=[{id:'defense-ledge',tier:1,x1:600,x2:1200,profile:[138,138],seed:1}];
  Object.assign(p,{x:900,y:terrainHeight(900)-138,supportY:terrainHeight(900)-138,platformId:'defense-ledge',tier:1});
  g.enemies=[enemy(g,1,1450)];
  g.projectiles=[{kind:'enemy-missile',team:'enemy',x:p.x+350,y:p.y-120,vx:-245,vy:35,damage:10,hp:1,radius:6,life:5,age:.2}];
  step(g,{fire:true});assert.ok(p.aim<0,'the incoming missile is above the native coax, while the distant body is below it');
  step(g,{fire:true},90);assert.equal(g.stats.interceptions,1);assert.equal(p.hp,100);
});
test('an offscreen locking missile does not steal primary aim from a visible enemy',()=>{
  const baseline=quiet(),actual=quiet();
  for(const g of [baseline,actual]){g.viewport={x:0,y:0,w:500,h:720};g.enemies=[enemy(g,1,460)];}
  actual.projectiles=[{kind:'enemy-missile',team:'enemy',x:880,y:350,vx:-245,vy:20,damage:10,hp:1,radius:6,life:5,age:.2}];
  step(baseline,{fire:true});step(actual,{fire:true});assert.equal(actual.player.aim,baseline.player.aim);
});
test('a bullet pays its earliest collision instead of intercepting through an earlier obstacle',()=>{
  const g=quiet(),p=g.player,y=p.y-35;
  g.obstacles=[{id:'wall',type:'rock',x:p.x+80,y:p.y,w:12,h:80,hp:10}];
  g.projectiles=[{kind:'bullet',team:'player',x:p.x+50,y,vx:6000,vy:0,damage:1,radius:3,life:1},
    {kind:'enemy-missile',team:'enemy',x:p.x+150,y,vx:-310,vy:0,damage:10,hp:1,radius:6,life:2,age:.2}];
  update(g,{},1/30);assert.equal(g.events.filter(e=>e.type==='intercept').length,0);assert.equal(g.obstacles[0].hp,9);
  assert.equal(g.projectiles.filter(s=>s.kind==='enemy-missile').length,1);assert.equal(g.stats.interceptions,0);
});
test('projectile IDs are unique and monotonic across primary and enemy launch paths',()=>{
  const g=quiet();g.enemies=[enemy(g,1,600)];g.enemies[0].cooldown=0;step(g,{fire:true,missile:true});step(g,{},15);
  assert.ok(g.projectiles.length>=2);const ids=g.projectiles.map(s=>s.id);assert.equal(new Set(ids).size,ids.length);assert.ok(ids.every(Number.isInteger));
});

test('rear protection follows the held level for the entire swept projectile step',()=>{
  for(const [held,wantHP] of [[true,100],[false,92]]){
    const g=quiet(),p=g.player;step(g,{shift:true});
    g.projectiles=[{kind:'plasma',team:'enemy',x:250,y:p.y-30,vx:-6000,vy:0,damage:8,radius:2,life:1}];
    update(g,{shift:held},1/30);assert.equal(p.hp,wantHP);assert.equal(p.evasion.active,held);
  }
});
test('a manually activated palm redirects only one compatible plasma shot and leaves it physically flying next frame',()=>{
  const g=quiet(),p=g.player;step(g,{deflect:true});Object.assign(p.deflect,{elapsed:.15});
  g.projectiles=[0,1].map(i=>({kind:'plasma',team:'enemy',x:240+i,y:p.y-30,vx:-6000,vy:0,damage:8,radius:2,life:1}));
  update(g,{},1/30);assert.equal(p.hp,92);assert.equal(p.deflect.deflected,true);assert.equal(g.events.filter(e=>e.type==='deflect').length,1);
  assert.equal(g.projectiles.length,1);const redirected=g.projectiles[0],x=redirected.x;
  assert.equal(redirected.team,'player');assert.ok(redirected.vx>=500);step(g);assert.ok(redirected.x>x);
});
test('a missile that hits the hull before a later bullet crossing cannot be intercepted retroactively',()=>{
  const g=quiet(),p=g.player,y=p.y-35;
  g.projectiles=[{kind:'enemy-missile',team:'enemy',x:p.x+33,y,vx:-310,vy:0,damage:10,hp:1,radius:6,life:2,age:.2},
    {kind:'bullet',team:'player',x:p.x-20,y,vx:1025,vy:0,damage:1,radius:3,life:1}];
  update(g,{},1/30);assert.equal(p.hp,90);assert.equal(g.events.filter(e=>e.type==='intercept').length,0);assert.equal(g.stats.interceptions,0);
});
test('only the earliest bullet pays a crossing hostile missile hit',()=>{
  const g=quiet(),p=g.player,y=p.y-35;
  const farther={kind:'bullet',team:'player',x:p.x+10,y,vx:1025,vy:0,damage:1,radius:3,life:1};
  const nearer={...farther,x:p.x+25};
  g.projectiles=[farther,{kind:'enemy-missile',team:'enemy',x:p.x+44,y,vx:-310,vy:0,damage:10,hp:1,radius:6,life:2,age:.2},nearer];
  update(g,{},1/30);assert.equal(p.hp,100);assert.equal(g.projectiles.length,1);assert.equal(g.projectiles[0],farther);assert.equal(g.stats.interceptions,1);
});
test('a real blast clears a hostile missile before its later hull crossing',()=>{
  const g=quiet(),p=g.player,y=p.y-35;
  g.projectiles=[{kind:'enemy-missile',team:'enemy',x:p.x+44,y,vx:-310,vy:0,damage:10,hp:1,radius:6,life:2,age:.2},
    {kind:'grenade',team:'player',x:p.x+50,y,vx:0,vy:2000,damage:9,radius:5,splash:148,life:1}];
  update(g,{},1/30);assert.equal(p.hp,100);assert.equal(g.projectiles.filter(s=>s.team==='enemy').length,0);assert.ok(g.events.some(e=>e.type==='explosion'));assert.equal(g.stats.interceptions,1);
});
test('a projectile may collide before its lifetime expires within the same simulation step',()=>{
  const g=quiet(),p=g.player;
  g.projectiles=[{kind:'plasma',team:'enemy',x:p.x,y:p.y-30,vx:300,vy:0,damage:8,radius:2,life:.001}];
  step(g);assert.equal(p.hp,92);assert.equal(g.projectiles.length,0);
});
test('a projectile that expires before reaching the hull cannot hit later in that step',()=>{
  const g=quiet(),p=g.player;
  g.projectiles=[{kind:'plasma',team:'enemy',x:p.x-60,y:p.y-30,vx:6000,vy:0,damage:8,radius:2,life:.001}];
  step(g);assert.equal(p.hp,100);assert.equal(g.projectiles.length,0);
});
test('a guided salvo physically clears a nearby real barrier from the native pod mouths',()=>{
  const g=quiet(),p=g.player;Object.assign(p,{x:900,y:terrainHeight(900),supportY:terrainHeight(900)});p.melee.cooldown=99;
  g.obstacles=[{id:'near-barrier',type:'rock',x:1010,y:terrainHeight(1010),w:104,h:62,hp:100,maxHp:100}];
  g.enemies=[enemy(g,1,1260)];const target=g.enemies[0];
  step(g,{right:true,homing:true});assert.equal(g.stats.homingSalvos,1);
  for(let i=0;i<300;i++)step(g);
  assert.ok(target.hp<=36,`three physical guided hits expected, target hp ${target.hp}`);
  assert.equal(g.obstacles[0].hp,100,'salvo avoids the cover instead of paying damage through it');
});
test('a replacement Saltik spawns at native size and emits physical gun and locking missiles through the engine',()=>{
  const g=quiet(),entry=createGame().schedule.find(e=>e.type==='saltik');g.schedule=[entry];
  Object.assign(g.player,{x:entry.x-700,y:terrainHeight(entry.x-700),supportY:terrainHeight(entry.x-700)});g.maxX=g.player.x;
  step(g);const foe=g.enemies[0];assert.equal(foe.type,'saltik');assert.equal(foe.hp,24);assert.equal(foe.y,terrainHeight(foe.x));
  const seen=new Set(),ids=new Set();
  for(let frame=0;frame<270;frame++){
    step(g);
    for(const shot of g.projectiles){seen.add(shot.kind);ids.add(shot.id);if(shot.kind==='enemy-missile')assert.ok(Math.hypot(shot.vx,shot.vy)<=310.000001);}
  }
  assert.ok(seen.has('plasma'));assert.ok(seen.has('enemy-missile'));assert.ok(ids.size>=5);
  assert.equal(g.events.filter(e=>e.type==='enemy-missile').length,2);assert.ok(g.events.some(e=>e.type==='enemy-lock'));
});

test('a released primary tap during the last reload interval is discarded at readiness',()=>{
  const g=quiet(),input=createInput();g.player.reloadIn=.005;g.player.fireSpent=3;
  input.set('tap','fire',true);input.set('tap','fire',false);update(g,input.consume(),1/60);
  assert.equal(g.stats.shots,0);assert.equal(g.player.fireSpent,0);assert.equal(g.player.weaponQueue.fire,false);
  step(g,{},3);assert.equal(g.stats.shots,0);
});
test('a continuously held trigger resumes exactly in the remaining interval after reload',()=>{
  const g=quiet(),input=createInput();g.player.reloadIn=.005;g.player.fireSpent=3;
  input.set('held','fire',true);update(g,input.consume(),1/60);
  assert.equal(g.stats.shots,1);assert.ok(Math.abs(g.player.fireSpent-(1/60-.005))<1e-9);
});

test('a player blast counts each actual hostile missile once and excludes ordinary plasma',()=>{
  const g=quiet(),p=g.player,y=p.y-35;
  const missile={kind:'enemy-missile',team:'enemy',x:p.x+120,y,vx:-180,vy:0,damage:10,hp:1,radius:6,life:2,age:.2};
  g.projectiles=[missile,{...missile,x:p.x+140},{kind:'plasma',team:'enemy',x:p.x+150,y,vx:-180,vy:0,damage:6,radius:4,life:2},
    ...[0,1].map(i=>({kind:'grenade',team:'player',x:p.x+100+i*2,y,vx:0,vy:2000,damage:9,radius:5,splash:148,life:1}))];
  update(g,{},1/30);assert.equal(g.stats.interceptions,2);assert.equal(g.projectiles.filter(s=>s.team==='enemy').length,0);
  step(g,{},3);assert.equal(g.stats.interceptions,2);
});

test('held rear lets real projectiles pass at any hold age and locks weapons',()=>{
  for(const [shotKind,times] of [['plasma',[.6,10.5]],['enemy-missile',[.6,10.5]]])for(const elapsed of times){
    const g=quiet(),p=g.player;Object.assign(p.evasion,{kind:'tilt',active:true,held:true,elapsed,duration:0,cooldown:0});
    g.projectiles=[{kind:shotKind,team:'enemy',x:p.x+(shotKind==='plasma'?70:40),y:p.y-30,vx:shotKind==='plasma'?-6000:-310,vy:0,damage:8,radius:shotKind==='plasma'?2:6,life:1,hp:1,age:.2}];
    const feet=p.y;update(g,{shift:true,fire:true,missile:true},1/30);
    assert.equal(p.hp,100,`held at ${elapsed}s defends a physical crossing`);assert.equal(g.projectiles.length,1);assert.ok(g.projectiles[0].life>0);assert.equal(p.evasion.active,true);assert.equal(p.y,feet);
    assert.equal(g.stats.shots,0);assert.equal(g.stats.mirvs,0);assert.equal(p.mirvPending,false);
  }
});
test('released rear takes a real projectile immediately',()=>{
  for(const elapsed of [.1,10.5]){
    const g=quiet(),p=g.player;Object.assign(p.evasion,{kind:'tilt',active:true,held:true,elapsed,duration:0,cooldown:0});
    g.projectiles=[{kind:'plasma',team:'enemy',x:p.x+70,y:p.y-30,vx:-6000,vy:0,damage:8,radius:2,life:1}];
    update(g,{},1/30);assert.equal(p.hp,92,`released after ${elapsed}s is vulnerable`);
  }
});
