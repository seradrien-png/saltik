import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,terrainHeight,surfaceHeight} from '../src/engine.js';
import {routeThickness} from '../src/world.js';
const step=(g,input={},seconds=1)=>{for(let i=0;i<Math.ceil(seconds*60);i++)update(g,input,1/60);};
function quiet(){const g=createGame();g.schedule=[];g.obstacles=[];return g;}

test('the original immediate and released jump preserves the canyon landing response',()=>{
  const g=quiet(),p=g.player;update(g,{jump:true},1/60);assert.ok(!p.onGround&&p.vy<0&&p.y<terrainHeight(p.x));
  step(g,{},.12);assert.ok(!p.onGround&&p.vy<0);let frames=0;while(!p.onGround&&frames++<90)update(g,{jump:true},1/60);
  assert.ok(p.landingCompression>.5);assert.equal(g.events.filter(e=>e.type==='jump').length,1);step(g,{jump:true},.3);assert.equal(p.landingCompression,0);assert.ok(p.onGround);
});
test('entry windows are reachable and the independent interiors leave full standing clearance',()=>{
  for(const p of createGame().platforms){
    const lower=x=>p.lower?surfaceHeight(p.lower,x):terrainHeight(x),rises=[];
    for(let x=p.x1;x<=p.x2;x+=6){
      const rise=lower(x)-surfaceHeight(p,x);rises.push(rise);
      if(x<=p.x1+160)assert.ok(rise>=128-1e-6&&rise<=148+1e-6,`${p.id} entry rise ${rise} at ${x}`);
      assert.ok(routeThickness(p,x)>0&&routeThickness(p,x)<=155);
      for(const dx of [-58,0,58]){const xx=x+dx;if(xx<p.x1||xx>p.x2)continue;const ceiling=surfaceHeight(p,xx)+routeThickness(p,xx);assert.ok(lower(x)-ceiling>=107,`${p.id} clearance ${lower(x)-ceiling} at ${x} / ${xx}`);}
      assert.ok(Math.abs(surfaceHeight(p,x+1)-surfaceHeight(p,x))<.65,`${p.id} driveable crown`);
    }
    assert.ok(Math.max(...rises)-Math.min(...rises)>30,`${p.id} interior must separate from its lower contour`);
    assert.ok(routeThickness(p,p.x1)<routeThickness(p,p.x1+40)*.5,'left nose has a physical bevel');
    assert.ok(routeThickness(p,p.x2)<routeThickness(p,p.x2-40)*.5,'right nose has a physical bevel');
  }
});
test('obstacles and repair pickups rest on the named curved surface used for driving',()=>{
  const g=createGame();for(const o of g.obstacles){const p=g.platforms.find(p=>p.id===o.platformId);assert.equal(o.y,p?surfaceHeight(p,o.x):terrainHeight(o.x));}
  for(const p of g.platforms){const item=g.pickups.find(q=>q.x===p.x2-180);assert.ok(item);assert.equal(item.y,surfaceHeight(p,item.x)-30);}
});
test('spawned upper enemies and driving wheel supports follow the actual crown',()=>{
  const g=quiet(),p=g.player,ledge=g.platforms[0];p.x=ledge.x1+140;p.y=surfaceHeight(ledge,p.x);p.platformId=ledge.id;p.tier=1;
  g.schedule=[{id:999,x:p.x+600,type:'walker',tier:1,platformId:ledge.id}];step(g,{right:true},1.5);
  assert.equal(p.y,surfaceHeight(ledge,p.x));assert.equal(g.enemies[0].y,surfaceHeight(ledge,g.enemies[0].x));assert.ok(p.supportPose.contacts.some(c=>c.grounded));
});

test('the raised routes have substantial solid roofs while every carved passage remains walkable',()=>{
  for(const p of createGame().platforms){
    const samples=Array.from({length:100},(_,i)=>routeThickness(p,p.x1+(p.x2-p.x1)*i/99));
    assert.ok(Math.max(...samples)>=58,`${p.id} needs a substantial physical landform, maximum thickness ${Math.max(...samples)}`);
    assert.ok(samples.filter(t=>t>=40).length>=20,`${p.id} must have sustained rock or masonry depth`);
  }
});
test('the accepted scree ground ascent remains exactly the published continuous landform',()=>{
  for(const [x,y] of [[12100,578.1794632777916],[12500,544.7135315773979],[13200,457.4913110585534],[13600,409.09360423124724],[14200,533.9630836342174],[14900,544.7726556402437]])assert.equal(terrainHeight(x),y);
});
test('the upper roof barricade has a stable intact footing across its native base width',()=>{
  const g=createGame(),o=g.obstacles.find(o=>o.platformId==='bridge-3'),roof=g.platforms.find(p=>p.id===o.platformId);
  for(let x=o.x-o.w/2;x<=o.x+o.w/2;x+=4)assert.ok(Math.abs(surfaceHeight(roof,x)-o.y)<1,'a broad prop must not balance on a curved point with daylight under its feet');
});
