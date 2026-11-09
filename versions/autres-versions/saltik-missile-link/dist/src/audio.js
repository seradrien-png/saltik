import {createVoiceLines,VOICE_EVENTS} from './voice-lines.js';

export function createAudio(){
  let ctx=null,master=null,output=null,musicBus=null,enabled=true,noise=null,lastShot=-Infinity;
  let lastEnemyShot=-Infinity,lastExplosion=-Infinity,lastVolley=-Infinity;
  let effectsActive=true,speech=null;
  const voices=new Set();
  let duckUntil=0,duckLevel=1,duckRelease=.15;
  const music=document.getElementById('game-music');let playing=false;
  // The local melancholic score uses the native media loop and existing lifecycle.
  // Effects retain a separate bus under the same protected output.
  if(music){music.loop=true;music.volume=.20;}
  function hold(param,time){
    if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(time);
    else{const value=param.value;param.cancelScheduledValues(time);param.setValueAtTime(value,time);}
  }
  function clearDucking(){
    duckUntil=0;duckLevel=1;duckRelease=.15;
    if(musicBus){hold(musicBus.gain,ctx.currentTime);musicBus.gain.setTargetAtTime(1,ctx.currentTime,.045);}
  }
  function duck(level,duration,release=.18){
    if(!musicBus||!playing)return;
    const now=ctx.currentTime,active=now<duckUntil;
    duckLevel=active?Math.min(level,duckLevel):level;
    duckUntil=active?Math.max(duckUntil,now+duration):now+duration;
    duckRelease=active?Math.max(duckRelease,release):release;
    const gain=musicBus.gain;hold(gain,now);
    gain.linearRampToValueAtTime(duckLevel,now+.018);
    gain.setValueAtTime(duckLevel,Math.max(now+.019,duckUntil));
    gain.setTargetAtTime(1,Math.max(now+.020,duckUntil),duckRelease);
  }
  function syncMusic(){
    if(!music)return;music.muted=!enabled;
    if(!playing||!enabled){music.pause();return;}
    // Media starts inside the same play/resume gesture as the game. Rejected
    // autoplay or a missing local track never interrupts the simulation.
    if(music.paused)try{music.play()?.then(()=>{if(!playing||!enabled)music.pause();}).catch(()=>{});}catch{}
  }
  function setPlaying(value,{restart=false}={}){
    playing=!!value;
    effectsActive=playing;
    if(!playing||restart){stopVoices();speech?.cancel();clearDucking();}
    if(restart){lastShot=-Infinity;lastEnemyShot=-Infinity;lastExplosion=-Infinity;lastVolley=-Infinity;}
    if(restart&&music){music.pause();try{music.currentTime=0;}catch{}}
    syncMusic();
  }
  function unlock(){
    if(!enabled)return;syncMusic();
    try{
      if(!ctx){
        ctx=new (window.AudioContext||window.webkitAudioContext)();
        master=ctx.createGain();master.gain.value=.80;
        const limiter=ctx.createDynamicsCompressor();
        limiter.threshold.value=-7;limiter.knee.value=6;limiter.ratio.value=16;
        limiter.attack.value=.003;limiter.release.value=.18;
        output=ctx.createGain();output.gain.value=1;
        master.connect(limiter);limiter.connect(output);output.connect(ctx.destination);
        const speechBus=ctx.createGain();speechBus.gain.value=1.55;speechBus.connect(limiter);
        speech=createVoiceLines(ctx,speechBus,duration=>duck(.13,duration+.12,.30));
        if(music)try{
          const source=ctx.createMediaElementSource(music);musicBus=ctx.createGain();
          source.connect(musicBus);musicBus.connect(limiter);
        }catch{} // Older media implementations still retain the quiet DOM mix.
        noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
        const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
      }
      if(ctx.state==='suspended')ctx.resume()?.catch(()=>{});
    }catch{}
  }
  function stopVoices(){
    if(!ctx)return;
    for(const source of voices)try{source.stop(ctx.currentTime);}catch{}
    voices.clear();
  }
  function voice(source,at,duration,offset){
    voices.add(source);
    source.onended=()=>voices.delete(source);
    if(offset===undefined)source.start(at);
    else source.start(at,offset);
    source.stop(at+duration);
  }
  function envelope(gain,at,duration,volume,attack=.003){
    gain.setValueAtTime(.0001,at);
    gain.linearRampToValueAtTime(volume,at+Math.min(attack,duration*.25));
    gain.exponentialRampToValueAtTime(.001,at+duration);
  }
  function tone(freq,end,duration,volume,type='triangle',delay=0,terminal=false,attack=.003){
    if(!ctx||!enabled||(!effectsActive&&!terminal))return;
    const at=ctx.currentTime+delay,oscillator=ctx.createOscillator(),gain=ctx.createGain();
    oscillator.type=type;
    oscillator.frequency.setValueAtTime(freq,at);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20,end),at+duration);
    envelope(gain.gain,at,duration,volume,attack);
    oscillator.connect(gain);gain.connect(master);voice(oscillator,at,duration);
  }
  function burst(duration,volume,cutoff,delay=0,kind='lowpass',attack){
    if(!ctx||!enabled||!effectsActive)return;
    const at=ctx.currentTime+delay,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    source.buffer=noise;source.loop=true;filter.type=kind;filter.frequency.value=cutoff;
    if(filter.Q)filter.Q.value=kind==='bandpass'?.8:.7;
    envelope(gain.gain,at,duration,volume,attack??(kind==='lowpass'?.008:.0015));
    source.connect(filter);filter.connect(gain);gain.connect(master);
    voice(source,at,duration,Math.random()*.4);
  }
  function play(e){
    if(!ctx||!enabled||(!effectsActive&&e.type!=='won'))return;
    const line=VOICE_EVENTS[e.type];if(line)speech?.enqueue(line);
    if(e.type==='shot'){
      if(ctx.currentTime-lastShot<.055)return;lastShot=ctx.currentTime;
      duck(.90,.06,.12);
      // A low pulse with a soft puff stays behind the score during sustained fire.
      burst(.12,.0462875,900,0,'lowpass',.016);
      tone(115,62,.15,.06348,'sine',0,false,.016);
      tone(82,48,.13,.034385,'triangle',.012,false,.014);
    }
    else if(e.type==='missile'){
      duck(.70,.44,.22);
      burst(.10,.105,2100,0,'lowpass',.012);burst(.58,.18,1050);
      tone(122,39,.49,.17,'triangle');burst(.055,.055,1800,.014,'bandpass',.008);
    }
    else if(e.type==='homing'){
      duck(.70,.43,.22);
      burst(.09,.09,2300,0,'lowpass',.012);burst(.52,.16,1200);
      tone(108,38,.47,.15,'triangle');tone(230,580,.17,.055,'sine',.025);
      burst(.05,.045,2400,.07,'bandpass',.008);
    }
    else if(e.type==='support-launch'){
      duck(.78,.35,.22);burst(.4,.12,1150,0,'lowpass',.018);
      tone(180,520,.12,.045,'sine');tone(110,42,.37,.1,'triangle',.04,false,.018);
    }
    else if(e.type==='battery-warning'||e.type==='artillery-warning'){
      tone(420,550,.13,.055,'sine');tone(420,550,.13,.045,'sine',.20);
    }
    else if(e.type==='battery-volley'){
      burst(.42,.09,950,0,'lowpass',.025);tone(100,40,.35,.07,'triangle');
    }
    else if(e.type==='battery-destroyed'){
      duck(.7,.35,.2);burst(.55,.23,650);tone(75,25,.4,.12,'triangle');
    }
    else if(e.type==='melee'){tone(95,180,.08,.09,'triangle');}
    else if(e.type==='melee-hit'){duck(.45,.12);burst(.11,.27,900);tone(90,30,.12,.23,'triangle');}
    else if(e.type==='shift'){tone(460,120,.4,.18,'sine');burst(.2,.12,3200);}
    else if(e.type==='parry-start'){duck(.4,.14,.13);burst(.055,.16,2400);tone(210,520,.13,.14,'triangle');}
    else if(e.type==='reload-start'){
      duck(.46,1.08,.18);
      // Latch, draw, feed, and seat the magazine over the 1.32 s cycle.
      burst(.065,.28,2700,0,'bandpass');tone(170,75,.10,.13,'triangle');
      burst(.11,.27,1900,.20,'bandpass');tone(470,290,.11,.14,'triangle',.20);
      burst(.19,.18,1200,.47);tone(95,130,.20,.09,'triangle',.47);
      burst(.085,.31,2400,.70,'bandpass');tone(170,70,.15,.16,'triangle',.69);
      burst(.14,.22,1800,.96,'bandpass');tone(320,175,.13,.10,'triangle',.96);
    }
    else if(e.type==='reload-end'){
      duck(.38,.29,.13);
      // Rack and spring return begin when the engine completes its 1.32 s reload.
      burst(.15,.29,1500);tone(160,80,.17,.18,'triangle');
      burst(.085,.32,2700,.12,'bandpass');tone(280,110,.10,.13,'triangle',.12);
    }
    else if(e.type==='intercept'){duck(.4,.12);burst(.10,.27,2900);tone(300,90,.10,.09,'triangle');}
    else if(e.type==='deflect'){duck(.25,.16,.15);burst(.07,.30,4200);tone(650,220,.14,.20,'triangle');}
    else if(e.type==='enemyshot'){
      if(ctx.currentTime-lastEnemyShot<.05)return;lastEnemyShot=ctx.currentTime;
      duck(.86,.07,.12);
      burst(.095,.075,1400,0,'lowpass',.012);tone(185,92,.12,.055,'triangle',0,false,.012);
    }
    else if(e.type==='enemy-missile'){duck(.77,.20);burst(.27,.15,1200);tone(120,60,.22,.095,'triangle');}
    else if(e.type==='enemy-lock'){tone(420,620,.16,.07,'sine');}
    else if(e.type==='boss-pod-warning'){
      duck(.70,.42,.21);
      burst(.38,.15,1500,0,'lowpass');tone(130,340,.42,.12,'triangle');
      tone(540,760,.12,.065,'sine',.25);
    }
    else if(e.type==='boss-pod-volley'){
      if(ctx.currentTime-lastVolley<.05)return;lastVolley=ctx.currentTime;
      duck(.72,.40,.22);
      // One bounded whoosh represents the whole physical rocket fan.
      burst(.44,.16,1300,0,'lowpass',.018);
      tone(155,72,.38,.12,'triangle',0,false,.018);
    }
    else if(e.type==='no-target'){tone(160,100,.12,.1,'sine');}
    else if(e.type==='explosion'){
      if(!e.big&&ctx.currentTime-lastExplosion<.065)return;
      lastExplosion=ctx.currentTime;
      duck(e.big?.38:.62,e.big?.6:.32,.25);
      burst(e.big?.85:.42,e.big?.62:.34,550);
      tone(65,22,.4,e.big?.32:.22,'triangle');
    }
    else if(e.type==='damage')burst(.2,.4,1600);
    else if(e.type==='jump')tone(90,240,.2,.16,'triangle');
    else if(e.type==='enemy-guard'){duck(.6,.11);burst(.065,.15,3200,0,'bandpass');tone(180,350,.11,.11,'triangle');}
    else if(e.type==='enemy-deflect'){duck(.4,.15);burst(.07,.27,4400,0,'bandpass');burst(.10,.17,1000);tone(620,190,.12,.13,'triangle');}
    else if(e.type==='breach-start'){
      duck(.45,.36,.17);
      burst(.36,.24,1900,0,'highpass');tone(115,390,.38,.20,'sawtooth');
      burst(.08,.15,3300,.17,'bandpass');
    }
    else if(e.type==='breach-tap'){
      duck(.55,.17,.12);
      burst(.17,.19,2200,0,'bandpass');tone(350,105,.25,.17,'sawtooth');
      burst(.045,.22,4300,.18,'bandpass');
    }
    else if(e.type==='breach-tear'){
      duck(.3,.42,.22);
      burst(.40,.39,2300,0,'bandpass');burst(.13,.34,4700,.24,'highpass');
      tone(155,48,.40,.26,'sawtooth');
    }
    else if(e.type==='breach-hole'){
      duck(.28,.28,.18);
      burst(.22,.40,900);burst(.09,.30,5300,0,'highpass');
      tone(105,29,.24,.30,'triangle');
    }
    else if(e.type==='breach-shot'){
      duck(.74,.16,.14);
      burst(.065,.105,1550,0,'lowpass',.012);tone(165,45,.14,.12,'triangle');
      burst(.085,.08,1300,.018,'bandpass',.009);tone(740,170,.11,.075,'triangle',.055);
    }
    else if(e.type==='pod-destroyed'){
      duck(.16,.67,.29);
      burst(.29,.41,3900,0,'highpass');burst(.57,.59,770);
      tone(190,38,.50,.32,'sawtooth');tone(760,155,.22,.15,'triangle',.08);
    }
    else if(e.type==='breach-fire'){
      duck(.15,.64,.30);
      burst(.10,.51,5600,0,'highpass');burst(.60,.58,900);
      tone(100,24,.57,.42,'sawtooth');burst(.09,.23,3000,.11,'bandpass');
    }
    else if(e.type==='breach-return'){
      duck(.38,.42,.20);
      tone(85,410,.34,.20,'sawtooth');burst(.44,.23,2700,0,'highpass');
      burst(.06,.24,3500,.13,'bandpass');
    }
    else if(e.type==='breach-end'){
      duck(.45,.22,.15);
      burst(.21,.32,850);tone(125,34,.20,.23,'triangle');
      burst(.045,.16,2600,.03,'bandpass');
    }
    else if(e.type==='duel-start'){duck(.45,.28);burst(.075,.22,2300);tone(180,68,.19,.17,'sawtooth');burst(.04,.18,4100,.09,'bandpass');}
    else if(e.type==='duel-tap'){duck(.65,.06);burst(.038,.14,3400,0,'bandpass');tone(135,80,.075,.08,'triangle');}
    else if(e.type==='duel-throw'){duck(.3,.35);burst(.34,.25,1700);tone(130,38,.27,.22,'sawtooth');}
    else if(e.type==='duel-impact'){duck(.2,.3);burst(.14,.35,5200,0,'highpass');burst(.24,.31,850);burst(.055,.19,6800,.08,'bandpass');}
    else if(e.type==='duel-end'){tone(185,65,.16,.13,'triangle');}
    else if(e.type==='repair'){tone(550,1000,.25,.18,'sine');tone(850,1500,.2,.12,'sine',.09);}
    else if(e.type==='boss'){tone(140,90,.6,.25,'sawtooth');}
    else if(e.type==='start'){tone(220,660,.4,.18,'triangle');}
    else if(e.type==='won'){tone(330,660,.5,.22,'triangle',0,true);tone(440,880,.6,.18,'triangle',.18,true);}
  }
  return {unlock,play,setPlaying,setEnabled(value){enabled=!!value;if(output){hold(output.gain,ctx.currentTime);output.gain.setTargetAtTime(enabled?1:0,ctx.currentTime,.012);}if(!enabled){stopVoices();speech?.cancel();clearDucking();}syncMusic();},get enabled(){return enabled;},
    get speechSnapshot(){return speech?.snapshot()??Object.freeze({playing:null,queued:0,loading:0,lastLine:null,played:Object.freeze({}),failed:0});}};
}
