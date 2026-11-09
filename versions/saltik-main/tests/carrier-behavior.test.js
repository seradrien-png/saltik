import test from 'node:test';
import assert from 'node:assert/strict';
import {inkCarrierGeometry} from '../src/ink-carrier.js';

const behavior=await import('../src/drone-carrier.js');
const {createDroneCarrier,damageDroneCarrier,damageCarrierBay,isCarrierTargetable,advanceDroneCarrier,advanceCarrierDrone}=behavior;
const player={x:200,y:620,hp:100};
const geometry=e=>({
  bays:[{muzzle:{x:e.x-40,y:e.y-122}},{muzzle:{x:e.x+26,y:e.y-114}}],
  muzzle:{x:e.x-58,y:e.y-70},muzzleDirection:{x:-1,y:0},port:{x:e.x-12,y:e.y-61}
});
const carrier=(random=.25)=>createDroneCarrier({id:91,x:700,guardianId:90,platformId:'ground'},{y:620,random});
function damage(e,amount){
  assert.equal(typeof damageDroneCarrier,'function','overall equipment damage API is missing');
  return damageDroneCarrier(e,amount);
}
const update=(e,dt,drones=[],extra={})=>advanceDroneCarrier(e,{player,dt,time:0,geometry,drones,...extra});
function launch(e,drones=[]){
  for(let step=0;step<120;step++){
    const result=update(e,.1,drones);
    if(result.deployments.length)return {...result.deployments[0],id:100+drones.length};
    for(const drone of drones)advanceCarrierDrone(drone,{carrier:e,player,dt:.1,geometry:droneGeometry});
  }
  assert.fail('carrier failed to deploy a linked drone');
}
function droneGeometry(d){
  const angle=(d.dir===1?0:Math.PI)+(d.aimRotation??0);
  return {muzzle:{x:d.x+Math.cos(angle)*18,y:d.y+Math.sin(angle)*18+9},muzzleDirection:{x:Math.cos(angle),y:Math.sin(angle)}};
}

test('combat damage preserves the complete carrier and all equipment until combat readiness reaches zero',()=>{
  const e=carrier();
  assert.deepEqual([e.type,e.hp,e.maxHp,e.bays.length],['carrier',120,120,2]);
  for(const amount of [71,1,29,1,17]){
    const result=damage(e,amount);
    assert.equal(result.events.some(event=>event.type.endsWith('-destroyed')),false);
    assert.deepEqual([e.backDestroyed,e.legDestroyed,e.immobilized,e.disabled],[false,false,false,false]);
    assert.equal(e.damageStage,'intact');assert.equal(isCarrierTargetable(e),true);
    assert.ok(e.bays.every(bay=>bay.hp===bay.maxHp),'combat damage must not wreck the intact pads');
  }
  assert.equal(e.hp,1);
  const before=e.x;
  update(e,1,[],{player:{...player,x:650},movement:{minX:300,maxX:1000,groundAt:()=>620}});
  assert.ok(e.x>before,'low combat readiness must retain medium-range movement');
});

test('the final combat hit knocks out the intact carrier and stops every attack',()=>{
  const e=carrier();damage(e,119);assert.equal(e.hp,1);assert.equal(e.disabled,false);
  const result=damage(e,1);
  assert.equal(result.events.filter(event=>event.type==='carrier-knocked-out').length,1);
  assert.equal(result.newlyDisabled,true);assert.equal(result.newlyKnockedOut,true);
  assert.deepEqual([e.hp,e.knockedOut,e.backDestroyed,e.legDestroyed,e.immobilized,e.disabled,e.neutralized],[0,true,false,false,true,true,false]);
  assert.equal(e.damageStage,'knocked-out');assert.equal(isCarrierTargetable(e),false);
  const x=e.x,response=update(e,20,[],{movement:{minX:300,maxX:1000,groundAt:()=>620}});
  assert.deepEqual(response,{shots:[],deployments:[],events:[]});
  assert.equal(e.x,x);assert.equal(e.vx,0);assert.equal(e.firePose,0);assert.equal(e.burstRemaining,0);
  assert.equal(damage(e,1e6).damage,0);assert.equal(e.hp,0);assert.equal(e.neutralized,false);
});

