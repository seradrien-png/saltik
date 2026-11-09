import test from 'node:test';
import assert from 'node:assert/strict';
import {createDroneCarrier,damageDroneCarrier,advanceDroneCarrier} from '../src/drone-carrier.js';

const target={x:150,y:620,hp:100};
const carrier=(dir=-1)=>createDroneCarrier({id:91,x:500,dir},{y:620,random:.37});
const geometry=e=>({bays:[{muzzle:{x:e.x-20,y:e.y-120}},{muzzle:{x:e.x+20,y:e.y-120}}],muzzle:{x:e.x,y:e.y-80},muzzleDirection:{x:e.dir,y:0}});
const advance=(e,dt,player=target)=>advanceDroneCarrier(e,{player,dt,geometry,movement:{minX:0,maxX:1200,groundAt:()=>620}});
const knockedOut=(dir=-1)=>{const e=carrier(dir);damageDroneCarrier(e,120);return e;};

test('knockout has a positive-dt pose clock while the intact body stays motionless and silent',()=>{
 for(const dir of [-1,1]){
  const e=knockedOut(dir),start={x:e.x,y:e.y};
  for(let frame=0;frame<1800;frame++){
   assert.deepEqual(advance(e,1/60,{...target,x:500+dir*350}),{shots:[],deployments:[],events:[]});
   assert.equal(e.x,start.x);assert.equal(e.y,start.y);assert.equal(e.vx,0);assert.equal(e.dir,dir);
   assert.equal(e.firePose,0);assert.equal(e.burstRemaining,0);assert.equal(e.attackPhase,'idle');
  }
  assert.ok(e.koElapsed>29.99);assert.equal(e.hp,0);assert.equal(e.knockedOut,true);
  assert.equal(e.backDestroyed,false);assert.equal(e.legDestroyed,false);assert.equal(e.neutralized,false);
 }
});

test('knockout freezes for invalid dt and continues settling even if the player is defeated',()=>{
 const e=knockedOut();advance(e,.3);assert.equal(e.koElapsed,.3);
 const before=structuredClone(e);
 for(const dt of [0,-1,NaN,Infinity])assert.deepEqual(advance(e,dt),{shots:[],deployments:[],events:[]});
 assert.deepEqual(e,before);
 advance(e,.4,{...target,hp:0});assert.equal(e.koElapsed,.7);
});

test('unplugging holds the settled KO pose clock and cannot resume gunfire',()=>{
 const e=knockedOut();advance(e,.8);e.shuttingDown=true;e.shutdownSettled=true;
 const elapsed=e.koElapsed;e.firePose=.14;e.burstRemaining=4;e.attackPhase='burst';
 for(let frame=0;frame<120;frame++)assert.deepEqual(advance(e,1/60),{shots:[],deployments:[],events:[]});
 assert.equal(e.koElapsed,elapsed);assert.equal(e.firePose,0);assert.equal(e.burstRemaining,0);
 e.neutralized=true;
 for(let frame=0;frame<120;frame++)assert.deepEqual(advance(e,1/60),{shots:[],deployments:[],events:[]});
 assert.equal(e.koElapsed,elapsed);assert.equal(e.hp,0);
});
