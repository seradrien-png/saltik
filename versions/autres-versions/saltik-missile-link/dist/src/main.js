import {endEvasion} from './evasion.js';
import {setupHomeShortcut} from './install.js';
import {bindSupportDesignator} from './support-input.js';
import {cancelMissileLink,supportAim,SUPPORT_COOLDOWN,linkIntroLine} from './missile-link.js';
import {artilleryAlert} from './missile-campaign.js';
import {bossGeometry} from './boss-tank.js';
import {createGame,update,availableBossAssault,MIRV_RECHARGE,HOMING_RECHARGE,PRIMARY_FIRE_TIME,PRIMARY_RELOAD,clamp,clearPlayerWeaponQueue} from './engine.js';
import {createRenderer,loadArt} from './renderer.js';
import {createInput,bindButton,bindDirectionalPad,KEY_ACTIONS} from './input.js';
import {createAudio} from './audio.js';
const $=id=>document.getElementById(id),app=$('app'),renderer=createRenderer($('game')),input=createInput(),audio=createAudio();
setupHomeShortcut();
let game=createGame(),view='title',lastFrame=0,accumulator=0,uiAt=0,resultAt=0,best=0,artReady=false,duelPhase=null,clashPhase=null,breachPhase=null,introActive=false;
game.status='title';
try{best=Number(localStorage.getItem('feral-steel-best'))||0;audio.setEnabled(localStorage.getItem('feral-steel-sound')!=='off');}catch{}
const inIntro=()=>game.introElapsed<game.introDuration;
const canDrive=()=>view==='playing'&&!game.duel&&!game.batteryClash&&!game.bossBreach&&!inIntro();
const canAssault=()=>view==='playing'&&!inIntro()&&!game.duel&&!game.batteryClash&&(game.bossBreach?.phase==='qte'||!!availableBossAssault(game));
const canIntercept=()=>{const alert=artilleryAlert(game);return canDrive()&&alert.visible&&alert.ready&&!alert.armed;};
const bindings=[bindDirectionalPad($('directional-pad'),input,canDrive,()=>audio.unlock()),...[...document.querySelectorAll('.action-controls [data-action],#deflect-button,#shift-button,#drop-button')].map(button=>bindButton(button,input,canDrive,()=>audio.unlock())),bindButton($('qte-button'),input,()=>view==='playing'&&(game.duel?.phase==='qte'||game.batteryClash?.phase==='qte'),()=>audio.unlock())];
bindings.push(bindButton($('boss-action-button'),input,canAssault,()=>audio.unlock()));
bindings.push(bindButton($('intercept-button'),input,canIntercept,()=>audio.unlock()));
let supportDragOrigin=null;
bindings.push(bindSupportDesignator($('support-button'),input,canDrive,()=>audio.unlock(),({dx,dy,manual})=>{
  if(!manual){input.setSupportAim(null);supportDragOrigin=supportAim(game).point;return;}
  const r=$('game').getBoundingClientRect(),scale=renderer.width/r.width;
  const origin=supportDragOrigin??supportAim(game).point;
  input.setSupportAim({x:origin.x+dx*scale*1.7,y:origin.y+dy*scale*1.7});
},()=>{supportDragOrigin=null;cancelMissileLink(game);}));
$('game').addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse'||!input.actions.support||!canDrive())return;
  const r=$('game').getBoundingClientRect();input.setSupportAim({x:renderer.camera+(e.clientX-r.left)*renderer.width/r.width,y:-renderer.cameraY+(e.clientY-r.top)*renderer.height/r.height});
});
input.subscribe(actions=>{if(!actions.shift)endEvasion(game.player.evasion);});
const introKeys=new Set();
const number=n=>Math.floor(n).toString().padStart(6,'0');
function clearInput(){bindings.forEach(binding=>binding.clear());input.clear();cancelMissileLink(game);clearPlayerWeaponQueue(game.player);game.player.deflectHeld=false;game.player.shiftHeld=false;endEvasion(game.player.evasion);if(game.duel)game.duel.qteHeld=false;if(game.batteryClash)game.batteryClash.qteHeld=false;if(game.batteryEncounter)game.batteryEncounter.interceptHeld=false;document.querySelectorAll('[data-action],[data-pad-actions]').forEach(button=>{button.classList.remove('pressed');button.setAttribute('aria-pressed','false');});}
function syncDuelPhase(){
  const next=game.duel?.phase??null;if(next===duelPhase)return;
  clearInput();duelPhase=next;app.classList.toggle('in-duel',!!game.duel);
  if(next==='qte')$('qte-button').focus({preventScroll:true});
  else $('qte-button').blur();
}
function syncClashPhase(){
  const next=game.batteryClash?.phase??null;if(next===clashPhase)return;
  clearInput();clashPhase=next;app.classList.toggle('in-clash',!!game.batteryClash);
  if(next==='qte')$('qte-button').focus({preventScroll:true});
  else if(game.duel?.phase!=='qte')$('qte-button').blur();
}
function syncBreachPhase(){
  const next=game.bossBreach?`${game.bossBreach.kind}:${game.bossBreach.phase}`:null;if(next===breachPhase)return;
  clearInput();breachPhase=next;app.classList.toggle('in-breach',!!game.bossBreach);
}
function syncIntroState(){
  const next=inIntro();if(next!==introActive){clearInput();introActive=next;}
  app.dataset.cinematic=view==='won'?'victory':next?'intro':'';
}
function setView(next){view=next;audio.setPlaying(next==='playing');app.className=`state-${view}${game.duel?' in-duel':''}${game.batteryClash?' in-clash':''}${game.bossBreach?' in-breach':''}`;$('title-screen').hidden=view!=='title';$('hud').hidden=view==='title';$('controls').hidden=view!=='playing';$('pause').hidden=!['playing','paused'].includes(view);$('pause-screen').hidden=view!=='paused';$('result-screen').hidden=!['dead','won'].includes(view)||!resultAt;syncIntroState();}
function soundUI(){$('sound').classList.toggle('muted',!audio.enabled);$('sound').setAttribute('aria-pressed',String(!audio.enabled));$('sound').setAttribute('aria-label',audio.enabled?'Couper le son':'Activer le son');}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;setTimeout(()=>{$('toast').hidden=true;},4000);}
function start(){if(!artReady)return;audio.setPlaying(true,{restart:true});audio.unlock();audio.play({type:'start'});clearInput();game=createGame({intro:true});duelPhase=null;clashPhase=null;breachPhase=null;introActive=false;renderer.reset();lastFrame=performance.now();accumulator=0;resultAt=0;$('boss-hud').hidden=true;$('result-screen').hidden=true;setView('playing');$('start').blur();$('replay').blur();$('restart-pause').blur();updateUI();}
function pause(){if(view!=='playing')return;clearInput();game.status='paused';setView('paused');$('resume').focus({preventScroll:true});}
function resume(){if(view!=='paused'||matchMedia('(orientation: portrait)').matches)return;clearInput();audio.unlock();game.status='playing';setView('playing');lastFrame=performance.now();accumulator=0;$('resume').blur();if(game.duel?.phase==='qte'||game.batteryClash?.phase==='qte')$('qte-button').focus({preventScroll:true});}
function home(){clearInput();game=createGame();game.status='title';duelPhase=null;clashPhase=null;breachPhase=null;renderer.reset();resultAt=0;setView('title');$('boss-hud').hidden=true;$('start').focus({preventScroll:true});}
function finish(){clearInput();view=game.status;setView(view);resultAt=performance.now()+(view==='won'?4500:1500);const won=view==='won';if(won)audio.play({type:'won'});best=Math.max(best,game.stats.score);try{localStorage.setItem('feral-steel-best',String(best));}catch{}$('result-eyebrow').textContent=won?'SECTEUR 07 / MENACE NEUTRALISÉE':'SIGNAL PERDU / SALTIK HORS SERVICE';$('result-title').innerHTML=won?'MISSION<br><em>ACCOMPLIE.</em>':'BLINDAGE<br><em>CRITIQUE.</em>';$('result-copy').textContent=won?'Le gardien est tombé. Le canyon vous appartient.':'Le canyon résiste. Votre prochaine sortie fera la différence.';$('result-score').textContent=number(game.stats.score);$('result-kills').textContent=game.stats.kills;$('result-best').textContent=number(best);$('result-screen').hidden=true;}
function recharge(buttonId,textId,barId,remaining,total,ready,label){
  const waiting=remaining>0,button=$(buttonId);
  $(textId).textContent=waiting?`${remaining.toFixed(1)}s`:ready;
  $(barId).style.width=`${clamp(1-remaining/total,0,1)*100}%`;
  button.classList.toggle('recharging',waiting);
  button.setAttribute('aria-label',waiting?`${label}, recharge ${remaining.toFixed(1)} secondes`:label);
}
function updateUI(){
  const p=game.player,hpRatio=clamp(p.hp/(p.maxHp||100),0,1),shifting=p.evasion.active;
  const breach=game.bossBreach,assault=$('boss-action-button'),gripping=breach?.phase==='qte',assaultKind=availableBossAssault(game);
  assault.hidden=!canAssault();assault.classList.toggle('is-qte',gripping);
  if(gripping){
    const bounds=$('game').getBoundingClientRect(),parent=app.getBoundingClientRect();
    const x=clamp((p.x-renderer.camera)/renderer.width*bounds.width,40,bounds.width-40)+bounds.left-parent.left;
    const y=clamp((p.y+renderer.cameraY-120)/renderer.height*bounds.height,108,bounds.height-20)+bounds.top-parent.top;
    assault.style.setProperty('--boss-action-x',`${x}px`);assault.style.setProperty('--boss-action-y',`${y}px`);
  }
  for(const [i,mark] of [...assault.querySelectorAll('.qte-marks i')].entries())mark.classList.toggle('complete',i<(breach?.taps??0));
  const hullAction=(breach?.kind??assaultKind)==='hull';
  assault.classList.toggle('is-hull',hullAction);
  $('boss-action-name').textContent=hullAction?'ARRACHER':'POD';
  const actionName=hullAction?'Arracher le blindage':'Arracher le lance-roquettes';
  assault.setAttribute('aria-label',gripping?`${actionName}, ${breach.taps} appuis sur trois, B`:`Sauter sur le tank pour ${actionName.toLowerCase()}, B`);
  $('hp-value').textContent=Math.ceil(p.hp);$('hp-bar').style.width=`${hpRatio*100}%`;document.querySelector('.armor').classList.toggle('low',hpRatio<.3);
  recharge('missile-button','mirv-cooldown','mirv-reload',p.mirvIn||0,MIRV_RECHARGE,'PRÊT','MIRV à sous-munitions, K');
  recharge('homing-button','homing-cooldown','homing-reload',p.homingIn||0,HOMING_RECHARGE,'PRÊTS','Missiles guidés sur les ennemis, L ou R');
  const link=game.missileLink;
  recharge('support-button','support-cooldown','support-reload',link.cooldown,SUPPORT_COOLDOWN,link.aiming?'RELÂCHER':'PRÊT','Appui missile : maintenir et glisser pour viser, relâcher pour tirer, M');
  $('support-button').classList.toggle('designating',link.aiming);
  const alert=artilleryAlert(game),intercept=$('intercept-button');
  $('support-button').classList.toggle('incoming',alert.visible);
  intercept.hidden=!alert.visible||!canDrive();intercept.disabled=!canIntercept();
  intercept.classList.toggle('recharging',alert.cooldown>0);intercept.classList.toggle('armed',alert.armed);
  const alertStatus=alert.armed?'INTERCEPTION ARMÉE':alert.cooldown>0?`APPUI · ${alert.cooldown.toFixed(1)}s`:alert.warning?`INTERCEPTER · N · ${alert.remaining.toFixed(1)}s`:'INTERCEPTER · N';
  $('intercept-status').textContent=alertStatus;
  intercept.setAttribute('aria-label',`Alerte missiles, ${alertStatus.toLowerCase()}, N`);
  const line=view==='playing'?linkIntroLine(game):null;
  $('link-dialogue').hidden=!line;
  if(line){$('link-speaker').textContent=line.speaker;$('link-line').textContent=line.text;$('link-dialogue').classList.toggle('ally',line.ally);}
  $('shift-button').classList.toggle('active',shifting);$('shift-button').setAttribute('aria-pressed',String(shifting||input.actions.shift));
  $('shift-button').setAttribute('aria-label',shifting?'Arrière-plan, relâcher pour revenir':'Esquive en arrière-plan, maintenir F ou Majuscule');
  const parrying=!!p.deflect?.active;
  $('deflect-button').classList.toggle('active',parrying);$('deflect-button').setAttribute('aria-pressed',String(parrying||input.actions.deflect));
  $('deflect-button').setAttribute('aria-label','Dévier un projectile, H, sans recharge');
  const reloading=p.reloadIn>0;
  $('fire-cooldown').textContent=reloading?`RECH. ${p.reloadIn.toFixed(1)}s`:`${p.fireSpent.toFixed(1)} / ${PRIMARY_FIRE_TIME} s`;
  $('fire-progress').style.width=`${clamp(reloading?1-p.reloadIn/PRIMARY_RELOAD:p.fireSpent/PRIMARY_FIRE_TIME,0,1)*100}%`;
  $('fire-button').classList.toggle('recharging',reloading);
  $('fire-button').setAttribute('aria-label',reloading?`Tir, recharge ${p.reloadIn.toFixed(1)} secondes`:`Tirer, J ou X, ${Math.max(0,PRIMARY_FIRE_TIME-p.fireSpent).toFixed(1)} secondes avant recharge`);
  if(p.mirvPending)$('mirv-cooldown').textContent='ÉLÉVATION';
  for(const button of document.querySelectorAll('.action-controls [data-action]'))button.classList.toggle('locked',shifting||parrying);
  $('boss-hud').hidden=!game.boss||game.boss.hp<=0||view==='title';if(game.boss){$('boss-bar').style.width=`${Math.max(0,game.boss.hp/game.boss.maxHp)*100}%`;$('boss-percent').textContent=`${Math.max(0,Math.ceil(game.boss.hp/game.boss.maxHp*100))}%`;}
  const struggle=game.batteryClash??game.duel,qte=struggle?.phase==='qte',target=game.batteryClash?3:5;
  $('duel-ui').hidden=!struggle||view!=='playing';$('qte-controls').hidden=!qte;
  for(const [i,mark] of [...$('qte-button').querySelectorAll('.qte-marks i')].entries()){mark.hidden=i>=target;mark.classList.toggle('complete',i<(struggle?.taps??0));}
  $('qte-button').setAttribute('aria-label',`Pousser, ${struggle?.taps??0} appuis sur ${target===3?'trois':'cinq'}, Espace ou Entrée`);

}
const keys=KEY_ACTIONS;
window.addEventListener('keydown',event=>{
  if(event.code==='Escape'||event.code==='KeyP'){event.preventDefault();if(!event.repeat){if(view==='playing')pause();else if(view==='paused')resume();}return;}
  if((event.code==='Enter'||event.code==='Space')&&view==='title'){event.preventDefault();if(!event.repeat){start();introKeys.add(event.code);}return;}
  if(view!=='playing')return;
  if(inIntro()){event.preventDefault();introKeys.add(event.code);return;}
  if(introKeys.has(event.code)){event.preventDefault();return;}
  if(event.code==='KeyB'){
    event.preventDefault();if(!event.repeat&&canAssault()){audio.unlock();input.set('key:KeyB','bossAction',true);}return;
  }
  if(game.bossBreach)return;
  if(game.duel||game.batteryClash){
    if(['Space','Enter'].includes(event.code)){event.preventDefault();if((game.batteryClash??game.duel).phase==='qte'&&!event.repeat){audio.unlock();input.set(`qte-key:${event.code}`,'qte',true);}}return;
  }
  const action=keys[event.code];if(!action)return;if(action==='intercept'&&!canIntercept()){event.preventDefault();return;}if(['deflect','shift','support','intercept'].includes(action)&&event.repeat)return;event.preventDefault();audio.unlock();input.set(`key:${event.code}`,action,true);
});
window.addEventListener('keyup',event=>{
  introKeys.delete(event.code);
  if(['Space','Enter'].includes(event.code))input.set(`qte-key:${event.code}`,'qte',false);
  const action=keys[event.code];if(!action)return;event.preventDefault();input.set(`key:${event.code}`,action,false);
});
window.addEventListener('blur',()=>{introKeys.clear();clearInput();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();pause();}});
matchMedia('(orientation: portrait)').addEventListener('change',event=>{if(event.matches){clearInput();pause();}});
$('start').addEventListener('click',start);$('resume').addEventListener('click',resume);$('pause').addEventListener('click',()=>view==='paused'?resume():pause());$('replay').addEventListener('click',start);$('restart-pause').addEventListener('click',start);$('return-home').addEventListener('click',home);$('home-link').addEventListener('click',e=>{e.preventDefault();if(view!=='title')home();});
$('sound').addEventListener('click',()=>{audio.setEnabled(!audio.enabled);if(audio.enabled)audio.unlock();soundUI();try{localStorage.setItem('feral-steel-sound',audio.enabled?'on':'off');}catch{}});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(app.requestFullscreen){await app.requestFullscreen();try{await screen.orientation.lock('landscape');}catch{}}else toast('Le jeu occupe déjà toute la fenêtre.');}catch{toast('Plein écran indisponible. Le jeu reste accessible dans cette fenêtre.');}});
function frame(now){const elapsed=clamp((now-lastFrame)/1000,0,.12);lastFrame=now;if(view==='playing'){game.viewport={x:renderer.camera,y:-renderer.cameraY,w:renderer.width,h:renderer.height??720};accumulator+=elapsed;while(accumulator>=1/60&&game.status==='playing'){update(game,input.consume(),1/60);syncDuelPhase();syncClashPhase();syncBreachPhase();syncIntroState();accumulator-=1/60;}if(['won','dead'].includes(game.status))finish();}else accumulator=0;
  for(const event of game.events){renderer.addEvent(event);audio.play(event);}game.events.length=0;
  renderer.render(game,now,view);game.viewport={x:renderer.camera,y:-renderer.cameraY,w:renderer.width,h:renderer.height};if(now-uiAt>80){updateUI();uiAt=now;}if(resultAt&&now>resultAt&&$('result-screen').hidden){$('result-screen').hidden=false;$('replay').focus({preventScroll:true});}requestAnimationFrame(frame);
}
soundUI();$('start').disabled=true;$('start').querySelector('span').textContent='CONNEXION AU SALTIK…';requestAnimationFrame(frame);
loadArt().then(()=>{artReady=true;$('start').disabled=false;$('start').querySelector('span').textContent='DÉPLOYER LE SALTIK';}).catch(error=>{$('start').querySelector('span').textContent='CONNEXION INTERROMPUE';toast('Le Saltik Striker n’a pas pu être chargé. Rechargez la page pour réessayer.');console.error(error);});
// Read-only snapshot for reproducible browser verification; no control shortcuts.
export function getSnapshot(){return {
  status:game.status,view,player:structuredClone(game.player),stats:{...game.stats},progress:game.progress,time:game.time,missileLink:structuredClone(game.missileLink),
  batteryEncounter:game.batteryEncounter?structuredClone(game.batteryEncounter):null,batteryClash:game.batteryClash?structuredClone(game.batteryClash):null,missileCompanion:game.missileCompanion?structuredClone(game.missileCompanion):null,countermeasures:structuredClone(game.countermeasures??[]),
  introDuration:game.introDuration,introElapsed:game.introElapsed,duel:game.duel?structuredClone(game.duel):null,bossBreach:game.bossBreach?structuredClone(game.bossBreach):null,bossBreachUsed:!!game.bossBreachUsed,bossPodUsed:!!game.bossPodUsed,bossPodLandedAt:game.bossPodLandedAt,bossAssaultAvailable:availableBossAssault(game),speech:audio.speechSnapshot,boss:game.boss?{...structuredClone(game.boss),geometry:bossGeometry(game.boss)}:null,
  enemyCount:game.enemies.length,enemies:game.enemies.map(enemy=>enemy.type==='battery'?structuredClone(enemy):(({id,type,x,y,hp,maxHp,platformId,tier,dir,vx,phase,firePose,attackPhase,lockProgress,podRaise,podLaunch,guard,guardFlash,guardResponse,warning,volleys,tilt})=>({id,type,x,y,hp,maxHp,platformId,tier,dir,vx,phase,firePose,attackPhase,lockProgress,podRaise,podLaunch,guard,guardFlash,guardResponse,warning,volleys,tilt}))(enemy)),
  obstacles:game.obstacles.map(({id,type,x,y,w,h,hp,tier,platformId})=>({id,type,x,y,w,h,hp,tier,platformId})),inputs:{...input.actions},projectiles:game.projectiles.map(({id,x,y,vx,vy,team,kind,targetId,hp,locking,age,life,radius,damage,launchX,launchY,salvoIndex,guidance})=>({id,x,y,vx,vy,team,kind,targetId,hp,locking,age,life,radius,damage,launchX,launchY,salvoIndex,guidance:guidance?{avoiding:!!guidance.avoiding}:undefined})),cameraZoom:renderer.cameraZoom,presentationAge:renderer.presentationAge,camera:renderer.camera,cameraY:renderer.cameraY,worldWidth:renderer.width,viewport:{...game.viewport}
};}
