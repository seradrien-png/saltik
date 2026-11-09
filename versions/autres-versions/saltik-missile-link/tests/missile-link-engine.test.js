import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update} from '../src/engine.js';
function clean(){const g=createGame();g.schedule=[];g.obstacles=[];g.platforms=[];return g;}
const steps=(g,input,n)=>{for(let i=0;i<n;i++)update(g,input,1/60);};
test('the V2 engine carries support and an opening exchange',()=>{const g=createGame({intro:true});assert.ok(g.missileLink);assert.equal(g.introDuration,7);steps(g,{},155);assert.ok(g.events.some(e=>e.type==='support-ready'));});
test('engine support input damages a real ground enemy',()=>{const g=clean();const e={id:500,type:'soldier',x:530,y:g.player.y,hp:100,maxHp:100,cooldown:99,phase:0,hit:0};g.enemies=[e];update(g,{support:true});update(g,{});steps(g,{},145);assert.ok(e.hp<100);assert.equal(g.missileLink.salvos,1);});
test('engine pause cancels pending support instead of firing on resume',()=>{const g=clean();update(g,{support:true});g.status='paused';update(g,{});g.status='playing';update(g,{});assert.equal(g.missileLink.salvos,0);});
test('there is no phantom hostile battery outside the foreground schedule',()=>{const g=clean();g.maxX=9000;steps(g,{},900);assert.equal(g.projectiles.filter(s=>s.battery).length,0);});
