import {drawWalkingActor,walkFoot,walkSpeed} from './walk-cycle.js';
// Isolated presentation experiment. No game source, physics or actor state changes.
import {drawInkSaltik,inkSaltikGeometry} from '../src/ink-saltik.js';
import {createInkScene} from '../src/ink-scene.js';
import {opaqueGatlingCell} from '../src/gatling-registration.js';
import {bakePastelArt} from '../src/pastel-paint.js';
const canvas=document.getElementById('stage'),c=canvas.getContext('2d'),art={};
const assets={striker:'../assets/modern-striker-atlas.png',gatling:'../assets/modern-gatling-atlas.png',bt:'../assets/ink-enemy-saltik.png',btPaint:'../assets/ink-enemy-saltik-paint.png'};
let character='striker',amplitude=1.8,paused=false,speed=1,time=0,last=0,ready=false;
const players=Object.fromEntries(['striker','gatling','bt'].map(k=>[k,createInkScene({character:k,level:1}).player]));
const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error(src));image.src=new URL(src,import.meta.url).href;});
function state(t){
 return{...players[character],x:0,y:0,dir:1,vx:walkSpeed(amplitude),vy:0,hp:100,onGround:true,supportY:0,supportPose:null,turn:null,motionDistance:t*walkSpeed(amplitude),motionHeave:0,motionLean:0};
}

function ground(x,w,t){c.save();c.beginPath();c.rect(x,115,w,330);c.clip();c.fillStyle='#e0cfaa';c.fillRect(x,368,w,76);c.fillStyle='#a58b60';c.fillRect(x,367,w,3);const scroll=t*walkSpeed(amplitude)*2;for(let i=-1;i<14;i++){const xx=x+(i*42-scroll%42);c.strokeStyle='#b79d73';c.lineWidth=1.4;c.beginPath();c.moveTo(xx,373);c.lineTo(xx+9,390);c.lineTo(xx+39,387);c.stroke();}c.restore();}
function label(text,x,y,size,color='#263c2f'){c.fillStyle=color;c.font=`${size}px Ink, sans-serif`;c.textAlign='center';c.fillText(text,x,y);}
export function renderDemo(t=time){
 c.clearRect(0,0,960,470);c.fillStyle='#efe2c4';c.fillRect(0,0,960,470);c.fillStyle='#e5d5b1';c.fillRect(480,0,480,470);c.strokeStyle='#9b8664';c.lineWidth=1;c.beginPath();c.moveTo(480,25);c.lineTo(480,440);c.stroke();
 label('ACTUEL',240,46,30);label('CYCLE DE MARCHE',720,46,30);label('Roues en mouvement · pattes fixes',240,76,19,'#59664b');label('Avance · appui · retour de la patte',720,76,19,'#59664b');
 for(let i=0;i<2;i++){ground(i*480,480,t);c.save();c.translate(240+i*480,368);c.scale(2,2);if(i)drawWalkingActor(c,art[character],character,t,amplitude);else drawInkSaltik(c,art[character],state(t),{time:t});c.restore();}
 label(character==='striker'?'STRIKER':character==='gatling'?'GATLING':'BT',480,451,22);
}
function frame(now){if(last&&!paused)time+=Math.min(.05,(now-last)/1000)*speed;last=now;if(ready)renderDemo();requestAnimationFrame(frame);}
document.querySelectorAll('[data-character]').forEach(button=>button.addEventListener('click',()=>{character=button.dataset.character;document.querySelectorAll('[data-character]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));if(ready)renderDemo();}));
function setAmplitude(value){amplitude=Number(value);document.getElementById('amplitude').value=String(amplitude);document.getElementById('amount').textContent=amplitude.toFixed(1).replace('.',',');if(ready)renderDemo();}
document.getElementById('amplitude').addEventListener('input',e=>setAmplitude(e.target.value));document.querySelectorAll('[data-amplitude]').forEach(b=>b.addEventListener('click',()=>setAmplitude(b.dataset.amplitude)));
document.getElementById('pause').addEventListener('click',()=>{paused=!paused;document.getElementById('pause').textContent=paused?'Reprendre':'Pause';});
document.getElementById('slow').addEventListener('click',()=>{speed=speed===1?.5:1;document.getElementById('slow').textContent=speed===1?'Ralenti ×0,5':'Vitesse normale';});
window.saltikWalkDemo={render:renderDemo,seek(t){time=Math.max(0,t);renderDemo(time);},foot:walkFoot,get snapshot(){return{character,amplitude,paused,time,ready,speed};}};
window.demoReady=(async()=>{
 await document.fonts.load('30px Ink');const entries=await Promise.all(Object.entries(assets).map(async([k,src])=>[k,await load(src)])),images=Object.fromEntries(entries);
 art.striker=document.createElement('canvas');art.striker.width=art.striker.height=724;art.striker.getContext('2d').drawImage(images.striker,0,0,724,724,0,0,724,724);art.gatling=opaqueGatlingCell(images.gatling,0,0,627).canvas;art.bt=bakePastelArt(images.bt,images.btPaint,{strength:1,outline:2});ready=true;document.getElementById('status').textContent='Démo prête · le jeu en ligne conserve ses mouvements actuels.';requestAnimationFrame(frame);
})().catch(error=>{document.getElementById('status').textContent='La démo n’a pas pu charger ses images.';throw error;});
