import test from 'node:test';
import assert from 'node:assert/strict';
import {tachikomaGeometry} from '../src/tachikoma-pose.js';
import {createGame,update,terrainHeight,surfaceHeight} from '../src/engine.js';

const navigation=await import('../src/guided-navigation.js').catch(()=>({}));
const {selectGuidedTargets,initializeGuidedShot,steerGuidedProjectile}=navigation;
const target=(id,x,y,w=64,h=76)=>({id,type:'walker',hp:16,x,y:y+h/2,vx:0,vy:0,
  bounds:{x:x-w/2,y:y-h/2,w,h},target:{x,y}});
const viewport={x:0,y:0,w:1200,h:720};

// Independent swept-AABB fixture: world collisions win ties and stop flight.
function fraction(a,b,r,pad=0){
  let low=0,high=1;
  for(const [origin,delta,min,max] of [[a.x,b.x-a.x,r.x-pad,r.x+r.w+pad],[a.y,b.y-a.y,r.y-pad,r.y+r.h+pad]]){
    if(Math.abs(delta)<1e-9){if(origin<min||origin>max)return null;continue;}
    const one=(min-origin)/delta,two=(max-origin)/delta;
    low=Math.max(low,Math.min(one,two));high=Math.min(high,Math.max(one,two));
    if(low>high)return null;
  }
  return low;
}
function flight({origin={x:100,y:320},velocity={x:390,y:0},enemy=target(1,800,320),blockers=[],groundAt=()=>720,index=1,moving=false,seconds=6.5}={}){
  const shot={kind:'homing',team:'player',...origin,vx:velocity.x,vy:velocity.y,age:0,life:seconds,
    damage:8,radius:5,splash:45,targetId:enemy.id,salvoIndex:index,salvoCount:3};
  const context={targets:[enemy],projectiles:[shot],viewport,blockers,groundAt};
  initializeGuidedShot(shot,{index,count:3,target:enemy,context});
  const samples=[{x:shot.x,y:shot.y}],dt=1/120;
  for(let step=0;step<seconds/dt;step++){
    if(moving){const dx=enemy.vx*dt,dy=enemy.vy*dt;enemy.x+=dx;enemy.y+=dy;enemy.target.x+=dx;enemy.target.y+=dy;enemy.bounds.x+=dx;enemy.bounds.y+=dy;}
    shot.age+=dt;shot.life-=dt;
    const previous={x:shot.x,y:shot.y},before={...shot},angle=Math.atan2(shot.vy,shot.vx);
    steerGuidedProjectile(shot,context,dt);
    for(const key of ['x','y','life','age','damage','splash','radius','team'])assert.deepEqual(shot[key],before[key],`steering changed engine-owned ${key}`);
    const speed=Math.hypot(shot.vx,shot.vy),turned=Math.abs(Math.atan2(Math.sin(Math.atan2(shot.vy,shot.vx)-angle),Math.cos(Math.atan2(shot.vy,shot.vx)-angle)));
    const avoiding=shot.guidance?.avoiding;
    assert.ok(speed>=(avoiding?140:390)-1e-6&&speed<=620+1e-6,`speed ${speed}`);
    assert.ok(turned<=(avoiding?20:7)*dt+1e-6,`turn ${turned/dt}`);
    shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;
    let solid=Infinity;
    for(const rect of blockers){const t=fraction(previous,shot,rect,shot.radius);if(t!==null)solid=Math.min(solid,t);}
    const groundSteps=Math.max(1,Math.ceil(Math.hypot(shot.x-previous.x,shot.y-previous.y)/2));
    for(let i=0;i<=groundSteps;i++){const t=i/groundSteps,x=previous.x+(shot.x-previous.x)*t,y=previous.y+(shot.y-previous.y)*t;if(y+shot.radius>=groundAt(x)){solid=Math.min(solid,t);break;}}
    const hit=fraction(previous,shot,enemy.bounds,shot.radius);
    samples.push({x:shot.x,y:shot.y});
    if(Number.isFinite(solid))return {kind:'world',samples,shot};
    if(hit!==null)return {kind:'enemy',samples,shot,point:{x:previous.x+(shot.x-previous.x)*hit,y:previous.y+(shot.y-previous.y)*hit}};
  }
  return {kind:'expired',samples,shot};
}

test('guided acquisition requires living enemy bounds intersecting the visible margin and launch range',()=>{
  assert.equal(typeof selectGuidedTargets,'function','guided navigation API is missing');
  const enemies=[target(1,300,300),target(2,1268,300),target(3,1300,300),target(4,350,300),{...target(5,380,300),type:'crate'},target(6,800,300)];
  enemies[3].hp=0;
  assert.deepEqual(selectGuidedTargets(enemies,{x:100,y:300},viewport,1100).map(e=>e.id),[1,6]);
  assert.equal(selectGuidedTargets([target(7,1268,300)],{x:600,y:300},viewport).length,1,'partially visible bounds must acquire');
});

test('initialization and the first tenth retain measured native launch position and velocity',()=>{
  const enemy=target(1,800,300),shot={x:100,y:300,vx:290,vy:-260,age:0,life:6.5,targetId:1};
  const context={targets:[enemy],projectiles:[shot],viewport,blockers:[],groundAt:()=>720};
  initializeGuidedShot(shot,{index:0,count:3,target:enemy,context});
  assert.deepEqual([shot.x,shot.y,shot.vx,shot.vy],[100,300,290,-260]);
  shot.age=.1;steerGuidedProjectile(shot,context,1/120);
  assert.deepEqual([shot.x,shot.y,shot.vx,shot.vy],[100,300,290,-260]);
});

