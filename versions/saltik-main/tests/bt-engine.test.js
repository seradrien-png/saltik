import test from 'node:test';import assert from 'node:assert/strict';
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
import {clearPlayerWeaponQueue} from '../src/engine.js';
const step=(g,input={},n=1)=>{for(let i=0;i<n;i++)updateInkScene(g,input,1/60);};
function game(level=1){const g=createInkScene({character:'bt',level});g.schedule=[];g.enemies=[];g.obstacles=[];g.pickups=[];g.introElapsed=g.introDuration;return g;}
test('BT selectable through each mission; movement and cannon work during missile acquisition',()=>{for(const level of [1,2,3]){const g=game(level);assert.equal(g.player.character,'bt');assert.equal(g.player.bt.loaded.length,16);const x=g.player.x;step(g,{right:true,fire:true,fireHeld:true,missile:true,missileHeld:true},45);assert(g.player.x>x+30);assert.equal(g.stats.shots,3);assert.equal(g.player.bt.locks.length,0);}});
test('panic fires exactly partial stock around BT with no guidance or invulnerability',()=>{const g=game();g.player.bt.loaded=g.player.bt.loaded.map((_,i)=>i<3);step(g,{homing:true});const shots=g.projectiles.filter(s=>s.btRocket);assert.equal(shots.length,3);assert(shots.every(s=>!s.guidance&&!s.targetId));assert(shots.some(s=>s.vx<0));assert(shots.some(s=>s.vx>0));assert.equal(g.player.invulnerable,0);assert.equal(g.player.bt.loaded.filter(Boolean).length,0);clearPlayerWeaponQueue(g.player);assert.equal(g.player.bt.locks.length,0);});
test('default Striker and Gatling never acquire BT state',()=>{for(const character of ['striker','gatling'])assert.equal(createInkScene({character}).player.bt,undefined);});
test('BT evasion preserves acquired locks and finishes or starts the independent heavy burst',()=>{
 for(const startDuringEvasion of [false,true]){
  const g=game();g.enemies=[{id:91,type:'turret',x:500,y:g.groundAt(500),hp:999,maxHp:999,cooldown:999,phase:0,hit:0,firePose:0}];
  step(g,{missile:true,missileHeld:true},45);assert.equal(g.player.bt.locks.length,3);
  if(!startDuringEvasion)step(g,{missileHeld:true,fire:true,fireHeld:true});
  step(g,{shift:true,missileHeld:true,fire:true,fireHeld:true},40);
  assert(g.player.bt.locks.length>=5,'evasion must preserve and advance locks');assert.equal(g.stats.shots,3,'evasion must not cancel or block cannon burst');
  step(g,{shift:true,missileReleased:true,fireHeld:false});assert(g.stats.homingSalvos>0,'release after evasion entry must launch actual locks');
 }
});
