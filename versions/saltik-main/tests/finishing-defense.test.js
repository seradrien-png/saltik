import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update} from '../src/engine.js';
import {createEvasionState,beginEvasion,advanceEvasion,endEvasion,isEvasionProtected} from '../src/evasion.js';
const quiet=()=>{const g=createGame();g.schedule=[];g.platforms=[];g.obstacles=[];g.pickups=[];g.player.melee.cooldown=99;return g;};
const tick=(g,input={},n=1)=>{for(let i=0;i<n;i++)update(g,input,1/120);};
test('held evasion expires at two seconds and requires actual release before a new hold',()=>{
 const g=quiet(),p=g.player;tick(g,{shift:true},240);
 assert.equal(p.evasion.active,false);assert.equal(isEvasionProtected(p.evasion),false);
 tick(g,{shift:true},360);assert.equal(p.evasion.active,false);assert.equal(g.events.filter(e=>e.type==='shift').length,1);
 tick(g);tick(g,{shift:true});assert.equal(p.evasion.active,true);assert.equal(g.events.filter(e=>e.type==='shift').length,2);
 tick(g);assert.equal(p.evasion.active,false);
});
test('swept evasion protection ends at exact two-second impact fraction',()=>{
 const s=createEvasionState();beginEvasion(s);advanceEvasion(s,1.99);
 assert.equal(isEvasionProtected(s,{dt:.02,fraction:.25}),true);
 assert.equal(isEvasionProtected(s,{dt:.02,fraction:.75}),false);
 advanceEvasion(s,.02);assert.equal(s.active,false);assert.equal(beginEvasion(s),false);
 endEvasion(s);assert.equal(beginEvasion(s),true);
});
test('removed player deflect input cannot reflect a shot, lock a weapon or start a parry',()=>{
 const g=quiet(),p=g.player;tick(g,{deflect:true,fire:true},18);
 assert.ok(g.stats.shots>0);assert.equal(g.events.some(e=>e.type==='parry-start'),false);
 g.projectiles=[{kind:'plasma',team:'enemy',x:p.x+70,y:p.y-30,vx:-6000,vy:0,damage:8,radius:2,life:1}];
 tick(g,{deflect:true},2);assert.equal(p.hp,92);assert.equal(g.events.some(e=>e.type==='deflect'),false);
});

test('a projectile already crossing the body hits when the rear hold expires inside its swept interval',()=>{
 const g=quiet(),p=g.player;tick(g,{shift:true});p.evasion.elapsed=1.99;
 g.projectiles=[{kind:'plasma',team:'enemy',x:p.x+29,y:p.y-30,vx:-1200,vy:0,damage:8,radius:2,life:1}];
 update(g,{shift:true},.02);assert.equal(p.hp,92);
});
