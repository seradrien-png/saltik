import test from 'node:test';
import assert from 'node:assert/strict';
import * as inputModule from '../src/input.js';
const {createInput}=inputModule;
test('releasing one finger never releases another finger or a held key',()=>{const input=createInput();input.set('touch:1','fire',true);input.set('key:J','fire',true);input.set('touch:2','right',true);input.set('touch:1','fire',false);assert.equal(input.actions.fire,true);assert.equal(input.actions.right,true);input.set('key:J','fire',false);assert.equal(input.actions.fire,false);});
test('clearing input on pause releases every held source',()=>{const input=createInput();input.set('touch:1','fire',true);input.set('key:D','right',true);assert.equal(input.actions.fire,true);input.clear();assert.equal(Object.values(input.actions).some(Boolean),false);});
test('descend has independent pointer ownership while driving and firing',()=>{const input=createInput();input.set('touch:1','right',true);input.set('touch:2','drop',true);input.set('touch:3','fire',true);assert.equal(input.actions.drop,true);input.set('touch:2','drop',false);assert.equal(input.actions.drop,false);assert.equal(input.actions.right,true);assert.equal(input.actions.fire,true);});
test('a diagonal pointer owns both actions and can slide without releasing another source',()=>{
  const input=createInput();
  assert.equal(typeof input.replace,'function','directional input must support atomic combinations');
  input.set('key:D','right',true);input.set('pointer:2','fire',true);input.set('pointer:3','missile',true);
  input.replace('pointer:1',['right','jump']);
  assert.deepEqual(input.actions,{left:false,right:true,jump:true,crouch:false,drop:false,fire:true,missile:true,homing:false,shift:false,deflect:false,qte:false,bossAction:false});
  input.replace('pointer:1',['left','crouch']);
  assert.deepEqual(input.actions,{left:true,right:true,jump:false,crouch:true,drop:false,fire:true,missile:true,homing:false,shift:false,deflect:false,qte:false,bossAction:false});
  input.replace('pointer:1',[]);
  assert.deepEqual(input.actions,{left:false,right:true,jump:false,crouch:false,drop:false,fire:true,missile:true,homing:false,shift:false,deflect:false,qte:false,bossAction:false});
});
test('leaving then returning to SAUT rearms jump while another finger keeps firing',()=>{
  const input=createInput();
  assert.equal(typeof input.replace,'function');
  input.set('pointer:2','fire',true);
  input.replace('pointer:1',['jump']);assert.equal(input.actions.jump,true);
  input.replace('pointer:1',['right']);assert.equal(input.actions.jump,false);
  input.replace('pointer:1',['jump']);assert.equal(input.actions.jump,true);
  input.clear();assert.equal(Object.values(input.actions).some(Boolean),false);
});
test('the directional grid resolves diagonal, center and off-pad positions',()=>{
  assert.equal(typeof inputModule.getPadCell,'function');
  const rect={left:10,top:20,width:162,height:162};
  const cases=[[20,30,0],[91,30,1],[160,30,2],[20,101,3],[91,101,4],[160,101,5],[20,170,6],[91,170,7],[160,170,8],[-30,100,-1],[90,220,-1]];
  for(const [x,y,want] of cases)assert.equal(inputModule.getPadCell(x,y,rect),want,`${x},${y}`);
});

test('a jump or descend tap released between simulation frames is consumed once',()=>{
  const input=createInput();
  input.set('weapon','fire',true);
  input.replace('thumb',['jump']);input.replace('thumb',[]);
  assert.equal(input.actions.jump,false);
  assert.equal(input.consume().jump,true);
  const next=input.consume();assert.equal(next.jump,false);assert.equal(next.fire,true);
  input.replace('thumb',['drop']);input.replace('thumb',[]);
  assert.equal(input.consume().drop,true);assert.equal(input.consume().drop,false);
});

