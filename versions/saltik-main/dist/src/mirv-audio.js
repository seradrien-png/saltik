// The seven supplied MIRV recordings are the entire instrument. Lifecycle is
// driven by live projectile state and the AudioContext clock, never wall timers.
const SAMPLES=Object.freeze({
 launch:'01_mortier_depart',flight:'02_mirv_vol_boucle',separation:'03_mirv_separation',fall:'04_mirv_chute_boucle',
 impact1:'05_mirv_impact_1',impact2:'05_mirv_impact_2',impact3:'05_mirv_impact_3',
});
const FADE=.08,MAX_SHOTS=12,MAX_FLIGHTS=2,MAX_SEEN=512;

function quietLoopRegion(buffer){
 if(!buffer.getChannelData||!buffer.sampleRate||!buffer.length)return null;
 // Trim only the edges, choosing the quietest simultaneous stereo samples.
 // OGG endpoints are not necessarily continuous after decoding. Native loop
 // regions avoid their click without stretching or rewriting the recordings.
 const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
 if(!channels.length)return null;
 const width=Math.min(Math.floor(buffer.sampleRate*.04),Math.floor(buffer.length/4));
 if(width<2)return null;
 const quietest=(from,to)=>{
  let best=from,level=Infinity;
  for(let i=from;i<to;i++){
   const peak=Math.max(...channels.map(channel=>Math.abs(channel[i])));
   if(peak<level){level=peak;best=i;}
  }
  return best;
 };
 return {start:quietest(1,width)/buffer.sampleRate,
  end:(quietest(buffer.length-width,buffer.length-1)+1)/buffer.sampleRate};
}

