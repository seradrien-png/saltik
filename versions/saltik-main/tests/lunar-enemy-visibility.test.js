import test from 'node:test';
import assert from 'node:assert/strict';
import {inkEnemyGeometry} from '../src/ink-actors.js';
test('textual lunar encounter ids retain finite painted enemy positions and muzzle geometry',()=>{
 for(const type of ['soldier','walker','turret','drone']){
  const e={id:'lunar-encounter-12',type,x:1200,y:550,hp:5,phase:1.4};
  const g=inkEnemyGeometry(e,3);
  for(const n of [g.bob,g.muzzle.x,g.muzzle.y,g.muzzleDirection.x,g.muzzleDirection.y])assert.ok(Number.isFinite(n),`${type}: ${n}`);
 }
});
