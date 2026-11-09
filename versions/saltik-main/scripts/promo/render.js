import {createInkScene,updateInkScene} from '/src/ink-scene.js';
import {createRenderer,loadArt} from '/src/ink-renderer.js';
import {availableBossAssault,availableCarrierShutdown} from '/src/engine.js';
const gameCanvas=document.querySelector('#game'),film=document.querySelector('#film'),c=film.getContext('2d',{alpha:false});
const renderer=createRenderer(gameCanvas);let game=createInkScene({intro:true});
const clips=[
 {start:.2,duration:2.2,label:'opening'},
 {start:8.5,duration:3,label:'firefight'},
 {start:19.1,duration:2.1,label:'saltik-duel'},
 {start:40,duration:2,label:'drone-carrier'},
 {start:48.2,duration:1.6,label:'guided-missiles'},
 {start:84.5,duration:1.8,label:'boss'},
 {start:88,duration:1.6,label:'tank-counterattack'},
 {start:104,duration:1.5,label:'boss-firefight'},
 {start:83.4,duration:1.2,label:'final-boss-leap'},
];
let simulationFrame=0,currentClip=0,clipFrame=0,outputFrame=0;
const events=[],trace=[];
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
function inputFor(f){
 const b=game.boss;
 return game.duel?{qte:game.duel.phase==='qte'&&f%8===0}:
  game.bossBreach?{bossAction:game.bossBreach.phase==='qte'&&f%20===0}:
  game.carrierShutdown?{}:
  {right:true,fire:true,fireHeld:true,missile:f%100===0,missileHeld:f%100<35,missileReleased:f%100===35,homing:f%70===0,
   bossAction:!!availableCarrierShutdown(game)||!!availableBossAssault(game),shift:!!b&&['telegraph','charge'].includes(b.chargePhase)};
}
function step(){
 game.viewport={x:renderer.camera,y:-renderer.cameraY,w:renderer.width,h:renderer.height};
 const f=simulationFrame++;
 updateInkScene(game,inputFor(f),1/60);
 for(const event of game.events){renderer.addEvent(event);if(currentClip<clips.length&&simulationFrame/60>=clips[currentClip].start)events.push({at:outputFrame/30,type:event.type});}
 game.events.length=0;
 if(simulationFrame%2===0)renderer.render(game,simulationFrame*1000/60,'playing');
}
function baseFrame(){
 // Use the native responsive 64:27 viewport, so scope bars never crop feet,
 // weapons or gameplay. The full gameplay surface fits between the bars.
 c.drawImage(gameCanvas,0,135,1920,810);
 const v=c.createRadialGradient(960,510,400,960,540,1150);v.addColorStop(0,'#02080600');v.addColorStop(1,'#02080688');c.fillStyle=v;c.fillRect(0,0,1920,1080);
 c.fillStyle='#030a07';c.fillRect(0,0,1920,135);c.fillRect(0,945,1920,135);
 c.font='15px Arial';c.letterSpacing='4px';c.fillStyle='#e6dcb6';c.fillText('SALTIK · GAMEPLAY',56,84);
}
function card(text,time){
 const alpha=smooth(time/.18)*smooth((2.1-time)/.25);if(alpha<=0)return;
 c.save();c.globalAlpha=alpha;c.font='91px Ink';c.letterSpacing='1px';c.fillStyle='#f0dfba';c.strokeStyle='#04110c';c.lineWidth=7;c.lineJoin='round';
 c.strokeText(text,75,896);c.fillText(text,75,896);c.restore();
}
function title(t){
 c.fillStyle='#05100c';c.fillRect(0,0,1920,1080);
 const reveal=smooth(t/.24),z=1.08-.08*reveal;c.save();c.translate(960,500);c.scale(z,z);c.textAlign='center';
 c.fillStyle='#f1dfb5';c.font='590px Ink';c.fillText('SALTIK',0,125);
 c.fillStyle='#eaa148';c.font='108px Ink';c.fillText('by limule & régalec',0,292);c.restore();
 c.fillStyle='#81c8bd';c.fillRect(125,867,1670,2);
 c.textAlign='center';c.fillStyle='#eee1c5';c.font='bold 28px Arial';c.letterSpacing='7px';c.fillText('PLAY ON YOUR SMARTPHONE',960,945);c.textAlign='start';
}
window.promoReady=(async()=>{await loadArt();await document.fonts.load('91px Ink');await document.fonts.load('590px Ink');renderer.reset();})();
window.nextPromoFrame=()=>{
 const t=outputFrame/30;
 if(t>=17){title(t-17);outputFrame++;return film.toDataURL('image/jpeg',.95).split(',')[1];}
 const clip=clips[currentClip],target=Math.round(clip.start*60)+clipFrame*2;
 if(target<simulationFrame){game=createInkScene({intro:true});simulationFrame=0;renderer.reset();}
 // Unused source time is rendered smaller at exactly the same aspect ratio;
 // world projection and camera updates stay identical. Selected frames use HD.
 if(target-simulationFrame>6){gameCanvas.width=640;gameCanvas.height=270;while(simulationFrame<target-4)step();}
 if(gameCanvas.width!==1920){gameCanvas.width=1920;gameCanvas.height=810;}
 while(simulationFrame<target)step();
 renderer.render(game,simulationFrame*1000/60,'playing');
 if(clipFrame===0)trace.push({edit:t,source:simulationFrame/60,label:clip.label,playerX:game.player.x,hp:game.player.hp,duel:game.duel?.phase??null,breach:game.bossBreach?.phase??null,bossHP:game.boss?.hp??null,actors:game.enemies.filter(e=>e.hp>0).map(e=>e.type)});
 baseFrame();
 if(t<2.2)card('SMALL MACHINE.',t);
 if(t>=2.2&&t<4.3)card('BIG TROUBLE.',t-2.2);
 if(t>=10.9&&t<12.7)card('BREAK FREE.',t-10.9);
 const age=clipFrame/30;
 const dip=outputFrame===0?1:age<.09&&[0,3,5].includes(currentClip)?(1-smooth(age/.09))*.8:0;
 if(dip){c.fillStyle=`rgba(3,9,6,${dip})`;c.fillRect(0,0,1920,1080);}
 clipFrame++;outputFrame++;
 if(clipFrame>=Math.round(clip.duration*30)){currentClip++;clipFrame=0;}
 return film.toDataURL('image/jpeg',.95).split(',')[1];
};
window.promoEvidence=()=>({clips,trace,events,simulationFrames:simulationFrame,source:'unmodified createInkScene/updateInkScene and createRenderer',status:game.status,hp:game.player.hp});
window.beginPickup=()=>{currentClip=8;clipFrame=0;outputFrame=474;};