test('one oversized impact knocks out once without equipment destruction or a cabin kill',()=>{
  const e=carrier(),result=damage(e,10000);
  assert.equal(result.damage,120);assert.equal(e.hp,0);
  assert.deepEqual(result.events.map(event=>event.type),['carrier-hit','carrier-knocked-out']);
  assert.equal(e.neutralized,false);assert.equal(e.backDestroyed,false);assert.equal(e.legDestroyed,false);
  for(let attempt=0;attempt<3;attempt++)assert.deepEqual(damage(e,10000).events,[]);
  assert.equal(e.hp,0);
});

test('legacy bay hits apply shared combat damage once and never destroy cosmetic pads',()=>{
  const e=carrier(),result=damageCarrierBay(e,1,12);
  assert.equal(result.damage,12);assert.equal(e.hp,108);
  assert.equal(e.bays[0].hp,e.bays[0].maxHp);assert.equal(e.bays[1].hp,e.bays[1].maxHp);
  assert.ok(e.bays[1].hit>0);
  const before=structuredClone(e);
  for(const [index,amount] of [[-1,3],[2,3],[1,-4],[1,NaN],[1,Infinity]])damageCarrierBay(e,index,amount);
  for(const amount of [0,-1,NaN,Infinity])damage(e,amount);
  assert.deepEqual(e,before);
  e.neutralized=true;damage(e,100);assert.equal(e.hp,108);
});

test('two measured docks hold normal drones before release and sustain three linked units',()=>{
  const e=carrier(),drones=[],spawnTimes=[];
  for(let frame=0;frame<480;frame++){
    const result=update(e,1/60,drones,{time:frame/60});
    assert.ok(result.deployments.length<=1,'one step stacked several drones');
    for(const descriptor of result.deployments){
      assert.deepEqual([descriptor.x,descriptor.y],descriptor.bayIndex===0?[660,498]:[726,506]);
      assert.deepEqual([descriptor.type,descriptor.carrierId,descriptor.scale,descriptor.carrierState],['drone',91,1,'docked']);
      assert.equal(descriptor.dockDuration,1.15);assert.equal(descriptor.undockDuration,.75);
      drones.push({...descriptor,id:100+drones.length});spawnTimes.push(frame/60);
    }
    const attached=drones.filter(d=>['docked','undock'].includes(d.carrierState));
    assert.equal(new Set(attached.map(d=>d.bayIndex)).size,attached.length,'one pad holds two drones');
    for(const drone of drones)advanceCarrierDrone(drone,{carrier:e,player,dt:1/60,time:frame/60,geometry:droneGeometry});
    assert.ok(drones.length<=3);
  }
  assert.equal(drones.length,3);assert.equal(e.activeDroneCount,3);
  assert.equal(new Set(drones.map(d=>d.slot)).size,3);
  assert.ok(spawnTimes[2]>spawnTimes[0]+1.5,'airborne drones never released a dock');
});

test('docked and undocking drones follow moving mouths without firing before complete release',()=>{
  const e=carrier(),d=launch(e);
  e.x+=40;e.y+=5;update(e,.01,[d]);
  let result=advanceCarrierDrone(d,{carrier:e,player,dt:1.14,geometry:droneGeometry});
  assert.deepEqual(result.shots,[]);assert.equal(d.carrierState,'docked');
  const mouth=geometry(e).bays[d.bayIndex].muzzle;
  assert.deepEqual([d.x,d.y],[mouth.x,mouth.y]);
  result=advanceCarrierDrone(d,{carrier:e,player,dt:.01,geometry:droneGeometry});
  assert.deepEqual(result.shots,[]);assert.equal(d.carrierState,'undock');
  advanceCarrierDrone(d,{carrier:e,player,dt:.74,geometry:droneGeometry});
  assert.equal(d.carrierState,'undock');assert.ok(d.y<mouth.y);
  result=advanceCarrierDrone(d,{carrier:e,player,dt:.01,geometry:droneGeometry});
  assert.deepEqual(result.shots,[]);assert.equal(d.carrierState,'escort');
  assert.equal(result.events.filter(event=>event.type==='carrier-drone-undocked').length,1);
});

