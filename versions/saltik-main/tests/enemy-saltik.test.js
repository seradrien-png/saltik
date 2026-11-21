import test from 'node:test';
import assert from 'node:assert/strict';
import {enemySaltikGeometry} from '../src/enemy-saltik-art.js';
const behavior=await import('../src/enemy-saltik.js').catch(()=>({}));
const {createEnemySaltik,advanceEnemySaltik}=behavior;
const player={x:200,y:620,vx:0,vy:0,hp:100};

function encounter({seconds=12,sample=.25,step=1/120,x=700}={}){
  const enemy=createEnemySaltik({id:19,x,tier:1,platformId:'ledge'},{y:620,random:sample}),shots=[],events=[],frames=[];
  let time=0;
  while(time<seconds){
    const result=advanceEnemySaltik(enemy,{player,dt:step,time,groundAt:()=>720,geometry:enemySaltikGeometry});
    for(const shot of result.shots)shots.push({...shot,time:time+step});
    for(const event of result.events)events.push({...event,time:time+step});
    frames.push({time:time+step,phase:enemy.attackPhase,lock:enemy.lockProgress,podRaise:enemy.podRaise});
    time+=step;
  }
  return{enemy,shots,events,frames};
}

test('Saltik factory preserves scheduled support and its armor scale',()=>{
  assert.equal(typeof createEnemySaltik,'function','enemy Saltik API is missing');
  const e=createEnemySaltik({id:19,x:700,type:'turret',tier:1,platformId:'ledge'},{y:620,random:.25});
  assert.deepEqual([e.id,e.x,e.y,e.type,e.tier,e.platformId,e.hp,e.maxHp],[19,700,620,'saltik',1,'ledge',40,40]);
  assert.equal(behavior.SALTIK_GUARD_HP/e.maxHp,.2);
  assert.deepEqual(e,createEnemySaltik({id:19,x:700,type:'turret',tier:1,platformId:'ledge'},{y:620,random:.25}));
});

test('BT fires exact heavy triples with progressively acquired physical salvos',()=>{
 const r=encounter({seconds:30}),main=r.shots.filter(s=>s.kind==='plasma'),missiles=r.shots.filter(s=>s.kind==='enemy-missile');
 assert(main.length>30);assert(main.every(s=>s.btHeavy&&s.damage===3));
 for(let i=1;i<main.length;i++)assert(Math.abs((main[i].time-main[i-1].time)-(i%3===0?.8:.2))<.02);
 assert(missiles.some(s=>s.salvoCount===8));assert(missiles.every(s=>s.hp===1&&s.hostileLoft&&s.team==='enemy'));
 assert(r.frames.some(f=>f.phase==='lock'&&f.lock>.2&&f.lock<.9));
});

test('gun and raised-pod launches originate at the canonical painted apertures and axes',()=>{
  const e=createEnemySaltik({id:19,x:700},{y:620,random:0});
  const seen=[];
  for(let time=0;time<6;time+=1/120){
    const result=advanceEnemySaltik(e,{player,dt:1/120,time,groundAt:()=>720,geometry:enemySaltikGeometry});
    if(!result.shots.length)continue;
    const geometry=enemySaltikGeometry(e,time);
    for(const shot of result.shots){
      if(shot.kind==='plasma')assert.deepEqual([shot.x,shot.y],[geometry.muzzle.x,geometry.muzzle.y]);
      else{
        assert.equal(geometry.podsOpen,true,'missile must not leave closed pod artwork');
        const index=geometry.podMuzzles.findIndex(m=>Math.hypot(m.x-shot.x,m.y-shot.y)<1e-9);
        assert.ok(index>=0);const axis=geometry.podDirections[index],speed=Math.hypot(shot.vx,shot.vy);
        assert(shot.hostileLoft&&shot.vy<0,'raised missile has a real upward launch');
      }
      seen.push(shot.kind);
    }
  }
  assert.ok(seen.includes('plasma')&&seen.includes('enemy-missile'));
});

test('range and death suppress attacks and re-entering range earns a fresh full lock',()=>{
  const e=createEnemySaltik({id:19,x:1600},{y:620,random:0});
  const original={...player};
  for(let i=0;i<300;i++)assert.equal(advanceEnemySaltik(e,{player,dt:1/60,time:i/60}).shots.length,0);
  assert.deepEqual(player,original);
  e.x=700;e.missileCooldown=0;e.btMainClock=100;
  advanceEnemySaltik(e,{player,dt:.4,time:5});assert.equal(e.attackPhase,'lock');
  e.x=1600;advanceEnemySaltik(e,{player,dt:.1,time:5.4});
  e.x=700;
  let firstShot=null;
  for(let i=0;i<360;i++){const result=advanceEnemySaltik(e,{player,dt:1/120,time:5.5+i/120});if(result.shots.length){firstShot=i/120;break;}}
  assert.ok(firstShot>=.65,`re-entry fired after ${firstShot}`);
  e.hp=0;assert.equal(advanceEnemySaltik(e,{player,dt:10,time:10}).shots.length,0);
});

