import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update} from '../src/engine.js';
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
import {inkSaltikGeometry} from '../src/ink-saltik.js';

const characters=['striker','gatling','bt'];
function quiet(level=5,character='striker',x=1000){
 const g=createInkScene({level,character});
 Object.assign(g,{schedule:[],enemies:[],pickups:[],platforms:[],obstacles:[],disableBoss:true});
 const y=g.groundAt?.(x)??600;
 Object.assign(g.player,{x,y,supportY:y,invulnerable:0});g.maxX=x;
 update(g,{},1/60);
 return g;
}
function visibleGun(g){
 const q=inkSaltikGeometry(g.player,{time:g.time});
 if(q.modern)return q.modernGuns[0].point(q.modernGuns[0].pivot);
 if(q.gatlingGuns)return q.gatlingGuns[0].point(q.gatlingGuns[0].pivot);
 return q.btNative.podSlots[0].muzzle;
}
function incoming(g,point=visibleGun(g),extra={}){
 const shot={id:g.nextProjectileId++,kind:'plasma',team:'enemy',...point,vx:0,vy:0,radius:2,damage:8,life:1,...extra};
 g.projectiles=[shot];return shot;
}

for(const character of characters)for(const level of [1,2,3,4,5])test(`level ${level} ${character}: enemy rounds hit the visible native upper gun`,()=>{
 const g=quiet(level,character),armor=g.player.maxHp,point=visibleGun(g);
 assert(point.y<g.player.y-58,'reproduces the visible area above the old V1 hitbox');
 incoming(g,point);update(g,{},1/60);
 assert.equal(g.player.hp,armor-8);assert.equal(g.projectiles.length,0);
 assert(g.player.invulnerable>1.3);assert.equal(g.events.filter(e=>e.type==='damage').length,1);
});

for(const character of characters)test(`Red Wastes ${character}: visible hits follow dune slopes, facing, crouch and airborne poses`,()=>{
 for(const [x,dir,crouching,airborne] of [[1000,1,false,false],[3100,-1,true,false],[15000,1,false,true]]){
  const g=quiet(5,character,x),p=g.player;
  Object.assign(p,{dir,crouching});if(airborne)Object.assign(p,{y:p.y-100,vy:0,onGround:false});
  incoming(g);updateInkScene(g,{crouch:crouching},1/60);
  assert.equal(p.hp,92,`${character} x=${x}, crouch=${crouching}, airborne=${airborne}`);
 }
});

for(const character of characters)test(`${character}: a swept fast round hits while the player moves`,()=>{
 const g=quiet(5,character),point=visibleGun(g);incoming(g,{x:point.x+160,y:point.y},{vx:-18000});
 updateInkScene(g,{right:true},1/60);
 assert(g.player.vx>0);assert.equal(g.player.hp,92);assert.equal(g.projectiles.length,0);
});

test('native visible collision keeps armor invulnerability and held rear evasion',()=>{
 for(const character of characters){
  const g=quiet(5,character),p=g.player;
  incoming(g);update(g,{},1/60);assert.equal(p.hp,92);
  incoming(g);update(g,{},1/60);assert.equal(p.hp,92,'the 1.4-second armor window still blocks repeat damage');
  p.invulnerable=0;incoming(g);update(g,{shift:true},1/60);assert.equal(p.hp,92,'held rear stance remains protected');
  incoming(g);update(g,{},1/60);assert.equal(p.hp,84,'release restores visible collision immediately');
 }
});

test('native visible body receives enemy splash without enlarging explosions',()=>{
 const g=quiet(),point=visibleGun(g);incoming(g,{x:point.x,y:point.y-4},{kind:'enemy-missile',splash:12,life:.001,locking:false});
 update(g,{},1/60);assert.equal(g.player.hp,92);
});

test('rounds outside the native visual bounds keep flying',()=>{
 for(const character of characters){
  const g=quiet(5,character),q=inkSaltikGeometry(g.player,{time:g.time});
  incoming(g,{x:q.bounds.x+q.bounds.w/2,y:q.bounds.y-20});update(g,{},1/60);
  assert.equal(g.player.hp,100);assert.equal(g.projectiles.length,1);
 }
});