export function createMirvAudio(context,destination,{fetch:fetchSample=globalThis.window?.fetch?.bind(globalThis.window)??globalThis.fetch?.bind(globalThis),random=Math.random,paths={}}={}){
 const bus=context.createGain();bus.gain.value=.62;
 const compressor=context.createDynamicsCompressor?.();
 if(compressor){
  for(const [key,value] of Object.entries({threshold:-12,knee:8,ratio:8,attack:.004,release:.16}))if(compressor[key])compressor[key].value=value;
  bus.connect(compressor);compressor.connect(destination);
 }else bus.connect(destination);
 const buffers=new Map(),failed=new Set(),shots=new Set(),flights=new Map(),wantedFlights=new Map(),seen=new Set(),retiredIds=new Map(),loopRegions=new Map();
 let loading=null,active=true,disposed=false,epoch=0,fall=null,fallWanted=false,fallRate=.85,fallGain=0;
 const now=()=>context.currentTime;
 function set(param,value,time=now()){
  if(!param)return;
  if(param.setValueAtTime)param.setValueAtTime(value,time);else param.value=value;
 }
 function hold(param,time){
  if(!param)return;
  if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(time);
  else{param.cancelScheduledValues?.(time);set(param,param.value,time);}
 }
 function ramp(param,value,time){
  if(!param)return;
  if(param.linearRampToValueAtTime)param.linearRampToValueAtTime(value,time);else set(param,value,time);
 }
 function smooth(param,value){
  if(!param)return;
  const at=now();hold(param,at);
  if(param.setTargetAtTime)param.setTargetAtTime(value,at,.07);else ramp(param,value,at+.07);
 }
 function retire(voice){
  if(!voice||voice.retired)return;voice.retired=true;
  const at=now();hold(voice.gain.gain,at);ramp(voice.gain.gain,0,at+FADE);
  try{voice.source.stop(at+FADE);}catch{}
 }
 function start(sample,{loop=false,gain=.35,rate=1}={}){
  if(!active||disposed||!buffers.has(sample))return null;
  let source,gainNode;
  try{
   source=context.createBufferSource();gainNode=context.createGain();
   source.buffer=buffers.get(sample);source.loop=loop;set(source.playbackRate,rate);
   const region=loop&&loopRegions.get(sample);
   if(region){source.loopStart=region.start;source.loopEnd=region.end;}
   set(gainNode.gain,0);ramp(gainNode.gain,gain,now()+.015);
   source.connect(gainNode);gainNode.connect(bus);
   const voice={source,gain:gainNode,sample,retired:false};
   source.onended=()=>{
    shots.delete(voice);
    for(const [id,current] of flights)if(current===voice)flights.delete(id);
    if(fall===voice)fall=null;
    source.disconnect?.();gainNode.disconnect?.();
   };
   source.start(now());return voice;
  }catch{source?.disconnect?.();gainNode?.disconnect?.();return null;}
 }
 function oneShot(sample,gain){
  if(shots.size>=MAX_SHOTS){const oldest=shots.values().next().value;shots.delete(oldest);retire(oldest);}
  const voice=start(sample,{gain});if(voice)shots.add(voice);
 }
 function requestShot(sample,gain){
  // A transient belongs to its physical event, not to when decoding finishes.
  // Unlock preloads before combat; missing samples simply skip that report.
  if(buffers.has(sample))oneShot(sample,gain);
 }
 function reconcile(){
  if(!active||disposed)return;
  const desired=new Set([...wantedFlights.keys()].slice(-MAX_FLIGHTS));
  for(const [id,voice] of flights)if(!desired.has(id)){flights.delete(id);retire(voice);}
  for(const id of desired)if(!flights.has(id)){
   const voice=start('flight',{loop:true,gain:.18});if(voice)flights.set(id,voice);
  }
  if(!fallWanted){if(fall){retire(fall);fall=null;}return;}
  if(!fall)fall=start('fall',{loop:true,gain:fallGain,rate:fallRate});
  else{smooth(fall.source.playbackRate,fallRate);smooth(fall.gain.gain,fallGain);}
 }
 function preload(){
  if(disposed)return Promise.resolve();
  if(loading)return loading;
  loading=Promise.all(Object.entries(SAMPLES).map(async([key,file])=>{
   try{
    if(typeof fetchSample!=='function'||typeof context.decodeAudioData!=='function')throw new Error('Audio loading unavailable');
    const fallback=`./audio/mirv/${file}.ogg`,preferred=paths[key]??fallback;
    const load=async url=>{const response=await fetchSample(url);if(!response||response.ok===false)throw new Error('Sample unavailable');return context.decodeAudioData(await response.arrayBuffer());};
    let buffer;try{buffer=await load(preferred);}catch(error){if(preferred===fallback)throw error;buffer=await load(fallback);}
    if(!buffer)throw new Error('Sample undecodable');
    if(!disposed){
     buffers.set(key,buffer);
     if(key==='flight'||key==='fall'){
      const region=quietLoopRegion(buffer);if(region)loopRegions.set(key,region);
     }
    }
   }catch{if(!disposed)failed.add(key);}
   if(!disposed)reconcile();
  })).then(()=>{});
  return loading;
 }
 function play(event){
  if(!active||disposed||!event)return;
  const {type}=event;
  if(!['mirv-launch','mirv-separation','mirv-impact'].includes(type))return;
  const projectileId=event.projectileId??event.salvoId;
  if(projectileId==null)return;
  const key=`${type}:${projectileId}`;
  if(seen.has(key)||(Number.isSafeInteger(projectileId)&&projectileId<=(retiredIds.get(type)??-Infinity)))return;
  seen.add(key);
  if(seen.size>MAX_SEEN){
   const oldest=seen.values().next().value;seen.delete(oldest);
   const separator=oldest.indexOf(':'),oldType=oldest.slice(0,separator),oldId=Number(oldest.slice(separator+1));
   // Projectile IDs are monotonic numeric IDs in the engine. Keep a tiny
   // watermark per event type so evicted historical IDs cannot replay later.
   if(Number.isSafeInteger(oldId))retiredIds.set(oldType,Math.max(retiredIds.get(oldType)??-Infinity,oldId));
  }
  const salvoId=event.salvoId??projectileId;
  if(type==='mirv-launch'){
   requestShot('launch',.42);wantedFlights.set(salvoId,true);reconcile();
  }else if(type==='mirv-separation'){
   wantedFlights.delete(salvoId);requestShot('separation',.3);reconcile();
  }else{
   // Detonations keep their native attack and duration. Only the falling loop
   // changes pitch; independent selection avoids a repeated explosion pattern.
   const variant=1+Math.min(2,Math.max(0,Math.floor(random()*3)));
   requestShot(`impact${variant}`,.34*(.94+Math.min(1,Math.max(0,random()))*.12));
  }
 }
 function sync(projectiles=[]){
  if(!active||disposed)return;
  const liveParents=new Set();let velocity=0,descending=0;
  for(const shot of projectiles){
   if(shot.mirvSalvoId==null||(shot.life!=null&&shot.life<=0))continue;
   if(shot.kind==='mirv')liveParents.add(shot.mirvSalvoId);
   else if(shot.kind==='grenade'&&Number.isFinite(shot.vy)&&shot.vy>0){velocity=Math.max(velocity,shot.vy);descending++;}
  }
  for(const id of wantedFlights.keys())if(!liveParents.has(id))wantedFlights.delete(id);
  for(const id of liveParents)if(!wantedFlights.has(id))wantedFlights.set(id,true);
  fallWanted=descending>0;
  const speed=Math.min(1,Math.max(0,velocity/1200));
  fallRate=.85+.5*speed;fallGain=fallWanted?.11+.10*speed:0;
  reconcile();
 }
 function stopAll(){
  epoch++;seen.clear();retiredIds.clear();wantedFlights.clear();fallWanted=false;fallRate=.85;fallGain=0;
  for(const voice of shots)retire(voice);shots.clear();
  for(const voice of flights.values())retire(voice);flights.clear();
  retire(fall);fall=null;
 }
 function setActive(value){
  if(disposed||active===!!value)return;active=!!value;
  if(!active)stopAll();
 }
 function dispose(){
  if(disposed)return;active=false;stopAll();disposed=true;buffers.clear();failed.clear();loopRegions.clear();
  // Keep the common bus connected during the final 80ms source fades. Sources
  // disconnect themselves onended, so teardown does not cut off their envelopes.
 }
 return {
  preload,play,sync,setActive,stopAll,dispose,
  get snapshot(){return Object.freeze({active,disposed,epoch,loaded:buffers.size,failed:failed.size,pending:0,seenEvents:seen.size,
   oneShots:shots.size,flightLoops:flights.size,fallLoop:!!fall,fallRate,fallGain});},
 };
}
