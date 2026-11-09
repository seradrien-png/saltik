import test from 'node:test';
import assert from 'node:assert/strict';
import {BASE_ZOOM,CLOSE_ZOOM,MOVE_DURATION,missionZoom,projectMissionCamera} from '../src/mission-camera.js';
import {createRenderer} from '../src/renderer.js';
import {createGame} from '../src/engine.js';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const game={player:{x:180,y:690},duel:null,boss:null,time:0};
test('deep lunar lower paths keep Striker feet inside desktop and phone views',()=>{
 for(const [cssWidth,cssHeight] of [[1366,768],[844,390]]){
  const g={...game,level:2,player:{x:1500,y:880}};
  const p=projectMissionCamera({cssWidth,cssHeight,zoom:BASE_ZOOM,game:g,playerTop:760,dt:1,camera:0,cameraY:0});
  assert.ok(g.player.y+p.cameraY<=p.height-60,'lower path must stay fully visible');
  assert.ok(760+p.cameraY>=85,'native pod keeps its HUD margin');
 }
});

test('mission zoom starts close, eases to 1.155 in 2.2 seconds, and reverses at victory',()=>{
  near(BASE_ZOOM,1.155);near(MOVE_DURATION,2.2);
  near(missionZoom({introDuration:2.2,introElapsed:0}),CLOSE_ZOOM);
  assert.ok(missionZoom({introDuration:2.2,introElapsed:1.1})<CLOSE_ZOOM);
  assert.ok(missionZoom({introDuration:2.2,introElapsed:1.1})>BASE_ZOOM);
  near(missionZoom({introDuration:2.2,introElapsed:2.2}),BASE_ZOOM);
  near(missionZoom({view:'won',presentationAge:0}),BASE_ZOOM);
  near(missionZoom({view:'won',presentationAge:2.2}),CLOSE_ZOOM);
  near(missionZoom({view:'dead',presentationAge:2.2}),BASE_ZOOM);
});

test('intro projection centers the physical Saltik and keeps its pod and feet in a phone viewport',()=>{
  for(const [cssWidth,cssHeight] of [[1280,720],[667,375],[844,390]]){
    const p=projectMissionCamera({cssWidth,cssHeight,zoom:CLOSE_ZOOM,game,playerTop:590,view:'playing',intro:true,dt:0,camera:0,cameraY:0});
    near(p.height,720/CLOSE_ZOOM);near(p.width,cssWidth/cssHeight*p.height);
    near(game.player.x-p.camera,p.width*.5);
    assert.ok(590+p.cameraY>=0,'pod visible');
    assert.ok(game.player.y+p.cameraY<=p.height,'physical feet visible');
  }
});

test('ordinary camera reserves 85 world units above the highest native pod, and reset has no stale interpolation',()=>{
  const high={...game,player:{x:10500,y:110}};
  const p=projectMissionCamera({cssWidth:1280,cssHeight:720,zoom:BASE_ZOOM,game:high,playerTop:4,view:'playing',dt:1/60,camera:0,cameraY:-97});
  assert.ok(4+p.cameraY>=85);
  const fresh=projectMissionCamera({cssWidth:1280,cssHeight:720,zoom:BASE_ZOOM,game,playerTop:590,view:'playing',dt:0,camera:0,cameraY:720/BASE_ZOOM-720});
  near(fresh.height,720/BASE_ZOOM);
});

test('actual renderer projection follows intro simulation, freezes on pause, reverses on win, then resets',()=>{
  const previous=globalThis.window;globalThis.window={devicePixelRatio:1,addEventListener(){}};
  const gradient={addColorStop(){}},noop=()=>{},transforms=[];
  const context=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,
    setTransform(...args){transforms.push(args);},globalAlpha:1},{get(target,key){return key in target?target[key]:noop;}});
  const canvas={width:667,height:375,clientWidth:667,getContext:()=>context,getBoundingClientRect:()=>({width:667,height:375})};
  try{
    const r=createRenderer(canvas),g=createGame();g.introDuration=2.2;g.introElapsed=0;
    r.render(g,1000);near(r.cameraZoom,CLOSE_ZOOM);
    near(r.height,720/CLOSE_ZOOM);near(transforms.at(-1)[0],CLOSE_ZOOM*375/720);
    const x=r.camera,y=r.cameraY;
    r.render(g,5000,'paused');near(r.cameraZoom,CLOSE_ZOOM);near(r.camera,x);near(r.cameraY,y);
    g.introElapsed=1.1;g.time=1.1;r.render(g,5100);assert.ok(r.cameraZoom<CLOSE_ZOOM);
    g.introElapsed=2.2;g.time=2.2;r.render(g,5200);near(r.cameraZoom,BASE_ZOOM);
    g.status='won';r.render(g,5300,'won');assert.ok(r.presentationAge>0);
    for(let frame=1;frame<=140;frame++)r.render(g,5300+frame*1000/60,'won');
    near(r.cameraZoom,CLOSE_ZOOM);assert.ok(r.presentationAge>=2.2);
    r.reset();near(r.cameraZoom,BASE_ZOOM);near(r.presentationAge,0);
    r.render(g,9000,'title');near(r.cameraZoom,BASE_ZOOM);
  }finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
});
