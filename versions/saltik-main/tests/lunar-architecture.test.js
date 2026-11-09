import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene} from '../src/ink-scene.js';
import {lunarGroundAt,LUNAR_GAPS,LUNAR_END} from '../src/lunar-level.js';
import {drawLunarBackdrop,drawLunarWorld,drawLunarForeground} from '../src/lunar-world.js';

function recordingCanvas(){
 const calls={paths:0,images:[],rects:0};
 const context=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{
  get(target,key){
   if(key in target)return target[key];
   if(key==='drawImage')return (...args)=>{assert.ok(args.slice(1).every(Number.isFinite),'native scenery projection stays finite');calls.images.push(args);};
   if(key==='fillRect')return ()=>calls.rects++;
   if(key==='beginPath')return ()=>calls.paths++;
   return ()=>{};
  },
  set(target,key,val){target[key]=val;return true;}
 });
 return {context,calls};
}
test('lunar surface is continuous and visibly sculpted across its full length',()=>{
 assert.equal(LUNAR_GAPS.length,0);
 let min=Infinity,max=-Infinity;
 for(let x=0;x<=LUNAR_END;x+=5){
  const y=lunarGroundAt(x);
  assert.ok(Number.isFinite(y));
  assert.ok(Math.abs(lunarGroundAt(x+1)-y)<4);
  min=Math.min(min,y);max=Math.max(max,y);
 }
 assert.ok(max-min>75,'continuous lunar ridges should be sculpted, not flat');
});
test('animation can render before the asynchronous lunar illustrations finish loading',()=>{
 const {context,calls}=recordingCanvas(),art={atlas:undefined,bridge:undefined};
 drawLunarBackdrop(context,{camera:0,width:1280,height:720,time:0,image:null,art});
 drawLunarWorld(context,createInkScene({level:2}),{camera:0,width:1280,time:0,texture:null,art});
 drawLunarForeground(context,{camera:0,width:1280,time:0,art});
 assert.equal(calls.images.length,0,'unloaded images must never be passed to Canvas');
});
test('illustrated scenery renders on several depth planes with finite projections throughout the route',()=>{
 const g=createInkScene({level:2});
 const art={atlas:{width:1536,height:1024},bridge:{width:1774,height:887}};
 for(const camera of [0,4200,9200,16600]){
  const {context,calls}=recordingCanvas();
  drawLunarBackdrop(context,{camera,width:1280,height:720,time:3,image:null,art});
  const background=calls.images.length;
  drawLunarWorld(context,g,{camera,width:1280,time:3,texture:null,art});
  assert.ok(calls.images.length>background,'actual world monuments must supplement the distant illustration');
  drawLunarForeground(context,{camera,width:1280,time:3,art});
  assert.ok(background>=2,'several nearby city districts establish depth');
  assert.ok(calls.images.every(args=>[art.atlas,art.bridge].includes(args[0])),'only loaded illustrated scenery is sampled');
 }
});
