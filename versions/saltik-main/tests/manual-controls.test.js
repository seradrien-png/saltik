import test from 'node:test';
import assert from 'node:assert/strict';
import {createInput,KEY_ACTIONS} from '../src/input.js';
import {createRenderer} from '../src/renderer.js';

test('only held ESQUIVE protects the player while weapon pointers stay independent',()=>{
 const input=createInput();assert.equal(KEY_ACTIONS.KeyH,undefined);
 input.set('finger','fire',true);input.set('key','shift',true);input.set('key','shift',false);
 assert.equal(input.consume().shift,false);assert.equal(input.actions.fire,true);
 input.set('key','shift',true);assert.equal(input.consume().shift,true);
 input.clear();assert.equal(input.consume().shift,false);assert.equal(input.actions.fire,false);
});
test('scene zoom includes the additional five percent while publishing the actual reduced viewport',()=>{
 const old=globalThis.window;globalThis.window={devicePixelRatio:1,addEventListener(){}};
 const ctx=new Proxy({}, {get:()=>()=>{}});
 try{
  const canvas={width:0,height:0,clientWidth:1280,getContext:()=>ctx,getBoundingClientRect:()=>({width:1280,height:720})};
  const r=createRenderer(canvas);assert.ok(Math.abs(r.height-720/1.155)<1e-8);assert.ok(Math.abs(r.width-1280/1.155)<1e-8);
  r.reset();assert.ok(Math.abs((720+r.cameraY)-r.height)<1e-8,'ground reference stays anchored at the bottom after zoom');
 }finally{if(old===undefined)delete globalThis.window;else globalThis.window=old;}
});
