import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,terrainHeight,surfaceHeight} from '../src/engine.js';
import {createMissileBattery,advanceMissileBattery} from '../src/missile-battery.js';
import {createBossTank} from '../src/boss-tank.js';
import {advanceBatteryMovement,canClashBattery,startBatteryClash,advanceBatteryClash} from '../src/missile-campaign.js';
const step=(g,input={},n=1)=>{for(let i=0;i<n;i++)update(g,input,1/60);};
function arena(x=8200){const g=createGame();g.obstacles=[];g.platforms=[];g.pickups=[];g.schedule=g.schedule.filter(e=>e.type==='battery');g.player.x=x;g.player.y=terrainHeight(x);g.player.supportY=g.player.y;g.maxX=x;g.viewport={x:x-350,y:0,w:1280,h:720};return g;}
test('two distinct warned approach salvos occur before the foreground encounter',()=>{
 const g=arena();g.player.invulnerable=999;step(g);
 assert.ok(g.batteryEncounter?.warning>2);assert.equal(g.events.filter(e=>e.type==='artillery-warning').length,1);
 step(g,{},190);assert.equal(g.batteryEncounter.salvos,1);assert.equal(g.projectiles.filter(p=>p.longRange).length,4);
 step(g,{},650);assert.equal(g.batteryEncounter.salvos,1);
 g.player.x=10100;g.player.y=terrainHeight(10100);g.maxX=10100;g.viewport.x=9750;step(g,{},200);
 assert.equal(g.batteryEncounter.salvos,2);assert.equal(g.events.filter(e=>e.type==='artillery-warning').length,2);
 step(g,{},700);assert.equal(g.batteryEncounter.salvos,2);
});
test('warning interception uses the existing cooldown and actual missile collisions',()=>{
 const g=arena();step(g);step(g,{intercept:true});assert.equal(g.batteryEncounter?.interceptArmed,true);
 assert.ok(g.missileLink.cooldown>7);step(g,{intercept:true},180);
 assert.equal(g.missileLink.salvos,1);step(g,{},250);assert.equal(g.stats.interceptions,4);assert.equal(g.player.hp,100);
 assert.equal(g.missileLink.salvos,1);
});
test('cooldown blocks interception and a held press cannot activate when recharge ends',()=>{
 const g=arena();g.player.invulnerable=999;g.missileLink.cooldown=1;step(g,{intercept:true},100);
 assert.equal(g.batteryEncounter?.interceptArmed,false);assert.equal(g.missileLink.salvos,0);
 step(g,{intercept:false});step(g,{intercept:true});assert.equal(g.batteryEncounter.interceptArmed,true);
});
test('pause freezes warning and keeps one armed interception without duplicate launch',()=>{
 const g=arena();step(g);step(g,{intercept:true});const warning=g.batteryEncounter?.warning,cooldown=g.missileLink.cooldown;
 g.status='paused';step(g,{intercept:true},400);assert.equal(g.batteryEncounter.warning,warning);assert.equal(g.missileLink.cooldown,cooldown);
 g.status='playing';step(g,{intercept:true},200);assert.equal(g.missileLink.salvos,1);
});
test('one native artillery missile removes exactly half of full player armour',()=>{
 const g=arena(11500);g.schedule=[];const p=g.player;p.invulnerable=0;
 const e=createMissileBattery({id:9,x:p.x+400},{y:p.y});e.cooldown=0;const shots=[];
 for(let i=0;i<90;i++)shots.push(...advanceMissileBattery(e,{player:p,dt:1/60,inView:true}).shots);
 assert.equal(shots[0].damage,50);
 g.projectiles=[{...shots[0],id:999,x:p.x+55,y:p.y-35,vx:-600,vy:0,age:0}];step(g,{},8);
 assert.equal(p.hp,50);assert.ok(g.events.some(e=>e.type==='explosion'&&e.artillery&&e.radius>=90));
});
test('visible artillery enemy charges, struggles for three distinct efforts, then escapes',()=>{
 const g=arena(11500);g.schedule=[];g.player.invulnerable=999;
 const e=createMissileBattery({id:99,x:11800},{y:terrainHeight(11800)});g.enemies=[e];e.cooldown=99;
 step(g,{},20);assert.ok(e.x<11760);assert.equal(g.events.filter(e=>e.type==='long-range-saltik-detected').length,1);
 for(let i=0;i<300&&!g.batteryClash;i++)step(g);assert.ok(g.batteryClash);
 step(g,{},35);assert.equal(g.batteryClash.phase,'qte');
 step(g,{qte:true},120);assert.equal(g.batteryClash.taps,1);
 step(g,{});step(g,{qte:true});step(g,{});step(g,{qte:true});assert.equal(g.batteryClash.taps,3);
 assert.equal(g.batteryClash.phase,'qte');step(g,{},110);
 assert.equal(g.batteryClash,null);assert.ok(e.retreating);const x=e.x;step(g,{},30);
 assert.ok(e.x>x);assert.ok(g.countermeasures.some(f=>f.team==='enemy'));assert.ok(g.events.some(v=>v.type==='escape-smoke'));
 assert.equal(g.duel,null);assert.equal(g.events.filter(v=>v.type==='duel-throw').length,0);
});
test('boss ally arrives, protects with real decoys and never fires autonomously',()=>{
 const g=arena(16700);g.schedule=[];g.bossActivated=true;g.boss=createBossTank(17520,terrainHeight);g.boss.cooldown=999;g.player.invulnerable=999;
 step(g,{},180);assert.ok(g.missileCompanion?.active);assert.equal(g.missileLink.salvos,0);
 g.projectiles.push({id:901,kind:'enemy-missile',team:'enemy',bossRocket:true,x:g.player.x+400,y:g.player.y-100,vx:-250,vy:0,damage:9,radius:6,life:7,hp:1,locking:true,age:.5,trail:[]});
 step(g);assert.ok(g.countermeasures.some(f=>f.team==='player'));assert.ok(g.projectiles.some(p=>p.decoyId));
 step(g,{},240);assert.ok(g.stats.flareDiversions>=1);assert.equal(g.missileLink.salvos,0);
 step(g,{support:true});step(g);assert.equal(g.missileLink.salvos,1);
 const flight=g.missileLink.flights[0];assert.ok(Math.abs(flight.origin.x-g.missileCompanion.x)<70);
});
test('enemy escape flares divert existing player guided missiles away from the runner',()=>{
 const g=arena(11500);g.schedule=[];g.player.invulnerable=999;
 const e=createMissileBattery({id:99,x:11700},{y:terrainHeight(11700)});e.retreating=true;e.retreatElapsed=0;e.retreatOrigin=e.x;e.retreatDir=1;g.enemies=[e];
 step(g,{homing:true});step(g,{},8);assert.ok(g.countermeasures.some(f=>f.team==='enemy'));
 assert.ok(g.projectiles.some(p=>p.kind==='homing'&&p.decoyId));
});
test('a charging battery leaves a higher route by its edge to reach the player below',()=>{
 const g=arena(11200),route=createGame().platforms.find(r=>r.tier===1);g.platforms=[route];
 const x=(route.x1+route.x2)/2;g.player.x=x;g.player.y=terrainHeight(x);g.player.platformId=null;
 const e=createMissileBattery({id:12,x,platformId:route.id,tier:route.tier},{y:terrainHeight(x)-120});e.engaged=true;e.y=surfaceHeight(route,x);
 for(let i=0;i<900&&e.platformId!==null;i++)advanceBatteryMovement(g,e,1/60,true);
 assert.equal(e.platformId,null);assert.ok(Math.abs(e.x-g.player.x)>70,'leave the physical ledge before dropping');
});
test('boss countermeasures protect actual vulnerable player from an entire homing salvo',()=>{
 const g=arena(16700);g.schedule=[];g.bossActivated=true;g.boss=createBossTank(17520,terrainHeight);g.boss.chargeClock=99;g.boss.weaponElapsed=-100;
 step(g,{},120);g.player.invulnerable=0;
 for(let i=0;i<8;i++)g.projectiles.push({id:1000+i,kind:'enemy-missile',team:'enemy',bossRocket:true,x:g.player.x+700,y:g.player.y-180+i*14,vx:-225,vy:-40+i*10,damage:9,radius:6,life:7,hp:1,locking:true,age:.5,trail:[]});
 step(g,{},350);assert.equal(g.player.hp,100);assert.ok(g.stats.flareDiversions>=8);assert.equal(g.projectiles.length,0);assert.equal(g.missileLink.salvos,0);
});

