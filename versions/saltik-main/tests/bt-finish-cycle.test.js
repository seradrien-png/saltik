import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
import {combatBounds} from '../src/engine.js';
import {createEnemySaltik,SALTIK_GUARD_HP} from '../src/enemy-saltik.js';
import {inkDuelVisual} from '../src/ink-encounters.js';
import {INK_ENEMY_SALTIK_HEIGHT} from '../src/ink-enemy-saltik.js';
import {createSaltikDuel,advanceSaltikDuel,nextSaltikDuelVariant} from '../src/saltik-duel.js';
import {btFinishHold} from '../src/bt-finish-timing.js';

function scene(){
 const g=createInkScene({character:'bt'});g.schedule=[];g.obstacles=[];g.platforms=[];g.pickups=[];return g;
}
const step=(g,input={})=>updateInkScene(g,input,1/60);
function encounter(g,id){
 const p=g.player,e=createEnemySaltik({id,x:p.x+65},{y:p.y,random:0});
 // The archived four-pose finish remains inspectable through its pure helper.
 g.duel=createSaltikDuel(p,e,nextSaltikDuelVariant(g));
 const variant=g.duel.throwVariant,phases=new Set(),impact=[],hold=[],motion=[],events=[];
 let qteTicks=0;
 for(let ticks=0;g.duel&&ticks<500;ticks++){
  const q=g.duel;phases.add(q.phase);
  if(q.phase!=='qte'){
   const v=inkDuelVisual(q,{width:1280,height:720});
   if(q.phase==='impact')impact.push(v);
   if(q.phase==='slide'){if(q.elapsed<btFinishHold(q))hold.push(v);else motion.push(v);}
  }
  const result=advanceSaltikDuel(q,q.phase==='qte'&&(qteTicks++%2)===1,1/60);
  g.duel=result.duel;events.push(...result.events);
 }
 assert.equal(g.duel,null);assert.deepEqual([...phases],['engage','qte','throw','impact','slide','recover']);
 return {variant,impact,hold,motion,events};
}

test('live BT encounters leave persistent ground wrecks without cycling archived screen finishes',()=>{
 const g=scene();g.player.melee.cooldown=99;
 for(let id=1;id<=5;id++){
  const p=g.player,e=createEnemySaltik({id,x:p.x+400+id*100},{y:g.groundAt(p.x+400+id*100),random:0});g.enemies.push(e);
  const box=combatBounds(e,g.time);
  g.projectiles.push({kind:'bullet',team:'player',x:e.x-90,y:box.y+box.h*.5,vx:12000,vy:0,damage:100,radius:3,life:1});step(g);
  assert.equal(e.groundedDefeat,true);assert.equal(g.duel,null);
 }
 assert.equal(g.stats.neutralized,5);assert.equal(g.stats.kills,5);assert.equal(g.stats.score,1250);
 assert.equal(g.enemies.filter(e=>e.groundedDefeat).length,5);assert.equal(g.saltikDuelVariant,undefined);
 assert.equal(g.events.some(e=>e.type.startsWith('duel-')),false);
});

test('archived finish helper retains its four variants and a fresh helper run resets the cycle',()=>{
 const g=scene(),outcomes=Array.from({length:5},(_,i)=>encounter(g,i+1));
 assert.deepEqual(outcomes.map(o=>o.variant),[0,1,2,3,0]);assert.equal(encounter(scene(),100).variant,0);
});

test('all four archived BT outcomes retain distinct impacts, surprised holds, slide/ricochet cues and full-body exits',()=>{
 const g=scene(),outcomes=Array.from({length:4},(_,i)=>encounter(g,i+1));
 assert.deepEqual(outcomes.map(o=>o.variant),[0,1,2,3]);
 assert.equal(new Set(outcomes.map(o=>[o.impact[0].crackX,o.impact[0].crackY].join())).size,4);
 for(const o of outcomes){
  assert(o.impact.length>2&&o.hold.length>2&&o.motion.length>10);
  for(const v of o.impact)assert.deepEqual(v.screen,o.impact[0].screen,'surprised impact is held still');
  for(const v of o.hold)assert.deepEqual(v.screen,o.impact[0].screen,'the same face holds before motion');
  const last=o.motion.at(-1).screen,h=INK_ENEMY_SALTIK_HEIGHT*last.scale;
  assert(last.y-h>720||last.x+h<0||last.x-h>1280,'the whole body leaves the viewport');
  if(o.variant===1)assert(o.impact[0].screen.underside);
  if(o.variant>=2)assert(o.impact.every(v=>v.cracks===0)&&o.motion.every(v=>v.cracks===0),'glass stays intact');
  if(o.variant===2)assert.equal(o.events.filter(e=>e.type==='duel-slide').length,1);
  if(o.variant===3){assert.equal(o.events.filter(e=>e.type==='duel-ricochet').length,1);assert(new Set(o.motion.map(v=>v.screen.frame)).size>1);}
 }
});
