import test from 'node:test';
import assert from 'node:assert/strict';
import {drawGuidedLocks,drawProjectile,createRenderer} from '../src/renderer.js';
import {createGame,combatBounds} from '../src/engine.js';

function context(){
  const paths=[],colors=[],translations=[],gradient={addColorStop(){}},noop=()=>{};
  return new Proxy({paths,colors,translations,globalAlpha:1,
    createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,
    moveTo(x,y){paths.push([x,y]);},lineTo(x,y){paths.push([x,y]);},
    translate(x,y){translations.push([x,y]);},stroke(){colors.push(this.strokeStyle);},fill(){colors.push(this.fillStyle);}
  },{get(o,k){return k in o?o[k]:noop;}});
}

test('red locks use canonical body bounds and only living enemies assigned to live player homing missiles',()=>{
  const e={id:10,type:'saltik',x:700,y:500,hp:16},dead={id:11,type:'walker',x:900,y:500,hp:0};
  const boss={id:99,type:'boss',x:1200,y:500,hp:100};
  const shots=[{kind:'homing',team:'player',life:2,targetId:10},{kind:'homing',team:'player',life:2,targetId:10},
    {kind:'homing',team:'player',life:2,targetId:11},{kind:'homing',team:'player',life:0,targetId:99},
    {kind:'enemy-missile',team:'enemy',life:2,targetId:99}];
  const c=context(),g={enemies:[e,dead],boss,projectiles:shots,time:1};
  assert.equal(drawGuidedLocks(c,g,{camera:100}),1);
  const b=combatBounds(e);assert.deepEqual(c.paths[0],[b.x-100-6,b.y+6]);
  assert.ok(c.colors.every(color=>color==='#ff514c'));
  g.projectiles.push({kind:'homing',team:'player',life:1,targetId:99});
  assert.equal(drawGuidedLocks(context(),g),2);
  e.hp=0;assert.equal(drawGuidedLocks(context(),g),1);
});

test('physical hostile missile draws its own body, fiery exhaust and travelled trail',()=>{
  const c=context();
  drawProjectile(c,{kind:'enemy-missile',team:'enemy',x:400,y:200,vx:-250,vy:30,trail:[{x:420,y:198},{x:410,y:199}]},100,1);
  assert.ok(c.translations.some(([x,y])=>x===300&&y===200));
  assert.ok(c.colors.includes('#899976'));assert.ok(c.colors.includes('#ff7157'));
  assert.ok(c.colors.some(color=>String(color).startsWith('rgba(255,144,106,')));
});

test('renderer exposes its complete world viewport and freezes combat effects while simulation is paused',()=>{
  const previous=globalThis.window;globalThis.window={devicePixelRatio:1,addEventListener(){}};
  const c=context(),canvas={width:1280,height:720,clientWidth:1280,getContext:()=>c,getBoundingClientRect:()=>({width:1280,height:720})};
  try{
    const r=createRenderer(canvas),g=createGame();g.enemies=[];g.obstacles=[];g.pickups=[];
    assert.equal(r.height,720/1.155);r.render(g,1000);r.addEvent({type:'explosion',x:600,y:400,radius:70});
    r.render(g,1050);const count=r.effectCount;assert.ok(count>0);
    r.render(g,20000,'paused');assert.equal(r.effectCount,count);
    g.time+=8;r.render(g,20100);assert.equal(r.effectCount,0);
    r.reset();assert.equal(r.effectCount,0);
  }finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
});

test('terminal explosion finishes animating after the simulation has stopped at victory',()=>{
  const previous=globalThis.window;globalThis.window={devicePixelRatio:1,addEventListener(){}};
  const c=context(),canvas={width:1280,height:720,clientWidth:1280,getContext:()=>c,getBoundingClientRect:()=>({width:1280,height:720})};
  try{
    const r=createRenderer(canvas),g=createGame();g.enemies=[];g.obstacles=[];g.pickups=[];
    r.render(g,1000);r.addEvent({type:'explosion',x:600,y:400,big:true});g.status='won';
    for(let frame=1;frame<=150;frame++)r.render(g,1000+frame*1000/60,'won');
    assert.equal(r.effectCount,0,'the boss explosion cannot remain frozen behind the result screen');
  }finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
});
