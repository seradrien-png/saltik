import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {selectLevelMusic} from '../src/music-tracks.js';

test('only Fossiles rouges receives the supplied red sand score',()=>{
 const media={src:'',pauseCalls:0,loadCalls:0,playCalls:0,
  getAttribute(){return this.src;},pause(){this.pauseCalls++;},load(){this.loadCalls++;},play(){this.playCalls++;}};
 assert.equal(selectLevelMusic(5,media),true);
 assert.equal(media.src,'./audio/saltik_sable_rouge_v2.ogg');assert.equal(media.volume,.40);assert.equal(media.loop,true);
 selectLevelMusic(5,media);assert.equal(media.loadCalls,1,'reselecting must reuse the same media element and track');
 assert.equal(media.playCalls,0,'playback remains owned by the audio bus');
 assert.equal(selectLevelMusic(4,media),false);
 assert.equal(selectLevelMusic(2,media),false);
 assert.equal(selectLevelMusic(3,media),true);assert.equal(media.src,'./audio/saltik_velours_01_mecanique.mp3');assert.equal(media.volume,.40);
 assert.equal(selectLevelMusic(1,media),true);assert.equal(media.src,'./audio/forest-loop.ogg');assert.equal(media.volume,.32);
 assert.equal(selectLevelMusic(5,null),false);
});

test('the red sand rendition retains provenance and decodes to an audible complete score',()=>{
 const metadata=JSON.parse(readFileSync(new URL('../docs/red-sand-music-validation.json',import.meta.url)));
 const source=readFileSync(new URL('../audio-sources/Saltik_Sable_Rouge_La_Plaine_des_Ombres_V2.mid',import.meta.url));
 assert.equal(createHash('sha256').update(source).digest('hex'),'ec7328b897e7a53ddeb380096ddb54f8c2857edd77b7aed11fa9fdc56167d9b4');
 assert.equal(metadata.tracks,17);assert.equal(metadata.note_on_count,1292);assert.equal(metadata.ticks_per_quarter,220);
 assert.deepEqual(metadata.tempos,[{tick:0,microseconds_per_quarter:697674}]);assert.equal(metadata.program_changes.length,16);
 const file=new URL('../dist/audio/saltik_sable_rouge_v2.ogg',import.meta.url);
 const bytes=readFileSync(file);assert.equal(bytes.subarray(0,4).toString(),'OggS');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),metadata.output_sha256);
 const decoded=spawnSync('ffmpeg',['-v','error','-i',file.pathname,'-f','f32le','-ac','1','-ar','8000','pipe:1'],{maxBuffer:8*1024*1024});
 assert.equal(decoded.status,0,decoded.stderr?.toString());
 const pcm=decoded.stdout;const samples=pcm.length/4;
 assert.ok(Math.abs(samples/8000-91.3752)<.03,'the full MIDI timeline and natural release must be retained');
 let squares=0,peak=0;
 for(let i=0;i<pcm.length;i+=4){const v=pcm.readFloatLE(i);assert.ok(Number.isFinite(v));squares+=v*v;peak=Math.max(peak,Math.abs(v));}
 assert.ok(Math.sqrt(squares/samples)>.02,'decoded music must have an audible signal');assert.ok(peak<1,'render must not clip');
});
