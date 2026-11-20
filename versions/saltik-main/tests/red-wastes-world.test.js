import test from 'node:test';import assert from 'node:assert/strict';
import {drawRedWastesWorld} from '../src/red-wastes-world.js';
import {createInkScene} from '../src/ink-scene.js';
test('native terrain rendering remains bounded and finite while the camera crosses fractional tile seams',()=>{
 const g=createInkScene({level:5}),images={'red-wastes-sand-plane':{width:2172,height:724},'red-wastes-skull':{width:1536,height:1024},'red-wastes-bunker':{width:2172,height:724}};
 for(const camera of [14.617535054032224,100.01,1456.2988,3400.8741,3960-1e-9,3960+1e-9,...Array.from({length:50},(_,i)=>i*467.3)]){
  let paints=0;const c=new Proxy({},{get:(_,key)=>(...args)=>{if(key==='drawImage'){assert(++paints<500,'unbounded terrain loop at '+camera);assert(args.slice(1).every(Number.isFinite));}},set:()=>true});
  drawRedWastesWorld(c,images,g,{camera,width:1108.2,height:900,time:0});assert(paints>20&&paints<500);
 }
});
