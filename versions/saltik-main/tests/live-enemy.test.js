import test from 'node:test';
import assert from 'node:assert/strict';
import * as saltik from '../src/ink-enemy-saltik.js';
import {computeSupportPose} from '../src/support-pose.js';

const base={x:400,y:620,hp:40,dir:1,vx:0};
const near=(a,b,tolerance=.001)=>assert.ok(Math.abs(a-b)<tolerance,`${a} versus ${b}`);
const inside=([x,y],points)=>{
 let hit=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[i],b=points[j];
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
 }
 return hit;
};

// Retain Canvas2D transforms, so a painted source pixel is checked independently
// of the geometry calculation used for projectile emission.
function canvas(){
 let m=[1,0,0,1,0,0],path=[],clips=[],stack=[];
 const calls=[];
 const point=(x,y)=>({x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]});
 return {calls,globalAlpha:1,
  save(){stack.push({m:[...m],clips:[...clips]});},restore(){({m,clips}=stack.pop());},
  translate(x,y){const p=point(x,y);m[4]=p.x;m[5]=p.y;},
  transform(a,b,c,d,e,f){const [aa,bb,cc,dd,ee,ff]=m;m=[aa*a+cc*b,bb*a+dd*b,aa*c+cc*d,bb*c+dd*d,aa*e+cc*f+ee,bb*e+dd*f+ff];},
  rotate(angle){this.transform(Math.cos(angle),Math.sin(angle),-Math.sin(angle),Math.cos(angle),0,0);},
  scale(x,y){this.transform(x,0,0,y,0,0);},
  beginPath(){path=[];},moveTo(x,y){path.push([x,y]);},lineTo(x,y){path.push([x,y]);},closePath(){},
  clip(rule){clips.push({rule,path:[...path]});},ellipse(){},arc(){},setLineDash(){},fill(){},stroke(){},
  drawImage(image,sx,sy,sw,sh,dx,dy,dw,dh){
   const matrix=[...m];calls.push({image,crop:[sx,sy,sw,sh],clip:clips.at(-1),point(x,y){
    const xx=dx+(x-sx)*dw/sw,yy=dy+(y-sy)*dh/sh;
    return{x:matrix[0]*xx+matrix[2]*yy+matrix[4],y:matrix[1]*xx+matrix[3]*yy+matrix[5]};
   }});
  },
 };
}

test('the three painted enemy wheels plant on real terrain in both directions and at camera scales',()=>{
 for(const dir of [-1,1])for(const slope of [-.16,0,.16])for(const scale of [.8,1,1.5]){
  const enemy={...base,dir},floor=x=>620+(x-400)*slope;
  enemy.supportPose=computeSupportPose(enemy,floor);
  const geo=saltik.inkEnemySaltikGeometry(enemy,.6,{camera:57,scale});
  assert.equal(geo.legs?.length,3,'only the three visible native legs articulate');
  for(const leg of geo.legs){
   assert.equal(leg.grounded,true);
   const worldX=enemy.x+(leg.contact.x-(enemy.x-57))/scale;
   near(leg.contact.y,620+(floor(worldX)-620)*scale);
  }
 }
});

test('travel rolls native wheel details and alternates intentional lift while stationary duel pixels hold still',()=>{
 const enemy={...base,vx:70,motionDistance:0};enemy.supportPose=computeSupportPose(enemy,()=>620);
 const a=saltik.inkEnemySaltikGeometry(enemy,.1),b=saltik.inkEnemySaltikGeometry({...enemy,motionDistance:13},.8);
 assert.ok(a.legs?.some((leg,i)=>Math.abs(leg.spin-b.legs[i].spin)>.2),'wheel phase follows actual travel');
 assert.ok(b.legs.some(leg=>!leg.grounded&&leg.lift>0),'a swing wheel is deliberately lifted');
 assert.ok(b.legs.some(leg=>leg.grounded),'the other wheels still support the cabin');
 for(const leg of b.legs)assert.ok(leg.contact.y<=620.001,'a moving wheel never sinks through flat ground');
 const stillA=saltik.inkEnemySaltikGeometry(base,0),stillB=saltik.inkEnemySaltikGeometry({...base,motionDistance:200},80);
 assert.deepEqual(stillB.muzzle,stillA.muzzle);
 assert.deepEqual(stillB.legs.map(leg=>leg.contact),stillA.legs.map(leg=>leg.contact),'the duel can mask the resting native limbs exactly');
});

