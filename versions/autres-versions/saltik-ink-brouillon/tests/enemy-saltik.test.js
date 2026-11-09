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

test('Saltik factory preserves scheduled support and seeded attack variation without changing armor',()=>{
  assert.equal(typeof createEnemySaltik,'function','enemy Saltik API is missing');
  const e=createEnemySaltik({id:19,x:700,type:'turret',tier:1,platformId:'ledge'},{y:620,random:.25});
  assert.deepEqual([e.id,e.x,e.y,e.type,e.tier,e.platformId,e.hp,e.maxHp],[19,700,620,'saltik',1,'ledge',24,24]);
  assert.deepEqual(e,createEnemySaltik({id:19,x:700,type:'turret',tier:1,platformId:'ledge'},{y:620,random:.25}));
});

test('a Saltik alternates exactly three gun shots with a telegraphed pair of physical missiles',()=>{
  const result=encounter(),kinds=result.shots.map(shot=>shot.kind);
  assert.deepEqual(kinds.slice(0,10),['plasma','plasma','plasma','enemy-missile','enemy-missile','plasma','plasma','plasma','enemy-missile','enemy-missile']);
  const firstLock=result.events.find(event=>event.type==='enemy-lock'),firstMissile=result.shots.find(shot=>shot.kind==='enemy-missile');
  assert.ok(firstMissile.time-firstLock.time>=.65,`lock lasted ${firstMissile.time-firstLock.time}`);
  assert.ok(result.frames.some(frame=>frame.phase==='lock'&&frame.lock>.2&&frame.lock<.9&&frame.podRaise>.5));
  assert.ok(result.shots.filter(shot=>shot.kind==='plasma').slice(0,3).every(shot=>shot.damage===6&&shot.radius===4&&shot.life===4&&shot.team==='enemy'));
  for(const shot of result.shots.filter(shot=>shot.kind==='enemy-missile')){
    assert.deepEqual([shot.damage,shot.radius,shot.life,shot.hp,shot.locking,shot.age,shot.team],[10,6,5,1,true,0,'enemy']);
    assert.ok(Math.hypot(shot.vx,shot.vy)<=310);assert.ok(Array.isArray(shot.trail));
  }
  assert.ok(result.events.some(event=>event.type==='enemyshot'));assert.ok(result.events.some(event=>event.type==='enemy-missile'));
  assert.equal(result.enemy.x,700);assert.equal(result.enemy.y,620);assert.equal(result.enemy.platformId,'ledge');assert.ok(result.enemy.phase>10);
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
        assert.ok(Math.abs(shot.vx/speed-axis.x)<1e-9&&Math.abs(shot.vy/speed-axis.y)<1e-9);
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
  e.x=700;e.nextAttack='missile';e.cooldown=0;
  advanceEnemySaltik(e,{player,dt:.4,time:5});assert.equal(e.attackPhase,'lock');
  e.x=1600;advanceEnemySaltik(e,{player,dt:.1,time:5.4});
  e.x=700;
  let firstShot=null;
  for(let i=0;i<180;i++){const result=advanceEnemySaltik(e,{player,dt:1/120,time:5.5+i/120});if(result.shots.length){firstShot=i/120;break;}}
  assert.ok(firstShot>=.65,`re-entry fired after ${firstShot}`);
  e.hp=0;assert.equal(advanceEnemySaltik(e,{player,dt:10,time:10}).shots.length,0);
});

test('attack timings remain stable across simulation step sizes and seeded runs',()=>{
  const small=encounter({step:1/120}),large=encounter({step:1/30});
  assert.deepEqual(small.shots.map(s=>s.kind),large.shots.map(s=>s.kind));
  small.shots.forEach((shot,index)=>assert.ok(Math.abs(shot.time-large.shots[index].time)<=1/30+1e-8));
  assert.deepEqual(small,encounter({step:1/120}));
});

test('interrupting a burst at the range edge cannot restart free gun barrages',()=>{
  const e=createEnemySaltik({id:19,x:700},{y:620,random:0});e.cooldown=0;
  assert.equal(advanceEnemySaltik(e,{player,dt:1/120,time:0}).shots.length,1);
  e.x=1600;advanceEnemySaltik(e,{player,dt:1/120,time:1/120});e.x=700;
  const kinds=[];
  for(let i=0;i<240;i++)for(const shot of advanceEnemySaltik(e,{player,dt:1/120,time:2/120+i/120}).shots)kinds.push(shot.kind);
  assert.deepEqual(kinds,['enemy-missile','enemy-missile']);
});
