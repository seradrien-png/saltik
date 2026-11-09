import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene,updateInkScene,inkWeaponGeometry,INK_SCENE_END} from '../src/ink-scene.js';
import {terrainHeight,terrainAt,supportHeight,surfaceHeight,routeThickness} from '../src/world.js';
import {createGame,navigationContext} from '../src/engine.js';
import {inkGroundHeight,INK_BRIDGE,INK_OBSERVATORY} from '../src/ink-demo-layout.js';
test('Ink restores the entire V1 campaign including Saltik enemies and the final boss',()=>{
 const g=createInkScene();assert.equal(g.player.hp,100);assert.ok(g.platforms.length>=7);
 assert.ok(g.schedule.some(e=>e.type==='saltik'));assert.ok(g.schedule.some(e=>e.x>15000));
 assert.equal(g.missileCompanion,undefined);assert.equal(INK_SCENE_END,17800);
 updateInkScene(g,{fire:true,homing:true,missile:true},1/60);assert.ok(g.stats.shots>0);assert.ok(g.player.mirvPending);
});
test('passing the former demo exit continues the campaign; pause remains frozen and the boss still activates',()=>{
 const g=createInkScene();g.player.x=5151;g.player.y=g.groundAt(5151);g.player.supportY=g.player.y;
 g.status='paused';const time=g.time;updateInkScene(g,{},1/60);assert.equal(g.status,'paused');assert.equal(g.time,time);
 g.status='playing';updateInkScene(g,{},1/60);assert.equal(g.status,'playing');assert.equal(g.boss,null);
 g.player.x=16500;g.player.y=g.groundAt(16500);g.player.supportY=g.player.y;updateInkScene(g,{},1/60);
 assert.ok(g.boss);assert.ok(g.boss.hp>0);assert.equal(g.status,'playing');
});
test('primary shots start at the new ink barrel instead of the former V1 sprite mount',()=>{
 const g=createInkScene();updateInkScene(g,{fire:true},1/60);const shot=g.projectiles.find(s=>s.kind==='bullet');
 const pose=inkWeaponGeometry(g.player,g.time);assert.ok(shot);assert.ok(Math.abs(shot.launchX-pose.arm.x)<.2);assert.ok(Math.abs(shot.launchY-pose.arm.y)<.2);
});

test('the illustrated bridge is reachable by a normal jump and opens above a real lower ravine',()=>{
 const g=createInkScene(),p=g.player;g.schedule=[];g.obstacles=[];
 p.x=330;p.y=g.groundAt(p.x);p.supportY=p.y;
 for(let i=0;i<65;i++)updateInkScene(g,{right:true,jump:i===0},1/60);
 assert.equal(p.platformId,'ledge-0');assert.ok(p.onGround);
 assert.ok(Math.abs(p.y-surfaceHeight(g.platforms[0],p.x))<.001);
 assert.ok(inkGroundHeight(1280)>terrainHeight(1280)+145,'the void is a physical valley, not a painted hole');
 assert.equal(g.platforms[0].x1,INK_BRIDGE.x);assert.equal(g.platforms[1].x2,INK_OBSERVATORY.x+INK_OBSERVATORY.w);
});

test('ground walkers, suspension and guided trajectories use the same demo valley, independently of V1',()=>{
 const g=createInkScene(),p=g.player;g.schedule=[];g.obstacles=[];
 p.x=1280;p.y=terrainHeight(p.x);p.onGround=true;p.platformId=null;p.tier=0;
 g.enemies=[{id:91,type:'walker',x:1250,y:0,hp:5,maxHp:5,cooldown:100,phase:0,tier:0}];
 updateInkScene(g,{},1/60);
 assert.equal(p.y,inkGroundHeight(p.x));
 assert.equal(g.enemies[0].y,inkGroundHeight(g.enemies[0].x));
 assert.equal(supportHeight(g,p,1280),inkGroundHeight(1280));
 assert.equal(navigationContext(g).groundAt(1280),inkGroundHeight(1280));
 const v1=createGame();assert.equal(terrainAt(v1,1280),terrainHeight(1280));
 assert.equal(navigationContext(v1).groundAt(1280),terrainHeight(1280));
 for(const item of g.pickups){const route=g.platforms.find(p=>p.id===item.platformId);
  assert.equal(item.y,(route?surfaceHeight(route,item.x):inkGroundHeight(item.x))-30);
 }
});

test('both native landmarks keep a complete standing lower corridor, including their exits',()=>{
 const g=createInkScene();
 for(const p of g.platforms)for(let x=p.x1;x<=p.x2;x+=2){
  const clear=inkGroundHeight(x)-surfaceHeight(p,x)-routeThickness(p,x);
  assert.ok(clear>=(p.id==='checkpoint-turn'?112:143.99),`${p.id} at ${x}: ${clear}`);
 }
 for(const p of g.platforms)for(const edge of [p.x1,p.x2])
  assert.ok(Math.abs(inkGroundHeight(edge-.01)-inkGroundHeight(edge+.01))<.03,'no step at the native cutout boundary');
});
