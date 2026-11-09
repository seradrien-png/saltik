import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,navigationContext,availableCarrierShutdown} from '../src/engine.js';
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
import {createEnemySaltik,advanceEnemySaltik,SALTIK_GUARD_HP} from '../src/enemy-saltik.js';
import {createDroneCarrier,damageDroneCarrier} from '../src/drone-carrier.js';
import {carrierShutdownPlacement} from '../src/ink-carrier.js';

function quiet(ink=true){
 const g=ink?createInkScene():createGame();g.schedule=[];g.obstacles=[];g.platforms=[];g.pickups=[];g.groundAt=()=>600;
 Object.assign(g.player,{x:8700,y:600,supportY:600,invulnerable:999});g.maxX=8700;return g;
}
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)updateInkScene(g,input,1/60);};
function completeDuel(g,e){
 e.hp=SALTIK_GUARD_HP;e.guard=true;g.enemies=[e];tick(g,30);
 assert.equal(g.duel?.phase,'qte');
 for(let i=0;i<5;i++){tick(g,1,{qte:false});tick(g,1,{qte:true});}
 tick(g,210);assert.equal(g.duel,null);
}

test('the Ink duel neutralizes a Saltik once while preserving its original guard HP',()=>{
 const g=quiet(),e=createEnemySaltik({id:71,x:g.player.x+65},{y:600,random:0});
 completeDuel(g,e);
 assert.equal(e.hp,8);assert.equal(e.neutralized,true);assert.equal(e.harmless,true);assert.equal(e.duelFinished,true);
 assert.equal(g.stats.kills,0);assert.equal(g.stats.neutralized,1);assert.equal(g.stats.score,250);
 assert.equal(g.events.filter(event=>event.type==='duel-impact').length,1);
 assert.equal(g.events.filter(event=>event.type==='explosion').length,0);
 assert.ok(!navigationContext(g).targets.some(target=>target.id===e.id),'a defeated Saltik must not attract another guided lock');
 Object.assign(g.player,{x:e.x,y:e.y,onGround:true,invulnerable:0});
 const oldX=e.x,oldHp=g.player.hp;g.events=[];tick(g,90,{homing:true});
 assert.equal(g.duel,null);assert.equal(e.hp,8);assert.equal(e.x,oldX);assert.equal(g.player.hp,oldHp);assert.equal(g.stats.neutralized,1);
 assert.equal(g.stats.homingSalvos,0);assert.equal(g.events.filter(event=>event.type.startsWith('saltik-')||event.type==='enemyshot').length,0);
});

test('a neutralized Saltik cannot run its independent combat or movement controller',()=>{
 const e=createEnemySaltik({id:72,x:9000},{y:600,random:0});e.neutralized=true;e.harmless=true;e.cooldown=0;
 const x=e.x,result=advanceEnemySaltik(e,{player:{x:8700,y:600,hp:100},dt:2,movement:{minX:8000,maxX:10000,groundAt:()=>600}});
 assert.deepEqual(result,{shots:[],events:[]});assert.equal(e.x,x);
});

test('automatic carrier unplug requires a settled KO, a neutralized guardian, and the same grounded support',()=>{
 const g=quiet(),e=createDroneCarrier({id:81,x:8940,guardianId:82},{y:600,random:0}),guard=createEnemySaltik({id:82,x:8800},{y:600,random:0});
 g.enemies=[e,guard];damageDroneCarrier(e,999);g.player.x=e.x-300;
 assert.equal(availableCarrierShutdown(g),null);guard.neutralized=true;guard.harmless=true;tick(g,20);assert.equal(g.carrierShutdown,null);
 tick(g,25);Object.assign(g.player,{x:e.x-110,platformId:'overhead',tier:1});assert.equal(g.carrierShutdown,null);
 assert.equal(availableCarrierShutdown(g),null);assert.ok(g.enemies.includes(e));
 Object.assign(g.player,{platformId:null,tier:0,onGround:false});assert.equal(availableCarrierShutdown(g),null);
 Object.assign(g.player,{onGround:true});assert.equal(availableCarrierShutdown(g),e);
 const clock=e.koElapsed;g.flash=.2;g.shake=6;g.player.muzzle=.1;tick(g,1);
 assert.ok(g.carrierShutdown);assert.equal(e.shutdownSettled,true);assert.equal(e.koElapsed,clock);assert.equal(g.flash,0);assert.equal(g.player.muzzle,0);
 tick(g,160);assert.equal(e.neutralized,true);assert.equal(e.hp,0);assert.ok(g.enemies.includes(e));
 assert.equal(g.stats.kills,0);assert.equal(g.stats.neutralized,1);assert.equal(g.events.filter(event=>event.type==='carrier-disconnected').length,1);
 tick(g,120);assert.equal(g.events.filter(event=>event.type==='carrier-disconnected').length,1);
});

