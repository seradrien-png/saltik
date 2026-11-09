import {bakePastelArt} from '/src/pastel-paint.js';
import {drawInkSaltik} from '/src/ink-saltik.js';
import {drawInkEnemySaltik} from '/src/ink-enemy-saltik.js';
import {drawInkCarrier} from '/src/ink-carrier.js';
const canvas=document.querySelector('canvas'),c=canvas.getContext('2d',{alpha:false}),art={},cache=new Map();
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const shots=[
 [0,.35,'signal'],[.35,2.7,'striker'],[2.7,3.15,'action',0],[3.15,3.55,'macro','striker'],[3.55,4.1,'action',1],[4.1,4.65,'action',0],
 [4.65,5.2,'word','NO ORDERS.'],[5.2,6,'carrier'],[6,6.5,'action',2],[6.5,7.15,'macro','carrier'],[7.15,7.95,'action',3],
 [7.95,8.15,'black'],[8.15,8.65,'word','CHOOSE'],[8.65,9.15,'action',4],[9.15,9.6,'word','YOUR WAY.'],[9.6,10.2,'action',5],
 [10.2,10.7,'green'],[10.7,11.4,'action',3],[11.4,12,'word','LOCKED.'],[12,12.7,'action',4],[12.7,13.15,'action',0],
 [13.15,13.7,'action',5],[13.7,14.2,'macro','green'],[14.2,14.7,'action',1],[14.7,15.3,'action',5],[15.3,15.75,'action',3],
 [15.75,16.2,'macro','striker'],[16.2,17,'cast'],[17,17.7,'action',4],[17.7,18.1,'black'],[18.1,22,'title']
];
const load=url=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error(url));i.src=url;});
async function action(shot,index){
 const key=shot*30+index;
 if(cache.has(key))return cache.get(key);
 const response=await fetch(`/work/action/${String(key).padStart(3,'0')}.jpg`);if(!response.ok)throw Error('Missing action '+key);
 const image=await createImageBitmap(await response.blob());cache.set(key,image);
 while(cache.size>8){const first=cache.keys().next().value;cache.get(first).close();cache.delete(first);}
 return image;
}
function environment(t,dark=.1){
 const z=1.06,w=1920*z,h=1080*z;c.drawImage(art.background,-(w-1920)*(.4+Math.sin(t*.13)*.2),-(h-1080)*.4,w,h);
 c.fillStyle=`rgba(1,13,13,${dark})`;c.fillRect(0,0,1920,1080);
 c.save();c.globalCompositeOperation='screen';c.globalAlpha=.06;c.fillStyle='#ffe0a2';
 c.beginPath();c.moveTo(1500,0);c.lineTo(1000+Math.sin(t*.5)*220,1080);c.lineTo(1650,1080);c.closePath();c.fill();c.restore();
}
function actor(type,x,y,scale,t){
 const p={x,y,hp:100,dir:type==='carrier'?-1:1,vx:0,onGround:true,supportY:y};
 c.fillStyle='#000a';c.beginPath();c.ellipse(x,y,scale*50,scale*9,0,0,7);c.fill();
 if(type==='striker')drawInkSaltik(c,art.striker,p,{time:t,scale});
 if(type==='carrier')drawInkCarrier(c,art.carrier,p,{time:t,scale,handsImage:art.striker});
 if(type==='green')drawInkEnemySaltik(c,art.green,p,{time:t,scale});
}
function labels(label,sub){
 c.fillStyle='#e8d9b5';c.font='21px Arial';c.letterSpacing='5px';c.fillText(sub,105,285);
 c.font='124px Ink';c.letterSpacing='1px';c.fillText(label,95,414);
 c.strokeStyle='#e5a052';c.lineWidth=3;c.beginPath();c.moveTo(105,450);c.lineTo(445,450);c.stroke();
}
function word(text,u){
 environment(u,.65);c.save();c.translate(960,540);const z=1.05-.05*smooth(u*2);c.scale(z,z);c.textAlign='center';c.font=`${text.length>9?220:310}px Ink`;c.fillStyle='#f0dfba';c.fillText(text,0,80);c.restore();
 c.strokeStyle='#e5a052';c.lineWidth=3;c.beginPath();c.moveTo(130,840);c.lineTo(1790,840);c.stroke();
}
function dust(t){
 c.save();for(let i=0;i<65;i++){const x=(i*239+t*12)%1920,y=(i*163-t*8+2160)%1080;c.globalAlpha=.08+(i%4)*.06;c.fillStyle=i%3?'#eddab5':'#eda258';c.fillRect(x,y,1+(i%3),1+(i%3));}c.restore();
}
function bars(){c.fillStyle='#030d0a';c.fillRect(0,0,1920,135);c.fillRect(0,945,1920,135);}
window.ready=(async()=>{
 await document.fonts.load('124px Ink');await document.fonts.load('590px Ink');
 const [s,sp,g,gp,carrier,bg]=await Promise.all(['ink-saltik','ink-saltik-paint','ink-enemy-saltik','ink-enemy-saltik-paint','ink-carrier-support-dr01'].map(n=>load('/assets/'+n+'.png')).concat([load('./assets/radar-canyon.png')]));
 art.striker=bakePastelArt(s,sp,{strength:1,outline:2});art.green=bakePastelArt(g,gp,{strength:1,outline:2});art.carrier=carrier;art.background=bg;
})();
window.renderEdit=async t=>{
 c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.letterSpacing='0px';c.textAlign='start';c.fillStyle='#030d0a';c.fillRect(0,0,1920,1080);
 const s=shots.find(s=>t>=s[0]&&t<s[1])??shots.at(-1),u=(t-s[0])/(s[1]-s[0]),kind=s[2];
 if(kind==='action'){
  const i=Math.min(29,Math.floor(u*30)),im=await action(s[3],i);c.drawImage(im,0,135,1920,810);
  const v=c.createLinearGradient(0,135,1920,945);v.addColorStop(0,'#071a1b22');v.addColorStop(.5,'#00000000');v.addColorStop(1,'#00000030');c.fillStyle=v;c.fillRect(0,135,1920,810);bars();
  c.fillStyle='#f0e0ba';c.font='16px Arial';c.letterSpacing='4px';c.fillText('SALTIK / IN-GAME',70,84);
 }else if(kind==='striker'||kind==='carrier'||kind==='green'){
  environment(t,.20);const name=kind==='striker'?'STRIKER':kind==='carrier'?'DR-01':'THE RIVAL';
  c.save();c.translate(1180,950);const z=1+smooth(u)*.06;c.scale(z,z);c.translate(-1180,-950);actor(kind,1230-u*35,950,kind==='green'?4.4:5.4,t);c.restore();
  labels(name,kind==='striker'?'BUILT TO OBEY.':kind==='carrier'?'NEVER ALONE.':'SAME KIND. DIFFERENT ORDERS.');dust(t);bars();
 }else if(kind==='macro'){
  environment(t,.35);c.save();c.translate(1080,620);c.scale(1+u*.13,1+u*.13);c.translate(-1080,-620);actor(s[3],1050,1420,s[3]==='green'?8.0:10,t);c.restore();dust(t);bars();
  c.strokeStyle='#edbd7888';c.lineWidth=1.5;c.strokeRect(60,165,1800,750);
 }else if(kind==='word'){word(s[3],u);dust(t);bars();}
 else if(kind==='signal'){
  c.fillStyle='#77c4c1';c.fillRect(180,538,1560*smooth(u),2);c.font='25px Arial';c.letterSpacing='8px';c.fillStyle='#e7d6b5';c.fillText('INCOMING TRANSMISSION',430,490);
 }else if(kind==='cast'){
  environment(t,.08);actor('green',1480,930,3.8,t);actor('carrier',430,955,4.2,t);actor('striker',980,980,5.1,t);dust(t);bars();
 }else if(kind==='title'){
  c.fillStyle='#06120f';c.fillRect(0,0,1920,1080);c.save();c.translate(960,485);const z=1.10-.10*smooth(u*5);c.scale(z,z);c.textAlign='center';c.fillStyle='#f0dfb5';c.font='575px Ink';c.fillText('SALTIK',0,125);c.fillStyle='#eaa04f';c.font='106px Ink';c.fillText('by limule & régalec',0,292);c.restore();
  c.strokeStyle='#7ec2b9';c.lineWidth=2;c.beginPath();c.moveTo(130,870);c.lineTo(1790,870);c.stroke();
  c.textAlign='center';c.font='bold 27px Arial';c.letterSpacing='5px';c.fillStyle='#eee2c8';c.fillText('MORE TO COME ON YOUR SMARTPHONE',960,945);c.textAlign='start';
 }
 return canvas.toDataURL('image/jpeg',.95).split(',')[1];
};
window.editShots=shots;
