// The movie has no media source until a completed victory presentation opens it.
export function createVictoryFilm({overlay,video,playButton,pauseButton,skipButton,soundButton,
  documentTarget=globalThis.document,soundEnabled=()=>true,onToggleSound=()=>{},onOpen=()=>{},onComplete=()=>{},
  src='./video/saltik-free-together.mp4',poster='./video/saltik-free-together-poster.jpg',
  setTimer=setTimeout,clearTimer=clearTimeout}={}){
  let state='idle',readyAt=0,session=0,attempt=0,timer=null,reason=null;
  const listeners=[];
  const active=()=>['loading','playing','ready','paused'].includes(state);
  const focus=element=>{if(!documentTarget?.hidden)element?.focus?.({preventScroll:true});};
  function syncSound(){
    video.muted=!soundEnabled();
    soundButton?.setAttribute('aria-pressed',String(video.muted));
    if(soundButton)soundButton.textContent=video.muted?'SOUND OFF':'SOUND ON';
  }
  function show(next){
    state=next;overlay.dataset.state=state;
    playButton.hidden=!['ready','paused'].includes(state);
    if(pauseButton)pauseButton.hidden=state!=='playing';
  }
  function clearWatch(){if(timer!==null){clearTimer(timer);timer=null;}}
  function watch(){
    clearWatch();const current=session;
    timer=setTimer(()=>{timer=null;if(session===current&&active())complete('error');},12000);
  }
  function listen(target,type,handler){
    const current=session,guarded=event=>{if(current===session&&active())handler(event);};
    target?.addEventListener?.(type,guarded);
    listeners.push(()=>target?.removeEventListener?.(type,guarded));
  }
  function release(){
    attempt++;clearWatch();for(const remove of listeners.splice(0))remove();
    overlay.hidden=true;
    if(video.getAttribute('src')!==null){
      video.pause();video.removeAttribute('src');video.removeAttribute('poster');
      // load() after removing src aborts the old network/decode work.
      video.load?.();
    }
  }
  function complete(why){
    if(!active())return;
    reason=why;show('complete');release();onComplete(why);
  }
  function cancel(){session++;show('idle');reason=null;readyAt=0;release();}
  function pause(){
    if(!active())return;
    attempt++;clearWatch();show('paused');video.pause();focus(playButton);
  }
  function playing(){
    if(!active())return;
    if(state==='paused'||state==='ready'){video.pause();return;}
    if(documentTarget?.hidden){pause();return;}
    show('playing');watch();if(documentTarget?.activeElement===playButton)focus(skipButton);
  }
  function play(){
    if(!active()||state==='loading'||state==='playing')return;
    if(documentTarget?.hidden){pause();return;}
    syncSound();show('loading');watch();const current=session,ticket=++attempt;
    const valid=()=>current===session&&ticket===attempt&&active();
    const blocked=()=>{if(!valid())return;clearWatch();show('ready');video.pause();focus(playButton);};
    try{
      const result=video.play();
      if(result?.then)result.then(()=>{
        if(valid())playing();
        else if(!active()||state==='paused')video.pause();
      },blocked);
      // Older media implementations report playback through the playing event.
    }catch{blocked();}
  }
  function open(){
    show('ready');overlay.hidden=false;skipButton.hidden=false;if(soundButton)soundButton.hidden=false;
    onOpen();syncSound();
    listen(video,'ended',()=>complete('ended'));
    listen(video,'error',()=>complete('error'));
    listen(video,'playing',playing);
    listen(video,'waiting',()=>{if(state==='playing'||state==='loading')watch();});
    listen(video,'stalled',()=>{if(state==='playing'||state==='loading')watch();});
    listen(video,'timeupdate',()=>{if(state==='playing')watch();});
    listen(playButton,'click',play);listen(pauseButton,'click',pause);listen(skipButton,'click',()=>complete('skip'));
    listen(soundButton,'click',()=>{onToggleSound();syncSound();});
    listen(documentTarget,'visibilitychange',()=>{
      if(documentTarget.hidden){if(state==='playing'||state==='loading')pause();}
      else if(state==='paused')focus(playButton);
    });
    video.setAttribute('poster',poster);video.setAttribute('src',src);
    focus(skipButton);play();
  }
  function handleKey(event){
    if(!active())return false;
    if(event.code==='Escape'){event.preventDefault();if(!event.repeat)complete('skip');return true;}
    if(event.code==='Tab'){
      // Follow the header controls, then the stage's Play button, as in the DOM.
      const buttons=[pauseButton,soundButton,skipButton,playButton].filter(button=>button&&!button.hidden);
      const index=buttons.indexOf(documentTarget?.activeElement);
      if(index<0||(event.shiftKey?index===0:index===buttons.length-1)){
        event.preventDefault();focus(event.shiftKey?buttons.at(-1):buttons[0]);return true;
      }
    }
    if(['Enter','Space'].includes(event.code)){
      const target=documentTarget?.activeElement;
      event.preventDefault();
      if(!event.repeat){
        if(target===skipButton)complete('skip');
        else if(target===soundButton){onToggleSound();syncSound();}
        else if(target===pauseButton)pause();
        else play();
      }
      return true;
    }
    return false;
  }
  return {
    arm(outcome,at){cancel();if(outcome==='won'){readyAt=at;show('waiting');}},
    update(now){if(state==='waiting'&&now>=readyAt)open();return state==='waiting'||active();},
    cancel,handleKey,syncSound,
    get snapshot(){return Object.freeze({state,active:active(),readyAt,reason,muted:!!video.muted});}
  };
}