test('native docked drone bottom rests on the measured pad instead of sinking through the platform',()=>{
  const e=carrier(),bottomBelowAnchor=(501-344)*66/376;
  const dockGeometry=actor=>{
    const pose=geometry(actor);
    for(const bay of pose.bays)bay.droneAnchor={x:bay.muzzle.x,y:bay.muzzle.y-bottomBelowAnchor};
    return pose;
  };
  const result=update(e,1,[],{geometry:dockGeometry}),d={...result.deployments[0],id:101};
  assert.equal(d.carrierState,'docked');
  assert.ok(Math.abs(d.y+bottomBelowAnchor-498)<1e-9,'native lower hull is below the pad');
  assert.equal(d.x,660);
  e.x+=20;e.y-=12;update(e,.01,[d],{geometry:dockGeometry});
  advanceCarrierDrone(d,{carrier:e,player,dt:.4,geometry:droneGeometry});
  assert.equal(d.carrierState,'docked');
  assert.ok(Math.abs(d.y+bottomBelowAnchor-486)<1e-9,'moving dock dropped the native drone into the deck');
  assert.equal(d.x,680);
  assert.equal(dockGeometry(e).bays[0].muzzle.y,486,'pad mouth was replaced by the sprite anchor');
});

test('linked cap includes both pads and a vacated slot recharges for at least 3.4 seconds',()=>{
  const e=carrier(),drones=[];
  for(let index=0;index<3;index++)drones.push(launch(e,drones));
  assert.equal(update(e,100,[...drones,{type:'drone',id:500,hp:3,carrierId:999,slot:0}]).deployments.length,0);
  drones[1].hp=0;
  assert.equal(update(e,.01,drones).deployments.length,0);assert.equal(e.activeDroneCount,2);
  assert.equal(update(e,3.3,drones).deployments.length,0);
  const result=update(e,.1,drones);
  assert.equal(result.deployments.length,1);assert.equal(result.deployments[0].slot,1);assert.equal(result.deployments[0].scale,1);
  assert.equal(update(carrier(),100).deployments.length,1);
});

test('low combat readiness sustains drones and knockout retires both attached and airborne drones',()=>{
  const e=carrier(),d=launch(e),flying={...d,id:120,slot:1,carrierState:'escort',cooldown:0};
  damage(e,102);
  assert.equal(advanceCarrierDrone(flying,{carrier:e,player,dt:.1,geometry:droneGeometry}).shots.length,1);
  assert.equal(flying.harmless,false);assert.equal(flying.carrierState,'escort');
  damage(e,18);
  assert.deepEqual(update(e,100,[d,flying]).deployments,[]);
  for(const drone of [d,flying]){
    assert.deepEqual(advanceCarrierDrone(drone,{carrier:e,player,dt:.1,geometry:droneGeometry}).shots,[]);
    assert.equal(drone.carrierState,'retire');assert.equal(drone.harmless,true);
  }
});

test('carrier advances above medium range and retreats below it while holding a useful distance band',()=>{
  const movement={minX:0,maxX:1400,groundAt:x=>600+x*.02};
  for(const [playerX,wantSign] of [[0,-1],[650,1],[300,-1]]){
    const e=carrier(),start=e.x;
    update(e,1,[],{player:{...player,x:playerX},movement});
    assert.equal(Math.sign(e.x-start),wantSign);assert.ok(Math.abs(e.x-start)<=80);assert.equal(e.y,600+e.x*.02);
  }
  const right=carrier();right.x=200;
  update(right,1,[],{player:{...player,x:1000},movement});assert.ok(right.x>200);
});

