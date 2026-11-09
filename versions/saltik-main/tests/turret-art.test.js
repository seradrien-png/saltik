import test from 'node:test';
import assert from 'node:assert/strict';
import {drawInkSaltik,inkSaltikGeometry,INK_SALTIK_PARTS} from '../src/ink-saltik.js';
import {computeSupportPose} from '../src/support-pose.js';
import {inkWeaponGeometry} from '../src/ink-scene.js';
import {inkPlayerPodGeometry} from '../src/ink-pods.js';

const base={x:300,y:550,dir:1,onGround:true,vx:0,vy:0};
const close=(a,b,tolerance=1e-7)=>assert.ok(Math.abs(a-b)<tolerance,`${a} versus ${b}`);
const same=(a,b)=>{close(a.x,b.x);close(a.y,b.y);};
const inside=([x,y],polygon)=>{
 let hit=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
 }
 return hit;
};
// Record the actual image transform and source clipping performed by the
// renderer. Mouth comparisons below do not reuse its geometry transforms.
function canvas(){
 let m=[1,0,0,1,0,0],stack=[],path=[],current=null,clipPaths=[],clipRule;
 const calls=[],fills=[],point=(x,y)=>({x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]});
 return {calls,fills,globalAlpha:1,fillStyle:'',
  save(){stack.push({m:[...m],clipPaths,clipRule,fillStyle:this.fillStyle,alpha:this.globalAlpha});},
  restore(){const s=stack.pop();({m,clipPaths,clipRule}=s);this.fillStyle=s.fillStyle;this.globalAlpha=s.alpha;},
  translate(x,y){const p=point(x,y);m[4]=p.x;m[5]=p.y;},
  scale(x,y){m[0]*=x;m[1]*=x;m[2]*=y;m[3]*=y;},
  rotate(a){const [aa,b,c,d]=m,co=Math.cos(a),si=Math.sin(a);m[0]=aa*co+c*si;m[1]=b*co+d*si;m[2]=c*co-aa*si;m[3]=d*co-b*si;},
  transform(a,b,c,d,e,f){const [aa,bb,cc,dd,ee,ff]=m;m=[aa*a+cc*b,bb*a+dd*b,aa*c+cc*d,bb*c+dd*d,aa*e+cc*f+ee,bb*e+dd*f+ff];},
  drawImage(...args){const [image,sx,sy,sw,sh,dx,dy,dw,dh]=args,t=[...m],regions=clipPaths.map(p=>p.map(v=>[...v])),rule=clipRule;
   calls.push({image,sourcePoint(x,y){const xx=dx+(x-sx)/sw*dw,yy=dy+(y-sy)/sh*dh;return{x:t[0]*xx+t[2]*yy+t[4],y:t[1]*xx+t[3]*yy+t[5]};},
    paints(p){const hits=regions.filter(poly=>inside(p,poly)).length;return rule==='evenodd'?hits%2===1:hits>0;}});
  },
  beginPath(){path=[];current=null;},moveTo(x,y){current=[[x,y]];path.push(current);},lineTo(x,y){current.push([x,y]);},closePath(){},
  clip(rule){clipPaths=path;clipRule=rule;},ellipse(){},fill(){fills.push({color:this.fillStyle,path:path.flatMap(poly=>poly.map(p=>point(...p)))});},stroke(){},arc(){},setLineDash(){}};
}

