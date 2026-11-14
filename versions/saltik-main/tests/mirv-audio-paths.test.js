import test from 'node:test';import assert from 'node:assert/strict';import {createMirvAudio} from '../src/mirv-audio.js';
const context=()=>({currentTime:0,createGain:()=>({gain:{value:1},connect(){}}),decodeAudioData:async()=>({duration:1.25})});
test('real mortar and archival falling recordings override only those two MIRV samples',async()=>{
 const urls=[],audio=createMirvAudio(context(),{},{paths:{launch:'./audio/real-weapons/m327-mortar-launch.ogg',fall:'./audio/real-weapons/archival-shell-whistle.ogg'},fetch:async url=>{urls.push(url);return{ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};}});
 await audio.preload();assert(urls.includes('./audio/real-weapons/m327-mortar-launch.ogg'));assert(urls.includes('./audio/real-weapons/archival-shell-whistle.ogg'));assert(!urls.some(u=>u.endsWith('01_mortier_depart.ogg')));assert.equal(urls.length,7);assert.equal(audio.snapshot.loaded,7);
});
test('an unavailable real recording falls back to its preserved user-kit OGG',async()=>{
 const urls=[],audio=createMirvAudio(context(),{},{paths:{launch:'./audio/real-weapons/missing.ogg'},fetch:async url=>{urls.push(url);return{ok:!url.includes('/real-weapons/'),arrayBuffer:async()=>new ArrayBuffer(4)};}});
 await audio.preload();assert(urls.includes('./audio/real-weapons/missing.ogg'));assert(urls.includes('./audio/mirv/01_mortier_depart.ogg'));assert.equal(audio.snapshot.loaded,7);assert.equal(audio.snapshot.failed,0);
});