test('companion stays outside the tank hull when the player climbs aboard',()=>{
 const g=arena(17520);g.schedule=[];g.bossActivated=true;g.boss=createBossTank(17520,terrainHeight);g.boss.chargeClock=99;g.boss.weaponElapsed=-100;
 g.player.bossSupport='deck';g.player.y=g.boss.y-85;step(g,{},170);
 assert.ok(g.missileCompanion.x<g.boss.x-225);
});
test('a player advancing continuously receives both approach salvos before contact',()=>{
 const g=arena(8100);g.player.invulnerable=999;g.viewport=g._defaultViewport;
 for(let i=0;i<1500&&!g.batteryClash;i++)step(g,{right:true});
 assert.ok(g.batteryClash);assert.equal(g.batteryEncounter.salvos,2);
});
for(const [routeId,x] of [['bridge-3',10450],['ledge-3',11150],['ledge-3',11120]])test(`artillery reaches actual supported contact on ${routeId} at ${x}`,()=>{
 const g=arena();g.platforms=createGame().platforms;const route=g.platforms.find(r=>r.id===routeId);Object.assign(g.player,{x,y:surfaceHeight(route,x),platformId:routeId,tier:route.tier});
 const e=createMissileBattery({id:91,x:11850},{y:terrainHeight(11850)});
 for(let i=0;i<2400&&!canClashBattery(g,e);i++)advanceBatteryMovement(g,e,1/60,true);
 assert.ok(canClashBattery(g,e),JSON.stringify({x:e.x,y:e.y,platform:e.platformId}));assert.equal(e.platformId,routeId);
});
test('ledge-edge clash stages both sets of feet on the same actual route without a vertical snap',()=>{
 const g=arena();g.platforms=createGame().platforms;const route=g.platforms.find(r=>r.id==='ledge-3');
 Object.assign(g.player,{x:11150,y:surfaceHeight(route,11150),platformId:route.id,tier:route.tier});
 const e=createMissileBattery({id:92,x:11170,platformId:route.id,tier:route.tier},{y:surfaceHeight(route,11170)});e.engaged=true;g.enemies=[e];
 const y=e.y;startBatteryClash(g,e);assert.ok(Math.abs(e.y-y)<1);
 for(let i=0;i<30;i++)advanceBatteryClash(g,false,1/60);
 for(const a of [g.player,e]){assert.ok(a.x-40>=route.x1&&a.x+40<=route.x2);assert.equal(a.y,surfaceHeight(route,a.x));}
 assert.ok(Math.abs(Math.abs(e.x-g.player.x)-80)<.1);
});
test('boss arrival is local even if a camera transition still reports the start of the level',()=>{
 const g=arena(16700);g.schedule=[];g.viewport={x:0,y:0,w:1280,h:720};g.player.invulnerable=999;
 step(g);assert.ok(g.missileCompanion.x>g.player.x-800);step(g,{},230);
 assert.ok(g.missileCompanion.x>g.player.x+90,'visible ahead of the directional pad');
});
