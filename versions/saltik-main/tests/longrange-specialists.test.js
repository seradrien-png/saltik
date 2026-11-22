import test from 'node:test';import assert from 'node:assert/strict';
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
import {createEnemySaltik,SALTIK_HP} from '../src/enemy-saltik.js';
import {advanceLongrange,LONGRANGE_TUNING} from '../src/longrange-enemy.js';
import {specialistGeometry,drawSpecialist} from '../src/enemy-specialists.js';
import {groundedBTDefeatPose,BT_COLLAPSE_SECONDS,drawNativeKOEyes} from '../src/grounded-bt-defeat.js';
test('all enemy Saltiks receive precisely twenty percent more base armor',()=>{assert.equal(SALTIK_HP,48);for(const enemyModel of [undefined,'rust-striker','longrange']){const e=createEnemySaltik({x:500,enemyModel},{y:600});assert.equal(e.hp,48);assert.equal(e.maxHp,48);}});
test('campaign BT enemies keep original geometry while playable BT defaults to its classic costume',()=>{const g=createInkScene({level:5,character:'bt'});g.player.invulnerable=999;for(let i=0;i<3;i++)updateInkScene(g,{},1/60);assert.equal(g.player.btVariant,undefined);for(const e of g.enemies.filter(e=>e.type==='saltik'&&!e.enemyModel))assert.notEqual(e.btVariant,'desert');});
test('longrange uses physical alternating pods beyond ordinary gun range and death cancels queued launches',()=>{const e=createEnemySaltik({id:'lr',x:2400,enemyModel:'longrange'},{y:600}),g={player:{x:200,y:600,hp:100},projectiles:[],time:0},shots=[];for(let i=0;i<8*60;i++){g.time=i/60;shots.push(...advanceLongrange(e,{g,dt:1/60,groundAt:()=>600}).shots);}assert(shots.length>=6);assert(shots.every(s=>s.kind==='enemy-missile'&&s.team==='enemy'&&s.hp===1&&s.life>=12&&s.sourceEnemyId==='lr'&&s.vy<0));assert(new Set(shots.map(s=>s.x)).size>=4);e.hp=0;for(let i=0;i<300;i++)assert.equal(advanceLongrange(e,{g,dt:1/60,groundAt:()=>600}).shots.length,0);assert.deepEqual(e.longrangePending,[]);});
test('longrange pauses, respects range and projectile cap without invisible hits',()=>{const e=createEnemySaltik({x:2400,enemyModel:'longrange'},{y:600}),g={player:{x:200,y:600,hp:100},projectiles:[],time:1};advanceLongrange(e,{g,dt:1,groundAt:()=>600});const clock=e.longrangeClock,pending=structuredClone(e.longrangePending);advanceLongrange(e,{g,dt:0,groundAt:()=>600});assert.equal(e.longrangeClock,clock);assert.deepEqual(e.longrangePending,pending);g.projectiles=Array.from({length:LONGRANGE_TUNING.maxHostile},()=>({team:'enemy',life:1}));for(let i=0;i<600;i++)assert.equal(advanceLongrange(e,{g,dt:1/60,groundAt:()=>600}).shots.length,0);assert.equal(g.player.hp,100);});
test('specialist firing apertures belong to their own painting in both facings; chassis settles without body tint',()=>{for(const enemyModel of ['rust-striker','longrange'])for(const dir of [-1,1]){const e={x:500,y:600,dir,enemyModel,hp:48},g=specialistGeometry(e);assert.equal(g.podSlots.length,8);for(const slot of g.podSlots){assert(slot.muzzle.y<600);assert.equal(slot.axis.y,-.975);}const flat=specialistGeometry({...e,hp:0,groundedDefeat:true,defeatStartedAt:0},2);assert(flat.drop>0);assert.equal(flat.tilt,g.tilt);for(const l of flat.legs)assert(Math.abs(l.contact.y-600)<1e-6);const filters=[],c=new Proxy({globalAlpha:1},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{if(k==='filter')filters.push(v);t[k]=v;return true;}});drawSpecialist(c,{},e);assert.deepEqual(filters,[]);}});
test('shutdown remains visibly animated over one second and fills only measured eye apertures',()=>{assert(BT_COLLAPSE_SECONDS>=1);const e={defeatStartedAt:0};assert(groundedBTDefeatPose(e,.2).settled<groundedBTDefeatPose(e,.8).settled);const ellipses=[],c=new Proxy({globalAlpha:1},{get:(t,k)=>k in t?t[k]:(...a)=>{if(k==='ellipse')ellipses.push(a);}});drawNativeKOEyes(c,[[100,200,20,25]],{progress:1});assert.equal(ellipses.length,1);assert.deepEqual(ellipses[0].slice(0,4),[100,200,17,21.25]);});

test('destroying a Longrange with an actual player projectile stops queued and future missile launches',async()=>{
 const {update,combatBounds}=await import('../src/engine.js');
 const g=createInkScene();g.schedule=[];g.nextSpawn=0;g.disableBoss=true;g.groundAt=()=>600;g.isGroundGap=()=>false;g.platforms=[];g.obstacles=[];g.worldSolids=[];g.pickups=[];g.projectiles=[];g.player.x=300;g.player.y=600;g.player.invulnerable=999;
 const e=createEnemySaltik({id:'real-longrange',x:1500,enemyModel:'longrange'},{y:600});g.enemies=[e];
 for(let i=0;i<180;i++)update(g,{},1/60);assert(g.projectiles.some(s=>s.sourceEnemyId===e.id));
 const b=combatBounds(e,g.time);g.projectiles.push({kind:'bullet',team:'player',x:b.x+b.w*.5,y:b.y+b.h*.5,vx:0,vy:0,damage:48,radius:3,life:1});update(g,{},1/60);
 assert.equal(e.hp,0);assert(e.groundedDefeat);assert.deepEqual(e.longrangePending,[]);const last=g.nextProjectileId;
 for(let i=0;i<600;i++)update(g,{},1/60);assert.equal(g.nextProjectileId,last);assert.equal(g.stats.kills,1);
});

test('authored Longrange posts predeploy at long distance instead of waiting for the ordinary screen edge',()=>{
 const g=createInkScene({level:1});g.player.invulnerable=999;
 const post=g.schedule.find(e=>e.enemyModel==='longrange');assert.equal(post.spawnAt,post.x-2400);
 g.player.x=post.x-3000;g.player.y=g.groundAt(g.player.x);g.maxX=g.player.x;
 updateInkScene(g,{},1/60);const active=g.enemies.find(e=>e.id===post.id);assert(active);assert(active.x-g.player.x>2500);assert.equal(active.x,post.x);
 const count=g.enemies.filter(e=>e.id===post.id).length;assert.equal(count,1);
});
