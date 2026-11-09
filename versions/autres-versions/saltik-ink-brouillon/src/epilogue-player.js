// Media is isolated from the game loop and loaded only when the film is opened.
export function createEpiloguePlayer(root,{soundEnabled=()=>true,onToggleSound=()=>{}}={}){
 const find=name=>root.querySelector(`[data-epilogue-${name}]`);
 const video=find('video'),play=find('play'),toggle=find('toggle'),skip=find('skip'),sound=find('sound');
 let active=false,generation=0,onDone=null,previousFocus=null;
 function syncSound(){video.muted=!soundEnabled();sound.textContent=video.muted?'ACTIVER LE SON':'COUPER LE SON';sound.setAttribute('aria-pressed',String(!video.muted));}
 function syncPlayback(){
  const paused=video.paused||video.ended;
  play.hidden=!active||!paused;
  toggle.textContent=paused?'LECTURE':'PAUSE';
  toggle.setAttribute('aria-label',paused?'Lire le film':'Mettre le film en pause');
 }
 function stop(notify,reason){
  if(!active)return;
  active=false;generation++;const done=onDone;onDone=null;
  video.pause();root.hidden=true;
  if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  previousFocus=null;
  if(notify)done?.(reason);
 }
 async function requestPlay(){
  if(!active)return;
  const requested=generation;
  try{
   await video.play();
   if(!active||document.hidden){video.pause();return;}
   if(requested===generation)syncPlayback();
  }catch{
   if(active&&requested===generation){play.hidden=false;toggle.textContent='LECTURE';play.focus({preventScroll:true});}
  }
 }
 function open(done){
  if(active)stop(false,'replaced');
  previousFocus=document.activeElement;active=true;generation++;onDone=done;
  root.hidden=false;
  if(!video.getAttribute('src'))video.src=video.dataset.src;
  if(!video.poster&&video.dataset.poster)video.poster=video.dataset.poster;
  video.currentTime=0;video.volume=.8;syncSound();play.hidden=true;toggle.textContent='PAUSE';
  skip.focus({preventScroll:true});requestPlay();
 }
 play.addEventListener('click',requestPlay);
 toggle.addEventListener('click',()=>{if(video.paused)requestPlay();else video.pause();});
 skip.addEventListener('click',()=>stop(true,'skip'));
 sound.addEventListener('click',()=>{onToggleSound();syncSound();});
 video.addEventListener('play',syncPlayback);video.addEventListener('pause',syncPlayback);
 video.addEventListener('ended',()=>stop(true,'ended'));
 video.addEventListener('error',()=>stop(true,'error'));
 document.addEventListener('visibilitychange',()=>{if(active&&document.hidden)video.pause();});
 root.addEventListener('keydown',event=>{
  if(!active)return;
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();stop(true,'skip');}
  if(event.key==='Tab'){
   const buttons=[...root.querySelectorAll('button')].filter(button=>!button.hidden&&!button.disabled);
   const first=buttons[0],last=buttons.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
 });
 return {open,cancel:()=>stop(false,'cancel'),syncSound,get active(){return active;}};
}
