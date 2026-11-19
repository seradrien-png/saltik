import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createAudio} from '../src/audio.js';

async function fixture(run,{fail=false,defer=false}={}){
 const previousWindow=globalThis.window,previousDocument=globalThis.document;
 const param=(value=1)=>({value,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.peak=Math.max(this.peak??0,v);},exponentialRampToValueAtTime(){},setTargetAtTime(){},cancelAndHoldAtTime(){}});
 const node=()=>({connect(destination){this.destination=destination;},disconnect(){this.disconnected=true;}});
 let ctx;const pending=[];
 class Context{
  constructor(){ctx=this;this.currentTime=0;this.sampleRate=128;this.state='running';this.destination=node();this.sources=[];this.tones=[];}
  createGain(){return {...node(),gain:param()};}
  createDynamicsCompressor(){return {...node(),...Object.fromEntries(['threshold','knee','ratio','attack','release'].map(k=>[k,param()]))};}
  createBuffer(){return {duration:1,getChannelData:()=>new Float32Array(128)};}
  createBufferSource(){const source={...node(),playbackRate:param(),start(...args){this.started=args;},stop(at){this.stopAt=at;}};this.sources.push(source);return source;}
  createBiquadFilter(){return {...node(),frequency:param(),Q:param()};}
  createOscillator(){const tone={...node(),frequency:param(),start(){},stop(){}};this.tones.push(tone);return tone;}
  decodeAudioData(bytes){return Promise.resolve({recording:new TextDecoder().decode(bytes),duration:.26});}
 }
 globalThis.document={getElementById:()=>null};
 globalThis.window={AudioContext:Context,fetch:async path=>{
  if(fail)throw new Error('offline');
  if(defer)await new Promise(resolve=>pending.push(resolve));
  return {ok:true,arrayBuffer:async()=>new TextEncoder().encode(path).buffer};
 }};
 const settle=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};
 try{const audio=createAudio();audio.setPlaying(true);audio.unlock();await settle();await run({audio,get ctx(){return ctx;},settle,release(){for(const resolve of pending.splice(0))resolve();}});}
 finally{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;}
}

test('loaded primary and guided launches use real recordings without oscillator layers',async()=>fixture(async({audio,ctx})=>{
 audio.play({type:'shot'});ctx.currentTime=.095;audio.play({type:'shot'});ctx.currentTime=.19;audio.play({type:'shot'});audio.play({type:'homing'});
 const records=ctx.sources.filter(s=>s.buffer?.recording?.includes('/real-weapons/'));
 assert.equal(records.length,4);assert.equal(ctx.tones.length,0);
 assert.deepEqual(records.slice(0,3).map(s=>s.started[0]),[0,.095,.19]);
 assert.ok(records.slice(0,3).every(s=>s.stopAt-s.started[0]<=.261));
 assert.ok(records[3].buffer.recording.includes('tow-guided-launch'));
 const before=ctx.sources.length;audio.play({type:'shot'});assert.equal(ctx.sources.length,before,'duplicate event at same audio time stays coalesced');
}));

test('recorded sources stop at pause, mute, restart and character swap',async()=>fixture(async({audio,ctx})=>{
 for(const action of [()=>audio.setPlaying(false),()=>audio.setEnabled(false),()=>audio.setPlaying(true,{restart:true}),()=>audio.setCharacter('bt')]){
  audio.setCharacter('striker');audio.setEnabled(true);audio.setPlaying(true,{restart:true});ctx.currentTime+=1;audio.play({type:'homing'});
  const source=ctx.sources.at(-1);ctx.currentTime+=.01;action();assert.equal(source.stopAt,ctx.currentTime);
 }
}));

test('loading never replays stale fire events after pause',async()=>fixture(async({audio,ctx,release,settle})=>{
 audio.play({type:'homing'});audio.play({type:'reload-start'});audio.play({type:'explosion',strikerGuided:true,enemyImpact:true,enemyDestroyed:true});audio.setPlaying(false);const before=ctx.sources.length;
 release();await settle();assert.equal(ctx.sources.length,before);assert.equal(audio.weaponSnapshot.voices,0);
},{defer:true}));

test('unavailable recordings keep the existing audible fallback',async()=>fixture(async({audio,ctx})=>{
 audio.play({type:'shot'});audio.play({type:'homing'});assert.ok(ctx.tones.length>=4);assert.equal(audio.weaponSnapshot.loaded,0);assert.equal(audio.weaponSnapshot.failed,6);
},{fail:true}));

test('shipped real weapon assets match their recorded source manifest',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../docs/real-weapon-audio-provenance.json',import.meta.url)));
 assert.equal(manifest.sources.length,8);
 for(const source of manifest.sources){
  assert.equal(source.license,'CC0-1.0');
  const bytes=readFileSync(new URL(`../${source.asset}`,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),source.assetSHA256);
  assert.match(source.downloadSHA256,/^[a-f0-9]{64}$/);
 }
});

