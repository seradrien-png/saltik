import {terrainHeight,clamp} from './engine.js';
import {BASE_ZOOM,missionZoom,projectMissionCamera} from './mission-camera.js';
import {drawInkGround,drawInkRoutes,drawInkObstacles,drawInkForeground,setInkTerrainTexture,setInkLandmarkArt} from './ink-world.js';
import {INK_LANDMARK_ASSETS,inkLandmarkArt} from './ink-demo-layout.js';
import {supportHeight} from './world.js';
import {drawInkSaltik,inkSaltikGeometry} from './ink-saltik.js';
import {drawInkEnemy,drawInkProjectile,drawInkLocks,inkFlash} from './ink-actors.js';
import {drawInkBossTank,drawInkBossBreach,drawInkDuelWorld,drawInkDuelScreen} from './ink-encounters.js';
import {drawInkEnemySaltik} from './ink-enemy-saltik.js';
export const INK_ART_NAMES=['ink-canyon','ink-saltik','ink-enemies','ink-rock','ink-bridge','ink-turn','ink-observatory',...INK_LANDMARK_ASSETS.map(a=>a.name),'ink-enemy-saltik','ink-boss','ink-boss-parts'];
const images={},TAU=Math.PI*2,INK='#181815',PAPER='#e6d6b8';
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export function inkBackdropTiles(camera,width,height,imageWidth,imageHeight){
 const w=Math.max(width*1.25,height*imageWidth/imageHeight),h=w*imageHeight/imageWidth,first=Math.floor(camera*.07/w);
 return [first,first+1].map(index=>({index,x:index*w-camera*.07,w,h,flip:Math.abs(index%2)===1}));
}
export async function loadArt(){
 await Promise.all(INK_ART_NAMES.map(name=>new Promise((resolve,reject)=>{
  const image=new Image();image.decoding='async';image.onload=()=>{images[name]=image;resolve();};image.onerror=()=>reject(new Error(`Image manquante : ${name}`));
  image.src=new URL(`../assets/${name}.png`,import.meta.url).href;
 })));
 setInkTerrainTexture(images['ink-rock']);
 setInkLandmarkArt(inkLandmarkArt(images));
}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.fill();}
export function createRenderer(canvas){
 const c=canvas.getContext('2d',{alpha:false});let width=1280,height=720/BASE_ZOOM,camera=0,cameraY=height-720,zoom=BASE_ZOOM,last=0,lastGameTime=null,presentationAge=0,effects=[],serial=0;
 function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(globalThis.devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));}
 resize();
 function addEvent(e){
  if(!['explosion','debris','intercept','deflect','spark','cluster','jump','land','shot','missile','homing','enemyshot'].includes(e.type))return;
  if(['shot','missile','homing','enemyshot'].includes(e.type))return;
  const blast=['explosion','debris','intercept','cluster'].includes(e.type),dust=['jump','land'].includes(e.type);
  effects.push({x:e.x,y:e.y,type:e.type,age:0,life:blast?1.25:dust?.55:.26,radius:blast?(e.radius??42):dust?20:12,blast,dust,id:serial++});
  if(effects.length>48)effects.shift();
 }
 function backdrop(time){
  c.fillStyle=PAPER;c.fillRect(0,0,width,height);
  const img=images['ink-canyon'];if(!img)return;
  for(const {x,w,h,flip} of inkBackdropTiles(camera,width,height,img.width,img.height)){
   c.save();c.translate(x+(flip?w:0),0);if(flip)c.scale(-1,1);c.drawImage(img,0,Math.min(0,(height-h)*.35),w,h);c.restore();
  }
  // Distinct drawn cloud wisps move in the far plane, without washing out it.
  c.save();c.globalAlpha=.10;c.fillStyle='#fff0ce';for(let i=0;i<6;i++){const x=((i*357-camera*.018+time*2)% (width+320))-160;oval(c,x,height*.34+(i%3)*42,90,9,'#fff1d4');}c.restore();
 }
 function drawsEffects(){
  for(const e of effects){const u=e.age/e.life,x=e.x-camera,y=e.y;
   c.save();c.globalAlpha=1-u;
   if(e.blast){
    const r=e.radius*(.45+u*.8);
    for(let i=0;i<9;i++){const a=i*TAU/9,rr=r*(.35+hash(e.id+i)*.24),xx=x+Math.cos(a)*r*.48,yy=y+Math.sin(a)*r*.43-u*22;
     oval(c,xx,yy,rr,rr*.85,INK);oval(c,xx-1,yy-2,rr*.82,rr*.65,i%2?'#9c9584':'#bbb19a');
     c.strokeStyle='#33342e';c.lineWidth=1.5;c.beginPath();c.arc(xx,yy,rr*.55,a,a+2.8);c.stroke();
    }
    if(e.age<.17){c.globalAlpha=1-e.age/.17;inkFlash(c,{x,y},e.id*.8,r/15);}
   }else if(e.dust){for(let i=0;i<5;i++)oval(c,x+(i-2)*10*(1+u),y-3-u*12,8+u*6,3+u*6,'#c8b99a');}
   else{c.strokeStyle='#f8eacb';c.lineWidth=2;for(let i=0;i<5;i++){const a=i*TAU/5+e.id;c.beginPath();c.moveTo(x+Math.cos(a)*4,y+Math.sin(a)*4);c.lineTo(x+Math.cos(a)*e.radius*(1+u),y+Math.sin(a)*e.radius*(1+u));c.stroke();}}
   c.restore();
  }
 }
 function film(time){
  const vignette=c.createRadialGradient(width*.5,height*.48,height*.25,width*.5,height*.5,width*.65);vignette.addColorStop(0,'#15150f00');vignette.addColorStop(.75,'#15150f10');vignette.addColorStop(1,'#15150f88');c.fillStyle=vignette;c.fillRect(0,0,width,height);
  c.save();c.globalAlpha=.085;c.strokeStyle='#fff5d6';c.lineWidth=.7;const tick=Math.floor(time*8);
  for(let i=0;i<4;i++){const x=hash(i*43+Math.floor(tick/34))*width;c.beginPath();c.moveTo(x,hash(i+4)*height);c.lineTo(x+.9,height);c.stroke();}
  c.globalAlpha=.12;for(let i=0;i<55;i++){const x=hash(i*2+tick)*width,y=hash(i*7+tick)*height;oval(c,x,y,.6+hash(i)*.8,.5,INK);}c.restore();
 }
 function render(g,now,view='playing'){
  const wall=clamp((now-last)/1000,0,.05),sim=lastGameTime===null?0:Math.max(0,g.time-lastGameTime),terminal=['won','dead'].includes(view),dt=terminal||view==='title'?wall:sim;
  last=now;lastGameTime=g.time;for(const e of effects)e.age+=dt;effects=effects.filter(e=>e.age<e.life);
  if(view==='won')presentationAge+=wall;else if(view!=='paused')presentationAge=0;
  zoom=missionZoom({view,introDuration:g.introDuration,introElapsed:g.introElapsed,presentationAge});
  if(view==='title'){height=720/zoom;width=canvas.width/canvas.height*height;camera=100;cameraY=height-720;}
  else{
   const q=projectMissionCamera({cssWidth:canvas.width,cssHeight:canvas.height,zoom,game:g,playerTop:inkSaltikGeometry(g.player,{time:g.time}).bounds.y,view,intro:g.introElapsed<g.introDuration,dt,camera,cameraY,phone:canvas.clientWidth<900});
   ({width,height,camera,cameraY}=q);
  }
  const time=view==='title'?now/1000:g.time;c.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);c.clearRect(0,0,width,height);backdrop(time);
  c.save();if(g.shake>0&&view==='playing')c.translate(Math.sin(time*103)*Math.min(g.shake,6)*.3,Math.cos(time*119)*Math.min(g.shake,6)*.2);
  c.translate(0,cameraY);const opts={camera,width,height:Math.max(900,height-cameraY),time};
  drawInkRoutes(c,g,opts);drawInkGround(c,g,opts);drawInkObstacles(c,g,opts);
  if(view!=='title'){
   for(const item of g.pickups){const x=item.x-camera;if(x<-20||x>width+20)continue;c.save();c.translate(x,item.y);c.fillStyle=INK;c.strokeStyle=PAPER;c.lineWidth=2;c.fillRect(-12,-13,24,26);c.strokeRect(-12,-13,24,26);c.fillStyle=PAPER;c.fillRect(-2,-8,4,16);c.fillRect(-8,-2,16,4);c.restore();}
   for(const e of g.enemies)if(e.id!==g.duel?.enemyId&&e.x>camera-200&&e.x<camera+width+200){if(e.type==='saltik')drawInkEnemySaltik(c,images['ink-enemy-saltik'],e,{camera,time});else drawInkEnemy(c,images['ink-enemies'],e,{camera,time});}
   drawInkBossTank(c,images,g.boss,{camera,time,breach:g.bossBreach});
   const paired=drawInkBossBreach(c,images,g.bossBreach,g.boss,{camera,time,player:g.player});
   const dueling=drawInkDuelWorld(c,images,g.duel,{camera,width,height,cameraY,time,player:g.player});
   if(g.status!=='dead'&&!paired&&!dueling){
    const p=g.player,rear=p.evasion?.active;const shade=rear?.7:1;
    c.save();if(rear){c.globalAlpha=.86;c.translate(p.x-camera,p.y);c.scale(.92,.92);c.translate(-(p.x-camera),-p.y);}
    oval(c,p.x-camera,p.supportY??p.y,43*shade,4,'#18181566');const pose=drawInkSaltik(c,images['ink-saltik'],p,{camera,time,turnImage:images['ink-turn'],sampleGround:x=>supportHeight(g,p,x),victoryAge:view==='won'?presentationAge:null});
    if(pose&&!pose.weaponsLocked){if(p.muzzle>0)inkFlash(c,pose.arm,p.aim,1);if(p.mirvFlash>0)inkFlash(c,pose.cannon,pose.cannonAngle,1.5);}
    c.restore();
   }
   for(const s of g.projectiles)drawInkProjectile(c,s,camera,time);drawInkLocks(c,g,camera);drawsEffects();
  }
  drawInkForeground(c,g,opts);c.restore();
  if(view==='title'){
   const x=width*.73,y=height*.82,scale=width>1100?2.5:1.95;oval(c,x,y,140,11,'#15150f66');drawInkSaltik(c,images['ink-saltik'],{x,y,dir:1,onGround:true,supportY:y,vx:0},{time,scale});
  }
  if(view!=='title')drawInkDuelScreen(c,images,g.duel,{camera,cameraY,width,height,time});
  film(time);if(g.flash>0){c.fillStyle=`rgba(240,227,201,${g.flash*.2})`;c.fillRect(0,0,width,height);}
 }
 return {render,addEvent,resize,reset(){zoom=BASE_ZOOM;height=720/zoom;width=canvas.width/canvas.height*height;camera=180-width*(canvas.clientWidth<900?.35:.29);cameraY=height-720;last=0;lastGameTime=null;effects=[];presentationAge=0;},get width(){return width;},get height(){return height;},get camera(){return camera;},get cameraY(){return cameraY;},get cameraZoom(){return zoom;},get presentationAge(){return presentationAge;},get effectCount(){return effects.length;}};
}
