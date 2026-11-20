import test from 'node:test';
import assert from 'node:assert/strict';
import {createSaltikDuel,advanceSaltikDuel} from '../src/saltik-duel.js';
import {inkDuelGripGeometry,drawInkDuelWorld,drawInkDuelScreen,inkDuelVisual} from '../src/ink-encounters.js';
const enemy={id:4,x:540,y:600,btVariant:'desert'},player={x:450,y:600};
const duel=(variant=0)=>({...createSaltikDuel(player,enemy,variant),phase:'qte',taps:1,effortsCompleted:0,effortElapsed:.12});
function canvas(){const calls=[],c=new Proxy({globalAlpha:1,drawImage(...args){calls.push(args);}},{get:(o,k)=>k in o?o[k]:()=>{}});return{calls,c};}
test('a duel captures its actual enemy costume and retains it after the enemy disappears',()=>{
 const q=createSaltikDuel(player,enemy,0);assert.equal(q.enemyBTVariant,'desert');enemy.btVariant=undefined;
 const next=advanceSaltikDuel(q,false,.45).duel;assert.equal(next.enemyBTVariant,'desert');enemy.btVariant='desert';
 assert.equal(createSaltikDuel(player,{...enemy,btVariant:undefined},0).enemyBTVariant,undefined);
});
test('desert duel uses measured new cabin arms and its native front leg, in either facing',()=>{
 for(const dir of [-1,1]){
  const q={...duel(),dir},g=inkDuelGripGeometry(q);
  assert.equal(g.e.btVariant,'desert');assert(g.eg.profileParts,'new native profile must be selected');
  assert.deepEqual(g.enemyArms.map(a=>a.pivot),g.eg.profileParts.arms.map(a=>a.pivot));
  assert.deepEqual(g.enemyFrontLeg.polygon,g.eg.profileParts.legs[2].polygon);
  assert(Math.hypot(g.enemyGrip.x-g.playerGrip.x,g.enemyGrip.y-g.playerGrip.y)<15,'new claws must reach the existing locked stance');
 }
});
test('desert duel world draws its own body source and never crops old BT pixels',()=>{
 const {calls,c}=canvas(),images={'ink-saltik':{id:'player'},'ink-enemy-saltik':{id:'old-enemy'},'desert-bt-body':{id:'desert-body'}};
 assert(drawInkDuelWorld(c,images,duel()));
 assert(calls.some(args=>args[0]===images['desert-bt-body']));assert(calls.every(args=>args[0]!==images['ink-enemy-saltik']));
});
test('all four desert screen finishes preserve the new skin and distinct original movement',()=>{
 const images={'ink-enemy-saltik':{id:'old-enemy'},'bt-finish-frames':{id:'old-finishes'},'bt-impact-underside':{id:'old-underside'},'desert-bt-body':{id:'desert-body'},'desert-bt-turn':{id:'desert-front'},'desert-bt-finishes':{id:'desert-finish-poses'}},poses=[];
 for(let variant=0;variant<4;variant++){
  for(const phase of ['throw','impact','slide'])for(const elapsed of [0,.12,.4,.8]){
   const q={...duel(variant),phase,elapsed},before=structuredClone(q),{calls,c}=canvas();
   assert(drawInkDuelScreen(c,images,q));assert.deepEqual(q,before);
   assert(calls.length);assert(calls.every(args=>args[0]===images['desert-bt-finishes']),'desert finish must use its own illustrated finish poses');
   assert.equal(calls.length,1,'each finish must use one complete illustrated pose');
   if(phase==='impact'&&elapsed===0)poses.push(calls[0].slice(1,5));
  }
  poses.push(inkDuelVisual({...duel(variant),phase:'slide',elapsed:.8}).screen);
 }
 assert.equal(new Set(poses.filter(Array.isArray).map(p=>JSON.stringify(p))).size,4,'each variant must have its own genuinely drawn source crop');
 assert.equal(new Set(poses.filter(p=>!Array.isArray(p)).map(p=>JSON.stringify(p))).size,4);
});

test('earlier costumes retain the six illustrated original finish frames',()=>{
 const image={id:'old-finishes'},images={'ink-enemy-saltik':{},'bt-finish-frames':image,'desert-bt-body':{}},q={...duel(3),enemyBTVariant:undefined,phase:'slide',elapsed:.8},{calls,c}=canvas();
 assert(drawInkDuelScreen(c,images,q));assert.equal(calls.length,1);assert.equal(calls[0][0],image);
});
