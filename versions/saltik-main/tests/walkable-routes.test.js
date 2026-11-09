import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update} from '../src/engine.js';
import {surfaceHeight,supportHeight,terrainAt} from '../src/world.js';
import {stairCenterHeight,stairSurfaceHeight,stairTreads,advanceWalkableSupport} from '../src/walkable-routes.js';
import {inkSaltikGeometry} from '../src/ink-saltik.js';
import {inkTurnGeometry} from '../src/ink-turn.js';
import {computeSupportPose} from '../src/support-pose.js';
import {applyInkLandmarkLayout,INK_STAIRS} from '../src/ink-demo-layout.js';

const close=(a,b,tolerance=.05)=>assert.ok(Math.abs(a-b)<tolerance,`${a} versus ${b}`);
const geometry={surfaceHeight,terrainAt};

test('multi-segment stairs clamp to their actual endpoints in both horizontal directions',()=>{
  for(const dir of [-1,1]){
    const entry={points:[[100*dir,600],[200*dir,560],[400*dir,430]],stepRun:18};
    close(stairCenterHeight(entry,50*dir),600);close(stairCenterHeight(entry,450*dir),430);
    close(stairSurfaceHeight(entry,50*dir),600);close(stairSurfaceHeight(entry,450*dir),430);
    close(stairCenterHeight(entry,300*dir),495);
    const treads=stairTreads(entry);assert.ok(treads.length>10);
    for(const tread of treads)close(stairSurfaceHeight(entry,(tread.x1+tread.x2)/2),tread.y);
  }
});

function stairGame(){
  const g=createGame();g.inkCampaign=true;g.groundAt=()=>600;g.schedule=[];g.obstacles=[];g.pickups=[];
  const left={id:'left-stairs',lowerId:null,points:[[100,600],[400,400]],stepRun:18};
  const right={id:'right-stairs',lowerId:null,points:[[1200,600],[900,400]],stepRun:18};
  g.platforms=[{id:'roof',tier:1,x1:300,x2:1000,points:[[300,400],[1000,400]],walkableEntries:[left,right]}];
  Object.assign(g.player,{x:80,y:600,onGround:true,platformId:null,vx:0,vy:0,dir:1,turn:null});
  return g;
}
function walkTo(g,x,direction){
  let frames=0;
  while((g.player.x-x)*direction<0&&frames++<600){
    update(g,{[direction===1?'right':'left']:true},1/60);
    assert.ok(g.player.onGround,`walking support lost at ${g.player.x}, ${g.player.y}`);
    assert.equal(g.player.vy,0);
    if(g.player.rampId){
      const geo=inkSaltikGeometry(g.player,{time:g.time});
      assert.ok(geo.legs.some(leg=>leg.grounded));
      for(const leg of geo.legs)if(leg.grounded)close(leg.contact.y,supportHeight(g,g.player,leg.contact.x));
    }
  }
  assert.ok(frames<600);
}
test('ordinary movement walks up and down either staircase without a jump or fall',()=>{
  const g=stairGame();walkTo(g,450,1);assert.equal(g.player.platformId,'roof');close(g.player.y,400);
  walkTo(g,80,-1);assert.equal(g.player.platformId,null);close(g.player.y,600);
  Object.assign(g.player,{x:1220,y:600,platformId:null,rampId:null,dir:-1,turn:null});
  walkTo(g,850,-1);assert.equal(g.player.platformId,'roof');close(g.player.y,400);
  walkTo(g,1220,1);assert.equal(g.player.platformId,null);close(g.player.y,600);
  assert.equal(g.events.some(event=>event.type==='jump'),false);
});

test('walking below the stairs or on the wrong tier cannot attach to their upper end',()=>{
  const g=stairGame(),p={...g.player,x:399,y:600,platformId:null};
  assert.equal(advanceWalkableSupport(g,p,401,600,geometry),null);assert.equal(p.rampId,null);
  p.x=101;p.platformId='different-tier';assert.equal(advanceWalkableSupport(g,p,99,600,geometry),null);
});

