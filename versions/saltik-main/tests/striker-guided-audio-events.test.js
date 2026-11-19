import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update} from '../src/engine.js';

function detonate({hp=16,character='striker',kind='homing',btRocket=false,enemy=true}={}){
 const game=createGame({character});game.schedule=[];game.obstacles=[];game.platforms=[];
 game.enemies=enemy?[{id:900,type:'drone',x:600,y:395,hp,maxHp:hp,vx:0,vy:0,phase:0,fireIn:10}]:[];
 game.projectiles=[{id:901,kind,btRocket,team:'player',x:600,y:395,vx:390,vy:0,life:3,age:0,damage:8,splash:45,radius:5,targetId:900}];
 if(!enemy)game.projectiles[0].y=1000;
 update(game,{},1/120);return game;
}
test('guided enemy hits and kills add audio metadata without changing damage',()=>{
 for(const hp of [16,4]){
  const g=detonate({hp});const event=g.events.find(e=>e.strikerGuided);
  assert.ok(event,'actual enemy blast must carry Striker audio metadata');
  assert.equal(event.enemyImpact,true);assert.equal(event.enemyDestroyed,hp<=8);
  const target=g.enemies.find(e=>e.id===900);assert.equal(target?.hp??0,hp<=8?0:hp-8);
  if(hp<=8)assert.ok(g.events.some(e=>e.strikerGuidedCompanion),'destruction report is coalesced with its guided blast');
 }
});
test('BT rockets, other player weapons and empty-world guided impacts keep existing audio metadata',()=>{
 for(const options of [{character:'bt',btRocket:true},{character:'gatling',kind:'gatling-rocket'},{kind:'bullet'},{enemy:false}]){
  assert.ok(!detonate(options).events.some(e=>e.strikerGuided||e.strikerGuidedCompanion),JSON.stringify(options));
 }
});


test('main-fire reload start and completion preserve the 1.32 second engine cycle',()=>{
 const g=createGame();g.schedule=[];g.obstacles=[];g.enemies=[];const events=[];let elapsed=0;
 for(let i=0;i<650;i++){
  g.events=[];update(g,{fire:true},1/120);elapsed+=1/120;
  for(const e of g.events)if(e.type==='reload-start'||e.type==='reload-end')events.push({...e,elapsed});
  if(events.some(e=>e.type==='reload-end'))break;
 }
 assert.deepEqual(events.map(e=>e.type),['reload-start','reload-end']);
 assert.ok(events[0].elapsed>=2.99,'main magazine must reach its native fire duration before reloading');
 assert.ok(Math.abs(events[1].elapsed-events[0].elapsed-1.32)<1/120+.000001);
});
