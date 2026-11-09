import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderer,loadArt} from '../src/renderer.js';
import {createGame,surfaceHeight} from '../src/engine.js';

test('player and weapon flashes draw once in the ordinary entity layer without a rear-lane mask',async()=>{
  const previousWindow=globalThis.window,previousImage=globalThis.Image;
  globalThis.window={devicePixelRatio:1,addEventListener(){}};
  globalThis.Image=class {
    set src(url){
      this.asset=new URL(url).pathname.split('/').at(-1).replace(/\.(png|webp)$/,'');
      [this.width,this.height]=this.asset==='saltik-evasion'?[1254,1254]:['wreck','ground-surface'].includes(this.asset)?[2172,724]:[1536,1024];
      this.naturalWidth=this.width;this.naturalHeight=this.height;queueMicrotask(()=>this.onload());
    }
  };
  let state={nearRoof:false},stack=[];const events=[],gradient={addColorStop(){}},noop=()=>{};
  const context=new Proxy({
    globalAlpha:1,createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,
    save(){stack.push({...state});},restore(){assert.ok(stack.length,'balanced Canvas save/restore');state=stack.pop();},
    clip(rule){if(rule==='evenodd'){state.nearRoof=true;events.push({type:'mask'});}},
    drawImage(sheet){if(sheet.asset?.startsWith('tachikoma'))events.push({type:'player',clipped:state.nearRoof});else if(sheet.asset==='enemies')events.push({type:'enemy',clipped:state.nearRoof});},
    fill(){if(['#73e3ff','#ff9b36'].includes(this.fillStyle))events.push({type:'flash',clipped:state.nearRoof});},
    fillRect(){if(this.fillStyle==='#fff9d2')events.push({type:'projectile',clipped:state.nearRoof});}
  },{get(target,key){return key in target?target[key]:noop;}});
  const canvas={width:1280,height:720,clientWidth:1280,getContext:()=>context,getBoundingClientRect:()=>({width:1280,height:720})};
  try{
    await loadArt();const renderer=createRenderer(canvas),g=createGame(),p=g.player;
    g.obstacles=[];g.pickups=[];const middle=g.platforms.find(a=>a.tier===1);
    p.x=1700;p.y=surfaceHeight(middle,p.x);p.supportY=p.y;p.platformId=middle.id;p.tier=1;p.muzzle=.05;p.mirvFlash=.1;
    g.enemies=[{type:'walker',x:p.x+60,y:p.y,hp:5,maxHp:5,cooldown:2,phase:0,vx:0}];
    g.projectiles=[{kind:'bullet',team:'player',x:p.x+100,y:p.y-40,vx:1025,vy:0}];
    let now=1000;renderer.render(g,now);
    for(let i=0;i<24;i++){g.time+=1/60;renderer.render(g,now+=1000/60);}
    for(const [depth,shiftIn] of [[1,1],[.5,.5],[0,.1],[0,0]]){
      events.length=0;p.depth=depth;p.shiftIn=shiftIn;g.time+=.05;renderer.render(g,now+=50);
      const player=events.find(e=>e.type==='player'),enemy=events.find(e=>e.type==='enemy'),projectile=events.find(e=>e.type==='projectile'),flashes=events.filter(e=>e.type==='flash');
      assert.ok(player&&enemy&&projectile,'fixture renders every actor class');assert.equal(flashes.length,2);
      assert.equal(player.clipped,false);for(const flash of flashes)assert.equal(flash.clipped,false);
      assert.equal(enemy.clipped,false);assert.equal(projectile.clipped,false);
      assert.ok(events.filter(e=>e.type==='mask').every(e=>events.indexOf(e)<events.indexOf(enemy)),
        'natural arch aperture clips finish before the ordinary entity layer');
      assert.ok(events.indexOf(player)>events.indexOf(enemy),'player stays in the ordinary actor layer');
      assert.equal(state.nearRoof,false,'mask restored before subsequent drawing');assert.equal(stack.length,0);
    }
  }finally{
    if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;
    if(previousImage===undefined)delete globalThis.Image;else globalThis.Image=previousImage;
  }
});