test('legacy games retain their original compact collision box',()=>{
 const g=createGame();Object.assign(g,{schedule:[],enemies:[],pickups:[],platforms:[],obstacles:[]});
 incoming(g,{x:g.player.x,y:g.player.y-90});update(g,{},1/60);assert.equal(g.player.hp,100);
 incoming(g,{x:g.player.x,y:g.player.y-35});update(g,{},1/60);assert.equal(g.player.hp,92);
});

test('shots through the clear space beside raised native weapons do not damage the player',()=>{
 for(const character of characters){
  const g=quiet(5,character),q=inkSaltikGeometry(g.player,{time:g.time});
  const point=character==='bt'?q.btNative.sourcePoint([521,90]):q.nativePoint(character==='gatling'?[60,70]:[180,100]);
  assert(point.x>q.bounds.x&&point.x<q.bounds.x+q.bounds.w&&point.y>q.bounds.y&&point.y<q.bounds.y+q.bounds.h);
  incoming(g,point);update(g,{},1/60);
  assert.equal(g.player.hp,100,`${character}: transparent atlas gaps are not a hitbox`);
  assert.equal(g.projectiles.length,1);
 }
});

import {nativeTurnView} from '../src/character-turns.js';
function turnPoint(p,[x,y]){
 const v=nativeTurnView(p),k=v.targetHeight/v.height*(p.artScale??1),angle=p.supportPose?.tilt??0;
 const xx=(x-v.anchor[0])*k,yy=(y-v.anchor[1])*k;
 return{x:p.x+xx*Math.cos(angle)-yy*Math.sin(angle),y:p.y+xx*Math.sin(angle)+yy*Math.cos(angle)};
}
const paintedTurnSamples=[
 ['striker',1,[152,224],[164,224],[440,224]],
 ['gatling',1,[416,224],[68,620],[212,224]],
 ['bt',1,[356,224],[68,632],[464,644]],
 ['bt',5,[116,656],[80,656],[116,656]],
];
for(const [character,level,...points]of paintedTurnSamples)test(`${character} level ${level}: painted quarter/front/rear turn pixels receive damage`,()=>{
 for(const [index,point]of points.entries()){
  const g=quiet(level,character);g.groundAt=()=>600;
  Object.assign(g.player,{x:1000,y:600,supportY:600,supportPose:null,tilt:0,turn:{active:true,yaw:(index+1)*Math.PI/4}});
  incoming(g,turnPoint(g.player,point));update(g,{},.000001);
  assert.equal(g.player.hp,92,`${character} turn frame ${index}: painted native pixel ${point}`);
 }
});
test('desert Striker receives hits on all eight painted turn views',()=>{
 const samples=[[248,404],[236,404],[296,404],[188,404],[152,404],[116,404],[92,404],[116,404]];
 for(const [index,point]of samples.entries()){
  const g=quiet(5,'striker');g.player.strikerVariant='desert';g.player.cosmeticSkin='military';g.groundAt=()=>600;
  Object.assign(g.player,{x:1000,y:600,supportY:600,supportPose:null,tilt:0,dir:index===0?-1:1,turn:{active:true,yaw:index*Math.PI/4}});
  incoming(g,turnPoint(g.player,point));update(g,{},.000001);
  assert.equal(g.player.hp,92,`desert Striker turn frame ${index}: painted native wheel`);
 }
});

test('native turn collision follows scaled crouching wheels without filling the weapon gaps',()=>{
 for(const [character,level,wheel,gap]of [
  ['striker',1,[512,668],[20,20]],['gatling',1,[68,620],[20,20]],
  ['bt',1,[68,632],[360,70]],['bt',5,[80,656],[360,70]],
 ]){
  for(const [source,expected]of [[wheel,92],[gap,100]]){
   const g=quiet(level,character);g.groundAt=()=>600;
   Object.assign(g.player,{x:1000,y:600,supportY:600,supportPose:null,tilt:0,artScale:.65,crouching:true,turn:{active:true,yaw:Math.PI/2}});
   incoming(g,turnPoint(g.player,source));update(g,{crouch:true},.000001);
   assert.equal(g.player.hp,expected,`${character} level${level} scaled crouching turn at ${source}`);
  }
 }
});
