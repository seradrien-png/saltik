import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,navigationContext} from '../src/engine.js';
test('static route collision slabs are reused across projectile steps while live obstacles refresh',()=>{
 const g=createGame();g.platforms=[{id:'roof',x1:100,x2:500,tier:1,points:[[100,300],[500,300]],bodyDepth:50}];
 g.obstacles=[{id:'rock',type:'rock',x:180,y:600,w:40,h:50,hp:5}];
 const a=navigationContext(g),b=navigationContext(g),slab=a.blockers.find(r=>r.id==='roof');
 assert.strictEqual(b.blockers.find(r=>r.id==='roof'),slab);
 g.obstacles[0].hp=0;const c=navigationContext(g);assert.equal(c.blockers.some(r=>r.id==='rock'),false);
 g.platforms=[{...g.platforms[0],points:[[100,250],[500,250]]}];
 const d=navigationContext(g);assert.equal(d.blockers.find(r=>r.id==='roof').y,250);
 assert.notStrictEqual(d.blockers.find(r=>r.id==='roof'),slab);
});

