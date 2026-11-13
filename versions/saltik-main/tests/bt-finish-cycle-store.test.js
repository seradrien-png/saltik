import test from 'node:test';
import assert from 'node:assert/strict';
import {readBTFinishCycle,saveBTFinishCycle} from '../src/bt-finish-cycle-store.js';
import {nextSaltikDuelVariant} from '../src/saltik-duel.js';

function memoryStorage(){
 const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};
}

test('two encounters per run continue all four BT finishes across restarts',()=>{
 const storage=memoryStorage(),runA={nextSaltikDuelVariant:readBTFinishCycle(storage)};
 assert.deepEqual([nextSaltikDuelVariant(runA),nextSaltikDuelVariant(runA)],[0,1]);
 assert.equal(saveBTFinishCycle(runA.nextSaltikDuelVariant,storage),true);
 assert.equal(storage.getItem('saltik-bt-finish-next'),'2');
 const runB={nextSaltikDuelVariant:readBTFinishCycle(storage)};
 assert.deepEqual([nextSaltikDuelVariant(runB),nextSaltikDuelVariant(runB)],[2,3]);
 saveBTFinishCycle(runB.nextSaltikDuelVariant,storage);
 assert.equal(readBTFinishCycle(storage),0);
});

test('stored values and saved values normalize to the four valid cycle positions',()=>{
 const storage=memoryStorage();
 for(const value of ['0','1','2','3']){storage.setItem('saltik-bt-finish-next',value);assert.equal(readBTFinishCycle(storage),Number(value));}
 for(const value of ['', 'broken', '-1', '4', '1.5', 'Infinity']){storage.setItem('saltik-bt-finish-next',value);assert.equal(readBTFinishCycle(storage),0);}
 for(const value of [-1,4,1.5,NaN,Infinity,undefined]){saveBTFinishCycle(value,storage);assert.equal(storage.getItem('saltik-bt-finish-next'),'0');}
});

test('unavailable or throwing private storage safely falls back to the first finish',()=>{
 const storage={getItem(){throw new Error('private');},setItem(){throw new Error('private');}};
 assert.equal(readBTFinishCycle(storage),0);assert.equal(saveBTFinishCycle(2,storage),false);
 assert.equal(readBTFinishCycle(null),0);assert.equal(saveBTFinishCycle(2,null),false);
 const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 try{
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('blocked getter');}});
  assert.equal(readBTFinishCycle(),0);assert.equal(saveBTFinishCycle(2),false);
 }finally{
  if(original)Object.defineProperty(globalThis,'localStorage',original);else delete globalThis.localStorage;
 }
});
