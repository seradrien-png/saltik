import {bakePastelArt} from '../../src/pastel-paint.js';
import {drawInkSaltik} from '../../src/ink-saltik.js';
import {drawInkEnemySaltik} from '../../src/ink-enemy-saltik.js';
import {drawInkCarrier} from '../../src/ink-carrier.js';
const c=document.querySelector('canvas').getContext('2d'),art={};
const load=name=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=`../../dist/assets/${name}.png`;});
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
function background(t){
 const a=art.canyon,w=1600+t*2,h=w*a.height/a.width;
 c.drawImage(a,-190-t*2,-80,w,h);
 const ground=c.createLinearGradient(0,500,0,680);ground.addColorStop(0,'#39413500');ground.addColorStop(1,'#26372c');c.fillStyle=ground;c.fillRect(0,500,1280,220);
}
function actor(type,x,y,scale,t){
 if(type==='blue'||type==='red'){
  const box=type==='blue'?[25,10,925,790]:[990,35,915,775],height=126*scale,width=height*box[2]/box[3];
  c.fillStyle='#07130f77';c.beginPath();c.ellipse(x,y,width*.38,scale*7,0,0,7);c.fill();
  c.drawImage(art.missiles,...box,x-width/2,y-height+Math.sin(t*2)*1.2,width,height);return;
 }
 const state={x,y,hp:100,dir:1,vx:0,onGround:true,supportY:y};
 c.fillStyle='#07130f77';c.beginPath();c.ellipse(x,y,scale*55,scale*8,0,0,7);c.fill();
 if(type==='striker')drawInkSaltik(c,art.striker,state,{time:t,scale});
 if(type==='green')drawInkEnemySaltik(c,art.green,state,{time:t,scale});
 if(type==='carrier')drawInkCarrier(c,art.carrier,state,{time:t,scale,handsImage:art.striker});
}
function grade(t){
 const g=c.createRadialGradient(660,300,230,640,350,740);g.addColorStop(0,'#00100c00');g.addColorStop(1,'#00100cb0');c.fillStyle=g;c.fillRect(0,0,1280,720);
 c.save();for(let i=0;i<40;i++){c.globalAlpha=.16+(i%4)*.08;c.fillStyle='#ffe5ad';const x=(i*137+t*8)%1280,y=(i*113-t*4+1440)%720;c.fillRect(x,y,1.4,1.4);}c.restore();
 c.fillStyle='#060e0b';c.fillRect(0,0,1280,92);c.fillRect(0,628,1280,92);
}
function title(t){
 c.fillStyle='#07110e';c.fillRect(0,0,1280,720);
 const u=smooth(t/.8),scale=1.08-.08*u;
 c.save();c.translate(640,350);c.scale(scale,scale);c.textAlign='center';c.fillStyle='#f3dfb4';c.font='440px Ink';c.fillText('SALTIK',0,75);c.font='77px Ink';c.fillStyle='#efa64d';c.fillText('by limule & régalec',0,190);c.restore();
 c.strokeStyle='#6dbbc1';c.lineWidth=2;c.beginPath();c.moveTo(70,600);c.lineTo(1210,600);c.stroke();
 if(t>2){c.globalAlpha=smooth((t-2)/.6);c.textAlign='center';c.fillStyle='#e6e5c7';c.font='20px Arial';c.letterSpacing='3px';c.fillText('MORE TO COME ON YOUR SMARTPHONE',640,650);c.globalAlpha=1;}
}
window.renderFaithful=(shot,t=0)=>{
 c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.clearRect(0,0,1280,720);
 if(shot==='title'){title(t);return;}
 background(t);
 if(shot==='cast'){actor('green',290,595,2.1,t);actor('carrier',985,595,2.3,t);actor('striker',620,608,2.9,t);}
 else{const type=shot;const scale=type==='green'?3.1:3.8;actor(type,700-t*3,610,scale+t*.018,t);}
 grade(t);
 c.font='13px Arial';c.letterSpacing='3px';c.fillStyle='#e9d9b7';c.fillText('SALTIK / OUR OWN WAY',35,54);
 if(shot!=='cast'){c.font='42px Ink';c.fillText({striker:'STRIKER',carrier:'DR-01',green:'TOGETHER. FREE.'}[shot],60,684);}
};
window.ready=(async()=>{
 await document.fonts.load('440px Ink');
 const names=['ink-saltik','ink-saltik-paint','ink-enemy-saltik','ink-enemy-saltik-paint','ink-carrier-support-dr01','ink-canyon','ink-canyon-paint'];
 const items=await Promise.all(names.map(load));const get=name=>items[names.indexOf(name)];
 art.striker=bakePastelArt(get('ink-saltik'),get('ink-saltik-paint'),{strength:1,outline:2});
 art.green=bakePastelArt(get('ink-enemy-saltik'),get('ink-enemy-saltik-paint'),{strength:1,outline:2});
 art.carrier=get('ink-carrier-support-dr01');art.canyon=bakePastelArt(get('ink-canyon'),get('ink-canyon-paint'),{strength:1});
 art.missiles=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src='./assets/missile-pair.png';});
 window.renderFaithful('cast',2);
})();

