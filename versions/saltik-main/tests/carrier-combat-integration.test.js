import test from 'node:test';import assert from 'node:assert/strict';
import {createInkScene,updateInkScene,inkWeaponGeometry} from '../src/ink-scene.js';
import {createDroneCarrier,damageCarrierBay} from '../src/drone-carrier.js';
import {inkCarrierGeometry} from '../src/ink-carrier.js';
import {availableCarrierShutdown,navigationContext,MIRV_PREPARE} from '../src/engine.js';
function fixture(){const g=createInkScene();g.schedule=[];g.obstacles=[];g.platforms=[];g.pickups=[];g.groundAt=()=>600;Object.assign(g.player,{x:8700,y:600,supportY:600,invulnerable:99});g.maxX=8700;const e=createDroneCarrier({id:901,x:8940},{y:600,random:.3});e.cooldown=99;e.droneSlots.forEach(s=>s.recharge=99);g.enemies=[e];return {g,e};}
function tick(g,n,input={}){for(let i=0;i<n;i++)updateInkScene(g,input,1/60);}
test('one physical blast damages the carrier once rather than once per docking pad',()=>{const {g,e}=fixture();g.projectiles=[{id:1000,team:'player',kind:'grenade',x:e.x,y:e.y-60,vx:0,vy:0,life:.001,splash:150,damage:12}];const before=e.hp;tick(g,1);assert.equal(e.hp,before-12);});
test('all combat readiness remains targetable with intact equipment, then KO settles before unplugging',()=>{const {g,e}=fixture();damageCarrierBay(e,0,72);assert.equal(e.backDestroyed,false);assert.equal(availableCarrierShutdown(g),null);assert.ok(navigationContext(g).targets.some(t=>t.id===e.id));
 const r=inkCarrierGeometry(e,g.time).bodyBounds;g.projectiles=[{id:1001,team:'player',kind:'bullet',x:r.x-8,y:r.y+r.h*.55,vx:1500,vy:0,life:1,radius:2,damage:12}];tick(g,8);assert.equal(e.hp,36);assert.equal(e.immobilized,false);
 damageCarrierBay(e,0,99);assert.equal(e.hp,0);assert.equal(e.knockedOut,true);assert.equal(e.immobilized,true);assert.equal(availableCarrierShutdown(g),null);assert.ok(!navigationContext(g).targets.some(t=>t.id===e.id));assert.equal(g.stats.kills,0);
 tick(g,40);assert.ok(g.enemies.includes(e),'KO carrier must survive the ordinary dead-enemy cleanup');assert.ok(e.koElapsed>=.65);
 g.player.x=e.x-110;g.player.y=e.y;g.player.onGround=true;assert.equal(availableCarrierShutdown(g),e);
 tick(g,1);assert.ok(g.carrierShutdown,'settled KO should unplug automatically at grounded contact');assert.equal(e.shutdownSettled,true);assert.equal(e.firePose,0);
});
test('MIRV pivots through intermediate elevation without hydraulic lift and fires from its actual articulated mouth',()=>{const {g}=fixture();g.enemies=[];const p=g.player;tick(g,12,{missile:true});assert.equal(p.turretLift,0);assert.ok(p.cannonElevation>.1&&p.cannonElevation<.5,'the attached assembly passes progressively through its first angle');assert.equal(g.stats.mirvs,0);assert.ok(MIRV_PREPARE>=.5);
 tick(g,28,{missile:true});assert.equal(g.stats.mirvs,0,'holding only aims');tick(g,1,{missileReleased:true,missileHeld:false});assert.equal(g.stats.mirvs,1);assert.equal(p.turretLift,0);const shot=g.projectiles.find(s=>s.kind==='mirv'),pose=inkWeaponGeometry(p,g.time);assert.ok(shot);assert.ok(Math.hypot(shot.launchX-pose.cannon.x,shot.launchY-pose.cannon.y)<.001,'shot and native pivoted muzzle agree');
 tick(g,90);assert.equal(p.turretLift,0);assert.equal(p.cannonElevation,0);
});
test('pause freezes pivot preparation and evade cancels it without a delayed ghost shot',()=>{const {g}=fixture();g.enemies=[];tick(g,10,{missile:true});const before=[g.player.turretLift,g.player.cannonElevation,g.player.mirvPrepare];g.status='paused';tick(g,30);assert.deepEqual([g.player.turretLift,g.player.cannonElevation,g.player.mirvPrepare],before);g.status='playing';tick(g,1,{shift:true});tick(g,90,{});assert.equal(g.stats.mirvs,0);assert.equal(g.player.turretLift,0);});

