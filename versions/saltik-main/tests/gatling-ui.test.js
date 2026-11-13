import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
function selection(search,saved){
 const code=main.slice(main.indexOf('const validCharacter='),main.indexOf('let game=createGame'));
 return vm.runInNewContext(`${code};selectedCharacter`,{URLSearchParams,location:{search},localStorage:{getItem:()=>saved}});
}
test('character URL validates values and overrides saved choice without changing level URLs',()=>{
 assert.equal(selection('',null),'striker');assert.equal(selection('?level=3&character=gatling',null),'gatling');
 assert.equal(selection('', 'gatling'),'gatling');assert.equal(selection('?character=striker','gatling'),'striker');
 assert.equal(selection('?character=invalid','gatling'),'striker');assert.equal(selection('', 'invalid'),'striker');
});
test('every scene creation preserves selection including title, level, home and restart paths',()=>{
 const calls=[...main.matchAll(/createGame\(\{([^}]+)\}\)/g)];assert.ok(calls.length>=5);
 for(const call of calls)assert.match(call[1],/character:selectedCharacter/);
 assert.match(main,/function nextLevel\(\).*?selectedLevel\+\+;syncLevelMenu\(\);start\(\)/);
 for(const id of ['start','replay','restart-pause'])assert.match(main,new RegExp(`\\$\\('${id}'\\)\\.addEventListener\\('click',start\\)`));
 assert.match(main,/return \{character:selectedCharacter,level:selectedLevel/);
});
test('both character choices support native button keyboard activation and restore weapon labels',()=>{
 for(const name of ['striker','gatling'])assert.match(html,new RegExp(`<button type="button" class="character-choice" data-character="${name}" aria-pressed="(?:true|false)"`));
 assert.match(html,/gatling-thumbnail/);assert.match(css,/assets\/modern-gatling-atlas.png/);assert.match(html,/striker-thumbnail/);assert.match(css,/assets\/modern-striker-atlas.png/);
 assert.match(main,/\$\('homing-button'\)\.hidden=gatling/);
 assert.match(main,/ROQUETTES <kbd>K<\/kbd>':'MIRV <kbd>K<\/kbd>/);
 assert.match(main,/Deux armes indépendantes':'Trois armes indépendantes/);
 assert.match(main,/action==='homing'&&selectedCharacter==='gatling'/);
 assert.match(main,/event.target.closest\?\.\('button\[data-character\],button\[data-level\]'\)/);
 assert.match(css,/data-character="gatling"[\s\S]*grid-template-rows:var\(--action-primary\)/);
});
test('Gatling heat feedback retains held fire through cooldown and Striker reload display',()=>{
 assert.match(main,/SURCHAUFFE \$\{thermal.cooldown.toFixed\(1\)\}s/);
 assert.match(main,/REFROIDISSEMENT/);assert.match(main,/maintenir pour reprendre le tir/);
 assert.match(main,/p.fireSpent.toFixed\(1\).*PRIMARY_FIRE_TIME/);
 assert.doesNotMatch(main,/\$\('fire-button'\)\.disabled/);
 assert.match(css,/data-state="overheat"/);assert.match(css,/max-height:520px/);
});
test('rotary audio cadence is independent of unchanged Striker cadence and resets with restart',()=>{
 const audio=readFileSync(new URL('../src/audio.js',import.meta.url),'utf8');
 assert.match(audio,/currentTime-lastGatlingShot<1\/15-.001/);
 assert.match(audio,/if\(restart\)\{lastGatlingShot=-Infinity;lastShot=-Infinity/);
 for(const event of ['gatling-shot','gatling-rocket','gatling-overheat','gatling-cooled'])assert.ok(audio.includes(`e.type==='${event}'`));
 assert.match(audio,/burst\(\.12,\.0462875\*1.15\*1.20,900/);
});

test('thermal feedback distinguishes a fresh firing budget from residual heat after release',()=>{
 const body=main.slice(main.indexOf('  if(gatling&&thermal){')+'  if(gatling&&thermal){'.length,main.indexOf('  if(!gatling&&p.mirvAiming)'));
 const code=body.slice(body.indexOf('\n'),body.lastIndexOf('  }'));
 function feedback(thermal){
  const elements=new Map();
  const $=id=>{if(!elements.has(id))elements.set(id,{style:{},dataset:{},attributes:{},classList:{toggle(){}},setAttribute(key,value){this.attributes[key]=value;}});return elements.get(id);};
  vm.runInNewContext(code,{thermal,$,clamp:(v,min,max)=>Math.max(min,Math.min(max,v))});return $;
 }
 const burst=feedback({heat:.8,sustained:4,cooldown:0});
 assert.equal(burst('fire-cooldown').textContent,'1.0 / 5 s');
 const released=feedback({heat:.765,sustained:0,cooldown:0});
 assert.equal(released('fire-cooldown').textContent,'5.0 / 5 s');
 assert.match(released('fire-button').attributes['aria-label'],/5.0 secondes avant surchauffe/);
 assert.equal(released('heat-fill').style.width,'76.5%');
 const resumed=feedback({heat:.02,sustained:.1,cooldown:0});
 assert.equal(resumed('fire-cooldown').textContent,'4.9 / 5 s');
 const cooling=feedback({heat:.8,sustained:0,cooldown:4});
 assert.equal(cooling('fire-cooldown').textContent,'SURCHAUFFE 4.0s');
});
