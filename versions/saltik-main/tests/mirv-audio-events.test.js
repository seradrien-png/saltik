import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene,updateInkScene,inkWeaponGeometry} from '../src/ink-scene.js';

const DT=1/60;
function fixture(character='striker'){
 const g=createInkScene({character});
 Object.assign(g,{schedule:[],enemies:[],obstacles:[],platforms:[],pickups:[],groundAt:()=>600});
 Object.assign(g.player,{x:6000,y:600,supportY:600,dir:1,invulnerable:99});g.maxX=6000;
 return g;
}
function tick(g,n=1,input={}){for(let i=0;i<n;i++)updateInkScene(g,input,DT);}
function aim(g,frames){tick(g,frames,{missile:true,missileHeld:true});}
function release(g){tick(g,1,{missileReleased:true,missileHeld:false});}
function audioEvents(g,type){return g.events.filter(e=>type?e.type===type:e.type.startsWith('mirv-'));}

for(const [range,frames,angle] of [
 ['short',40,1.0998321621063138],['medium',120,.7418243113814441],['long',200,.35268240262181133]
])test(`Striker ${range} MIRV audio follows the real carrier, separation and five individual terrain collisions`,()=>{
 const g=fixture();aim(g,frames);
 assert.equal(audioEvents(g).length,0,'aiming must not play a launch');
 assert.equal(g.player.cannonElevation,angle,'the existing aim sweep must retain its angle');
 release(g);
 const parent=g.projectiles.find(s=>s.kind==='mirv');assert.ok(parent);
 const launches=audioEvents(g,'mirv-launch');assert.equal(launches.length,1);
 assert.equal(launches[0].projectileId,parent.id);assert.equal(launches[0].salvoId,parent.id);
 assert.equal(parent.mirvSalvoId,parent.id);
 const missile=g.events.find(e=>e.type==='missile');
 assert.equal(missile.mirvAudio,true);assert.equal(missile.projectileId,parent.id);assert.equal(missile.salvoId,parent.id);
 assert.equal(audioEvents(g,'mirv-separation').length,0);
 assert.equal(audioEvents(g,'mirv-impact').length,0);
 let childIds=null;const impactTimes=new Set();
 for(let frame=0;frame<300;frame++){
  const before=audioEvents(g,'mirv-impact').length;tick(g);
  const separation=audioEvents(g,'mirv-separation');
  if(separation.length&&!childIds){
   assert.equal(separation.length,1);assert.equal(separation[0].projectileId,parent.id);assert.equal(separation[0].salvoId,parent.id);
   const children=g.projectiles.filter(s=>s.kind==='grenade');assert.equal(children.length,5);
   childIds=children.map(s=>s.id);
   assert.deepEqual(separation[0].childIds,childIds);
   assert.ok(children.every(s=>s.mirvSalvoId===parent.id));
   assert.ok(!g.projectiles.some(s=>s.id===parent.id));
  }
  for(const impact of audioEvents(g,'mirv-impact').slice(before)){
   assert.ok(childIds?.includes(impact.projectileId),'an impact must belong to an actually deployed child');
   assert.equal(impact.salvoId,parent.id);assert.equal(impact.collisionKind,'world');
   assert.ok(Math.abs(impact.y-597)<.05);
   assert.ok(!g.projectiles.some(s=>s.id===impact.projectileId),'impact follows projectile removal on the collision tick');
   impactTimes.add(frame);
  }
 }
 const impacts=audioEvents(g,'mirv-impact');assert.equal(impacts.length,5);
 assert.equal(new Set(impacts.map(e=>e.projectileId)).size,5);
 assert.deepEqual([...impacts.map(e=>e.projectileId)].sort((a,b)=>a-b),[...childIds].sort((a,b)=>a-b));
 assert.ok(impactTimes.size>1,'individual impacts must follow actual separate collision times');
 assert.equal(audioEvents(g,'mirv-separation').length,1);
 const explosions=g.events.filter(e=>e.type==='explosion');assert.equal(explosions.length,5);
 for(const impact of impacts)assert.ok(explosions.some(e=>e.x===impact.x&&e.y===impact.y&&e.radius===147.5));
 assert.equal(g.stats.mirvs,1);assert.equal(g.stats.shots,0);
});

