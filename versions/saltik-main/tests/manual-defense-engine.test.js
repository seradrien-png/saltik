import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,terrainHeight} from '../src/engine.js';

const step=(g,input={},frames=1)=>{for(let i=0;i<frames;i++)update(g,input,1/60);};
function quiet(){const g=createGame();g.schedule=[];g.obstacles=[];g.platforms=[];g.pickups=[];g.player.melee.cooldown=99;return g;}
function incoming(g,{kind='plasma',x=g.player.x+70,radius=2,splash,...extra}={}){
  return {kind,team:'enemy',x,y:g.player.y-30,vx:-6000,vy:0,damage:8,radius,splash,life:1,...extra};
}

test('held rear protects contact before the cap, then becomes vulnerable while held',()=>{
 const g=quiet(),p=g.player;
 g.enemies=[{id:20,type:'turret',x:p.x-20,y:terrainHeight(p.x-20),hp:60,maxHp:60,cooldown:99,phase:0}];
 step(g,{shift:true},110);assert.equal(p.hp,100);assert.equal(p.evasion.active,true);
 step(g,{shift:true},20);assert.equal(p.evasion.active,false);assert.equal(p.hp,90);
});

test('held rear lets a crossing shot hit real cover and expire at its actual point',()=>{
  const g=quiet(),p=g.player;step(g,{shift:true});
  g.obstacles=[{id:'behind-cover',type:'rock',x:p.x-75,y:p.y,w:20,h:70,hp:100}];
  const shot=incoming(g,{kind:'bullet'});g.projectiles=[shot];update(g,{shift:true},1/30);
  assert.equal(p.hp,100);assert.equal(g.projectiles.length,0);assert.equal(shot.life,0);
  assert.equal(shot.x,p.x-63);assert.equal(g.events.filter(e=>e.type==='damage').length,0);
  g.obstacles=[];const expiring=incoming(g,{kind:'bullet',life:.02});g.projectiles=[expiring];
  update(g,{shift:true},1/30);assert.equal(p.hp,100);assert.equal(expiring.x,p.x-50);
});

test('held rear protects large and splash shots while a released shot can hit',()=>{
  for(const options of [{vertical:true,radius:16},{splash:110,life:.005,vx:0,vy:0}]){
    const g=quiet(),p=g.player;step(g,{shift:true});
    g.projectiles=[incoming(g,options.vertical?{x:p.x,y:p.y-100,vx:0,vy:6000,radius:16}:{x:p.x+70,splash:110,life:.005,vx:0,vy:0})];
    update(g,{shift:true},1/30);assert.equal(p.hp,100);
    g.projectiles=[incoming(g)];update(g,{},1/30);assert.equal(p.hp,92);
  }
});

test('the held rear stance cancels pending weapons and pause freezes its remaining time',()=>{
 const g=quiet(),p=g.player;step(g,{missile:true},6);assert.equal(p.mirvPending,true);p.fireSpent=1.2;
 Object.assign(p.melee,{phase:'windup',elapsed:0,targetKey:'enemy:99',cooldown:1});
 step(g,{shift:true,fire:true,missile:true,homing:true});
 assert.equal(p.mirvPending,false);assert.equal(p.melee.phase,'idle');assert.equal(p.fireSpent,1.2);
 const state=structuredClone(p.evasion);g.status='paused';step(g,{shift:true},120);assert.deepEqual(p.evasion,state);
 g.status='playing';step(g,{shift:true},25);assert.equal(g.stats.shots,0);assert.equal(g.stats.mirvs,0);
});
