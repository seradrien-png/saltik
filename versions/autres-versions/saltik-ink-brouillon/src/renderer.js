import {drawCanyonMotion} from './background-motion.js';
import {drawBossBreach,bossBreachVisual} from './boss-breach-art.js';
import {drawVictory} from './victory-art.js';
import {drawBossTank} from './boss-tank-art.js';
import {drawDuelWorld,drawDuelScreen,drawEnemyDeflection} from './duel-art.js';
import {PARALLAX_LAYERS,terrainHeight,clamp,combatBounds} from './engine.js';
import {drawNaturalGround,drawNaturalRoutes,drawAncientRuins,drawRockButtresses,drawNaturalForeground} from './scenery.js';
import {drawTachikoma} from './tachikoma-art.js';
import {tachikomaGeometry} from './tachikoma-pose.js';
import {drawGroundEnemy,enemyProfile} from './enemy-art.js';
import {drawEnemySaltik} from './enemy-saltik-art.js';
import {createCombatEffects} from './combat-effects.js';
import {drawObstacle} from './obstacle-art.js';
import {BASE_ZOOM,missionZoom,projectMissionCamera} from './mission-camera.js';
const TAU=Math.PI*2;
const hash=n=>{const a=Math.sin(n*127.1+311.7)*43758.5453;return a-Math.floor(a);};
const images={};
const REQUIRED_ART={'boss-pod':{w:1536,h:1024,label:'Le lance-roquettes du Colosse'},'saltik-breach-fire':{w:1536,h:1024,label:'Les tirs du Saltik dans la brèche'},'boss-assault':{w:1536,h:1024,label:'L’assaut du Saltik sur le tank'},'saltik-victory':{w:1536,h:1024,label:'Les poses de victoire du Saltik'},'saltik-duel':{w:1536,h:1024,label:'La lutte et la projection des Saltiks'},'saltik-dodge':{w:1536,h:1024,label:'Les deux esquives arrière du Saltik'},'saltik-evasion':{w:1254,h:1254,label:'La déviation du Saltik'},'enemy-saltik':{w:1536,h:1024,label:'Le Saltik ennemi'},'combat-blast':{w:1536,h:1024,label:'Les explosions et fumées'},'saltik-melee':{w:1536,h:1024,label:'La frappe du Saltik'},destructibles:{w:1536,h:1024,label:'Les obstacles du canyon'},tachikoma:{w:1536,h:1024,label:'Le sprite du Saltik Striker'},'tachikoma-turn':{w:1536,h:1024,label:'Les rotations du Saltik Striker'},enemies:{w:1536,h:1024,label:'Les ennemis'},wreck:{w:2172,h:724,label:'L’épave'},'ground-surface':{w:2172,h:724,label:'Le matériau du sol'}};
export async function loadArt(){
  await Promise.all(['boss-pod','saltik-breach-fire','boss-assault','saltik-victory','saltik-duel','canyon','tachikoma','tachikoma-turn','saltik-melee','saltik-evasion','saltik-dodge','enemy-saltik','combat-blast','destructibles','boss','drones','enemies','wreck','ground-surface','cliff-texture','ruins-atlas'].map(name=>new Promise((resolve,reject)=>{
    const image=new Image(),required=REQUIRED_ART[name];image.decoding='async';
    image.onload=()=>{
      if(required&&(image.naturalWidth!==required.w||image.naturalHeight!==required.h)){
        delete images[name];reject(new Error(`${required.label} doit mesurer ${required.w} × ${required.h} pixels.`));return;
      }
      images[name]=image;resolve();
    };
    image.onerror=()=>{
      delete images[name];
      if(required)reject(new Error(`${required.label} n’a pas pu être chargé.`));
      else resolve();
    };
    image.src=new URL(`../assets/${name}.webp`,import.meta.url).href;
  })));
}
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function fern(c,x,y,size,color,lean=0){c.save();c.translate(x,y);c.rotate(lean);c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-size*.12,-size*.6,0,-size);c.stroke();for(let i=1;i<9;i++){const u=i/9,yy=-size*u,w=size*.32*(1-u);poly(c,[[0,yy],[w,yy-size*.2],[w*.75,yy-size*.025],[0,yy+3]],color);poly(c,[[0,yy],[-w,yy-size*.18],[-w*.8,yy],[0,yy+3]],color);}c.restore();}
function cover(c,img,x,y,w,h,alpha=1){if(!img)return;const s=Math.max(w/img.width,h/img.height),iw=img.width*s,ih=img.height*s;c.save();c.globalAlpha*=alpha;c.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih);c.restore();}
export function drawProjectile(c,s,camera,t){
  c.save();
  if(s.kind==='mirv'||s.kind==='homing'||s.kind==='enemy-missile'){
    const guided=s.kind==='homing',hostile=s.kind==='enemy-missile',trail=s.trail||[];
    for(let i=1;i<trail.length;i++){
      c.strokeStyle=hostile?`rgba(255,144,106,${i/trail.length*.42})`:guided?`rgba(234,198,147,${i/trail.length*.46})`:`rgba(111,229,250,${i/trail.length*.65})`;
      c.lineWidth=guided?2+i/trail.length*2:2;c.beginPath();c.moveTo(trail[i-1].x-camera,trail[i-1].y);c.lineTo(trail[i].x-camera,trail[i].y);c.stroke();
    }
    c.translate(s.x-camera,s.y);c.rotate(Math.atan2(s.vy,s.vx));c.scale(1.2,1.2);
    poly(c,[[-9,-4],[7,-4],[13,0],[7,4],[-9,4]],'#14233c');
    if(hostile){
      poly(c,[[-9,-3],[6,-3],[12,0],[6,3],[-9,3]],'#899976');
      poly(c,[[5,-3],[12,0],[5,3]],'#ff7157');
    }
    c.fillStyle=hostile?'#c2bd97':guided?'#dbddd1':'#c0e9ee';c.fillRect(-7,-2,hostile?11:14,4);
    c.fillStyle=hostile?'#d78048':guided?'#da8840':'#58bde7';c.fillRect(-4,-2,3,4);
    c.fillStyle=guided?'#929b91':'#416f96';c.fillRect(-10,-5,4,2);c.fillRect(-10,3,4,2);
    poly(c,[[-8,-3],[-22-Math.sin(t*70)*4,0],[-8,3]],hostile?'#ff8452':guided?'#ffa257':'#62dcf7');
    c.fillStyle='#fff4b7';c.fillRect(-13,-1,6,2);
    if(guided){c.fillStyle='#efffb9';c.fillRect(7,-1,3,2);}
  }else if(s.kind==='grenade'){
    c.strokeStyle='#ffd78388';c.lineWidth=2;c.beginPath();c.moveTo(s.x-camera-s.vx*.025,s.y-s.vy*.025);c.lineTo(s.x-camera,s.y);c.stroke();
    c.translate(s.x-camera,s.y);c.rotate((s.spin||0)+(s.age||0)*8);c.scale(1.25,1.25);
    c.fillStyle='#172039';c.fillRect(-4,-5,8,10);c.fillStyle='#e89c56';c.fillRect(-3,-4,6,8);
    c.fillStyle='#ffd486';c.fillRect(-3,-1,6,2);c.fillStyle='#ebf4d2';c.fillRect(-1,-6,2,2);
  }else{
    c.translate(s.x-camera,s.y);c.rotate(Math.atan2(s.vy,s.vx));
    const player=s.team==='player';
    poly(c,[[-15,-4],[4,-4],[12,0],[4,4],[-15,4]],player?'#ffd27440':'#ff9b674d');
    c.fillStyle=player?'#ffc66b':'#ec7846';c.fillRect(-15,-1,12,2);
    poly(c,[[-7,-3],[3,-3],[10,0],[3,3],[-7,3]],player?'#ffc65e':'#ff9b59');
    c.fillStyle=player?'#fff9d2':'#ffe6a5';c.fillRect(-6,-2,9,2);
    poly(c,[[3,-2],[8,0],[3,1]],'#fff7d5');
  }
  c.restore();
}
export function drawGuidedLocks(c,g,{camera=0,time=g.time??0}={}){
  const ids=new Set(g.projectiles.filter(s=>s.kind==='homing'&&s.team==='player'&&s.life>0).map(s=>s.targetId));
  const targets=[...g.enemies,...(g.boss?[g.boss]:[])].filter(e=>e.hp>0&&e.type!=='crate'&&ids.has(e.id));
  c.save();c.strokeStyle='#ff514c';c.lineWidth=1.6;c.globalAlpha=.8+Math.sin(time*8)*.14;
  c.shadowColor='#ff352e';c.shadowBlur=5;
  for(const e of targets){
    const b=combatBounds(e,time),x=b.x-camera-6,y=b.y-6,w=b.w+12,h=b.h+12,k=Math.min(12,w*.2);
    c.beginPath();
    for(const [px,py,sx,sy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]){
      c.moveTo(px,py+sy*k);c.lineTo(px,py);c.lineTo(px+sx*k,py);
    }
    c.stroke();
  }
  c.restore();return targets.length;
}
export function createRenderer(canvas){
  const c=canvas.getContext('2d',{alpha:false}),effects=createCombatEffects();let width=1280,height=720/BASE_ZOOM,dpr=1,camera=0,cameraY=height-720,zoom=BASE_ZOOM,presentationAge=0,particles=[],last=0,lastGameTime=null;
  function resize(){const r=canvas.getBoundingClientRect();dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);height=720/zoom;width=r.width/r.height*height;}
  resize();window.addEventListener('resize',resize);
  function addEvent(e){
    effects.add(e);
    if(e.type==='pod-destroyed')effects.add({...e,type:'explosion',x:e.x+60,y:e.y-35,radius:58,material:'metal'});
    if(e.type==='breach-shot')effects.add({...e,type:'intercept',x:e.x+(e.kind==='pod'?60:25),y:e.y-(e.kind==='pod'?35:5),radius:e.kind==='pod'?17:13,material:'metal'});
    if(['spark','damage','land','jump','repair','missile','homing','shift','cluster','shot','drop','melee-hit','dust'].includes(e.type)){
      const count=e.type==='repair'?20:e.type==='shot'?3:9;
      for(let i=0;i<count;i++){const angle=Math.random()*TAU,speed=20+Math.random()*110;particles.push({x:e.x,y:e.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-(e.type==='land'?20:40),life:.15+Math.random()*.35,maxLife:.5,size:2+Math.random()*4,color:e.type==='repair'?'#b7ef9c':['missile','shift'].includes(e.type)?'#9eeaff':['land','jump','dust'].includes(e.type)?'#b1b08a':['#ffe4a3','#ffac42','#ed642b'][i%3],smoke:['land','jump','dust'].includes(e.type)});}
    }
    if(particles.length>450)particles.splice(0,particles.length-450);
  }
  function sky(t){
    const bg=c.createLinearGradient(0,0,0,720);bg.addColorStop(0,'#a2c3bf');bg.addColorStop(.7,'#476b60');bg.addColorStop(1,'#15291f');c.fillStyle=bg;c.fillRect(0,0,width,720);
    if(images.canyon){const tileW=Math.max(width*1.13,1280),offset=-(camera*PARALLAX_LAYERS[0].speed)%tileW;c.save();c.globalAlpha=.91;for(let i=-1;i<3;i++){c.save();c.translate(offset+i*tileW,0);if(i%2){c.translate(tileW,0);c.scale(-1,1);}c.drawImage(images.canyon,0,0,images.canyon.width,images.canyon.height*.85,0,0,tileW,620);drawCanyonMotion(c,images.canyon,{x:0,y:0,w:tileW,h:620,time:t,sourceHeight:images.canyon.height*.85});c.drawImage(images.canyon,0,images.canyon.height*.85,images.canyon.width,images.canyon.height*.15,0,620,tileW,Math.max(100,tileW*images.canyon.height*.15/images.canyon.width));c.restore();}c.restore();}
    c.save();c.globalCompositeOperation='screen';const sun=c.createLinearGradient(width*.3,0,width*.7,700);sun.addColorStop(0,'#fff5bc26');sun.addColorStop(1,'#fff5bc00');poly(c,[[width*.22,-10],[width*.34,-10],[width*.85,720],[width*.62,720]],sun);poly(c,[[width*.4,-10],[width*.425,-10],[width*.92,720],[width*.84,720]],'#fff8c70a');c.restore();
  }
  function ruins(t){drawAncientRuins(c,images,camera,width,t);}
  function ground(t){drawNaturalGround(c,images,camera,width,t);}
  function routes(g,t){drawNaturalRoutes(c,images,g.platforms,camera,width,t);}
  function obstacle(o,time){drawObstacle(c,images,o,{camera,time});}
  function tachikoma(p,t,scale=1){drawTachikoma(c,images,p,t,{camera,scale});}
  function enemy(e,t){const x=e.x-camera,y=e.y;c.save();if(e.type==='saltik'&&e.guardFlash>0&&e.guardResponse==='dodge'){const a=Math.sin(clamp(e.guardFlash/.25,0,1)*Math.PI);c.translate(x,y);c.rotate(-.13*a*(e.dir??-1));c.scale(1-.12*a,1-.06*a);c.translate(-x,-y);}if(e.hit>0&&e.type!=='saltik')c.globalAlpha=.55;ellipse(c,x,(e.type==='drone'?terrainHeight(e.x):e.y)-2,e.type==='drone'?25:38,6,'#071a1766');
    if(e.type==='saltik'&&(drawEnemyDeflection(c,images,e,{camera})||drawEnemySaltik(c,images,e,t,{camera}))){
      if(e.attackPhase==='lock'){
        const progress=clamp(e.lockProgress??0,0,1);c.strokeStyle=`rgba(255,100,69,${.3+progress*.6})`;c.lineWidth=1.5;
        c.beginPath();c.arc(x,y-48,53+Math.sin(t*12)*2,-Math.PI*.5,-Math.PI*.5+TAU*progress);c.stroke();
      }
    }
    else if(e.type==='drone'){if(images.drones){const frame=Math.floor(t*6)%2;c.imageSmoothingEnabled=true;c.drawImage(images.drones,frame*384,0,384,512,x-160*.23,y-266*.23,384*.23,512*.23);}else{poly(c,[[x-37,y-7],[x-13,y-22],[x+26,y-15],[x+41,y+5],[x+7,y+16],[x-22,y+13]],'#683c39');c.fillStyle='#fd8e62';c.fillRect(x-21,y-5,15,5);}ellipse(c,x+13,y+29,12+Math.sin(t*40)*4,5,'#a2e7d888');}
    else if(enemyProfile(e.type)&&drawGroundEnemy(c,images,e,t,{camera})){}
    else if(e.type==='crate'){c.fillStyle='#233c31';c.fillRect(x-25,y-48,50,48);c.fillStyle='#829668';c.fillRect(x-23,y-46,46,4);c.fillRect(x-23,y-9,46,5);c.strokeStyle='#526e4c';c.lineWidth=4;c.strokeRect(x-22,y-42,44,34);c.fillStyle='#c7daa1';c.fillRect(x-3,y-35,7,22);c.fillRect(x-11,y-27,23,7);}
    else{poly(c,[[x-40,y],[x-28,y-27],[x+26,y-27],[x+40,y]],'#263b31');c.fillStyle='#4c6251';c.fillRect(x-23,y-55,46,30);c.fillStyle='#a99c6b';c.fillRect(x-20,y-55,40,7);c.fillStyle='#192924';c.fillRect(x-58,y-45,49,11);c.fillStyle='#e7a058';c.fillRect(x-26,y-45,6,6);c.fillStyle='#182720';c.fillRect(x-5,y-27,10,23);}
    if(e.cooldown<.45&&e.type!=='crate'){c.globalAlpha=.4+Math.sin(t*30)*.3;c.strokeStyle='#ff9c68';c.lineWidth=2;c.beginPath();c.arc(x,e.type==='drone'?y:y-40,41,0,TAU);c.stroke();}
    c.restore();if(e.hp<e.maxHp){c.fillStyle='#15271dcc';c.fillRect(x-25,y-(e.type==='drone'?42:88),50,4);c.fillStyle='#ef9d6b';c.fillRect(x-25,y-(e.type==='drone'?42:88),50*e.hp/e.maxHp,3);}}
  function boss(b,t,breach=null){drawBossTank(c,images,breach&&b?.hp<=0?{...b,hp:1}:b,{camera,time:t,breach});}
  function foreground(t){const speed=PARALLAX_LAYERS[7].speed;for(let n=Math.floor(camera*speed/230)-1;n<(camera*speed+width)/230+1;n++){const x=n*230-camera*speed,y=715+hash(n)*35;fern(c,x,y,70+hash(n+2)*85,'#0c211c',-.5+hash(n)*.8);fern(c,x+40,y+8,60+hash(n+4)*60,'#183b2b',.5);if(n%3===0)fern(c,x+70,y,90,'#254833',-.45);}const shade=c.createLinearGradient(0,600,0,720);shade.addColorStop(0,'#07171300');shade.addColorStop(1,'#061611a0');c.fillStyle=shade;c.fillRect(0,600,width,120);}
  function render(g,now,view='playing'){
    const wallDt=clamp((now-last)/1000,0,.05),simDt=lastGameTime===null?0:Math.max(0,g.time-lastGameTime);
    const terminal=view==='won'||view==='dead',dt=view==='title'||terminal?wallDt:simDt,t=view==='title'?now/1000:g.time;
    // Simulation time freezes every combat animation during pause. Once the
    // run ends, let its final fire and smoke dissipate behind the result panel.
    last=now;lastGameTime=g.time;effects.update(terminal?wallDt:simDt);
    if(view==='won')presentationAge+=wallDt;
    else if(view!=='paused')presentationAge=0;
    zoom=missionZoom({view,introDuration:g.introDuration,introElapsed:g.introElapsed,presentationAge});
    if(view==='title'){height=720/zoom;width=canvas.width/canvas.height*height;camera+=dt*15;cameraY=height-720;}
    else {
      const projection=projectMissionCamera({cssWidth:canvas.width,cssHeight:canvas.height,zoom,game:g,
        playerTop:tachikomaGeometry(g.player,g.time).top,view,intro:g.introDuration>0&&g.introElapsed<g.introDuration,
        dt,camera,cameraY,phone:canvas.clientWidth<900});
      ({width,height,camera,cameraY}=projection);
    }
    c.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);c.clearRect(0,0,width,720);c.save();if(g.shake>0&&view==='playing')c.translate(Math.sin(t*103)*g.shake*.45,Math.cos(t*119)*g.shake*.27);
    // Painted canyon, native landmarks, physical banks and actors keep their depth order.
    sky(t);c.save();c.translate(0,cameraY);ruins(t);if(view!=='title')drawRockButtresses(c,images,g.platforms,camera,width,t);ground(t);
    if(view!=='title'){
      routes(g,t);for(const o of g.obstacles)obstacle(o,t);
      for(const item of g.pickups){const x=item.x-camera,y=item.y+Math.sin(t*3+item.x)*5;c.save();c.shadowColor='#a4e58f';c.shadowBlur=16;c.strokeStyle='#b6dda0';c.lineWidth=2;c.strokeRect(x-16,y-15,32,30);c.fillStyle='#294b35';c.fillRect(x-14,y-13,28,26);c.fillStyle='#d7edb2';c.fillRect(x-3,y-9,6,18);c.fillRect(x-9,y-3,18,6);c.restore();}
      for(const e of g.enemies)if((!g.duel||e.id!==g.duel.enemyId)&&e.hp>0&&e.x>camera-150&&e.x<camera+width+150)enemy(e,t);const staged=bossBreachVisual(g.bossBreach,g.boss,{camera});if(!staged?.paintsTank)boss(g.boss,t,g.bossBreach);const paired=drawBossBreach(c,images,g.bossBreach,g.boss,{camera});
      if(!paired&&g.status!=='dead'&&!(view==='won'&&drawVictory(c,images,g.player,{camera,age:presentationAge}))&&!drawDuelWorld(c,images,g.duel,{camera,width,height,cameraY})){const p=g.duel?.phase==='throw'?{...g.player,melee:{...g.player.melee,phase:'impact',elapsed:g.duel.elapsed}}:g.player;tachikoma(p,g.time);}
      drawNaturalForeground(c,images,g.platforms,camera,width,t);
      for(const s of g.projectiles)drawProjectile(c,s,camera,t);
      drawGuidedLocks(c,g,{camera,time:g.time});
      if(g.status==='playing'&&g.player.onGround&&Math.abs(g.player.vx)>40&&Math.random()<dt*25)particles.push({x:g.player.x-g.player.dir*60,y:g.player.y-7,vx:-g.player.vx*.1,vy:-15-Math.random()*15,life:.6,maxLife:.6,size:4+Math.random()*5,color:'#a6aa7d',smoke:true});
    }
    effects.draw(c,images,{camera});
    for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(!p.smoke)p.vy+=dt*240;c.globalAlpha=clamp(p.life/p.maxLife,0,.9);c.fillStyle=p.smoke?'#647363':p.color;if(p.smoke)ellipse(c,p.x-camera,p.y,p.size*(1.5-p.life),p.size*(1.3-p.life),c.fillStyle);else c.fillRect(p.x-camera,p.y,p.size,p.size);}particles=particles.filter(p=>p.life>0);c.globalAlpha=1;
    foreground(t);c.restore();c.restore();
    if(view==='title'){
      const scale=width>1100?2.45:1.85,heroX=width*.74,heroY=570;c.save();const light=c.createRadialGradient(heroX,heroY-60,10,heroX,heroY-50,280);light.addColorStop(0,'#e5b24d20');light.addColorStop(1,'#e5b24d00');c.fillStyle=light;c.fillRect(heroX-300,heroY-300,600,500);c.restore();tachikoma({x:heroX+camera,y:heroY,dir:1,onGround:true,vx:45,vy:0,invulnerable:0},t,scale);
    }
    const vignette=c.createRadialGradient(width*.5,330,190,width*.5,360,Math.max(width*.66,700));vignette.addColorStop(0,'#07181300');vignette.addColorStop(1,'#04120d9c');c.fillStyle=vignette;c.fillRect(0,0,width,720);
    if(g.flash>0){c.fillStyle=`rgba(238,100,53,${g.flash*.4})`;c.fillRect(0,0,width,720);}
    // Floating spores are a screen-space lighting effect, not a depth plane.
    c.fillStyle='#e8edb3';for(let i=0;i<22;i++){c.globalAlpha=.2+hash(i)*.35;const x=(hash(i+81)*width+t*(5+hash(i)*12))%width,y=(hash(i+32)*720+Math.sin(t*.4+i)*20)%720;c.fillRect(x,y,1.5+hash(i)*2,1.5+hash(i)*2);}c.globalAlpha=1;
    if(view!=='title')drawDuelScreen(c,images,g.duel,{camera,cameraY,width,height});
  }
  return {render,addEvent,resize,reset(){zoom=BASE_ZOOM;height=720/zoom;width=canvas.width/canvas.height*height;camera=180-width*(canvas.clientWidth<900?.35:.29);cameraY=height-720;presentationAge=0;last=0;particles=[];lastGameTime=null;effects.reset();},get width(){return width;},get height(){return height;},get camera(){return camera;},get cameraY(){return cameraY;},get cameraZoom(){return zoom;},get presentationAge(){return presentationAge;},get effectCount(){return effects.count;}};
}
