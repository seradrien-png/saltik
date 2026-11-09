import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderer} from '../src/renderer.js';
import {createGame,update,surfaceHeight} from '../src/engine.js';
import {tachikomaGeometry} from '../src/tachikoma-pose.js';

test('an actual top-route jump keeps the entire pod silhouette inside the viewport',()=>{
  const previous=globalThis.window;
  globalThis.window={devicePixelRatio:1,addEventListener(){}};
  const gradient={addColorStop(){}},noop=()=>{},context=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,globalAlpha:1},{get(target,key){return key in target?target[key]:noop;}});
  const canvas={width:1280,height:720,clientWidth:1280,getContext:()=>context,getBoundingClientRect:()=>({width:1280,height:720})};
  try{
    const renderer=createRenderer(canvas),g=createGame();g.schedule=[];g.obstacles=[];
    const p=g.player,route=g.platforms.find(a=>a.tier===2);p.x=route.x1+300;p.platformId=route.id;p.tier=2;p.y=surfaceHeight(route,p.x);p.supportY=p.y;
    assert.equal(renderer.cameraY,renderer.height-720);
    let maximum=0;
    for(let frame=0;frame<75;frame++){
      update(g,{jump:frame===0},1/60);renderer.render(g,(frame+1)*1000/60);
      const top=tachikomaGeometry(p,g.time).top;
      assert.ok(top+renderer.cameraY>=84.99,`head clipped at ${top+renderer.cameraY}`);
      maximum=Math.max(maximum,renderer.cameraY);
    }
    assert.ok(maximum>40&&maximum<360);assert.ok(renderer.cameraY<maximum);
    renderer.reset();assert.equal(renderer.cameraY,renderer.height-720);
  }finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
});

test('the deterministic rear balance on the highest real roof keeps its native body below the HUD',()=>{
  const previous=globalThis.window;globalThis.window={devicePixelRatio:1,addEventListener(){}};
  const gradient={addColorStop(){}},noop=()=>{},context=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,globalAlpha:1},{get(target,key){return key in target?target[key]:noop;}});
  const canvas={width:1280,height:720,clientWidth:1280,getContext:()=>context,getBoundingClientRect:()=>({width:1280,height:720})};
  try{
    const renderer=createRenderer(canvas),g=createGame();g.schedule=[];g.obstacles=[];
    const route=g.platforms.find(p=>p.id==='bridge-3'),p=g.player;
    Object.assign(p,{x:10460,platformId:route.id,tier:2,y:surfaceHeight(route,10460),supportY:surfaceHeight(route,10460)});
    let maximum=0;
    for(let frame=0;frame<75;frame++){
      update(g,{shift:frame===0},1/60);renderer.render(g,(frame+1)*1000/60);
      assert.ok(tachikomaGeometry(p,g.time).top+renderer.cameraY>=84.99,'rear-balance silhouette must remain below the HUD');
      maximum=Math.max(maximum,renderer.cameraY);
    }
    assert.ok(maximum>renderer.height-720,'the raised physical roof receives camera clearance');
  }finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
});
