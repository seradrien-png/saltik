import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
import {createEnemySaltik,SALTIK_GUARD_HP} from '../src/enemy-saltik.js';
import {inkDuelVisual} from '../src/ink-encounters.js';
import {INK_ENEMY_SALTIK_HEIGHT} from '../src/ink-enemy-saltik.js';
import {btFinishHold} from '../src/bt-finish-timing.js';

function scene(){
 const g=createInkScene({character:'bt'});g.schedule=[];g.obstacles=[];g.platforms=[];g.pickups=[];return g;
}
const step=(g,input={})=>updateInkScene(g,input,1/60);
function encounter(g,id){
 const p=g.player,e=createEnemySaltik({id,x:p.x+65},{y:p.y,random:0});
 e.guard=true;e.hp=SALTIK_GUARD_HP;g.enemies=[e];step(g);
 assert.equal(g.duel?.enemyId,id,'real grounded contact starts this encounter');
 const variant=g.duel.throwVariant,phases=new Set(),impact=[],hold=[],motion=[];
 const endEventStart=g.events.length;
 let qteTicks=0;
 for(let ticks=0;g.duel&&ticks<400;ticks++){
  const q=g.duel;phases.add(q.phase);
  if(q.phase==='qte'){step(g,{qte:(qteTicks++%2)===1});continue;}
  const v=inkDuelVisual(q,{width:1280,height:720});
  if(q.phase==='impact')impact.push(v);
  if(q.phase==='slide'){
   if(q.elapsed<btFinishHold(q))hold.push(v);
   else motion.push(v);
  }
  step(g);
 }
 assert.equal(g.duel,null,'five real press edges complete the full encounter');
 assert.deepEqual([...phases],['engage','qte','throw','impact','slide','recover']);
 assert(e.neutralized&&e.duelFinished,'the actual campaign neutralizes this enemy');
 assert.equal(g.events.slice(endEventStart).filter(e=>e.type==='duel-end').length,1);
 return {variant,impact,hold,motion,events:g.events.slice(endEventStart)};
}

test('actual BT encounters cycle through four finishes before repeating and a new run resets the cycle',()=>{
 const g=scene(),outcomes=Array.from({length:5},(_,i)=>encounter(g,i+1));
 assert.deepEqual(outcomes.map(o=>o.variant),[0,1,2,3,0]);
 assert.equal(encounter(scene(),100).variant,0);
 assert.equal(g.stats.neutralized,5);
});

test('all four actual BT outcomes retain distinct impacts, surprised holds, slide/ricochet cues and full-body exits',()=>{
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
