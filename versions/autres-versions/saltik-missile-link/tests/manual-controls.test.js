import test from 'node:test';
import assert from 'node:assert/strict';
import {createInput,KEY_ACTIONS} from '../src/input.js';
import {createRenderer} from '../src/renderer.js';

test('manual H deflection buffers one tap, stays held and clears on pause independently of fire',()=>{
 const input=createInput();assert.equal(KEY_ACTIONS.KeyH,'deflect');
 input.set('finger','fire',true);input.set('key','deflect',true);input.set('key','deflect',false);
 assert.equal(input.consume().deflect,true);assert.equal(input.consume().deflect,false);assert.equal(input.actions.fire,true);
 input.set('key','deflect',true);assert.equal(input.consume().deflect,true);
 input.clear();assert.equal(input.consume().deflect,false);assert.equal(input.actions.fire,false);
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