test('jumping off a stair lands back on its real treads and dropping releases them',()=>{
  const g=stairGame();walkTo(g,240,1);const y=g.player.y;
  update(g,{jump:true},1/60);assert.equal(g.player.onGround,false);assert.equal(g.player.rampId,null);
  for(let i=0;i<100;i++)update(g,{},1/60);
  assert.equal(g.player.rampId,'left-stairs');assert.equal(g.player.onGround,true);close(g.player.y,y);
  update(g,{drop:true},1/60);assert.equal(g.player.rampId,null);assert.equal(g.player.onGround,false);
});

test('native side and turn views articulate original wheels across steep illustrated treads',()=>{
  for(const dir of [-1,1])for(const slope of [-.64,.64])for(const x of [170,183,206,237,269,318]){
    const entry={points:[[0,600],[600,600+slope*600]],stepRun:18},floor=at=>stairSurfaceHeight(entry,at);
    const p={x,y:stairCenterHeight(entry,x),dir,onGround:true,vx:230,vy:0,supportClearance:Infinity};
    p.supportY=p.y;p.supportPose=computeSupportPose(p,floor);p.tilt=p.supportPose.tilt;
    const geo=inkSaltikGeometry(p,{time:.2});assert.equal(Math.sign(geo.tilt),Math.sign(slope));
    assert.ok(Math.abs(geo.tilt)>.3,'the rigid cabin visibly follows the climb');
    for(const leg of geo.legs){assert.equal(leg.grounded,true);close(leg.contact.y,floor(leg.contact.x));assert.ok(Math.abs(leg.roll*geo.k)<=7.01);}
    const left=geo.sourcePoint([877,711]),right=geo.sourcePoint([1005,711]);close(Math.hypot(left.x-right.x,left.y-right.y),128*geo.k,.0001);
    for(const frame of [1,2,3]){
      const turn=inkTurnGeometry({...p,turn:{active:true,yaw:frame*Math.PI/4}},{sampleGround:floor});
      for(const leg of turn.legs){assert.equal(leg.grounded,true);close(leg.contact.y,floor(leg.contact.x));}
    }
  }
});

test('every authored campaign stair walks from its real lower floor to the roof and back',()=>{
  for(const entry of INK_STAIRS){
    const g=applyInkLandmarkLayout(createGame());g.inkCampaign=true;g.schedule=[];g.pickups=[];g.obstacles=[];
    const p=g.player,bottom=entry.points[0],top=entry.points.at(-1),dir=Math.sign(top[0]-bottom[0]);
    const lower=g.platforms.find(platform=>platform.id===entry.lowerId),start=bottom[0]-dir*8;
    Object.assign(p,{x:start,y:lower?surfaceHeight(lower,start):g.groundAt(start),platformId:lower?.id??null,tier:lower?.tier??0,onGround:true,dir,turn:null,rampId:null});
    for(const [target,motion] of [[top[0]+dir*12,dir],[bottom[0]-dir*12,-dir]]){
      let frames=0;
      while((p.x-target)*motion<0&&frames++<1000){
        update(g,{[motion===1?'right':'left']:true,crouch:entry.id==='checkpoint-lower-stairs'&&motion!==dir},1/60);
        assert.ok(p.onGround,`${entry.id} lost walking support at ${p.x}`);assert.equal(p.vy,0);
        if(p.rampId){
          const geo=inkSaltikGeometry(p,{time:g.time});
          const interior=Math.min(...[bottom,top].map(point=>Math.abs(p.x-point[0])))>70;
          assert.ok(geo.legs.filter(leg=>leg.grounded).length>=(interior?2:1),`${entry.id} needs planted wheels on its finite support at ${p.x}, ${p.y}: ${geo.legs.filter(l=>l.grounded).length}`);
          for(const leg of geo.legs)if(leg.grounded)close(leg.contact.y,supportHeight(g,p,leg.contact.x));
        }
      }
      assert.ok(frames<1000,`${entry.id} reached its stair junction`);
      assert.equal(p.platformId,motion===dir?entry.platformId:entry.lowerId,entry.id);
    }
    assert.equal(g.events.some(event=>event.type==='jump'),false);
  }
});

