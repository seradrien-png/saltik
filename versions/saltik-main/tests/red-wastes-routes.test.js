import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene} from '../src/ink-scene.js';
import {update} from '../src/engine.js';
import {inkSaltikGeometry} from '../src/ink-saltik.js';
import {supportHeight} from '../src/world.js';
import {RED_WASTES_SITES,structurePlacement,redWastesGroundAt} from '../src/red-wastes-layout.js';

function empty(character){
 const g=createInkScene({level:5,character});g.schedule=[];g.pickups=[];return g;
}
test('the native sand path alternates between foreground and middle distance with continuous rough sand shoulders',()=>{
 const ys=[];
 for(let x=0;x<=23000;x+=10){
  const y=redWastesGroundAt(x);ys.push(y);
  assert(Math.abs(y-redWastesGroundAt(x+1))<.75);
 }
 assert(Math.max(...ys)-Math.min(...ys)>155);
 let turns=0,previous=0;
 for(let i=1;i<ys.length;i++){
  const direction=Math.sign(ys[i]-ys[i-1]);
  if(direction&&previous&&direction!==previous)turns++;
  if(direction)previous=direction;
 }
 assert(turns>=6);
 assert.notEqual(redWastesGroundAt(20500),redWastesGroundAt(23000));
});

test('all three native characters walk each registered structure both ways, with planted wheels and 230 x speed',()=>{
 for(const character of ['striker','gatling','bt'])for(const site of RED_WASTES_SITES)for(const direction of [1,-1]){
  const g=empty(character),p=g.player,start=direction===1?site.x-8:site.x+site.w+8;
  const target=direction===1?site.x+site.w+12:site.x-12;
  Object.assign(p,{x:start,y:g.groundAt(start),supportY:g.groundAt(start),onGround:true,dir:direction,turn:null});
  const visited=new Set();let frames=0;
  while((target-p.x)*direction>0&&frames++<1000){
   update(g,{[direction===1?'right':'left']:true},1/60);
   assert(p.onGround,`${character} ${site.id} loses support at ${p.x}`);
   assert.equal(p.vy,0);assert.equal(p.vx,230*direction);
   visited.add(p.platformId);
   const geo=inkSaltikGeometry(p,{time:g.time,sampleGround:x=>supportHeight(g,p,x)});
   const legs=geo.modernLegs??geo.btNative?.legs??geo.nativeLegs??geo.legs;
   // BT's native walking gait lifts tires by up to 2.45px. At a
   // tread-to-roof junction no wheel may be tagged on the cached tread,
   // so measure actual painted contact against finite current supports.
   const errors=legs.map(leg=>({y:leg.contact.y,support:supportHeight(g,p,leg.contact.x)})).filter(q=>Number.isFinite(q.support)).map(q=>Math.abs(q.y-q.support));
   assert(errors.length&&Math.min(...errors)<3,`${character} ${site.id} painted wheel support at ${p.x}`);
   for(const leg of legs)if(leg.grounded)assert(Math.abs(leg.contact.y-supportHeight(g,p,leg.contact.x))<.05);
  }
  assert(frames<1000);assert.equal(p.platformId,null);assert.equal(p.rampId,null);
  if(site.kind==='bunker'){
   assert(visited.has(`${site.id}-gallery`));assert(visited.has(`${site.id}-roof`));
  }else assert(visited.has(`${site.id}-tunnel`),'the eye hole is crossed on its actual elevated floor');
  assert.equal(g.events.some(event=>event.type==='jump'||event.type==='land'),false);
 }
});

test('the skull passage follows the orbital floor and opaque bone prevents dropping through it',()=>{
 const site=RED_WASTES_SITES.find(site=>site.kind==='skull'),box=structurePlacement(site);
 const g=empty('striker'),p=g.player,x=site.x+900,route=g.platforms.find(p=>p.id===`${site.id}-tunnel`);
 const y=route.points.find(point=>point[0]===x)[1];
 Object.assign(p,{x,y,supportY:y,onGround:true,tier:1,platformId:route.id});
 assert(y>box.y+.60*box.h&&y<box.y+.65*box.h);
 update(g,{drop:true},1/60);assert(p.onGround);assert.equal(p.platformId,route.id);
 assert.equal(p.y,y);
});
