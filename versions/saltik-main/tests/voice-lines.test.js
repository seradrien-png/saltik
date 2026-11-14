import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createAudio} from '../src/audio.js';
import {VOICE_PATHS,VOICE_EVENTS} from '../src/voice-lines.js';

const settle=()=>new Promise(resolve=>setImmediate(resolve));

async function withAudio(run,{fetchResult}={}){
  const oldWindow=globalThis.window,oldDocument=globalThis.document;
  const requests=[],sources=[];
  const param=()=>({value:1,events:[],setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.events.push(['linear',v]);},
    exponentialRampToValueAtTime(){},setTargetAtTime(v){this.events.push(['target',v]);},cancelAndHoldAtTime(){}});
  const node=()=>({connections:[],connect(other){this.connections.push(other);return other;}});
  let context;
  class AudioContext{
    constructor(){context=this;this.currentTime=0;this.sampleRate=128;this.state='running';this.destination=node();this.sources=sources;}
    createGain(){return Object.assign(node(),{gain:param()});}
    createDynamicsCompressor(){return Object.assign(node(),Object.fromEntries(['threshold','knee','ratio','attack','release'].map(k=>[k,param()])));}
    createMediaElementSource(){this.musicSource=node();return this.musicSource;}
    createBuffer(){return{getChannelData:()=>new Float32Array(128)};}
    createBufferSource(){const source=Object.assign(node(),{start(){this.started=true;},stop(){this.stopped=true;},finish(){this.onended?.();}});sources.push(source);return source;}
    createBiquadFilter(){return Object.assign(node(),{frequency:param(),Q:param()});}
    createOscillator(){const source=Object.assign(node(),{frequency:param(),start(){},stop(){this.stopped=true;}});return source;}
    async decodeAudioData(bytes){return{duration:.6,bytes};}
    resume(){return Promise.resolve();}
  }
  const media={paused:true,play(){this.paused=false;return Promise.resolve();},pause(){this.paused=true;}};
  globalThis.window={AudioContext,fetch:(url)=>{
    if(!url.includes('/audio/mirv/'))requests.push(url);
    return fetchResult?.(url)??Promise.resolve({ok:true,arrayBuffer:()=>Promise.resolve(new ArrayBuffer(4))});
  }};
  globalThis.document={getElementById:()=>media};
  try{await run({requests,sources,media,get voiceSources(){return sources.filter(s=>s.buffer?.bytes);},get context(){return context;}});}finally{
    if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;
    if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
  }
}

test('speech plays one local clip per event, ducks music, and queues without overlap',async()=>withAudio(async f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();
  audio.play({type:'start'});audio.play({type:'homing'});audio.play({type:'saltik-detected'});
  await settle();
  assert.deepEqual(f.requests,['./audio/voices/ready.ogg']);
  assert.equal(audio.speechSnapshot.playing,'ready');
  assert.equal(audio.speechSnapshot.queued,2);
  assert.equal(f.voiceSources.filter(s=>s.started&&!s.stopped).length,1);
  const musicGain=f.context.musicSource.connections[0].gain;
  assert.ok(musicGain.events.some(e=>e[0]==='linear'&&e[1]<=.2));
  f.voiceSources[0].finish();await settle();
  assert.equal(audio.speechSnapshot.playing,'target-lock');
  assert.equal(audio.speechSnapshot.lastLine,'target-lock');
  assert.deepEqual(f.requests.slice(1),['./audio/voices/target-lock.ogg']);
  f.voiceSources[1].finish();await settle();
  assert.equal(audio.speechSnapshot.playing,'saltik-detected');
  assert.equal(audio.speechSnapshot.played['saltik-detected'],1);
}));

test('duel throw plays Goodbye once after the ready line and home cancels it',async()=>withAudio(async f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();
  audio.play({type:'start'});await settle();
  audio.play({type:'duel-tap'});audio.play({type:'duel-throw'});
  assert.equal(audio.speechSnapshot.queued,1,'duel taps must not queue speech');
  f.voiceSources[0].finish();await settle();
  assert.deepEqual(f.requests,['./audio/voices/ready.ogg','./audio/voices/goodbye.ogg']);
  assert.equal(audio.speechSnapshot.playing,'goodbye');
  assert.equal(audio.speechSnapshot.played.goodbye,1);
  audio.setPlaying(false);
  assert.equal(f.voiceSources[1].stopped,true);
  assert.equal(audio.speechSnapshot.queued,0);
}));

