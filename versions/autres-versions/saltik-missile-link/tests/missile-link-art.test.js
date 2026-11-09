import test from 'node:test';
import assert from 'node:assert/strict';
import {batterySprite,batteryStage,drawMissileLinkOverlay} from '../src/missile-link-art.js';
import {createGame} from '../src/engine.js';
test('ally and hostile use their own three-frame rows with a fixed ground anchor',()=>{
 const a=batterySprite('ally','idle'),b=batterySprite('enemy','fire');
 assert.deepEqual(a.crop,[0,0,512,512]);assert.deepEqual(b.crop,[1024,512,512,512]);
 assert.equal(a.foot,b.foot);assert.equal(a.foot,500);
});
test('ally is near at the start, absent while travelling and distant after halfway',()=>{
 const g=createGame();assert.equal(batteryStage(g).nearAlly,true);assert.equal(batteryStage(g).farAlly,false);
 g.player.x=3000;g.maxX=3000;assert.equal(batteryStage(g).nearAlly,false);assert.equal(batteryStage(g).farAlly,false);
 g.player.x=9500;g.maxX=9500;assert.equal(batteryStage(g).farAlly,true);assert.equal(batteryStage(g).enemy,undefined);
});
test('a designation ray originates at the controlled Saltik and ends at the selected point',()=>{
 const moves=[],lines=[];const c={save(){},restore(){},beginPath(){},moveTo(...p){moves.push(p);},lineTo(...p){lines.push(p);},stroke(){},arc(){},setLineDash(){}};
 const g=createGame();g.missileLink.aiming=true;g.missileLink.aim={x:600,y:320};
 const result=drawMissileLinkOverlay(c,g,{camera:100});assert.ok(result.laser);assert.ok(lines.some(p=>p[0]===500&&p[1]===320));assert.ok(moves.some(p=>p[0]<200));
});
test('greeting uses the existing two-hand idle frame, never the invalid three-hand frame',()=>{
 assert.deepEqual(batterySprite('ally','wave').crop,[0,0,512,512]);
});
test('foreground arrival removes the distant copy and its launch flash',()=>{
 const g=createGame();g.player.x=16000;g.maxX=16000;g.missileCompanion={active:true};
 assert.equal(batteryStage(g).farAlly,false);assert.equal(batteryStage(g).nearAlly,false);
});
