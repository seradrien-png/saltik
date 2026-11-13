import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update} from '../src/engine.js';
const game=(character='gatling')=>{const g=createGame({character});g.schedule=[];g.obstacles=[];g.platforms=[];g.pickups=[];g.disableBoss=true;g.groundAt=()=>600;g.player.y=600;return g;};
const advance=(g,seconds,input={fire:true},hz=60)=>{for(let i=0;i<Math.round(seconds*hz);i++)update(g,input,1/hz);};
test('Gatling fires 30 Hz across frame partitions and alternates guns',()=>{for(const hz of [30,60,120]){const g=game();advance(g,1,{fire:true},hz);assert.equal(g.player.character,'gatling');assert.equal(g.stats.shots,30);assert.ok(g.projectiles.every(s=>s.gatling&&s.damage===.55));assert.equal(g.player.gatling.gunIndex,30);}});
test('first-shot recoil and four second heat/five second cooldown boundaries',()=>{const g=game(),p=g.player,x=p.x;update(g,{fire:true},1/60);assert.ok(p.x<x);assert.equal(g.stats.shots,1);advance(g,4-1/60);assert.equal(p.gatling.cooldown,5);assert.equal(p.gatling.firing,false);assert.equal(g.stats.shots,120);advance(g,5);assert.equal(p.gatling.cooldown,0);assert.equal(g.stats.shots,120);update(g,{fire:true},1/60);assert.equal(g.stats.shots,121);});
test('fire locks immediately, release permits movement and resets streak; gravity remains physical',()=>{const g=game(),p=g.player,x=p.x;update(g,{fire:true,right:true,jump:true});assert.ok(p.x<x);assert.equal(p.onGround,true);update(g,{right:true});assert.ok(p.x>x);assert.equal(p.gatling.sustained,0);p.onGround=false;p.y=300;p.vy=0;update(g,{fire:true});assert.ok(p.vy>0);assert.ok(p.y>300);});
test('pause freezes clocks and reverse-facing recoil moves right',()=>{const g=game();g.player.dir=-1;advance(g,2);const x=g.player.x;update(g,{fire:true});assert.ok(g.player.x>x);g.status='paused';const before=structuredClone(g.player.gatling);advance(g,1);assert.deepEqual(g.player.gatling,before);});
test('eight deterministic unguided staggered rockets have forward spread and recharge',()=>{const g=game();g.weaponGeometry=p=>({arm:{x:p.x,y:p.y-100},cannon:{x:p.x,y:p.y-100},rocketMuzzles:Array.from({length:8},(_,i)=>({x:p.x,y:p.y-100-i}))});advance(g,.4,{missile:true,homing:true});assert.equal(g.stats.mirvs,1);const shots=g.projectiles;assert.equal(shots.length,8);assert.ok(shots.every(s=>s.kind==='gatling-rocket'&&s.vx>0&&s.damage===8&&s.splash===46&&!s.targetId));assert.ok(shots.every(s=>Math.abs(Math.atan2(s.vy,s.vx))<=.30&&Math.hypot(s.vx,s.vy)>=410&&Math.hypot(s.vx,s.vy)<=600));assert.equal(g.stats.homingSalvos,0);advance(g,4.8,{missile:true});assert.equal(g.stats.mirvs,1);advance(g,.1,{missile:true});assert.equal(g.stats.mirvs,2);});
test('rocket expiry splashes nearby targets',()=>{const g=game();g.enemies=[{id:1,type:'crate',x:400,y:600,hp:30}];g.projectiles=[{id:10,team:'player',kind:'gatling-rocket',x:400,y:565,vx:0,vy:0,age:0,life:.001,splash:46,damage:8}];update(g,{});assert.equal(g.enemies[0].hp,22);});
test('default Striker stays on original primary/reload behavior',()=>{const g=game('striker');advance(g,3);assert.equal(g.stats.shots,32);assert.ok(g.player.reloadIn>0);assert.equal(g.player.gatling,undefined);});

test('turn, evasion, melee and intro suppress primary and release cools residual heat',()=>{
 for(const kind of ['turn','evasion','melee','intro']){const g=game();if(kind==='turn')g.player.turn={active:true,yaw:Math.PI,targetYaw:0};if(kind==='evasion')g.player.evasion.active=true;if(kind==='melee')g.player.melee.phase='windup';if(kind==='intro')g.introDuration=2;update(g,{fire:true,shift:kind==='evasion'});assert.equal(g.stats.shots,0,kind);}
 const g=game();advance(g,1);const heat=g.player.gatling.heat;update(g,{});assert.equal(g.player.gatling.firing,false);assert.ok(g.player.gatling.heat<heat);
});
test('native muzzles alternate and a partial old Gatling snapshot initializes safely',()=>{const g=game();g.player.gatling={heat:0};g.weaponGeometry=p=>({gatlingMuzzles:[{x:p.x,y:400},{x:p.x,y:420}]});advance(g,.1);assert.deepEqual(g.projectiles.map(s=>s.launchY),[400,420,400]);});
test('rocket target and terrain impacts use splash and never steer toward enemies',()=>{
 for(const impact of ['target','terrain']){const g=game();g.enemies=[{id:1,type:'crate',x:400,y:600,hp:30}];g.projectiles=[{id:10,team:'player',kind:'gatling-rocket',x:impact==='target'?350:400,y:impact==='target'?565:590,vx:impact==='target'?600:0,vy:impact==='target'?0:600,age:0,life:2,splash:46,damage:8}];for(let i=0;i<6;i++)update(g,{});assert.equal(g.enemies[0].hp,22,impact);assert.ok(g.events.some(e=>e.type==='explosion'&&e.radius===46));}
 const a=game(),b=game();a.player.dir=-1;b.player.dir=-1;advance(a,.3,{missile:true});advance(b,.3,{missile:true});assert.deepEqual(a.projectiles,b.projectiles);assert.ok(a.projectiles.every(s=>s.vx<0));
});
test('final turn frame never combines primary fire with movement, fresh jump or drop',()=>{
 for(const action of ['move','jump','drop']){
  const g=game(),p=g.player;p.turn={active:true,yaw:.01,targetYaw:0};
  if(action==='drop'){g.platforms=[{id:'test-deck',x1:70,x2:500,y:400,tier:1}];p.platformId='test-deck';p.y=400;p.tier=1;}
  const input={fire:true,right:true,...(action==='jump'?{jump:true}:action==='drop'?{drop:true}:{})};
  update(g,input);
  assert.equal(p.turn.active,false,action);
  assert.ok(p.x>180,action);
  if(action!=='move')assert.ok(g.events.some(event=>event.type===action),action);
  assert.equal(g.stats.shots,0,action);
  assert.equal(p.gatling.firing,false,action);
  update(g,{fire:true});
  assert.equal(g.stats.shots,1,action);
 }
});
