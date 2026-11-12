import test from 'node:test';
import assert from 'node:assert/strict';
import {inkTitlePlayer} from '../src/ink-renderer.js';
import {drawInkSaltik} from '../src/ink-saltik.js';
import {createInkScene} from '../src/ink-scene.js';
import {sceneArtImages} from '../src/enemy-styles.js';

test('title Gatling retains native state and crop for each mission skin',()=>{
 const skins=[{},{},{}],images={'gatling-snow':skins[0],'gatling-lunar':skins[1],'gatling-velvet':skins[2]};
 for(const level of [1,2,3]){
  const {player}=createInkScene({level,character:'gatling'});
  Object.assign(player,{x:400,y:200,vx:200,dir:-1,onGround:false,turn:{active:true},muzzle:.1});
  player.gatling.spin=2;
  const pose=inkTitlePlayer(player,930,590),calls=[];
  assert.equal(pose.character,'gatling');assert.equal(pose.gatling,player.gatling);assert.equal(pose.artScale,player.artScale);
  assert.equal(pose.x,930);assert.equal(pose.y,590);assert.equal(pose.supportY,590);
  assert.equal(pose.dir,1);assert.equal(pose.vx,0);assert.equal(pose.onGround,true);assert.equal(pose.turn,undefined);
  const c=new Proxy({globalAlpha:1,drawImage:(...args)=>calls.push(args)},{get:(target,key)=>target[key]??(()=>{})});
  drawInkSaltik(c,sceneArtImages(images,level,pose.character)['ink-saltik'],pose,{time:2,scale:2.5});
  assert.ok(calls.length>0);
  for(const call of calls){assert.equal(call[0],skins[level-1]);assert.deepEqual(call.slice(1,5),[0,0,1536,1024]);}
 }
});

test('title Striker keeps the stationary title pose with its new reference model',()=>{
 const original={x:930,y:590,dir:1,onGround:true,supportY:590,vx:0,visualModel:'modern-striker'};
 assert.deepEqual(inkTitlePlayer(createInkScene().player,930,590),original);
 assert.deepEqual(inkTitlePlayer(createInkScene({character:'striker'}).player,930,590),original);
});
