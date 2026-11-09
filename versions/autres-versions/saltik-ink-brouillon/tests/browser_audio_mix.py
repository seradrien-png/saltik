"""Measure the rendered melancholic score/SFX mix through real WebAudio and controls."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
import os

URL = os.environ.get('FERAL_PREVIEW_URL', 'http://127.0.0.1:4173')
OUT = Path('/workspace/deliverables/pad-shot-victory-qa')
OUT.mkdir(parents=True, exist_ok=True)

INSTRUMENT = """(() => {
  const Native = window.AudioContext || window.webkitAudioContext;
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function(destination, ...args) {
    (this.__mixOutputs ||= []).push(destination);
    (destination.__mixInputs ||= []).push(this);
    return connect.call(this, destination, ...args);
  };
  window.__mixContexts = [];
  const watch = node => {
    const start = node.start.bind(node);
    node.start = (...args) => {
      node.context.__mixLastStart=node.context.currentTime;
      for (const notify of [...(node.context.__mixListeners || [])]) notify(node.context.currentTime);
      return start(...args);
    };
    return node;
  };
  window.AudioContext = class extends Native {
    constructor(...args) { super(...args); window.__mixContexts.push(this); }
    createOscillator() { return watch(super.createOscillator()); }
    createBufferSource() { return watch(super.createBufferSource()); }
    createMediaElementSource(media) {
      const source = super.createMediaElementSource(media);
      this.__musicSource = source;
      return source;
    }
  };
})();"""

PREPARE = """async () => {
  window.readGame = (await import('./src/main.js')).getSnapshot;
  const ctx = window.__mixContexts[0], source = ctx.__musicSource;
  if (!source) throw new Error('Music bypasses the measured WebAudio mix');
  const music = source.__mixOutputs[0], limiter = music.__mixOutputs[0];
  const effects = limiter.__mixInputs.find(node => node !== music);
  const speech = limiter.__mixInputs.find(node => node !== music && node !== effects);
  if (!speech || !effects) throw new Error('Effects or speech bypasses the shared limiter');
  const output = limiter.__mixOutputs[0];
  // The render thread can stall longer than a mechanical clack. Meter actual
  // audio render quanta in a worklet so a busy Canvas never loses its energy.
  const code = `class Meter extends AudioWorkletProcessor {
    constructor(){super();this.sum=0;this.high=0;this.n=0;this.peak=0;this.low=[];
      this.alpha=1-Math.exp(-2*Math.PI*900/sampleRate);}
    process(inputs){
      const channels=inputs[0];
      for(const [channel,data] of channels.entries()){
        let low=this.low[channel]||0;
        for(const value of data){
          low+=this.alpha*(value-low);
          this.sum+=value*value;this.high+=(value-low)**2;this.n++;
          this.peak=Math.max(this.peak,Math.abs(value));
        }
        this.low[channel]=low;
      }
      if(!channels.length)this.n+=128;
      if(this.n>=1024){this.port.postMessage({time:currentTime,rms:Math.sqrt(this.sum/this.n),
        highRms:Math.sqrt(this.high/this.n),peak:this.peak});
        this.sum=0;this.high=0;this.n=0;this.peak=0;}
      return true;
    }
  } registerProcessor('feral-mix-meter',Meter);`;
  const blob = URL.createObjectURL(new Blob([code],{type:'application/javascript'}));
  await ctx.audioWorklet.addModule(blob); URL.revokeObjectURL(blob);
  const meters = {};
  for (const [name, node] of Object.entries({rawMusic: source, music, effects, speech, output})) {
    const meter = new AudioWorkletNode(ctx,'feral-mix-meter');
    meters[name]=[]; meter.port.onmessage=event=>meters[name].push(event.data);
    node.connect(meter); meter.connect(ctx.destination);
  }
  window.measureMix = async (duration, start=ctx.currentTime) => {
    const end=start+duration/1000;
    await new Promise(resolve=>setTimeout(resolve,Math.max(0,end-ctx.currentTime)*1000+60));
    const result = {};
    for (const [name, frames] of Object.entries(meters)) {
      const selected=frames.filter(frame=>frame.time>=start&&frame.time<=end);
      if(!selected.length)throw new Error('No audio render quanta for '+name);
      const value={rms:0,peak:0,mean:0,highMean:0};
      for(const frame of selected){value.rms=Math.max(value.rms,frame.rms);value.peak=Math.max(value.peak,frame.peak);
        value.mean+=frame.rms;value.highMean+=frame.highRms;}
      value.mean/=selected.length;value.highMean/=selected.length;result[name]=value;
    }
    result.musicGain=music.gain.value;
    return result;
  };
  window.nextEffect = duration => new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('No new effect was emitted')),6000);
    const notify=start=>{
      clearTimeout(timeout);ctx.__mixListeners=ctx.__mixListeners.filter(item=>item!==notify);
      resolve(window.measureMix(duration,start));
    };
    (ctx.__mixListeners ||= []).push(notify);
  });
  window.lastEffect=duration=>window.measureMix(duration,ctx.__mixLastStart??ctx.currentTime);
  return {sampleRate:ctx.sampleRate,state:ctx.state,mediaVolume:document.querySelector('#game-music').volume,
    limiter:{threshold:limiter.threshold.value,ratio:limiter.ratio.value}};
}"""

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
                                args=['--no-sandbox', '--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width':1440, 'height':900})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.add_init_script(INSTRUMENT)
    page.goto(URL, wait_until='networkidle')
    page.wait_for_function('!document.querySelector("#start").disabled')
    page.click('#start')
    setup = page.evaluate(PREPARE)
    page.wait_for_function('readGame().speech.playing==="ready"', timeout=10000)
    voice = page.evaluate('()=>measureMix(400)')
    print('voice', json.dumps(voice), flush=True)
    assert voice['speech']['mean'] > .001, voice
    assert voice['speech']['peak'] > voice['rawMusic']['peak'] * .25, voice
    page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
    page.wait_for_function('()=>{const m=document.querySelector("#game-music");return !m.paused&&m.currentTime>1}')
    # The simple preview server need not support HTTP byte ranges. Cache the
    # unchanged supplied Ogg in a blob so the real media element can seek to a
    # louder passage without depending on range support.
    page.evaluate('''async()=>{
      const music=document.querySelector('#game-music');
      const bytes=await(await fetch(music.currentSrc)).blob();
      const metadata=new Promise(resolve=>music.addEventListener('loadedmetadata',resolve,{once:true}));
      music.src=URL.createObjectURL(bytes);const playing=music.play();await metadata;
      music.currentTime=35;await playing;
    }''')
    page.wait_for_function('document.querySelector("#game-music").currentTime>35.05')
    baseline = page.evaluate('()=>measureMix(350)')
    print('baseline', json.dumps(baseline), flush=True)
    assert .195 <= setup['mediaVolume'] <= .205, setup
    assert setup['limiter']['threshold'] <= -6 and setup['limiter']['ratio'] >= 12, setup
    assert baseline['music']['rms'] > .00001, baseline
    assert baseline['effects']['rms'] < .00001, baseline
    assert baseline['speech']['rms'] < .00001, baseline

    page.keyboard.down('j')
    gun = page.evaluate('()=>measureMix(180)')
    print('gun', json.dumps(gun), flush=True)
    # Compare real render quanta from the same passage: gunfire is present,
    # but the score leads and only dips gently while firing.
    assert gun['music']['mean'] >= gun['rawMusic']['mean'] * .8, gun
    assert gun['musicGain'] >= .88, gun
    assert gun['effects']['mean'] > .0001, gun
    assert gun['music']['mean'] > gun['effects']['mean'], gun
    assert gun['effects']['highMean'] < gun['effects']['mean'] * .5, gun
    # Observe short mechanical transients in-page: a Python round trip after
    # polling can otherwise miss most of a 65 ms clack on a busy renderer.
    reload_start = page.evaluate('''async()=>{
      const deadline=performance.now()+9000;
      while(window.readGame().player.reloadIn<=0){if(performance.now()>deadline)throw new Error('Reload did not start');await new Promise(r=>setTimeout(r,4));}
      return lastEffect(150);
    }''')
    print('reload-start', json.dumps(reload_start), flush=True)
    page.keyboard.up('j')
    assert reload_start['effects']['rms'] > .003, reload_start
    reload_end = page.evaluate('''async()=>{
      const deadline=performance.now()+2000;
      while(window.readGame().player.reloadIn>0){if(performance.now()>deadline)throw new Error('Reload did not finish');await new Promise(r=>setTimeout(r,4));}
      return lastEffect(150);
    }''')
    print('reload-end', json.dumps(reload_end), flush=True)
    assert reload_end['effects']['rms'] > .003, reload_end

    page.keyboard.press('k')
    page.wait_for_function('()=>window.readGame().stats.mirvs>0')
    missile = page.evaluate('()=>lastEffect(360)')
    print('missile', json.dumps(missile), flush=True)
    assert missile['effects']['rms'] > .004, missile
    assert missile['music']['mean'] >= missile['rawMusic']['mean'] * .55, missile
    # The carrier creates real delayed grenade explosions; recovery is measured
    # after its last projectile, rather than mistaking those new ducks for one
    # permanently quiet music bus.
    salvo_tail = page.evaluate('()=>measureMix(2600)')
    print('grenade explosions', json.dumps(salvo_tail), flush=True)
    assert salvo_tail['effects']['rms'] > .004, salvo_tail
    page.wait_for_function('()=>window.readGame().projectiles.length===0', timeout=12000)
    recovered = page.evaluate('()=>measureMix(1700)')
    assert recovered['musicGain'] > .95, recovered
    page.evaluate('()=>{window.nextMix=nextEffect(250);return true;}')
    page.keyboard.press('h')
    parry = page.evaluate('()=>window.nextMix')
    print('parry', json.dumps(parry), flush=True)
    assert parry['effects']['peak'] > .005, parry
    assert all(value['output']['peak'] < .99 for value in [voice,baseline,gun,reload_start,reload_end,missile,salvo_tail,recovered,parry])

    page.keyboard.press('Escape')
    page.wait_for_timeout(220)
    paused = page.evaluate('()=>measureMix(120)')
    assert paused['output']['peak'] < .00001, paused
    assert page.evaluate('document.querySelector("#game-music").paused')
    page.click('#resume')
    page.wait_for_function('!document.querySelector("#game-music").paused')
    resumed = page.evaluate('()=>measureMix(250)')
    assert resumed['music']['rms'] > .00001, resumed

    page.click('#sound')
    page.wait_for_timeout(220)
    muted = page.evaluate('()=>measureMix(120)')
    assert muted['output']['peak'] < .00001, muted
    assert page.evaluate('document.querySelector("#game-music").muted&&document.querySelector("#game-music").paused')
    page.keyboard.press('Escape')
    page.click('#sound')
    assert page.evaluate('document.querySelector("#game-music").paused'), 'Unmuting while paused started music'
    page.click('#resume')
    page.wait_for_function('!document.querySelector("#game-music").paused')
    page.keyboard.press('Escape')
    page.click('#restart-pause')
    assert page.evaluate('document.querySelector("#game-music").currentTime') < .6
    page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
    page.wait_for_function('!document.querySelector("#game-music").paused')
    page.wait_for_function('readGame().speech.playing===null')
    restart_quiet = page.evaluate('()=>measureMix(220)')
    assert restart_quiet['effects']['rms'] < .00001, restart_quiet
    assert restart_quiet['music']['rms'] > .00001, restart_quiet
    assert not errors, errors
    results = dict(setup=setup,voice=voice,baseline=baseline,gun=gun,reloadStart=reload_start,reloadEnd=reload_end,
                   missile=missile,grenadeExplosions=salvo_tail,recovered=recovered,parry=parry,
                   paused=paused,muted=muted,resumed=resumed,restartQuiet=restart_quiet,
                   metrics={'gunMusicRetention':gun['music']['mean']/gun['rawMusic']['mean'],
                            'musicToGunMean':gun['music']['mean']/gun['effects']['mean'],
                            'gunHighBandFraction':gun['effects']['highMean']/gun['effects']['mean']},
                   pageErrors=errors)
    (OUT/'mix-results.json').write_text(json.dumps(results,indent=2))
    print(json.dumps(results,indent=2))
    browser.close()
