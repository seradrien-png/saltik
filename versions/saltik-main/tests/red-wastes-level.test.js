import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene} from '../src/ink-scene.js';
import {update} from '../src/engine.js';
import {RED_WASTES_END,redWastesGroundAt,applyRedWastesLevel,advanceRedWastesObjective} from '../src/red-wastes-level.js';

function game(character='striker'){return applyRedWastesLevel(createInkScene({character}));}
function step(g,input={},frames=1){for(let i=0;i<frames;i++){const before=g.time;update(g,input,1/60);advanceRedWastesObjective(g,g.time-before);}}
function arena(character='striker',x=1000){
 const g=game(character);g.schedule=[];g.enemies=[];g.pickups=[];
 Object.assign(g.player,{x,y:g.groundAt(x),supportY:g.groundAt(x),invulnerable:999});
 return g;
}
function target(g){const x=g.player.x+470;const e={id:'native-target',type:'turret',x,y:g.groundAt(x),hp:10000,maxHp:10000,cooldown:999,phase:0,hit:0,firePose:0};g.enemies=[e];return e;}

test('Red Wastes authors a full native route with real patrols and unchanged player loadout',()=>{
 for(const character of ['striker','gatling','bt']){
  const base=createInkScene({character}),original=structuredClone(base.player);
  const g=applyRedWastesLevel(base);
  assert.equal(g.level,5);assert.equal(g.levelEnd,RED_WASTES_END+150);
  assert.equal(g.player.hp,original.hp);assert.equal(g.player.maxHp,original.maxHp);
  for(const key of ['bt','gatling','mirvIn','homingIn','fireIn','evasion','weaponQueue','weaponHeld'])assert.deepEqual(g.player[key],original[key]);
  assert.equal(g.desertCombatHooks,undefined);assert.equal(g.desert,undefined);
  assert.equal(g.schedule.filter(e=>e.type==='saltik').length,3);
  assert.equal(g.schedule.filter(e=>e.type!=='saltik').length,32);
  assert.equal(g.pickups.length,6);assert.equal(g.obstacles.length,0);
 }
 let previous=redWastesGroundAt(0);
 for(let x=1;x<=RED_WASTES_END;x++){
  const y=redWastesGroundAt(x);assert(y>=601&&y<=639);assert(Math.abs(y-previous)<.024);previous=y;
 }
});

test('native Striker traverses the patrols and normal Saltik duels in 90–120 seconds',()=>{
 const g=game();g.player.invulnerable=1000; // QA only: retain production armor and damage.
 let duelStarts=0;
 for(let i=0;i<60*120&&g.status==='playing';i++){
  g.events=[];
  step(g,{right:true,fire:true,qte:i%2===0}); // Normal QTE presses finish the existing Saltik grapples.
  duelStarts+=g.events.filter(e=>e.type==='duel-start').length;
 }
 assert.equal(g.status,'won');assert(g.time>=90&&g.time<=120,`duration ${g.time}`);
 assert(duelStarts>=2,'native grapples remain part of the route');assert(g.stats.kills>=25);
 assert.equal(g.nextSpawn,g.schedule.length);assert.equal(g.player.x,RED_WASTES_END);
 assert.equal(g.progress,1);assert.equal(g.redWastes.complete,true);
});

test('exit is actual forward travel with no arbitrary timer or rearward guard lock',()=>{
 const g=arena();g.maxX=RED_WASTES_END;advanceRedWastesObjective(g,300);
 assert.equal(g.status,'playing');
 g.player.x=RED_WASTES_END;g.enemies=[{id:1,type:'soldier',x:1000,hp:5}];
 advanceRedWastesObjective(g,1/60);assert.equal(g.status,'won');
});

test('all three characters retain canyon run, crouch, jump and evasion physics',()=>{
 for(const character of ['striker','gatling','bt']){
  const red=arena(character),canyon=createInkScene({character});
  Object.assign(canyon,{schedule:[],enemies:[],pickups:[],platforms:[],obstacles:[],groundAt:redWastesGroundAt,disableBoss:true});
  Object.assign(canyon.player,{x:red.player.x,y:red.player.y,supportY:red.player.supportY,invulnerable:999});
  for(const [input,frames] of [[{right:true},60],[{right:true,crouch:true},30],[{right:true,jump:true},1],[{right:true},90],[{shift:true},30]]){
   for(let i=0;i<frames;i++){
    step(red,input);update(canyon,input,1/60);
    for(const key of ['x','y','vx','vy','onGround','crouching','h'])assert.equal(red.player[key],canyon.player[key],`${character} ${key}`);
    assert.deepEqual(red.player.evasion,canyon.player.evasion);
   }
   if(input.right&&!input.crouch)assert.equal(red.player.vx,230);
   if(input.crouch){assert.equal(red.player.vx,100);assert(red.player.crouching);}
   if(input.jump){assert(!red.player.onGround);assert(red.player.vy<0);}
   if(input.shift)assert(red.player.evasion.active);
  }
 }
});

