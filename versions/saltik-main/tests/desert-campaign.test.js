import {createInkScene,updateInkScene} from '../src/ink-scene.js';
import {advanceDesertObjective} from '../src/desert-level.js';
import test from 'node:test';import assert from 'node:assert/strict';

for(const character of ['striker','gatling','bt'])test(`native ${character} clears C-07 and walks back to the foreground without invulnerability`,()=>{
 const g=createInkScene({level:4,character});g.player.x=6200;advanceDesertObjective(g,.01);advanceDesertObjective(g,1);
 for(let i=0;i<60*300&&g.status==='playing';i++){
  let input={};
  if(g.desert.phase==='return')input.left=true;
  else if(g.desert.phase==='interior'){
   const targets=g.enemies.filter(e=>e.hp>0&&!e.neutralized&&!e.duelFinished).sort((a,b)=>Math.abs(a.x-g.player.x)-Math.abs(b.x-g.player.x)),target=targets[0];
   let dx=target?target.x-g.player.x:1000,guard=target?.type==='saltik'&&target.guard;
   const travel=!target||Math.abs(dx)>450||guard;
   input.right=travel&&dx>18;input.left=travel&&dx<-18;
   if(target&&!travel){input.right=dx>0&&g.player.dir<0;input.left=dx<0&&g.player.dir>0;}
   input.fire=character==='bt'?i%80===0:character==='gatling'?!!target&&!travel:true;
   input.fireHeld=input.fire;input.homing=character!=='bt';
   if(character==='bt'){const held=i%150<125;input.missile=held;input.missileHeld=held;input.missileReleased=i%150===125;}
   else input.missile=i%230<45;
   input.qte=i%12<6;
  }
  updateInkScene(g,input,1/60);
 }
 assert.equal(g.status,'won',JSON.stringify({character,phase:g.desert.phase,x:g.player.x,hp:g.player.hp,rooms:g.desert.roomsCleared,enemies:g.enemies.map(e=>({type:e.type,x:e.x,hp:e.hp}))}));assert.equal(g.desert.roomsCleared,3);assert.equal(g.desert.phase,'complete');assert.equal(g.stats.kills,16);assert.equal(g.stats.neutralized,2);assert(g.player.hp>0);assert(g.time>=50&&g.time<180);assert.equal(g.desert.falls,0);
});
