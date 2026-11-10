import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene} from '../src/ink-scene.js';
import {lunarGroundAt,LUNAR_GAPS,LUNAR_END} from '../src/lunar-level.js';
import {drawLunarBackdrop,drawLunarWorld,drawLunarForeground} from '../src/lunar-world.js';

function recordingCanvas(){
 const calls={paths:0,images:[],rects:0};
 const stack=[];const context=new Proxy({globalAlpha:1,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop()??1;},createLinearGradient:()=>({addColorStop(){}})},{
  get(target,key){
   if(key in target)return target[key];
   if(key==='drawImage')return (...args)=>{assert.ok(args.slice(1).every(Number.isFinite),'native scenery projection stays finite');args.opacity=target.globalAlpha;calls.images.push(args);};
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
test('one opaque near island moves independently of the cohesive painting without a wrap jump',()=>{
 const sky={width:1672,height:941},layers={width:1921,height:819};
 const paint=camera=>{
  const {context,calls}=recordingCanvas();
  drawLunarBackdrop(context,{camera,width:1280,height:720,time:0,image:sky,layers});
  return calls.images;
 };
 const a=paint(3990),b=paint(4010);
 const skyShift=b.find(d=>d[0]===sky)[1]-a.find(d=>d[0]===sky)[1];
 const firstFace=a.find(d=>d[0]===layers&&d[1]===920),nextFace=b.find(d=>d[0]===layers&&d[1]===920);
 assert.ok(firstFace&&nextFace,'the near island is an actual independent cutout');
 const faceShift=nextFace[5]-firstFace[5];
 assert.ok(Math.abs(skyShift)<1,'the far moon plate must never jump at an old modulo boundary');
 assert.ok(Math.abs(faceShift)>Math.abs(skyShift),'nearer islands must visibly move against the sky');
});
test('illustrated scenery renders on distinct physical planes with finite projections throughout the route',()=>{
 const g=createInkScene({level:2});
 const art={atlas:{width:1536,height:1024},bridge:{width:1774,height:887}},sky={width:1672,height:941},layers={width:1921,height:819};
 for(const camera of [0,4200,9200,16600]){
  const {context,calls}=recordingCanvas();
  drawLunarBackdrop(context,{camera,width:1280,height:720,time:3,image:sky,layers,art});
  const background=calls.images.length;
  drawLunarWorld(context,g,{camera,width:1280,time:3,texture:null,art});
  assert.ok(calls.images.length>background,'actual world monuments must supplement the distant illustration');
  drawLunarForeground(context,{camera,width:1280,time:3,art});
  assert.ok(background>=2,'the coherent sky and one opaque near island establish depth');
  assert.ok(calls.images.every(args=>[art.atlas,art.bridge,sky,layers].includes(args[0])),'only loaded illustrated scenery is sampled');
 }
});

test('background architecture never uses semitransparent building overlays',()=>{
 const {context,calls}=recordingCanvas();
 drawLunarBackdrop(context,{camera:2000,width:1280,height:720,time:3,image:{width:1672,height:941},layers:{width:1921,height:819},art:{atlas:{width:1536,height:1024},bridge:{width:1774,height:887}}});
 assert.ok(calls.images.length>=1);assert.ok(calls.images.every(d=>d.opacity===1));
});
