import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,terrainHeight} from '../src/engine.js';

const step=(g,input={},frames=1)=>{for(let i=0;i<frames;i++)update(g,input,1/60);};
function quiet(){const g=createGame();g.schedule=[];g.obstacles=[];g.platforms=[];g.pickups=[];g.player.melee.cooldown=99;return g;}
function incoming(g,{kind='plasma',x=g.player.x+70,radius=2,splash,...extra}={}){
  return {kind,team:'enemy',x,y:g.player.y-30,vx:-6000,vy:0,damage:8,radius,splash,life:1,...extra};
}

test('held rear protects contact and projectiles for ten seconds, then release restores vulnerability immediately',()=>{
  const g=quiet(),p=g.player;
  g.enemies=[{id:20,type:'turret',x:p.x-20,y:terrainHeight(p.x-20),hp:60,maxHp:60,cooldown:99,phase:0}];
  step(g,{shift:true},600);assert.equal(p.hp,100);assert.equal(p.evasion.active,true);
  g.projectiles=[incoming(g)];step(g,{shift:true},2);
  assert.equal(p.hp,100);assert.ok(g.projectiles.length>0);
  step(g);assert.equal(p.evasion.active,false);assert.equal(p.hp,90);
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

test('a fresh manual parry press restarts hand recovery and a held button does not repeat',()=>{
  const g=quiet(),p=g.player;step(g,{deflect:true});assert.equal(p.deflect.active,true);
  step(g,{deflect:true},20);const elapsed=p.deflect.elapsed;
  step(g,{deflect:true});assert.ok(p.deflect.elapsed>elapsed);
  step(g,{});step(g,{deflect:true});assert.ok(p.deflect.elapsed<.04);
  step(g,{deflect:true},120);assert.equal(g.events.filter(e=>e.type==='parry-start').length,2);
  assert.equal(p.deflect.cooldown,0);
});

test('manual parry reflects one small projectile and cannot stop missiles or contact',()=>{
  const g=quiet(),p=g.player;step(g,{deflect:true});p.deflect.elapsed=.15;
  g.projectiles=[incoming(g,{x:p.x+60}),incoming(g,{x:p.x+61})];
  update(g,{},1/30);assert.equal(p.hp,92);assert.equal(g.events.filter(e=>e.type==='deflect').length,1);
  assert.equal(g.projectiles.length,1);assert.equal(g.projectiles[0].team,'player');
  for(const kind of ['enemy-missile','contact']){
    const actual=quiet(),actor=actual.player;step(actual,{deflect:true});actor.deflect.elapsed=.15;
    if(kind==='contact')actual.enemies=[{id:22,type:'turret',x:actor.x-20,y:actor.y,hp:60,maxHp:60,cooldown:99,phase:0}];
    else actual.projectiles=[incoming(actual,{kind,age:0,hp:1})];
    update(actual,{},1/30);assert.ok(actor.hp<100);assert.equal(actual.events.filter(e=>e.type==='deflect').length,0);
  }
});

test('rear has priority over simultaneous parry and both actions lock weapons while active',()=>{
  for(const action of ['shift','deflect']){
    const g=quiet(),p=g.player;step(g,{missile:true},6);assert.equal(p.mirvPending,true);p.fireSpent=1.2;
    Object.assign(p.melee,{phase:'windup',elapsed:0,targetKey:'enemy:99',cooldown:1});
    step(g,{[action]:true,fire:true,missile:true,homing:true});
    assert.equal(p.mirvPending,false);assert.equal(p.mirvIn,0);assert.equal(p.melee.phase,'idle');assert.equal(p.fireSpent,1.2);
    step(g,{[action]:true,fire:true,missile:true,homing:true},25);
    assert.equal(g.stats.shots,0);assert.equal(g.stats.mirvs,0);assert.equal(g.stats.homingSalvos,0);
  }
  const g=quiet();step(g,{shift:true,deflect:true});assert.equal(g.player.evasion.active,true);assert.equal(g.player.deflect.active,false);
  step(g,{});step(g,{deflect:true});assert.equal(g.player.deflect.active,true);
});

test('pause freezes defense clocks and a parry recovery remains vulnerable',()=>{
  for(const action of ['shift','deflect']){
    const g=quiet();step(g,{[action]:true});const before=structuredClone(g.player[action==='shift'?'evasion':'deflect']);
    g.status='paused';step(g,{[action]:true},90);assert.deepEqual(g.player[action==='shift'?'evasion':'deflect'],before);
  }
  const g=quiet();step(g,{deflect:true});g.player.deflect.elapsed=.3;g.projectiles=[incoming(g)];step(g);
  assert.equal(g.player.hp,92);assert.equal(g.events.filter(e=>e.type==='deflect').length,0);
});