test('native cabin pitch respects a real overhead slab while keeping its face rigid',()=>{
  for(const dir of [-1,1])for(const slope of [-.64,.64]){
    const p={x:300,y:600,dir,onGround:true,supportY:600,supportClearance:144};
    p.supportPose=computeSupportPose(p,x=>600+(x-300)*slope);p.supportPose.heave=-6;
    const geo=inkSaltikGeometry(p);assert.ok(geo.bounds.y>=p.y-p.supportClearance-.001);
    const a=geo.sourcePoint([877,711]),b=geo.sourcePoint([1005,711]);close(Math.hypot(a.x-b.x,a.y-b.y),128*geo.k,.0001);
  }
});

test('observatory wheels follow its illustrated diagonal instead of an offset painted staircase',()=>{
  const entry=INK_STAIRS.find(e=>e.id==='observatory-stairs');
  assert.equal(entry.nativeArt,true);
  const source=[[665,816],[588,789],[522,763],[465,735],[412,705],[358,676],[330,648],[305,632],[280,616],[255,600]];
  for(const [x,y] of source)close(stairCenterHeight(entry,3500+x*.78),15+y*.78,.1);
});

test('checkpoint switchback has two independently traversable illustrated flights',()=>{
  const g=applyInkLandmarkLayout(createGame());
  const turn=g.platforms.find(p=>p.id==='checkpoint-turn');assert.ok(turn);
  const upper=INK_STAIRS.find(e=>e.id==='checkpoint-west-stairs');
  const lower=INK_STAIRS.find(e=>e.id==='checkpoint-lower-stairs');
  assert.equal(upper.lowerId,turn.id);assert.equal(lower.platformId,turn.id);
  assert.equal(upper.nativeArt,true);assert.equal(lower.nativeArt,true);
  assert.equal(Math.sign(upper.points.at(-1)[0]-upper.points[0][0]),1);
  assert.equal(Math.sign(lower.points.at(-1)[0]-lower.points[0][0]),-1);
});

test('leaving the final low turbine ledge falls through the illustrated gap',()=>{
  const g=applyInkLandmarkLayout(createGame());g.schedule=[];g.obstacles=[];g.pickups=[];
  const roof=g.platforms.find(p=>p.id==='ledge-5');
  assert.equal(roof.x2,15385,'low turbine shelf ends at its illustrated root/stone lip');
  assert.ok(g.platforms.every(p=>15670<p.x1||15670>p.x2),'no roof spans the open gap');
  Object.assign(g.player,{x:roof.x2-2,y:surfaceHeight(roof,roof.x2-2),onGround:true,platformId:roof.id,rampId:null,vy:0});
  update(g,{right:true},1/60);
  assert.equal(g.player.onGround,false);assert.equal(g.player.platformId,null);assert.ok(g.player.vy>0);
  const y=g.player.y;for(let i=0;i<7;i++)update(g,{right:true},1/60);
  assert.ok(g.player.y>y+5);assert.equal(g.player.onGround,false);
});

test('native staircase artwork receives no second synthetic stair painting',async()=>{
  const {drawInkGround}=await import('../src/ink-world.js');
  const g=applyInkLandmarkLayout(createGame());
  for(const entry of INK_STAIRS.filter(e=>e.nativeArt)){
    const counts=[];
    for(const showEntry of [false,true]){
      let strokes=0;
      const c=new Proxy({stroke(){strokes++;}},{get:(target,key)=>target[key]??(()=>{})});
      drawInkGround(c,{...g,platforms:g.platforms.map(p=>({...p,walkableEntries:showEntry?p.walkableEntries.filter(e=>e.id===entry.id):[]}))},{camera:Math.min(...entry.points.map(p=>p[0]))-80,width:800,height:720});
      counts.push(strokes);
    }
    assert.equal(counts[0],counts[1],`${entry.id} uses the native painted treads only`);
  }
});

