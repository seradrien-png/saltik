export const KEY_ACTIONS=Object.freeze({
  ArrowLeft:'left',KeyA:'left',KeyQ:'left',ArrowRight:'right',KeyD:'right',
  Space:'jump',ArrowUp:'jump',KeyW:'jump',KeyZ:'jump',
  ArrowDown:'crouch',KeyS:'crouch',KeyC:'crouch',
  KeyJ:'fire',KeyX:'fire',KeyK:'missile',KeyL:'homing',KeyR:'homing',
  KeyF:'shift',ShiftLeft:'shift',ShiftRight:'shift',KeyE:'drop',KeyB:'bossAction'
});

// Each finger/key owns its complete action set. Dragging one thumb cannot cancel
// movement or weapons held by a different source.
export function createInput(){
  const sources=new Map(),listeners=new Set(),pending=new Set();
  let missileReleased=false,missileCancelled=false;
  const actions={left:false,right:false,jump:false,crouch:false,drop:false,fire:false,missile:false,homing:false,shift:false,qte:false,bossAction:false};
  const queuedActions=['jump','drop','fire','missile','homing','qte','bossAction'];
  function sync(cancelled=false){
    const previous={...actions};
    for(const key of Object.keys(actions))actions[key]=false;
    for(const held of sources.values())for(const action of held)actions[action]=true;
    for(const action of queuedActions)if(actions[action]&&!previous[action])pending.add(action);
    if(previous.missile&&!actions.missile){
      if(cancelled){missileCancelled=true;missileReleased=false;pending.delete('missile');}
      else missileReleased=true;
    }
    for(const listener of listeners)listener(actions);
  }
  return {
    actions,
    // Preserve taps for one step; fireHeld distinguishes a released reload tap
    // from a trigger that stays down across the completion boundary.
    consume(){const next={...actions,fireHeld:actions.fire,missileHeld:actions.missile,missileReleased,missileCancelled};for(const action of pending)next[action]=true;pending.clear();missileReleased=false;missileCancelled=false;return next;},
    set(source,action,held){
      if(!Object.hasOwn(actions,action))return;
      const owned=sources.get(source)||new Set();
      if(held){owned.add(action);}else owned.delete(action);
      if(owned.size)sources.set(source,owned);else sources.delete(source);
      sync();
    },
    replace(source,next){
      const owned=new Set(next.filter(action=>Object.hasOwn(actions,action)));
      if(owned.size)sources.set(source,owned);else sources.delete(source);
      sync();
    },
    subscribe(listener){listeners.add(listener);return ()=>listeners.delete(listener);},
    cancel(source){if(!sources.delete(source))return;sync(true);},
    clear(){sources.clear();pending.clear();sync(true);missileReleased=false;missileCancelled=false;}
  };
}

function pressed(button,held){button.classList.toggle('pressed',held);button.setAttribute('aria-pressed',String(held));}

