import test from 'node:test';import assert from 'node:assert/strict';
import {loadArt,createRenderer} from '../src/ink-renderer.js';
import {setInkTerrainTexture,setInkLandmarkArt} from '../src/ink-world.js';
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
test('defeated Ink player keeps its intact native body without an explosion or live pose mutation',async()=>{
 const visible=[];
 function context(owner){return new Proxy({globalAlpha:1,drawImage(source){if(!owner.tag)owner.tag=source.tag;visible.push(source.tag);},getImageData(){return{data:new Uint8ClampedArray(4)};},createRadialGradient(){return{addColorStop(){}};},createLinearGradient(){return{addColorStop(){}};},createPattern(){return{};}},{get:(o,k)=>k in o?o[k]:()=>{}});}
 function canvas(){const c={width:1280,height:720,clientWidth:1280,getBoundingClientRect(){return{width:1280,height:720};}};c.ctx=context(c);c.getContext=()=>c.ctx;return c;}
 const doc=globalThis.document,img=globalThis.Image;
 try{
  globalThis.document={createElement:()=>canvas()};globalThis.Image=class{constructor(){this.width=this.naturalWidth=1536;this.height=this.naturalHeight=1024;}set src(v){this._src=v;this.tag=v.split('/').at(-1);if(v)queueMicrotask(()=>this.onload?.());}get src(){return this._src;}};
  await loadArt();const g=createInkScene();Object.assign(g,{schedule:[],enemies:[],obstacles:[],platforms:[],pickups:[],groundAt:()=>600});Object.assign(g.player,{x:8700,y:600,supportY:600,hp:1,invulnerable:0});g.maxX=8700;
  const renderer=createRenderer(canvas());visible.length=0;renderer.render(g,1000,'playing');assert.ok(visible.includes('modern-striker-atlas.png'));
  g.projectiles=[{id:99,team:'enemy',kind:'plasma',x:8700,y:565,vx:0,vy:0,damage:100,radius:5,life:1}];updateInkScene(g,{},1/60);assert.equal(g.status,'dead');assert.equal(g.player.knockedOut,true);assert.equal(g.events.some(e=>e.type==='explosion'),false);
  const before=structuredClone(g.player);visible.length=0;renderer.render(g,1017,'dead');assert.ok(visible.includes('modern-striker-atlas.png'),'defeated Ink Saltik retains its intact native body');assert.deepEqual(g.player,before);
 }finally{setInkTerrainTexture(null);setInkLandmarkArt({});if(doc===undefined)delete globalThis.document;else globalThis.document=doc;if(img===undefined)delete globalThis.Image;else globalThis.Image=img;}
});
