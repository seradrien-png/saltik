import test from 'node:test';
import assert from 'node:assert/strict';
import {createMissileBattery,advanceMissileBattery,missileBatteryGeometry,BATTERY_ENCOUNTER_X} from '../src/missile-battery.js';
import {createGame,update,terrainHeight,combatTarget} from '../src/engine.js';
const steps=(g,input={},n=1)=>{for(let i=0;i<n;i++)update(g,input,1/60);};
function arena(offset=700){const g=createGame();g.schedule=[];g.obstacles=[];g.platforms=[];g.player.x=11500;g.player.y=terrainHeight(g.player.x);g.player.invulnerable=999;g.maxX=g.player.x;g.viewport={x:11100,y:0,w:1600,h:720};const e=createMissileBattery({id:900,x:g.player.x+offset},{y:terrainHeight(g.player.x+offset)});e.cooldown=99;g.enemies=[e];return {g,e};}
test('a missile Saltik enters the real foreground schedule at the open-ground encounter',()=>{
 const g=createGame(),entry=g.schedule.find(e=>e.type==='battery');assert.equal(entry.x,BATTERY_ENCOUNTER_X);
 g.player.x=entry.x-800;g.player.y=terrainHeight(g.player.x);g.maxX=g.player.x;steps(g);
 const e=g.enemies.find(e=>e.type==='battery');assert.ok(e);assert.equal(e.y,terrainHeight(e.x));assert.equal(e.hp,96);
 assert.equal(combatTarget(e).type,'battery');assert.ok(combatTarget(e).bounds.h>70);
});
test('native pods launch four locking shootable missiles after a warning, with nine seconds between salvos',()=>{
 const e=createMissileBattery({id:1,x:600},{y:550}),p={x:100,y:540,hp:100},shots=[],events=[];e.cooldown=0;
 for(let i=0;i<85;i++){const r=advanceMissileBattery(e,{player:p,dt:1/60,groundAt:x=>550+(x-600)*.08,inView:true});shots.push(...r.shots);events.push(...r.events);}
 assert.equal(events.filter(e=>e.type==='battery-warning').length,1);assert.equal(shots.length,4);
 const geo=missileBatteryGeometry(e);assert.ok(e.tilt>0);
 assert.ok(shots.every(s=>s.kind==='enemy-missile'&&s.hp===1&&s.locking&&s.team==='enemy'));
 assert.ok(shots.every(s=>geo.podMuzzles.some(p=>Math.hypot(s.x-p.x,s.y-p.y)<5)));
 for(let i=0;i<480;i++)assert.equal(advanceMissileBattery(e,{player:p,dt:1/60,groundAt:()=>550,inView:true}).shots.length,0);
 e.hp=0;assert.equal(advanceMissileBattery(e,{player:p,dt:5,inView:true}).shots.length,0);
});
test('a canceled offscreen warning has to be earned again on re-entry',()=>{
 const e=createMissileBattery({id:1,x:600},{y:550}),player={x:100,y:550,hp:100};e.cooldown=0;
 advanceMissileBattery(e,{player,dt:.2,inView:true});assert.ok(e.warning>0);
 advanceMissileBattery(e,{player,dt:.2,inView:false});assert.equal(e.warning,0);
 assert.equal(advanceMissileBattery(e,{player,dt:.1,inView:true}).shots.length,0);
});
for(const action of ['fire','homing','missile','support'])test(`${action} damages the foreground battery through ordinary combat`,()=>{
 const {g,e}=arena();steps(g,{[action]:true});steps(g,{},240);assert.ok(e.hp<e.maxHp,`${action}: ${e.hp}`);assert.equal(g.duel,null);
});
test('contact starts the authored three-press clash before ordinary melee',()=>{
 const {g}=arena(76);steps(g,{},12);assert.ok(g.batteryClash);assert.equal(g.stats.meleeHits,0);assert.equal(g.duel,null);
});
test('ordinary shots reduce armour but preserve the authored escape encounter',()=>{
 const {g,e}=arena(250);e.hp=15;g.projectiles.push({id:999,kind:'bullet',team:'player',x:e.x-40,y:e.y-45,vx:1200,vy:0,damage:8,radius:3,life:2});steps(g,{},4);assert.equal(e.hp,12);assert.equal(g.stats.kills,0);
});
test('allied support intercepts the foreground battery volley',()=>{
 const {g,e}=arena(950);e.cooldown=0;steps(g,{},85);assert.ok(g.projectiles.some(p=>p.kind==='enemy-missile'&&p.battery));
 steps(g,{support:true});steps(g,{},160);assert.ok(g.stats.interceptions>=1);
});
test('a timed hand deflection returns an actual battery rocket and disables its hostile lock',()=>{
 const {g,e}=arena(400),player=g.player;player.invulnerable=0;
 e.cooldown=0;const descriptors=[];
 for(let i=0;i<85;i++)descriptors.push(...advanceMissileBattery(e,{player,dt:1/60,inView:true}).shots);
 assert.equal(descriptors.length,4);
 g.enemies=[];steps(g,{deflect:true},7);
 const rocket={...descriptors[0],id:999,x:player.x+50,y:player.y-34,vx:-600,vy:0,age:0};g.projectiles=[rocket];
 steps(g,{},3);
 assert.equal(player.hp,100);assert.equal(g.events.filter(e=>e.type==='deflect').length,1);
 assert.equal(rocket.team,'player');assert.equal(rocket.locking,false);assert.ok(rocket.vx>0);
 const velocity={x:rocket.vx,y:rocket.vy},x=rocket.x;steps(g,{},8);
 assert.equal(rocket.vx,velocity.x);assert.equal(rocket.vy,velocity.y);assert.ok(rocket.x>x);assert.equal(player.hp,100);
});
