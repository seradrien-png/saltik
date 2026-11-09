import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,terrainHeight,surfaceHeight} from '../src/engine.js';
import {projectPlayer} from '../src/world.js';

test('engine applies wheel support without moving physical floors during a full grounded ESQUIVE',()=>{
  for(const tier of [0,1,2,'obstacle']){
    const g=createGame();g.schedule=[];g.obstacles=[];const p=g.player;
    if(tier==='obstacle'){
      const o={id:'test-top',type:'rock',x:900,y:terrainHeight(900),w:140,h:60,hp:100,maxHp:100};g.obstacles=[o];p.x=o.x;p.y=o.y-o.h;p.obstacleId=o.id;
    }else if(tier){
      const route=g.platforms.find(r=>r.tier===tier);p.x=route.x1+240;p.platformId=route.id;p.tier=tier;p.y=surfaceHeight(route,p.x);
    }
    const physicalY=p.y;
    for(let frame=0;frame<75;frame++){
      update(g,{shift:frame===0},1/60);
      assert.equal(p.y,physicalY);assert.equal(p.onGround,true);assert.equal(projectPlayer(p).y,p.y);
      assert.ok(p.supportPose?.contacts.length>=2,'real wheel supports are shared with rendering');
      assert.ok(Math.abs(p.tilt)<=.20);assert.ok(Math.abs(p.supportPose.heave)<=6);
    }
  }
});

test('a distant boss receives no melee damage through its ordinary movement barrier',()=>{
  const g=createGame();g.schedule=[];g.obstacles=[];g.platforms=[];g.bossActivated=true;
  Object.assign(g.player,{x:900,y:terrainHeight(900),supportY:terrainHeight(900)});
  g.boss={id:999,type:'boss',x:1135,y:terrainHeight(1135),hp:200,maxHp:200,cooldown:99,phase:0};
  for(let frame=0;frame<30;frame++)update(g,{},1/60);
  assert.equal(g.boss.hp,200);assert.equal(g.stats.meleeSwings,0);
});

test('an obstacle cannot hold or catch the Saltik after every measured wheel leaves its real width',()=>{
  for(const landing of [false,true]){
    const g=createGame();g.schedule=[];g.platforms=[];const o={id:'edge',type:'rock',x:800,y:terrainHeight(800),w:80,h:60,hp:100,maxHp:100};g.obstacles=[o];
    const top=o.y-o.h,p=g.player;Object.assign(p,{x:889,y:top-(landing?1:0),supportY:top,dir:-1,onGround:!landing,obstacleId:landing?null:o.id,vy:landing?80:0,turn:null});
    update(g,{},1/60);assert.equal(p.onGround,false);assert.equal(p.obstacleId,null);assert.ok(p.y>top,'unsupported hull overhang falls immediately');
  }
});
