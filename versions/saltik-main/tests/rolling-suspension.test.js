import test from 'node:test';
import assert from 'node:assert/strict';
import * as suspension from '../src/rolling-suspension.js';
import {createInkScene} from '../src/ink-scene.js';
import {inkSaltikGeometry} from '../src/ink-saltik.js';
import {computeSupportPose} from '../src/support-pose.js';
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('articulated suspension fixes roots and joins knee and rigid wheel exactly',()=>{
 for(const side of [-1,1])for(const k of [.1,.25])for(const offset of [-40,0,30]){
  const p={hinge:100,wheelTop:200,foot:[side*80,250],roll:side*12,offset};
  const s={...p,suspension:suspension.rollingLegPose(p,k,0)};
  assert(s.suspension);
  assert.deepEqual(suspension.rollingStrutPoint(s,[30,80]),[30,80]);
  const knee=s.suspension.knee;
  const [x,y]=suspension.rollingStrutPoint(s,[30,knee]);
  near(x,30+s.suspension.kneeRoll);near(y,knee+s.suspension.kneeOffset);
  const end=suspension.rollingStrutPoint(s,[30,200]);near(end[0],30+p.roll);near(end[1],200+p.offset);
 }
});
test('suspension bend follows compression, stays bounded and is disabled for special poses',()=>{
 const p={hinge:100,wheelTop:200,foot:[80,250],roll:0,offset:-30};
 assert(suspension.rollingLegPose(p,.2,0).kneeRoll>0);
 assert.equal(suspension.rollingLegPose(p,.2,0,false),null);
 assert.equal(suspension.rollingLegPose({...p,offset:0},.2,0).kneeRoll,0);
});
for(const character of ['striker','gatling','bt'])test(`${character}: actual terrain drives articulation through all level skins`,()=>{
 for(const level of [1,2,3,4,5])for(const dir of [-1,1]){
  const p={...createInkScene({level,character}).player,x:1000,y:600,supportY:600,onGround:true,turn:null,vx:180,dir};
  const floor=x=>600+4*Math.sin((x-1000)/17);
  p.supportPose=computeSupportPose(p,floor,null,1/60,{retainSurface:true});
  const before=JSON.stringify(p),g=inkSaltikGeometry(p),n=g.btNative??g,legs=g.modernLegs??g.nativeLegs??n.legs;
  assert(legs.every(l=>l.suspension));
  assert(legs.some(l=>Math.abs(l.offset)>1));
  for(const l of legs)if(l.grounded)near(l.contact.y,floor(l.contact.x));
  assert.equal(JSON.stringify(p),before,'presentation must not mutate gameplay');
  const air=inkSaltikGeometry({...p,onGround:false,jumpLegs:{spread:.6}}),a=air.btNative??air;
  assert((air.modernLegs??air.nativeLegs??a.legs).every(l=>!l.suspension));
 }
});

test('enemy specialist Strikers, Longrange and DR-01 share the terrain suspension',async()=>{
 const {specialistGeometry}=await import('../src/enemy-specialists.js');
 const {inkCarrierGeometry}=await import('../src/ink-carrier.js');
 const {inkEnemySaltikGeometry}=await import('../src/ink-enemy-saltik.js');
 const {enemyRustStrikerGeometry}=await import('../src/enemy-rust-striker-art.js');
 for(const dir of [-1,1])for(const build of [
  e=>specialistGeometry({...e,enemyModel:'black-gold'}),e=>specialistGeometry({...e,enemyModel:'longrange'}),
  e=>inkCarrierGeometry(e),e=>inkEnemySaltikGeometry(e),e=>enemyRustStrikerGeometry(e),
 ]){
  const e={x:1000,y:600,supportY:600,hp:40,dir,vx:120,onGround:true};
  const floor=x=>600+Math.sin((x-1000)/17)*4;e.supportPose=computeSupportPose(e,floor,null,1/60,{retainSurface:true});
  const g=build(e);assert(g.legs.every(l=>l.suspension),'each living native leg must articulate');
  for(const l of g.legs)if(l.grounded)near(l.contact.y,floor(l.contact.x));
 }
});
test('DR-01 has no timed stepping cycle on flat ground',async()=>{
 const {inkCarrierGeometry}=await import('../src/ink-carrier.js');
 const e={x:1000,y:600,supportY:600,dir:1,vx:120,onGround:true};
 const a=inkCarrierGeometry({...e,motionDistance:0},0),b=inkCarrierGeometry({...e,motionDistance:77},1);
 assert.deepEqual(a.legs.map(l=>[l.offset,l.roll,l.contact]),b.legs.map(l=>[l.offset,l.roll,l.contact]));
});

test('damped cabin pitch retains steep stair alignment beyond the small support-pose tilt cap',()=>{
 assert.equal(typeof suspension.rollingBodyTilt,'function');
 near(suspension.rollingBodyTilt(.6,{tilt:.2}),.6);
 assert(suspension.rollingBodyTilt(.1,{tilt:.02})<.1);
 near(suspension.rollingBodyTilt(.6,null),.6);
});

test('strong compression never inverts an articulated segment while the whole strut remains upright',()=>{
 // Observed on checkpoint-lower-stairs, leftward crouched Striker descent.
 for(const offset of [-122.43044443750927,-129.9,-110,-70,0,90]){
  const part={hinge:457,wheelTop:587,foot:[653,695],roll:0,offset};
  const s=suspension.rollingLegPose(part,126/689,365);
  assert(1+s.kneeOffset/(s.knee-part.hinge)>0,'upper segment flipped');
  assert(1+(offset-s.kneeOffset)/(part.wheelTop-s.knee)>0,'lower segment flipped');
 }
});

test('all three models descend the actual checkpoint stairs crouched without a newly inverted segment',async()=>{
 const {INK_STAIRS}=await import('../src/ink-demo-layout.js');
 const {update}=await import('../src/engine.js');
 const {surfaceHeight,supportHeight}=await import('../src/world.js');
 const entry=INK_STAIRS.find(e=>e.id==='checkpoint-lower-stairs'),top=entry.points.at(-1),bottom=entry.points[0],dir=Math.sign(top[0]-bottom[0]);let checked=0;
 for(const character of ['striker','gatling','bt']){
  const g=createInkScene({character,level:1});g.schedule=[];g.enemies=[];g.obstacles=[];g.pickups=[];
  const roof=g.platforms.find(p=>p.id===entry.platformId),p=g.player,x=top[0]+dir*12;
  Object.assign(p,{x,y:surfaceHeight(roof,x),platformId:roof.id,tier:roof.tier,onGround:true,turn:null,dir:-dir,rampId:null});
  let frames=0;
  while((p.x-(bottom[0]-dir*12))*dir>0&&frames++<1000){
   update(g,{[dir===1?'left':'right']:true,crouch:true},1/60);
   const geo=inkSaltikGeometry(p,{time:g.time,sampleGround:x=>supportHeight(g,p,x)}),native=geo.btNative??geo;
   for(const l of geo.modernLegs??geo.nativeLegs??native.legs){
    if(!l.suspension||l.stretch<=0)continue;checked++;
    const s=l.suspension;assert(1+s.kneeOffset/(s.knee-l.hinge)>0,`${character} upper at ${p.x}`);assert(1+(l.offset-s.kneeOffset)/(l.wheelTop-s.knee)>0,`${character} lower at ${p.x}`);
   }
  }
  assert(frames<1000);
 }
 assert(checked>100);
});
