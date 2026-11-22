import test from 'node:test';
import assert from 'node:assert/strict';
import {drawRedWastesWorld} from '../src/red-wastes-world.js';
import {createRedWastesRoutes,RED_WASTES_SITES,structurePlacement} from '../src/red-wastes-layout.js';
import {surfaceHeight} from '../src/world.js';
import {stairCenterHeight} from '../src/walkable-routes.js';

test('sand painting joins continuously across every warped strip and reflected tile boundary',()=>{
 const image={width:2172,height:724};
 for(const camera of [0,14.617535054,1950,1980-1e-9,1980+1e-9,3959.999,8400,12730]){
  let matrix=[1,0,0,1,0,0],stack=[],draws=[];
  const c={fillRect(){},save(){stack.push([...matrix]);},restore(){matrix=stack.pop();},
   transform(a,b,d,e,x,y){matrix=[a,b,d,e,x,y];},translate(x,y){matrix[4]+=x;matrix[5]+=y;},scale(){},
   drawImage(img,sx,sy,sw,sh,x,y,w,h){if(img===image){assert(sx>=-1e-6&&sx+sw<=image.width+1e-6);const a=matrix[4]+matrix[0]*x,b=matrix[4]+matrix[0]*(x+w),ay=matrix[5]+matrix[1]*x,by=matrix[5]+matrix[1]*(x+w);draws.push({left:Math.min(a,b),top:a<b?ay:by,right:Math.max(a,b),end:a<b?by:ay});}}};
  drawRedWastesWorld(c,{'red-wastes-sand-plane':image},{},{camera,width:1280,height:900});
  draws.sort((a,b)=>a.left-b.left);assert(draws.length>20);
  for(let i=1;i<draws.length;i++){
   const a=draws[i-1],b=draws[i],join=(a.right+b.left)/2;
   const at=a.top+(a.end-a.top)*(join-a.left)/(a.right-a.left),bt=b.top+(b.end-b.top)*(join-b.left)/(b.right-b.left);
   assert(Math.abs(at-bt)<.01,`unjoined painted sand at camera ${camera}: ${at} vs ${bt}`);
  }
 }
});

test('skull walk supports follow nose and orbit bone rather than cutting straight through the illustration',()=>{
 const site=RED_WASTES_SITES.find(s=>s.kind==='skull'),b=structurePlacement(site),route=createRedWastesRoutes().find(r=>r.kind==='skull');
 const height=x=>{const world=site.x+x;const ramp=route.walkableEntries.find(r=>world>=Math.min(r.points[0][0],r.points.at(-1)[0])&&world<=Math.max(r.points[0][0],r.points.at(-1)[0]));return ramp?stairCenterHeight(ramp,world):surfaceHeight(route,world);};
 // Independent landmark samples in normalized original skull image coordinates.
 for(const [x,v] of [[300,.61],[590,.43],[800,.604],[960,.625],[1200,.67],[1400,.77]])
  assert(Math.abs(height(x)-(b.y+v*b.h))<20,`painted bone and physical support disagree at ${x}`);
});

test('skull orbital bone is solid underneath and the open eye remains empty',async()=>{
 const {createInkScene}=await import('../src/ink-scene.js');const {update}=await import('../src/engine.js');
 const g=createInkScene({level:5});g.schedule=[];g.enemies=[];g.pickups=[];
 const site=RED_WASTES_SITES.find(s=>s.kind==='skull'),route=g.platforms.find(r=>r.kind==='skull'),x=site.x+920,floor=surfaceHeight(route,x);
 Object.assign(g.player,{x,y:floor,supportY:floor,onGround:true,platformId:route.id,tier:1});
 update(g,{drop:true},1/60);
 assert(g.player.onGround,'cannot drop through opaque orbital bone');assert(Math.abs(g.player.y-floor)<1);
 Object.assign(g.player,{x,y:floor-100,onGround:false,platformId:null,vy:0});
 update(g,{},1/60);assert(g.player.y<floor-90,'eye interior is open');
 g.groundAt=()=>floor+500;
 Object.assign(g.player,{x,y:floor+230,onGround:false,platformId:null,vy:-650});
 for(let i=0;i<10;i++)update(g,{},1/60);
 assert(g.player.y>=floor+180,'jumping from beneath cannot pass through bone');
});


