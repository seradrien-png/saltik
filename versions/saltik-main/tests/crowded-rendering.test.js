import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene} from '../src/ink-scene.js';
import {drawInkGround,drawInkRoutes,drawInkObstacles,setInkTerrainTexture,setInkLandmarkArt} from '../src/ink-world.js';
import {INK_WORLD_ART,inkLandmarkArt} from '../src/ink-campaign-art.js';
import {drawInkEnemy} from '../src/ink-actors.js';
import {drawInkEnemySaltik} from '../src/ink-enemy-saltik.js';
import {INK_ART_NAMES} from '../src/ink-renderer.js';

function context(){
 const images=[],filters=[];let filter='none';
 const c=new Proxy({globalAlpha:1,drawImage(...args){images.push(args);},get filter(){return filter;},set filter(v){filter=v;filters.push(v);}}, {get:(target,key)=>key in target?target[key]:()=>{}});
 return {c,images,filters};
}
function surfaces(run){
 const previous=globalThis.OffscreenCanvas,allocated=[];
 globalThis.OffscreenCanvas=class {constructor(w,h){this.width=w;this.height=h;this.context=context();allocated.push(this);}getContext(){return this.context.c;}};
 try{return run(allocated);}finally{if(previous===undefined)delete globalThis.OffscreenCanvas;else globalThis.OffscreenCanvas=previous;}
}

test('native checkpoint and terrain remain warm together within the existing pixel budget',()=>surfaces(allocated=>{
 const g=createInkScene(),image={width:2048,height:1024},art=inkLandmarkArt(Object.fromEntries(Object.values(INK_WORLD_ART).map(d=>[d.asset,image]))),opts={camera:9850,width:1390,height:900},c=context().c;
 setInkTerrainTexture(image);setInkLandmarkArt(art);
 try{
  const frame=()=>{drawInkRoutes(c,g,opts);drawInkGround(c,g,opts);drawInkObstacles(c,g,opts);};
  frame();const warm=allocated.length;frame();
  assert.equal(allocated.length,warm,'an unchanged visible checkpoint must reuse every cached surface');
  assert.ok(allocated.reduce((n,s)=>n+s.width*s.height,0)<=5500000,'warm checkpoint surfaces fit the bounded cache');
 }finally{setInkLandmarkArt({});setInkTerrainTexture(null);}
}));

test('repeated hits reuse bright native source pixels without applying a live image filter',()=>surfaces(allocated=>{
 const image={width:2172,height:724};
 for(const type of ['walker','drone','turret','soldier']){
  const e={id:1,type,x:400,y:500,hp:30,hit:.08,vx:0,dir:1};
  const first=context();drawInkEnemy(first.c,image,e,{time:1});
  const second=context();drawInkEnemy(second.c,image,e,{time:1});
  const normal=context();drawInkEnemy(normal.c,image,{...e,hit:0},{time:1});
  assert.ok(!second.filters.includes('brightness(1.4)'),'hit tint is baked once, outside the animation frame');
  assert.ok(second.images.some(([source])=>source!==image),'the same native cutout uses cached bright pixels');
  assert.deepEqual(second.images.map(draw=>draw.slice(1)),normal.images.map(draw=>draw.slice(1)),'bright frames retain every native crop and destination coordinate');
 }
 const saltikImage={width:1983,height:793},e={id:2,x:600,y:500,hp:30,hit:.08,vx:30,dir:1};
 const first=context();drawInkEnemySaltik(first.c,saltikImage,e,{time:1});
 const warm=allocated.length,second=context();drawInkEnemySaltik(second.c,saltikImage,e,{time:1});
 assert.equal(allocated.length,warm,'all articulated parts reuse the same bright atlas');
 assert.ok(!second.filters.includes('brightness(1.4)'));
 assert.ok(second.images.length>10,'articulated limbs and native launchers are retained');
 assert.ok(allocated.reduce((n,s)=>n+s.width*s.height,0)<=3200000,'both native bright atlases have a fixed pixel bound');
}));

test('the carrier manifest loads only the approved intact support DR-01 atlas',()=>{
 assert.ok(INK_ART_NAMES.includes('ink-carrier-raised-dr01'));
 assert.ok(!INK_ART_NAMES.includes('ink-carrier-two-eyes-dr01'));
 assert.ok(!INK_ART_NAMES.includes('ink-carrier-profile-dr01'));
 assert.ok(!INK_ART_NAMES.includes('ink-carrier-dr01'));
 assert.ok(!INK_ART_NAMES.includes('ink-carrier-platform'));
 assert.ok(!INK_ART_NAMES.includes('ink-carrier'));
});