test('carrier unplug queues its exact new line while carrier damage stays silent',async()=>withAudio(async f=>{
  assert.equal(VOICE_EVENTS['carrier-disconnected'],'saltik-dont-kill-saltik');
  const audio=createAudio();audio.setPlaying(true);audio.unlock();
  audio.play({type:'start'});await settle();
  audio.play({type:'carrier-bay-disabled'});audio.play({type:'damage'});
  assert.equal(audio.speechSnapshot.queued,0,'ordinary carrier damage must not queue dialogue');
  audio.play({type:'carrier-disconnected'});
  assert.equal(audio.speechSnapshot.queued,1);
  assert.deepEqual(f.requests,['./audio/voices/ready.ogg'],'unplug line waits for existing speech');
  f.voiceSources[0].finish();await settle();
  assert.equal(audio.speechSnapshot.playing,'saltik-dont-kill-saltik');
  assert.equal(audio.speechSnapshot.played['saltik-dont-kill-saltik'],1);
  assert.deepEqual(f.requests,['./audio/voices/ready.ogg','./audio/voices/saltik-dont-kill-saltik.ogg']);
  audio.setPlaying(false);
  assert.equal(f.voiceSources[1].stopped,true);
  audio.setPlaying(true);await settle();
  assert.equal(audio.speechSnapshot.playing,null,'resume cannot replay the canceled unplug line');
}));

test('all fourteen local voice paths resolve to Ogg clips and all six retained clips stay exact',()=>{
  assert.equal(Object.keys(VOICE_PATHS).length,14);
  const retained={
    ready:'2f482c0351696b134451db76c36a6cd942039405f8543aa82f236c923cbda85a',
    goodbye:'1317bddb5e3f67fa5d00f73b2183f321f3d270eded83f443fc852aaa4f35c444',
    'target-lock':'b7eeb8065040b528230fd877ed395bbcc847b016bfb6fa2839589ff6e32fe61e',
    'saltik-detected':'22583d04c6a75f2170ad955198e74b0e0ae344cda899f6d639e899c629778494',
    'grab-him':'d21d57e05b0ea618ecc9ae4ba93e7429e83ae0f9a1ee5706c8dff82fc0444633',
    victory:'445a36e7ea48becead93377174ec37743a75bad2d3bff9987955144df38985cb'
  };
  for(const [id,path] of Object.entries(VOICE_PATHS)){
    assert.match(path,/^\.\/audio\/voices\/[a-z-]+\.ogg$/,'standalone embedder needs a document-relative literal');
    const bytes=readFileSync(new URL(`../dist/${path.slice(2)}`,import.meta.url));
    assert.equal(bytes.subarray(0,4).toString(),'OggS');
    if(retained[id])assert.equal(createHash('sha256').update(bytes).digest('hex'),retained[id]);
  }
});

test('pause cancels a decode and resume does not replay the old line',async()=>{
  let completeFetch;
  await withAudio(async f=>{
    const audio=createAudio();audio.setPlaying(true);audio.unlock();audio.play({type:'start'});
    assert.equal(audio.speechSnapshot.queued,1);
    audio.setPlaying(false);
    completeFetch({ok:true,arrayBuffer:()=>Promise.resolve(new ArrayBuffer(4))});
    await settle();audio.setPlaying(true);await settle();
    assert.equal(f.voiceSources.filter(s=>s.started).length,0);
    assert.equal(audio.speechSnapshot.queued,0);
    audio.play({type:'homing'});await settle();
    assert.equal(audio.speechSnapshot.playing,'target-lock');
  },{fetchResult:url=>url.endsWith('/ready.ogg')?new Promise(resolve=>completeFetch=resolve):undefined});
});

test('mute stops active speech and suppresses a terminal line until a fresh win',async()=>withAudio(async f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();audio.play({type:'saltik-grab-ready'});await settle();
  assert.equal(audio.speechSnapshot.playing,'grab-him');
  audio.setEnabled(false);
  assert.equal(f.voiceSources[0].stopped,true);
  assert.equal(audio.speechSnapshot.playing,null);
  audio.setPlaying(false);audio.play({type:'won'});await settle();
  assert.equal(f.requests.length,1);
  audio.setEnabled(true);await settle();
  assert.equal(audio.speechSnapshot.playing,null);
  audio.play({type:'won'});await settle();
  assert.equal(audio.speechSnapshot.playing,'victory');
}));

