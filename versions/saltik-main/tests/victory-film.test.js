import test from 'node:test';
import assert from 'node:assert/strict';

import {createVictoryFilm} from '../src/victory-film.js';

class Element {
  constructor(document){this.document=document;this.hidden=true;this.dataset={};this.attributes=new Map();this.listeners=new Map();this.paused=true;this.muted=false;this.playCalls=0;this.loadCalls=0;this.textContent='';}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
  removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}
  emit(type,event={}){for(const fn of [...(this.listeners.get(type)??[])])fn(event);}
  setAttribute(name,value){this.attributes.set(name,String(value));}
  getAttribute(name){return this.attributes.get(name)??null;}
  removeAttribute(name){this.attributes.delete(name);}
  focus(){this.document.activeElement=this;}
  pause(){this.paused=true;}
  load(){this.loadCalls++;}
  play(){this.playCalls++;this.paused=false;return this.playResult?.()??Promise.resolve();}
}
function fixture(){
  const document=new Element();document.hidden=false;
  const overlay=new Element(document),video=new Element(document),playButton=new Element(document),pauseButton=new Element(document),skipButton=new Element(document),soundButton=new Element(document);
  const timers=new Map();let timerId=0,opened=0;const completed=[];let sound=true;
  const film=createVictoryFilm({overlay,video,playButton,pauseButton,skipButton,soundButton,documentTarget:document,
    soundEnabled:()=>sound,onToggleSound:()=>{sound=!sound;film.syncSound();},onOpen:()=>opened++,onComplete:reason=>completed.push(reason),
    setTimer:fn=>{timers.set(++timerId,fn);return timerId;},clearTimer:id=>timers.delete(id)});
  return {film,document,overlay,video,playButton,pauseButton,skipButton,soundButton,timers,completed,get opened(){return opened;},setSound:value=>{sound=value;film.syncSound();},expire:()=>{for(const [id,fn] of [...timers]){timers.delete(id);fn();}}};
}
const settle=async()=>{await Promise.resolve();await Promise.resolve();};
const key=(code,more={})=>({code,repeat:false,preventDefault(){this.prevented=true;},...more});

test('title, gameplay, defeat and the victory pose never request film media',()=>{
  const f=fixture();
  assert.equal(f.video.getAttribute('src'),null);
  f.film.update(999999);f.film.arm('playing',0);f.film.update(999999);f.film.arm('dead',1500);f.film.update(1501);
  assert.equal(f.video.getAttribute('src'),null);assert.equal(f.opened,0);
  f.film.arm('won',4600);assert.equal(f.film.update(4599),true);
  assert.equal(f.overlay.hidden,true);assert.equal(f.video.getAttribute('src'),null);assert.equal(f.video.getAttribute('poster'),null);
});

test('the completed victory beat opens a single lazy film with the existing sound choice',async()=>{
  const f=fixture();f.film.arm('won',4600);assert.equal(f.film.update(4600),true);
  assert.equal(f.overlay.hidden,false);assert.equal(f.video.getAttribute('src'),'./video/saltik-free-together.mp4');
  assert.equal(f.video.getAttribute('poster'),'./video/saltik-free-together-poster.jpg');
  assert.equal(f.video.muted,false);assert.equal(f.opened,1);await settle();
  assert.equal(f.film.snapshot.state,'playing');f.film.update(999999);assert.equal(f.video.playCalls,1);
  f.setSound(false);assert.equal(f.video.muted,true);f.soundButton.emit('click');assert.equal(f.video.muted,false);
});

test('sound disabled before victory stays disabled for the film',async()=>{
  const f=fixture();f.setSound(false);f.film.arm('won',4500);f.film.update(4500);await settle();
  assert.equal(f.video.muted,true);assert.equal(f.film.snapshot.state,'playing');
});

for(const reason of ['ended','skip','error'])test(`${reason} returns to the result once and releases the video`,async()=>{
  const f=fixture();f.film.arm('won',4500);f.film.update(4500);await settle();
  if(reason==='skip')f.skipButton.emit('click');else f.video.emit(reason);
  assert.deepEqual(f.completed,[reason]);assert.equal(f.overlay.hidden,true);assert.equal(f.video.paused,true);
  assert.equal(f.video.getAttribute('src'),null);assert.equal(f.video.getAttribute('poster'),null);assert.equal(f.video.loadCalls,1);
  assert.equal(f.timers.size,0);assert.equal(f.film.update(99000),false);
  f.video.emit('ended');f.skipButton.emit('click');assert.deepEqual(f.completed,[reason]);assert.equal(f.video.playCalls,1);
});

test('rejected autoplay exposes Play Epilogue and a user gesture can start it',async()=>{
  const f=fixture();f.video.playResult=()=>Promise.reject(new Error('NotAllowedError'));
  f.film.arm('won',4500);f.film.update(4500);await settle();
  assert.equal(f.film.snapshot.state,'ready');assert.equal(f.playButton.hidden,false);assert.equal(f.skipButton.hidden,false);
  assert.equal(f.video.muted,false);assert.equal(f.document.activeElement,f.playButton);assert.equal(f.completed.length,0);assert.equal(f.timers.size,0);
  f.video.playResult=()=>Promise.resolve();f.playButton.emit('click');await settle();
  assert.equal(f.film.snapshot.state,'playing');assert.equal(f.playButton.hidden,true);assert.equal(f.video.playCalls,2);
});

test('loading or stalled media has a bounded escape to the normal result',async()=>{
  for(const stalled of [false,true]){
    const f=fixture();if(!stalled)f.video.playResult=()=>new Promise(()=>{});
    f.film.arm('won',4500);f.film.update(4500);await settle();if(stalled)f.video.emit('waiting');
    f.expire();assert.deepEqual(f.completed,['error']);assert.equal(f.film.update(99000),false);assert.equal(f.video.getAttribute('src'),null);
  }
});

