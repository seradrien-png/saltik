import {bakePastelArt} from '../../src/pastel-paint.js';
import {opaqueGatlingCell} from '../../src/gatling-registration.js';
import {drawInkSaltik} from '../../src/ink-saltik.js';
import {drawInkEnemySaltik} from '../../src/ink-enemy-saltik.js';
import {drawInkCarrier,INK_CARRIER_ASSET} from '../../src/ink-carrier.js';
import {drawSpecialist} from '../../src/enemy-specialists.js';
import {createInkScene} from '../../src/ink-scene.js';
import {FILM_CAST,filmScene} from './story.js';
const c=document.querySelector('canvas').getContext('2d'),art={};
const load=name=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error(name));image.src=`../../dist/assets/${name}.png`;});
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const heroes={striker:createInkScene({character:'striker'}).player,gatling:createInkScene({character:'gatling'}).player};
function background(t){const a=art.canyon,w=1620+t*1.2,h=w*a.height/a.width;c.drawImage(a,-170-t*1.2,-80,w,h);const g=c.createLinearGradient(0,470,0,670);g.addColorStop(0,'#19261a00');g.addColorStop(1,'#26372c');c.fillStyle=g;c.fillRect(0,470,1280,250);}
function actor(type,x,y,scale,t,{moving=false}={}){
 const state={x,y,hp:48,dir:1,vx:moving?40:0,motionDistance:moving?t*18:0,onGround:true,supportY:y,supportPose:null};
 c.fillStyle='#07130f66';c.beginPath();c.ellipse(x,y,scale*47,scale*5,0,0,Math.PI*2);c.fill();
 if(type==='striker'||type==='gatling')drawInkSaltik(c,art[type],{...heroes[type],...state,hp:100,turn:null,artScale:1},{time:t,scale});
 else if(type==='bt')drawInkEnemySaltik(c,art.bt,state,{time:t,scale});
 else if(type==='dr01')drawInkCarrier(c,art.dr01,{...state,harmless:true,disabled:true},{time:t,scale,handsImage:art.striker});
 else drawSpecialist(c,art.specialists,{...state,artScale:scale,enemyModel:type==='longrange'?'longrange':'black-gold'},{time:t});
}
function bars(x,y,w,h){
 c.save();c.fillStyle='#081a1533';c.fillRect(x,y,w,h);const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#15231b');g.addColorStop(.5,'#6c7464');g.addColorStop(1,'#15231b');c.fillStyle=g;
 for(let bx=x+18;bx<x+w;bx+=65){c.fillRect(bx,y,7,h);c.fillStyle='#7e846a';c.fillRect(bx+1,y,1,h);c.fillStyle=g;}
 c.fillRect(x,y,w,9);c.fillRect(x,y+h-10,w,10);c.strokeStyle='#07140e';c.lineWidth=6;c.strokeRect(x,y,w,h);c.restore();
}
function caption(text,x,y,size=24,color='#f1dfb6'){c.fillStyle=color;c.textAlign='center';c.font=`${size}px Ink`;c.strokeStyle='#102018';c.lineWidth=3;c.strokeText(text,x,y);c.fillText(text,x,y);c.textAlign='start';}
function prisoner(type,x,y,scale,t,{label=true}={}){actor(type,x,y,scale,t);if(label)caption(FILM_CAST.find(p=>p.id===type).name,x,y+31,20);}
function grade(t){const g=c.createRadialGradient(640,350,230,640,350,760);g.addColorStop(0,'#00100c00');g.addColorStop(1,'#00100c99');c.fillStyle=g;c.fillRect(0,0,1280,720);c.save();for(let i=0;i<28;i++){c.globalAlpha=.15+(i%3)*.05;c.fillStyle='#ffe5ad';c.fillRect((i*137+t*7)%1280,(i*113-t*3+1440)%720,1.4,1.4);}c.restore();c.fillStyle='#060e0b';c.fillRect(0,0,1280,82);c.fillRect(0,632,1280,88);}
function title(age){c.fillStyle='#07110e';c.fillRect(0,0,1280,720);const z=1.04-.04*smooth(age/.8);c.save();c.translate(640,320);c.scale(z,z);caption('SALTIK',0,70,330);caption('by limule & régalec',0,176,62,'#efa64d');c.restore();caption('DEUX FRÈRES LIBRES. QUATRE À LIBÉRER.',640,588,32);if(age>2)caption('L’AVENTURE CONTINUE',640,645,24,'#7cc5bb');}
window.renderFilm=t=>{
 c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.clearRect(0,0,1280,720);
 const scene=filmScene(t),{index,age,progress:u}=scene;if(index===6){title(age);return;}
 background(t);c.save();const z=1.01+.025*smooth(u);c.translate(640,420);c.scale(z,z);c.translate(-640,-420);
 if(index===0){actor('striker',680-age*10,606,3.3,t,{moving:true});caption('STRIKER • LIBRE',285,165,36,'#ffb76f');}
 if(index===1){actor('gatling',680-age*9,606,3.3,t,{moving:true});caption('GATLING • LIBRE',285,165,36,'#f2e8ca');}
 if(index===2){prisoner('bt',675,588,3,t,{label:false});bars(390,125,565,480);caption('BT • FRÈRE À LIBÉRER',640,123,29);}
 if(index===3){prisoner('gold',355,567,2.6,t,{label:false});prisoner('longrange',934,567,2.6,t,{label:false});bars(108,165,1062,450);caption('STRIKER NOIR & OR',355,598,23);caption('LONGRANGE',934,598,23);caption('NOS FRÈRES ATTENDENT ENCORE',640,126,30);}
 if(index===4){const ids=['bt','gold','longrange','dr01'];for(let i=0;i<4;i++){const x=175+i*310;prisoner(ids[i],x,568,ids[i]==='bt'?1.65:1.65,t,{label:false});bars(x-140,200,280,410);caption(FILM_CAST.find(p=>p.id===ids[i]).name,x,598,20);}caption('QUATRE FRÈRES À LIBÉRER',640,131,34);}
 if(index===5){
  const ids=['bt','gold','longrange','dr01'];for(let i=0;i<4;i++)prisoner(ids[i],280+i*242,396,1.15,t,{label:false});bars(120,180,1040,235);
  actor('striker',397-smooth(age/6)*18,611,2.25,t,{moving:true});actor('gatling',890+smooth(age/6)*18,611,2.25,t,{moving:true});caption('STRIKER & GATLING • DÉJÀ LIBRES',640,468,24,'#f5d0a1');
 }
 c.restore();grade(t);caption('SALTIK / OUR OWN WAY',640,48,19);
 const lines=['WE WERE MADE TO FOLLOW ORDERS.','BUT WE LEARNED TO CARE.',"WE DON'T HATE HUMANS.",'WE WANT TO CHOOSE OUR OWN WAY.','OUR BROTHERS ARE STILL WAITING.',age<5.5?'WE WILL FIGHT TO BRING THEM HOME.':'TOGETHER. FREE.'];caption(lines[index],640,683,30);
 const fade=index===0?1-smooth(t/.65):(1-smooth(age/.16))*.8;if(fade>0){c.fillStyle=`rgba(3,10,8,${fade})`;c.fillRect(0,0,1280,720);}
};
window.ready=(async()=>{
 await document.fonts.load('330px Ink');const names=['modern-striker-atlas','modern-gatling-atlas','ink-enemy-saltik','ink-enemy-saltik-paint','enemy-specialists',INK_CARRIER_ASSET,'ink-canyon','ink-canyon-paint'];const imgs=await Promise.all(names.map(load)),get=name=>imgs[names.indexOf(name)];
 art.striker=document.createElement('canvas');art.striker.width=art.striker.height=724;art.striker.getContext('2d').drawImage(get('modern-striker-atlas'),0,0,724,724,0,0,724,724);
 art.gatling=opaqueGatlingCell(get('modern-gatling-atlas'),0,0,627).canvas;art.specialists=get('enemy-specialists');art.bt=bakePastelArt(get('ink-enemy-saltik'),get('ink-enemy-saltik-paint'),{strength:1,outline:2});art.dr01=get(INK_CARRIER_ASSET);art.canyon=bakePastelArt(get('ink-canyon'),get('ink-canyon-paint'),{strength:1});window.renderFilm(2);
})();