test('primary guns damage ordinary enemies beyond 20000 for every character',()=>{
 for(const character of ['striker','gatling','bt']){
  const g=arena(character,20500),e=target(g);step(g,{fire:true},90);
  assert(g.stats.shots>0,`${character} fires`);assert(e.hp<e.maxHp,`${character} late-route shots hit`);
 }
});

test('Striker keeps primary reload, held MIRV aim, release and guided missiles',()=>{
 const g=arena('striker',20500),e=target(g);step(g,{fire:true},181);
 assert(g.player.reloadIn>1);const count=g.stats.shots;step(g,{fire:true},50);assert.equal(g.stats.shots,count);
 step(g,{missile:true,missileHeld:true},30);assert(g.player.mirvAiming);assert(g.player.cannonElevation>0);
 step(g,{missileReleased:true,missileHeld:false});assert.equal(g.stats.mirvs,1);assert(g.player.mirvIn>4);
 step(g,{homing:true});assert.equal(g.stats.homingSalvos,1);assert(g.player.homingIn>8);
 assert(g.projectiles.some(s=>s.kind==='homing'&&s.targetId===e.id));
});

test('Gatling keeps alternating guns, native firing recoil, overheat and eight rockets',()=>{
 const g=arena('gatling',20500);target(g);const x=g.player.x;step(g,{right:true,fire:true},240);
 assert.equal(g.stats.shots,120);assert(g.player.x<x);assert(g.player.gatling.cooldown>4.9);assert.equal(g.player.gatling.heat,1);
 const count=g.stats.shots;step(g,{fire:true},120);assert.equal(g.stats.shots,count);
 step(g,{missile:true},20);assert.equal(g.player.gatling.rocketIndex,8);assert(g.player.gatling.rocketRecharge>4);
 step(g,{},181);assert.equal(g.player.gatling.cooldown,0);
});

test('BT retains three-shot cannon, held lock acquisition, guided release and panic stock',()=>{
 const g=arena('bt',20500),e=target(g);step(g,{fire:true,missile:true,missileHeld:true},45);
 assert.equal(g.stats.shots,3);assert.equal(g.player.bt.locks.length,3);
 step(g,{missileReleased:true,missileHeld:false});
 const guided=g.projectiles.filter(s=>s.btRocket&&s.targetId===e.id);assert.equal(guided.length,3);
 assert.equal(g.player.bt.loaded.filter(Boolean).length,13);
 step(g,{homing:true});assert.equal(g.player.bt.loaded.filter(Boolean).length,0);
 assert.equal(g.projectiles.filter(s=>s.btPanic).length,13);
 step(g,{},421);assert(g.player.bt.loaded.some(Boolean),'native refill delay still restores stock');
});


test('crossing the exit while firing settles the player and clears live weapon state',()=>{
 const g=arena('striker',RED_WASTES_END-1);
 step(g,{right:true,fire:true});
 assert.equal(g.status,'won');assert(g.stats.shots>0,'the exit frame really fires');
 assert.deepEqual(g.projectiles,[]);
 assert.deepEqual(g.player.weaponHeld,{fire:false,missile:false,homing:false});
 assert.deepEqual(g.player.weaponQueue,{fire:false,missile:false,homing:false});
 assert.equal(g.player.vx,0);assert.equal(g.player.vy,0);
 for(const key of ['muzzle','mirvFlash','homingFlash'])assert.equal(g.player[key],0);
 const position={x:g.player.x,y:g.player.y};step(g,{right:true,fire:true},60);
 assert.deepEqual({x:g.player.x,y:g.player.y},position);
 assert.deepEqual(g.projectiles,[]);
});

test('integrated level5 completes ordinary full-arsenal combat with normal armor in 90–120 seconds',async()=>{
 const {updateInkScene}=await import('../src/ink-scene.js');
 const g=createInkScene({level:5});
 for(let frame=0;frame<60*120&&g.status==='playing';frame++){
  const input=g.duel?{qte:g.duel.phase==='qte'&&frame%2===0}:{right:true,fire:true,fireHeld:true,missile:frame%420===0,missileHeld:frame%420<30,missileReleased:frame%420===30,homing:frame%600===0};
  updateInkScene(g,input,1/60);g.events.length=0;
 }
 assert.equal(g.status,'won');assert(g.time>=90&&g.time<=120);
 assert(g.player.hp>0&&g.player.hp<=100);assert(g.stats.kills>=25);
 assert(g.stats.mirvs>0&&g.stats.homingSalvos>0&&g.stats.shots>0);
 assert.equal(g.projectiles.length,0);assert.equal(g.redWastes.complete,true);
});
