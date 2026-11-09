import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine.js';
import {createInkScene,updateInkScene,inkWeaponGeometry} from '../src/ink-scene.js';
import {createInput} from '../src/input.js';
import {MIRV_AIM_PERIOD} from '../src/mirv-trajectory.js';

function fixture(dir=1){const g=createInkScene();Object.assign(g,{schedule:[],enemies:[],obstacles:[],platforms:[],pickups:[],groundAt:()=>600});Object.assign(g.player,{x:6000,y:600,supportY:600,dir,invulnerable:99});g.maxX=6000;return g;}
function tick(g,n,input={}){for(let i=0;i<n;i++)updateInkScene(g,input,1/60);}
function hold(g,n=60){tick(g,n,{missile:true,missileHeld:true});}

test('holding MIRV sweeps repeatedly without spending a shot or cooldown',()=>{
 const g=fixture();hold(g,40);const peak=g.player.cannonElevation;hold(g,Math.round(MIRV_AIM_PERIOD*30));const low=g.player.cannonElevation;hold(g,Math.round(MIRV_AIM_PERIOD*30));
 assert.equal(g.stats.mirvs,0);assert.equal(g.player.mirvIn,0);assert.equal(g.player.mirvAiming,true);assert.ok(peak>1&&low<.45&&g.player.cannonElevation>1);assert.equal(g.player.turretLift,0);
});
test('release fires immediately along the actual current native bore in either direction',()=>{for(const dir of [-1,1]){
 const g=fixture(dir);hold(g,90);const elevation=g.player.cannonElevation;tick(g,1,{missileHeld:false,missileReleased:true});
 assert.equal(g.stats.mirvs,1);assert.equal(g.player.mirvAiming,false);assert.equal(g.player.cannonElevation,elevation);
 const shot=g.projectiles.find(s=>s.kind==='mirv'),pose=inkWeaponGeometry(g.player,g.time),speed=Math.hypot(shot.vx,shot.vy-125/60);
 assert.ok(Math.hypot(shot.launchX-pose.cannon.x,shot.launchY-pose.cannon.y)<1e-6);assert.ok(Math.abs(speed-940)<1e-6);
 assert.ok(Math.abs(shot.vx/speed-pose.cannonDirection.x)<1e-8);assert.ok(Math.abs((shot.vy-125/60)/speed-pose.cannonDirection.y)<1e-8);
 hold(g,420);assert.equal(g.stats.mirvs,1,'a held trigger pressed during cooldown cannot auto-arm on recharge');
}});
test('a short tap prepares one standard shot smoothly after release',()=>{
 const g=fixture(),input=createInput();input.set('tap','missile',true);input.set('tap','missile',false);updateInkScene(g,input.consume(),1/60);
 assert.equal(g.stats.mirvs,0);assert.ok(g.player.mirvPending);assert.equal(!!g.player.mirvAiming,false);tick(g,18);assert.equal(g.stats.mirvs,0);assert.ok(g.player.cannonElevation>.3);tick(g,30);assert.equal(g.stats.mirvs,1);
});
test('pause freezes aim, cancellation and a turn discard release without a ghost shot',()=>{
 const g=fixture();hold(g,70);g.status='paused';const angle=g.player.cannonElevation,elapsed=g.player.mirvAimElapsed;tick(g,90,{missile:true});assert.equal(g.player.cannonElevation,angle);assert.equal(g.player.mirvAimElapsed,elapsed);
 g.status='playing';tick(g,1,{missileCancelled:true});tick(g,100);assert.equal(g.stats.mirvs,0);assert.equal(g.player.cannonElevation,0);
 hold(g,40);tick(g,1,{left:true,missile:true,missileHeld:true});tick(g,100);assert.equal(g.stats.mirvs,0);assert.equal(!!g.player.mirvAiming,false);
 hold(g,40);tick(g,1,{shift:true,missile:true,missileHeld:true});tick(g,100);assert.equal(g.stats.mirvs,0);
});
test('preview matches all five real terrain impacts from the native muzzle in either direction',()=>{
 assert.equal(typeof engine.predictMirvImpact,'function');
 for(const dir of [-1,1]){const g=fixture(dir);g.groundAt=x=>600+Math.sin(x/220)*35;g.player.y=g.groundAt(g.player.x);hold(g,100);const preview=engine.predictMirvImpact(g);
 assert.equal(preview.impacts.length,5);assert.ok(preview.points.length<100);assert.equal(preview.zone.radius,147.5);assert.equal(preview.impacts.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),true);
 const before=JSON.stringify(g.projectiles);engine.predictMirvImpact(g);assert.equal(JSON.stringify(g.projectiles),before);g.events=[];tick(g,1,{missileReleased:true,missileHeld:false});tick(g,240);const actual=g.events.filter(e=>e.type==='explosion');assert.equal(actual.length,5);
 const expected=[...preview.impacts].sort((a,b)=>a.x-b.x),hits=actual.sort((a,b)=>a.x-b.x);for(let i=0;i<5;i++)assert.ok(Math.hypot(expected[i].x-hits[i].x,expected[i].y-hits[i].y)<1,`preview differs from impact ${i}`);
 }
});
test('lower-angle aiming meaningfully extends range beyond the standard ink shot',()=>{
 assert.equal(typeof engine.predictMirvImpact,'function');const g=fixture();hold(g,39);const high=engine.predictMirvImpact(g);hold(g,Math.round(MIRV_AIM_PERIOD*30));const low=engine.predictMirvImpact(g);
 assert.ok(low.zone.maxX-g.player.x>(high.zone.maxX-g.player.x)*1.5);assert.ok(low.zone.maxX-g.player.x>950);
});
test('preview follows raised platforms and destructible cover without changing live armor or score',()=>{
 for(const cover of [false,true]){const g=fixture();hold(g,100);const bare=engine.predictMirvImpact(g);
  if(cover)g.obstacles=[{id:'mirv-cover',type:'rock',x:bare.zone.x-80,y:600,w:72,h:140,hp:9,maxHp:9,hit:0}];
  else g.platforms=[{id:'mirv-platform',tier:1,x1:bare.zone.minX-180,x2:bare.zone.maxX+180,points:[[bare.zone.minX-180,400],[bare.zone.maxX+180,400]]}];
  const before=JSON.stringify({obstacles:g.obstacles,stats:g.stats}),preview=engine.predictMirvImpact(g);assert.equal(preview.impacts.length,5);assert.equal(JSON.stringify({obstacles:g.obstacles,stats:g.stats}),before);
  if(!cover)assert.ok(preview.impacts.every(p=>Math.abs(p.y-400)<1));
  g.events=[];tick(g,1,{missileReleased:true,missileHeld:false});tick(g,240);const hits=g.events.filter(e=>e.type==='explosion'&&e.radius===147.5).sort((a,b)=>a.x-b.x),expected=preview.impacts.sort((a,b)=>a.x-b.x);
  assert.equal(hits.length,5);for(let i=0;i<5;i++)assert.ok(Math.hypot(expected[i].x-hits[i].x,expected[i].y-hits[i].y)<1);
 }
});
test('release uses the moving player position and keeps primary fire independent during aim',()=>{
 const g=fixture();hold(g,70);const x=g.player.x;tick(g,1,{right:true,fire:true,missileReleased:true,missileHeld:false});const shot=g.projectiles.find(s=>s.kind==='mirv'),pose=inkWeaponGeometry(g.player,g.time);
 assert.ok(g.player.x>x);assert.ok(Math.hypot(shot.launchX-pose.cannon.x,shot.launchY-pose.cannon.y)<1e-6);assert.equal(g.stats.shots,1);assert.equal(g.stats.mirvs,1);
});
test('an ink carrier detonates against intervening solid cover before deploying underground',()=>{
 const g=fixture();hold(g,100);g.obstacles=[{id:'near-wall',type:'rock',x:6250,y:600,w:70,h:380,hp:99,maxHp:99,hit:0}];
 const preview=engine.predictMirvImpact(g);assert.equal(preview.impacts.length,1);assert.equal(preview.blocked,true);assert.ok(preview.zone.x<6250);g.events=[];tick(g,1,{missileReleased:true,missileHeld:false});tick(g,120);
 assert.equal(g.events.some(e=>e.type==='cluster'),false);const hits=g.events.filter(e=>e.type==='explosion'&&e.radius===147.5);assert.equal(hits.length,1);assert.ok(Math.hypot(hits[0].x-preview.zone.x,hits[0].y-preview.zone.y)<1);
});
test('MIRV prediction does not build guided navigation slabs for a stationary ballistic snapshot',()=>{
 const g=fixture();hold(g,100);let guidedReads=0;g.platforms=[{id:'far-route',x1:12000,x2:12500,tier:1,points:[[12000,400],[12500,400]],get material(){guidedReads++;return 'rock';}}];
 assert.equal(engine.predictMirvImpact(g).impacts.length,5);assert.equal(guidedReads,0,'ballistic snapshots must not rebuild unrelated guided-navigation geometry');
});
test('one prediction samples each exact terrain coordinate once across its fixed steps',()=>{
 const g=fixture();hold(g,100);const sampled=new Set();let duplicates=0;g.groundAt=x=>{if(sampled.has(x))duplicates++;sampled.add(x);return 600;};
 assert.equal(engine.predictMirvImpact(g).impacts.length,5);assert.equal(duplicates,0,'successive segment endpoints reuse the immutable terrain sample');
});

test('held MIRV gives a slower readable sweep after reaching its high angle',()=>{
 const g=fixture();hold(g,40);const top=g.player.cannonElevation;hold(g,90);
 assert.ok(g.player.cannonElevation>.60,'the cannon must still be in its gradual descent 1.5s after reaching its high angle');
 assert.ok(top>g.player.cannonElevation);assert.equal(g.stats.mirvs,0);
});
