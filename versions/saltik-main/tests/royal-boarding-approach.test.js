import test from 'node:test';import assert from 'node:assert/strict';
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
import {ROYAL_SITES} from '../src/royal-layout.js';import {surfaceHeight} from '../src/world.js';
for(const character of ['striker','gatling','bt'])test(`${character} descends to ground and clears the final building before the boarding jump`,()=>{
 const g=createInkScene({level:3,character});g.introElapsed=g.introDuration;g.royal.seals=3;g.schedule=[];g.enemies=[];g.pickups=[];
 const site=ROYAL_SITES.at(-1),top=g.platforms.find(p=>p.id===site.id),p=g.player;
 Object.assign(p,{x:17451,y:surfaceHeight(top,17451),supportY:surfaceHeight(top,17451),onGround:true,platformId:top.id,tier:top.tier,invulnerable:999});
 updateInkScene(g,{},1/60);assert.equal(g.royal.finale.stage,'approach');const initialY=p.y;
 for(let i=0;i<1200&&g.royal.finale.stage==='approach';i++)updateInkScene(g,{jump:true,fire:true},1/60);
 assert.equal(g.royal.finale.stage,'run');assert(p.onGround);assert(p.y>initialY+180);assert(p.x>=site.groundRight+90);assert(Math.abs(p.y-g.groundAt(p.x))<1);assert.equal(g.stats.shots,0);
 assert.equal(g.royal.finale.startWorld.x,p.x);assert.equal(g.royal.finale.startWorld.y,p.y);
});
