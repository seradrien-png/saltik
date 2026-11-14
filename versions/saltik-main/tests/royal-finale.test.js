import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoyalFinale,advanceRoyalFinale,getRoyalFinalePose,ROYAL_FINALE_TIMING} from '../src/royal-finale.js';
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
import {advanceRoyalObjective} from '../src/royal-level.js';
import {ROYAL_SITES,ROYAL_CELLS,royalGroundAt,royalSample} from '../src/royal-layout.js';
import {drawRoyalForeground,royalPaintedBounds} from '../src/royal-world.js';

test('finale trajectory joins the eel back continuously, departs together and completes once',()=>{
 const f=createRoyalFinale({x:17450,y:400,artScale:1});
 assert.deepEqual(f.startWorld,{x:17450,y:400,artScale:1});
 advanceRoyalFinale(f,ROYAL_FINALE_TIMING.run);assert.equal(f.stage,'jump');
 advanceRoyalFinale(f,ROYAL_FINALE_TIMING.jump-1e-8);const landing=getRoyalFinalePose(f);
 advanceRoyalFinale(f,1e-8);const board=getRoyalFinalePose(f);
 assert.equal(board.stage,'ride');assert(Math.hypot(landing.player.x-board.rider.x,landing.player.y-board.rider.y)<1e-7);
 assert.deepEqual({x:board.player.x,y:board.player.y},board.rider);
 advanceRoyalFinale(f,1);const depart=getRoyalFinalePose(f);assert(depart.eel.x>board.eel.x);assert(depart.player.scale<board.player.scale);
 assert.equal(advanceRoyalFinale(f,10),true);assert.equal(advanceRoyalFinale(f,10),false);
 assert.equal(f.elapsed,ROYAL_FINALE_TIMING.total);assert.equal(f.completed,true);assert.equal(f.active,false);
});

test('exit starts cinema before victory; pause freezes it and hostile inputs cannot interrupt it',()=>{
 const g=createInkScene({level:3,character:'gatling'});g.introElapsed=g.introDuration;g.schedule=[];g.enemies=[];g.royal.seals=3;
 Object.assign(g.player,{x:17449,y:g.groundAt(17449),supportY:g.groundAt(17449),invulnerable:999});
 for(let i=0;i<15&&!g.royal.finale;i++)updateInkScene(g,{right:true},1/60);
 assert(g.royal.finale?.active);assert.equal(g.status,'playing');assert.equal(g.events.filter(e=>e.type==='royal-open').length,0);
 const initial=structuredClone(g.royal.finale),time=g.time,x=g.player.x,hp=g.player.hp;
 g.status='paused';for(let i=0;i<30;i++)updateInkScene(g,{fire:true,jump:true},1/60);
 assert.deepEqual(g.royal.finale,initial);assert.equal(g.time,time);
 g.status='playing';for(let i=0;i<600&&g.status==='playing';i++)updateInkScene(g,{fire:true,homing:true,missile:true,jump:true,shift:true,qte:true},1/60);
 assert.equal(g.status,'won');assert(g.royal.finale.completed);assert.equal(g.player.x,x);assert.equal(g.player.hp,hp);assert.equal(g.projectiles.length,0);assert.equal(g.duel,null);
 assert(Math.abs((g.time-time)-ROYAL_FINALE_TIMING.total)<.02);assert.equal(g.events.filter(e=>e.type==='royal-open').length,1);
 advanceRoyalObjective(g,1);updateInkScene(g,{},1/60);assert.equal(g.events.filter(e=>e.type==='royal-open').length,1);
 assert.equal(createInkScene({level:3}).royal.finale,null);
});

test('waterfall crossing is a solid rooted plinth with no lower passage to jump inside',()=>{
 for(const s of ROYAL_SITES){const b=royalPaintedBounds(s);assert.equal(b.y+b.h,s.top+ROYAL_CELLS[s.kind].crop[3]*s.scale);
  if(s.kind!=='bridge'){assert.equal(royalGroundAt(s.left+s.scale*ROYAL_CELLS[s.kind].crop[2]/2),s.top+ROYAL_CELLS[s.kind].foot*s.scale);continue;}
  for(let x=s.x1;x<=s.x2;x+=10)assert(Math.abs(royalGroundAt(x)-royalSample(s.points,x))<1e-7);
  const g=createInkScene({level:3});g.introElapsed=g.introDuration;g.schedule=[];g.enemies=[];g.pickups=[];g.royal.seals=3;
  Object.assign(g.player,{x:s.x1-30,y:royalGroundAt(s.x1-30),supportY:royalGroundAt(s.x1-30),invulnerable:999});
  for(let i=0;i<700&&g.player.x<s.x2+220;i++){updateInkScene(g,{right:true,jump:i%130===60},1/60);assert(g.player.y<=royalGroundAt(g.player.x)+2,'no tunnel beneath waterfall');}
  assert(g.player.x>s.x2+200);assert.equal(g.royal.falls,0);
 }
});

test('actual ground bridge crossings and jumps retain near rails; garden descents leave their depth plane',()=>{
 const rail={},draws=[],c=new Proxy({drawImage:(image,...args)=>draws.push({image,args})},{get:(t,k)=>k in t?t[k]:()=>{}}),s=ROYAL_SITES.find(s=>s.kind==='bridge');
 const g=createInkScene({level:3});g.introElapsed=g.introDuration;g.schedule=[];g.enemies=[];g.pickups=[];g.royal.seals=3;
 const x=s.x1+30;Object.assign(g.player,{x,y:royalGroundAt(x),supportY:royalGroundAt(x),platformId:null,rampId:null,invulnerable:999});
 const opts={camera:s.left,width:1600,art:{railFront:rail}};
 const hasRail=()=>{draws.length=0;drawRoyalForeground(c,g,opts);return draws.some(d=>d.image===rail);};
 let groundSamples=0,airSamples=0,groundWithoutPlatform=0;
 for(let i=0;i<700&&g.player.x<s.x2-40;i++){
  updateInkScene(g,{right:true,jump:i===70},1/60);
  if(g.player.onGround){groundSamples++;if(!g.player.platformId&&!g.player.rampId)groundWithoutPlatform++;}else airSamples++;
  assert(hasRail(),'registered bridge plane retains rail during actual traversal');
 }
 assert(groundSamples>30);assert(groundWithoutPlatform>30);assert(airSamples>10);
 // A descending actor below the painted deck is no longer in its depth plane.
 Object.assign(g.player,{x:s.x2-20,y:royalSample(s.points,s.x2-20)+35,platformId:null,rampId:null});assert.equal(hasRail(),false);
 Object.assign(g.player,{x:s.x2+80,y:royalGroundAt(s.x2+80),platformId:null,rampId:null});assert.equal(hasRail(),false);
});