test('diagonal jump and horizontal input land on each real native staircase',()=>{
  for(const entry of INK_STAIRS.filter(e=>e.nativeArt)){
    const g=applyInkLandmarkLayout(createGame());g.inkCampaign=true;g.schedule=[];g.obstacles=[];g.pickups=[];
    const bottom=entry.points[0],dir=Math.sign(entry.points.at(-1)[0]-bottom[0]),lower=g.platforms.find(p=>p.id===entry.lowerId);
    const x=bottom[0]-dir*4;
    Object.assign(g.player,{x,y:lower?surfaceHeight(lower,x):g.groundAt(x),onGround:true,platformId:lower?.id??null,rampId:null,vy:0,dir,turn:null});
    const horizontal={[dir===1?'right':'left']:true};
    update(g,{...horizontal,jump:true},1/60);assert.equal(g.player.onGround,false);
    for(let i=0;i<30;i++)update(g,horizontal,1/60);
    for(let i=0;i<110;i++)update(g,{},1/60);
    assert.equal(g.player.onGround,true,entry.id);
    assert.ok(g.player.rampId===entry.id||g.player.platformId===entry.platformId,`${entry.id} catches diagonal jump landing`);
  }
});

test('native switchback walks both flights and selects descent with the existing down input',()=>{
  const g=applyInkLandmarkLayout(createGame());g.inkCampaign=true;g.schedule=[];g.obstacles=[];g.pickups=[];
  const lower=INK_STAIRS.find(e=>e.id==='checkpoint-lower-stairs'),upper=INK_STAIRS.find(e=>e.id==='checkpoint-west-stairs');
  const foot=lower.points[0],turn=lower.points.at(-1),roof=upper.points.at(-1);
  Object.assign(g.player,{x:foot[0]+8,y:g.groundAt(foot[0]+8),onGround:true,platformId:null,rampId:null,dir:-1,turn:null});
  walkTo(g,turn[0]-8,-1);assert.equal(g.player.platformId,'checkpoint-turn');
  walkTo(g,roof[0]+12,1);assert.equal(g.player.platformId,'ledge-3');
  walkTo(g,turn[0]-8,-1);assert.equal(g.player.platformId,'checkpoint-turn');
  let frames=0;
  while(g.player.x<foot[0]+8&&frames++<600){update(g,{right:true,crouch:true},1/60);assert.equal(g.player.onGround,true);}
  assert.ok(frames<600);assert.equal(g.player.platformId,null);assert.equal(g.player.rampId,null);
  assert.equal(g.events.some(event=>event.type==='jump'),false);
});

test('forward ground approach can jump onto the native low turbine ledge and falls at its end',()=>{
  const g=applyInkLandmarkLayout(createGame());g.schedule=[];g.obstacles=[];g.pickups=[];
  Object.assign(g.player,{x:14860,y:g.groundAt(14860),onGround:true,platformId:null,rampId:null,vy:0,dir:1,turn:null});
  for(let i=0;i<11;i++)update(g,{right:true},1/60);
  update(g,{right:true,jump:true},1/60);
  let reached=false,fell=false;
  const roof=g.platforms.find(p=>p.id==='ledge-5');
  for(let i=0;i<180;i++){
    update(g,{right:true},1/60);
    if(g.player.platformId===roof.id)reached=true;
    if(reached&&g.player.x>roof.x2&&!g.player.onGround&&g.player.platformId===null){fell=true;break;}
  }
  assert.ok(reached,'ordinary forward jump reaches the illustrated low stone ledge');
  assert.ok(fell,'walking beyond its real end releases support');
  assert.ok(roof.x2<g.platforms.find(p=>p.id==='breach-landing').x1,'no physical cap bridges to the building');
});
