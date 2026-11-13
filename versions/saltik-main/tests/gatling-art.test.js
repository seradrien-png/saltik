import test from 'node:test';import assert from 'node:assert/strict';
import {createInkScene,inkWeaponGeometry} from '../src/ink-scene.js';
import {inkSaltikGeometry,drawInkSaltik} from '../src/ink-saltik.js';
import {sceneArtImages} from '../src/enemy-styles.js';
import {GATLING_NATIVE} from '../src/gatling-art.js';
test('Gatling has two measured rotary mouths and eight pod mouths, all mirrored in world space',()=>{
 const g=createInkScene({character:'gatling'}),p=g.player;Object.assign(p,{x:1000,y:540,onGround:true,supportPose:null,supportY:540});const a=inkWeaponGeometry(p,0);
 assert.equal(a.gatlingMuzzles.length,2);assert.equal(a.rocketMuzzles.length,8);assert.notDeepEqual(a.arm,a.cannon);assert.equal(GATLING_NATIVE.guns.length,2);
 const b=inkWeaponGeometry({...p,dir:-1,turn:null},0);for(let i=0;i<2;i++){assert.ok(Math.abs(a.gatlingMuzzles[i].x+b.gatlingMuzzles[i].x-2000)<1e-8);assert.ok(Math.abs(a.gatlingMuzzles[i].y-b.gatlingMuzzles[i].y)<1e-8);}
});
test('all missions retain Gatling identity, their own native scale and distinct material selection',()=>{
 const snow={},moon={},velvet={},striker={},images={'ink-saltik':striker,'gatling-snow':snow,'gatling-lunar':moon,'gatling-velvet':velvet};
 for(const [level,image,scale]of[[1,snow,1],[2,moon,1],[3,velvet,1]]){const g=createInkScene({level,character:'gatling'});assert.equal(g.player.character,'gatling');assert.equal(g.player.artScale??1,scale);assert.equal(sceneArtImages(images,level,'gatling')['ink-saltik'],image);assert.equal(sceneArtImages(images,level,'gatling')['ink-turn'],null);assert.ok(inkWeaponGeometry(g.player,0).bounds.h>0);}
 assert.equal(sceneArtImages(images,1)['ink-saltik'],striker);
});
test('native Gatling wheel contacts plant on a real slope and arm grips reach world targets',()=>{
 const floor=x=>540+.1*(x-1000),p={...createInkScene({character:'gatling'}).player,x:1000,y:540,onGround:true,supportY:540,supportPose:null,tilt:Math.atan(.1)};
 let geo=inkSaltikGeometry(p,{time:0,sampleGround:floor});for(const leg of geo.nativeLegs)assert.ok(Math.abs(leg.contact.y-floor(leg.contact.x))<1.5);
 const targets=geo.nativeArms.map(a=>{const t=a.handPoint(a.hand);return{x:t.x+8,y:t.y-8};});geo=inkSaltikGeometry({...p,gatlingGripTargets:targets},{time:0,sampleGround:floor});for(let i=0;i<2;i++){const t=geo.nativeArms[i].handPoint(geo.nativeArms[i].hand);assert.ok(Math.hypot(t.x-targets[i].x,t.y-targets[i].y)<1.5);}
});
test('native gun face spin and hot barrel effects render without Striker turn or mortar atlas',()=>{
 const p={...createInkScene({character:'gatling'}).player,gatling:{firing:true,heat:1,spin:2.3,cooldown:2,rocketIndex:8,rocketRecharge:2,gunIndex:1},muzzle:.07},rotations=[],images=[],rects=[];
 const c=new Proxy({globalAlpha:1,save(){},restore(){},rotate(a){rotations.push(a)},drawImage(...a){images.push(a)},fillRect(...a){rects.push(a)}},{get:(o,k)=>k in o?o[k]:()=>{}}),native={id:'gatling'},turn={id:'forbidden-Striker-turn'};
 const geo=drawInkSaltik(c,native,p,{time:2,turnImage:turn});assert.equal(geo.gatlingMuzzles.length,2);assert.ok(rotations.includes(2.3));assert.ok(rects.length>=2);assert.ok(images.every(a=>a[0]===native));
});

