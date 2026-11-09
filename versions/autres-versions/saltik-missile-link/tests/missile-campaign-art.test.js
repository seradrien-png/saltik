import test from 'node:test';
import assert from 'node:assert/strict';

import * as art from '../src/missile-campaign-art.js';
const clash={phase:'qte',elapsed:0,taps:2,effortsCompleted:1,effortElapsed:0,dir:1,x:540,y:550,playerX:500,playerY:548,enemyX:580,enemyY:552};
const g={time:4,status:'playing',player:{x:500,y:550,dir:1,onGround:true},missileLink:{launchFlash:0},missileCompanion:{active:true,x:380,y:540,groundY:550,dir:1,vx:160,tilt:0,dodge:.4,flareFlash:0,arriving:false},countermeasures:[]};
const drawing=()=>{const calls=[],clips=[],stack=[],ellipses=[];const c=new Proxy({globalAlpha:1,drawImage(...a){calls.push(a);},ellipse(...a){ellipses.push(a);},save(){stack.push(1);},restore(){assert.ok(stack.pop());},clip(rule){clips.push(rule);},createRadialGradient(){return{addColorStop(){}};}},{get:(t,k)=>k in t?t[k]:()=>{}});return {c,calls,clips,stack,ellipses};};

test('every artillery clash press visibly closes the native small hands, then returns to its brace on the same feet',()=>{
 assert.equal(typeof art.batteryClashVisual,'function');
 for(const dir of [1,-1]){
  const d={...clash,dir,enemyX:500+80*dir,enemyY:552};
  const begin=art.batteryClashVisual(d,{camera:200}),peak=art.batteryClashVisual({...d,effortElapsed:.12},{camera:200}),end=art.batteryClashVisual({...d,effortElapsed:.24},{camera:200});
  assert.equal(begin.player.x,300);assert.equal(begin.player.y,548);assert.equal(peak.enemy.x,d.enemyX-200);assert.equal(peak.enemy.y,552);
  assert.equal(peak.effortIndex,2);assert.ok(peak.effort>.99);assert.equal(end.effort,0);
  assert.equal(peak.player.arms.length,2);assert.equal(peak.enemy.arms.length,2);
  assert.ok(Math.abs(peak.player.arms[0].rotation-begin.player.arms[0].rotation)>.07);
  assert.ok(Math.hypot(peak.player.contact.x-peak.enemy.contact.x,peak.player.contact.y-peak.enemy.contact.y)<7,'the original nearest wrists meet');
  assert.equal(peak.player.height,99);assert.equal(peak.enemy.height,99);
 }
});

test('artillery clash draws exclusively the original player and artillery cells and never mutates encounter state',()=>{
 assert.equal(typeof art.drawBatteryClash,'function');
 const {c,calls,clips,stack}=drawing(),player={},battery={},before=structuredClone(clash);
 assert.equal(art.drawBatteryClash(c,{tachikoma:player,'missile-batteries':battery},clash,{camera:200}),true);
 assert.ok(calls.some(a=>a[0]===player)&&calls.some(a=>a[0]===battery));
 assert.ok(calls.every(a=>a[0]===player||a[0]===battery));
 assert.equal(clips.filter(x=>x==='evenodd').length,2,'each original arm is removed before its transformed patch is painted');
 assert.deepEqual(clash,before);assert.equal(stack.length,0);
});

test('foreground companion keeps its actual dodge height, terrain shadow and manual launch pose',()=>{
 assert.equal(typeof art.companionVisual,'function');
 const v=art.companionVisual(g,{camera:200});assert.equal(v.x,180);assert.equal(v.y,540);assert.equal(v.groundY,550);assert.equal(v.height,99);assert.equal(v.pose,'idle');
 assert.equal(art.companionVisual({...g,missileLink:{launchFlash:.25}},{camera:200}).pose,'fire');
 const before=structuredClone(g),{c,calls}=drawing(),sheet={};
 assert.equal(art.drawMissileCompanion(c,{'missile-batteries':sheet},g,{camera:200}),true);
 assert.ok(calls.every(a=>a[0]===sheet));assert.deepEqual(g,before);
});

test('paired victory approaches and bumps two original small hands while both feet keep their terrain height',()=>{
 assert.equal(typeof art.pairedVictoryVisual,'function');
 const won={...g,status:'won',missileCompanion:{...g.missileCompanion,x:380,y:550,groundY:550,dodge:0,vx:0}};
 const start=art.pairedVictoryVisual(won,{age:0,camera:200}),bump=art.pairedVictoryVisual(won,{age:1.4,camera:200});
 assert.equal(start.player.x,300);assert.equal(start.ally.x,180);assert.ok(Math.abs(bump.player.x-bump.ally.x)<Math.abs(start.player.x-start.ally.x));
 assert.equal(bump.player.y,550);assert.equal(bump.ally.y,550);
 assert.ok(Math.hypot(bump.player.contact.x-bump.ally.contact.x,bump.player.contact.y-bump.ally.contact.y)<8);
 assert.equal(bump.player.arms.length,2);assert.equal(bump.ally.arms.length,2);
 const {c,calls}=drawing(),p={},a={};assert.equal(art.drawPairedVictory(c,{tachikoma:p,'missile-batteries':a},won,{age:1.4,camera:200}),true);
 assert.ok(calls.some(a=>a[0]===p)&&calls.some(b=>b[0]===a));
});

test('physical countermeasures draw in world space without changing their lifetime or trajectory',()=>{
 assert.equal(typeof art.drawCountermeasures,'function');
 const state={countermeasures:[{id:3,team:'player',x:600,y:340,vx:-80,vy:30,life:.8,age:.4}]},before=structuredClone(state),{c,ellipses}=drawing();
 assert.equal(art.drawCountermeasures(c,state,{camera:200}),1);assert.deepEqual(state,before);
 assert.ok(ellipses.some(a=>a[0]===400&&a[1]===340),'the flare light stays on the physical decoy');
});

test('release lowers the original hands before the battery resumes its escape',()=>{
 const held=art.batteryClashVisual({...clash,phase:'release',elapsed:0}),released=art.batteryClashVisual({...clash,phase:'release',elapsed:.5});
 assert.ok(Math.abs(held.player.arms[0].rotation)>Math.abs(released.player.arms[0].rotation)+.5);
 assert.ok(Math.abs(held.enemy.arms[0].rotation)>Math.abs(released.enemy.arms[0].rotation)+.5);
 assert.equal(released.player.x,held.player.x);assert.equal(released.enemy.y,held.enemy.y);
});
