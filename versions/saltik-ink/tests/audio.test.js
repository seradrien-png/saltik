import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createAudio} from '../src/audio.js';

test('the offline runtime includes the supplied Black Canopy score',()=>{
  const bytes=readFileSync(new URL('../dist/audio/forest-loop.ogg',import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    '12514b358b8a6937442d35df693f2004425937171ac11b34d5d39aa1b0059875');
});

function audioFixture(run){
  const previousWindow=globalThis.window,previousDocument=globalThis.document;
  const param=value=>({value,events:[],setValueAtTime(v,t){this.value=v;this.events.push(['set',v,t]);},
    exponentialRampToValueAtTime(v,t){this.events.push(['exponential',v,t]);},
    linearRampToValueAtTime(v,t){this.events.push(['linear',v,t]);},
    setTargetAtTime(v,t,k){this.events.push(['target',v,t,k]);},
    cancelAndHoldAtTime(t){this.events.push(['hold',t]);},cancelScheduledValues(t){this.events.push(['cancel',t]);}});
  let context;
  const node=()=>({connections:[],connect(n){this.connections.push(n);return n;}});
  class AudioContext {
    constructor(){context=this;this.currentTime=0;this.sampleRate=128;this.state='running';this.destination=node();this.starts=[];this.sources=[];}
    createGain(){return Object.assign(node(),{gain:param(1)});}
    createDynamicsCompressor(){this.compressor=Object.assign(node(),Object.fromEntries(['threshold','knee','ratio','attack','release'].map(k=>[k,param(0)])));return this.compressor;}
    createMediaElementSource(media){this.mediaSource=Object.assign(node(),{mediaElement:media});return this.mediaSource;}
    createBuffer(){return{getChannelData:()=>new Float32Array(128)};}
    createBufferSource(){const n=node();n.start=(...args)=>this.starts.push({kind:'noise',args,source:n});n.stop=(time)=>{n.stoppedAt=time;};this.sources.push(n);return n;}
    createBiquadFilter(){return Object.assign(node(),{frequency:param(0)});}
    createOscillator(){const n=Object.assign(node(),{frequency:param(0)});n.start=(...args)=>this.starts.push({kind:'tone',args,source:n});n.stop=(time)=>{n.stoppedAt=time;};this.sources.push(n);return n;}
    resume(){this.state='running';return Promise.resolve();}
  }
  const media={paused:true,muted:false,currentTime:12,playCalls:0,pauseCalls:0,
    play(){this.playCalls++;this.paused=false;return Promise.resolve();},pause(){this.pauseCalls++;this.paused=true;}};
  globalThis.window={AudioContext};globalThis.document={getElementById:()=>media};
  try{return run({media,get context(){return context;}});}finally{
    if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;
    if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;
  }
}

test('the very first primary shot creates sound at audio time zero',()=>audioFixture(f=>{
  const audio=createAudio();audio.unlock();audio.play({type:'shot'});
  const count=f.context.starts.length;
  assert.ok(count>=3,'a ready primary shot must not be suppressed by an uninitialized cadence clock');
  audio.play({type:'shot'});assert.equal(f.context.starts.length,count,'same-frame duplicates remain suppressed');
}));

test('music and combat sounds share a protected output and transients schedule a smooth duck and recovery',()=>audioFixture(f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();
  const ctx=f.context;
  assert.ok(ctx.mediaSource,'music must pass through the same protected output as effects');
  const musicBus=ctx.mediaSource.connections[0],limiter=musicBus.connections[0];
  assert.equal(limiter,ctx.compressor);assert.ok(limiter.connections[0].connections.includes(ctx.destination));
  assert.ok(f.media.volume>=.195&&f.media.volume<=.205,'the score should be twice its prior mix level');
  audio.play({type:'missile'});
  assert.ok(musicBus.gain.events.some(e=>e[0]==='linear'&&e[1]>=.68&&e[1]<=.72&&e[2]<=.035),'launch duck should leave the louder score present');
  assert.ok(musicBus.gain.events.some(e=>e[0]==='target'&&e[1]===1&&e[2]>.2),'music recovery is scheduled on the audio clock');
  assert.equal(f.media.playCalls,1,'ducking must not restart the track');
}));