export function bindButton(button,input,isPlaying,unlock){
  const action=button.dataset.action,pointers=new Set();
  const paint=()=>pressed(button,input.actions[action]);
  input.subscribe(paint);
  function release(e){if(!pointers.delete(e.pointerId))return;if(e.type==='pointercancel'||e.type==='lostpointercapture'||e.cancelled)input.cancel(`pointer:${e.pointerId}`);else input.replace(`pointer:${e.pointerId}`,[]);}
  button.addEventListener('pointerdown',e=>{
    e.preventDefault();if(!isPlaying()||button.disabled||e.button!==0)return;
    unlock();pointers.add(e.pointerId);input.replace(`pointer:${e.pointerId}`,[action]);
    try{button.setPointerCapture(e.pointerId);}catch{}
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
  for(const event of ['pointerup','pointercancel'])window.addEventListener(event,release);
  button.addEventListener('contextmenu',e=>e.preventDefault());
  button.addEventListener('keydown',e=>{
    if(!['Space','Enter'].includes(e.code))return;e.preventDefault();e.stopPropagation();
    if(!isPlaying()||button.disabled||e.repeat)return;input.set(`button:${action}:${e.code}`,action,true);unlock();
  });
  button.addEventListener('keyup',e=>{
    if(!['Space','Enter'].includes(e.code))return;e.preventDefault();e.stopPropagation();
    input.set(`button:${action}:${e.code}`,action,false);
  });
  const releaseKeys=()=>{for(const code of ['Space','Enter'])input.cancel(`button:${action}:${code}`);};
  button.addEventListener('blur',releaseKeys);
  return {clear(){
    for(const id of [...pointers]){release({pointerId:id,cancelled:true});try{button.releasePointerCapture(id);}catch{}}
    releaseKeys();paint();
  }};
}

// The three-by-three hit grid includes the small seams between the visible keys.
// A little outer tolerance keeps a thumb from dropping input at the metal rim.
export function getPadCell(x,y,rect){
  if(x<rect.left-12||y<rect.top-12||x>rect.left+rect.width+12||y>rect.top+rect.height+12)return -1;
  const col=Math.max(0,Math.min(2,Math.floor((x-rect.left)/rect.width*3)));
  const row=Math.max(0,Math.min(2,Math.floor((y-rect.top)/rect.height*3)));
  return row*3+col;
}

export function bindDirectionalPad(pad,input,isPlaying,unlock){
  const cells=[...pad.querySelectorAll('.pad-cell')],pointers=new Map(),keys=new Map();
  const actions=cell=>(cell.dataset.padActions||'').split(' ').filter(Boolean);
  function paint(){
    const selected=new Set([...pointers.values(),...keys.values()]);
    const a=input.actions;
    // Keyboard combinations light one matching sector. A captured thumb lights
    // its exact sector. The ESQUIVE button independently owns explicit hub presses.
    if(!pointers.size&&!keys.size){
      const x=Number(a.right)-Number(a.left),y=a.crouch?1:a.jump?-1:0;
      if(x||y)selected.add(cells[(y+1)*3+x+1]);
    }
    for(const cell of cells)if(cell.dataset.padActions)pressed(cell,selected.has(cell));
  }
  input.subscribe(paint);
  function select(id,cell){
    pointers.set(id,cell);input.replace(`pointer:${id}`,cell?actions(cell):[]);
  }
  function release(e){
    if(!pointers.has(e.pointerId))return;
    pointers.delete(e.pointerId);input.replace(`pointer:${e.pointerId}`,[]);
  }
  pad.addEventListener('pointerdown',e=>{
    if(e.target.closest('[data-action="shift"]'))return;
    const cell=e.target.closest('[data-pad-actions]');
    if(!cell||!pad.contains(cell))return;
    e.preventDefault();if(!isPlaying()||e.button!==0)return;
    unlock();select(e.pointerId,cell);
    try{pad.setPointerCapture(e.pointerId);}catch{}
  });
  pad.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;e.preventDefault();
    if(!isPlaying()){release(e);return;}
    const index=getPadCell(e.clientX,e.clientY,pad.getBoundingClientRect());
    // Crossing ESQUIVE while dragging is neutral, exactly like the original pad.
    const cell=cells[index]?.dataset.padActions?cells[index]:null;
    if(pointers.get(e.pointerId)!==cell)select(e.pointerId,cell);
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(event,release);
  for(const event of ['pointerup','pointercancel'])window.addEventListener(event,release);
  pad.addEventListener('contextmenu',e=>e.preventDefault());
  cells.forEach((cell,index)=>{
    if(!cell.dataset.padActions)return;
    cell.addEventListener('keydown',e=>{
      if(!['Space','Enter'].includes(e.code))return;e.preventDefault();e.stopPropagation();
      if(!isPlaying())return;
      const source=`pad-key:${index}:${e.code}`;keys.set(source,cell);input.replace(source,actions(cell));unlock();
    });
    cell.addEventListener('keyup',e=>{
      if(!['Space','Enter'].includes(e.code))return;e.preventDefault();e.stopPropagation();
      const source=`pad-key:${index}:${e.code}`;keys.delete(source);input.replace(source,[]);
    });
    cell.addEventListener('blur',()=>{
      for(const code of ['Space','Enter']){const source=`pad-key:${index}:${code}`;keys.delete(source);input.replace(source,[]);}
    });
  });
  return {clear(){
    for(const id of [...pointers.keys()]){release({pointerId:id});try{pad.releasePointerCapture(id);}catch{}}
    for(const source of keys.keys())input.replace(source,[]);keys.clear();paint();
  }};
}