test('recording completion removes its source and character swaps retain BT synthesis',async()=>fixture(async({audio,ctx})=>{
 audio.play({type:'shot'});const source=ctx.sources.at(-1);assert.equal(audio.weaponSnapshot.voices,1);
 source.onended();assert.equal(audio.weaponSnapshot.voices,0);assert.ok(source.disconnected);
 audio.setCharacter('bt');ctx.currentTime=1;audio.play({type:'shot'});audio.play({type:'homing'});
 assert.ok(ctx.tones.length>=4);assert.equal(audio.weaponSnapshot.voices,0);
 audio.setCharacter('gatling');const before=ctx.sources.length;audio.play({type:'gatling-shot'});
 assert.equal(ctx.sources.length,before,'Gatling continues to use its continuous A10 loop');
}));

test('Striker reload recordings start only at main reload events and finish at engine completion',async()=>fixture(async({audio,ctx})=>{
 audio.play({type:'shot'});audio.play({type:'homing'});
 assert.equal(ctx.sources.filter(s=>s.buffer?.recording?.includes('reload')).length,0);
 ctx.currentTime=2;audio.play({type:'reload-start'});
 const magazine=ctx.sources.at(-1);assert.match(magazine.buffer?.recording??'',/striker-reload-start/);assert.equal(magazine.started[0],2);assert.ok(magazine.stopAt<=3.32);
 ctx.currentTime=3.32;audio.play({type:'reload-end'});
 const bolt=ctx.sources.at(-1);assert.match(bolt.buffer?.recording??'',/striker-reload-end/);assert.equal(bolt.started[0],3.32);
 audio.setCharacter('bt');ctx.currentTime=5;const before=ctx.tones.length;audio.play({type:'reload-start'});assert.ok(ctx.tones.length>before);
}));

test('guided impact and destruction recordings require Striker and actual enemy metadata',async()=>fixture(async({audio,ctx})=>{
 for(const destroyed of [false,true]){
  ctx.currentTime+=1;const before=ctx.sources.length;
  audio.play({type:'explosion',strikerGuided:true,enemyImpact:true,enemyDestroyed:destroyed});
  const records=ctx.sources.slice(before).filter(s=>s.buffer?.recording?.includes('/real-weapons/'));
  assert.equal(records.length,1);assert.match(records[0].buffer.recording,destroyed?/guided-destruction/:/guided-impact/);
 }
 for(const character of ['striker','bt','gatling']){
  audio.setCharacter(character);ctx.currentTime+=1;
  const before=ctx.sources.length;
  audio.play({type:'explosion',...(character==='striker'?{}:{strikerGuided:true,enemyImpact:true})});
  assert.equal(ctx.sources.slice(before).filter(s=>s.buffer?.recording?.includes('/real-weapons/')).length,0);
 }
}));


test('Striker cannon and guided reports are exactly 10 percent quieter',async()=>fixture(async({audio,ctx})=>{
 audio.play({type:'shot'});assert.equal(ctx.sources.at(-1).destination.gain.peak,.25*.9);
 audio.play({type:'homing'});assert.equal(ctx.sources.at(-1).destination.gain.peak,.22*.9);
}));

test('recorded reloads and explosions share bounded sources and cancel on lifecycle changes',async()=>fixture(async({audio,ctx})=>{
 for(let i=0;i<30;i++){ctx.currentTime+=.1;audio.play({type:'explosion',strikerGuided:true,enemyImpact:true,enemyDestroyed:true});}
 assert.ok(audio.weaponSnapshot.voices<=16);
 for(const action of [()=>audio.setPlaying(false),()=>audio.setEnabled(false),()=>audio.setPlaying(true,{restart:true}),()=>audio.setCharacter('gatling')]){
  audio.setCharacter('striker');audio.setEnabled(true);audio.setPlaying(true,{restart:true});audio.play({type:'reload-start'});
  const source=ctx.sources.at(-1);action();assert.equal(source.stopAt,ctx.currentTime);assert.equal(audio.weaponSnapshot.voices,0);
 }
}));


test('offline Striker main and both missile fallbacks retain exactly 90 percent of BT levels',async()=>fixture(async({audio,ctx})=>{
 for(const type of ['shot','missile','homing']){
  audio.setCharacter('striker');ctx.currentTime+=1;const from=ctx.tones.length;audio.play({type});
  const striker=ctx.tones.slice(from).map(t=>t.destination.gain.peak);
  audio.setCharacter('bt');ctx.currentTime+=1;const btFrom=ctx.tones.length;audio.play({type});
  const bt=ctx.tones.slice(btFrom).map(t=>t.destination.gain.peak);
  assert.ok(striker.length>0);assert.deepEqual(striker,bt.map(level=>level*.9));
 }
},{fail:true}));
