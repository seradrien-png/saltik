import test from 'node:test';
import assert from 'node:assert/strict';
import {enemySaltikGeometry,drawEnemySaltik} from '../src/enemy-saltik-art.js';

const enemy={type:'saltik',x:700,y:500,dir:-1,vx:0};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} versus ${b}`);

test('enemy Saltik uses measured feet and native small coax aperture at ordinary enemy scale',()=>{
  const g=enemySaltikGeometry(enemy);
  assert.equal(g.frame,0);assert.deepEqual(g.anchor,{x:203,y:465});
  close(g.scale,.27);close(g.muzzle.x,668.14);close(g.muzzle.y,440.6);
  assert.ok(g.crop.h*g.scale>=100&&g.crop.h*g.scale<=112);
  assert.deepEqual(g.bounds,{x:654,y:419,w:92,h:81});
  assert.deepEqual(g.target,{x:700,y:457});assert.equal(g.targetY,457);
  assert.equal(g.podsOpen,false,'closed painted doors cannot advertise a launch aperture');
});

test('locking articulates native pods and only the launch pose exposes their actual apertures',()=>{
  assert.equal(enemySaltikGeometry({...enemy,attackPhase:'lock',podRaise:1,lockProgress:.9}).frame,4);
  const g=enemySaltikGeometry({...enemy,attackPhase:'launch',podRaise:1,lockProgress:1});
  assert.equal(g.frame,5);assert.equal(g.podsOpen,true);
  assert.deepEqual(g.anchor,{x:585,y:968});
  close(g.podMuzzles[0].x,664.09);close(g.podMuzzles[0].y,404.42);
  close(g.podMuzzles[1].x,714.85);close(g.podMuzzles[1].y,402.26);
  for(const d of g.podDirections){close(Math.hypot(d.x,d.y),1);assert.ok(d.x<-.98&&d.y<0);}
});

test('right facing attacks reflect every aperture and keep the hit frame away from malformed extra eyes',()=>{
  for(const pose of [{},{firePose:.1},{attackPhase:'lock',podRaise:.6},{attackPhase:'launch',podRaise:1},{vx:24,phase:.3},{hit:.2}]){
    const l=enemySaltikGeometry({...enemy,...pose}),r=enemySaltikGeometry({...enemy,...pose,dir:1});
    assert.notEqual(l.frame,6);assert.notEqual(r.frame,6);
    if(l.frame!==0){close(r.muzzle.x,1400-l.muzzle.x);close(r.muzzle.y,l.muzzle.y);}
    assert.deepEqual(r.bounds,l.bounds);
    for(let i=0;i<2;i++){close(r.podDirections[i].x,-l.podDirections[i].x);close(r.podDirections[i].y,l.podDirections[i].y);}
  }
});

test('draw registers measured native feet in world space without changing the canonical target geometry',()=>{
  const calls=[],c={save(){},restore(){},translate(...a){calls.push(['translate',...a]);},scale(){},drawImage(...a){calls.push(['draw',...a]);}};
  const images={'enemy-saltik':{width:1536,height:1024}};
  assert.equal(drawEnemySaltik(c,images,enemy,0,{camera:80}),true);
  const d=calls.find(a=>a[0]==='draw'),g=enemySaltikGeometry(enemy);
  assert.deepEqual(calls[0],['translate',620,500]);
  close(d[6]+(g.anchor.x-g.crop.x)*g.scale,0);close(d[7]+(g.anchor.y-g.crop.y)*g.scale,0);
  assert.equal(drawEnemySaltik(c,{},enemy,0),false);
});