test('automatic unplug uses clear front access when the real midpoint rock blocks the rear stance',()=>{
 const g=createInkScene();g.schedule=[];g.pickups=[];
 const e=createDroneCarrier({id:85,x:8940},{y:g.groundAt(8940),random:0});damageDroneCarrier(e,999);e.koElapsed=1;g.enemies=[e];
 Object.assign(g.player,{x:8820,y:g.groundAt(8820),supportY:g.groundAt(8820),onGround:true,invulnerable:999});g.maxX=8820;
 const rock=g.obstacles.find(o=>o.x===9140);assert.ok(rock?.hp>0);
 const before=structuredClone(e);assert.equal(availableCarrierShutdown(g),e);assert.deepEqual(e,before,'checking availability must not move or select an access side on the live carrier');
 tick(g,1);assert.ok(g.carrierShutdown);assert.equal(e.serviceAccessSide,'front');assert.ok(g.carrierShutdown.targetX<e.x,'the approach must stay in front of the carrier instead of crossing live cover');
 tick(g,160);assert.equal(g.carrierShutdown,null);assert.equal(e.neutralized,true);assert.equal(rock.hp,10);
 const hero=g.weaponGeometry(g.player,g.time).bounds;
 for(const obstacle of g.obstacles.filter(o=>o.hp>0))assert.ok(hero.x+hero.w<=obstacle.x-obstacle.w/2||hero.x>=obstacle.x+obstacle.w/2||hero.y+hero.h<=obstacle.y-obstacle.h||hero.y>=obstacle.y,'the finished native hero must not overlap live cover');
 assert.ok(g.player.supportPose.contacts.every(contact=>contact.grounded),'all native wheels must have real terrain support');
});

test('automatic unplug waits when live cover blocks both service stances',()=>{
 const g=quiet(),e=createDroneCarrier({id:86,x:8940},{y:600,random:0});damageDroneCarrier(e,999);e.koElapsed=1;g.enemies=[e];
 Object.assign(g.player,{x:e.x-110,y:600,supportY:600,onGround:true});
 for(const side of ['rear','front']){
  const placement=carrierShutdownPlacement({...e,serviceAccessSide:side,shutdownSettled:true,shuttingDown:true});
  g.obstacles.push({id:`cover-${side}`,type:'rock',x:placement.x,y:600,w:88,h:62,hp:10,hit:0});
 }
 const before=structuredClone(e);assert.equal(availableCarrierShutdown(g),null);assert.deepEqual(e,before);
 tick(g,1,{bossAction:true});assert.equal(g.carrierShutdown,null);assert.equal(e.shuttingDown,undefined);assert.ok(g.obstacles.every(o=>o.hp===10));
});

test('service access rejects a rear stance whose outer wheel would hang over unsupported terrain',()=>{
 const g=quiet(),e=createDroneCarrier({id:87,x:8940},{y:600,random:0});damageDroneCarrier(e,999);e.koElapsed=1;g.enemies=[e];
 g.groundAt=x=>x>9120&&x<9160?NaN:600;
 Object.assign(g.player,{x:e.x-110,y:600,supportY:600,onGround:true});
 assert.equal(availableCarrierShutdown(g),e);tick(g,1);
 assert.ok(g.carrierShutdown);assert.equal(e.serviceAccessSide,'front');
});

test('Ink player defeat is nonexplosive while the legacy game retains its existing defeat',()=>{
 for(const ink of [true,false]){
  const g=quiet(ink);Object.assign(g.player,{hp:1,invulnerable:0});
  g.projectiles=[{id:88,team:'enemy',kind:'plasma',x:g.player.x,y:g.player.y-35,vx:0,vy:0,damage:100,radius:5,life:1}];
  update(g,{},1/60);assert.equal(g.status,'dead');assert.equal(g.player.hp,0);
  assert.equal(g.events.filter(event=>event.type==='explosion').length,ink?0:1);
  if(ink)assert.equal(g.player.knockedOut,true);
 }
});

test('the Saltik rule leaves other Ink enemies and terrain destructible',()=>{
 const g=quiet();g.enemies=[{id:91,type:'crate',x:9000,y:600,hp:1,maxHp:1,hit:0,firePose:0,phase:0}];
 g.obstacles=[{id:'cover',type:'barricade',x:9300,y:600,w:80,h:45,hp:1,hit:0}];
 g.projectiles=[{id:92,team:'player',kind:'grenade',x:9150,y:565,vx:0,vy:0,life:.001,splash:230,damage:100}];
 tick(g,1);assert.equal(g.enemies.length,0);assert.equal(g.obstacles[0].hp,0);assert.equal(g.stats.kills,1);assert.equal(g.stats.obstacles,1);
 assert.ok(g.events.some(event=>event.type==='explosion'));
});
