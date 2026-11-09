import test from 'node:test';
import assert from 'node:assert/strict';
import {drawInkSaltik,inkSaltikGeometry} from '../src/ink-saltik.js';
import {drawInkEnemySaltik,inkEnemySaltikGeometry} from '../src/ink-enemy-saltik.js';
import {drawInkPlayerPods,inkPlayerPodGeometry} from '../src/ink-pods.js';

const player={x:300,y:550,dir:1,onGround:true,vx:0,vy:0};
const enemy={x:650,y:550,dir:1,hp:24,vx:0};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} versus ${b}`);
const same=(a,b)=>{near(a.x,b.x);near(a.y,b.y);};
const contains=([x,y],points)=>{let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;};
// Retain the final image transform and filled ellipse sizes. This measures
// painted native source pixels independently from the geometry under test.
function canvas(){
 let m=[1,0,0,1,0,0],stack=[],path=[],clipPath=[],clipRule,ellipse=null;
 const calls=[],fills=[],point=(x,y)=>({x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]});
 return {calls,fills,globalAlpha:1,fillStyle:'',save(){stack.push({m:[...m],clipPath,clipRule,fillStyle:this.fillStyle});},restore(){const s=stack.pop();({m,clipPath,clipRule}=s);this.fillStyle=s.fillStyle;},
  translate(x,y){const p=point(x,y);m[4]=p.x;m[5]=p.y;},scale(x,y){m[0]*=x;m[1]*=x;m[2]*=y;m[3]*=y;},
  rotate(a){const [aa,b,c,d]=m,co=Math.cos(a),si=Math.sin(a);m[0]=aa*co+c*si;m[1]=b*co+d*si;m[2]=c*co-aa*si;m[3]=d*co-b*si;},
  transform(a,b,c,d,e,f){const [aa,bb,cc,dd,ee,ff]=m;m=[aa*a+cc*b,bb*a+dd*b,aa*c+cc*d,bb*c+dd*d,aa*e+cc*f+ee,bb*e+dd*f+ff];},
  drawImage(...args){const [image,sx,sy,sw,sh,dx,dy,dw,dh]=args,t=[...m];calls.push({image,clipPath,clipRule,sourcePoint(x,y){const xx=dx+(x-sx)/sw*dw,yy=dy+(y-sy)/sh*dh;return{x:t[0]*xx+t[2]*yy+t[4],y:t[1]*xx+t[3]*yy+t[5]};}});},
  beginPath(){path=[];ellipse=null;},moveTo(x,y){path.push([x,y]);},lineTo(x,y){path.push([x,y]);},closePath(){},clip(rule){clipPath=[...path];clipRule=rule;},
  ellipse(x,y,rx,ry){ellipse={center:point(x,y),rx:rx*Math.hypot(m[0],m[1]),ry:ry*Math.hypot(m[2],m[3])};},
  fill(){if(ellipse)fills.push({...ellipse,color:this.fillStyle});},stroke(){},arc(){},setLineDash(){}};
}

test('loaded player noses fill almost the whole bore with a large bright center, then become dark',()=>{
 const geo=inkSaltikGeometry(player),slots=inkPlayerPodGeometry(player,geo),ready=canvas();drawInkPlayerPods(ready,player,geo);
 for(const slot of slots){
  const fills=ready.fills.filter(f=>Math.hypot(f.center.x-slot.muzzle.x,f.center.y-slot.muzzle.y)<slot.rx*geo.k*.3);
  assert.ok(fills.some(f=>f.color==='#36c6dc'&&f.rx>=slot.rx*geo.k*.9&&f.ry>=slot.ry*geo.k*.9),'a solid cyan nose fills the tube');
  assert.ok(fills.some(f=>f.color==='#fff1cd'&&f.rx>=slot.rx*geo.k*.5),'the ivory center remains readable at native scale');
 }
 const spent={...player,podCycle:{elapsed:2,duration:9.5,fired:[true,true,true]}},dark=canvas();drawInkPlayerPods(dark,spent,geo);
 assert.equal(dark.fills.filter(f=>f.color==='#36c6dc').length,0);
 assert.equal(dark.fills.filter(f=>f.color==='#141814').length,8);
});

test('primary fire gives the small coax a continuous axial pulse and leaves the roof cannon aimed',()=>{
 for(const dir of [-1,1]){
  const actor={...player,dir,cannonElevation:.53},idle=inkSaltikGeometry(actor),start=inkSaltikGeometry({...actor,muzzle:.07});
  same(start.arm,idle.arm);same(start.cannon,idle.cannon);
  const peak=inkSaltikGeometry({...actor,muzzle:.035}),end=inkSaltikGeometry({...actor,muzzle:0});
  assert.ok((idle.arm.x-peak.arm.x)*dir>.9,'the real small barrel travels backward visibly');
  same(peak.cannon,idle.cannon);same(end.arm,idle.arm);
  const tiny=inkSaltikGeometry({...actor,muzzle:.07-.00001});
  assert.ok(Math.hypot(tiny.arm.x-start.arm.x,tiny.arm.y-start.arm.y)<.00001,'there is no first-frame jump');
  for(const muzzle of [.07,.055,.035,.012,0]){
   const p={...actor,muzzle},c=canvas(),geo=drawInkSaltik(c,{},p,{camera:43,scale:1.3});
   const patch=c.calls.find(call=>call.clipRule!=='evenodd'&&contains([1046,368],call.clipPath));
   assert.ok(patch,'the small coax is a separate native image patch');same(patch.sourcePoint(1046,368),geo.arm);
  }
 }
});

test('MIRV recoil starts at rest, rises into a short barrel stroke, and returns without changing coax',()=>{
 for(const dir of [-1,1]){
  const actor={...player,dir,cannonElevation:.6},idle=inkSaltikGeometry(actor);
  same(inkSaltikGeometry({...actor,mirvFlash:.18}).cannon,idle.cannon);
  const peak=inkSaltikGeometry({...actor,mirvFlash:.09}),ending=inkSaltikGeometry({...actor,mirvFlash:.00001});
  assert.ok((idle.cannon.x-peak.cannon.x)*dir>1.4);assert.ok((idle.cannon.x-peak.cannon.x)*dir<3.5);
  assert.ok(Math.abs(peak.cannonPart.rotation-idle.cannonPart.rotation)<.012,'only a tiny natural inclination accompanies the stroke');
  same(peak.arm,idle.arm);assert.ok(Math.hypot(ending.cannon.x-idle.cannon.x,ending.cannon.y-idle.cannon.y)<.00001);
  const c=canvas(),geo=drawInkSaltik(c,{}, {...actor,mirvFlash:.09},{camera:53,scale:1.2});
  const patch=c.calls.find(call=>call.clipRule!=='evenodd'&&contains([1234,264],call.clipPath));
  same(patch.sourcePoint(1234,264),geo.cannon);
 }
});

test('enemy pod boxes deploy a few pixels and all physical mouths follow their actual painted patches',()=>{
 for(const dir of [-1,1])for(const podRaise of [0,.2,.5,1]){
  const actor={...enemy,dir,podRaise},c=canvas(),geo=drawInkEnemySaltik(c,{},actor,{camera:57,scale:1.2});
  const rest=inkEnemySaltikGeometry({...actor,podRaise:0},0,{camera:57,scale:1.2});
  for(const [index,point] of [[334,52.5],[893.5,104]].entries()){
   const patch=c.calls.find(call=>call.clipRule!=='evenodd'&&contains(point,call.clipPath));
   assert.ok(patch,'a native launcher and its strut are articulated together');
   same(patch.sourcePoint(...point),geo.podMuzzles[index]);
   const movement=Math.hypot(geo.podMuzzles[index].x-rest.podMuzzles[index].x,geo.podMuzzles[index].y-rest.podMuzzles[index].y);
   if(podRaise===1)assert.ok(movement>.8&&movement<4,'launcher travel is small and real');
  }
  assert.equal(geo.podMuzzles.length,2);assert.equal(geo.arms.length,2,'deployment does not invent another arm');
 }
 const tiny=inkEnemySaltikGeometry({...enemy,podRaise:.0001}),rest=inkEnemySaltikGeometry(enemy);
 assert.ok(Math.hypot(tiny.podMuzzles[0].x-rest.podMuzzles[0].x,tiny.podMuzzles[0].y-rest.podMuzzles[0].y)<.00001);
});
