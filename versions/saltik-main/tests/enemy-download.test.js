import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,spawnDesertNativeTarget,combatBounds} from '../src/engine.js';
import {drawInkEnemy} from '../src/ink-actors.js';
const game=()=>{const g=createGame();Object.assign(g,{inkCampaign:true,level:5,schedule:[],platforms:[],obstacles:[],pickups:[],groundAt:()=>620,disableBoss:true,viewport:{x:0,y:0,w:1000,h:720}});g.player.x=200;g.player.y=620;g.maxX=200;return g;};
const step=(g,n=1)=>{for(let i=0;i<n;i++)update(g,{},1/60);};
test('offscreen authored forces wait to visibly download and cannot fire or move during assembly',()=>{
 const g=game(),e=spawnDesertNativeTarget(g,{id:91,type:'soldier',x:1700});e.cooldown=0;
 step(g,100);assert.equal(e.x,1700);assert.equal(e.download?.phase,'waiting');assert.equal(g.projectiles.length,0);
 g.viewport={x:900,y:0,w:1000,h:720};step(g);assert.equal(e.download.phase,'assembling');assert.ok(e.download.elapsed>0);const x=e.x;
 step(g,30);assert.equal(e.x,x);assert.equal(g.projectiles.length,0);step(g,45);assert.equal(e.download.phase,'solid');assert.ok(e.x<x);
});
test('only native military bodies download in every Matin Doré level and reset on new spawn',()=>{
 for(const level of [1,2,3,4,5])for(const type of ['soldier','walker','turret','drone']){const g=game();g.level=level;const e=spawnDesertNativeTarget(g,{id:2,type,x:600});assert.equal(e.download?.phase,'waiting');}
 for(const [inkCampaign,type] of [[false,'soldier'],[true,'saltik'],[true,'crate']]){const g=game();g.inkCampaign=inkCampaign;const e=spawnDesertNativeTarget(g,{id:3,type,x:600});assert.equal(e.download,undefined);}
 const g=game(),first=spawnDesertNativeTarget(g,{id:4,type:'walker',x:600});step(g,80);assert.equal(first.download.phase,'solid');const fresh=spawnDesertNativeTarget(g,{id:5,type:'walker',x:650});assert.equal(fresh.download.phase,'waiting');
});
test('pause and zero simulation steps preserve download age and native HP/bounds',()=>{
 const g=game(),e=spawnDesertNativeTarget(g,{id:6,type:'turret',x:600}),bounds=combatBounds(e);step(g,20);const before=structuredClone(e.download);g.status='paused';step(g,120);assert.deepEqual(e.download,before);g.status='playing';update(g,{},0);assert.deepEqual(e.download,before);assert.deepEqual(combatBounds(e),bounds);assert.equal(e.hp,e.maxHp);
 // A real player projectile damages the same native bounds while assembling.
 g.projectiles.push({id:900,team:'player',kind:'plasma',x:e.x-40,y:e.y-40,vx:2000,vy:0,radius:5,damage:1,life:1});step(g,2);assert.equal(e.hp,e.maxHp-1);
});
test('waiting bodies are absent and assembling pixels use a bounded clip before opaque completion',()=>{
 const g=game(),e=spawnDesertNativeTarget(g,{id:7,type:'soldier',x:600}),calls=[];
 const c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args]),set:(o,k,v)=>(o[k]=v,true)});
 drawInkEnemy(c,{},e);assert.equal(calls.filter(a=>a[0]==='drawImage').length,0);step(g,20);drawInkEnemy(c,{},e);assert.ok(calls.some(a=>a[0]==='clip'));assert.ok(calls.some(a=>a[0]==='drawImage'));assert.ok(calls.filter(a=>a[0]==='fillRect').length<40);step(g,60);calls.length=0;drawInkEnemy(c,{},e);assert.equal(calls.filter(a=>a[0]==='drawImage').length,1);assert.equal(c.globalAlpha,1);
});
test('an assembling body cannot deal contact damage and completes before contact resumes',()=>{
 const g=game();g.player.character='bt';g.player.x=600;g.maxX=600;const e=spawnDesertNativeTarget(g,{id:8,type:'turret',x:610});step(g,30);assert.equal(e.download.phase,'assembling');assert.equal(g.player.hp,100);step(g,60);assert.equal(e.download.phase,'solid');assert.ok(g.player.hp<100);
});