test('jumping inside the actual eye hits its bone ceiling while native walking stays open',async()=>{
 const {createInkScene}=await import('../src/ink-scene.js');const {update}=await import('../src/engine.js');
 const g=createInkScene({level:5});g.schedule=[];g.enemies=[];g.pickups=[];
 const site=RED_WASTES_SITES.find(s=>s.kind==='skull'),b=structurePlacement(site),route=g.platforms.find(r=>r.id===`${site.id}-tunnel`),x=site.x+900,floor=surfaceHeight(route,x),ceiling=b.y+.37*b.h;
 Object.assign(g.player,{x,y:floor,vy:0,onGround:false,platformId:null});
 const bodyHeight=Math.max(g.player.h,...g.playerHitboxes(g.player,g.time).map(r=>g.player.y-r.y));
 g.player.y=ceiling+bodyHeight+10;g.player.vy=-700;
 update(g,{},1/60);assert(Math.min(...g.playerHitboxes(g.player,g.time).map(r=>r.y))>=ceiling-.1);assert.equal(g.player.vy,0);
 for(let i=0;i<80;i++)update(g,{},1/60);
 assert(g.player.onGround);assert.equal(g.player.y,floor);
});

test('painted native cabin is stopped by eye ceiling with its complete visible height',async()=>{
 const {createInkScene}=await import('../src/ink-scene.js');const {update}=await import('../src/engine.js');
 for(const character of ['striker','gatling','bt']){
  const g=createInkScene({level:5,character});g.schedule=[];g.enemies=[];g.pickups=[];
  const site=RED_WASTES_SITES.find(s=>s.kind==='skull'),b=structurePlacement(site),ceiling=b.y+.37*b.h,p=g.player;
  const route=g.platforms.find(r=>r.id===`${site.id}-tunnel`),floor=surfaceHeight(route,site.x+900);
  Object.assign(p,{x:site.x+900,y:floor,supportY:floor,vy:0,onGround:true,platformId:route.id,tier:1});
  update(g,{jump:true},1/60);
  for(let i=0;i<20;i++){
   update(g,{},1/60);
   assert(Math.min(...g.playerHitboxes(p,g.time).map(r=>r.y))>=ceiling-.1,`${character} visible cabin enters opaque ceiling`);
  }
 }
});

test('BT cannon aiming after movement cannot extend its final painted pose into eye bone',async()=>{
 const {createInkScene}=await import('../src/ink-scene.js');const {update}=await import('../src/engine.js');
 for(const targetY of [-600,-150,200,600]){
  const g=createInkScene({level:5,character:'bt'});g.schedule=[];g.pickups=[];
  const site=RED_WASTES_SITES.find(s=>s.kind==='skull'),b=structurePlacement(site),ceiling=b.y+.37*b.h,p=g.player,route=g.platforms.find(r=>r.id===`${site.id}-tunnel`),x=site.x+900,floor=surfaceHeight(route,x);
  Object.assign(p,{x,y:floor,supportY:floor,vy:0,onGround:true,platformId:route.id,tier:1,invulnerable:1000});
  g.enemies=[{id:'aim-target',type:'turret',x:x+300,y:ceiling+targetY,hp:100000,maxHp:100000,cooldown:999,phase:0,hit:0,firePose:0}];
  update(g,{jump:true,fire:true},1/60);
  for(let i=0;i<40;i++){
   update(g,{fire:true},1/60);
   assert(Math.min(...g.playerHitboxes(p,g.time).map(r=>r.y))>=ceiling-.1,`final aimed BT pose overlaps ceiling, target ${targetY}, frame ${i}`);
  }
 }
});