test('all actual native pod mouths avoid a wall only twenty-four units beyond the front aperture',()=>{
  const pose=tachikomaGeometry({x:200,y:650,dir:1,vx:0,tilt:0,onGround:true,melee:{phase:'idle'},turn:null},0);
  const blockers=[{x:258,y:588,w:104,h:62}];
  for(const [index,tube] of pose.cabinTubes.entries()){
    const dx=tube.muzzle.x-tube.base.x,dy=tube.muzzle.y-tube.base.y,length=Math.hypot(dx,dy);
    const result=flight({origin:tube.muzzle,velocity:{x:dx/length*390,y:dy/length*390},enemy:target(1,600,605),blockers,groundAt:()=>650,index});
    assert.equal(result.kind,'enemy',`native pod ${index} hit ${result.kind} at ${JSON.stringify(result.samples.at(-1))}`);
  }
});

for(const [name,fixture] of [
  ['one tall wall between launch and target',{blockers:[{x:360,y:180,w:90,h:540}]}],
  ['target above a physical roof slab',{origin:{x:100,y:570},enemy:target(1,800,230),blockers:[{x:280,y:350,w:340,h:34}]}],
  ['target below a physical roof slab',{origin:{x:100,y:170},enemy:target(1,800,560),blockers:[{x:280,y:350,w:340,h:34}]}],
  ['straight narrow open corridor',{origin:{x:100,y:268},enemy:target(1,900,268,56,42),blockers:[{x:40,y:160,w:1000,h:72},{x:40,y:304,w:1000,h:160}]}],
  ['raised terrain crown',{origin:{x:100,y:510},enemy:target(1,900,510),groundAt:x=>x>330&&x<620?440:720}],
  ['a target behind the native forward launch near the terrain',{origin:{x:600,y:590},enemy:target(1,260,605),groundAt:()=>650}],
  ['moving live target',{enemy:{...target(1,740,300),vx:55,vy:35},moving:true}]
])test(`guidance physically hits through ${name} without touching cover`,()=>{
  for(const index of [0,1,2]){
    const result=flight({...fixture,enemy:fixture.enemy?structuredClone(fixture.enemy):undefined,index});
    assert.equal(result.kind,'enemy',`${name}, slot ${index}: ${result.kind}; last ${JSON.stringify(result.samples.at(-1))}`);
  }
});

test('a three-missile single-target salvo takes separated approaches and physical impact heights',()=>{
  const flights=[0,1,2].map(index=>flight({enemy:target(1,850,370,100,110),index}));
  for(const result of flights)assert.equal(result.kind,'enemy');
  const crossing=flights.map(result=>result.samples.find(point=>point.x>=640)?.y);
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){
    assert.ok(Math.abs(crossing[i]-crossing[j])>=16,`approaches overlap: ${crossing}`);
    assert.ok(Math.abs(flights[i].point.y-flights[j].point.y)>=12,`impacts overlap: ${flights.map(f=>f.point.y)}`);
  }
});

test('dead-target reacquisition balances live player missiles and excludes offscreen enemies',()=>{
  const dead={...target(1,300,300),hp:0},busy=target(2,500,300),free=target(3,900,300),offscreen=target(4,1500,300);
  const shot={x:100,y:300,vx:390,vy:0,age:.2,life:6,targetId:1,team:'player',kind:'homing'};
  const context={targets:[dead,busy,free,offscreen],viewport,blockers:[],groundAt:()=>720,
    projectiles:[shot,{kind:'homing',team:'player',targetId:2,life:4}]};
  initializeGuidedShot(shot,{index:0,count:3,target:dead,context});
  steerGuidedProjectile(shot,context,1/60);assert.equal(shot.targetId,3);
  free.hp=0;busy.hp=0;steerGuidedProjectile(shot,context,1/60);assert.equal(shot.targetId,null);
});

test('sealed cover remains physical and the deterministic planner has bounded work',()=>{
  const fixture={blockers:[{x:650,y:-2000,w:40,h:2700}],enemy:target(1,800,320)};
  const one=flight(fixture),two=flight(fixture);
  assert.notEqual(one.kind,'enemy');assert.deepEqual(one.samples,two.samples);
  assert.ok((one.shot.guidance?.expanded??0)<=10000);
});

test('all native bridge launches navigate the actual long gallery to a ground enemy without hitting roof cover',()=>{
  const game=createGame();game.schedule=[];game.pickups=[];
  const roof=game.platforms.find(route=>route.id==='bridge-3'),floor=surfaceHeight(roof,10300);
  Object.assign(game.player,{x:10300,y:floor,supportY:floor,platformId:roof.id,tier:2});
  game.player.melee.cooldown=99;
  const enemy={id:300,type:'turret',x:10800,y:terrainHeight(10800),hp:100,maxHp:100,cooldown:999,phase:0};
  game.enemies=[enemy];
  const coverHealth=game.obstacles.map(obstacle=>[obstacle.id,obstacle.hp]);
  update(game,{homing:true},1/60);
  assert.equal(game.projectiles.filter(shot=>shot.kind==='homing').length,3);
  for(let i=0;i<400;i++)update(game,{},1/60);
  assert.equal(enemy.hp,76,'all three native launches must make real swept impacts');
  assert.deepEqual(game.obstacles.map(obstacle=>[obstacle.id,obstacle.hp]),coverHealth,'the salvo must not pay an impact on cover');
});
