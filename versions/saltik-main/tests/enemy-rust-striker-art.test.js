import test from 'node:test';
import assert from 'node:assert/strict';
import {enemyRustStrikerGeometry,drawEnemyRustStriker,ENEMY_RUST_STRIKER} from '../src/enemy-rust-striker-art.js';
import {GATLING_DESERT_STAR_PATCHES,bakeStarlessDesertGatling,prepareStarlessDesertGatling} from '../src/gatling-starless.js';
function context(){const calls=[];return{calls,c:new Proxy({globalAlpha:1,drawImage(...args){calls.push(args);}},{get:(o,k)=>k in o?o[k]:()=>{}})};}
test('rusted enemy has its own registered cannon and eight cream launch mouths',()=>{
 const e={x:1000,y:600,dir:1,hp:40},g=enemyRustStrikerGeometry(e);
 assert.equal(g.podSlots8.length,8);assert.equal(g.podMuzzles.length,2);assert(Math.abs(g.bounds.h-1192*126/1180)<1e-9);
 assert(g.muzzle.x>e.x);assert(g.muzzle.y<e.y-70);assert(g.muzzleDirection.x>.99);
 assert.deepEqual(g.podMuzzles,[g.podSlots[0].muzzle,g.podSlots[4].muzzle]);
 const left=enemyRustStrikerGeometry({...e,dir:-1});assert(Math.abs(left.muzzle.x+g.muzzle.x-e.x*2)<.001);
 const moved=enemyRustStrikerGeometry({...e,x:e.x+200});assert.equal(moved.muzzle.x,g.muzzle.x+200);
 const camera=enemyRustStrikerGeometry(e,0,{camera:400});assert.equal(camera.muzzle.x,g.muzzle.x-400);
});
test('rust enemy painted cannon turns toward its real forward target without moving pod mouths',()=>{
 const e={x:1000,y:600,dir:1,hp:40},base=enemyRustStrikerGeometry(e),aim=enemyRustStrikerGeometry({...e,armyAimTarget:{x:1600,y:580}});
 assert(aim.muzzleDirection.y>base.muzzleDirection.y);assert.deepEqual(aim.podMuzzles,base.podMuzzles);
 const pivot=aim.guns[0].point(ENEMY_RUST_STRIKER.guns[0].pivot),angle=Math.atan2(aim.muzzle.y-pivot.y,aim.muzzle.x-pivot.x);assert(Math.abs(angle-Math.atan2(aim.muzzleDirection.y,aim.muzzleDirection.x))<1e-9);
});
test('enemy pod covers retain native art when loaded and reveal only genuinely spent slots',()=>{
 const e={x:1000,y:600,dir:1,hp:40},image={id:'new-rust'},ready=context(),empty=context(),refill=context();
 drawEnemyRustStriker(ready.c,image,e);drawEnemyRustStriker(empty.c,image,{...e,armyPodSpent:[true,false,false,false,true,false,false,false],armyReloadProgress:.5});drawEnemyRustStriker(refill.c,image,{...e,armyPodSpent:[true,false,false,false,true,false,false,false],armyReloadProgress:.95});
 assert.equal(ready.calls.length,empty.calls.length);assert.equal(refill.calls.length,ready.calls.length+2);assert(ready.calls.every(a=>a[0]===image));
});
test('grounded rust Striker keeps the same image and never draws a screen projection',()=>{
 const image={id:'rust'},e={x:1000,y:600,dir:1,hp:0,groundedDefeat:true,defeatStartedAt:5,neutralized:true},a=context();const before=structuredClone(e),pose=drawEnemyRustStriker(a.c,image,e,{time:6.1});
 assert.equal(pose.progress,1);assert(a.calls.length>0);assert(a.calls.every(c=>c[0]===image));assert.deepEqual(e,before);
});
test('starless patch rectangles stay inside desert cell and match the original turn canvas',()=>{
 for(const [x,y,w,h]of GATLING_DESERT_STAR_PATCHES.atlas){assert(x>=627&&y>=627&&x+w<=1254&&y+h<=1254);}
 for(const [x,y,w,h]of GATLING_DESERT_STAR_PATCHES.turn){assert(x>=0&&y>=0&&x+w<=2172&&y+h<=724);}
});
test('starless bake draws registered material only in measured markings and is cached',()=>{
 const previous=globalThis.document,created=[];globalThis.document={createElement(){const q=context(),canvas={getContext:()=>q.c};created.push({canvas,...q});return canvas;}};
 try{
  const original={width:1254,height:1254},paint={width:1254,height:1254},images={'modern-gatling-atlas':original,'modern-gatling-turn-desert':{width:2172,height:724},'gatling-desert-starless-atlas':paint,'gatling-desert-starless-turn':{width:2172,height:724}};
  prepareStarlessDesertGatling(images);assert.equal(created.length,2);assert.equal(created[0].calls.length,2);assert.equal(created[0].calls[0][0],original);assert.equal(created[0].calls[1][0],paint);assert.equal(images['modern-gatling-atlas'].width,1254);assert.equal(images['modern-gatling-turn-desert'].width,2172);
  prepareStarlessDesertGatling(images);assert.equal(created.length,2);assert.equal(bakeStarlessDesertGatling(original,null,[]),original);
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
