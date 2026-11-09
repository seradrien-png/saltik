import {inkSaltikGeometry} from './ink-saltik.js';
import {padCoversPlayer} from './control-layout.js';
import {endEvasion} from './evasion.js';
import {setupHomeShortcut} from './install.js';
import {bossGeometry} from './boss-tank.js';
import {availableCarrierShutdown,availableBossAssault,MIRV_RECHARGE,HOMING_RECHARGE,PRIMARY_FIRE_TIME,PRIMARY_RELOAD,clamp,clearPlayerWeaponQueue} from './engine.js';
import {createInkScene as createGame,updateInkScene as update} from './ink-scene.js';
import {createRenderer,loadArt} from './ink-renderer.js';
import {createInput,bindButton,bindDirectionalPad,KEY_ACTIONS} from './input.js';
import {createAudio} from './audio.js';
import {createSpeechCaptions} from './speech-captions.js';
import {createVictoryFilm} from './victory-film.js';
const $=id=>document.getElementById(id),app=$('app'),renderer=createRenderer($('game')),input=createInput(),weaponInput=createInput(),captions=createSpeechCaptions($('speech-caption')),audio=createAudio({onSpeech:line=>line?captions.show(line.id,line.duration):captions.clear()});
// A dock replacement can discard every weapon source and buffered tap while
// leaving the independently held movement sources untouched.
setupHomeShortcut();
let selectedLevel=1;
let game=createGame({level:selectedLevel}),view='title',lastFrame=0,accumulator=0,uiAt=0,resultAt=0,best=0,artReady=false,duelPhase=null,breachPhase=null,carrierActive=false,introActive=false;
game.status='title';
try{best=Number(localStorage.getItem('feral-steel-best'))||0;audio.setEnabled(localStorage.getItem('feral-steel-sound')!=='off');}catch{}
const victoryFilm=createVictoryFilm({overlay:$('victory-film'),video:$('victory-film-video'),playButton:$('victory-film-play'),pauseButton:$('victory-film-pause'),skipButton:$('victory-film-skip'),soundButton:$('victory-film-sound'),soundEnabled:()=>audio.enabled,onToggleSound:toggleSound,onOpen:()=>{clearInput();audio.setPlaying(false);captions.clear();},onComplete:showResult});
const inIntro=()=>game.introElapsed<game.introDuration;
const canDrive=()=>view==='playing'&&!game.duel&&!game.bossBreach&&!game.carrierShutdown&&!inIntro();
const weaponActions=new Set(['fire','missile','homing']),heldWeaponKeys=new Set();
let actionDock={mode:'weapons',kind:null,active:false,enabled:false};
function readActionDock(){
  const playing=view==='playing'&&!inIntro();
  if(game.duel)return {mode:'duel',kind:'duel',active:true,enabled:playing&&game.duel.phase==='qte'};
  if(game.bossBreach)return {mode:'boss',kind:game.bossBreach.kind,active:true,enabled:playing&&game.bossBreach.phase==='qte'};
  if(game.carrierShutdown)return {mode:'carrier',kind:'carrier',active:true,enabled:false};
  if(playing){
    if(availableCarrierShutdown(game))return {mode:'carrier',kind:'carrier',active:false,enabled:true};
    const kind=availableBossAssault(game);
    if(kind)return {mode:'boss',kind,active:false,enabled:true};
  }
  return {mode:'weapons',kind:null,active:false,enabled:false};
}
const canFire=()=>canDrive()&&readActionDock().mode==='weapons';
const canAssault=()=>{const dock=readActionDock();return ['boss','carrier'].includes(dock.mode)&&dock.enabled;};
const weaponBindings=[...document.querySelectorAll('.action-controls [data-action]')].map(button=>bindButton(button,weaponInput,canFire,()=>audio.unlock()));
const bindings=[bindDirectionalPad($('directional-pad'),input,canDrive,()=>audio.unlock()),...[...document.querySelectorAll('#shift-button,#drop-button')].map(button=>bindButton(button,input,canDrive,()=>audio.unlock())),...weaponBindings,bindButton($('qte-button'),input,()=>view==='playing'&&game.duel?.phase==='qte',()=>audio.unlock()),bindButton($('boss-action-button'),input,canAssault,()=>audio.unlock())];
function clearWeaponInput(){weaponBindings.forEach(binding=>binding.clear());weaponInput.clear();clearPlayerWeaponQueue(game.player);}
function syncActionDock(){
  const next=readActionDock();
  if(next.mode!=='weapons'&&(actionDock.mode!==next.mode||actionDock.kind!==next.kind))clearWeaponInput();
  actionDock=next;
  $('action-dock').dataset.mode=next.mode;
  document.querySelector('.action-controls').hidden=next.mode!=='weapons';
  $('duel-ui').hidden=next.mode!=='duel';$('qte-controls').hidden=next.mode!=='duel';
  $('qte-button').disabled=next.mode!=='duel'||!next.enabled;
  $('boss-action-button').hidden=!['boss','carrier'].includes(next.mode);
  $('boss-action-button').disabled=!['boss','carrier'].includes(next.mode)||!next.enabled;
  app.classList.toggle('action-scene',next.active);
}
function consumeInput(){
  syncActionDock();
  const movement=input.consume(),weapons=weaponInput.consume();
  return {...movement,fire:weapons.fire,fireHeld:weapons.fireHeld,missile:weapons.missile,missileHeld:weapons.missileHeld,missileReleased:weapons.missileReleased,missileCancelled:weapons.missileCancelled,homing:weapons.homing};
}
input.subscribe(actions=>{if(!actions.shift){endEvasion(game.player.evasion);game.player.shiftHeld=false;}});
const introKeys=new Set();
const number=n=>Math.floor(n).toString().padStart(6,'0');
function clearInput(){bindings.forEach(binding=>binding.clear());input.clear();clearWeaponInput();game.player.shiftHeld=false;endEvasion(game.player.evasion);if(game.duel)game.duel.qteHeld=false;document.querySelectorAll('[data-action],[data-pad-actions]').forEach(button=>{button.classList.remove('pressed');button.setAttribute('aria-pressed','false');});}
function syncDuelPhase(){
  const next=game.duel?.phase??null;if(next===duelPhase)return;
  clearInput();duelPhase=next;app.classList.toggle('in-duel',!!game.duel);syncActionDock();
  if(next==='qte')$('qte-button').focus({preventScroll:true});
  else $('qte-button').blur();
}
function syncBreachPhase(){
  const next=game.bossBreach?`${game.bossBreach.kind}:${game.bossBreach.phase}`:null;if(next===breachPhase)return;
  clearInput();breachPhase=next;app.classList.toggle('in-breach',!!game.bossBreach);
}
function syncCarrierState(){const next=!!game.carrierShutdown;if(next===carrierActive)return;clearInput();carrierActive=next;app.classList.toggle('in-carrier',next);}
function syncIntroState(){
  const next=inIntro();if(next!==introActive){clearInput();introActive=next;}
  app.dataset.cinematic=view==='won'?'victory':next?'intro':'';
}
function setView(next){view=next;audio.setPlaying(next==='playing');app.className=`state-${view}${game.duel?' in-duel':''}${game.bossBreach?' in-breach':''}${game.carrierShutdown?' in-carrier':''}`;$('title-screen').hidden=view!=='title';$('hud').hidden=view==='title';$('controls').hidden=view!=='playing';$('pause').hidden=!['playing','paused'].includes(view);$('pause-screen').hidden=view!=='paused';$('result-screen').hidden=!['dead','won'].includes(view)||!resultAt;syncIntroState();syncActionDock();}
function soundUI(){$('sound').classList.toggle('muted',!audio.enabled);$('sound').setAttribute('aria-pressed',String(!audio.enabled));$('sound').setAttribute('aria-label',audio.enabled?'Couper le son':'Activer le son');victoryFilm.syncSound();}
function toggleSound(){audio.setEnabled(!audio.enabled);if(audio.enabled)audio.unlock();soundUI();try{localStorage.setItem('feral-steel-sound',audio.enabled?'on':'off');}catch{}}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;setTimeout(()=>{$('toast').hidden=true;},4000);}
function start(){if(!artReady)return;victoryFilm.cancel();audio.setPlaying(true,{restart:true});audio.unlock();audio.play({type:'start'});clearInput();game=createGame({intro:true,level:selectedLevel});duelPhase=null;breachPhase=null;introActive=false;renderer.reset();lastFrame=performance.now();accumulator=0;resultAt=0;$('boss-hud').hidden=true;$('result-screen').hidden=true;setView('playing');$('start').blur();$('replay').blur();$('restart-pause').blur();updateUI();}
function pause(){if(view!=='playing')return;clearInput();game.status='paused';setView('paused');$('resume').focus({preventScroll:true});}
function resume(){if(view!=='paused'||matchMedia('(orientation: portrait)').matches)return;clearInput();audio.unlock();game.status='playing';setView('playing');lastFrame=performance.now();accumulator=0;$('resume').blur();}
function home(){victoryFilm.cancel();clearInput();game=createGame({level:selectedLevel});game.status='title';duelPhase=null;breachPhase=null;renderer.reset();resultAt=0;setView('title');$('boss-hud').hidden=true;$('start').focus({preventScroll:true});}
function syncLevelMenu(){
 for(const button of document.querySelectorAll('[data-level]'))button.setAttribute('aria-pressed',String(Number(button.dataset.level)===selectedLevel));
 app.dataset.level=String(selectedLevel);
 const lunar=selectedLevel===2;
 document.querySelector('.title-content .eyebrow').lastChild.textContent=lunar?' MISSION 02 · LES ARCHIVES LUNAIRES':' MISSION V2 · MATIN DORÉ';
 document.querySelector('.title-content .tagline').innerHTML=lunar?'QUATRE PATTES. TROIS ARMES.<br>DES TEMPLES AU-DESSUS DES NUAGES.':'QUATRE PATTES. TROIS ARMES.<br>UNE JUNGLE AUX COULEURS DOUCES.';
 document.querySelector('#title em').textContent=lunar?'ARCHIVES LUNAIRES':'MATIN DORÉ';
 document.querySelector('.title-content .intro').innerHTML=lunar?'Des îles gravées au-dessus des nuages.<br>Traversez les ruines. Ouvrez le portail.':'Sous la lumière dorée, la jungle s’éveille.<br>Traversez la forêt jusqu’au Colosse.';
 $('next-level').hidden=!(view==='won'&&selectedLevel===1&&resultAt);
}
function chooseLevel(level){if(view!=='title')return;selectedLevel=level===2?2:1;game=createGame({level:selectedLevel});game.status='title';renderer.reset();syncLevelMenu();}
function nextLevel(){if(view!=='won'||selectedLevel!==1)return;selectedLevel=2;start();}
function showResult(){if(!resultAt||!['dead','won'].includes(view))return;$('result-screen').hidden=false;syncLevelMenu();if(!document.hidden)$('replay').focus({preventScroll:true});}
function finish(){clearInput();view=game.status;setView(view);resultAt=performance.now()+(view==='won'?4500:1500);if(selectedLevel===1)victoryFilm.arm(view,resultAt);else victoryFilm.cancel();const won=view==='won';if(won)audio.play({type:'won'});best=Math.max(best,game.stats.score);try{localStorage.setItem('feral-steel-best',String(best));}catch{}$('result-eyebrow').textContent=won?'V2 MATIN DORÉ / MISSION ACCOMPLIE':'SIGNAL PERDU / SALTIK HORS SERVICE';$('result-title').innerHTML=won?'MISSION<br><em>ACCOMPLIE.</em>':'BLINDAGE<br><em>CRITIQUE.</em>';$('result-copy').textContent=won?'Le Colosse est vaincu. Le canyon retrouve son calme.':'Le canyon résiste. Votre prochaine sortie fera la différence.';$('result-score').textContent=number(game.stats.score);$('result-kills').textContent=game.stats.kills;$('result-best').textContent=number(best);if(selectedLevel===2){$('result-eyebrow').textContent=won?'ARCHIVES LUNAIRES / PORTAIL OUVERT':'ARCHIVES LUNAIRES / SIGNAL PERDU';$('result-copy').textContent=won?'Les trois vagues sont repoussées. La Porte des Archives est ouverte.':'Les gardiens tiennent encore les ruines. Redéployez Striker pour une nouvelle tentative.';}syncLevelMenu();$('result-screen').hidden=true;}
function recharge(buttonId,textId,barId,remaining,total,ready,label){
  const waiting=remaining>0,button=$(buttonId);
  $(textId).textContent=waiting?`${remaining.toFixed(1)}s`:ready;
  $(barId).style.width=`${clamp(1-remaining/total,0,1)*100}%`;
  button.classList.toggle('recharging',waiting);
  button.setAttribute('aria-label',waiting?`${label}, recharge ${remaining.toFixed(1)} secondes`:label);
}
function updateUI(){
  const mission=$('mission-status');mission.hidden=selectedLevel!==2||view==='title';if(!mission.hidden){const l=game.lunar;mission.textContent=l?.phase==='defense'?`PORTE DES ARCHIVES · VAGUE ${l.wave??1}/3`:'NIVEAU 2 · LES ARCHIVES LUNAIRES';}
  const p=game.player,hpRatio=clamp(p.hp/(p.maxHp||100),0,1),shifting=p.evasion.active;
  syncActionDock();
  const bounds=$('game').getBoundingClientRect();
  const viewport={camera:renderer.camera,cameraY:renderer.cameraY,width:renderer.width,height:renderer.height};
  $('directional-pad').classList.toggle('over-player',view==='playing'&&padCoversPlayer($('directional-pad').getBoundingClientRect(),inkSaltikGeometry(p,{time:game.time}).bounds,viewport,bounds));
  const breach=game.bossBreach,assault=$('boss-action-button'),carrier=actionDock.mode==='carrier',gripping=breach?.phase==='qte';
  assault.classList.toggle('is-qte',gripping);assault.classList.toggle('is-carrier',carrier);
  for(const [i,mark] of [...assault.querySelectorAll('.qte-marks i')].entries())mark.classList.toggle('complete',i<(breach?.taps??0));
  const hullAction=actionDock.kind==='hull';
  assault.classList.toggle('is-hull',hullAction);
  $('boss-action-name').textContent=carrier?'DÉBRANCHER':hullAction?'ARRACHER':'POD';
  const actionName=hullAction?'Arracher le blindage':'Arracher le lance-roquettes';
  assault.setAttribute('aria-label',carrier?'Débrancher le porte-drones sans le détruire, B':gripping?`${actionName}, ${breach.taps} appuis sur trois, B`:`Sauter sur le tank pour ${actionName.toLowerCase()}, B`);
  $('hp-value').textContent=Math.ceil(p.hp);$('hp-bar').style.width=`${hpRatio*100}%`;document.querySelector('.armor').classList.toggle('low',hpRatio<.3);
  recharge('missile-button','mirv-cooldown','mirv-reload',p.mirvIn||0,MIRV_RECHARGE,'PRÊT','MIRV à sous-munitions, K');
  recharge('homing-button','homing-cooldown','homing-reload',p.homingIn||0,HOMING_RECHARGE,'PRÊTS','Missiles guidés sur les ennemis, L ou R');
  $('shift-button').classList.toggle('active',shifting);$('shift-button').setAttribute('aria-pressed',String(shifting||input.actions.shift));
  $('shift-button').setAttribute('aria-label',shifting?'Arrière-plan, relâcher pour revenir':'Esquive en arrière-plan, maintenir F ou Majuscule, deux secondes maximum');
  const reloading=p.reloadIn>0;
  $('fire-cooldown').textContent=reloading?`RECH. ${p.reloadIn.toFixed(1)}s`:`${p.fireSpent.toFixed(1)} / ${PRIMARY_FIRE_TIME} s`;
  $('fire-progress').style.width=`${clamp(reloading?1-p.reloadIn/PRIMARY_RELOAD:p.fireSpent/PRIMARY_FIRE_TIME,0,1)*100}%`;
  $('fire-button').classList.toggle('recharging',reloading);
  $('fire-button').setAttribute('aria-label',reloading?`Tir, recharge ${p.reloadIn.toFixed(1)} secondes`:`Tirer, J ou X, ${Math.max(0,PRIMARY_FIRE_TIME-p.fireSpent).toFixed(1)} secondes avant recharge`);
  if(p.mirvAiming)$('mirv-cooldown').textContent='RELÂCHER';
  else if(p.mirvPending)$('mirv-cooldown').textContent='ÉLÉVATION';
  for(const button of document.querySelectorAll('.action-controls [data-action]'))button.classList.toggle('locked',shifting);
  $('boss-hud').hidden=!game.boss||game.boss.hp<=0||view==='title';if(game.boss){$('boss-bar').style.width=`${Math.max(0,game.boss.hp/game.boss.maxHp)*100}%`;$('boss-percent').textContent=`${Math.max(0,Math.ceil(game.boss.hp/game.boss.maxHp*100))}%`;}
  const duel=game.duel;
  for(const [i,mark] of [...$('qte-button').querySelectorAll('.qte-marks i')].entries())mark.classList.toggle('complete',i<(duel?.taps??0));
  $('qte-button').setAttribute('aria-label',`Pousser, ${duel?.taps??0} appuis sur cinq, Espace ou Entrée`);

}
const keys=KEY_ACTIONS;
window.addEventListener('keydown',event=>{
  if(victoryFilm.handleKey(event))return;
  if(event.code==='Escape'||event.code==='KeyP'){event.preventDefault();if(!event.repeat){if(view==='playing')pause();else if(view==='paused')resume();}return;}
  if((event.code==='Enter'||event.code==='Space')&&view==='title'){event.preventDefault();if(!event.repeat){start();introKeys.add(event.code);}return;}
  if(view!=='playing')return;
  if(inIntro()){event.preventDefault();introKeys.add(event.code);return;}
  if(introKeys.has(event.code)){event.preventDefault();return;}
  if(event.code==='KeyB'){
    event.preventDefault();if(!event.repeat&&canAssault()){audio.unlock();input.set('key:KeyB','bossAction',true);}return;
  }
  if(game.bossBreach||game.carrierShutdown)return;
  if(game.duel){
    if(['Space','Enter'].includes(event.code)){event.preventDefault();if(game.duel.phase==='qte'&&!event.repeat){audio.unlock();input.set(`qte-key:${event.code}`,'qte',true);}}return;
  }
  const action=keys[event.code];if(!action)return;event.preventDefault();
  if(weaponActions.has(action)){
    if(event.repeat||heldWeaponKeys.has(event.code))return;
    heldWeaponKeys.add(event.code);if(!canFire())return;
    audio.unlock();weaponInput.set(`key:${event.code}`,action,true);return;
  }
  if(action==='shift'&&event.repeat)return;audio.unlock();input.set(`key:${event.code}`,action,true);
});
window.addEventListener('keyup',event=>{
  introKeys.delete(event.code);heldWeaponKeys.delete(event.code);
  if(['Space','Enter'].includes(event.code))input.set(`qte-key:${event.code}`,'qte',false);
  const action=keys[event.code];if(!action)return;event.preventDefault();(weaponActions.has(action)?weaponInput:input).set(`key:${event.code}`,action,false);
});
window.addEventListener('blur',()=>{introKeys.clear();heldWeaponKeys.clear();clearInput();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();pause();}});
matchMedia('(orientation: portrait)').addEventListener('change',event=>{if(event.matches){clearInput();pause();}});
$('start').addEventListener('click',start);$('resume').addEventListener('click',resume);$('pause').addEventListener('click',()=>view==='paused'?resume():pause());$('replay').addEventListener('click',start);$('restart-pause').addEventListener('click',start);$('return-home').addEventListener('click',home);$('home-link').addEventListener('click',e=>{e.preventDefault();if(view!=='title')home();});
$('next-level').addEventListener('click',nextLevel);for(const button of document.querySelectorAll('[data-level]'))button.addEventListener('click',()=>chooseLevel(Number(button.dataset.level)));
$('sound').addEventListener('click',toggleSound);
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(app.requestFullscreen){await app.requestFullscreen();try{await screen.orientation.lock('landscape');}catch{}}else toast('Le jeu occupe déjà toute la fenêtre.');}catch{toast('Plein écran indisponible. Le jeu reste accessible dans cette fenêtre.');}});
function frame(now){const elapsed=clamp((now-lastFrame)/1000,0,.12);lastFrame=now;if(view==='playing'){game.viewport={x:renderer.camera,y:-renderer.cameraY,w:renderer.width,h:renderer.height??720};accumulator+=elapsed;while(accumulator>=1/60&&game.status==='playing'){update(game,consumeInput(),1/60);syncDuelPhase();syncBreachPhase();syncCarrierState();syncIntroState();syncActionDock();accumulator-=1/60;}if(['won','dead'].includes(game.status))finish();}else accumulator=0;
  for(const event of game.events){renderer.addEvent(event);audio.play(event);}game.events.length=0;
  captions.update(view);renderer.render(game,now,view);game.viewport={x:renderer.camera,y:-renderer.cameraY,w:renderer.width,h:renderer.height};if(now-uiAt>80){updateUI();uiAt=now;}if(resultAt&&now>=resultAt&&$('result-screen').hidden&&!victoryFilm.update(now))showResult();requestAnimationFrame(frame);
}
syncLevelMenu();soundUI();$('start').disabled=true;$('start').querySelector('span').textContent='PRÉPARATION DU SALTIK…';requestAnimationFrame(frame);
loadArt(progress=>{$('start').querySelector('span').textContent=`PRÉPARATION ${Math.round(progress*100)} %`;}).then(()=>{artReady=true;$('start').disabled=false;$('start').querySelector('span').textContent='DÉPLOYER LE SALTIK';}).catch(error=>{$('start').querySelector('span').textContent='CHARGEMENT INTERROMPU';toast('Le Saltik Striker n’a pas pu être chargé. Rechargez la page pour réessayer.');console.error(error);});
// Read-only snapshot for reproducible browser verification; no control shortcuts.
export function getSnapshot(){return {level:selectedLevel,levelTitle:game.levelTitle??'Matin Doré',lunar:game.lunar?structuredClone(game.lunar):null,status:game.status,view,victoryFilm:victoryFilm.snapshot,actionDock:{...actionDock},player:structuredClone(game.player),stats:{...game.stats},progress:game.progress,time:game.time,introDuration:game.introDuration,introElapsed:game.introElapsed,duel:game.duel?structuredClone(game.duel):null,carrierShutdown:game.carrierShutdown?structuredClone(game.carrierShutdown):null,availableCarrierId:availableCarrierShutdown(game)?.id??null,bossBreach:game.bossBreach?structuredClone(game.bossBreach):null,bossBreachUsed:!!game.bossBreachUsed,bossPodUsed:!!game.bossPodUsed,bossPodLandedAt:game.bossPodLandedAt,bossAssaultAvailable:availableBossAssault(game),speech:audio.speechSnapshot,boss:game.boss?{...structuredClone(game.boss),geometry:bossGeometry(game.boss)}:null,enemyCount:game.enemies.length,enemies:game.enemies.map(({id,type,x,y,hp,maxHp,platformId,tier,dir,vx,phase,firePose,attackPhase,lockProgress,podRaise,podLaunch,guard,guardFlash,guardResponse,bays,disabled,neutralized,guardianId,protectsCarrierId,carrierId,carrierState,harmless,role,deployBay,deployFlash,scale,backDestroyed,legDestroyed,immobilized,knockedOut,koElapsed,shutdownSettled,shuttingDown,serviceAccessSide,duelFinished,reloadIn,reloadDuration,damageStage,droneSlots,dockElapsed,dockDuration,undockElapsed,undockDuration,bayIndex,slot})=>({id,type,x,y,hp,maxHp,platformId,tier,dir,vx,phase,firePose,attackPhase,lockProgress,podRaise,podLaunch,guard,guardFlash,guardResponse,bays,disabled,neutralized,guardianId,protectsCarrierId,carrierId,carrierState,harmless,role,deployBay,deployFlash,scale,backDestroyed,legDestroyed,immobilized,knockedOut,koElapsed,shutdownSettled,shuttingDown,serviceAccessSide,duelFinished,reloadIn,reloadDuration,damageStage,droneSlots,dockElapsed,dockDuration,undockElapsed,undockDuration,bayIndex,slot})),obstacles:game.obstacles.map(({id,type,x,y,w,h,hp,tier,platformId})=>({id,type,x,y,w,h,hp,tier,platformId})),inputs:{...input.actions,fire:weaponInput.actions.fire,missile:weaponInput.actions.missile,homing:weaponInput.actions.homing},projectiles:game.projectiles.map(({id,x,y,vx,vy,team,kind,targetId,hp,locking,age,life,radius,damage,launchX,launchY,salvoIndex,guidance})=>({id,x,y,vx,vy,team,kind,targetId,hp,locking,age,life,radius,damage,launchX,launchY,salvoIndex,guidance:guidance?{avoiding:!!guidance.avoiding}:undefined})),cameraZoom:renderer.cameraZoom,presentationAge:renderer.presentationAge,camera:renderer.camera,cameraY:renderer.cameraY,worldWidth:renderer.width,viewport:{...game.viewport}};}
