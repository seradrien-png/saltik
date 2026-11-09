import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {inkSaltikGeometry} from '../src/ink-saltik.js';
const art=await import('../src/ink-carrier.js').catch(()=>({}));
const shutdown=await import('../src/carrier-shutdown-art.js').catch(()=>({}));
const near=(a,b,tolerance=1e-6)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} differs from ${b}`);
const carrier={x:500,y:620,dir:1,hp:1,bays:Array.from({length:4},()=>({hp:12,maxHp:12}))};
function canvas(){
 const calls=[],fills=[],curves=[],ellipses=[],stack=[];let m=[1,0,0,1,0,0],path=[],clips=[];
 const point=(x,y)=>({x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]});
 return {calls,fills,curves,ellipses,globalAlpha:1,filter:'none',save(){stack.push({m:[...m],clips:[...clips],filter:this.filter,globalAlpha:this.globalAlpha});},restore(){const s=stack.pop();m=s.m;clips=s.clips;this.filter=s.filter;this.globalAlpha=s.globalAlpha;},
 translate(x,y){const p=point(x,y);m[4]=p.x;m[5]=p.y;},scale(x,y){m[0]*=x;m[1]*=x;m[2]*=y;m[3]*=y;},rotate(a){const [aa,b,c,d]=m,co=Math.cos(a),si=Math.sin(a);m[0]=aa*co+c*si;m[1]=b*co+d*si;m[2]=c*co-aa*si;m[3]=d*co-b*si;},transform(a,b,c,d,e,f){const [aa,bb,cc,dd,ee,ff]=m;m=[aa*a+cc*b,bb*a+dd*b,aa*c+cc*d,bb*c+dd*d,aa*e+cc*f+ee,bb*e+dd*f+ff];},
 drawImage(image,...args){calls.push({image,args,filter:this.filter,alpha:this.globalAlpha,m:[...m],path:[...path],clips:[...clips]});},beginPath(){path=[];},moveTo(x,y){path.push([x,y]);},lineTo(x,y){path.push([x,y]);},bezierCurveTo(...coords){curves.push(coords);path.push([coords[4],coords[5]]);},closePath(){},rect(){},ellipse(x,y,...r){ellipses.push({x,y,r,point:point(x,y),m:[...m]});},arc(){},clip(){clips.push([...path]);},fill(){fills.push(this.fillStyle);},stroke(){},setLineDash(){}};
}

test('the earlier blue native reference PNG remains unchanged',async()=>{
 const bytes=await readFile(new URL('../dist/assets/ink-carrier.png',import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'7d57c3ea368ea981a7e6ba88a07280b79257b22c4b3e7e342064a138372a7cbc');
});
test('the approved carrier keeps the hero footprint with raised empty pads and four leg contacts',()=>{
 for(const dir of [-1,1]){
  const g=art.inkCarrierGeometry({...carrier,dir}),p=inkSaltikGeometry({x:500,y:620,dir:1});
  assert.ok(g.bounds.w>=155&&g.bounds.w<=162);assert.ok(g.bounds.h>=139&&g.bounds.h<=146);
  assert.ok(g.bounds.w/p.bounds.w<1.16);assert.ok(g.bodyBounds.h>=80&&g.bodyBounds.h<=100);
  assert.equal(g.legs.length,4);assert.equal(g.bays.length,2);assert.equal(g.bayBounds.length,2);
  for(const bay of g.bays){assert.ok(bay.muzzle.x>=bay.bounds.x&&bay.muzzle.x<=bay.bounds.x+bay.bounds.w);assert.ok(bay.muzzle.y>=bay.bounds.y&&bay.muzzle.y<=bay.bounds.y+bay.bounds.h);assert.ok(bay.direction.y<-.85);near(bay.droneAnchor.x,bay.muzzle.x);near(bay.droneAnchor.y+art.INK_CARRIER_DOCK_CLEARANCE,bay.muzzle.y);}
  assert.ok(g.bodyBounds.y>g.bounds.y+20);assert.ok(g.bays.every(b=>b.muzzle.y<g.targetY));
 }
});
test('moving native wheels articulate with distance while all four actual pixels remain planted',()=>{
 const surface={x:300,step:1,heights:Array.from({length:401},(_,i)=>620+(i-200)*.11)};
 for(const dir of [-1,1])for(const distance of [0,17,40]){
  const g=art.inkCarrierGeometry({...carrier,dir,vx:30,motionDistance:distance,supportPose:{heave:2,surface}},1);
  for(const leg of g.legs){assert.ok(leg.grounded);near(leg.contact.y,620+(leg.contact.x-500)*.11,.05);assert.ok(Number.isFinite(leg.wheelSpin));}
 }
 const a=art.inkCarrierGeometry({...carrier,vx:30,motionDistance:0}),b=art.inkCarrierGeometry({...carrier,vx:30,motionDistance:17});
 assert.notEqual(a.legs[0].wheelSpin,b.legs[0].wheelSpin);assert.notEqual(a.legs[0].roll,b.legs[0].roll);assert.ok(Math.abs(a.legs[0].contact.x-b.legs[0].contact.x)>2);
 const g=art.inkCarrierGeometry(carrier);assert.ok(g.legs.every(l=>Math.abs(l.offset)<48&&l.stretch>.8&&l.stretch<1.2));
 for(const leg of g.legs)near(leg.contact.y,carrier.y,.01);
});
test('one intact painting is reused for every readiness state without destruction or smoke',async()=>{
 const bytes=await readFile(new URL(`../dist/assets/${art.INK_CARRIER_ASSET}.png`,import.meta.url));assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],[1319,1192]);
 assert.equal(art.INK_CARRIER_FRAMES.length,1);assert.equal(art.INK_CARRIER_FRAMES[0].id,'intact');
 for(const flags of [{},{backDestroyed:true,legDestroyed:true,damageStage:2},{knockedOut:true,hp:0,koElapsed:.8},{neutralized:true}]){
  const e={...carrier,...flags},before=structuredClone(e),c=canvas(),g=art.drawInkCarrier(c,{},e);
  assert.deepEqual(e,before);assert.equal(g.frameIndex,0);assert.deepEqual(g.smokeEmitters,[]);assert.ok(g.legs.every(l=>!l.broken));
  assert.ok(c.calls.length>=11);for(const call of c.calls){assert.deepEqual(call.args.slice(0,4),art.INK_CARRIER_CROP);assert.equal(call.filter,'none');}
 }
});
test('KO lowers the intact body smoothly without moving world position or tire contact',()=>{
 for(const dir of [-1,1]){
  const poses=[0,.15,.3,.45,.6,.9].map(koElapsed=>art.inkCarrierGeometry({...carrier,dir,knockedOut:true,koElapsed,vx:80},50));
  near(poses[0].bodyDrop,0);near(poses[2].bodyDrop,8.5);near(poses[4].bodyDrop,17);near(poses[5].bodyDrop,17);
  for(let i=0;i<poses.length;i++){
   const g=poses[i];near(g.x,carrier.x);near(g.y,carrier.y);assert.equal(g.stars.length,3);assert.ok(g.headPart.rotation>=-.035&&g.headPart.rotation<=.035);
   for(const [j,leg] of g.legs.entries()){near(leg.contact.x,poses[0].legs[j].contact.x);near(leg.contact.y,carrier.y,.01);assert.ok(leg.stretch>.2&&leg.stretch<1.2);near(leg.wheelSpin,0);}
   if(i)assert.ok(g.bodyDrop>=poses[i-1].bodyDrop);
  }
 }
});
test('KO head wobble and eye spirals share their exact native transform; pause time does not advance them',()=>{
 const e={...carrier,knockedOut:true,koElapsed:.87},a=art.drawInkCarrier(canvas(),{},e,{time:10}),c=canvas(),b=art.drawInkCarrier(c,{},e,{time:10});
 near(a.headPart.rotation,b.headPart.rotation);near(a.spiralAngle,b.spiralAngle);assert.deepEqual(a.stars,b.stars);assert.notEqual(a.headPart.rotation,0);const moving=art.inkCarrierGeometry({...e,shuttingDown:true},10.2);assert.notEqual(moving.spiralAngle,b.spiralAngle);assert.notDeepEqual(moving.stars,b.stars);
 for(const eye of art.INK_CARRIER_PARTS.eyes){const ellipse=c.ellipses.find(p=>p.x===eye.center[0]&&p.y===eye.center[1]);assert.ok(ellipse);const expected=b.headPoint(eye.center);near(ellipse.point.x,expected.x);near(ellipse.point.y,expected.y);}
 for(const flag of ['shutdownSettled','shuttingDown','neutralized']){const g=art.inkCarrierGeometry({...e,[flag]:true,koElapsed:0});near(g.bodyDrop,17);near(g.headPart.rotation,0);}
 const quiet=art.inkCarrierGeometry({...e,neutralized:true,neutralizedAt:10},10.6);assert.ok(quiet.stars.every(s=>s.alpha<1e-9));near(quiet.spiralAngle,art.inkCarrierGeometry({...e,neutralized:true,neutralizedAt:10},99).spiralAngle);
});
test('live and KO tire draw matrices plant the same native pixels on both slopes',()=>{
 for(const dir of [-1,1])for(const slope of [-.13,.13])for(const koElapsed of [null,0,.3,.8]){
  const surface={x:300,step:1,heights:Array.from({length:401},(_,i)=>620+(i-200)*slope)},e={...carrier,dir,knockedOut:koElapsed!==null,koElapsed,supportPose:{heave:2,surface}},c=canvas(),g=art.drawInkCarrier(c,{},e,{time:1});
  for(const leg of g.legs){assert.ok(leg.grounded);near(leg.contact.y,620+(leg.contact.x-500)*slope,.05);if(leg.occluded)continue;assert.ok(leg.strutPolygon.length>2&&leg.wheelPolygon.length>2);
   const draw=c.calls.find(call=>call.clips.some(path=>JSON.stringify(path)===JSON.stringify(leg.wheelPolygon)));assert.ok(draw);const [a,b,cc,d,tx,ty]=draw.m,[px,py]=leg.foot;near(a*px+cc*py+tx,leg.contact.x);near(b*px+d*py+ty,leg.contact.y);
  }
 }
 const gap=art.inkCarrierGeometry({...carrier,knockedOut:true,koElapsed:.7,supportPose:{surface:{x:300,step:1,heights:Array(401).fill(null)}}});assert.ok(gap.legs.every(l=>!l.grounded&&Number.isFinite(l.contact.x)&&Number.isFinite(l.contact.y)));
});
test('the new right-facing native barrel controls the real firing axis and backward recoil',()=>{
 assert.deepEqual(art.INK_CARRIER_PARTS.cannon.muzzle,[642,619]);assert.ok(art.INK_CARRIER_PARTS.cannon.muzzle[0]>art.INK_CARRIER_PARTS.cannon.pivot[0]);
 for(const dir of [-1,1])for(const slope of [-.13,.13]){
  const e={...carrier,dir,supportPose:{tilt:slope}},g=art.inkCarrierGeometry(e),shot=art.inkCarrierGeometry({...e,firePose:.14,cannonRecoil:1});
  assert.equal(g.flip,dir);assert.equal(g.orientation,dir);assert.equal(g.paintFlip,dir);
  assert.ok(g.muzzle.y<g.targetY-10,'the side gun fires above the low face');
  near(Math.hypot(g.muzzleDirection.x,g.muzzleDirection.y),1);assert.ok(g.muzzleDirection.x*dir>.95);
  const recoil=(g.muzzle.x-shot.muzzle.x)*g.muzzleDirection.x+(g.muzzle.y-shot.muzzle.y)*g.muzzleDirection.y;assert.ok(recoil>0&&recoil<3);
  const c=canvas(),f=art.drawInkCarrier(c,{}, {...e,firePose:.14,cannonRecoil:1});assert.ok(c.fills.includes('#ffe6a6'));near(f.muzzle.x,shot.muzzle.x);near(f.muzzle.y,shot.muzzle.y);
  const ko=canvas();art.drawInkCarrier(ko,{}, {...e,knockedOut:true,koElapsed:.8,firePose:.14});assert.ok(!ko.fills.includes('#ffe6a6'));
 }
});
test('KO exposes one small reachable service connector while the live carrier keeps it tucked away',()=>{
 const live=canvas();art.drawInkCarrier(live,{},carrier);assert.equal(live.curves.length,0);assert.ok(!live.fills.includes('#d7c8a7'));
 for(const flags of [{knockedOut:true,koElapsed:.7},{shuttingDown:true},{neutralized:true}]){const c=canvas(),g=art.drawInkCarrier(c,{}, {...carrier,...flags});assert.ok(c.fills.includes('#d7c8a7'));assert.equal(c.curves.length,1);assert.ok(g.port.y>g.socket.y+10);}
});
test('the same original small hero hand reaches the real connector through unplug and settle on slopes',()=>{
 for(const dir of [-1,1])for(const slope of [-.13,.13])for(const phase of ['unplug','settle'])for(const elapsed of [.45,.7,1.05]){
  const surface={x:200,step:1,heights:Array.from({length:601},(_,i)=>620+(i-300)*slope)},e={...carrier,dir,knockedOut:true,koElapsed:.7,shuttingDown:true,supportPose:{surface}},placement=art.carrierShutdownPlacement(e),q={phase,elapsed,port:placement.port,dir:placement.dir};
  const p={...placement,supportPose:{surface}},g=shutdown.carrierShutdownGeometry(q,e,{player:p}),hand=g.handPoints[g.activeHand],pivot=g.geo.sourcePoint(g.arms[g.activeHand].pivot);
  near(hand.x,g.target.x,.01);near(hand.y,g.target.y,.01);assert.ok(Math.hypot(hand.x-pivot.x,hand.y-pivot.y)<33);assert.ok(Math.abs(placement.x-e.x)>110);assert.ok(g.coverOpen>.9);assert.equal(g.arms.length,2);
  const c=canvas(),before=structuredClone(p);assert.ok(shutdown.drawCarrierShutdown(c,{'ink-saltik':{}},q,e,{player:p}));assert.deepEqual(p,before);assert.ok(c.calls.length>5);
 }
});
test('shutdown placement freezes the crouched pose and connector before rendering every subsequent frame',()=>{
 for(const dir of [-1,1])for(const koElapsed of [0,.31,.66,2]){
  const e={...carrier,dir,knockedOut:true,koElapsed,shutdownSettled:true,shuttingDown:true},p=art.carrierShutdownPlacement(e);
  for(const time of [0,1,10]){const g=art.inkCarrierGeometry(e,time);near(g.bodyDrop,17);near(g.headPart.rotation,0);near(g.port.x,p.port.x);near(g.port.y,p.port.y);}
 }
});
test('small-hand contact remains exact over every curved encounter approach in both facings',async()=>{
 const {createInkScene}=await import('../src/ink-scene.js'),{computeSupportPose}=await import('../src/support-pose.js');const world=createInkScene();
 for(let x=8350;x<=9750;x+=20)for(const dir of [-1,1])for(const serviceAccessSide of ['rear','front']){
  const e={...carrier,x,y:world.groundAt(x),dir,serviceAccessSide,knockedOut:true,koElapsed:.7,shutdownSettled:true,shuttingDown:true,onGround:true};e.supportPose=computeSupportPose(e,world.groundAt,null,1/60,{retainSurface:true});
  const p=art.carrierShutdownPlacement(e);p.y=world.groundAt(p.x);p.supportY=p.y;p.onGround=true;p.supportPose=computeSupportPose(p,world.groundAt,null,1/60,{retainSurface:true});
  for(const phase of ['unplug','settle'])for(const elapsed of [.25,.45,.7,1.05]){const q={phase,elapsed,port:p.port,dir:p.dir},g=shutdown.carrierShutdownGeometry(q,e,{player:p}),hand=g.handPoints[g.activeHand];assert.ok(Math.hypot(hand.x-g.target.x,hand.y-g.target.y)<.05,`native hand must touch the real lead at ${x}/${dir}/${serviceAccessSide}/${phase}/${elapsed}`);}
 }
});
test('two small native claw hands stay attached and tuck above the planted wheels during KO',()=>{
 for(const dir of [-1,1])for(const koElapsed of [0,.3,.65]){
  const c=canvas(),g=art.drawInkCarrier(c,{}, {...carrier,dir,knockedOut:true,koElapsed});assert.equal(g.hands.length,2);
  for(const hand of g.hands){const pivot=g.handPoint(hand,hand.pivot),base=g.sourcePoint(hand.pivot);near(pivot.x,base.x);near(pivot.y,base.y);const tip=g.handPoint(hand,hand.tip);assert.ok(tip.y<carrier.y-3,'small claws stay above the ground throughout the crouch');assert.ok(Math.hypot(tip.x-pivot.x,tip.y-pivot.y)<22,'forearm plus claw stays hero-sized');const draw=c.calls.find(call=>JSON.stringify(call.path)===JSON.stringify(hand.polygon));assert.ok(draw,'each original claw has its own native patch');
  }
  for(const leg of g.legs.filter(l=>!l.occluded)){const draw=c.calls.find(call=>call.clips.some(path=>JSON.stringify(path)===JSON.stringify(leg.wheelPolygon)));for(const hand of g.hands)assert.ok(draw.clips.some(path=>path.length===4+hand.polygon.length&&JSON.stringify(path.slice(4))===JSON.stringify(hand.polygon)),'the moving tire mask explicitly excludes both native hands');}
 }
});
test('front access reverses only the service approach while preserving the native gun and chassis heading',()=>{
 for(const dir of [-1,1]){
  const e={...carrier,dir,knockedOut:true,koElapsed:.8,shuttingDown:true},rear=art.inkCarrierGeometry(e),front=art.inkCarrierGeometry({...e,serviceAccessSide:'front'}),p=art.carrierShutdownPlacement({...e,serviceAccessSide:'front'});
  assert.equal(front.serviceDirection,-dir);assert.equal(p.dir,-dir);assert.equal(front.flip,dir);assert.equal(front.paintFlip,dir);assert.deepEqual(front.muzzle,rear.muzzle);assert.deepEqual(front.legs.map(l=>l.contact),rear.legs.map(l=>l.contact));assert.deepEqual(front.servicePortAnchor,[1550,790]);assert.deepEqual(front.serviceSocketNative,[1000,680]);assert.ok((p.x-carrier.x)*dir>150);assert.ok((front.port.x-carrier.x)*dir>90);near(front.portDirection.x,dir);
  const actual=front.sourcePoint(front.servicePortNative);near(actual.x,front.port.x);near(actual.y,front.port.y);
 }
});

test('approved carrier retains its own two small claws even when the renderer supplies hero art',()=>{
 const carrierImage={},heroImage={};
 for(const dir of [-1,1])for(const koElapsed of [0,.3,.7]){
  const e={...carrier,dir,knockedOut:koElapsed>0,koElapsed},c=canvas(),g=art.drawInkCarrier(c,carrierImage,e,{handsImage:heroImage});
  const heroDraws=c.calls.filter(call=>call.image===heroImage);assert.equal(heroDraws.length,0,'the approved reference must not receive grafted hero hands');
  assert.equal(g.hands.length,2);for(const hand of g.hands){const pivot=g.handPoint(hand,hand.pivot);near(pivot.x,g.sourcePoint(hand.pivot).x);near(pivot.y,g.sourcePoint(hand.pivot).y);const tip=g.handPoint(hand,hand.tip);assert.ok(tip.y<e.y-1,'native hands stay above ground throughout KO');}
  const base=art.inkCarrierGeometry(e);near(g.muzzle.x,base.muzzle.x);near(g.muzzle.y,base.muzzle.y);assert.deepEqual(g.legs.map(l=>l.contact),base.legs.map(l=>l.contact));
 }
});