test('the complete MIRV housing rotates through 0, 30 and 60 degrees at its attached hinge while the cabin stays fixed',()=>{
 for(const dir of [-1,1])for(const slope of [-.16,0,.16])for(const elevation of [0,Math.PI/6,Math.PI/3]){
  const p={...base,dir},floor=x=>550+(x-300)*slope;p.supportPose=computeSupportPose(p,floor);
  const options={camera:43,scale:1.3},rest=inkSaltikGeometry(p,options),geo=inkSaltikGeometry({...p,cannonElevation:elevation},options);
  const a=geo.turretPoint([650,300]),b=geo.turretPoint([727,175]);
  const nativeA=rest.sourcePoint([650,300]),nativeB=rest.sourcePoint([727,175]);
  const actual=Math.atan2(b.y-a.y,b.x-a.x),before=Math.atan2(nativeB.y-nativeA.y,nativeB.x-nativeA.x);
  close(Math.atan2(Math.sin(actual-before),Math.cos(actual-before)),-elevation*dir);
  const hinge=geo.turretPoint(INK_SALTIK_PARTS.turret.pivot),anchor=rest.sourcePoint(INK_SALTIK_PARTS.turret.pivot);
  assert.ok(Math.hypot(hinge.x-anchor.x,hinge.y-anchor.y)<=3*options.scale,'the attached hinge only seats a few world units');
  same(geo.face,rest.face);assert.deepEqual(geo.legs,rest.legs);assert.deepEqual(geo.arms,rest.arms);
  assert.deepEqual(inkPlayerPodGeometry(p,geo),inkPlayerPodGeometry(p,rest));
  for(const sample of [[877,711],[1005,711],[913,823],[360,490],[1130,510]])same(geo.sourcePoint(sample),rest.sourcePoint(sample));
  const c=canvas();drawInkSaltik(c,{}, {...p,cannonElevation:elevation},options);
  for(const sample of [[650,300],[727,175],[650,388],...(elevation>0?[[910,185],[1060,333]]:[])]){
   const patches=c.calls.filter(call=>call.paints(sample));
   assert.equal(patches.length,1,'the complete native housing has exactly one painted copy');
   same(patches[0].sourcePoint(...sample),geo.turretPoint(sample));
  }
 }
});

test('pivot geometry has no hydraulic supports or lift and includes all moving native housing bounds',()=>{
 for(const dir of [-1,1])for(const tilt of [-.17,0,.17])for(const elevation of [.00001,.3,.6,1.05]){
  const p={...base,dir,tilt,cannonElevation:elevation,turretLift:1},c=canvas(),geo=drawInkSaltik(c,{},p,{camera:53,scale:1.2});
  assert.equal(geo.turretLift,0,'legacy lift input cannot detach the assembly');
  assert.deepEqual(geo.turretSupports,[]);
  assert.equal(c.fills.filter(fill=>['#20251f','#97a4a1','#fff2d5'].includes(fill.color)).length,0,'no piston rods are drawn');
  for(const point of [...geo.turretPart.polygon.map(geo.turretPoint),...geo.cannonPart.polygon.map(geo.cannonPoint),...geo.coaxPart.polygon.map(geo.coaxPoint)]){
   assert.ok(point.x>=geo.bounds.x-1e-7&&point.x<=geo.bounds.x+geo.bounds.w+1e-7);
   assert.ok(point.y>=geo.bounds.y-1e-7&&point.y<=geo.bounds.y+geo.bounds.h+1e-7);
  }
 }
 const rest=inkSaltikGeometry(base),legacy=inkSaltikGeometry({...base,turretLift:1});
 same(legacy.cannon,rest.cannon);same(legacy.arm,rest.arm);same(legacy.turretPoint([650,300]),rest.turretPoint([650,300]));
});