test('an actual carrier collision with cover produces one impact and no separation',()=>{
 const g=fixture();aim(g,100);
 const wallX=inkWeaponGeometry(g.player,g.time).cannon.x+80;
 g.obstacles=[{id:'near-wall',type:'rock',x:wallX,y:600,w:70,h:600,hp:99,maxHp:99,hit:0}];
 release(g);const parent=g.projectiles.find(s=>s.kind==='mirv');assert.ok(parent);tick(g,120);
 assert.equal(audioEvents(g,'mirv-launch').length,1);assert.equal(audioEvents(g,'mirv-separation').length,0);
 const impacts=audioEvents(g,'mirv-impact');assert.equal(impacts.length,1);
 assert.equal(impacts[0].projectileId,parent.id);assert.equal(impacts[0].salvoId,parent.id);
 assert.equal(impacts[0].collisionKind,'target');assert.ok(impacts[0].x<wallX);
 assert.equal(g.events.filter(e=>e.type==='cluster').length,0);
 assert.equal(g.events.filter(e=>e.type==='explosion').length,1);
});

test('a MIRV child lifetime expiry retains its existing blast without inventing an impact',()=>{
 const g=fixture();aim(g,40);release(g);
 for(let i=0;i<90&&!g.projectiles.some(s=>s.kind==='grenade');i++)tick(g);
 const children=g.projectiles.filter(s=>s.kind==='grenade');assert.equal(children.length,5);
 const expired=children[0];expired.life=DT/2;tick(g);
 assert.ok(!g.projectiles.some(s=>s.id===expired.id));assert.equal(audioEvents(g,'mirv-impact').length,0);
 assert.equal(g.events.filter(e=>e.type==='explosion').length,1,'preserve the existing lifetime-expiry blast');
 tick(g,300);const impacts=audioEvents(g,'mirv-impact');assert.equal(impacts.length,4);
 assert.ok(impacts.every(e=>e.projectileId!==expired.id));
});

test('carrier lifetime expiry produces neither separation nor phantom impact',()=>{
 const g=fixture();aim(g,40);release(g);const parent=g.projectiles.find(s=>s.kind==='mirv');parent.life=DT/2;tick(g,300);
 assert.equal(audioEvents(g,'mirv-launch').length,1);
 assert.equal(audioEvents(g,'mirv-separation').length,0);assert.equal(audioEvents(g,'mirv-impact').length,0);
});

for(const character of ['gatling','bt'])test(`${character} weapons emit no Striker MIRV audio events`,()=>{
 const g=fixture(character);tick(g,60,{fire:true,fireHeld:true,missile:true,missileHeld:true});
 tick(g,1,{missileReleased:true,missileHeld:false,homing:true});tick(g,300);
 assert.ok(g.stats.shots>0,'exercise the character’s actual cannon');
 assert.ok(g.events.some(e=>e.type===(character==='bt'?'bt-rocket':'gatling-rocket')),'exercise the character’s actual missiles');
 assert.equal(audioEvents(g).length,0);
 assert.ok(g.events.filter(e=>e.type==='missile').every(e=>!e.mirvAudio));
});

for(const [range,frames,offset,hp] of [
 ['short',40,298,72],['medium',120,696,72],['long',200,1039,54]
])test(`${range} MIRV audio metadata preserves existing blast damage`,()=>{
 const g=fixture();aim(g,frames);
 const rock={id:'damage-probe',type:'rock',x:6000+offset,y:600,w:30,h:50,hp:99,maxHp:99,hit:0};g.obstacles=[rock];
 release(g);tick(g,300);
 assert.equal(rock.hp,hp,'damage matches the pre-audio simulation baseline');
 assert.equal(g.events.filter(e=>e.type==='explosion').length,5);
 assert.equal(audioEvents(g,'mirv-impact').length,5);
 assert.deepEqual(g.stats,{kills:0,shots:0,mirvs:1,homingSalvos:0,meleeSwings:0,meleeHits:0,interceptions:0,score:0,obstacles:0});
});
