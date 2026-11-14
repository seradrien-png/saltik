import test from 'node:test';
import assert from 'node:assert/strict';
import {ROYAL_SITES,createRoyalRoutes,royalGroundAt} from '../src/royal-layout.js';
import {surfaceHeight} from '../src/world.js';
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
test('two distinct Velvet buildings provide ground, a real middle landing and an upper deck',()=>{
 const sites=ROYAL_SITES.filter(s=>s.middle);assert.equal(sites.length,2);assert.equal(new Set(sites.map(s=>s.kind)).size,2);
 const routes=createRoyalRoutes();for(const site of sites){const middle=routes.find(p=>p.id===site.id+'-middle'),upper=routes.find(p=>p.id===site.id);assert(middle&&upper);assert(middle.x2-middle.x1>140);assert(surfaceHeight(upper,upper.x1)<surfaceHeight(middle,middle.x1)-100);assert(surfaceHeight(middle,middle.x1)<royalGroundAt(middle.x1)-100);assert(upper.walkableEntries.some(e=>e.lowerId===middle.id));}
});
test('both new landings and upper decks are reached through their actual stairs with ordinary movement',()=>{
 for(const site of ROYAL_SITES.filter(s=>s.middle))for(const character of ['striker','gatling','bt']){
  const g=createInkScene({level:3,character});g.schedule=[];g.enemies=[];g.pickups=[];g.royal.seals=3;g.introElapsed=g.introDuration;
  const middle=g.platforms.find(p=>p.id===site.id+'-middle'),upper=g.platforms.find(p=>p.id===site.id),a=middle.walkableEntries[0].points[0];Object.assign(g.player,{x:a[0]-15,y:g.groundAt(a[0]-15),supportY:g.groundAt(a[0]-15)});
  for(let i=0;i<400&&g.player.platformId!==middle.id;i++)updateInkScene(g,{right:true},1/60);assert.equal(g.player.platformId,middle.id,site.id+' middle');
  for(let i=0;i<400&&g.player.platformId!==upper.id;i++)updateInkScene(g,{right:true},1/60);assert.equal(g.player.platformId,upper.id,site.id+' upper');for(let i=0;i<700&&(g.player.platformId||g.player.rampId||g.player.x>a[0]-15);i++)updateInkScene(g,{left:true},1/60);assert.equal(g.player.platformId,null,site.id+' descent');assert.equal(g.player.rampId,null,site.id+' ground');assert.equal(g.royal.falls,0);
 }
});