test('a full-size docked drone rests its native lower chassis on the physical cradle',async()=>{const {inkEnemyGeometry}=await import('../src/ink-actors.js');const {g,e}=fixture();e.droneSlots[0].recharge=0;tick(g,2);const d=g.enemies.find(a=>a.carrierId===e.id);assert.equal(d.carrierState,'docked');const bottom=inkEnemyGeometry(d,g.time).sourcePoint([1868,501]),pad=inkCarrierGeometry(e,g.time).bays[d.bayIndex].muzzle;assert.ok(Math.abs(bottom.y-pad.y)<1,'normal drone lower chassis should meet the deck, not sink into it');});
test('carrier lateral gun physically aims its measured bore toward the player during its initial breathing window',()=>{for(const dir of [-1,1]){const {g,e}=fixture();e.dir=dir;g.player.x=e.x+dir*400;e.cooldown=.6;let shot;for(let i=0;i<70&&!shot;i++){tick(g,1);shot=g.projectiles.find(s=>s.team==='enemy'&&s.kind==='plasma');}assert.ok(shot);const hitY=shot.launchY+(g.player.x-shot.launchX)*shot.vy/shot.vx;assert.ok(Math.abs(hitY-(g.player.y-32))<8,'the native gun follows the player instead of firing over its head');}});
test('the knocked-out carrier keeps its intact chassis orientation when the hero passes behind it',()=>{const {g,e}=fixture();tick(g,1);const dir=e.dir;damageCarrierBay(e,0,1000);g.player.x=e.x-dir*200;tick(g,2);assert.equal(e.dir,dir);assert.equal(e.vx,0);assert.equal(e.immobilized,true);});
test('both shoulder platforms can visibly carry a normal drone together before staggered takeoff',()=>{const {g,e}=fixture();e.droneSlots.forEach((s,i)=>s.recharge=.6+i*.9);let twoDocked=false;for(let i=0;i<220;i++){tick(g,1);const docked=g.enemies.filter(d=>d.carrierId===e.id&&d.carrierState==='docked');if(docked.length===2){twoDocked=true;assert.ok(docked.every(d=>d.scale===1));assert.notEqual(docked[0].bayIndex,docked[1].bayIndex);}}assert.ok(twoDocked,'the two approved platforms should visibly hold their drones, not always launch before the other is loaded');});
test('simultaneous primary fire follows the actual coax axis while the MIRV housing is tilted',()=>{for(const dir of [-1,1]){const {g}=fixture();g.enemies=[];g.player.dir=dir;let samples=[];const native=g.weaponGeometry;g.weaponGeometry=(p,t)=>{const geo=native(p,t);samples.push(geo);return geo;};let checked=0;
 for(let frame=0;frame<75;frame++){const ids=new Set(g.projectiles.map(p=>p.id));samples=[];tick(g,1,{fire:true,missile:frame===0});for(const shot of g.projectiles.filter(s=>s.kind==='bullet'&&!ids.has(s.id))){const pose=samples.find(s=>Math.hypot(s.arm.x-shot.launchX,s.arm.y-shot.launchY)<1e-7);if(!pose?.turretArticulated||g.player.cannonElevation<.2)continue;const base=pose.coaxPoint(pose.coaxPart.pivot),dx=pose.arm.x-base.x,dy=pose.arm.y-base.y,n=Math.hypot(dx,dy),speed=Math.hypot(shot.vx,shot.vy);assert.ok(Math.abs(shot.vx/speed-dx/n)<1e-7&&Math.abs(shot.vy/speed-dy/n)<1e-7,'the shot cannot leave a raised painted gun sideways');assert.ok(Math.abs(speed-1025)<1e-7);checked++;}}
 assert.ok(checked>=3,'primary remains independent and keeps firing during the MIRV motion');}});

