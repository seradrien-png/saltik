import test from 'node:test';
import assert from 'node:assert/strict';
import {bossGeometry} from '../src/boss-tank.js';
import {inkBossGeometry,inkBossPodGeometry,inkBreachVisual,inkDuelVisual,inkDuelGripGeometry,drawInkBossTank,drawInkBossBreach,drawInkDuelWorld,drawInkDuelScreen} from '../src/ink-encounters.js';

const boss={x:17000,y:550,hp:200,maxHp:200,podRaise:0,podPhase:'stowed',cannonRecoil:0};
const close=(a,b)=>assert.ok(Math.abs(a-b)<.00001,`${a} differs from ${b}`);
const samePoint=(a,b)=>{close(a.x,b.x);close(a.y,b.y);};
function context(){
 const calls=[];return{calls,globalAlpha:1,save(){},restore(){},translate(){},rotate(){},scale(){},transform(){},
 beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){},drawImage(...a){calls.push(a);},ellipse(){},arc(){},fill(){},stroke(){},rect(){},setLineDash(){}};
}
const images={'ink-boss':{},'ink-boss-parts':{},'ink-saltik':{},'ink-enemy-saltik':{}};

test('painted boss cannon and rocket mouth share physical projectile anchors through recoil and breach',()=>{
 for(const breached of [false,true])for(const cannonRecoil of [0,.4,1])for(const turretSpin of [0,1.3,Math.PI]){
  const b={...boss,breached,cannonRecoil,turretSpin},g=inkBossGeometry(b,{camera:16000}),physical=bossGeometry(b);
  samePoint(g.muzzle,{x:physical.muzzle.x-16000,y:physical.muzzle.y});
  assert.ok(g.barrelScaleX>.1,'the native cannon keeps a visible width during a turret sweep');
 }
 for(const podRaise of [0,.2,.7,1]){
  const b={...boss,podRaise},g=inkBossPodGeometry(b,{camera:16000}),physical=bossGeometry(b);
  samePoint(g.muzzle,{x:physical.podMuzzle.x-16000,y:physical.podMuzzle.y});
  samePoint(g.mount,{x:physical.podMount.x-16000,y:physical.podMount.y});
  assert.ok(g.strutHeight>0);
 }
});

test('hull and pod pulling use queued physical effort, then preserve a native damaged part',()=>{
 for(const kind of ['hull','pod']){
  const q={kind,phase:'qte',taps:1,effortsCompleted:0,effortElapsed:.16,deckX:16915,deckY:465};
  const v=inkBreachVisual(q,boss);assert.ok(v.effort>.99);assert.equal(v.paintsPlayer,true);
  assert.equal(inkBreachVisual({...q,phase:'leap'},boss).paintsPlayer,false);
  assert.equal(inkBreachVisual({...q,phase:'return'},boss).paintsPlayer,false);
 }
 const q={kind:'hull',phase:'fire',elapsed:.11,shotsFired:1,deckX:16915,deckY:465};
 const v=inkBreachVisual(q,boss);assert.ok(v.shotFlash);assert.equal(v.hatchFrame,2);
});

test('duel world and front glass sequence retain every original campaign stage',()=>{
 const q={phase:'engage',elapsed:0,dir:1,x:300,y:400,playerX:260,enemyX:340,playerY:400,enemyY:400,taps:0};
 const viewport={camera:50,cameraY:15,width:1280,height:720};
 assert.equal(inkDuelVisual(q,viewport).world,true);
 const a=inkDuelVisual({...q,phase:'throw',elapsed:0},viewport).screen;
 const b=inkDuelVisual({...q,phase:'throw',elapsed:.48},viewport).screen;
 close(a.y,q.enemyY+viewport.cameraY);assert.ok(b.scale>a.scale*3);
 assert.equal(inkDuelVisual({...q,phase:'impact'},viewport).cracks,1);
 assert.ok(inkDuelVisual({...q,phase:'slide',elapsed:.9},viewport).screen.y>viewport.height);
 assert.equal(inkDuelVisual({...q,phase:'recover',elapsed:.2},viewport).cracks,0);
});

test('duel bodies have a separate stance while the original small claws reach one another',()=>{
 for(const dir of [-1,1])for(const effortElapsed of [0,.12,.24]){
  const q={phase:'qte',elapsed:1,dir,x:300,y:400,playerX:300-dir*40,enemyX:300+dir*40,playerY:400,enemyY:400,taps:1,effortsCompleted:0,effortElapsed};
  const v=inkDuelVisual(q),g=inkDuelGripGeometry(q);
  close(Math.abs(v.player.x-v.enemy.x),115);
  assert.equal(g.playerArms.length,2);assert.equal(g.enemyArms.length,2);
  assert.ok(Math.hypot(g.playerGrip.x-g.enemyGrip.x,g.playerGrip.y-g.enemyGrip.y)<15,'small native claw silhouettes meet across the stance');
  for(const arm of [...g.playerArms,...g.enemyArms]){
   assert.ok(arm.extension*arm.k<=13,'only the short forearm extends');
   const a=arm.handPoint([arm.pivot[0],arm.wristY+20]),b=arm.handPoint([arm.pivot[0]+40,arm.wristY+20]);
   close(Math.hypot(a.x-b.x,a.y-b.y),40*arm.k);
  }
 }
});

test('encounter hooks paint only native images and never mutate campaign state',()=>{
 const c=context(),b={...boss},q={kind:'hull',phase:'qte',elapsed:1,taps:1,effortsCompleted:0,effortElapsed:.16,deckX:16915,deckY:465};
 const d={phase:'qte',elapsed:1,dir:1,x:300,y:400,playerX:260,enemyX:340,playerY:400,enemyY:400,taps:1,effortsCompleted:0,effortElapsed:.12};
 const before=structuredClone({b,q,d});
 assert.equal(drawInkBossTank(c,images,b),true);
 assert.equal(drawInkBossBreach(c,images,q,b),true);
 assert.equal(drawInkDuelWorld(c,images,d,{width:1280,height:720}),true);
 assert.equal(drawInkDuelScreen(c,images,{...d,phase:'impact'},{width:1280,height:720}),true);
 assert.deepEqual({b,q,d},before);
 assert.ok(c.calls.every(call=>Object.values(images).includes(call[0])));
 assert.equal(drawInkBossBreach(c,images,{...q,phase:'leap'},b),false);
 assert.equal(drawInkDuelWorld(c,images,{...d,phase:'throw'},{width:1280,height:720}),false);
});
