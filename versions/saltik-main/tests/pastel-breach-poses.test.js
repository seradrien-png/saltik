import test from 'node:test';
import assert from 'node:assert/strict';
import {bossGeometry} from '../src/boss-tank.js';
import {createBossBreach,advanceBossBreach} from '../src/boss-breach.js';
import {INK_SALTIK_PARTS,inkSaltikGeometry} from '../src/ink-saltik.js';
import {inkBreachPoseGeometry,inkBreachLidGeometry,inkGlassCrackSegments,drawInkBossBreach} from '../src/ink-encounters.js';

const boss={x:1000,y:550,hp:200,maxHp:200,podRaise:0,podPhase:'stowed',cannonRecoil:0};
const pointDistance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function breach(kind,patch={}){const {roof,access}=bossGeometry(boss);return{kind,phase:'qte',elapsed:1,taps:1,effortsCompleted:0,effortElapsed:0,deckX:kind==='pod'?access.x:roof.x1+40,deckY:kind==='pod'?access.y:roof.y,...patch};}

test('both three-press assaults strain the actual native handles with bounded rigid claws',()=>{
 for(const kind of ['hull','pod'])for(const taps of [1,2,3]){
  const q=breach(kind,{taps,effortsCompleted:taps-1}),rest=inkBreachPoseGeometry(q,boss),pull=inkBreachPoseGeometry({...q,effortElapsed:.16},boss),settled=inkBreachPoseGeometry({...q,effortElapsed:.32},boss);
  assert.equal(rest.p.deflect,null);assert.equal(pull.p.deflect,null);
  assert.ok(pointDistance(rest.handPoints[0],pull.handPoints[0])>5,'each queued effort has a visible pull');
  assert.ok(pointDistance(rest.handPoints[0],settled.handPoints[0])<.001,'the complete stroke returns before the next press');
  for(const g of [rest,pull,settled])for(const [index,arm] of g.arms.entries()){
   assert.deepEqual(arm.polygon,INK_SALTIK_PARTS.arms[index].polygon);
   assert.ok(Math.abs(arm.extension*arm.k)<11,'only the short native forearm travels');
   assert.ok(1+arm.extension/(arm.wristY-arm.stretchY)>0,'the native forearm never turns inside out');
   assert.ok(pointDistance(g.handPoints[index],g.targets[index])<2,'claws contact the native handles');
   assert.ok(Math.abs(pointDistance(arm.handPoint([1050,990]),arm.handPoint([1090,990]))-40*arm.k)<1e-8,'claw pixels retain their exact scale');
  }
 }
});

test('the painted lid and pod pull free before the native claws release them',()=>{
 for(const kind of ['hull','pod']){
  const before=inkBreachPoseGeometry(breach(kind,{phase:'tear',elapsed:.04}),boss),after=inkBreachPoseGeometry(breach(kind,{phase:'tear',elapsed:.1}),boss),release=inkBreachPoseGeometry(breach(kind,{phase:'tear',elapsed:.3}),boss);
  const a=kind==='hull'?before.lid.handles[0]:before.launcher.box,b=kind==='hull'?after.lid.handles[0]:after.launcher.box;
  assert.ok(b.y<a.y,'the existing painted part moves up as it tears away');
  for(const g of [before,after])for(let i=0;i<2;i++)assert.ok(pointDistance(g.handPoints[i],g.targets[i])<3);
  if(kind==='hull')assert.equal(release.lid.release,true,'the opened lid clears before the planted firing stance');
  assert.ok(pointDistance(release.handPoints[0],release.targets[0])<2,'released claws recover beside their own cabin');
 }
 assert.equal(inkBreachLidGeometry(breach('hull',{taps:0}),boss),null);
});

