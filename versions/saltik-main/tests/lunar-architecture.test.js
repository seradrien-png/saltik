import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene} from '../src/ink-scene.js';
import {lunarGroundAt,LUNAR_GAPS,LUNAR_END} from '../src/lunar-level.js';
import {drawLunarBackdrop,drawLunarWorld,drawLunarForeground} from '../src/lunar-world.js';

function recordingCanvas(){
 const calls={paths:0,images:0,rects:0};
 const context=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{
  get(target,key){
   if(key in target)return target[key];
   if(key==='drawImage')return ()=>calls.images++;
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
test('architectural depth, solid ground and foreground paint at several camera positions',()=>{
 const g=createInkScene({level:2});
 for(const camera of [0,4200,9200,16600]){
  const {context,calls}=recordingCanvas();
  drawLunarBackdrop(context,{camera,width:1280,height:720,time:3,image:null});
  drawLunarWorld(context,g,{camera,width:1280,time:3,texture:null});
  drawLunarForeground(context,{camera,width:1280,time:3});
  assert.ok(calls.paths>40,'architecture, ground and foreground must share the view');
  assert.ok(calls.rects>15,'monument facades and ground need substantial forms');
 }
});