test('pause, mute, home and restart preserve media lifecycle and cancel stale ducking',()=>audioFixture(f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();audio.play({type:'explosion',big:true});
  assert.equal(f.media.loop,true,'the gameplay score repeats at its media boundary');
  const gain=f.context.mediaSource?.connections[0].gain;
  assert.ok(gain,'music ducking requires its own gain bus');
  audio.setPlaying(false);assert.ok(f.media.paused);assert.equal(f.media.currentTime,12);
  assert.ok(gain.events.some(e=>e[0]==='target'&&e[1]===1&&e[2]===0),'pause clears the pending combat duck');
  audio.setEnabled(false);assert.ok(f.media.muted&&f.media.paused);
  const starts=f.context.starts.length;audio.play({type:'deflect'});assert.equal(f.context.starts.length,starts);
  audio.setEnabled(true);assert.ok(f.media.paused,'unmuting a paused game never starts music');
  audio.setPlaying(true,{restart:true});assert.equal(f.media.currentTime,0);assert.equal(f.media.paused,false);
  audio.setPlaying(false);assert.ok(f.media.paused);
}));

test('manual parry anticipation and successful deflection produce distinct audible layers',()=>audioFixture(f=>{
  const audio=createAudio();audio.unlock();audio.play({type:'parry-start'});
  const anticipation=f.context.starts.length;assert.ok(anticipation>0);
  audio.play({type:'deflect'});assert.ok(f.context.starts.length>anticipation);
}));

test('primary shot and both missile classes remain identifiable at the calmer mix',()=>audioFixture(f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();
  audio.play({type:'shot'});
  const shot=f.context.starts.slice();
  assert.ok(shot.length>=3,'primary gun needs a soft puff and low pitched body');
  assert.ok(shot.some(s=>s.kind==='noise')&&shot.some(s=>s.kind==='tone'));
  f.context.currentTime=1;audio.play({type:'missile'});
  const mirv=f.context.starts.slice(shot.length);
  assert.ok(mirv.length>=3,'MIRV launch needs ignition, exhaust, and launcher mechanism');
  assert.ok(mirv.some(s=>s.kind==='noise')&&mirv.some(s=>s.kind==='tone'));
  f.context.currentTime=2;audio.play({type:'homing'});
  const guided=f.context.starts.slice(shot.length+mirv.length);
  assert.ok(guided.length>=3,'guided launch needs its own motor and seeking servo');
  assert.ok(guided.some(s=>s.kind==='noise')&&guided.some(s=>s.kind==='tone'));
}));

test('primary reports are low, rounded, and substantially quieter than before',()=>audioFixture(f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();audio.play({type:'shot'});
  const shot=f.context.starts;
  assert.ok(shot.some(s=>s.kind==='noise'),'a soft puff should accompany the pulse');
  assert.ok(shot.some(s=>s.kind==='tone'&&s.source.type==='sine'),'a sine pulse should carry the pitch');
  for(const {kind,source,args} of shot){
    const filter=kind==='noise'?source.connections[0]:null;
    if(filter){
      assert.equal(filter.type,'lowpass','the puff must have no exposed crack');
      assert.ok(filter.frequency.value<=950,'noise should roll off near 900 Hz');
    }
    const gain=(filter??source).connections[0].gain;
    const attack=gain.events.find(e=>e[0]==='linear');
    assert.ok(attack?.[2]-args[0]>=.012-1e-9,'every layer should ease in for at least 12 ms');
    assert.ok(attack[1]<=.07,'the additional 15 percent lift must preserve the soft primary report');
    if(kind==='tone')assert.ok(source.frequency.events[0][1]<=150,'the pulse should stay in a low register');
  }
  const duck=f.context.mediaSource.connections[0].gain.events.find(e=>e[0]==='linear');
  assert.ok(duck&&duck[1]>=.88,'firing should leave almost all music audible');
}));

