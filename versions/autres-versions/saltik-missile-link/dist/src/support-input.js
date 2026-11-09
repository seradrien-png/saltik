// Capture only the aiming finger; movement and the three native weapons retain
// their separate owners. Cancellation is deliberately different from release.
export function bindSupportDesignator(button,input,isPlaying,unlock,onAim,onCancel){
  let pointer=null,start=null;
  const paint=()=>{button.classList.toggle('pressed',input.actions.support);button.setAttribute('aria-pressed',String(input.actions.support));};
  input.subscribe(paint);
  function finish(e,cancel=false){
    if(pointer!==e.pointerId)return;const id=pointer;pointer=null;start=null;
    if(cancel){input.cancel('support');onCancel();}else input.replace(`support:${id}`,[]);
    try{button.releasePointerCapture(id);}catch{}
  }
  button.addEventListener('pointerdown',e=>{
    e.preventDefault();if(pointer!==null||e.button!==0||!isPlaying()||button.disabled)return;
    unlock();pointer=e.pointerId;start={x:e.clientX,y:e.clientY};onAim({dx:0,dy:0,manual:false});
    input.replace(`support:${pointer}`,['support']);try{button.setPointerCapture(pointer);}catch{}
  });
  button.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;e.preventDefault();const dx=e.clientX-start.x,dy=e.clientY-start.y;onAim({dx,dy,manual:Math.hypot(dx,dy)>8});});
  button.addEventListener('pointerup',e=>finish(e));
  button.addEventListener('pointercancel',e=>finish(e,true));
  button.addEventListener('lostpointercapture',e=>finish(e,true));
  if(typeof window!=='undefined'){window.addEventListener('pointerup',e=>finish(e));window.addEventListener('pointercancel',e=>finish(e,true));}
  button.addEventListener('contextmenu',e=>e.preventDefault());
  button.addEventListener('keydown',e=>{if(!['Space','Enter'].includes(e.code))return;e.preventDefault();e.stopPropagation();if(e.repeat||!isPlaying()||button.disabled)return;unlock();onAim({dx:0,dy:0,manual:false});input.set('support-key','support',true);});
  button.addEventListener('keyup',e=>{if(!['Space','Enter'].includes(e.code))return;e.preventDefault();e.stopPropagation();input.set('support-key','support',false);});
  function clear(){if(pointer!==null)finish({pointerId:pointer},true);input.cancel('support');onCancel();paint();}
  button.addEventListener('blur',()=>{if(pointer===null&&input.actions.support)clear();});
  return {clear};
}
