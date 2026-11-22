import {drawRollingActor,hybridRigPose,terrainHeight,rollingSpeed} from './rolling-suspension.js';
import {drawWalkingActor,walkFoot,walkSpeed} from './walk-cycle.js';
// Isolated presentation experiment. No game source, physics or actor state changes.
import {opaqueGatlingCell} from '../src/gatling-registration.js';
import {bakePastelArt} from '../src/pastel-paint.js';
const canvas=document.getElementById('stage'),c=canvas.getContext('2d'),art={};
const assets={striker:'../assets/modern-striker-atlas.png',gatling:'../assets/modern-gatling-atlas.png',bt:'../assets/ink-enemy-saltik.png',btPaint:'../assets/ink-enemy-saltik-paint.png'};
let character='striker',amplitude=1.8,paused=false,speed=1,time=0,last=0,ready=false;
const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error(src));image.src=new URL(src,import.meta.url).href;});
function ground(panel,t,uneven){
 const start=panel*480,center=start+240,height=x=>uneven?terrainHeight((x-center)/2+t*rollingSpeed,amplitude):0;
 c.save();c.beginPath();c.rect(start,100,480,345);c.clip();c.beginPath();c.moveTo(start,445);
 for(let x=start;x<=start+480;x+=3)c.lineTo(x,368+height(x)*2);
 c.lineTo(start+480,445);c.closePath();c.fillStyle='#cfb78b';c.fill();
 c.beginPath();for(let x=start;x<=start+480;x+=3){const y=368+height(x)*2;if(x===start)c.moveTo(x,y);else c.lineTo(x,y);}c.strokeStyle='#6f664c';c.lineWidth=3;c.stroke();
 const scroll=t*rollingSpeed*2;for(let i=-1;i<15;i++){const x=start+i*39-scroll%39,y=368+height(x)*2;c.strokeStyle='#a38e68';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y+7);c.lineTo(x+9,y+19);c.lineTo(x+32,368+height(x+32)*2+12);c.stroke();}c.restore();
}

function label(text,x,y,size,color='#263c2f'){c.fillStyle=color;c.font=`${size}px Ink, sans-serif`;c.textAlign='center';c.fillText(text,x,y);}
export function renderDemo(t=time){
 c.clearRect(0,0,960,470);c.fillStyle='#efe2c4';c.fillRect(0,0,960,470);c.fillStyle='#e5d5b1';c.fillRect(480,0,480,470);c.strokeStyle='#9b8664';c.lineWidth=1;c.beginPath();c.moveTo(480,25);c.lineTo(480,440);c.stroke();
 label('MARCHE',240,46,30);label('ROULEMENT AMORTI',720,46,30);label('Essai précédent · cycle de pas',240,76,19,'#59664b');label('Roues au sol · jambes qui absorbent',720,76,19,'#59664b');
 for(let i=0;i<2;i++){ground(i,t,i===1);c.save();c.translate(240+i*480,368);c.scale(2,2);if(i)drawRollingActor(c,art[character],character,t,amplitude);else drawWalkingActor(c,art[character],character,t,1.8);c.restore();}
 label(character==='striker'?'STRIKER':character==='gatling'?'GATLING':'BT',480,451,22);
}
function frame(now){if(last&&!paused)time+=Math.min(.05,(now-last)/1000)*speed;last=now;if(ready)renderDemo();requestAnimationFrame(frame);}
document.querySelectorAll('[data-character]').forEach(button=>button.addEventListener('click',()=>{character=button.dataset.character;document.querySelectorAll('[data-character]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));if(ready)renderDemo();}));
function setAmplitude(value){amplitude=Number(value);document.getElementById('amplitude').value=String(amplitude);document.getElementById('amount').textContent=amplitude.toFixed(1).replace('.',',');if(ready)renderDemo();}
document.getElementById('amplitude').addEventListener('input',e=>setAmplitude(e.target.value));document.querySelectorAll('[data-amplitude]').forEach(b=>b.addEventListener('click',()=>setAmplitude(b.dataset.amplitude)));
document.getElementById('pause').addEventListener('click',()=>{paused=!paused;document.getElementById('pause').textContent=paused?'Reprendre':'Pause';});
document.getElementById('slow').addEventListener('click',()=>{speed=speed===1?.5:1;document.getElementById('slow').textContent=speed===1?'Ralenti ×0,5':'Vitesse normale';});
window.saltikWalkDemo={render:renderDemo,seek(t){time=Math.max(0,t);renderDemo(time);},foot:walkFoot,suspension(t=time){return hybridRigPose(character,t,amplitude);},get snapshot(){return{character,amplitude,paused,time,ready,speed};}};
window.demoReady=(async()=>{
 await document.fonts.load('30px Ink');const entries=await Promise.all(Object.entries(assets).map(async([k,src])=>[k,await load(src)])),images=Object.fromEntries(entries);
 art.striker=document.createElement('canvas');art.striker.width=art.striker.height=724;art.striker.getContext('2d').drawImage(images.striker,0,0,724,724,0,0,724,724);art.gatling=opaqueGatlingCell(images.gatling,0,0,627).canvas;art.bt=bakePastelArt(images.bt,images.btPaint,{strength:1,outline:2});ready=true;document.getElementById('status').textContent='Démo prête · le jeu en ligne conserve ses mouvements actuels.';requestAnimationFrame(frame);
})().catch(error=>{document.getElementById('status').textContent='La démo n’a pas pu charger ses images.';throw error;});
