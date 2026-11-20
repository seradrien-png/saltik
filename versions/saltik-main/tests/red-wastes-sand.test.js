import test from 'node:test';import assert from 'node:assert/strict';
import {advanceRedWastesSand} from '../src/red-wastes-sand.js';
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
test('rolling native wheels leave local persistent sand marks and dust, jumps and concrete do not',()=>{
 const g={level:5,status:'playing',time:0,redWastes:{},player:{x:0,y:620,vx:230,onGround:true,dir:1},groundAt:()=>620};
 for(let i=0;i<100;i++){g.player.x+=230/60;advanceRedWastesSand(g,1/60,[{x:g.player.x,y:620}]);}
 assert(g.redWastes.sand.tracks.length>20);assert(g.redWastes.sand.dust.length>0);
 const last=g.redWastes.sand.tracks.at(-1);const x=last.x;
 g.player.x+=100;g.player.vx=0;advanceRedWastesSand(g,1/60,[{x:g.player.x,y:620}]);assert.equal(last.x,x);
 const n=g.redWastes.sand.tracks.length;g.player.vx=230;g.player.onGround=false;
 advanceRedWastesSand(g,1/60,[{x:g.player.x,y:580}]);assert.equal(g.redWastes.sand.tracks.length,n);
 g.player.onGround=true;for(let i=0;i<40;i++)advanceRedWastesSand(g,1/60,[{x:g.player.x+i*4,y:450}]);assert.equal(g.redWastes.sand.tracks.length,n);
 g.status='paused';const saved=JSON.stringify(g.redWastes.sand);advanceRedWastesSand(g,1,[{x:999,y:620}]);assert.equal(JSON.stringify(g.redWastes.sand),saved);
});
test('native contact extraction works for every Saltik; effects are bounded and wind clears old marks',()=>{
 for(const character of ['striker','gatling','bt']){
  const g=createInkScene({level:5,character});g.schedule=[];g.enemies=[];g.pickups=[];
  for(let i=0;i<300;i++)updateInkScene(g,{right:true},1/60);
  assert(g.redWastes.sand.tracks.length>30,character);assert(g.redWastes.sand.tracks.length<=650);assert(g.redWastes.sand.dust.length<=40);
  for(let i=0;i<60*12;i++)updateInkScene(g,{},1/60);
  assert.equal(g.redWastes.sand.tracks.length,0);assert.equal(g.redWastes.sand.dust.length,0);
 }
});
test('existing dust dissipates during an encounter and terminal victory clears airborne puffs',()=>{
 const g={level:5,status:'playing',redWastes:{},player:{x:0,y:620,vx:230,onGround:true,dir:1},groundAt:()=>620};
 for(let i=0;i<60;i++){g.player.x+=4;advanceRedWastesSand(g,1/60,[{x:g.player.x,y:620}]);}
 assert(g.redWastes.sand.dust.length);g.duel={};for(let i=0;i<90;i++)advanceRedWastesSand(g,1/60,[]);assert.equal(g.redWastes.sand.dust.length,0);
 g.redWastes.sand.dust=[{x:1,y:620,age:0,life:1}];g.status='won';advanceRedWastesSand(g,1/60,[]);assert.equal(g.redWastes.sand.dust.length,0);
});
