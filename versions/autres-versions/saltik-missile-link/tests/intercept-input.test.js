import test from 'node:test';
import assert from 'node:assert/strict';
import {createInput,bindButton,KEY_ACTIONS} from '../src/input.js';

class Button{
  constructor(){this.dataset={action:'intercept'};this.disabled=false;this.listeners=new Map();this.classList={toggle(){}};}
  addEventListener(type,listener){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(listener);}
  setAttribute(){}setPointerCapture(){}releasePointerCapture(){}
  send(type,props={}){for(const listener of this.listeners.get(type)??[])listener({type,pointerId:1,button:0,preventDefault(){},stopPropagation(){},...props});}
}

test('a released interception tap survives one step and holding cannot create a second press',()=>{
  assert.equal(KEY_ACTIONS.KeyN,'intercept');
  const input=createInput();input.set('fire-key','fire',true);
  input.set('alert','intercept',true);input.set('alert','intercept',false);
  assert.equal(input.actions.intercept,false);
  let step=input.consume();assert.equal(step.intercept,true);assert.equal(step.interceptPressed,true);assert.equal(step.fire,true);
  step=input.consume();assert.equal(step.intercept,false);assert.equal(step.interceptPressed,false);
  input.set('alert','intercept',true);assert.equal(input.consume().interceptPressed,true);
  for(let i=0;i<10;i++){input.set('alert','intercept',true);step=input.consume();assert.equal(step.intercept,true);assert.equal(step.interceptPressed,false);}
  input.set('alert','intercept',false);input.set('alert','intercept',true);assert.equal(input.consume().interceptPressed,true);
  input.clear();step=input.consume();assert.equal(step.intercept,false);assert.equal(step.interceptPressed,false);
});

test('cooldown-disabled alert rejects pointer and focused keyboard presses',()=>{
  const before=globalThis.window;globalThis.window=new Button();
  try{
    const input=createInput(),button=new Button();let unlocked=0;
    bindButton(button,input,()=>true,()=>unlocked++);button.disabled=true;
    button.send('pointerdown');button.send('pointerup');button.send('keydown',{code:'Enter'});button.send('keyup',{code:'Enter'});
    assert.equal(input.consume().intercept,false);assert.equal(unlocked,0);
    button.disabled=false;button.send('keydown',{code:'Enter',repeat:true});assert.equal(input.consume().intercept,false);
    button.send('keydown',{code:'Enter',repeat:false});assert.equal(input.consume().interceptPressed,true);
    button.send('keydown',{code:'Enter',repeat:true});assert.equal(input.consume().interceptPressed,false);
  }finally{globalThis.window=before;}
});

test('canceling an alert touch or clearing its binding discards the queued interception',()=>{
  const before=globalThis.window;globalThis.window=new Button();
  try{
    const input=createInput(),button=new Button(),binding=bindButton(button,input,()=>true,()=>{});
    input.set('fire-key','fire',true);
    for(const type of ['pointercancel','lostpointercapture']){
      button.send('pointerdown');button.send(type);assert.equal(input.consume().intercept,false,type);assert.equal(input.actions.fire,true);
    }
    button.send('pointerdown');binding.clear();assert.equal(input.consume().intercept,false);assert.equal(input.actions.fire,true);
    button.send('pointerdown');button.send('pointerup');assert.equal(input.consume().interceptPressed,true,'a completed quick tap still arms');
  }finally{globalThis.window=before;}
});
