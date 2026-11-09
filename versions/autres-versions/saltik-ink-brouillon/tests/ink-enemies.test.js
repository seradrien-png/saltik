import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update} from '../src/engine.js';
import {createEnemySaltik,advanceEnemySaltik} from '../src/enemy-saltik.js';
import * as actors from '../src/ink-actors.js';
const saltik=await import('../src/ink-enemy-saltik.js').catch(()=>({}));
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} versus ${b}`);
// A minimal Canvas2D recorder retains the real draw transform so checks can
// measure the final painted pixel, rather than repeating geometry code.
function canvas(){
 let m=[1,0,0,1,0,0],stack=[];const calls=[],flashes=[],arcs=[];
 const point=(x,y)=>({x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]});
 return {calls,flashes,arcs,globalAlpha:1,save(){stack.push([...m]);},restore(){m=stack.pop();},
  translate(x,y){const p=point(x,y);m[4]=p.x;m[5]=p.y;},
  scale(x,y){m[0]*=x;m[1]*=x;m[2]*=y;m[3]*=y;},
  rotate(a){const [a0,b,c,d]=m,co=Math.cos(a),si=Math.sin(a);m[0]=a0*co+c*si;m[1]=b*co+d*si;m[2]=c*co-a0*si;m[3]=d*co-b*si;},
  drawImage(...args){const [image,sx,sy,sw,sh,dx,dy,dw,dh]=args,transform=[...m];calls.push({image,sx,sy,sw,sh,sourcePoint(x,y){const xx=dx+(x-sx)/sw*dw,yy=dy+(y-sy)/sh*dh;return{x:transform[0]*xx+transform[2]*yy+transform[4],y:transform[1]*xx+transform[3]*yy+transform[5]};}});},
  beginPath(){},rect(){},clip(){},ellipse(){},arc(...args){arcs.push(args);},setLineDash(){},fill(){},stroke(){},moveTo(x,y){flashes.push(point(x,y));},lineTo(){},closePath(){}};
}
const painted={walker:{muzzle:[32,240],base:[300,245]},soldier:{muzzle:[548,294],base:[780,307]},turret:{muzzle:[1036,266],base:[1250,270]},drone:{muzzle:[1656,448],base:[1850,465]}};

test('every Ink hostile shot leaves its painted weapon in the direction of its barrel for both facings',()=>{
 assert.equal(typeof actors.inkEnemyGeometry,'function','Ink weapons need measured native geometry');
 for(const type of Object.keys(painted))for(const facing of [-1,1]){
  const g=createGame();g.schedule=[];g.platforms=[];g.obstacles=[];g.pickups=[];g.groundAt=()=>620;
  g.player.x=facing===-1?180:900;g.player.y=620;g.player.supportY=620;g.maxX=g.player.x;
  const e={id:92,type,x:500,y:620,origin:500,hp:12,maxHp:12,cooldown:0,phase:0,hit:0,firePose:0};g.enemies=[e];
  g.enemyWeaponGeometry=actors.inkEnemyGeometry;update(g,{},1/600);
  const shot=g.projectiles.find(s=>s.team==='enemy');assert.ok(shot,`${type} fired a physical shot`);
  const c=canvas();actors.drawInkEnemy(c,{width:2172,height:724},e,{time:g.time});
  const draw=c.calls[0],p=draw.sourcePoint(...painted[type].muzzle),base=draw.sourcePoint(...painted[type].base);
  close(shot.launchX,p.x);close(shot.launchY,p.y);
  const n=Math.hypot(p.x-base.x,p.y-base.y),speed=Math.hypot(shot.vx,shot.vy);
  close(shot.vx/speed,(p.x-base.x)/n);close(shot.vy/speed,(p.y-base.y)/n);
  assert.equal(Math.sign(shot.vx),facing);assert.equal(e.dir,facing);
 }
});

test('Ink Saltik guns and both raised pods launch from the native atlas apertures',()=>{
 assert.equal(typeof saltik.inkEnemySaltikGeometry,'function','native Ink enemy Saltik geometry is missing');
 for(const dir of [-1,1]){
  const e=createEnemySaltik({id:93,x:700},{y:620,random:0});e.dir=dir;e.cooldown=0;
  const player={x:dir===-1?200:1200,y:620,hp:100};let missiles=0,guns=0;
  for(let time=0;time<4;time+=1/120){
   const result=advanceEnemySaltik(e,{player,dt:1/120,time,geometry:saltik.inkEnemySaltikGeometry});
   if(!result.shots.length)continue;
   const c=canvas();saltik.drawInkEnemySaltik(c,{width:1983,height:793},e,{time});
   const draw=c.calls[0],gun=draw.sourcePoint(851,394),gunBase=draw.sourcePoint(720,401);
   const mouths=[[358,90],[917,145]].map(p=>draw.sourcePoint(...p));
   const axes=[[[358,90],[250,100]],[[917,145],[802,151]]].map(([a,b])=>{const p=draw.sourcePoint(...a),q=draw.sourcePoint(...b),n=Math.hypot(p.x-q.x,p.y-q.y);return{x:(p.x-q.x)/n,y:(p.y-q.y)/n};});
   for(const shot of result.shots){
    const speed=Math.hypot(shot.vx,shot.vy);
    if(shot.kind==='plasma'){
     close(shot.x,gun.x);close(shot.y,gun.y);guns++;
     const n=Math.hypot(gun.x-gunBase.x,gun.y-gunBase.y);close(shot.vx/speed,(gun.x-gunBase.x)/n);close(shot.vy/speed,(gun.y-gunBase.y)/n);
    }else{
     const index=mouths.findIndex(p=>Math.hypot(shot.x-p.x,shot.y-p.y)<1e-7);assert.ok(index>=0,'missile starts inside one of the two painted raised pods');
     close(shot.vx/speed,axes[index].x);close(shot.vy/speed,axes[index].y);missiles++;
    }
   }
  }
  assert.ok(guns>=3);assert.equal(missiles,2);
 }
});

test('the front impact view uses native front pixels at full width and leaves simulation untouched',()=>{
 assert.equal(typeof saltik.drawInkEnemySaltik,'function','front-view native drawing is missing');
 const c=canvas(),e={type:'saltik',x:500,y:600,hp:24,dir:-1},before=structuredClone(e);
 const pose=saltik.drawInkEnemySaltik(c,{width:1983,height:793},e,{view:'front',scale:3});
 assert.deepEqual(e,before);assert.equal(pose.view,'front');assert.ok(pose.bounds.w>280);
 assert.ok(c.calls.length>=1);assert.ok(c.calls.every(call=>call.sx>=1084),'only the new front-facing artwork is used');
 const foot=c.calls[0].sourcePoint(1506,772);close(foot.x,500);close(foot.y,600);
});

test('a flying Ink drone tilts its native barrel toward a player on the lower ground',()=>{
 for(const facing of [-1,1]){
  const g=createGame();g.groundAt=()=>620;g.schedule=[];g.platforms=[];g.obstacles=[];g.pickups=[];
  g.player.x=facing===-1?180:900;g.player.y=620;g.player.supportY=620;g.maxX=g.player.x;
  const e={id:92,type:'drone',x:500,y:480,origin:500,hp:12,maxHp:12,cooldown:0,phase:0,hit:0,firePose:0};g.enemies=[e];g.enemyWeaponGeometry=actors.inkEnemyGeometry;
  update(g,{},1/600);const shot=g.projectiles.find(s=>s.team==='enemy');
  assert.ok(shot.vy>0,'the airborne drone must threaten the ground player');
  const atPlayer=shot.launchY+(g.player.x-shot.launchX)*shot.vy/shot.vx;
  assert.ok(Math.abs(atPlayer-(g.player.y-32))<.5,'the real projectile retains V1 target acquisition');
  const c=canvas();actors.drawInkEnemy(c,{},e,{time:g.time});const mouth=c.calls[0].sourcePoint(1656,448);
  close(mouth.x,shot.launchX);close(mouth.y,shot.launchY);
 }
});

test('native Ink Saltik defenses and missile locks visibly distinguish the protected attack states',()=>{
 const e={x:700,y:620,hp:6,dir:-1,hit:0,firePose:0},image={};
 const idle=canvas();saltik.drawInkEnemySaltik(idle,image,e);
 const deflect=canvas();saltik.drawInkEnemySaltik(deflect,image,{...e,guard:true,guardFlash:.2,guardResponse:'deflect'});
 assert.ok(deflect.flashes.length>idle.flashes.length,'guarding ranged hits produces visible ink ricochets');
 const dodge=canvas(),dodging={...e,guard:true,guardFlash:.13,guardResponse:'dodge'};
 saltik.drawInkEnemySaltik(dodge,image,dodging);
 const before=idle.calls[0].sourcePoint(851,394),after=dodge.calls[0].sourcePoint(851,394);
 assert.ok(Math.hypot(before.x-after.x,before.y-after.y)>3,'the actual native sprite ducks away from ranged fire');
 const geo=saltik.inkEnemySaltikGeometry(dodging);close(after.x,geo.muzzle.x);close(after.y,geo.muzzle.y);
 const locking=canvas();saltik.drawInkEnemySaltik(locking,image,{...e,attackPhase:'lock',lockProgress:.5,podRaise:1});
 assert.ok(locking.arcs.some(a=>a[2]>30&&Math.abs(a[4]-a[3]-Math.PI)<1e-7),'a half-complete lock draws a half-ring telegraph before the paired launch');
});

test('the reference enemy keeps a full-sized cabin below two tall jointed launchers',()=>{
 const e={x:500,y:620,hp:24,dir:1},c=canvas();
 const geo=saltik.drawInkEnemySaltik(c,{},e),draw=c.calls[0];
 const cabinLeft=draw.sourcePoint(365,325),cabinRight=draw.sourcePoint(758,325);
 close(cabinRight.x-cabinLeft.x,70);
 const top=draw.sourcePoint(358,10),feet=draw.sourcePoint(521,772);
 assert.ok(cabinLeft.y-top.y>55,'the tall launcher struts remain above the cabin');
 assert.ok(feet.y-top.y>135,'the complete enemy is not squeezed into its old 112px height');
 assert.ok(geo.podMuzzles.every(p=>p.y<cabinLeft.y-30));
 assert.ok(geo.muzzleDirection.x>.99,'the new source image faces right before mirroring');
 close(feet.x,e.x);close(feet.y,e.y);
});
