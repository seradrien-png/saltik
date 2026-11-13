// Kept as document-relative literals so the standalone build can embed each clip.
export const VOICE_PATHS=Object.freeze({
  ready:'./audio/voices/ready.ogg',
  'target-lock':'./audio/voices/target-lock.ogg',
  'saltik-detected':'./audio/voices/saltik-detected.ogg',
  'grab-him':'./audio/voices/grab-him.ogg',
  goodbye:'./audio/voices/goodbye.ogg',
  'saltik-dont-kill-saltik':'./audio/voices/saltik-dont-kill-saltik.ogg',
  victory:'./audio/voices/victory.ogg',
  'gatling-ready':'./audio/voices/gatling-ready.ogg',
  'gatling-target-lock':'./audio/voices/gatling-target-lock.ogg',
  'gatling-enemy-brother':'./audio/voices/gatling-enemy-brother.ogg',
  'gatling-grab-him':'./audio/voices/gatling-grab-him.ogg',
  'gatling-see-you-later':'./audio/voices/gatling-see-you-later.ogg',
  'gatling-carrier':'./audio/voices/gatling-carrier.ogg',
  'gatling-victory':'./audio/voices/gatling-victory.ogg'
});

export const VOICE_EVENTS=Object.freeze({
  start:'ready',homing:'target-lock','saltik-detected':'saltik-detected',
  'saltik-grab-ready':'grab-him','duel-throw':'goodbye',
  'carrier-disconnected':'saltik-dont-kill-saltik',won:'victory'
});

// Striker/BT retain their recordings. Gatling uses newly synthesized rms recordings.
export const GATLING_VOICE_IDS=Object.freeze({ready:'gatling-ready','target-lock':'gatling-target-lock','saltik-detected':'gatling-enemy-brother','grab-him':'gatling-grab-him',goodbye:'gatling-see-you-later','saltik-dont-kill-saltik':'gatling-carrier',victory:'gatling-victory'});
export const VOICE_PROFILES=Object.freeze({
 striker:Object.freeze({rate:1,filter:null}),
 bt:Object.freeze({rate:.84,filter:'lowpass',frequency:2600}),
 gatling:Object.freeze({rate:1,filter:null})
});

export function createVoiceLines(context,destination,onStart,onCancel=()=>{}){
  const buffers=new Map(),loading=new Map(),queue=[];
  const played=Object.create(null);
  let active=null,pumping=false,epoch=0,lastLine=null,failed=0;

  function load(id){
    if(buffers.has(id))return Promise.resolve(buffers.get(id));
    if(loading.has(id))return loading.get(id);
    const task=(async()=>{
      if(typeof window.fetch!=='function')throw new Error('Voice fetch unavailable');
      const response=await window.fetch(VOICE_PATHS[id]);
      if(!response.ok)throw new Error(`Voice clip unavailable: ${id}`);
      const buffer=await context.decodeAudioData(await response.arrayBuffer());
      buffers.set(id,buffer);
      return buffer;
    })().finally(()=>{if(loading.get(id)===task)loading.delete(id);});
    loading.set(id,task);
    return task;
  }

  async function pump(){
    if(pumping||active||!queue.length)return;
    pumping=true;
    const turn=epoch;
    try{
      while(queue.length&&turn===epoch&&!active){
        const {id,character}=queue[0],profile=VOICE_PROFILES[character]??VOICE_PROFILES.striker;
        let buffer;
        try{buffer=await load(id);}catch{
          if(turn!==epoch)return;
          failed++;queue.shift();continue;
        }
        if(turn!==epoch)return;
        queue.shift();
        const source=context.createBufferSource();source.buffer=buffer;
        if(source.playbackRate)source.playbackRate.value=profile.rate;
        if(profile.filter){const filter=context.createBiquadFilter();filter.type=profile.filter;filter.frequency.value=profile.frequency;source.connect(filter);filter.connect(destination);}
        else source.connect(destination);
        active={id,source,character};lastLine=id;played[id]=(played[id]||0)+1;
        source.onended=()=>{
          if(active?.source!==source)return;
          active=null;
          pump();
        };
        onStart(buffer.duration/profile.rate,id);
        source.start();
      }
    }finally{if(turn===epoch)pumping=false;}
  }

  function enqueue(id,character='striker'){
    if(character==='gatling')id=GATLING_VOICE_IDS[id]??id;
    if(!VOICE_PATHS[id])return;
    queue.push({id,character});pump();
  }
  function cancel(){
    onCancel();epoch++;queue.length=0;loading.clear();pumping=false;
    const source=active?.source;active=null;
    if(source)try{source.stop(context.currentTime);}catch{}
  }
  function snapshot(){
    return Object.freeze({playing:active?.id??null,character:active?.character??null,queued:queue.length,loading:loading.size,
      lastLine,played:Object.freeze({...played}),failed});
  }
  return {enqueue,cancel,snapshot};
}
