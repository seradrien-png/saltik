import test from 'node:test';
import assert from 'node:assert/strict';
import {loadArt} from '../src/renderer.js';

async function withImages({fail=[],atlas=[1536,1024],dimensions={}}={},run){
  const previous=globalThis.Image;
  globalThis.Image=class {
    set src(url){
      const name=new URL(url).pathname.split('/').at(-1).replace(/\.(png|webp)$/,'');
      queueMicrotask(()=>{
        if(fail.includes(name)){this.onerror();return;}
        [this.width,this.height]=dimensions[name]??(name==='tachikoma'?atlas:name==='saltik-evasion'?[1254,1254]:['missile-batteries','boss-pod','saltik-breach-fire','boss-assault','saltik-victory','saltik-duel','saltik-dodge','tachikoma-turn','enemies','saltik-melee','destructibles','enemy-saltik','combat-blast'].includes(name)?[1536,1024]:['wreck','ground-surface'].includes(name)?[2172,724]:[384,512]);
        this.naturalWidth=this.width;this.naturalHeight=this.height;this.onload();
      });
    }
  };
  try{await run();}finally{if(previous===undefined)delete globalThis.Image;else globalThis.Image=previous;}
}

test('a missing required Striker atlas rejects loading instead of permitting an invisible player',async()=>{
  await withImages({fail:['tachikoma']},()=>assert.rejects(loadArt(),/Striker/i));
});

test('a decoded image with the wrong atlas dimensions rejects before deployment',async()=>{
  for(const atlas of [[1,1],[1536,512],[768,1024],[0,0]]){
    await withImages({atlas},()=>assert.rejects(loadArt(),/1536.*1024/));
  }
});

test('the complete action, turn, enemy and wreck artwork allows deployment',async()=>{
  await withImages({},()=>assert.doesNotReject(loadArt()));
});

test('optional scenery and enemy artwork failures retain their existing renderer fallbacks',async()=>{
  await withImages({fail:['canyon','boss','drones','soldiers','cliff-texture','ruins-atlas']},()=>assert.doesNotReject(loadArt()));
});

test('every new required refonte image rejects a missing or malformed asset',async()=>{
  for(const name of ['missile-batteries','boss-pod','saltik-breach-fire','boss-assault','saltik-victory','saltik-duel','saltik-dodge','tachikoma-turn','enemies','wreck']){
    await withImages({fail:[name]},()=>assert.rejects(loadArt()));
    await withImages({dimensions:{[name]:[1,1]}},()=>assert.rejects(loadArt(),/pixels/i));
  }
});

test('the required detailed ground surface cannot silently disappear from deployment',async()=>{
  await withImages({fail:['ground-surface']},()=>assert.rejects(loadArt(),/sol|terrain/i));
  for(const size of [[1,1],[2172,723],[2171,724]]){
    await withImages({dimensions:{'ground-surface':size}},()=>assert.rejects(loadArt(),/2172.*724.*pixels/i));
  }
});

test('native melee and destructible art must load with their exact atlas dimensions before deployment',async()=>{
  for(const name of ['saltik-melee','destructibles']){
    await withImages({fail:[name]},()=>assert.rejects(loadArt()));
    for(const size of [[1,1],[1536,1023],[1535,1024]]){
      await withImages({dimensions:{[name]:size}},()=>assert.rejects(loadArt(),/1536.*1024.*pixels/i));
    }
  }
});

test('native evasions, enemy Saltik and blast art reject absent or malformed required images',async()=>{
  for(const [name,size] of [['saltik-dodge',[1536,1024]],['saltik-evasion',[1254,1254]],['enemy-saltik',[1536,1024]],['combat-blast',[1536,1024]]]){
    await withImages({fail:[name]},()=>assert.rejects(loadArt()));
    await withImages({dimensions:{[name]:[size[0]-1,size[1]]}},()=>assert.rejects(loadArt(),/pixels/i));
  }
});

test('the native grapple and frontal impact atlas cannot be missing or malformed',async()=>{
  await withImages({fail:['saltik-duel']},()=>assert.rejects(loadArt()));
  await withImages({dimensions:{'saltik-duel':[1536,1023]}},()=>assert.rejects(loadArt(),/1536.*1024/));
});

test('the native victory pose must load at its complete lossless sheet dimensions',async()=>{
 await withImages({fail:['saltik-victory']},()=>assert.rejects(loadArt()));
 await withImages({dimensions:{'saltik-victory':[1536,1023]}},()=>assert.rejects(loadArt(),/1536.*1024/));
});
