import test from 'node:test';
import assert from 'node:assert/strict';
import {btGeometry} from '../src/bt-art.js';
import {inkEnemySaltikGeometry} from '../src/ink-enemy-saltik.js';
import {initializeBT} from '../src/bt-combat.js';
const player=()=>{const p={character:'bt',btVariant:'desert',x:500,y:600,hp:100,dir:1,onGround:true,artScale:1};initializeBT(p);return p;};
test('desert BT uses its own source geometry and eight independently launchable sockets',()=>{
 const p=player(),g=btGeometry(p),old=btGeometry({...p,btVariant:null});
 assert.notDeepEqual(g.btNative.crop,old.btNative.crop);
 assert.equal(g.btTubes.length,8);
 assert.deepEqual(g.btTubes.map(s=>s.activeIndex),[0,1,2,3,4,5,6,7]);
 assert.equal(new Set(g.btTubes.map(s=>`${s.muzzle.x},${s.muzzle.y}`)).size,8);
 for(const s of g.btTubes)assert(Number.isFinite(s.muzzle.x)&&Number.isFinite(s.axis.y));
});
test('desert enemy and playable BT share artwork registration while retaining enemy ammo balance',()=>{
 const p=player(),g=btGeometry(p).btNative,e=inkEnemySaltikGeometry({...p,bt:undefined,type:'saltik'});
 assert.deepEqual(g.crop,e.crop);
 assert.deepEqual(g.podSlots.map(s=>s.muzzle),e.podSlots.map(s=>s.muzzle));
 assert.equal(e.podSlots.filter(s=>s.activeIndex>=0).length,2);
});
import {nativeTurnView,nativeTurnSockets} from '../src/character-turns.js';
test('desert BT turns select the independent turn sheet and registered physical ports',()=>{
 for(const yaw of [Math.PI/4,Math.PI/2,Math.PI*.75]){
  const p={...player(),turn:{active:true,yaw}},v=nativeTurnView(p);
  assert.equal(v.model,'desert-bt');assert.equal(v.slots.length,8);
  assert.equal(nativeTurnSockets(p).length,8);
 }
});
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
test('desert BT aims its raised painted cannon down toward nearby forward targets',()=>{
 const g=createInkScene({character:'bt',level:1});g.schedule=[];g.pickups=[];g.obstacles=[];g.introElapsed=g.introDuration;
 const p=g.player;p.btVariant='desert';p.dir=1;
 g.enemies=[{id:91,type:'turret',x:p.x+230,y:g.groundAt(p.x+230),hp:99,maxHp:99,cooldown:999,phase:0,hit:0,firePose:0}];
 updateInkScene(g,{fire:true,fireHeld:true},1/60);
 const shot=g.projectiles.find(s=>s.btHeavy);assert(shot);assert(shot.vy>30,'raised barrel must aim at lower forward turret');
 const axis=btGeometry(p,{time:g.time}).armDirection;assert(Math.abs(shot.vx/900-axis.x)<.001);assert(Math.abs(shot.vy/900-axis.y)<.001);
});