test('guardian support and continuous bounded terrain prevent crossing gaps and blocked routes',()=>{
  const e=carrier(),start=e.x;
  update(e,1,[],{player:{...player,x:560},movement:{minX:300,maxX:900,groundAt:x=>600+x*.02,guardian:{x:600,hp:40}}});
  assert.ok(e.x>start);assert.ok(e.x-start<=80);assert.equal(e.y,600+e.x*.02);
  for(const block of [x=>x<740,x=>x<740?620:NaN,x=>x<740?620:700]){
    const blocked=carrier(),boolean=typeof block(700)==='boolean';
    update(blocked,10,[],{player:{...player,x:660},movement:{minX:300,maxX:900,groundAt:boolean?()=>620:block,...(boolean?{canOccupy:block}:{})}});
    assert.ok(blocked.x<740,'carrier crossed a blocked or unsupported route');
  }
});

test('carrier fires measured sustained bursts with an obvious attack-free reload window',()=>{
  const e=carrier(),shotTimes=[],reloadTimes=[];
  for(let frame=0;frame<1200;frame++){
    const time=frame/60,result=update(e,1/60,[],{time});
    for(const shot of result.shots){
      assert.deepEqual([shot.x,shot.y,shot.kind,shot.team],[642,550,'plasma','enemy']);
      assert.ok(shot.vx<0);assert.ok(Math.abs(shot.vy)<1e-6);shotTimes.push(time);
    }
    if(e.attackPhase==='reload'){
      assert.equal(e.reloadDuration,1.8);assert.ok(e.reloadIn>0&&e.reloadIn<=1.8);
      if(!result.shots.length)reloadTimes.push(time);
    }
  }
  assert.ok(shotTimes.length>=45,'gun still pauses for long periods between tiny bursts');
  const pauses=shotTimes.slice(1).map((time,index)=>time-shotTimes[index]),groups=[1];
  for(const pause of pauses){
    if(pause>1)groups.push(1);
    else{assert.ok(pause>=.116&&pause<=.15);groups[groups.length-1]++;}
  }
  assert.ok(groups.slice(0,-1).every(count=>count>=8&&count<=10));
  assert.ok(pauses.some(pause=>pause>=1.75&&pause<2));assert.ok(reloadTimes.length>300);
  assert.ok(update(e,100).shots.length<=2,'long frame emitted an unfair catch-up barrage');
});

test('native lateral gun tracks the player center on slopes in both facings and fires along its real mouth axis',()=>{
  for(const dir of [-1,1])for(const slope of [-.06,.06]){
    const e=carrier(),target={...player,x:700+dir*340,y:620+dir*340*slope,h:67.5};
    e.supportPose={tilt:Math.atan(slope)};
    const shots=[];
    let previous=0;
    for(let frame=0;frame<100;frame++){
      const result=update(e,1/60,[],{player:target,geometry:inkCarrierGeometry,time:frame/60});
      assert.ok(Math.abs((e.cannonElevation??0)-previous)<=.02,'barrel snapped to its target');
      previous=e.cannonElevation??0;
      assert.ok(previous>=-.15&&previous<=.22);
      for(const shot of result.shots){
        const pose=inkCarrierGeometry(e,frame/60),axis=pose.muzzleDirection;
        assert.deepEqual([shot.x,shot.y],[pose.muzzle.x,pose.muzzle.y]);
        assert.ok(Math.abs(shot.vx/260-axis.x)<1e-9&&Math.abs(shot.vy/260-axis.y)<1e-9,'projectile bypassed the visible barrel');
        const crossingY=shot.y+(target.x-shot.x)*shot.vy/shot.vx;
        assert.ok(Math.abs(crossingY-(target.y-33.75))<3,'native lateral fire missed the center of the player');
        shots.push(shot);
      }
    }
    assert.ok(shots.length>=8);
  }
});