test('cannon and coax launch mouths follow their exact drawn native patches through pivot, independent fire and return',()=>{
 const states=[{cannonElevation:0},{cannonElevation:.3},{cannonElevation:.6},
  {cannonElevation:1.05,mirvFlash:.09,muzzle:.035},{cannonElevation:.4},{cannonElevation:0}];
 for(const dir of [-1,1])for(const tilt of [-.17,0,.17])for(const state of states){
  const p={...base,dir,tilt,...state},c=canvas(),geo=drawInkSaltik(c,{},p,{camera:53,scale:1.2});
  for(const [sample,mouth] of [[[1234,264],geo.cannon],[[1046,368],geo.arm]]){
   const patches=c.calls.filter(call=>call.paints(sample));assert.equal(patches.length,1,'one moving mouth, without a static duplicate');
   same(patches[0].sourcePoint(...sample),mouth);
  }
  const noPrimary=inkSaltikGeometry({...p,muzzle:0},{camera:53,scale:1.2}),noMirv=inkSaltikGeometry({...p,mirvFlash:0},{camera:53,scale:1.2});
  same(noPrimary.cannon,geo.cannon);same(noMirv.arm,geo.arm);
  const weapon=inkWeaponGeometry(p,0),dx=weapon.cannon.x-weapon.cannonBase.x,dy=weapon.cannon.y-weapon.cannonBase.y,length=Math.hypot(dx,dy);
  close(weapon.cannonDirection.x,dx/length);close(weapon.cannonDirection.y,dy/length);
 }
 const rest=inkSaltikGeometry(base),tiny=inkSaltikGeometry({...base,cannonElevation:.000001});
 assert.ok(Math.hypot(rest.cannon.x-tiny.cannon.x,rest.cannon.y-tiny.cannon.y)<.001,'the first pivot frame has no pop');
 const peak=inkSaltikGeometry({...base,cannonElevation:1.05}),nearPeak=inkSaltikGeometry({...base,cannonElevation:1.049999});
 assert.ok(Math.hypot(peak.cannon.x-nearPeak.cannon.x,peak.cannon.y-nearPeak.cannon.y)<.001,'the return handoff has no pop');
});

test('the pivot carries complete painted outlines and the short barrel recoil follows its real tube axis',()=>{
 for(const dir of [-1,1])for(const elevation of [Math.PI/6,Math.PI/3]){
  const p={...base,dir,cannonElevation:elevation},c=canvas(),geo=drawInkSaltik(c,{}, {...p,mirvFlash:.09,muzzle:.035});
  for(const [sample,point] of [[[1090,315],geo.cannonPoint],[[1072,368],geo.coaxPoint]]){
   const patches=c.calls.filter(call=>call.paints(sample));assert.equal(patches.length,1);
   same(patches[0].sourcePoint(...sample),point(sample));
  }
  const rest=inkSaltikGeometry({...p,cannonRecoil:0}),shot=inkSaltikGeometry({...p,cannonRecoil:1});
  const dx=shot.cannon.x-rest.cannon.x,dy=shot.cannon.y-rest.cannon.y;
  close(dx*Math.sin(rest.cannonAngle)-dy*Math.cos(rest.cannonAngle),0);
  close(dx*Math.cos(rest.cannonAngle)+dy*Math.sin(rest.cannonAngle),-26*rest.k);
  same(shot.arm,rest.arm);same(shot.turretPoint([650,300]),rest.turretPoint([650,300]));
 }
});

test('locked turn views retain their own resting native roof with no side overlay, rods or duplicate housing',()=>{
 const sourceSamples=[[[365,175],[577,165],[523,228]],[[1037,180],[1085,153],[1086,237]],[[1804,175],[1594,165],[1650,228]]];
 for(const frame of [1,2,3]){
  const p={...base,turretLift:1,cannonElevation:.8,turn:{yaw:frame*Math.PI/4,active:true}},atlas={},c=canvas();
  const geo=drawInkSaltik(c,{side:true},p,{turnImage:atlas,camera:43,scale:1.2});
  assert.ok(c.calls.every(call=>call.image===atlas),'the native quarter/front view supplies the complete assembly');
  for(const sample of sourceSamples[frame-1]){
   const patches=c.calls.filter(call=>call.paints(sample));assert.equal(patches.length,1);
   same(patches[0].sourcePoint(...sample),geo.turretPoint(sample));
  }
  assert.equal(geo.turretPart.rotation,0);assert.deepEqual(geo.turretSupports,[]);assert.ok(geo.weaponsLocked);
 }
});

test('resting turret keeps the original image draws and the legacy boss barrel mask',()=>{
 const c=canvas(),geo=drawInkSaltik(c,{},base);
 assert.equal(c.calls.length,11,'the resting native sprite takes the original draw path');assert.equal(geo.turretLift,0);
 assert.deepEqual(INK_SALTIK_PARTS.cannon.pivot,[913,270]);
 assert.equal(inside([650,300],INK_SALTIK_PARTS.cannon.polygon),false,'the boss barrel mask is not expanded to the whole roof');
 assert.deepEqual(INK_SALTIK_PARTS.cannon.muzzle,[1234,264]);
});