test('boss, duel and disconnect poses keep the Gatling native sprite instead of slicing a Striker mortar',async()=>{
 const {drawInkBossBreach,drawInkDuelWorld}=await import('../src/ink-encounters.js'),{drawCarrierShutdown}=await import('../src/carrier-shutdown-art.js'),{createBossTank}=await import('../src/boss-tank.js'),{createBossBreach}=await import('../src/boss-breach.js'),{createSaltikDuel}=await import('../src/saltik-duel.js'),{createCarrierShutdown}=await import('../src/carrier-shutdown.js');
 const g=createInkScene({character:'gatling'}),p={...g.player,x:17150,y:560,supportY:560},boss=createBossTank(17520,()=>560),native={id:'gatling'},enemyImage={id:'enemy'},images={'ink-saltik':native,'ink-enemy-saltik':enemyImage},calls=[];
 const c=new Proxy({globalAlpha:1,drawImage(...v){calls.push(v)}},{get:(o,k)=>k in o?o[k]:()=>{}});
 for(const kind of ['hull','pod'])for(const phase of ['qte','tear','fire','eject']){const q={...createBossBreach(p,boss,false,kind),phase,elapsed:.1,taps:1,effortsCompleted:0,effortElapsed:.15};calls.length=0;if(kind==='pod'&&phase==='eject'){assert.equal(drawInkBossBreach(c,images,q,boss,{player:p,time:2}),false);continue;}assert.equal(drawInkBossBreach(c,images,q,boss,{player:p,time:2}),true,kind+':'+phase);assert.ok(calls.some(v=>v[0]===native&&v[1]===0&&v[3]===627));assert.ok(calls.filter(v=>v[0]===native).every(v=>v[1]===0&&v[2]===0&&v[3]===627&&v[4]===627),'no Striker native crop may slice Gatling');}
 const enemy={id:4,type:'saltik',x:17300,y:560,dir:-1,hp:10},q={...createSaltikDuel(p,enemy),phase:'qte',elapsed:.1,taps:1};calls.length=0;assert.equal(drawInkDuelWorld(c,images,q,{player:p,time:2}),true);assert.ok(calls.filter(v=>v[0]===native).every(v=>v[1]===0&&v[3]===627));
 const carrier={id:5,x:17300,y:560,dir:-1,hp:1,knockedOut:true,koElapsed:1},service={x:17180,y:560,dir:1,port:{x:17230,y:495}},shutdown={...createCarrierShutdown(p,carrier,service),phase:'unplug',elapsed:.8};calls.length=0;assert.equal(drawCarrierShutdown(c,images,shutdown,carrier,{player:p,time:2}),true);assert.ok(calls.filter(v=>v[0]===native).every(v=>v[1]===0&&v[3]===627));
});

test('both Gatling barrels aim into the actual boss opening, retain staged lean and release claws for firing',async()=>{
 const {gatlingBreachPlayer}=await import('../src/gatling-art.js'),{inkBreachPoseGeometry}=await import('../src/ink-encounters.js'),{createBossTank}=await import('../src/boss-tank.js'),{createBossBreach}=await import('../src/boss-breach.js');
 const p={...createInkScene({character:'gatling'}).player,x:17150,y:560,supportY:560},boss=createBossTank(17520,()=>560);
 for(const kind of ['hull','pod'])for(const camera of [0,17000]){const phase=kind==='pod'?'qte':'fire',q={...createBossBreach(p,boss,false,kind),phase,elapsed:kind==='pod'?.05:.1,taps:1,effortsCompleted:0},g=inkBreachPoseGeometry(q,boss,{player:p,camera}),posed=gatlingBreachPlayer(g,{camera,time:2,phase}),geo=inkSaltikGeometry(posed,{camera,time:2});assert.equal(g.shooting,true);assert.ok(Math.abs(geo.tilt-g.geo.tilt)<1e-9);if(kind==='hull')assert.equal(posed.gatlingGripTargets,null);for(const gun of geo.gatlingGuns){const dx=g.fire.target.x-gun.muzzle.x,dy=g.fire.target.y-gun.muzzle.y;assert.ok(Math.abs(dx*gun.direction.y-dy*gun.direction.x)<1e-6);assert.ok(dx*gun.direction.x+dy*gun.direction.y>0);}}
});
