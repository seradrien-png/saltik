import test from 'node:test';
import assert from 'node:assert/strict';
import {createSaltikDuel,advanceSaltikDuel} from '../src/saltik-duel.js';

const enemy={id:7,x:500,y:620};
const player={x:440,y:620};

test('duel anchors its locked feet and waits indefinitely for five distinct qte presses',()=>{
  let duel=createSaltikDuel(player,enemy);
  assert.deepEqual([duel.enemyId,duel.x,duel.y,duel.dir,duel.playerX,duel.enemyX,duel.playerY,duel.enemyY],
    [7,470,620,1,440,500,620,620]);
  let result=advanceSaltikDuel(duel,false,.45);duel=result.duel;
  assert.equal(duel.phase,'qte');
  result=advanceSaltikDuel(duel,false,100);duel=result.duel;
  assert.deepEqual([duel.phase,duel.taps],['qte',0]);
  for(let tap=1;tap<=5;tap++){
    result=advanceSaltikDuel(duel,true,1/60);duel=result.duel;
    assert.equal(duel.taps,tap);
    assert.equal(result.events[0]?.type,'duel-tap');
    assert.equal(duel.phase,'qte','presses alone cannot skip an effort');
    duel=advanceSaltikDuel(duel,true,1/60).duel;
    assert.equal(duel.taps,tap,'held input does not repeat');
    if(tap<5)duel=advanceSaltikDuel(duel,false,1/60).duel;
  }
  assert.ok(duel.effortsCompleted<5);
  for(let i=0;i<90&&duel.phase==='qte';i++){
    result=advanceSaltikDuel(duel,false,1/60);duel=result.duel;
  }
  assert.equal(duel.phase,'throw');
  assert.equal(duel.effortsCompleted,5);
  assert.equal(result.events.filter(event=>event.type==='duel-throw').length,1);
  result=advanceSaltikDuel(duel,false,.48);duel=result.duel;
  assert.equal(duel.phase,'impact');assert.deepEqual(result.events.map(e=>e.type),['duel-impact']);
  duel=advanceSaltikDuel(duel,false,.18).duel;assert.equal(duel.phase,'slide');
  duel=advanceSaltikDuel(duel,false,.95).duel;assert.equal(duel.phase,'recover');
  result=advanceSaltikDuel(duel,false,.2);assert.equal(result.duel,null);
  assert.deepEqual(result.events.map(e=>e.type),['duel-end']);
});

test('five rapid distinct presses queue five full visible efforts and cap extra taps',()=>{
  let duel=advanceSaltikDuel(createSaltikDuel(player,enemy),false,.45).duel;
  const events=[];
  for(let i=0;i<5;i++){
    duel=advanceSaltikDuel(duel,false,1/60).duel;
    const result=advanceSaltikDuel(duel,true,1/60);duel=result.duel;events.push(...result.events);
  }
  assert.deepEqual([duel.phase,duel.taps,duel.effortsCompleted],['qte',5,0]);
  assert.ok(duel.effortElapsed>0&&duel.effortElapsed<.24);
  for(let i=0;i<20;i++){
    duel=advanceSaltikDuel(duel,false,1/60).duel;
    const result=advanceSaltikDuel(duel,true,1/60);duel=result.duel;events.push(...result.events);
  }
  assert.equal(duel.taps,5);
  assert.equal(events.filter(event=>event.type==='duel-tap').length,5);
  assert.equal(events.filter(event=>event.type==='duel-throw').length,0);
  let previous=duel.effortsCompleted;
  for(let i=0;i<21;i++){
    const result=advanceSaltikDuel(duel,false,1/60);duel=result.duel;events.push(...result.events);
    assert.ok(duel.effortsCompleted>=previous&&duel.effortsCompleted<=previous+1);
    previous=duel.effortsCompleted;
  }
  assert.deepEqual([duel.phase,duel.effortsCompleted],['qte',4]);
  duel=advanceSaltikDuel(duel,false,1/60).duel;
  assert.deepEqual([duel.phase,duel.effortsCompleted],['qte',4]);
  const final=advanceSaltikDuel(duel,false,1/60);duel=final.duel;events.push(...final.events);
  assert.deepEqual([duel.phase,duel.taps,duel.effortsCompleted,duel.effortElapsed],['throw',5,5,0]);
  assert.equal(events.filter(event=>event.type==='duel-throw').length,1);
});

test('holding qte through engage must release and rearm inside qte',()=>{
  let duel=createSaltikDuel(player,enemy);
  duel=advanceSaltikDuel(duel,true,.45).duel;
  assert.equal(duel.phase,'qte');
  duel=advanceSaltikDuel(duel,true,1/60).duel;
  assert.equal(duel.taps,0);
  duel=advanceSaltikDuel(duel,false,1/60).duel;
  duel=advanceSaltikDuel(duel,true,1/60).duel;
  assert.equal(duel.taps,1);
});
