import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene,updateInkScene} from '../src/ink-scene.js';
import {lunarGroundAt} from '../src/lunar-level.js';
test('every bastion has its two illustrated usable stair flights',()=>{
 const g=createInkScene({level:2});
 for(const p of g.platforms.filter(p=>p.lunarKind==='bastion'))assert.equal(p.walkableEntries.length,2,p.id);
});
test('the ground meets each illustrated staircase foot exactly',()=>{
 const g=createInkScene({level:2});
 for(const p of g.platforms)for(const e of p.walkableEntries){
  const [x,y]=e.points[0];assert.ok(Math.abs(lunarGroundAt(x)-y)<.1,`${e.id}: ground ${lunarGroundAt(x)}, painted foot ${y}`);
 }
});
test('both stair flights and every annex and portal terrace can be reached by ordinary walking',()=>{
 const routes=createInkScene({level:2}).platforms;
 for(const id of ['lunar-annex-west','lunar-annex-middle','lunar-annex-east','lunar-portal'])assert.ok(routes.some(p=>p.id===id));
 for(const route of routes)for(const entry of route.walkableEntries){
  const g=createInkScene({level:2});g.schedule=[];g.pickups=[];g.lunar.phase='open';
  const a=entry.points[0],b=entry.points.at(-1),dir=Math.sign(b[0]-a[0]),p=g.player;
  p.x=a[0]-dir*25;p.y=g.groundAt(p.x);p.supportY=p.y;
  for(let i=0;i<210&&p.platformId!==route.id;i++)updateInkScene(g,{right:dir>0,left:dir<0},1/60);
  assert.equal(p.platformId,route.id,entry.id);assert.equal(g.lunar.falls,0);assert.equal(p.onGround,true);
 }
});