test('other launch reports are restrained and simultaneous plasma reports coalesce',()=>audioFixture(f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();
  for(const type of ['missile','homing','enemy-missile','breach-shot']){
    f.context.currentTime+=1;
    const before=f.context.starts.length;audio.play({type});
    const cue=f.context.starts.slice(before);
    assert.ok(cue.length>=2,`${type} should remain audible`);
    const peak=Math.max(...cue.map(({kind,source})=>{
      const path=kind==='noise'?source.connections[0]:source;
      return path.connections[0].gain.events.find(e=>e[0]==='linear')[1];
    }));
    assert.ok(peak<=.22,`${type} should have a restrained source gain (got ${peak})`);
  }
  f.context.currentTime=10;
  const before=f.context.starts.length;
  for(let i=0;i<8;i++)audio.play({type:'enemyshot'});
  const first=f.context.starts.length-before;
  assert.ok(first>=2&&first<=3,'one plasma salvo should yield a small layered cue');
  assert.ok(f.context.starts.slice(before).every(({kind,source})=>{
    const path=kind==='noise'?source.connections[0]:source;
    return path.connections[0].gain.events.find(e=>e[0]==='linear')[1]<=.08;
  }),'a plasma salvo should remain softer than other launches');
  f.context.currentTime=10.07;audio.play({type:'enemyshot'});
  assert.ok(f.context.starts.length>before+first,'later hostile fire must still be audible');
}));

test('eight physical boss rockets produce one bounded volley whoosh and cancel on pause',()=>audioFixture(f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();
  audio.play({type:'boss-pod-volley',count:8,x:300,y:90});
  const cue=f.context.starts.slice();
  assert.ok(cue.length>=2&&cue.length<=3,'a volley should synthesize a single layered report');
  assert.ok(cue.some(s=>s.kind==='noise')&&cue.some(s=>s.kind==='tone'));
  assert.ok(cue.every(({kind,source})=>{
    const path=kind==='noise'?source.connections[0]:source;
    return path.connections[0].gain.events.find(e=>e[0]==='linear')[1]<=.20;
  }),'a volley should be soft regardless of rocket count');
  f.context.currentTime=.1;audio.setPlaying(false);
  assert.ok(f.context.sources.every(s=>s.stoppedAt===.1),'the whoosh must cancel with the game');
}));

test('same-frame explosion piles are bounded while later impacts still sound',()=>audioFixture(f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();
  for(let i=0;i<8;i++)audio.play({type:'explosion',big:false});
  assert.ok(f.context.starts.length<=4,'one rocket interception frame should not sum eight full blasts');
  f.context.currentTime=.1;const before=f.context.starts.length;
  audio.play({type:'explosion'});assert.ok(f.context.starts.length>before);
}));

test('reload separates magazine handling and final bolt across the 1.32 second interval',()=>audioFixture(f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();
  audio.play({type:'reload-start'});
  const removal=f.context.starts.map(s=>s.args[0]??0);
  assert.ok(removal.some(t=>t>=.15&&t<=.4),'magazine removal must have a separated click');
  assert.ok(removal.some(t=>t>=.48&&t<.8),'new magazine must seat during the reload');
  assert.ok(removal.some(t=>t>=.85&&t<1.22),'a later mechanical feed should make the reload legible');
  f.context.currentTime=1.32;const before=f.context.starts.length;audio.play({type:'reload-end'});
  const bolt=f.context.starts.slice(before).map(s=>s.args[0]??0);
  assert.ok(bolt.some(t=>t>=1.4&&t<1.65),'bolt should return after the reload-end event');
}));

test('pause and mute stop queued Web Audio sources and reject later effects',()=>audioFixture(f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();
  audio.play({type:'reload-start'});
  const queued=f.context.sources.slice();
  assert.ok(queued.length>0);
  f.context.currentTime=.05;audio.setPlaying(false);
  assert.ok(queued.every(s=>s.stoppedAt===.05),'future and active reload layers must be canceled on pause');
  const count=f.context.starts.length;audio.play({type:'reload-end'});
  assert.equal(f.context.starts.length,count,'paused game must not queue a bolt sound');
  audio.setPlaying(true);audio.play({type:'missile'});
  const launched=f.context.sources.slice(queued.length);assert.ok(launched.length>0);
  f.context.currentTime=.2;audio.setEnabled(false);
  assert.ok(launched.every(s=>s.stoppedAt===.2),'mute must cancel active and future missile layers');
  audio.setEnabled(true);audio.setPlaying(true,{restart:true});
  assert.equal(f.context.sources.length,queued.length+launched.length,'unmute and restart must not replay old voices');
}));