test('authored midpoint encounter has clear footing and actually advances and reverses with escort and normal drones',()=>{
 const g=createInkScene();Object.assign(g.player,{x:8550,y:g.groundAt(8550),supportY:g.groundAt(8550),invulnerable:999});g.maxX=8550;
 const xs=[],velocities=[],rounds=[];let carrier,drones=0;
 for(let i=0;i<900;i++){
  tick(g,1);carrier=g.enemies.find(e=>e.type==='carrier');if(!carrier)continue;
  xs.push(carrier.x);velocities.push(carrier.vx);drones=Math.max(drones,g.enemies.filter(d=>d.carrierId===carrier.id).length);
  for(const e of g.events)if(e.type==='enemyshot'&&e.enemyId===carrier.id)rounds.push(e);
  assert.ok(!g.obstacles.some(o=>o.hp>0&&Math.abs(o.x-carrier.x)<o.w/2+65&&Math.abs(o.y-carrier.y)<65),'carrier spawns inside or walks through a blocking rock');
 }
 assert.ok(carrier);assert.ok(Math.max(...xs)-Math.min(...xs)>60,'real encounter is stuck despite pure behavior test');
 assert.ok(velocities.some(v=>v<-20)&&velocities.some(v=>v>20),'both approach and retreat must occur on authored terrain');
 assert.ok(rounds.length>20&&drones===3);assert.ok(carrier.motionDistance>60);assert.ok(velocities.slice(420).filter(v=>Math.abs(v)>20).length>200,'escort must not freeze the later approach/reverse cycles');
});

test('automatic melee cannot shove the active carrier into intact cover and freeze its movement',()=>{
 const g=createInkScene();Object.assign(g.player,{x:8550,y:g.groundAt(8550),supportY:g.groundAt(8550),invulnerable:999});g.maxX=8550;
 let hits=0;
 for(let i=0;i<900;i++){
  tick(g,1,{right:i>=300&&i<620});const e=g.enemies.find(e=>e.type==='carrier');if(!e)continue;
  if(e.hp<e.maxHp)hits++;
  assert.ok(!g.obstacles.some(o=>o.hp>0&&Math.abs(o.x-e.x)<o.w/2+65&&Math.abs(o.y-e.y)<65),'melee knockback must stop before a blocking rock');
 }
 assert.ok(hits>0,'the actual automatic melee must land during this probe');
});

test('curved-ground shutdown holds the real connector throughout contact and extraction',async()=>{
 const {carrierShutdownGeometry}=await import('../src/carrier-shutdown-art.js');
 const g=createInkScene();Object.assign(g.player,{x:8800,y:g.groundAt(8800),supportY:g.groundAt(8800),invulnerable:999});g.maxX=8800;
 g.obstacles.find(o=>o.x===9140).hp=0;let e;
 for(let i=0;i<600;i++){tick(g,1);e=g.enemies.find(e=>e.type==='carrier');if(e?.x>9160)break;}
 assert.ok(e?.x>9160);damageCarrierBay(e,0,999);g.enemies=g.enemies.filter(a=>a===e||a.carrierId===e.id);Object.assign(g.player,{x:e.x-120,y:g.groundAt(e.x-120),supportY:g.groundAt(e.x-120),onGround:true});
 Object.assign(g.player,{x:e.x-300,y:g.groundAt(e.x-300),supportY:g.groundAt(e.x-300)});tick(g,40);assert.equal(availableCarrierShutdown(g),null);Object.assign(g.player,{x:e.x-120,y:g.groundAt(e.x-120),supportY:g.groundAt(e.x-120),onGround:true});assert.equal(availableCarrierShutdown(g),e);tick(g,1);let checks=0;
 for(let i=0;i<180&&g.carrierShutdown;i++){
  tick(g,1);const q=g.carrierShutdown;if(!q||q.phase==='approach')continue;
  const pose=carrierShutdownGeometry(q,e,{player:g.player,time:g.time}),hand=pose.handPoints[pose.activeHand];
  assert.ok(Math.hypot(hand.x-pose.target.x,hand.y-pose.target.y)<.05,'real action clock must keep the small claw touching its terminal');
  assert.ok(Math.hypot(pose.carrier.port.x-q.port.x,pose.carrier.port.y-q.port.y)<.05,'the drawn cable end must stay at the same connector throughout shutdown');checks++;
 }
 assert.ok(checks>50);assert.equal(e.neutralized,true);assert.equal(e.hp,0);
});
