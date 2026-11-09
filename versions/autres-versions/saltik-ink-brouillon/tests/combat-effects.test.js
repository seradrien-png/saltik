import test from 'node:test';
import assert from 'node:assert/strict';
import {createCombatEffects} from '../src/combat-effects.js';

function context(){
  const draws=[],paths=[],c={draws,paths,globalAlpha:1,save(){},restore(){},beginPath(){},closePath(){},fill(){},stroke(){},
    moveTo(...p){paths.push(p);},lineTo(...p){paths.push(p);},ellipse(){},translate(){},rotate(){},
    drawImage(...a){draws.push(a);},createRadialGradient(){return{addColorStop(){}};},
    fillRect(){assert.fail('explosions and debris cannot draw confetti squares');}};
  return c;
}

test('native blast art stays registered to the world camera and draw never advances effect time',()=>{
  const effects=createCombatEffects(),sheet={width:1536,height:1024},c=context();
  effects.add({type:'explosion',x:640,y:300,radius:70});
  effects.draw(c,{'combat-blast':sheet},{camera:200});
  assert.ok(c.draws.length>0);assert.deepEqual(c.draws[0].slice(1,5),[5,152,338,333]);
  const first=c.draws[0];assert.ok(first[5]<440&&first[5]+first[7]>440);
  effects.draw(c,{'combat-blast':sheet},{camera:200});
  assert.deepEqual(c.draws[c.draws.length-1],c.draws[Math.floor(c.draws.length/2)-1]);
  effects.update(.3);c.draws=[];
  const next=context();effects.draw(next,{'combat-blast':sheet},{camera:200});
  assert.notDeepEqual(next.draws[0].slice(1,5),first.slice(1,5));
});

test('blast pressure, short sparks and irregular heavy debris render without any square branch',()=>{
  const effects=createCombatEffects(),c=context();
  effects.add({type:'explosion',x:100,y:400,radius:60,material:'rock'});
  effects.add({type:'debris',x:100,y:400,material:'metal'});
  effects.draw(c,{}, {camera:20});
  assert.ok(c.paths.length>30,'irregular fragment edges and short spark streaks are visible');
  effects.update(.45);effects.draw(c,{}, {camera:20});
  assert.ok(effects.count>0,'smoke and heavy fragments outlive the flash');
});

test('effects are bounded during sustained combat and all expire or reset',()=>{
  const effects=createCombatEffects();
  for(let i=0;i<200;i++)effects.add({type:'explosion',x:i,y:400,big:true});
  assert.ok(effects.count>0&&effects.count<=288);
  effects.update(8);assert.equal(effects.count,0);
  effects.add({type:'intercept',x:20,y:50});assert.ok(effects.count>0);
  effects.reset();assert.equal(effects.count,0);
});
