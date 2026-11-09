import test from 'node:test';
import assert from 'node:assert/strict';

const shutdown=await import('../src/carrier-shutdown.js').catch(()=>({}));
const {createCarrierShutdown,advanceCarrierShutdown}=shutdown;
const player={x:540,y:620,hp:100};
const carrier={id:91,x:700,y:620,dir:-1,hp:1,disabled:true,neutralized:false};
function create(point={x:675,y:620,dir:1,port:{x:688,y:559}}){
  assert.equal(typeof createCarrierShutdown,'function','carrier shutdown factory is missing');
  assert.equal(typeof advanceCarrierShutdown,'function','carrier shutdown advance is missing');
  return createCarrierShutdown(player,carrier,point);
}

test('single action begins a native approach to the supplied disconnect port without taps',()=>{
  const state=create();
  assert.deepEqual([state.phase,state.elapsed,state.enemyId,state.fromX,state.fromY,state.targetX,state.targetY],['approach',0,91,540,620,675,620]);
  assert.deepEqual(state.port,{x:688,y:559});assert.equal('taps' in state,false);
  assert.equal(carrier.neutralized,false);assert.equal(carrier.hp,1);
});

test('approach and unplug consume real durations before one disconnect event and a gentle settle',()=>{
  let current=create();const events=[];
  for(const [dt,phase] of [[.54,'approach'],[.02,'unplug'],[1.03,'unplug'],[.02,'settle']]){
    const result=advanceCarrierShutdown(current,dt);current=result.shutdown;events.push(...result.events);assert.equal(current.phase,phase);
  }
  assert.equal(events.filter(event=>event.type==='carrier-disconnected').length,1);
  assert.equal(current.disconnected,true);
  const result=advanceCarrierShutdown(current,.6);assert.equal(result.shutdown,null);
  assert.equal(result.events.filter(event=>event.type==='carrier-shutdown-end').length,1);
  assert.deepEqual(advanceCarrierShutdown(result.shutdown,10),{shutdown:null,events:[]});
  assert.equal(carrier.hp,1);assert.equal(carrier.neutralized,false);
});

test('large frames cross each phase once and completion timing agrees with small steps',()=>{
  const big=advanceCarrierShutdown(create(),10);
  assert.equal(big.shutdown,null);assert.deepEqual(big.events.map(event=>event.type),['carrier-disconnected','carrier-shutdown-end']);
  let state=create(),elapsed=0;const events=[];
  while(state){const result=advanceCarrierShutdown(state,.01);elapsed+=.01;state=result.shutdown;events.push(...result.events);}
  assert.ok(elapsed>=2.19&&elapsed<=2.21);
  assert.deepEqual(events.map(event=>event.type),big.events.map(event=>event.type));
  assert.equal(events[0].enemyId,91);assert.deepEqual([events[0].x,events[0].y],[688,559]);
});

test('shutdown advances immutably and zero dt preserves the exact sequence for pause',()=>{
  const state=create(),before=structuredClone(state),result=advanceCarrierShutdown(state,.2);
  assert.deepEqual(state,before);assert.notEqual(result.shutdown,state);assert.ok(result.shutdown.x>540&&result.shutdown.x<675);
  assert.deepEqual(advanceCarrierShutdown(result.shutdown,0),{shutdown:result.shutdown,events:[]});
  assert.deepEqual(advanceCarrierShutdown(result.shutdown,-1),{shutdown:result.shutdown,events:[]});
});

test('default placement stays next to the cabin and retains the real supplied world point',()=>{
  const state=createCarrierShutdown(player,carrier);
  assert.ok(Math.abs(state.targetX-carrier.x)<=90);assert.equal(state.targetY,carrier.y);
  const withPoint=create({x:680,y:560});assert.deepEqual(withPoint.port,{x:680,y:560});
  assert.equal(withPoint.targetY,620);
});