test('V1 hull firing keeps the crouched cabin upright while the complete roof gun aims down into the hole',()=>{
 for(let shot=1;shot<=6;shot++){
  const q=breach('hull',{phase:'fire',elapsed:.11+(shot-1)*.2,shotsFired:shot}),g=inkBreachPoseGeometry(q,boss,{camera:137,player:{motionLean:.05,motionHeave:1.2,cannonElevation:1}});
  assert.equal(g.p.crouching,true);assert.equal(g.p.dir,-1,'the roof gun faces the front hatch as in V1');
  assert.ok(Math.abs(g.geo.tilt)<=.25,'the cabin stays upright, never a whole-body headstand');
  assert.equal(g.p.motionLean,0);assert.equal(g.p.motionHeave,0);
  assert.ok(g.fire.part.pivot[1]>=390,'the housing articulates at its cabin mount');
  assert.ok(g.fire.part.polygon.some(([x,y])=>x<700&&y<350),'the native upper housing moves with the barrel');
  assert.ok(Math.abs(g.fire.rotation)<1.2,'the complete upper assembly makes a bounded forward articulation');
  assert.ok(g.fire.recoil*g.geo.k<3,'recoil travels a short distance along its bore');
  for(let i=0;i<2;i++)assert.ok(pointDistance(g.handPoints[i],g.targets[i])<.05,'small hands remain braced');
  assert.ok(g.fire.aperture.every((a,i,points)=>{const b=points[(i+1)%points.length];return(b[0]-a[0])*(g.fire.target.y-a[1])-(b[1]-a[1])*(g.fire.target.x-a[0])>=0;}),'the target lies inside the measured painted aperture');
  const vector={x:g.fire.target.x-g.fire.muzzle.x,y:g.fire.target.y-g.fire.muzzle.y};
  assert.ok(vector.x*Math.cos(g.fire.aim)+vector.y*Math.sin(g.fire.aim)>0,'the hole is in front of the bore');
  assert.ok(Math.abs(vector.x*Math.sin(g.fire.aim)-vector.y*Math.cos(g.fire.aim))<.001,'the bore points at the hole');
  assert.ok(g.geo.legs.filter(l=>l.grounded).length>=2,'the squat firing stance keeps a broad planted base');
 }
});

test('the actual hull clock produces six brief recoil pulses without mutating its cinematic state',()=>{
 let q=breach('hull',{phase:'fire',elapsed:0,shotsFired:0}),pulses=0;
 for(let frame=0;frame<75;frame++){
  const result=advanceBossBreach(q,false,1/60);q=result.breach;
  for(const event of result.events)if(event.type==='breach-shot'){
   pulses++;const before=structuredClone(q),g=inkBreachPoseGeometry(q,boss);
   assert.ok(g.v.shotFlash&&g.fire.recoil>0);assert.ok(g.p.crouching&&Math.abs(g.geo.tilt)<=.25);assert.deepEqual(q,before);
  }
 }
 assert.equal(pulses,6);assert.equal(q.phase,'eject');
});

test('every tear frame preserves rigid claw contact until release and a real roof contact',()=>{
 const physical=bossGeometry(boss);let prior=null;
 for(let frame=1;frame<=84;frame++){
  const q=breach('hull',{phase:'tear',elapsed:frame*.005,taps:3}),g=inkBreachPoseGeometry(q,boss);
  for(let index=0;index<2;index++){
   assert.ok(pointDistance(g.handPoints[index],g.targets[index])<.06,`continuous native grip at ${q.elapsed}`);
   const arm=g.arms[index];assert.ok(Math.abs(arm.extension*arm.k)<11);
   assert.ok(Math.abs(pointDistance(arm.handPoint([1050,990]),arm.handPoint([1090,990]))-40*arm.k)<1e-8);
  }
  const planted=g.geo.legs.filter(l=>l.grounded);assert.ok(planted.length>0);
  for(const leg of planted){const surface=leg.contact.x>=physical.turretRoof.x1&&leg.contact.x<=physical.turretRoof.x2?physical.turretRoof:physical.roof;assert.ok(leg.contact.x>=surface.x1&&leg.contact.x<=surface.x2);assert.ok(Math.abs(leg.contact.y-surface.y)<.05);}
  if(prior){assert.ok(Math.abs(g.geo.tilt-prior.geo.tilt)<.03);assert.ok(pointDistance(g.geo.sourcePoint([913,270]),prior.geo.sourcePoint([913,270]))<3,'the body follows a continuous lean');}
  prior=g;
 }
});

test('the planted V1 fire pose joins the unchanged physical ejection without a visual snap',()=>{
 const q=breach('hull',{phase:'fire',elapsed:1.25,shotsFired:6}),start=inkBreachPoseGeometry(q,boss),initial=inkBreachPoseGeometry({...q,phase:'eject',elapsed:0,x:q.deckX,y:q.deckY},boss);
 for(const point of [[913,270],[742,1078],[930,747]])assert.ok(pointDistance(start.geo.sourcePoint(point),initial.geo.sourcePoint(point))<.001);
 let prior=initial;
 for(let frame=1;frame<=80;frame++){
  const u=frame/80,x=q.deckX-156*u,y=q.deckY-50*u,g=inkBreachPoseGeometry({...q,phase:'eject',elapsed:.4*u,x,y},boss,{player:{x,y,onGround:false}});
  assert.ok(pointDistance(g.geo.sourcePoint([930,747]),prior.geo.sourcePoint([930,747]))<4);
  assert.equal(g.shooting,false);if(u>0)assert.ok(g.geo.legs.every(l=>!l.grounded));
  if(frame===80){const normal=inkSaltikGeometry(g.p);for(const point of [[913,270],[742,1078],[930,747]])assert.ok(pointDistance(g.geo.sourcePoint(point),normal.sourcePoint(point))<.001);}
  prior=g;
 }
});

