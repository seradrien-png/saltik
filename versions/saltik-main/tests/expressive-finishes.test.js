import test from 'node:test';import assert from 'node:assert/strict';
import {createInkScene} from '../src/ink-scene.js';import {inkSaltikGeometry} from '../src/ink-saltik.js';import {createSaltikDuel,advanceSaltikDuel} from '../src/saltik-duel.js';import {inkDuelVisual} from '../src/ink-encounters.js';
const legs=g=>g.modernLegs??g.nativeLegs??g.btNative?.legs;
test('actual native jump legs rotate almost horizontally around attached hips instead of stretching sideways',()=>{for(const character of ['striker','gatling','bt'])for(const dir of [-1,1]){const p={...createInkScene({character}).player,x:500,y:400,dir,onGround:false,vy:-300,supportPose:null,jumpLegs:{spread:1}};const g=inkSaltikGeometry(p);for(const l of legs(g)){assert(Math.abs(l.jumpPose?.angle)>.5);const hip=(g.nativePoint??g.btNative?.sourcePoint)(l.jumpPose.pivot);assert(Math.abs(l.contact.x-hip.x)>Math.abs(l.contact.y-hip.y)*3,'near-horizontal limb '+character);}}});
test('four finishes are sampled once and have visibly distinct impact locations',()=>{const positions=new Set();for(let i=0;i<4;i++){const q=createSaltikDuel({x:400,y:500},{id:4,x:460,y:500},()=> (i+.1)/4);assert.equal(q.throwVariant,i);const v=inkDuelVisual({...q,phase:'impact',elapsed:.12},{width:1280,height:720});positions.add([v.crackX,v.crackY].join());}assert.equal(positions.size,4);});
test('startled impact is held and sliding pose animates without glass damage',()=>{const q={phase:'impact',throwVariant:2,elapsed:.08,dir:1,enemyX:460,enemyY:500};const a=inkDuelVisual(q),b=inkDuelVisual({...q,elapsed:.16});assert.equal(a.screen.frame,b.screen.frame);assert.deepEqual(a.screen,b.screen);assert.equal(a.cracks,0);const c=inkDuelVisual({...q,phase:'slide',elapsed:.22}),d=inkDuelVisual({...q,phase:'slide',elapsed:.4});assert.notEqual(c.screen.frame,d.screen.frame);assert(d.screen.y>c.screen.y);});

test('all four finishes exit the screen and slide cues begin exactly with motion',()=>{
 for(let i=0;i<4;i++){
  const q={...createSaltikDuel({x:400,y:500},{id:4,x:460,y:500},()=> (i+.1)/4),phase:'slide',elapsed:.94};
  const v=inkDuelVisual({...q,elapsed:.95},{width:1280,height:720});assert(v.screen.y-137.2*v.screen.scale>720||v.screen.x+137.2*v.screen.scale<-10||v.screen.x-137.2*v.screen.scale>1280);
  if(i>=2){const hold=i===2?.24:.18,a=advanceSaltikDuel({...q,elapsed:0},false,hold-.01);assert.equal(a.events.length,0);const b=advanceSaltikDuel(a.duel,false,.02);assert.equal(b.events.filter(e=>e.type===(i===2?'duel-slide':'duel-ricochet')).length,1);assert.equal(advanceSaltikDuel(b.duel,false,.03).events.length,0);}
 }
});
