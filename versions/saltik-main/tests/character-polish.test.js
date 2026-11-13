import test from 'node:test';import assert from 'node:assert/strict';
import {createInkScene} from '../src/ink-scene.js';import {inkSaltikGeometry} from '../src/ink-saltik.js';import {createSaltikDuel,advanceSaltikDuel} from '../src/saltik-duel.js';import {inkDuelVisual} from '../src/ink-encounters.js';
const legs=g=>g.modernLegs??g.nativeLegs??g.btNative?.legs??g.legs;
test('cute jump moves native feet modestly outward without fanning the entire limb',()=>{for(const character of ['striker','gatling','bt']){const p={...createInkScene({character}).player,x:500,y:400,onGround:false,vy:-500,supportPose:null};const a=legs(inkSaltikGeometry(p)),b=legs(inkSaltikGeometry({...p,jumpLegs:{spread:1,airborne:true}}));for(let i=0;i<a.length;i++){assert(Math.abs(b[i].contact.x-p.x)-Math.abs(a[i].contact.x-p.x)>7);assert.equal(b[i].jumpPose.angle,0);assert(Math.abs(b[i].contact.x-a[i].contact.x)<8.1);}}});
test('throw choice is sampled once, all four outcomes are available and visuals stay deterministic',()=>{for(const [random,expected]of [[.01,0],[.3,1],[.6,2],[.99,3]]){let calls=0;let q=createSaltikDuel({x:400,y:500},{id:4,x:460,y:500},()=>{calls++;return random;});assert.equal(q.throwVariant,expected);q=advanceSaltikDuel(q,false,.45).duel;assert.equal(calls,1);const a=inkDuelVisual({...q,phase:'impact',elapsed:.1},{width:1280,height:720});assert.deepEqual(a,inkDuelVisual({...q,phase:'impact',elapsed:.1},{width:1280,height:720}));if(expected===1){assert.equal(a.screen.underside,true);assert(a.crackX>1280*.65);}if(expected===2){assert.equal(a.cracks,0);const slide=inkDuelVisual({...q,phase:'slide',elapsed:.95},{width:1280,height:720});assert.equal(slide.cracks,0);assert(slide.screen.y>720);}}});
test('soft slide emits a single friction cue without changing knockout/end timing',()=>{let q={...createSaltikDuel({x:400,y:500},{id:4,x:460,y:500},()=>.6),phase:'impact',elapsed:0};const entry=advanceSaltikDuel(q,false,.18);assert.equal(entry.duel.phase,'slide');assert.equal(entry.events.length,0);const r=advanceSaltikDuel(entry.duel,false,.24);assert.equal(r.duel.phase,'slide');assert.equal(r.events.filter(e=>e.type==='duel-slide').length,1);assert.equal(r.events[0].throwVariant,2);});

test('painted waterfall flow stays confined to mapped water and freezes at a paused simulation time',async()=>{const {ROYAL_WATERFALLS,waterfallRibbons,drawRoyalWaterfalls}=await import('../src/royal-waterfalls.js');for(const zones of Object.values(ROYAL_WATERFALLS))for(const z of zones){const a=waterfallRibbons(z,1),b=waterfallRibbons(z,1.15);assert.deepEqual(a,waterfallRibbons(z,1));assert.notDeepEqual(a,b);for(const band of [...a,...b]){assert(band.sy>=z[1]);assert(band.sy+band.sh<=z[1]+z[3]);assert(band.dy>=z[1]);assert(band.dy+band.dh<=z[1]+z[3]);}}const calls=[],stack=[],c=new Proxy({globalAlpha:1,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();},drawImage(...a){calls.push(a);}},{get:(t,k)=>k in t?t[k]:()=>{}});drawRoyalWaterfalls(c,{},'backdrop',{time:1});assert(calls.length>20&&calls.length<150);assert.equal(c.globalAlpha,1);});

test('painted wheels do not rotate with accumulated travel on any playable Saltik or enemy BT',async()=>{
 const {drawInkSaltik}=await import('../src/ink-saltik.js'),{drawInkEnemySaltik}=await import('../src/ink-enemy-saltik.js');
 const callsFor=fn=>{const calls=[],c=new Proxy({globalAlpha:1},{get:(t,k)=>k in t?t[k]:(...a)=>{calls.push([k,...a]);}});fn(c);return calls;};
 for(const character of ['striker','gatling','bt']){
  const p={...createInkScene({character}).player,x:500,y:500,vx:0,supportPose:null};
  const a=callsFor(c=>drawInkSaltik(c,{}, {...p,motionDistance:0}));
  const b=callsFor(c=>drawInkSaltik(c,{}, {...p,motionDistance:900}));
  assert.deepEqual(a,b,character);
 }
 const e={x:500,y:500,hp:100,dir:1,vx:0};
 assert.deepEqual(callsFor(c=>drawInkEnemySaltik(c,{}, {...e,motionDistance:0})),callsFor(c=>drawInkEnemySaltik(c,{}, {...e,motionDistance:900})));
});
