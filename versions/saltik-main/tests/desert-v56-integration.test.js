import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
import {sceneArtImages} from '../src/enemy-styles.js';
import {inkTitlePlayer,INK_ART_NAMES} from '../src/ink-renderer.js';
import {inkSaltikGeometry} from '../src/ink-saltik.js';

test('BT playable defaults stay classic while archived desert art stays available',()=>{
 const body={},turn={},old={},images={'desert-bt-body':body,'desert-bt-turn':turn,'ink-enemy-saltik':old};
 assert(INK_ART_NAMES.includes('desert-bt-body'));assert(INK_ART_NAMES.includes('desert-bt-turn'));
 for(const level of [1,2,3,4,5]){
  const g=createInkScene({level,character:'bt'}),red=level>=4;
  assert.equal(g.player.btVariant,undefined);
  const title=inkTitlePlayer(g.player,300,600);assert.equal(title.btVariant,g.player.btVariant);
  const art=sceneArtImages(images,level,'bt');assert.equal(art['ink-saltik'],old);
  assert.notEqual(art['ink-turn'],turn);assert.equal(inkSaltikGeometry(title).btNative.profile,undefined);
  for(const character of ['striker','gatling'])assert.equal(sceneArtImages(images,level,character)['ink-enemy-saltik'],red?body:old);
 }
});

test('spawned red patrol BT carries its new profile before attack and duel',()=>{
 const g=createInkScene({level:5,character:'striker'});g.player.invulnerable=999;
 g.schedule=[{id:'red-bt',type:'saltik',x:1000}];g.nextSpawn=0;
 updateInkScene(g,{},1/60);const e=g.enemies.find(e=>e.type==='saltik');assert(e);
 assert.equal(e.btVariant,undefined);assert.equal(g.enemySaltikGeometry(e).profile,undefined);
});
