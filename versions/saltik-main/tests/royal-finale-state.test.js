import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
import {beginEvasion} from '../src/evasion.js';
for(const character of ['striker','gatling','bt'])test(`boarding keeps ${character} player UI state valid through the live simulation`,()=>{
 const g=createInkScene({level:3,character}),p=g.player,evasion=p.evasion,melee=p.melee;
 g.introElapsed=g.introDuration;g.schedule=[];g.enemies=[];g.pickups=[];g.royal.seals=3;
 Object.assign(p,{x:17451,y:g.groundAt(17451),supportY:g.groundAt(17451),invulnerable:999});
 beginEvasion(p.evasion);
 updateInkScene(g,{},1/60);
 assert(g.royal.finale?.active);
 assert.equal(p.evasion,evasion,'HUD/input keep their canonical evasion state object');
 assert.equal(p.evasion.active,false);assert.equal(p.evasion.held,false);assert.equal(p.melee,melee);
 for(let i=0;i<500;i++){
  updateInkScene(g,{},1/60);
  assert.equal(typeof p.evasion.active,'boolean','HUD can be updated on every frame');
 }
 assert.equal(g.status,'won');assert(g.royal.finale.completed);
});
