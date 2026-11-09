import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update} from '../src/engine.js';
import {artilleryAlert} from '../src/missile-campaign.js';
function combatInput(g,frame){const q=g.batteryClash??g.duel;return q?{qte:q.phase==='qte'&&frame%2===0}:{right:true,fire:true,missile:true,homing:true,intercept:artilleryAlert(g).ready};}
test('a complete forward-and-fire run with alerts and QTEs reaches victory in about 90 seconds',()=>{
  const g=createGame();let duels=0;
  for(let frame=0;frame<130*60&&g.status==='playing';frame++){
    const input=combatInput(g,frame);
    update(g,input,1/60);
    duels+=g.events.filter(e=>e.type==='duel-start').length;
    g.events.length=0;
  }
  assert.equal(g.status,'won');
  assert.ok(g.time>=75&&g.time<=130,`run took ${g.time}s`);assert.ok(duels>0);
  assert.ok(g.player.hp>0);assert.ok(g.stats.kills>20);
  assert.ok(g.boss&&g.boss.hp<=0);assert.equal(g.progress,1);
});
test('a full combat route climbs the distinct elevated passages and still reaches victory',()=>{
  const g=createGame(),tiers=new Set(),visited=new Set();
  for(let frame=0;frame<130*60&&g.status==='playing';frame++){
    const p=g.player,input=combatInput(g,frame);
    const route=g.platforms.find(r=>p.x>r.x1+20&&p.x<r.x1+115&&(p.platformId??null)===(r.lower?.id??null));
    if(!g.duel&&!g.batteryClash&&p.onGround&&!g.jumpHeld&&route)input.jump=true;
    update(g,input,1/60);g.events.length=0;
    if(g.player.onGround){tiers.add(g.player.tier);if(g.player.platformId)visited.add(g.player.platformId);}
  }
  assert.equal(g.status,'won');assert.ok(g.player.hp>0);
  assert.deepEqual([...tiers].sort(),[0,1,2]);assert.deepEqual([...visited].sort(),g.platforms.map(p=>p.id).sort());
  assert.ok(g.time>=75&&g.time<=130,`run took ${g.time}s`);assert.ok(g.stats.obstacles>=7);
});