test('a newly extended final weapon pose is resolved even after upward velocity was stopped',async()=>{
 const {createInkScene}=await import('../src/ink-scene.js');const {resolveRedWastesSolids}=await import('../src/red-wastes-layout.js');
 const g=createInkScene({level:5,character:'bt'}),p=g.player,site=RED_WASTES_SITES.find(s=>s.kind==='skull'),b=structurePlacement(site),ceiling=b.y+.37*b.h;
 Object.assign(p,{x:site.x+900,y:ceiling+100,onGround:false,vy:0,platformId:null,rampId:null});
 // A weapon articulation can extend after the movement pass has stopped vy.
 g.playerHitboxes=actor=>[{x:actor.x-20,y:actor.y-150,w:40,h:150}];
 resolveRedWastesSolids(g,p,p.x,p.y,{finalPose:true});
 assert(g.playerHitboxes(p)[0].y>=ceiling,'newly extended cannon remains outside painted bone');
});

test('late flat sand preserves the illustrated backdrop through its transparent crest and covers the bottom',()=>{
 const sand={width:2172,height:724};let matrix=[1,0,0,1,0,0],stack=[],bottoms=[],rectangles=[];
 const c={save(){stack.push([...matrix]);},restore(){matrix=stack.pop();},transform(...m){matrix=m;},fillRect(...r){rectangles.push(r);},drawImage(img,sx,sy,sw,sh,x,y,w,h){if(img===sand)bottoms.push(Math.min(matrix[5],matrix[5]+matrix[1]*w)+h);}};
 drawRedWastesWorld(c,{'red-wastes-sand-plane':sand},{},{camera:20500,width:1280,height:900});
 assert.equal(rectangles.length,0,'transparent dune crest must show the illustrated backdrop, without a flat opaque color band');
 assert(bottoms.length>0);assert(Math.min(...bottoms)>=900,'the late sand painting covers the entire visible lower edge');
});

test('foreground bone lip never rises above the shared physical route to erase a cabin',async()=>{
 const {drawRedWastesFrontStructures}=await import('../src/red-wastes-world.js');
 const route=createRedWastesRoutes().find(route=>route.kind==='skull'),path=[];
 const c={save(){},restore(){},beginPath(){},moveTo(x,y){path.push([x,y]);},lineTo(x,y){path.push([x,y]);},closePath(){},clip(){},drawImage(){}};
 drawRedWastesFrontStructures(c,{'red-wastes-skull':{}},{},{camera:8000,width:2000});
 const physical=[...route.walkableEntries[0].points,...route.points.slice(1),...route.walkableEntries[1].points.slice(0,-1).reverse()];
 assert.deepEqual(path.slice(1,-1),physical.map(([x,y])=>[x-8000,y+4]));
});

test('native cabin and weapon extents reach the solid eye ceiling before their anchor',async()=>{
 const {createInkScene}=await import('../src/ink-scene.js');const {resolveRedWastesSolids}=await import('../src/red-wastes-layout.js');
 for(const character of ['striker','gatling','bt']){
  const g=createInkScene({level:5,character}),p=g.player,crown=g.worldSolids.find(s=>s.bottomPoints),left=crown.points[0][0],ceiling=crown.bottomPoints[0][1];
  Object.assign(p,{x:left-10,y:ceiling+100,onGround:false,vy:-100});
  g.playerHitboxes=actor=>[{x:actor.x-10,y:actor.y-120,w:40,h:120}];
  resolveRedWastesSolids(g,p,p.x,p.y,{finalPose:true});
  assert(g.playerHitboxes(p)[0].y>=ceiling,character);assert.equal(p.vy,0);
 }
});

test('distant giant pass is occluded by native sand and structure painting',()=>{
 const sand={width:2172,height:724},skull={width:1536,height:1024},draws=[];
 const c=new Proxy({},{get:(_,key)=>(...args)=>{if(key==='drawImage')draws.push(args[0]);},set:()=>true});
 drawRedWastesWorld(c,{'red-wastes-sand-plane':sand,'red-wastes-skull':skull},{},{camera:8400,width:1280,height:900,beforeStructures:()=>draws.push('giant')});
 assert.equal(draws[0],'giant');assert(draws.includes(sand));assert(draws.includes(skull));
});
