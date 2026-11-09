// Kept as document-relative literals so the standalone build can embed each clip.
export const VOICE_PATHS=Object.freeze({
  ready:'./audio/voices/ready.ogg',
  'target-lock':'./audio/voices/target-lock.ogg',
  'saltik-detected':'./audio/voices/saltik-detected.ogg',
  'grab-him':'./audio/voices/grab-him.ogg',
  goodbye:'./audio/voices/goodbye.ogg',
  victory:'./audio/voices/victory.ogg'
});

export const VOICE_EVENTS=Object.freeze({
  start:'ready',homing:'target-lock','saltik-detected':'saltik-detected',
  'saltik-grab-ready':'grab-him','duel-throw':'goodbye',won:'victory'
});

export function createVoiceLines(context,destination,onStart){
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
        const id=queue[0];
        let buffer;
        try{buffer=await load(id);}catch{
          if(turn!==epoch)return;
          failed++;queue.shift();continue;
        }
        if(turn!==epoch)return;
        queue.shift();
        const source=context.createBufferSource();source.buffer=buffer;
        source.connect(destination);
        active={id,source};lastLine=id;played[id]=(played[id]||0)+1;
        source.onended=()=>{
          if(active?.source!==source)return;
          active=null;
          pump();
        };
        onStart(buffer.duration);
        source.start();
      }
    }finally{if(turn===epoch)pumping=false;}
  }

  function enqueue(id){
    if(!VOICE_PATHS[id])return;
    queue.push(id);pump();
  }
  function cancel(){
    epoch++;queue.length=0;loading.clear();pumping=false;
    const source=active?.source;active=null;
    if(source)try{source.stop(context.currentTime);}catch{}
  }
  function snapshot(){
    return Object.freeze({playing:active?.id??null,queued:queue.length,loading:loading.size,
      lastLine,played:Object.freeze({...played}),failed});
  }
  return {enqueue,cancel,snapshot};
}