test('pause clearing discards queued taps and held input remains held across steps',()=>{
  const input=createInput();
  input.replace('thumb',['jump']);assert.equal(input.consume().jump,true);assert.equal(input.consume().jump,true);
  input.replace('thumb',[]);assert.equal(input.consume().jump,false);
  input.replace('thumb',['jump']);input.replace('thumb',[]);input.clear();
  assert.equal(Object.values(input.consume()).some(Boolean),false);
});

test('QTE tap buffers once, held level persists, and clear discards queued input',()=>{
  const input=createInput();
  assert.equal(inputModule.KEY_ACTIONS.Space,'jump','QTE keyboard routing belongs to the active scene');
  assert.equal(inputModule.KEY_ACTIONS.Enter,undefined);
  input.set('qte-button','qte',true);input.set('qte-button','qte',false);
  assert.equal(input.actions.qte,false);assert.equal(input.consume().qte,true);assert.equal(input.consume().qte,false);
  input.set('qte-button','qte',true);assert.equal(input.consume().qte,true);
  input.set('qte-button','qte',true);assert.equal(input.consume().qte,true);
  input.set('qte-button','qte',false);assert.equal(input.consume().qte,false);
  input.set('qte-button','qte',true);input.set('qte-button','qte',false);input.clear();
  assert.equal(input.consume().qte,false);
});

test('original keyboard mapping restores crouch and ESQUIVE with independent MIRV, guided missiles and descend',()=>{
  const k=inputModule.KEY_ACTIONS;
  for(const key of ['ArrowDown','KeyS','KeyC'])assert.equal(k[key],'crouch');
  for(const key of ['Space','KeyZ','ArrowUp'])assert.equal(k[key],'jump');
  for(const key of ['ShiftLeft','ShiftRight','KeyF'])assert.equal(k[key],'shift');
  assert.equal(k.KeyK,'missile');assert.equal(k.KeyL,'homing');assert.equal(k.KeyR,'homing');
  assert.equal(k.KeyE,'drop');assert.equal(k.KeyJ,'fire');assert.equal(k.KeyX,'fire');
});

test('quick ESQUIVE release is not queued, while MIRV and GUIDÉS taps survive one simulation step',()=>{
  const input=createInput();
  for(const action of ['shift','missile','homing','fire']){
    input.set(action,action,true);input.set(action,action,false);
    assert.equal(input.actions[action],false);assert.equal(input.consume()[action],action==='shift'?false:true);assert.equal(input.consume()[action],false);
  }
  input.replace('weapons',['shift','missile','homing']);input.replace('weapons',[]);input.clear();
  assert.equal(Object.values(input.consume()).some(Boolean),false);
});

class Element{
  constructor(dataset={}){this.dataset=dataset;this.listeners=new Map();this.classList={toggle(){}};this.disabled=false;}
  addEventListener(type,listener){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(listener);}
  emit(type,values={}){const event={type,target:this,pointerId:1,button:0,preventDefault(){},stopPropagation(){},...values};for(const listener of this.listeners.get(type)||[])listener(event);}
  setAttribute(){}setPointerCapture(){}releasePointerCapture(){}
  closest(selector){return selector==='[data-action="shift"]'?this.dataset.action==='shift'?this:null:this.dataset.padActions?this:null;}
}

