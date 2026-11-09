import test from 'node:test';
import assert from 'node:assert/strict';
import {bossPodVisual,drawBossPod} from '../src/boss-pod-art.js';

const boss={x:17520,y:560,hp:200,podPhase:'stowed',podRaise:0,podFlash:0,podDestroyed:false};
function canvas(){return new Proxy({draws:[],drawImage(...a){this.draws.push(a);}},{get:(o,k)=>k in o?o[k]:()=>{}});}

test('the pod follows its native stowed, raised, firing, and ruined poses',()=>{
  assert.equal(bossPodVisual(boss).frame,0);
  assert.equal(bossPodVisual({...boss,podPhase:'raising',podRaise:1}).frame,1);
  assert.equal(bossPodVisual({...boss,podPhase:'firing',podRaise:1,podFlash:.1}).frame,2);
  assert.equal(bossPodVisual({...boss,podDestroyed:true,podPhase:'destroyed'}).frame,5);
});

test('the standalone pod is suppressed while Saltik grips or rips it',()=>{
  const c=canvas(),images={'boss-pod':{width:1536,height:1024}};
  assert.equal(drawBossPod(c,images,boss,{breach:{kind:'pod',phase:'qte'}}),false);
  assert.equal(drawBossPod(c,images,boss,{breach:{kind:'pod',phase:'tear'}}),false);
  assert.equal(c.draws.length,0);
  assert.equal(drawBossPod(c,images,boss,{breach:{kind:'pod',phase:'eject'}}),true);
  assert.equal(c.draws.length,1);
});

test('during lift the native mounting foot stays fixed while hydraulics extend and the box rises',()=>{
  const c=canvas(),images={'boss-pod':{width:1536,height:1024}};
  drawBossPod(c,images,{...boss,podPhase:'raising',podRaise:.5});
  assert.equal(c.draws.length,3,'base, hydraulics, and box are separate native source crops');
  const [struts,box,foot]=c.draws;
  assert.equal(struts[0],images['boss-pod']);
  assert.equal(box[0],images['boss-pod']);
  assert.equal(foot[0],images['boss-pod']);
  assert.equal(foot[6],440-488,'the foot keeps its measured local mounting height');
  assert.ok(box[6]<foot[6]);
  assert.ok(struts[8]<190,'only the hydraulic stretch changes height');
});

test('firing art holds its base at the same mount and the ruined socket excludes the neighboring rip pose',()=>{
  const mount=boss.x+95;
  const fired=bossPodVisual({...boss,podPhase:'firing',podRaise:1,podFlash:.1});
  assert.ok(Math.abs(fired.x+(338-fired.anchor[0])*.25-mount)<5);
  const ruin=bossPodVisual({...boss,podPhase:'destroyed',podDestroyed:true});
  assert.ok(ruin.crop[0]>=1140,'socket crop begins after the overflowing rip pose');
  assert.ok(ruin.crop[1]>512,'socket crop excludes the other pose above it');
});
