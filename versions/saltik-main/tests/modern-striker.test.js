import test from 'node:test';import assert from 'node:assert/strict';
import {createInkScene,inkWeaponGeometry} from '../src/ink-scene.js';
import {inkSaltikGeometry} from '../src/ink-saltik.js';
import {nativeTurnView} from '../src/character-turns.js';
import {royalDepthScaleAt} from '../src/royal-layout.js';
test('new Striker model is used on all four missions at one shared foreground scale',()=>{for(const level of [1,2,3,4]){const p=createInkScene({level}).player;assert.equal(p.visualModel,'modern-striker');assert.equal(p.artScale??1,1);assert.equal(inkSaltikGeometry(p).modern,true);}assert.equal(royalDepthScaleAt(180),1);assert(royalDepthScaleAt(3500)<=1);});
test('modern primary, heavy cannon and three guided rockets leave native measured weapons',()=>{const p=createInkScene().player,a=inkWeaponGeometry(p,0);assert.equal(a.cabinTubes.length,3);assert(Math.abs(a.arm.x-a.cannon.x)>5);for(const dir of [1,-1]){p.dir=dir;p.turn=null;const g=inkWeaponGeometry(p,0);assert(g.armDirection.x*dir>.8);assert(g.cannonDirection.x*dir>.8);assert(g.cabinTubes.every(t=>Number.isFinite(t.muzzle.x)));}});
test('modern Striker has three separately illustrated turn views and crouch keeps wheel contacts planted',()=>{const p=createInkScene().player;for(const yaw of [Math.PI/4,Math.PI/2,Math.PI*3/4])assert(nativeTurnView({...p,turn:{active:true,yaw}}));const a=inkSaltikGeometry(p),b=inkSaltikGeometry({...p,crouching:true});assert(b.bodyDrop>a.bodyDrop+10);for(const l of b.modernLegs)assert(Math.abs(l.contact.y-p.y)<.01);});

test('modern Striker turn socket helper resolves its own eight physical apertures',async()=>{const {nativeTurnSockets}=await import('../src/character-turns.js');for(const yaw of [Math.PI/4,Math.PI/2,Math.PI*3/4]){const tubes=nativeTurnSockets({...createInkScene().player,turn:{active:true,yaw}});assert.equal(tubes.length,8);assert(tubes.every(t=>Number.isFinite(t.muzzle.x)&&Number.isFinite(t.muzzle.y)));}});