test('hidden tabs pause pending playback and require Play on return',async()=>{
  const f=fixture();let resolvePlay;f.video.playResult=()=>new Promise(resolve=>{resolvePlay=resolve;});
  f.film.arm('won',4500);f.film.update(4500);f.document.hidden=true;f.document.emit('visibilitychange');resolvePlay();await settle();
  assert.equal(f.video.paused,true);assert.equal(f.film.snapshot.state,'paused');assert.equal(f.timers.size,0);
  f.document.hidden=false;f.document.emit('visibilitychange');assert.equal(f.playButton.hidden,false);assert.equal(f.video.playCalls,1);
  f.video.playResult=()=>Promise.resolve();f.playButton.emit('click');await settle();assert.equal(f.film.snapshot.state,'playing');
});

test('victory reached in a hidden tab waits for an explicit Play gesture',()=>{
  const f=fixture();f.document.hidden=true;f.film.arm('won',4500);f.film.update(4500);
  assert.equal(f.video.playCalls,0);assert.equal(f.film.snapshot.state,'paused');f.document.hidden=false;f.document.emit('visibilitychange');assert.equal(f.video.playCalls,0);
});

test('cancelled media promises and events cannot reopen a film or finish a newer run',async()=>{
  const f=fixture();let rejectOld;f.video.playResult=()=>new Promise((resolve,reject)=>{rejectOld=reject;});
  f.film.arm('won',4500);f.film.update(4500);f.film.cancel();rejectOld(new Error('aborted'));await settle();
  assert.equal(f.overlay.hidden,true);assert.equal(f.film.snapshot.state,'idle');assert.equal(f.timers.size,0);assert.deepEqual(f.completed,[]);
  f.video.emit('ended');f.document.hidden=true;f.document.emit('visibilitychange');assert.deepEqual(f.completed,[]);
  f.document.hidden=false;f.video.playResult=()=>Promise.resolve();f.film.arm('won',12000);f.film.update(12000);await settle();
  assert.equal(f.film.snapshot.state,'playing');assert.equal(f.video.paused,false);assert.equal(f.opened,2);
});

test('keyboard Play, pause, focus containment and Escape remain accessible',async()=>{
  const f=fixture();f.video.playResult=()=>Promise.reject(new Error('blocked'));f.film.arm('won',4500);f.film.update(4500);await settle();
  f.video.playResult=()=>Promise.resolve();const enter=key('Enter');assert.equal(f.film.handleKey(enter),true);assert.equal(enter.prevented,true);await settle();
  f.pauseButton.emit('click');assert.equal(f.video.paused,true);assert.equal(f.film.snapshot.state,'paused');
  f.document.activeElement=f.playButton;const tab=key('Tab');assert.equal(f.film.handleKey(tab),true);assert.equal(f.document.activeElement,f.soundButton);
  const escape=key('Escape');assert.equal(f.film.handleKey(escape),true);assert.deepEqual(f.completed,['skip']);assert.equal(f.film.handleKey(key('Enter')),false);
});

for(const state of ['ready','paused']){
  for(const shiftKey of [false,true])test(`${state} focus wraps ${shiftKey?'backward from Sound to Play':'forward from Play to Sound'} in the visible DOM order`,async()=>{
    const f=fixture();if(state==='ready')f.video.playResult=()=>Promise.reject(new Error('blocked'));
    f.film.arm('won',4500);f.film.update(4500);await settle();if(state==='paused')f.pauseButton.emit('click');
    assert.equal(f.film.snapshot.state,state);assert.equal(f.pauseButton.hidden,true);assert.equal(f.playButton.hidden,false);
    f.document.activeElement=shiftKey?f.soundButton:f.playButton;
    const tab=key('Tab',{shiftKey});assert.equal(f.film.handleKey(tab),true);assert.equal(tab.prevented,true);
    assert.equal(f.document.activeElement,shiftKey?f.playButton:f.soundButton);
    f.document.activeElement=f.skipButton;
    const interiorTab=key('Tab',{shiftKey});assert.equal(f.film.handleKey(interiorTab),false);assert.notEqual(interiorTab.prevented,true,'interior Tab uses the browser DOM sequence');
  });
}

test('keyboard Space activates focused sound and Skip without relying on gameplay keyup',async()=>{
  const f=fixture();f.film.arm('won',4500);f.film.update(4500);await settle();
  f.document.activeElement=f.soundButton;const sound=key('Space');assert.equal(f.film.handleKey(sound),true);assert.equal(sound.prevented,true);assert.equal(f.video.muted,true);
  f.document.activeElement=f.skipButton;const skip=key('Space');assert.equal(f.film.handleKey(skip),true);assert.equal(skip.prevented,true);assert.deepEqual(f.completed,['skip']);
});

test('a late playing event cannot hide Play after a deliberate pause',async()=>{
  const f=fixture();f.film.arm('won',4500);f.film.update(4500);await settle();f.pauseButton.emit('click');
  f.video.emit('playing');assert.equal(f.video.paused,true);assert.equal(f.film.snapshot.state,'paused');assert.equal(f.playButton.hidden,false);assert.equal(f.timers.size,0);
});

test('a queued listener from an abandoned movie cannot close the next victory',async()=>{
  const f=fixture();f.film.arm('won',4500);f.film.update(4500);await settle();
  const oldEnded=[...f.video.listeners.get('ended')][0];f.film.cancel();f.film.arm('won',12000);f.film.update(12000);await settle();
  oldEnded();assert.equal(f.film.snapshot.state,'playing');assert.deepEqual(f.completed,[]);assert.equal(f.overlay.hidden,false);
});