test('restart drops a queued line and allows a fresh ready cue',async()=>withAudio(async f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();
  audio.play({type:'start'});await settle();audio.play({type:'saltik-detected'});
  audio.setPlaying(true,{restart:true});
  assert.equal(f.voiceSources[0].stopped,true);
  assert.equal(audio.speechSnapshot.queued,0);
  audio.play({type:'start'});await settle();
  assert.equal(audio.speechSnapshot.playing,'ready');
  audio.play({type:'homing'});f.voiceSources[1].finish();await settle();
  assert.equal(audio.speechSnapshot.playing,'target-lock');
  assert.equal(audio.speechSnapshot.played['saltik-detected']??0,0);
}));

test('a missing clip is skipped so a later voice can still play',async()=>withAudio(async f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();
  audio.play({type:'saltik-detected'});audio.play({type:'saltik-grab-ready'});
  await settle();
  assert.equal(audio.speechSnapshot.failed,1);
  assert.equal(audio.speechSnapshot.playing,'grab-him');
  assert.deepEqual(f.requests,['./audio/voices/saltik-detected.ogg','./audio/voices/grab-him.ogg']);
},{fetchResult:url=>url.endsWith('/saltik-detected.ogg')?Promise.resolve({ok:false}):undefined}));

test('home cancels victory even though it can start after gameplay has stopped',async()=>withAudio(async f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();audio.setPlaying(false);
  audio.play({type:'won'});await settle();
  assert.equal(audio.speechSnapshot.playing,'victory');
  audio.setPlaying(false);
  assert.equal(f.voiceSources[0].stopped,true);
  assert.equal(audio.speechSnapshot.playing,null);
}));

test('a minimal audio host without fetch fails speech silently',async()=>withAudio(async()=>{
  delete globalThis.window.fetch;
  const audio=createAudio();audio.setPlaying(true);audio.unlock();audio.play({type:'start'});
  await settle();
  assert.equal(audio.speechSnapshot.playing,null);
  assert.equal(audio.speechSnapshot.failed,1);
}));

test('a failed fetch from a canceled run cannot remove speech queued by the next run',async()=>{
  let rejectOld,resolveNew;
  const pending=new Promise((_,reject)=>{rejectOld=reject;});
  const next=new Promise(resolve=>{resolveNew=resolve;});
  await withAudio(async f=>{
    const audio=createAudio();audio.setPlaying(true);audio.unlock();audio.play({type:'start'});
    audio.setPlaying(false);audio.setPlaying(true);
    audio.play({type:'homing'});audio.play({type:'saltik-detected'});
    assert.equal(audio.speechSnapshot.queued,2);
    rejectOld(new Error('old file disappeared'));await settle();
    assert.equal(audio.speechSnapshot.queued,2,'old decode failure must leave the new queue untouched');
    assert.equal(audio.speechSnapshot.failed,0,'a canceled failure is not a current playback error');
    resolveNew({ok:true,arrayBuffer:()=>Promise.resolve(new ArrayBuffer(4))});await settle();
    assert.equal(audio.speechSnapshot.playing,'target-lock');
    f.voiceSources[0].finish();await settle();
    assert.equal(audio.speechSnapshot.playing,'saltik-detected');
  },{fetchResult:url=>url.endsWith('/ready.ogg')?pending:url.endsWith('/target-lock.ogg')?next:undefined});
});

test('restart fetches a fresh ready line while the old request is still pending',async()=>{
  let resolveOld,readyCalls=0;
  const old=new Promise(resolve=>{resolveOld=resolve;});
  await withAudio(async f=>{
    const audio=createAudio();audio.setPlaying(true);audio.unlock();audio.play({type:'start'});
    audio.setPlaying(true,{restart:true});audio.play({type:'start'});
    await settle();
    assert.equal(readyCalls,2,'new run must not depend on the canceled request');
    assert.equal(audio.speechSnapshot.playing,'ready');
    resolveOld({ok:true,arrayBuffer:()=>Promise.resolve(new ArrayBuffer(4))});await settle();
    assert.equal(f.voiceSources.length,1,'old completion must not replay speech');
  },{fetchResult:url=>url.endsWith('/ready.ogg')&&++readyCalls===1?old:undefined});
});

test('subtitle callbacks follow actual queued clips and clear immediately on pause or mute',async()=>withAudio(async f=>{
 const shown=[],audio=createAudio({onSpeech:line=>shown.push(line)});audio.setPlaying(true);audio.unlock();audio.play({type:'start'});audio.play({type:'homing'});await settle();
 assert.deepEqual(shown.filter(Boolean),[{id:'ready',duration:.6}]);assert.equal(audio.speechSnapshot.queued,1);
 f.voiceSources[0].finish();await settle();assert.deepEqual(shown.filter(Boolean),[{id:'ready',duration:.6},{id:'target-lock',duration:.6}]);
 audio.setPlaying(false);assert.equal(shown.at(-1),null);audio.setPlaying(true);audio.play({type:'homing'});await settle();audio.setEnabled(false);assert.equal(shown.at(-1),null);assert.equal(audio.speechSnapshot.playing,null);
}));