test('dragging through ESQUIVE is neutral, explicit ESQUIVE works, and all weapons keep their own pointers',()=>{
  const before=globalThis.window;globalThis.window=new Element();
  try{
    const input=createInput(),cells=['left jump','jump','right jump','left',null,'right','left crouch','crouch','right crouch'].map(actions=>new Element(actions?{padActions:actions}:{action:'shift'}));
    const pad=new Element();pad.querySelectorAll=()=>cells;pad.contains=cell=>cells.includes(cell);pad.getBoundingClientRect=()=>({left:0,top:0,width:150,height:150});
    let playing=true;const binding=inputModule.bindDirectionalPad(pad,input,()=>playing,()=>{});
    inputModule.bindButton(cells[4],input,()=>playing,()=>{});
    const weapons=['fire','missile','homing'].map((action,i)=>{const button=new Element({action});inputModule.bindButton(button,input,()=>playing,()=>{});button.emit('pointerdown',{pointerId:i+2});return button;});
    pad.emit('pointerdown',{target:cells[5]});assert.equal(input.actions.right,true);
    pad.emit('pointermove',{clientX:75,clientY:75});
    assert.equal(input.actions.right,false);assert.equal(input.actions.shift,false);assert.equal(input.consume().shift,false);
    for(const action of ['fire','missile','homing'])assert.equal(input.actions[action],true);
    pad.emit('pointermove',{clientX:125,clientY:125});
    assert.equal(input.actions.right,true);assert.equal(input.actions.crouch,true);assert.equal(input.actions.drop,false);
    cells[4].emit('pointerdown',{pointerId:5});assert.equal(input.actions.shift,true);
    cells[4].emit('pointerup',{pointerId:5});assert.equal(input.actions.shift,false);
    assert.equal(input.consume().shift,false);assert.equal(input.consume().shift,false);
    binding.clear();input.clear();playing=false;
    cells[4].emit('pointerdown',{pointerId:6});pad.emit('pointerdown',{target:cells[2]});weapons[2].emit('pointerdown',{pointerId:7});
    assert.equal(Object.values(input.consume()).some(Boolean),false,'paused controls cannot queue actions');
  }finally{globalThis.window=before;}
});

test('ESQUIVE follows the physical hold and pause clears it',()=>{
  const input=createInput();
  input.set('key:ShiftLeft','shift',true);
  for(let i=0;i<600;i++)assert.equal(input.consume().shift,true);
  input.set('key:ShiftLeft','shift',false);
  assert.equal(input.consume().shift,false);
  input.set('touch','shift',true);input.clear();
  assert.equal(input.consume().shift,false);
});

test('the boss assault has an independent B binding and preserves a released action tap',()=>{
  assert.equal(inputModule.KEY_ACTIONS.KeyB,'bossAction');
  const input=createInput();
  input.set('key:B','bossAction',true);input.set('key:B','bossAction',false);
  assert.equal(input.consume().bossAction,true);assert.equal(input.consume().bossAction,false);
  input.set('touch:assault','bossAction',true);input.clear();assert.equal(input.consume().bossAction,false);
});

test('DÉVIER reports each fresh press, including release and repress between steps',()=>{
  const input=createInput();
  input.set('key:H','deflect',true);
  assert.equal(input.consume().deflectPressed,true);
  assert.equal(input.consume().deflectPressed,false,'held repeat is not a new press');
  input.set('key:H','deflect',true);
  assert.equal(input.consume().deflectPressed,false,'key repeat is not a new press');
  input.set('key:H','deflect',false);input.set('key:H','deflect',true);
  assert.equal(input.consume().deflectPressed,true);
  input.set('key:H','deflect',false);input.set('key:H','deflect',true);input.set('key:H','deflect',false);
  assert.equal(input.consume().deflect,true,'a released tap is buffered');
  assert.equal(input.consume().deflectPressed,false);
  input.set('key:H','deflect',true);input.clear();
  assert.equal(input.consume().deflectPressed,false);
});

test('a second physical DÉVIER source is a fresh press even while the first remains held',()=>{
  const input=createInput();
  input.set('key:H','deflect',true);assert.equal(input.consume().deflectPressed,true);
  input.set('touch:2','deflect',true);assert.equal(input.consume().deflectPressed,true);
  input.set('touch:2','deflect',true);assert.equal(input.consume().deflectPressed,false);
  input.set('key:H','deflect',false);assert.equal(input.consume().deflectPressed,false);
  assert.equal(input.actions.deflect,true);
});
