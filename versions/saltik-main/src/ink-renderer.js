import {preparePlayerSkins} from './player-skins.js';
import {drawDesertVista,drawDesertExterior,drawDesertInteriorBackdrop,drawDesertWorld,drawDesertForeground,drawDesertCurtain,desertTransitionCurtain,desertVisualStage} from './desert-world.js';
import {createDesertRoutes,desertInteriorGroundAt,desertVistaBox} from './desert-layout.js';
import {drawBTLocks} from './bt-art.js';
import {ENEMY_MATERIALS,sceneArtImages,bakeEnemyArt} from './enemy-styles.js';
import {bakeBridgeForeground} from './royal-bridge-front.js';
import {drawRoyalBackdrop,drawRoyalWorld,drawRoyalForeground} from './royal-world.js';
import {drawLunarMidground,drawLunarLowDepth,bakeLunarLowDepth} from './lunar-midground.js';
import {bakeRoyalArt} from './royal-skin.js';
import {drawLunarBackdrop,drawLunarWorld,drawLunarForeground} from './lunar-world.js';
import {terrainHeight,clamp} from './engine.js';
import {BASE_ZOOM,missionZoom,projectMissionCamera} from './mission-camera.js';
import {drawInkGround,drawInkRoutes,drawInkObstacles,drawInkForeground,setInkTerrainTexture,setInkLandmarkArt} from './ink-world.js';
import {INK_LANDMARK_ASSETS,inkLandmarkArt} from './ink-demo-layout.js';
import {supportHeight} from './world.js';
import {drawInkSaltik,inkSaltikGeometry} from './ink-saltik.js';
import {drawInkEnemy,drawInkProjectile,drawInkLocks,inkFlash} from './ink-actors.js';
import {drawInkBossTank,drawInkBossBreach,drawInkDuelWorld,drawInkDuelScreen} from './ink-encounters.js';
import {drawInkEnemySaltik} from './ink-enemy-saltik.js';
import {PASTEL_ENVIRONMENT_PAINT} from './pastel-environment.js';
import {PASTEL_CHARACTER_PAINT} from './pastel-characters.js';
import {bakePastelArt,mapWithConcurrency} from './pastel-paint.js';
import {drawInkCarrier,INK_CARRIER_ASSET} from './ink-carrier.js';
import {drawCarrierShutdown} from './carrier-shutdown-art.js';
import {inkHitImage} from './ink-hit-cache.js';
import {createMirvPreview} from './mirv-preview.js';
const PAINT={...PASTEL_ENVIRONMENT_PAINT,...PASTEL_CHARACTER_PAINT};
const BASE_ART=['modern-striker-turn-velvet','modern-striker-dragon-atlas','modern-striker-dragon-turn-material','modern-striker-atlas','modern-striker-turn-normal','modern-striker-turn-lunar','bt-turn-lunar-material','bt-turn-velvet-material','gatling-turn-lunar-material','gatling-turn-velvet-material','bt-turn','gatling-turn','dragon-striker-material','dragon-turn-material','limule-gatling-material','limule-gatling-turn-material','desert-red-vista','desert-c07-interior','desert-structures','gatling-snow','gatling-lunar-material','gatling-velvet-material','lunar-pennant','lunar-low-depth','royal-rail-mask','royal-organic-landmarks','royal-foreground-props','lunar-hero-map','lunar-turn-map','royal-world','royal-velvet-ground','royal-flora','royal-structures','royal-quarter-bridge','royal-hero-map','royal-turn-map','boss-assault-atlas','lunar-natural-world','lunar-island-layers','lunar-sandstone','lunar-aqueduct','lunar-monuments','ink-canyon','ink-saltik','ink-enemies','ink-rock','ink-bridge','ink-turn','ink-observatory',...INK_LANDMARK_ASSETS.map(a=>a.name),'ink-enemy-saltik',INK_CARRIER_ASSET];
export const INK_ART_NAMES=[...BASE_ART,...Object.values(PAINT),...ENEMY_MATERIALS.map(v=>v.asset),'pastel-boss','pastel-boss-parts'];
const images={},TAU=Math.PI*2,INK='#181815',PAPER='#EFE2BC';
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export function inkBackdropTiles(camera,width,height,imageWidth,imageHeight){
 const w=Math.max(width*1.25,height*imageWidth/imageHeight),h=w*imageHeight/imageWidth,first=Math.floor(camera*.07/w);
 return [first,first+1].map(index=>({index,x:index*w-camera*.07,w,h,flip:Math.abs(index%2)===1}));
}
export async function loadArt(onProgress=()=>{}){
 let complete=0;const report=()=>onProgress(++complete/(BASE_ART.length+2+ENEMY_MATERIALS.length));
 const load=name=>new Promise((resolve,reject)=>{
  const image=new Image();image.decoding='async';image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(`Image manquante : ${name}`));
  image.src=new URL(`../assets/${name}.png`,import.meta.url).href;
 });
 await mapWithConcurrency(BASE_ART,2,async name=>{
  const original=await load(name),paint=PAINT[name]?await load(PAINT[name]):null;
  const saltik=['ink-saltik','ink-turn','ink-enemy-saltik'].includes(name);
  const painted=paint?bakePastelArt(original,paint,{strength:saltik?1:PASTEL_CHARACTER_PAINT[name]?.85:1,outline:saltik?2:0}):original;
  images[name]=painted;
  if(paint&&typeof createImageBitmap==='function'){
   try{images[name]=await createImageBitmap(painted);}catch{/* Canvas remains the compatible texture fallback. */}
  }
  if(paint){original.onload=original.onerror=paint.onload=paint.onerror=null;original.src='';paint.src='';}
  report();
 });
 images['ink-boss']=await load('pastel-boss');report();images['ink-boss-parts']=await load('pastel-boss-parts');report();
 images['royal-bridge-front']=bakeBridgeForeground(images['royal-quarter-bridge'],images['royal-rail-mask']);
 images['lunar-saltik']=images['lunar-hero-map'];images['lunar-turn']=images['lunar-turn-map'];
 images['bt-turn']=bakeLunarLowDepth(images['bt-turn']);images['gatling-turn']=bakeLunarLowDepth(images['gatling-turn']);
 images['desert-structures']=bakeLunarLowDepth(images['desert-structures']);
 images['gatling-snow']=bakeLunarLowDepth(images['gatling-snow']);
 images['gatling-lunar']=bakeEnemyArt(images['gatling-snow'],images['gatling-lunar-material']);images['gatling-velvet']=bakeEnemyArt(images['gatling-snow'],images['gatling-velvet-material']);
 images['lunar-low-depth']=bakeLunarLowDepth(images['lunar-low-depth']);
 images['royal-saltik']=bakeRoyalArt(images['ink-saltik'],images['royal-hero-map']);
 images['royal-turn']=bakeRoyalArt(images['ink-turn'],images['royal-turn-map']);
 images['ink-carrier']=images[INK_CARRIER_ASSET];
 for(const style of ENEMY_MATERIALS){
  const material=await load(style.asset);images[style.name]=bakeEnemyArt(images[style.base],material);
  material.onload=material.onerror=null;material.src='';report();
 }
 images['lunar-enemy-saltik'].lunarPennant=images['lunar-pennant'];
 // Prime native hit flashes during loading, ahead of the first crowded fight.
 inkHitImage(images['ink-enemies']);inkHitImage(images['ink-enemy-saltik']);
 preparePlayerSkins(images);
 setInkTerrainTexture(images['ink-rock']);
 setInkLandmarkArt(inkLandmarkArt(images));
}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.fill();}
export function inkTitlePlayer(player,x,y){
 const pose={x,y,dir:1,onGround:true,supportY:y,vx:0,...(player.visualModel?{visualModel:player.visualModel}: {})};
 if(player.character==='bt')return {...pose,character:'bt',bt:player.bt,hp:100,artScale:player.artScale};
 return player.character==='gatling'?{...pose,character:player.character,gatling:player.gatling,artScale:player.artScale}:pose;
}
export function createRenderer(canvas){
 const c=canvas.getContext('2d',{alpha:false}),mirvPreview=createMirvPreview();let width=1280,height=720/BASE_ZOOM,camera=0,cameraY=height-720,zoom=BASE_ZOOM,last=0,lastGameTime=null,presentationAge=0,effects=[],serial=0;
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
     oval(c,xx,yy,rr,rr*.85,INK);oval(c,xx-1,yy-2,rr*.82,rr*.65,i%3===0?'#81776D':i%3===1?'#DE9D78':'#EFC096');
     c.strokeStyle='#61584E';c.lineWidth=1.5;c.beginPath();c.arc(xx,yy,rr*.55,a,a+2.8);c.stroke();
    }
    if(e.age<.17){c.globalAlpha=1-e.age/.17;inkFlash(c,{x,y},e.id*.8,r/15,'#FFF1CD');}
   }else if(e.dust){for(let i=0;i<5;i++)oval(c,x+(i-2)*10*(1+u),y-3-u*12,8+u*6,3+u*6,'#D9BE96');}
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
  const desertDoor=g.level===4&&['entering','exiting'].includes(g.desert.phase)?desertTransitionCurtain(g.desert.phaseElapsed):0;
  if(g.level===4&&(view==='title'||desertVisualStage(g)==='exterior')){
   height=720/BASE_ZOOM;width=canvas.width/canvas.height*height;camera=0;cameraY=0;zoom=BASE_ZOOM;c.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);c.clearRect(0,0,width,height);
   const art=sceneArtImages(images,4,g.player.character,g.player.cosmeticSkin,g.player.visualModel),time=view==='title'?now/1000:g.time;
   if(view==='title'){drawDesertVista(c,images['desert-red-vista'],{width,height});drawInkSaltik(c,art['ink-saltik'],inkTitlePlayer(g.player,desertVistaBox(width,height).x+desertVistaBox(width,height).w*.73,desertVistaBox(width,height).y+desertVistaBox(width,height).h*.96),{time,scale:width>1100?2:1.7});}
   else drawDesertExterior(c,{...images,'ink-saltik':art['ink-saltik'],'ink-turn':art['ink-turn']},g,{width,height,time,victoryAge:view==='won'?presentationAge:null});
   drawDesertCurtain(c,width,height,desertDoor);return;
  }
  if(g.level===4&&g.desert.phase==='entering')g={...g,player:{...g.player,x:180,y:620,supportY:620,artScale:1,dir:1,supportPose:null},platforms:createDesertRoutes(),enemies:[],pickups:[],groundAt:desertInteriorGroundAt};

  if(view==='title'){height=720/zoom;width=canvas.width/canvas.height*height;camera=100;cameraY=height-720;}
  else{
   const q=projectMissionCamera({cssWidth:canvas.width,cssHeight:canvas.height,zoom,game:g,playerTop:inkSaltikGeometry(g.player,{time:g.time}).bounds.y,view,intro:g.introElapsed<g.introDuration,dt,camera,cameraY,phone:canvas.clientWidth<900});
   ({width,height,camera,cameraY}=q);
  }
  const playerImages=sceneArtImages(images,g.level,g.player.character,g.player.cosmeticSkin,g.player.visualModel),royalArt={atlas:images['royal-structures'],bridge:images['royal-quarter-bridge'],ground:images['royal-velvet-ground'],flora:images['royal-flora'],organic:images['royal-organic-landmarks'],props:images['royal-foreground-props'],railFront:images['royal-bridge-front']};
  const time=view==='title'?now/1000:g.time;c.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);c.clearRect(0,0,width,height);g.level===4?drawDesertInteriorBackdrop(c,images['desert-c07-interior'],{camera,width,height,cameraY}):g.level===3?drawRoyalBackdrop(c,{camera,width,height,time,image:images['royal-world'],art:royalArt}):g.level===2?drawLunarBackdrop(c,{camera,width,height,time,image:images['lunar-natural-world'],layers:images['lunar-island-layers'],art:{atlas:images['lunar-monuments'],bridge:images['lunar-aqueduct']}}):backdrop(time);
  if(g.level===2)drawLunarMidground(c,{camera,width,height,layers:images['lunar-island-layers']});
  c.save();if(g.shake>0&&view==='playing')c.translate(Math.sin(time*103)*Math.min(g.shake,6)*.3,Math.cos(time*119)*Math.min(g.shake,6)*.2);
  c.translate(0,cameraY);const opts={camera,width,height:Math.max(900,height-cameraY),time};
  if(g.level===2)drawLunarLowDepth(c,{...opts,groundAt:g.groundAt,image:images['lunar-low-depth'],texture:images['lunar-sandstone']});
  if(g.level===4)drawDesertWorld(c,g,{...opts,atlas:images['desert-structures'],texture:images['desert-c07-interior'],vista:images['desert-red-vista']});else if(g.level===3)drawRoyalWorld(c,g,{...opts,art:royalArt});else if(g.level===2)drawLunarWorld(c,g,{...opts,texture:images['lunar-sandstone'],art:{atlas:images['lunar-monuments'],bridge:images['lunar-aqueduct']}});else{drawInkRoutes(c,g,opts);drawInkGround(c,g,opts);drawInkObstacles(c,g,opts);}
  if(view!=='title'){
   for(const item of g.pickups){const x=item.x-camera;if(x<-20||x>width+20)continue;c.save();c.translate(x,item.y);c.fillStyle=INK;c.strokeStyle=PAPER;c.lineWidth=2;c.fillRect(-12,-13,24,26);c.strokeRect(-12,-13,24,26);c.fillStyle=PAPER;c.fillRect(-2,-8,4,16);c.fillRect(-8,-2,16,4);c.restore();}
   for(const e of g.enemies)if(!(e.type==='saltik'&&e.neutralized)&&e.id!==g.duel?.enemyId&&e.x>camera-200&&e.x<camera+width+200){if(e.type==='saltik')drawInkEnemySaltik(c,playerImages['ink-enemy-saltik'],e,{camera,time});else if(e.type==='carrier')drawInkCarrier(c,playerImages['ink-carrier'],e,{camera,time,handsImage:images['ink-saltik']});else drawInkEnemy(c,playerImages['ink-enemies'],e,{camera,time});}
   drawInkBossTank(c,images,g.boss,{camera,time,breach:g.bossBreach});
   const paired=drawInkBossBreach(c,playerImages,g.bossBreach,g.boss,{camera,time,player:g.player});
   const disconnecting=drawCarrierShutdown(c,playerImages,g.carrierShutdown,g.enemies.find(e=>e.id===g.carrierShutdown?.enemyId),{camera,time,player:g.player});
   const dueling=drawInkDuelWorld(c,playerImages,g.duel,{camera,width,height,cameraY,time,player:g.player});
   const playerKO=g.status==='dead'&&!!g.player.knockedOut;
   if((g.status!=='dead'||playerKO)&&!paired&&!dueling&&!disconnecting){
    const p=playerKO?{...g.player,vx:0,vy:0,turn:null,evasion:null,melee:null,crouching:g.player.onGround!==false,invulnerable:0,damagePose:false,muzzle:0,mirvFlash:0,homingFlash:0,cannonElevation:0,cannonRecoil:0,motionLean:0,motionHeave:0,jumpCompression:0,landingCompression:0}:g.player,rear=p.evasion?.active;const shade=rear?.7:1;
    c.save();if(rear){c.globalAlpha=.86;c.translate(p.x-camera,p.y);c.scale(.92,.92);c.translate(-(p.x-camera),-p.y);}
    oval(c,p.x-camera,p.supportY??p.y,43*shade*(p.artScale??1),4,'#18181566');const pose=drawInkSaltik(c,playerImages['ink-saltik'],p,{camera,time,turnImage:playerImages['ink-turn'],sampleGround:x=>supportHeight(g,p,x),victoryAge:view==='won'?presentationAge:null});
    if(pose&&p.character!=='gatling'&&p.character!=='bt'&&!pose.weaponsLocked&&!playerKO){if(p.muzzle>0)inkFlash(c,pose.arm,p.aim,1,'#F3CB88');if(p.mirvFlash>0)inkFlash(c,pose.cannon,pose.cannonAngle,1.5,'#EBC29D');}
    c.restore();
   }
   for(const s of g.projectiles)drawInkProjectile(c,s,camera,time);drawInkLocks(c,g,camera);drawBTLocks(c,g,camera);drawsEffects();
  }
  if(g.level===4)drawDesertForeground(c,g,{...opts,atlas:images['desert-structures']});else if(g.level===3)drawRoyalForeground(c,g,{...opts,art:royalArt});else if(g.level===2)drawLunarForeground(c,{...opts,art:{atlas:images['lunar-monuments'],bridge:images['lunar-aqueduct']}});else drawInkForeground(c,g,opts);if(view!=='title')mirvPreview.draw(c,g,{camera,cameraY,width,height});c.restore();
  if(view==='title'){
   const x=width*.73,y=height*.82,scale=width>1100?2.5:1.95;oval(c,x,y,140,11,'#15150f66');drawInkSaltik(c,playerImages['ink-saltik'],inkTitlePlayer(g.player,x,y),{time,scale});
  }
  if(view!=='title')drawInkDuelScreen(c,playerImages,g.duel,{camera,cameraY,width,height,time});
  if(desertDoor)drawDesertCurtain(c,width,height,desertDoor);
  film(time);if(g.flash>0){c.fillStyle=`rgba(240,227,201,${g.flash*.2})`;c.fillRect(0,0,width,height);}
 }
 return {render,addEvent,resize,reset(){mirvPreview.reset();zoom=BASE_ZOOM;height=720/zoom;width=canvas.width/canvas.height*height;camera=180-width*(canvas.clientWidth<900?.35:.29);cameraY=height-720;last=0;lastGameTime=null;effects=[];presentationAge=0;},get width(){return width;},get height(){return height;},get camera(){return camera;},get cameraY(){return cameraY;},get cameraZoom(){return zoom;},get presentationAge(){return presentationAge;},get effectCount(){return effects.length;}};
}
