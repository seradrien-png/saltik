import test from 'node:test';import assert from 'node:assert/strict';import {drawRoyalForeground} from '../src/royal-world.js';import {ROYAL_SITES,royalSample} from '../src/royal-layout.js';
const recorder=()=>{const calls=[];return{calls,c:new Proxy({drawImage:image=>calls.push(image)},{get:(o,k)=>o[k]??(()=>{})})};};
test('every velvet camera position leaves decorative plants and objects behind the player',()=>{
 const props={width:2048,height:1024},flora={width:1800,height:600},g={player:{x:180,y:600}};
 for(let camera=0;camera<=17800;camera+=600){const{calls,c}=recorder();drawRoyalForeground(c,g,{camera,width:1280,art:{props,flora}});assert.equal(calls.length,0,`no foreground decoration at ${camera}`);}
});
test('clearing velvet decorations retains the physical near bridge railing',()=>{
 const s=ROYAL_SITES.find(s=>s.kind==='bridge'),x=(s.x1+s.x2)/2,rail={},props={},flora={width:1800,height:600};const{calls,c}=recorder();drawRoyalForeground(c,{player:{x,y:royalSample(s.points,x)}},{camera:s.left,width:1280,art:{railFront:rail,props,flora}});assert.deepEqual(calls,[rail]);
});