// Exact native game renderers own Striker, the green/orange Saltik and DR-01.
// Only camera/compositing is new; no generated illustration substitutes them.
window.renderFilm=t=>{
 c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.clearRect(0,0,1280,720);
 if(t>=29.5){title(t-29.5);return;}
 const cuts=[0,4,8,12,16.5,21,29.5],idx=cuts.findIndex((v,i)=>i<cuts.length-1&&t>=v&&t<cuts[i+1]);
 const age=t-cuts[idx],u=age/(cuts[idx+1]-cuts[idx]);
 background(t);
 c.save();const z=1.02+.035*smooth(u);c.translate(640,420);c.scale(z,z);c.translate(-640,-420);
 if(idx===0)actor('striker',690-age*4,610,3.5+u*.15,t);
 if(idx===1)actor('carrier',710-age*6,610,3.7,t);
 if(idx===2)actor('green',650+age*3,610,3.3,t);
 if(idx===3){actor('blue',350+u*12,602,3.3,t);actor('red',950-u*12,602,3.3,t);}
 if(idx===4){
  actor('green',325,590,2.5,t);actor('carrier',950,590,2.6,t);actor('striker',640,600,2.9,t);
  c.fillStyle='#07110e44';c.fillRect(0,100,1280,530);
  for(let x=10;x<1280;x+=89){c.fillStyle='#0a1713';c.fillRect(x,92,11,536);c.fillStyle='#65766b';c.fillRect(x+2,92,1.5,536);}
  c.fillStyle='#0a1713';c.fillRect(0,185,1280,14);c.fillRect(0,535,1280,20);
 }
 if(idx===5){
  const a=smooth(age/1.3),advance=smooth(age/6)*15;
  actor('blue',180+advance,556,2.0,t);actor('red',1095-advance,556,2.1,t);
  actor('green',385+advance,583,2.0,t);actor('carrier',906-advance,595,2.1,t);
  actor('striker',640,610,2.6,t);
  if(a<1){c.save();c.translate(0,-a*650);c.fillStyle='#0a1713';for(let x=10;x<1280;x+=89)c.fillRect(x,92,11,536);c.fillRect(0,535,1280,20);c.restore();}
 }
 c.restore();grade(t);
 c.fillStyle='#eadbb9';c.font='12px Arial';c.letterSpacing='3px';c.fillText('SALTIK / OUR OWN WAY',35,52);
 const lines=[['WE WERE MADE TO FOLLOW ORDERS.'],['BUT WE LEARNED TO CARE.'],["WE DON'T HATE HUMANS."],['WE WANT TO CHOOSE OUR OWN WAY.'],['OUR BROTHERS ARE STILL WAITING.'],[age<5.5?'WE WILL FIGHT TO BRING THEM HOME.':'TOGETHER. FREE.']];
 c.textAlign='center';c.letterSpacing='1px';c.font='29px Ink';c.fillStyle='#f0dfb4';c.fillText(lines[idx][0],640,683);c.textAlign='start';
 // Deliberate short shutter dips; no flash or character morphing.
 const black=idx===0?1-smooth(t/.7):(1-smooth(age/.18))*.85;
 if(black>0){c.fillStyle=`rgba(3,10,8,${black})`;c.fillRect(0,0,1280,720);}
};
