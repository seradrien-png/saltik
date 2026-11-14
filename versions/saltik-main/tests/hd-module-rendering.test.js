import test from 'node:test';import assert from 'node:assert/strict';import {paintLunarCutout} from '../src/lunar-landmarks.js';import {inkLandmarkArt,INK_WORLD_ART} from '../src/ink-campaign-art.js';
test('larger lunar drawings retain the exact logical placement instead of atlas cropping',()=>{
 for(const kind of ['aqueduct','observatory','bastion','gate']){const hd={width:1536,height:1024},calls=[],c=new Proxy({globalAlpha:1,drawImage:(...a)=>calls.push(a)},{get:(o,k)=>o[k]??(()=>{})});paintLunarCutout(c,{atlas:{},bridge:{},hd:{['hd-lunar-'+kind]:hd}},kind,{x:30,y:80,w:920,h:610});assert.equal(calls.length,1);assert.deepEqual(calls[0],[hd,0,0,1536,1024,0,0,920,610]);}
});
test('HD canyon landmarks keep authored world bounds and register their complete source frame',()=>{
 for(const [name,key]of [['wreck','wreck'],['checkpointTurn','checkpoint'],['breachLanding','breach']]){const image={width:1954,height:805},art=inkLandmarkArt({['hd-ink-'+key]:image})[name];assert.equal(art.image,image);assert.deepEqual(art.bounds,INK_WORLD_ART[name].bounds);assert.deepEqual(art.source,{x:0,y:0,w:1954,h:805});}
});