test('native support gaps leave wheels unsupported and bounds contain every rotated crop corner',()=>{
 const enemy={...base,motionLean:.11},floor=x=>x<400?620:null;
 enemy.supportPose=computeSupportPose(enemy,floor);
 const geo=saltik.inkEnemySaltikGeometry(enemy,.4,{camera:73,scale:1.5});
 assert.ok(geo.legs?.some(leg=>leg.grounded));assert.ok(geo.legs.some(leg=>!leg.grounded));
 for(const leg of geo.legs.filter(leg=>leg.grounded))assert.ok(400+(leg.contact.x-(400-73))/1.5<400);
 const [sx,sy,sw,sh]=geo.crop;
 for(const source of [[sx,sy],[sx+sw,sy],[sx+sw,sy+sh],[sx,sy+sh]]){
  const p=geo.sourcePoint(source);
  assert.ok(p.x>=geo.bounds.x-.001&&p.x<=geo.bounds.x+geo.bounds.w+.001);
  assert.ok(p.y>=geo.bounds.y-.001&&p.y<=geo.bounds.y+geo.bounds.h+.001);
 }
});

test('short cannon recoil moves the painted muzzle and keeps both native launcher mouths registered',()=>{
 const image={width:1983,height:793};
 for(const dir of [-1,1])for(const scale of [.8,1.4]){
  const enemy={...base,dir,vx:60,motionDistance:17,motionLean:-.08,firePose:.14};
  enemy.supportPose=computeSupportPose(enemy,x=>620+(x-400)*.13);
  const c=canvas(),before=structuredClone(enemy),geo=saltik.drawInkEnemySaltik(c,image,enemy,{camera:51,time:.4,scale});
  const barrel=c.calls.find(call=>call.clip?.rule!=='evenodd'&&inside([851,394],call.clip?.path??[]));
  assert.ok(barrel,'the existing cannon is a distinct moving native patch');
  const mouth=barrel.point(851,394),basePoint=barrel.point(720,401),n=Math.hypot(mouth.x-basePoint.x,mouth.y-basePoint.y);
  near(mouth.x,geo.muzzle.x);near(mouth.y,geo.muzzle.y);
  near((mouth.x-basePoint.x)/n,geo.muzzleDirection.x);near((mouth.y-basePoint.y)/n,geo.muzzleDirection.y);
  const idle=saltik.inkEnemySaltikGeometry({...enemy,firePose:0},.4,{camera:51,scale});
  assert.ok((idle.muzzle.x-geo.muzzle.x)*dir>2*scale,'recoil slides axially into the existing mount');
  const cabin=c.calls.find(call=>call.clip?.rule==='evenodd');assert.ok(cabin);
  for(let i=0;i<2;i++){
   const p=cabin.point(...[[334,52.5],[893.5,104]][i]);near(p.x,geo.podMuzzles[i].x);near(p.y,geo.podMuzzles[i].y);
  }
  assert.ok(c.calls.every(call=>call.image===image&&call.crop.every((value,i)=>value===[55,10,940,770][i])));
  assert.deepEqual(enemy,before,'native rendering never changes AI or weapon state');
 }
});

test('the native enemy keeps two small hands below the cabin and the front impact view remains exact',()=>{
 const geo=saltik.inkEnemySaltikGeometry({...base,vx:70,motionDistance:10});
 assert.equal(geo.arms?.length,2);
 for(const arm of geo.arms){
  assert.ok(arm.polygon.every(([,y])=>y>=610),'launcher struts never become arms');
  for(const point of [[358,90],[917,145],[615,546],[710,550]])assert.equal(inside(point,arm.polygon),false);
 }
 const c=canvas(),enemy={...base,firePose:.14,motionLean:.3,vx:168,motionDistance:56};
 const front=saltik.drawInkEnemySaltik(c,{},enemy,{view:'front',scale:3,time:1});
 assert.equal(c.calls.length,1,'impact uses the intact native front view');
 assert.deepEqual(c.calls[0].crop,[1084,27,850,753]);
 const anchor=c.calls[0].point(1506,772);near(anchor.x,400);near(anchor.y,620);
 const muzzle=c.calls[0].point(1506,420);near(muzzle.x,front.muzzle.x);near(muzzle.y,front.muzzle.y);
});

test('moving wheel masks remove their original black tire outlines from the rigid cabin',()=>{
 const geo=saltik.inkEnemySaltikGeometry(base),front=geo.legs.find(leg=>leg.id==='front'),nearWheel=geo.legs.find(leg=>leg.id==='rear-near');
 for(const point of [[834,723],[851,748],[876,768]])assert.ok(inside(point,front.polygon),`front tire outline ${point} must move with its wheel`);
 assert.ok(inside([308,773],nearWheel.polygon),'the near rear tire has no resting outline left underneath');
});
