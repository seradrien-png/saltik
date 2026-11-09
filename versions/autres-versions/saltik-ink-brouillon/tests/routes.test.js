import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,terrainHeight,surfaceHeight} from '../src/engine.js';
const step=(g,input={},seconds=1)=>{for(let i=0;i<Math.ceil(seconds*60);i++)update(g,input,1/60);};
function quiet(){const g=createGame();g.schedule=[];g.obstacles=[];return g;}
function atEntry(g,route){
  const p=g.player;p.x=route.x1+12;p.y=route.lower?surfaceHeight(route.lower,p.x):terrainHeight(p.x);p.tier=route.lower?.tier??0;p.platformId=route.lower?.id??null;p.onGround=true;p.vx=0;p.vy=0;g.jumpHeld=false;
}
function climb(g,route){atEntry(g,route);step(g,{right:true,jump:true},1.05);assert.equal(g.player.platformId,route.id,`${route.id} must be reached with the ordinary jump`);assert.ok(g.player.onGround);}

test('every authored alternative is entered by one ordinary jump from its real lower support',()=>{
  for(const route of createGame().platforms){const g=quiet(),actual=g.platforms.find(p=>p.id===route.id);climb(g,actual);assert.equal(g.player.y,surfaceHeight(actual,g.player.x));assert.ok(g.player.supportPose.contacts.some(c=>c.grounded));}
});
test('descend begins a real fall and a held press passes only one actual floor',()=>{
  const g=quiet(),top=g.platforms.find(p=>p.tier===2);climb(g,top);const y=g.player.y;
  step(g,{drop:true},1/60);assert.ok(g.player.y>y&&g.player.y<y+10);step(g,{drop:true},1.2);assert.equal(g.player.platformId,top.lower.id);assert.ok(g.player.onGround);
  step(g,{},.05);step(g,{drop:true},1.2);assert.equal(g.player.tier,0);assert.equal(g.player.y,terrainHeight(g.player.x));
});
test('walking beyond every finite route falls onto the nearest real lower support',()=>{
  for(const route of createGame().platforms){const g=quiet(),actual=g.platforms.find(p=>p.id===route.id);climb(g,actual);let frames=0;while(g.player.x<actual.x2+155&&frames++<600)step(g,{right:true},1/60);step(g,{},.8);assert.ok(g.player.onGround);assert.equal(g.player.platformId,actual.lower?.id??null,`${actual.id} has no invented exit floor`);}
});
test('holding jump never climbs a second floor until it is released and pressed again',()=>{
  const g=quiet(),top=g.platforms.find(p=>p.tier===2),p=g.player;atEntry(g,top.lower);step(g,{right:true,jump:true},2.1);step(g,{jump:true},1);assert.equal(p.platformId,top.lower.id);step(g,{},.1);step(g,{jump:true},1);assert.equal(p.platformId,top.id);
});
test('an ordinary forward route run visits all seven alternatives including both wreck fragments',()=>{
  const g=quiet(),visited=new Set();
  for(let frame=0;frame<90*60&&g.player.x<16300;frame++){
    const p=g.player,input={right:true},route=g.platforms.find(r=>p.x>r.x1+20&&p.x<r.x1+115&&(p.platformId??null)===(r.lower?.id??null));
    if(p.onGround&&!g.jumpHeld&&route)input.jump=true;update(g,input,1/60);
    if(g.player.onGround&&g.player.platformId)visited.add(g.player.platformId);
  }
  assert.deepEqual([...visited].sort(),g.platforms.map(p=>p.id).sort());assert.equal(g.player.tier,0);
});
function barrierGame(){const g=createGame();g.schedule=[];g.platforms=[];g.obstacles=[{id:'test',type:'barricade',tier:0,x:600,y:terrainHeight(600),w:72,h:66,hp:8,maxHp:8,hit:0}];return g;}
test('solid cover blocks the first approach before contact and gun fire free the path',()=>{const g=barrierGame();g.player.x=480;g.player.y=terrainHeight(480);step(g,{right:true},.35);assert.ok(g.player.x<=506.01,`passed solid obstacle at ${g.player.x}`);assert.ok(g.obstacles[0].hp>0,'a solid hull must block before destruction');step(g,{right:true,fire:true},3);assert.equal(g.obstacles[0].hp<=0,true);assert.ok(g.player.x>700);assert.ok(g.events.some(e=>e.type==='debris'));});
test('a MIRV grenade blast destroys solid rock and its route becomes passable',()=>{const g=barrierGame();g.obstacles[0].type='rock';step(g,{right:true,missile:true},3);assert.ok(g.obstacles[0].hp<=0);assert.ok(g.player.x>600);});
test('a jump clears a low solid obstacle and lands on terrain',()=>{const g=barrierGame();g.obstacles[0].h=52;while(g.player.x<440)step(g,{right:true},1/60);step(g,{right:true,jump:true},.8);step(g,{right:true},1);assert.ok(g.player.x>700);assert.equal(g.player.tier,0);assert.ok(g.player.onGround);assert.equal(g.obstacles[0].hp,8);});
test('projectiles damage the closest intersected solid before enemies regardless of array order',()=>{const g=barrierGame();g.enemies=[{id:1,type:'walker',x:780,y:terrainHeight(780),hp:5,maxHp:5,cooldown:99,phase:0}];g.projectiles=[{x:400,y:terrainHeight(600)-40,vx:30000,vy:0,team:'player',damage:2,life:1,radius:3,kind:'bullet'}];step(g,{},1/60);assert.equal(g.obstacles[0].hp,6);assert.equal(g.enemies[0].hp,5);});
test('a barricade on the brief upper roof blocks and can be destroyed from that support',()=>{
  const g=quiet(),roof=g.platforms.find(p=>p.tier===2);atEntry(g,roof);step(g,{jump:true},1);assert.equal(g.player.platformId,roof.id);
  const x=g.player.x+240;g.obstacles=[{id:'upper-test',type:'barricade',tier:2,platformId:roof.id,x,y:surfaceHeight(roof,x),w:72,h:62,hp:8,maxHp:8,hit:0}];step(g,{right:true},.8);assert.ok(g.obstacles[0].hp>0);assert.ok(g.player.x<=x-94+.1);step(g,{right:true,fire:true,missile:true},2);assert.ok(g.obstacles[0].hp<=0);
});
test('every elevated scheduled enemy has an existing named crown and safe end margins',()=>{
  const g=createGame();for(const e of g.schedule.filter(e=>e.platformId)){const p=g.platforms.find(p=>p.id===e.platformId);assert.ok(p);assert.equal(e.tier,p.tier);assert.ok(e.x>=p.x1+50&&e.x<=p.x2-50);}
});
