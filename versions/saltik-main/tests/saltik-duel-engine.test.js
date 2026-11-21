import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,terrainHeight,surfaceHeight} from '../src/engine.js';
import {createEnemySaltik,SALTIK_GUARD_HP} from '../src/enemy-saltik.js';
import {groundedBTDefeatPose} from '../src/grounded-bt-defeat.js';
function quiet(){const g=createGame();g.schedule=[];g.obstacles=[];g.platforms=[];g.pickups=[];g.player.melee.cooldown=99;return g;}
function saltik(g,{id=1,x=g.player.x+400,platformId=null,tier=0}={}){
 const y=platformId?surfaceHeight(g.platforms.find(p=>p.id===platformId),x):terrainHeight(x);
 return createEnemySaltik({id,x,platformId,tier},{y,random:0});
}
const step=(g,input={},frames=1)=>{for(let i=0;i<frames;i++)update(g,input,1/60);};
function strike(g,e,damage=100,kind='bullet'){
 g.projectiles.push({kind,team:'player',x:e.x-100,y:e.y-43,vx:12000,vy:0,damage,radius:3,life:1});step(g);
}
const noFinish=g=>{assert.equal(g.duel,null);assert.equal(g.events.some(v=>v.type.startsWith('duel-')||['enemy-guard','enemy-deflect'].includes(v.type)),false);};
test('oversized ranged damage defeats a BT on its support without guard or QTE',()=>{
 const g=quiet(),e=saltik(g);g.enemies=[e];strike(g,e);
 assert.equal(e.hp,0);assert.equal(e.groundedDefeat,true);assert.equal(e.neutralized,true);assert.equal(e.harmless,true);
 assert.equal(g.stats.kills,1);assert.equal(g.stats.score,250);assert.equal(g.stats.neutralized,1);noFinish(g);
});
test('damage crosses the former eight HP threshold normally and the final hit kills',()=>{
 const g=quiet(),e=saltik(g);g.enemies=[e];strike(g,e,32);assert.equal(e.hp,SALTIK_GUARD_HP);assert.equal(e.guard,false);
 strike(g,e,7);assert.equal(e.hp,1);strike(g,e,1);assert.equal(e.hp,0);assert.equal(g.stats.kills,1);noFinish(g);
});
test('oversized melee damage kills before corpse contact can hurt the player',()=>{
 const g=quiet(),p=g.player,e=saltik(g,{x:p.x+65});g.enemies=[e];e.hp=5;
 Object.assign(p.melee,{phase:'impact',elapsed:0,cooldown:99,targetKey:'enemy:1',hit:false});step(g);
 assert.equal(e.hp,0);assert.equal(e.groundedDefeat,true);assert.equal(p.hp,100);assert.equal(g.stats.kills,1);noFinish(g);
});
test('sequential queued explosions award one defeat and never damage the wreck again',()=>{
 const g=quiet(),e=saltik(g);g.enemies=[e];
 for(let i=0;i<3;i++)g.projectiles.push({kind:'grenade',team:'player',x:e.x,y:e.y-35,vx:0,vy:0,damage:100,radius:5,splash:100,life:.001});
 step(g);strike(g,e);assert.equal(e.hp,0);assert.equal(g.stats.kills,1);assert.equal(g.stats.score,250);noFinish(g);
});
test('close low-HP contact never starts a live grapple',()=>{
 const g=quiet(),e=saltik(g,{x:g.player.x+65});g.enemies=[e];e.hp=8;e.guard=true;
 step(g,{},12);noFinish(g);assert.equal(e.guard,false);assert.equal(e.groundedDefeat,undefined);
});
test('a wreck keeps its world position while combat and camera continue',()=>{
 const g=quiet(),e=saltik(g);g.enemies=[e];strike(g,e);const position=[e.x,e.y,e.defeatStartedAt];
 Object.assign(g.player,{x:e.x+3000,y:terrainHeight(e.x+3000),supportY:terrainHeight(e.x+3000)});step(g,{right:true},120);
 assert.ok(g.enemies.includes(e));assert.deepEqual([e.x,e.y,e.defeatStartedAt],position);assert.equal(g.stats.kills,1);noFinish(g);
});
test('collapse and damage flash use the paused game clock',()=>{
 const g=quiet(),e=saltik(g);g.enemies=[e];strike(g,e);step(g,{},6);
 const contacts=[{x:e.x-50,y:e.y},{x:e.x+50,y:e.y}],pose=groundedBTDefeatPose(e,g.time,{contacts}),time=g.time;
 g.status='paused';step(g,{},120);assert.equal(g.time,time);assert.deepEqual(groundedBTDefeatPose(e,g.time,{contacts}),pose);
 g.status='playing';step(g,{},60);assert.equal(groundedBTDefeatPose(e,g.time,{contacts}).progress,1);assert.equal(g.shake,0);
});
test('an elevated defeated BT remains on its own ledge with no player relocation',()=>{
 const g=quiet(),full=createGame(),route=full.platforms.find(r=>r.tier===1);g.platforms=[route];
 const e=saltik(g,{x:route.x1+200,platformId:route.id,tier:route.tier});g.enemies=[e];const player=[g.player.x,g.player.y];strike(g,e);
 assert.equal(e.groundedDefeat,true);assert.equal(e.y,surfaceHeight(route,e.x));assert.deepEqual([g.player.x,g.player.y],player);noFinish(g);
});
test('two successive BTs score independently without requiring any QTE input',()=>{
 const g=quiet(),first=saltik(g);g.enemies=[first];strike(g,first);
 const second=saltik(g,{id:2,x:first.x+200});g.enemies.push(second);strike(g,second);
 assert.equal(g.stats.kills,2);assert.equal(g.stats.score,500);assert.ok(g.enemies.includes(first));noFinish(g);
});
test('restarting creates a fresh level without old wrecks or defeat counters',()=>{
 const g=quiet(),e=saltik(g);g.enemies=[e];strike(g,e);const restarted=createGame();
 assert.deepEqual(restarted.enemies,[]);assert.equal(restarted.stats.kills,0);assert.equal(restarted.duel,null);
});
