import {createInkScene} from '/src/ink-scene.js';
import {createRenderer,loadArt} from '/src/ink-renderer.js';
import {drawInkSaltik} from '/src/ink-saltik.js';
import {drawInkCarrier} from '/src/ink-carrier.js';
import {drawInkEnemy} from '/src/ink-actors.js';
import {bakePastelArt} from '/src/pastel-paint.js';
import {loadProposal,drawProposal,HEIGHT} from './proposal.js';
const native=document.querySelector('#native'),out=document.querySelector('#output'),c=out.getContext('2d'),r=createRenderer(native),g=createInkScene(),images={};
const load=n=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src='/assets/'+n+'.png';});
function heading(title,copy){c.fillStyle='#0b1811';c.fillRect(0,0,1920,118);c.fillStyle='#efdfba';c.font='48px Ink';c.fillText(title,44,59);c.font='19px Arial';c.fillStyle='#bdcbbb';c.fillText(copy,46,96);}
function stage(){c.drawImage(images.canyon,0,0,1920,1080);const d=c.createLinearGradient(0,580,0,1080);d.addColorStop(0,'#172d1900');d.addColorStop(.9,'#163220c9');c.fillStyle=d;c.fillRect(0,580,1920,500);c.fillStyle='#746d52';c.fillRect(0,959,1920,4);}
function shadow(x,y,w){c.fillStyle='#101a1680';c.beginPath();c.ellipse(x,y,w,13,0,0,7);c.fill();}
function old(x,y,s){globalThis.carrierPreviewMode='old';shadow(x,y,100*s);drawInkCarrier(c,images.carrier,{x,y,hp:100,dir:-1,vx:0},{time:0,scale:s,handsImage:images.striker});}
function fresh(x,y,s){shadow(x,y,95*s);return drawProposal(c,{x,y,dir:1},{scale:s});}
window.show=mode=>{
 c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,1920,1080);
 if(mode==='before'||mode==='after'){
  globalThis.carrierPreviewMode=mode==='after'?'new':'old';
  // Real Matin Doré renderer and encounter location, frozen for visual approval.
  for(let i=0;i<150;i++){g.time=i/60;r.render(g,i*1000/60,'playing');}
  c.drawImage(native,0,0);heading(mode==='after'?'PROPOSITION — DANS LE DÉCOR DU JEU':'MODÈLE ACTUEL — MÊME ÉCHELLE',mode==='after'?'Placement visuel provisoire · mécanique et animations à recaler après validation.':'Référence actuelle de Matin Doré.');
  return;
 }
 stage();
 if(mode==='compare'){
  old(510,960,4.7);fresh(1440,960,4.7);
  c.fillStyle='#eddfb8';c.font='39px Ink';c.fillText('ACTUEL',400,1070);c.fillText('PROPOSITION',1300,1070);
  c.strokeStyle='#e8dbb455';c.lineWidth=2;c.beginPath();c.moveTo(960,150);c.lineTo(960,1000);c.stroke();
  heading('DR-01 — COMPARAISON VISUELLE','Échelle proposée : largeur proche de l’actuel, silhouette environ 11 % plus haute grâce aux plateformes.');
 }else{
  const geo=fresh(1260,955,4.3);drawInkSaltik(c,images.striker,{x:450,y:955,dir:1,vx:0,onGround:true,supportY:955},{time:0,scale:4.3});
  if(mode==='drones')for(const bay of geo.bays){drawInkEnemy(c,images.enemies,{id:1,type:'drone',x:bay.x,y:bay.y-157*66/376*4.3,hp:20,dir:-1,vx:0,scale:4.3},{time:0});}
  heading(mode==='drones'?'PLATEFORMES — POSITION DES DRONES À RECALER':'NOUVEAU MODÈLE — DÉTAIL ET PROPORTIONS',mode==='drones'?'Drones natifs du jeu · cette vue vérifie seulement la place sur les plateformes.':'Petites pinces de la référence, cabine et canon conservés · Striker comme repère de proportion.');
 }
};
window.ready=(async()=>{
 await Promise.all([loadArt(),loadProposal(),document.fonts.load('48px Ink')]);
 const [s,sp,old,e,ep,b,bp]=await Promise.all(['ink-saltik','ink-saltik-paint','ink-carrier-support-dr01','ink-enemies','ink-enemies-paint','ink-canyon','ink-canyon-paint'].map(load));
 images.striker=bakePastelArt(s,sp,{strength:1,outline:2});images.carrier=old;images.enemies=bakePastelArt(e,ep,{strength:.85});images.canyon=bakePastelArt(b,bp,{strength:1});
 g.player.x=8660;g.player.y=g.groundAt(8660);g.player.supportY=g.player.y;g.player.onGround=true;
 g.enemies=[{id:990,type:'carrier',x:9000,y:g.groundAt(9000),supportY:g.groundAt(9000),dir:1,hp:100,maxHp:100,vx:0}];g.obstacles=g.obstacles.filter(o=>Math.abs(o.x-9000)>200);r.reset();window.show('after');
})();
