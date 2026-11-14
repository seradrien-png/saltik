import test from 'node:test';import assert from 'node:assert/strict';import {drawRoyalPov} from '../src/royal-pov.js';
test('the next-world glimpse stays visible above the painted portal and behind the mounted eel',()=>{
 const gate={tag:'gate'},vista={tag:'vista'},eel={width:1536,height:1024},calls=[],c=new Proxy({globalAlpha:1,createLinearGradient:()=>({addColorStop(){}}),drawImage:image=>calls.push(image)},{get:(o,k)=>o[k]??(()=>{})});drawRoyalPov(c,{'hd-lunar-gate':gate,'desert-red-vista':vista,'royal-eel-pov':eel},{width:1280,height:720,time:5.8,travel:.6});assert.deepEqual(calls,[gate,vista,eel]);
});
