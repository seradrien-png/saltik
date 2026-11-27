import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
import {INK_LANDMARK_ROUTES} from '../src/ink-demo-layout.js';
import {redWastesGroundAt,RED_WASTES_SITES,RED_WASTES_RELIEF} from '../src/red-wastes-layout.js';

test('original red sand reduces fine relief amplitude by forty percent',()=>{
 assert.equal(RED_WASTES_RELIEF,.6);
 // Plateau registration and all previous sites remain in the original level.
 for(const site of RED_WASTES_SITES)assert.equal(redWastesGroundAt(site.x),redWastesGroundAt(site.x+site.w));
});
test('Fossiles rouges II is an additional six-level mission with native Matin Dore paths',()=>{
 const old=createInkScene({level:5}),g=createInkScene({level:6});
 assert.equal(old.level,5);assert.equal(g.level,6);assert.equal(g.levelTitle,'Fossiles rouges II');
 assert(g.redCanyon);assert(g.platforms.length>=INK_LANDMARK_ROUTES.length+2);
 for(const route of INK_LANDMARK_ROUTES)assert.deepEqual(g.platforms.find(p=>p.id===route.id).points,route.points);
 assert(g.platforms.some(p=>p.lowerId));assert(g.obstacles.length>5);assert(g.pickups.some(p=>p.platformId));
 assert(g.schedule.some(s=>s.platformId));assert(g.schedule.some(s=>s.enemyModel==='longrange'));
 assert(g.levelEnd>=20750);assert.notDeepEqual(g.platforms,old.platforms);
});
test('new red mission preserves all arsenals and base defaults',()=>{
 for(const character of ['striker','gatling','bt']){
  const a=createInkScene({character}),b=createInkScene({character,level:6});
  for(const key of ['hp','h','artScale','strikerVariant','cosmeticSkin','btVariant'])assert.deepEqual(b.player[key],a.player[key]);
  assert.equal(b.weaponGeometry,a.weaponGeometry);assert.equal(b.playerHitboxes,a.playerHitboxes);
  const x=b.player.x;for(let i=0;i<60;i++)updateInkScene(b,{right:true},1/60);
  assert(b.player.x>x+220);assert.equal(b.player.vx,230);
 }
});

test('sixth level traversal lasts about ninety seconds with unchanged movement for all three models',()=>{
 for(const character of ['striker','gatling','bt']){
  const g=createInkScene({level:6,character});g.schedule=[];g.enemies=[];g.obstacles=[];g.pickups=[];
  for(let n=0;n<7200&&g.status==='playing';n++)updateInkScene(g,{right:true},1/60);
  assert.equal(g.status,'won',character);assert(g.time>=90&&g.time<100);assert.equal(g.redCanyon.complete,true);
 }
});
test('the new red campaign completes with its real defenders, destructible cover and Striker weapons',()=>{
 const g=createInkScene({level:6,character:'striker'});g.player.invulnerable=10000;
 for(let n=0;n<8000&&g.status==='playing';n++)updateInkScene(g,{right:true,fire:true,missile:n%150===0,missileHeld:n%150<50,homing:n%240===0},1/60);
 assert.equal(g.status,'won');assert(g.time>=90&&g.time<120);assert(g.stats.kills>25);assert(g.stats.obstacles>5);assert(g.stats.shots>0);
});

test('each new final stair has a supported landing and can be climbed and descended in both directions',async()=>{
 const {surfaceHeight}=await import('../src/world.js');
 for(const character of ['striker','gatling','bt'])for(const id of ['red-finale-west','red-finale-east','red-finale-upper-west','red-finale-upper-east']){
  const g=createInkScene({level:6,character});g.schedule=[];g.obstacles=[];g.enemies=[];g.pickups=[];
  const roof=g.platforms.find(p=>p.walkableEntries?.some(e=>e.id===id)),entry=roof.walkableEntries.find(e=>e.id===id),lower=g.platforms.find(p=>p.id===entry.lowerId),[bottom,top]=[entry.points[0],entry.points.at(-1)],dir=Math.sign(top[0]-bottom[0]),p=g.player,x=bottom[0]-dir*8;
  assert(!lower||(x>=lower.x1&&x<=lower.x2),`${id} needs a lower landing`);
  Object.assign(p,{x,y:lower?surfaceHeight(lower,x):g.groundAt(x),supportY:lower?surfaceHeight(lower,x):g.groundAt(x),platformId:lower?.id??null,tier:lower?.tier??0,turn:null,dir,onGround:true,supportPose:null});
  for(const [target,sign]of [[top[0]+dir*6,dir],[bottom[0]-dir*6,-dir]]){
   let frames=0;while((target-p.x)*sign>0&&frames++<600){updateInkScene(g,{[sign>0?'right':'left']:true,crouch:sign!==dir},1/60);assert(p.onGround,`${character} ${id} lost support`);}
   assert(frames<600,`${character} ${id} blocked`);
  }
 }
});

test('final black-and-gold Striker really fires primary, guided missiles and MIRV',async()=>{
 const {createEnemySaltik}=await import('../src/enemy-saltik.js');const {specialistGeometry}=await import('../src/enemy-specialists.js');
 const g=createInkScene({level:6}),spawn=g.schedule.find(s=>s.enemyModel==='black-gold');
 const e=createEnemySaltik(spawn,{y:345,random:0});g.armyHooks.initialize(e);g.enemies=[e];g.projectiles=[];Object.assign(g.player,{x:e.x-500,y:345,hp:100});const shots=[];
 for(let n=0;n<1200;n++){g.time=n/60;shots.push(...g.armyHooks.advance(e,{g,dt:1/60,groundAt:()=>345,geometry:specialistGeometry}).shots);}
 assert(shots.filter(s=>s.kind==='plasma').length>50);assert(shots.some(s=>s.kind==='enemy-missile'));assert(shots.some(s=>s.kind==='enemy-mirv'));
});
