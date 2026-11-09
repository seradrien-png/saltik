import test from 'node:test';
import assert from 'node:assert/strict';
import {duelVisual,drawDuelWorld,drawDuelScreen} from '../src/duel-art.js';

const duel={phase:'qte',elapsed:0,taps:2,enemyId:11,x:500,y:540,dir:1,playerX:465,enemyX:535,playerY:532,enemyY:548};
const viewport={width:1100,height:720/1.1,camera:200,cameraY:-65};
function drawing(){const calls=[];const c=new Proxy({globalAlpha:1,drawImage(...args){calls.push(args);}}, {get:(t,k)=>k in t?t[k]:()=>{}});return {c,calls};}

test('the locked native pair uses world coordinates in either facing without mutating physical support',()=>{
  for(const dir of [1,-1]){
    const d={...duel,dir},before=structuredClone(d),v=duelVisual(d,viewport);
    assert.equal(v.world,true);assert.equal(v.pair.x,300);assert.equal(v.pair.y,540);
    assert.equal(v.pair.flip,dir);assert.ok(v.pair.scale>0);
    const {c,calls}=drawing();assert.equal(drawDuelWorld(c,{'saltik-duel':{}},d,viewport),true);
    assert.equal(calls.length,1);assert.deepEqual(d,before);
  }
});

test('the thrown enemy grows continuously from its world projection toward the screen',()=>{
  const a=duelVisual({...duel,phase:'throw',elapsed:0},viewport),b=duelVisual({...duel,phase:'throw',elapsed:.48},viewport);
  assert.equal(a.world,false);assert.equal(a.screen.x,duel.enemyX-viewport.camera);
  assert.equal(a.screen.y,duel.enemyY+viewport.cameraY-55);
  assert.ok(b.screen.height>a.screen.height*2);assert.equal(a.cracks,0);assert.equal(b.cracks,0);
  const hit=duelVisual({...duel,phase:'impact',elapsed:.18},viewport);
  assert.ok(Math.abs(hit.screen.height-b.screen.height)<.01);assert.equal(hit.cracks,1);
});

test('the screen impact slides fully out of frame and cracks disappear after recovery',()=>{
  const hit=duelVisual({...duel,phase:'impact',elapsed:0},viewport),slide=duelVisual({...duel,phase:'slide',elapsed:.95},viewport);
  assert.ok(slide.screen.y-slide.screen.height/2>viewport.height);
  assert.ok(hit.screen.height<=viewport.height*.7);
  assert.ok(slide.cracks>0);
  const done=duelVisual({...duel,phase:'recover',elapsed:.2},viewport);assert.equal(done.screen,null);assert.equal(done.cracks,0);
  assert.equal(duelVisual(null,viewport),null);
  const {c,calls}=drawing();assert.equal(drawDuelScreen(c,{'saltik-duel':{}},null,viewport),false);assert.equal(calls.length,0);
});

test('repeated paused visual samples freeze the impact geometry and always use native source crops',()=>{
  const d={...duel,phase:'impact',elapsed:.08};assert.deepEqual(duelVisual(d,viewport),duelVisual(d,viewport));
  const {c,calls}=drawing();assert.equal(drawDuelScreen(c,{'saltik-duel':{}},d,viewport),true);
  assert.equal(calls.length,1);assert.deepEqual(calls[0].slice(1,5),[878,536,482,415]);
});

test('each queued effort has a complete brace and release using the small-arm native pair',()=>{
  for(let n=0;n<5;n++){
    const state={...duel,taps:5,effortsCompleted:n};
    const begin=duelVisual({...state,effortElapsed:0},viewport),peak=duelVisual({...state,effortElapsed:.12},viewport),release=duelVisual({...state,effortElapsed:.239},viewport);
    assert.equal(begin.pair.frame,'engage');assert.equal(peak.pair.frame,'strain');assert.equal(release.pair.frame,'engage');
    assert.equal(peak.pair.effortIndex,n+1);assert.ok(peak.pair.effort>.99);
    assert.equal(begin.pair.x,peak.pair.x);assert.equal(begin.pair.y,peak.pair.y);
  }
});