test('the pod assault barrel recovers to its native rest pose after the brief arrival shot',()=>{
 for(const phase of ['qte','tear','fire']){const g=inkBreachPoseGeometry(breach('pod',{phase,elapsed:phase==='qte'?1:.18,shotsFired:0}),boss);assert.equal(g.fire.rotation,0);}
});

test('boss poses plant only on finite physical roof surfaces and fold the overhanging wheels',()=>{
 const physical=bossGeometry(boss);
 for(const kind of ['hull','pod']){
  const q=breach(kind),before=structuredClone(q),g=inkBreachPoseGeometry(q,boss);
  assert.deepEqual(q,before);assert.equal(g.p.y,q.deckY);
  const grounded=g.geo.legs.filter(leg=>leg.grounded);assert.ok(grounded.length>0);
  for(const leg of g.geo.legs)if(!leg.grounded)assert.ok(!Number.isFinite(leg.contact.y)||leg.contact.y!==q.deckY,'unsupported legs never inherit an infinite deck');
  for(const leg of grounded){const roof=leg.contact.x>=physical.turretRoof.x1&&leg.contact.x<=physical.turretRoof.x2?physical.turretRoof:physical.roof;assert.ok(leg.contact.x>=roof.x1&&leg.contact.x<=roof.x2);assert.ok(Math.abs(leg.contact.y-roof.y)<.05);}
 }
});

test('all six hull flashes and the pod arrival shot originate at the rotated painted cannon mouth',()=>{
 for(const kind of ['hull','pod'])for(let shot=1;shot<=(kind==='hull'?6:1);shot++){
  const at=kind==='hull'?.1+(shot-1)*.2:0,q=breach(kind,{phase:kind==='hull'?'fire':'qte',shotsFired:shot,elapsed:at+.01}),g=inkBreachPoseGeometry(q,boss);
  assert.ok(g.shooting&&g.v.shotFlash);assert.ok(g.fire.recoil>0);
  const vector={x:g.fire.muzzle.x-g.fire.pivot.x,y:g.fire.muzzle.y-g.fire.pivot.y},length=Math.hypot(vector.x,vector.y);
  assert.ok(Math.abs(vector.x/length-Math.cos(g.fire.aim))<.0001);assert.ok(Math.abs(vector.y/length-Math.sin(g.fire.aim))<.0001);
  assert.ok(g.fire.target.y>g.fire.muzzle.y,'the burst points down into the breached part');
  const translations=[],rotations=[],context=new Proxy({globalAlpha:1,translate(x,y){translations.push({x,y});},rotate(angle){rotations.push(angle);}},{get:(target,key)=>key in target?target[key]:()=>{}});
  drawInkBossBreach(context,{'ink-saltik':{}},q,boss);
  assert.ok(translations.some(p=>pointDistance(p,g.fire.muzzle)<.001),'muzzle flash is drawn at the actual transformed cannon mouth');
  assert.ok(rotations.includes(g.geo.tilt),'the rendered native body uses the same pitch as its world geometry');
  if(kind==='hull'){const recovery=inkBreachPoseGeometry({...q,elapsed:at+.16},boss);assert.equal(recovery.v.shotFlash,false);assert.ok(recovery.fire.recoil<g.fire.recoil);}
 }
});

test('native boss rendering leaves the real three distinct presses and queued timing intact',()=>{
 for(const kind of ['hull','pod']){
  let q={...createBossBreach({x:800,y:550},boss,false,kind),phase:'qte',elapsed:0,qteArmed:true};
  for(let tap=1;tap<=3;tap++){
   q=advanceBossBreach(q,true,.01).breach;
   const before=structuredClone(q);inkBreachPoseGeometry(q,boss);assert.deepEqual(q,before);assert.equal(q.taps,tap);assert.equal(q.phase,'qte');
   q=advanceBossBreach(q,false,.31).breach;
  }
  assert.equal(q.phase,'tear');assert.equal(q.effortsCompleted,3);
 }
});

test('screen glass fractures reach every screen edge with dense radial branches at phone and desktop sizes',()=>{
 for(const [width,height] of [[844,390],[1280,720],[1920,1080]]){
  const segments=inkGlassCrackSegments(width*.56,height*.44,width,height),points=segments.flat();assert.ok(segments.length>=75);
  assert.ok(points.some(([x])=>x===0));assert.ok(points.some(([x])=>x===width));assert.ok(points.some(([,y])=>y===0));assert.ok(points.some(([,y])=>y===height));
  assert.ok(points.every(([x,y])=>x>=0&&x<=width&&y>=0&&y<=height));
  assert.deepEqual(segments,inkGlassCrackSegments(width*.56,height*.44,width,height),'the fracture pattern stays fixed while the enemy slides');
 }
});
