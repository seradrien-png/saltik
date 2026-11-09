import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,terrainHeight} from '../src/engine.js';
import {createBossTank,bossGeometry} from '../src/boss-tank.js';
function arena(){const g=createGame();g.schedule=[];g.enemies=[];g.obstacles=[];g.pickups=[];g.bossActivated=true;g.boss=createBossTank(17520,terrainHeight);return g;}
test('the lowered integrated pod clears its own rider without cancelling its visible volley',()=>{
 const g=arena(),b=g.boss,p=g.player,r=bossGeometry(b);
 Object.assign(p,{x:b.x-90,y:r.roof.y,vy:0,onGround:true,bossSupport:'deck'});
 let missiles=[];
 for(let i=0;i<300;i++){update(g,{},1/60);if(!missiles.length)missiles=g.projectiles.filter(s=>s.sourceBossId===b.id);}
 assert.equal(b.podVolleysFired,1);assert.equal(missiles.length,8);
 assert.ok(missiles.every(s=>s.riderClearance));assert.equal(p.hp,100);assert.equal(p.bossSupport,null);
});
test('riding the boss never shields the player from another enemy missile',()=>{
 const g=arena(),b=g.boss,p=g.player;
 Object.assign(p,{x:b.x-90,y:bossGeometry(b).roof.y,vy:0,onGround:true,bossSupport:'deck'});
 g.projectiles=[{id:900,kind:'enemy-missile',team:'enemy',x:p.x,y:p.y-30,vx:0,vy:0,damage:9,radius:6,life:5,hp:1,age:0,sourceBossId:123,riderClearance:true}];
 update(g,{},1/60);assert.equal(p.hp,91);
});