test('BT and Gatling have distinct queued voice tones and captions follow actual playback duration',async()=>{
 const {createVoiceLines,VOICE_PROFILES}=await import('../src/voice-lines.js');
 assert(VOICE_PROFILES.bt.rate<1);assert.equal(VOICE_PROFILES.gatling.rate,1);
 const oldWindow=globalThis.window,sources=[],starts=[];
 globalThis.window={fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(2)})};
 const ctx={decodeAudioData:async()=>({duration:1}),createBufferSource(){const s={playbackRate:{value:1},connect(){},start(){},stop(){}};sources.push(s);return s;},createBiquadFilter(){return{frequency:{value:0},connect(){}};}};
 try{const voice=createVoiceLines(ctx,{},duration=>starts.push(duration));voice.enqueue('ready','bt');voice.enqueue('goodbye','gatling');await settle();assert.equal(sources[0].playbackRate.value,.84);assert(Math.abs(starts[0]-1/.84)<1e-9);assert.equal(voice.snapshot().character,'bt');sources[0].onended();await settle();assert.equal(sources[1].playbackRate.value,1);assert.equal(voice.snapshot().character,'gatling');voice.cancel();}finally{if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;}
});

test('Gatling selects new local recordings and exact replacement phrases without changing Striker or BT',async()=>withAudio(async f=>{
 const audio=createAudio();audio.setPlaying(true);audio.setCharacter('gatling');audio.unlock();
 for(const type of ['start','homing','saltik-detected','saltik-grab-ready','duel-throw','carrier-disconnected','won'])audio.play({type});
 await settle();
 const ids=['gatling-ready','gatling-target-lock','gatling-enemy-brother','gatling-grab-him','gatling-see-you-later','gatling-carrier','gatling-victory'];
 for(let i=0;i<ids.length;i++){
  assert.equal(audio.speechSnapshot.playing,ids[i]);
  assert.equal(f.requests[i],VOICE_PATHS[ids[i]]);
  f.voiceSources[i].finish();await settle();
 }
 audio.setCharacter('bt');audio.play({type:'saltik-detected'});await settle();
 assert.equal(audio.speechSnapshot.playing,'saltik-detected');
 audio.setPlaying(false);audio.setPlaying(true);audio.setCharacter('striker');audio.play({type:'duel-throw'});await settle();
 assert.equal(audio.speechSnapshot.playing,'goodbye');
}));

test('supplied Gatling loop starts once, replaces bullet synthesis, and stops on every lifecycle boundary',async()=>withAudio(async f=>{
 const audio=createAudio();audio.setPlaying(true);audio.setCharacter('gatling');audio.unlock();
 audio.setGatlingFiring(true);await settle();
 assert.deepEqual(f.requests,['./audio/gatling-brrrt-loop.ogg']);
 assert.equal(audio.gatlingSnapshot.playing,true);assert.equal(f.sources[0].loop,true);
 const count=f.sources.length;for(let i=0;i<30;i++){audio.play({type:'gatling-shot'});audio.setGatlingFiring(true);}
 assert.equal(f.sources.length,count,'no per-bullet synthetic sources or duplicate loops');
 for(const stop of [()=>audio.setGatlingFiring(false),()=>audio.play({type:'gatling-overheat'}),()=>audio.setPlaying(false),()=>audio.setEnabled(false),()=>audio.setCharacter('bt')]){
  audio.setEnabled(true);audio.setPlaying(true);audio.setCharacter('gatling');audio.setGatlingFiring(true);await settle();
  const current=f.sources.findLast(s=>s.loop&&s.started&&!s.stopped);assert.ok(current);
  stop();assert.equal(current.stopped,true);assert.equal(audio.gatlingSnapshot.playing,false);
 }
 assert.equal(f.requests.length,1,'decoded loop is reused across fresh firing actions');
}));

test('releasing while the Gatling sample decodes prevents late playback',async()=>{
 let resolveLoop;
 await withAudio(async f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();audio.setGatlingFiring(true);
  audio.setGatlingFiring(false);resolveLoop({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)});await settle();
  assert.equal(audio.gatlingSnapshot.playing,false);assert.equal(f.sources.length,0);
  audio.setGatlingFiring(true);assert.equal(audio.gatlingSnapshot.playing,true);
 },{fetchResult:()=>new Promise(resolve=>resolveLoop=resolve)});
});
