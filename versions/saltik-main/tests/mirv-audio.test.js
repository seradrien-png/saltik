import test from 'node:test';
import assert from 'node:assert/strict';
import {createMirvAudio} from '../src/mirv-audio.js';

function fixture({random=()=>.5,deferred=false,basicParams=false}={}){
 const param=value=>({value,events:[],setValueAtTime(v,t){this.value=v;this.events.push(['set',v,t]);},
  linearRampToValueAtTime(v,t){this.events.push(['ramp',v,t]);},
  ...(basicParams?{}:{cancelAndHoldAtTime(t){this.events.push(['hold',t]);},setTargetAtTime(v,t,k){this.events.push(['target',v,t,k]);}}),
  cancelScheduledValues(t){this.events.push(['cancel',t]);}});
 const node=()=>({connect(n){this.output=n;return n;},disconnect(){this.disconnected=true;}});
 const sources=[],requests=[],deferredDecodes=[];
 const ctx={currentTime:0,destination:node(),createGain:()=>({...node(),gain:param(1)}),
  createDynamicsCompressor:()=>({...node(),...Object.fromEntries(['threshold','knee','ratio','attack','release'].map(k=>[k,param(0)]))}),
  createBufferSource(){const s={...node(),playbackRate:param(1),start(){this.started=true;},stop(t){this.stoppedAt=t;}};sources.push(s);return s;},
  decodeAudioData(bytes){const buffer={name:bytes.name,duration:2};return deferred?new Promise(resolve=>deferredDecodes.push(()=>resolve(buffer))):Promise.resolve(buffer);}};
 const fetch=async path=>{requests.push(path);return {ok:true,arrayBuffer:async()=>({name:path})};};
 const audio=createMirvAudio(ctx,ctx.destination,{fetch,random});
 const launch=id=>audio.play({type:'mirv-launch',projectileId:id,salvoId:id,x:0,y:0,vy:-500});
 const split=id=>audio.play({type:'mirv-separation',projectileId:id,salvoId:id,x:0,y:0,vy:-100});
 const child=(id,salvoId,vy=100)=>({id,mirvSalvoId:salvoId,kind:'grenade',team:'player',life:2,x:0,y:0,vy});
 return {audio,ctx,sources,requests,deferredDecodes,launch,split,child};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('seven local OGGs preload once and launch/separation are duplicate safe',async()=>{
 const f=fixture();await Promise.all([f.audio.preload(),f.audio.preload()]);
 assert.equal(f.requests.length,7);assert.ok(f.requests.every(p=>p.startsWith('./audio/mirv/')&&p.endsWith('.ogg')));
 f.launch(1);f.launch(1);assert.equal(f.audio.snapshot.oneShots,1);assert.equal(f.audio.snapshot.flightLoops,1);
 f.split(1);f.split(1);assert.equal(f.audio.snapshot.oneShots,2);assert.equal(f.audio.snapshot.flightLoops,0);
 assert.ok(f.sources.find(s=>s.buffer.name.includes('vol_boucle')).stoppedAt>0);
 assert.ok(Object.isFrozen(f.audio.snapshot));
});

test('one shared fall follows actual descending velocity across overlapping salvos',async()=>{
 const f=fixture();await f.audio.preload();f.launch(1);f.launch(2);f.launch(3);
 assert.equal(f.audio.snapshot.flightLoops,2);
 f.split(1);f.split(2);
 f.audio.sync([f.child(11,1,-10),f.child(21,2,-1)]);assert.equal(f.audio.snapshot.fallLoop,false);
 f.audio.sync([f.child(11,1,100),f.child(21,2,200)]);
 const fall=f.sources.find(s=>s.loop&&s.buffer.name.includes('chute'));
 assert.ok(fall);const slow=f.audio.snapshot.fallRate;
 f.ctx.currentTime=.2;f.audio.sync([f.child(11,1,1000),f.child(21,2,1200)]);
 assert.ok(f.audio.snapshot.fallRate>slow);assert.ok(fall.playbackRate.events.some(e=>e[0]==='target'));
 assert.equal(f.sources.filter(s=>s.loop&&s.buffer.name.includes('chute')).length,1);
 f.audio.sync([]);assert.equal(f.audio.snapshot.fallLoop,false);assert.equal(f.audio.snapshot.flightLoops,0);
 assert.ok(fall.stoppedAt>.2);assert.equal(f.audio.snapshot.oneShots,5,'expiry makes no detonation');
});

test('independent impact variants play normally with bounded voices and a protected common bus',async()=>{
 let n=0;const values=[0,.5,.4,.5,.99,.5];const f=fixture({random:()=>values[n++%values.length]});await f.audio.preload();
 for(let i=0;i<18;i++)f.audio.play({type:'mirv-impact',projectileId:i+10,salvoId:1});
 assert.equal(f.audio.snapshot.oneShots,12);
 assert.deepEqual(f.sources.slice(0,3).map(s=>s.buffer.name.split('/').at(-1)),['05_mirv_impact_1.ogg','05_mirv_impact_2.ogg','05_mirv_impact_3.ogg']);
 assert.ok(f.sources.every(s=>s.playbackRate.value===1));assert.ok(f.sources.slice(0,6).every(s=>s.stoppedAt>0));
 const gain=f.sources.at(-1).output;assert.ok(gain.output.gain.value<1);assert.ok(gain.output.output.threshold,'a common compressor protects overlapping samples');
 const last=f.sources.at(-1);last.onended();assert.equal(f.audio.snapshot.oneShots,11);
});

test('pause during decode never starts stale sources after resume, and dispose is final',async()=>{
 const f=fixture({deferred:true});const loading=f.audio.preload();f.launch(1);await tick();
 assert.equal(f.deferredDecodes.length,7);f.audio.setActive(false);f.audio.setActive(true);
 for(const resolve of f.deferredDecodes)resolve();await loading;await tick();assert.equal(f.sources.length,0);
 f.launch(2);assert.equal(f.sources.length,2);f.audio.setActive(false);
 assert.ok(f.sources.every(s=>s.stoppedAt>0));assert.equal(f.audio.snapshot.flightLoops,0);
 f.audio.setActive(true);f.audio.dispose();f.launch(3);f.audio.sync([f.child(31,3)]);assert.equal(f.sources.length,2);
});

test('removed parents cannot start late flight loops and missing samples fail softly',async()=>{
 const f=fixture({deferred:true,basicParams:true});const loading=f.audio.preload();f.launch(1);f.split(1);f.audio.play({type:'mirv-impact',projectileId:2,salvoId:1});f.audio.sync([]);await tick();
 for(const resolve of f.deferredDecodes)resolve();await loading;await tick();
 assert.equal(f.audio.snapshot.flightLoops,0);assert.equal(f.sources.filter(s=>s.loop).length,0);
 assert.equal(f.sources.length,0,'expired launch transients must never play after decode');
 const failed=createMirvAudio(f.ctx,f.ctx.destination,{fetch:async()=>{throw new Error('offline');}});
 await assert.doesNotReject(failed.preload());failed.play({type:'mirv-launch',projectileId:9,salvoId:9});failed.sync([]);
 assert.equal(failed.snapshot.loaded,0);assert.equal(failed.snapshot.failed,7);failed.dispose();
});

test('active transitions are idempotent and basic AudioParam fakes support fade cleanup',async()=>{
 const f=fixture({basicParams:true});await f.audio.preload();f.launch(1);
 const parent={id:1,mirvSalvoId:1,kind:'mirv',life:3,vy:-400};
 f.audio.sync([parent,{...f.child(2,1,900),mirvSalvoId:undefined}]);
 assert.equal(f.audio.snapshot.flightLoops,1);assert.equal(f.audio.snapshot.fallLoop,false);
 const epoch=f.audio.snapshot.epoch;f.audio.setActive(true);assert.equal(f.audio.snapshot.epoch,epoch);
 f.audio.setActive(false);const pausedEpoch=f.audio.snapshot.epoch;f.audio.setActive(false);assert.equal(f.audio.snapshot.epoch,pausedEpoch);
 assert.ok(f.sources.every(s=>s.output.gain.events.some(e=>e[0]==='ramp'&&e[1]===0&&e[2]===.08)));
 f.audio.setActive(true);f.audio.sync([parent,f.child(2,1,1200)]);
 assert.equal(f.audio.snapshot.flightLoops,1);assert.equal(f.audio.snapshot.fallLoop,true);assert.equal(f.audio.snapshot.fallRate,1.35);
 f.audio.sync([parent,{...f.child(2,1,1200),life:0}]);assert.equal(f.audio.snapshot.fallLoop,false);
 f.audio.stopAll();assert.equal(f.audio.snapshot.flightLoops,0);assert.equal(f.audio.snapshot.oneShots,0);
});


test('native loop regions use quiet stereo edges without changing recording pitch',async()=>{
 const f=fixture();const left=new Float32Array(1250).fill(.4),right=new Float32Array(1250).fill(.3);
 left[12]=.001;right[12]=-.002;left[1234]=-.002;right[1234]=.001;
 f.ctx.decodeAudioData=async bytes=>({name:bytes.name,duration:1.25,length:1250,sampleRate:1000,numberOfChannels:2,getChannelData:i=>i?right:left});
 await f.audio.preload();f.launch(1);f.split(1);f.audio.sync([f.child(2,1,1200)]);
 for(const source of f.sources.filter(s=>s.loop)){
  assert.equal(source.loopStart,.012);assert.equal(source.loopEnd,1.235);
 }
 assert.equal(f.sources.find(s=>s.buffer.name.includes('vol_boucle')).playbackRate.value,1);
});

test('bounded deduplication still rejects old monotonic projectile events',async()=>{
 const f=fixture();await f.audio.preload();f.launch(1);f.audio.sync([]);
 for(let i=2;i<602;i++)f.audio.play({type:'mirv-impact',projectileId:i,salvoId:1});
 const count=f.sources.length;f.launch(1);assert.equal(f.sources.length,count);
 assert.ok(f.audio.snapshot.seenEvents<=512);
});