test('escort and attack positions stay between carrier and player and fire measured plasma',()=>{
  for(const playerX of [200,1200])for(const slot of [0,1,2]){
    const e=carrier(),target={...player,x:playerX},d={...launch(e),slot,carrierState:'escort',x:700+(playerX<700?-80:80),y:480,cooldown:0},roles=new Set(),shots=[];
    for(let frame=0;frame<600;frame++){
      const result=advanceCarrierDrone(d,{carrier:e,player:target,dt:1/60,time:frame/60,groundAt:()=>620,geometry:droneGeometry});
      roles.add(d.role);assert.ok(d.x>=Math.min(e.x,target.x)&&d.x<=Math.max(e.x,target.x),'drone flanked behind player');
      for(const shot of result.shots){
        const measured=droneGeometry(d);assert.deepEqual([shot.x,shot.y],[measured.muzzle.x,measured.muzzle.y]);assert.ok(shot.vy>0);shots.push(frame/60);
      }
      assert.ok(d.y<=620-45);
    }
    assert.ok(roles.has('screen')&&roles.has('attack'));assert.ok(shots.length>=2&&shots.length<=10);
  }
  const e=carrier(),d={...launch(e),carrierState:'escort',x:710,y:480};
  advanceCarrierDrone(d,{carrier:e,player:{...player,x:750},dt:2,time:2,geometry:droneGeometry});
  assert.ok(d.x>=700&&d.x<=750,'close target caused a screen point behind the player');
});

test('neutralized, immobilized, missing or dead carrier makes linked drones retire harmlessly once',()=>{
  for(const parentState of ['neutralized','immobilized','missing','dead']){
    const e=carrier(),d=launch(e);if(parentState==='neutralized')e.neutralized=true;if(parentState==='immobilized')damage(e,120);if(parentState==='dead')e.hp=0;
    const events=[];
    for(let frame=0;frame<120;frame++){
      const result=advanceCarrierDrone(d,{carrier:parentState==='missing'?null:e,player,dt:1/60,time:frame/60,geometry:droneGeometry});
      assert.equal(result.shots.length,0);events.push(...result.events);
    }
    assert.equal(d.harmless,true);assert.equal(d.retired,true);assert.equal(d.hp,0);
    assert.equal(events.filter(event=>event.type==='carrier-drone-retired').length,1);
  }
});

test('seeded behavior repeats and nonpositive time freezes docking and reload clocks',()=>{
  function run(){
    const e=carrier(.7),drones=[],output=[];
    for(let frame=0;frame<360;frame++){
      const result=update(e,1/60,drones,{time:frame/60});
      for(const descriptor of result.deployments)drones.push({...descriptor,id:100+drones.length});
      for(const drone of drones)advanceCarrierDrone(drone,{carrier:e,player,dt:1/60,time:frame/60,geometry:droneGeometry});
      output.push(result);
    }
    const before=structuredClone({e,drones});
    for(const dt of [0,-1,NaN,Infinity]){
      update(e,dt,drones,{time:999});for(const drone of drones)advanceCarrierDrone(drone,{carrier:e,player,dt,time:999,geometry:droneGeometry});
    }
    assert.deepEqual({e,drones},before);return {e,drones,output};
  }
  assert.deepEqual(run(),run());
});

test('stationary medium-range player sees forward strafing bursts then reverse reload movement in both facings',()=>{
 for(const facing of [-1,1]){
  const e=carrier();e.x=700;const target={...player,x:e.x+facing*400},movement={minX:0,maxX:1600,groundAt:()=>620};
  const drones=[],positions=[],shots=[],states=new Set();let advance=0,reverse=0;
  for(let frame=0;frame<900;frame++){
   const before=e.x,result=update(e,1/60,drones,{player:target,time:frame/60,movement});
   for(const d of result.deployments)drones.push({...d,id:100+drones.length});
   for(const d of drones)advanceCarrierDrone(d,{carrier:e,player:target,dt:1/60,time:frame/60,geometry:droneGeometry});
   if((e.x-before)*facing>.01)advance++;
   if((e.x-before)*facing<-.01)reverse++;
   positions.push(e.x);states.add(e.attackPhase);shots.push(...result.shots);
   assert.equal(e.dir,facing,'reverse locomotion must retain target-facing body');
   assert.ok(Math.abs(e.x-target.x)>270&&Math.abs(e.x-target.x)<510,'maneuvering must stay at medium range');
  }
  assert.ok(advance>100&&reverse>100,'the carrier must repeatedly approach and reverse with a stationary target');
  assert.ok(Math.max(...positions)-Math.min(...positions)>70,'movement must be clearly visible, not a subpixel sway');
  assert.ok(shots.length>25&&drones.length===3);assert.ok(states.has('reload')&&states.has('burst'));
 }
});
