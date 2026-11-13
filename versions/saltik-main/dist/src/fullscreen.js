// Native fullscreen is optional. Its security instructions belong to the
// browser; ordinary launch/play never requests it or creates an exit banner.
export function setupFullscreen(button,app,{document:doc=globalThis.document,orientation=globalThis.screen?.orientation,onError=()=>{}}={}){
 let wasFullscreen=false;
 const sync=()=>{
  const active=doc.fullscreenElement===app;
  button.setAttribute('aria-pressed',String(active));
  const label=active?'Quitter le plein écran':'Plein écran (facultatif)';button.title=label;button.setAttribute('aria-label',label);
  if(wasFullscreen&&!active)try{orientation?.unlock?.();}catch{}
  wasFullscreen=active;
 };
 button.hidden=typeof app.requestFullscreen!=='function'||doc.fullscreenEnabled===false;
 doc.addEventListener('fullscreenchange',sync);sync();
 button.addEventListener('click',async()=>{
  try{
   if(doc.fullscreenElement===app)await doc.exitFullscreen();
   else{
    await app.requestFullscreen({navigationUI:'hide'});
    if(doc.fullscreenElement===app)try{await orientation?.lock?.('landscape');}catch{}
   }
   sync();
  }catch(error){sync();onError(error);}
 });
}