test('attack timings remain stable across simulation step sizes and seeded runs',()=>{
  const small=encounter({step:1/120}),large=encounter({step:1/30});
  assert.deepEqual(small.shots.map(s=>s.kind),large.shots.map(s=>s.kind));
  small.shots.forEach((shot,index)=>assert.ok(Math.abs(shot.time-large.shots[index].time)<=1/30+1e-8));
  assert.deepEqual(small,encounter({step:1/120}));
});

test('crossing the range edge preserves the heavy cannon interval',()=>{
 const e=createEnemySaltik({id:19,x:700},{y:620,random:0});e.cooldown=0;
 assert.equal(advanceEnemySaltik(e,{player,dt:1/120,time:0}).shots.length,1);
 e.x=1600;advanceEnemySaltik(e,{player,dt:1/120,time:1/120});e.x=700;
 assert.equal(advanceEnemySaltik(e,{player,dt:1/120,time:2/120}).shots.length,0);
});

test('normal movement retreats from nearby players and advances from distant players on its support',()=>{
  const movement={minX:100,maxX:1000,groundAt:x=>600+x*.05};
  for(const [x,wantDirection] of [[320,1],[850,-1]]){
    const e=createEnemySaltik({id:19,x,tier:1,platformId:'ledge'},{y:movement.groundAt(x),random:.25});
    advanceEnemySaltik(e,{player,dt:.5,movement});
    assert.ok((e.x-x)*wantDirection>12,`enemy at ${x} failed to move in direction ${wantDirection}`);
    assert.equal(e.y,movement.groundAt(e.x));
    assert.equal(e.platformId,'ledge');assert.equal(e.tier,1);
    assert.equal(Math.sign(e.vx),wantDirection);
  }
});

test('seeded movement repositions reproducibly and cannot cross blocked route sections or finite edges',()=>{
  function walk(sample){
    const e=createEnemySaltik({id:19,x:500,tier:1,platformId:'ledge'},{y:620,random:sample}),positions=[],modes=[];
    const movement={minX:350,maxX:700,groundAt:x=>595+x*.05,canOccupy:x=>x>=420&&x<=670};
    for(let frame=0;frame<1200;frame++){
      advanceEnemySaltik(e,{player,dt:1/120,time:frame/120,movement});
      assert.ok(e.x>=420&&e.x<=670,'route movement crossed its available support');
      assert.ok(Number.isFinite(e.x)&&Number.isFinite(e.y));
      assert.equal(e.y,movement.groundAt(e.x));
      positions.push(e.x);modes.push(e.movementMode);
    }
    return {positions,modes};
  }
  const first=walk(.25),second=walk(.71);
  assert.deepEqual(first,walk(.25));assert.notDeepEqual(first.positions,second.positions);
  assert.ok(first.modes.includes('reposition')||second.modes.includes('reposition'));
  assert.ok(first.positions.some(x=>x!==500));
  const e=createEnemySaltik({id:20,x:790},{y:620,random:0});
  const movement={minX:600,maxX:800,groundAt:()=>620,canOccupy:x=>x<680||x>700};
  advanceEnemySaltik(e,{player,dt:8,movement});
  assert.ok(e.x>700&&e.x<=800,'a long frame crossed a blocked route gap');
});

test('low armor retains normal weapons and movement without an invincible guard rush',()=>{
  const e=createEnemySaltik({id:19,x:700},{y:620,random:.25});e.hp=8;e.guard=true;e.cooldown=0;
  const movement={minX:100,maxX:900,groundAt:()=>620};
  const result=advanceEnemySaltik(e,{player,dt:.5,movement});
  assert.equal(e.guard,false);assert.notEqual(e.movementMode,'rush');assert.ok(result.shots.length>0);
  assert.ok(Math.abs(e.x-700)<50);assert.equal(e.y,620);
});

test('normal movement respects route edges and inactive actors never move',()=>{
  const movement={minX:500,maxX:800,groundAt:()=>620};
  const e=createEnemySaltik({id:19,x:700},{y:620,random:.25});e.hp=8;
  advanceEnemySaltik(e,{player,dt:8,movement});assert.ok(e.x>=500&&e.x<=800);
  for(const state of [{hp:0,duelStarted:false},{hp:8,duelStarted:true},{hp:0,groundedDefeat:true,neutralized:true}]){
    Object.assign(e,state);const x=e.x;
    assert.equal(advanceEnemySaltik(e,{player,dt:1,movement}).shots.length,0);
    assert.equal(e.x,x);
  }
});

test('moving shots retain native muzzle geometry after movement and firing pose selection',()=>{
  const e=createEnemySaltik({id:19,x:700},{y:620,random:0});e.cooldown=0;
  const movement={minX:100,maxX:900,groundAt:x=>585+x*.05};
  const result=advanceEnemySaltik(e,{player,dt:1/120,time:0,movement});
  assert.ok(e.x<700);assert.ok(e.firePose>0);
  const geometry=enemySaltikGeometry(e,0),shot=result.shots[0];
  assert.deepEqual([shot.x,shot.y],[geometry.muzzle.x,geometry.muzzle.y]);
  assert.equal(e.y,movement.groundAt(e.x));
});
