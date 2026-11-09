import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderer,loadArt} from '../src/renderer.js';
import {createGame} from '../src/engine.js';

test('winning renderer keeps the canonical native body while the simulation clock is stopped',async()=>{
  const oldWindow=globalThis.window,oldImage=globalThis.Image;
  globalThis.window={devicePixelRatio:1,addEventListener(){}};
  globalThis.Image=class{
    set src(url){
      this.asset=new URL(url).pathname.split('/').at(-1).replace('.webp','');
      [this.width,this.height]=this.asset==='saltik-evasion'?[1254,1254]:['wreck','ground-surface'].includes(this.asset)?[2172,724]:[1536,1024];
      this.naturalWidth=this.width;this.naturalHeight=this.height;queueMicrotask(()=>this.onload());
    }
  };
  let foreignCalls=0;const poses=new Set(),gradient={addColorStop(){}},noop=()=>{};
  const context=new Proxy({globalAlpha:1,
    createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,
    drawImage(image,sx,sy,sw,sh){if(image.asset==='tachikoma')poses.add(`${sx},${sy},${sw},${sh}`);if(image.asset==='saltik-victory')foreignCalls++;},
  },{get:(target,key)=>key in target?target[key]:noop});
  const canvas={width:1280,height:720,clientWidth:1280,getContext:()=>context,getBoundingClientRect:()=>({width:1280,height:720})};
  try{
    await loadArt();const renderer=createRenderer(canvas),g=createGame();
    g.status='won';g.boss=null;g.enemies=[];g.obstacles=[];g.pickups=[];g.projectiles=[];
    const stoppedTime=g.time;
    for(let frame=0;frame<120;frame++)renderer.render(g,1000+frame*1000/60,'won');
    assert.equal(g.time,stoppedTime);
    assert.deepEqual([...poses],['20,603,373,339']);assert.equal(foreignCalls,0);
  }finally{
    if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;
    if(oldImage===undefined)delete globalThis.Image;else globalThis.Image=oldImage;
  }
});