test('restart rearms the first primary shot even within the previous cadence window',()=>audioFixture(f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();audio.play({type:'shot'});
  const first=f.context.starts.length;
  audio.setPlaying(true,{restart:true});audio.play({type:'shot'});
  assert.ok(f.context.starts.length>first,'a new run should not inherit the prior run’s fire cooldown');
}));

test('terminal win cue plays after the view closes and remains cancellable',()=>audioFixture(f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();audio.setPlaying(false);
  audio.play({type:'shot'});assert.equal(f.context.starts.length,0,'combat stays gated after the view closes');
  audio.play({type:'won'});
  assert.equal(f.context.starts.length,2,'the terminal cue has its two notes after setPlaying(false)');
  assert.ok(f.context.starts[1].args[0]>.1,'second note is scheduled on the audio clock');
  f.context.currentTime=.05;audio.setPlaying(false);
  assert.ok(f.context.sources.every(s=>s.stoppedAt===.05),'home or restart can cancel terminal notes');
}));

test('each boss breach phase produces a layered cue from its emitted event',()=>audioFixture(f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();
  for(const type of ['breach-start','breach-tap','breach-tear','breach-hole','breach-fire','breach-return','breach-end']){
    const before=f.context.starts.length;
    audio.play({type});
    const cue=f.context.starts.slice(before);
    assert.ok(cue.some(s=>s.kind==='noise'),`${type} needs a physical noise layer`);
    assert.ok(cue.some(s=>s.kind==='tone'),`${type} needs a pitched action layer`);
  }
}));

test('all three rapid breach pulls create distinct strokes without a sound cooldown',()=>audioFixture(f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();
  const strokes=[];
  for(let taps=1;taps<=3;taps++){
    const before=f.context.starts.length;
    audio.play({type:'breach-tap',taps});
    strokes.push(f.context.starts.length-before);
  }
  assert.ok(strokes.every(count=>count>=2),`each pull needs its own stroke: ${strokes}`);
}));

test('pause and mute cancel the breach cannon tail',()=>audioFixture(f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();
  audio.play({type:'breach-fire'});
  const first=f.context.sources.slice();assert.ok(first.length>=2);
  f.context.currentTime=.1;audio.setPlaying(false);
  assert.ok(first.every(source=>source.stoppedAt===.1));
  const quiet=f.context.starts.length;audio.play({type:'breach-return'});
  assert.equal(f.context.starts.length,quiet);
  audio.setPlaying(true);audio.play({type:'breach-fire'});
  const second=f.context.sources.slice(first.length);assert.ok(second.length>=2);
  f.context.currentTime=.2;audio.setEnabled(false);
  assert.ok(second.every(source=>source.stoppedAt===.2));
}));

test('each of six hull burst events plays its own shot crack and later metal strike',()=>audioFixture(f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();
  for(let shot=1;shot<=6;shot++){
    f.context.currentTime=shot*.2;
    const before=f.context.starts.length;
    audio.play({type:'breach-shot',kind:'hull',shot});
    const cue=f.context.starts.slice(before);
    assert.ok(cue.some(s=>s.kind==='noise'&&s.args[0]===f.context.currentTime),`shot ${shot} needs an immediate crack`);
    assert.ok(cue.some(s=>s.kind==='tone'&&s.args[0]>=f.context.currentTime+.04),`shot ${shot} needs a later metal impact`);
  }
}));

test('pod raise and pod rupture have distinct layered cues',()=>audioFixture(f=>{
  const audio=createAudio();audio.setPlaying(true);audio.unlock();
  audio.play({type:'boss-pod-warning'});
  const warning=f.context.starts.slice();
  assert.ok(warning.some(s=>s.kind==='noise')&&warning.some(s=>s.kind==='tone'),'hydraulic warning needs noise and pitch');
  audio.play({type:'pod-destroyed'});
  const rupture=f.context.starts.slice(warning.length);
  assert.ok(rupture.filter(s=>s.kind==='noise').length>=2,'rupture needs tear and low explosion layers');
  assert.ok(rupture.some(s=>s.kind==='tone'),'rupture needs its own pitched impact');
}));
