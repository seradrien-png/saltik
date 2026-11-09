import test from 'node:test';
import assert from 'node:assert/strict';
import {drawInkSaltik,inkSaltikGeometry,INK_SALTIK_PARTS} from '../src/ink-saltik.js';
import {computeSupportPose} from '../src/support-pose.js';
import {inkTurnFrame,inkTurnGeometry,INK_TURN_VIEWS} from '../src/ink-turn.js';
import {advanceTachikomaTurn,createTachikomaTurn} from '../src/tachikoma-turn.js';

const base={x:300,y:400,dir:1,onGround:true,vx:0,vy:0};
const close=(a,b)=>assert.ok(Math.abs(a-b)<.001,`${a} versus ${b}`);
function recorder(){
  const calls=[],clips=[];
  return {calls,clips,globalAlpha:1,save(){},restore(){},translate(){},rotate(){},scale(){},transform(){},
    beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(rule){clips.push(rule);},
    drawImage(...args){calls.push(args);},ellipse(){},fill(){}};
}

test('the ink renderer reuses one measured cutout with exactly two original arm masks',()=>{
  const image={width:1422,height:1106},c=recorder(),before=structuredClone(base);
  const geo=drawInkSaltik(c,image,base);
  assert.deepEqual(base,before,'rendering never changes simulation state');
  assert.equal(INK_SALTIK_PARTS.arms.length,2);
  assert.equal(INK_SALTIK_PARTS.legs.length,3,'the fourth native leg is occluded');
  assert.equal(c.calls.length,10,'six suspension pieces, one body, one barrel and two arms');
  assert.ok(c.calls.every(args=>args[0]===image),'every articulated piece is original artwork');
  assert.ok(c.clips.includes('evenodd'),'the fixed body excludes all moving source pixels');
  assert.equal(geo.visibleHeight,126);
  assert.equal(drawInkSaltik(c,null,base),null);
});

test('all three painted wheel contacts plant on sampled slopes for both facings and camera scales',()=>{
  for(const dir of [-1,1])for(const slope of [-.16,0,.16])for(const scale of [.8,1,1.5]){
    const floor=x=>base.y+(x-base.x)*slope,p={...base,dir};
    p.supportPose=computeSupportPose(p,floor);p.tilt=p.supportPose.tilt;
    const geo=inkSaltikGeometry(p,{camera:57,time:.21,scale});
    for(const leg of geo.legs){
      assert.equal(leg.grounded,true);
      const worldX=p.x+(leg.contact.x-geo.x)/scale;
      close(leg.contact.y,base.y+(floor(worldX)-base.y)*scale);
    }
  }
});

test('compression lowers the rigid cabin while the existing wheels remain grounded',()=>{
  const still=inkSaltikGeometry(base),compressed=inkSaltikGeometry({...base,jumpCompression:1});
  assert.ok(compressed.bodyDrop>still.bodyDrop+5);
  assert.ok(compressed.face.y>still.face.y+5);
  for(let i=0;i<still.legs.length;i++){
    close(still.legs[i].contact.y,base.y);close(compressed.legs[i].contact.y,base.y);
    assert.ok(compressed.legs[i].stretch<still.legs[i].stretch);
  }
});

test('reversals use all five real views in both directions and never collapse the silhouette',()=>{
  for(const dir of [1,-1]){
    const p={...base,dir:-dir,turn:createTachikomaTurn(dir)},frames=[];
    for(let i=0;i<=36;i++){
      const frame=inkTurnFrame(p);if(frames.at(-1)!==frame)frames.push(frame);
      const geo=inkSaltikGeometry(p);assert.ok(geo.bounds.w>120,'the camera sees a full hull even facing the viewer');
      advanceTachikomaTurn(p.turn,-dir,1/60);
    }
    assert.deepEqual(frames,dir===1?[0,1,2,3,4]:[4,3,2,1,0]);
  }
  const p={...base,turn:createTachikomaTurn(1)};
  advanceTachikomaTurn(p.turn,-1,.24);assert.equal(inkTurnFrame(p),2);
  advanceTachikomaTurn(p.turn,1,.06);assert.equal(inkTurnFrame(p),1,'retargeting retraces intermediate views');
});

test('new front and quarter-turn wheels remain planted on slopes without changing simulation',()=>{
  for(const frame of [1,2,3])for(const slope of [-.16,0,.16]){
    const p={...base,turn:{active:true,yaw:frame*Math.PI/4}},before=structuredClone(p);
    const sampleGround=x=>base.y+(x-base.x)*slope;
    const geo=inkTurnGeometry(p,{camera:57,sampleGround});
    for(const leg of geo.legs)close(leg.contact.y,sampleGround(leg.contact.x+57));
    const c=recorder(),atlas={width:2172,height:724};
    drawInkSaltik(c,{width:1422,height:1106},p,{turnImage:atlas,sampleGround});
    assert.ok(c.calls.every(args=>args[0]===atlas),'one actual native view, with no duplicate side sprite');
    assert.ok(c.calls.every(args=>args.slice(1,5).every((v,i)=>v===INK_TURN_VIEWS[frame-1].crop[i])));
    assert.deepEqual(p,before);
  }
});

test('parry and melee move only the two original arms; recoil moves the existing cannon',()=>{
  const idle=inkSaltikGeometry(base),parry=inkSaltikGeometry({...base,deflect:{active:true,elapsed:.17}});
  const melee=inkSaltikGeometry({...base,melee:{phase:'impact',elapsed:.04}});
  const firing=inkSaltikGeometry({...base,cannonRecoil:1});
  assert.notEqual(parry.arms[0].rotation,idle.arms[0].rotation);
  assert.notEqual(melee.arms[0].rotation,idle.arms[0].rotation);
  assert.deepEqual(parry.face,idle.face,'there is no mouth or faceplate animation');
  assert.deepEqual(melee.face,idle.face);
  assert.ok(firing.cannon.x<idle.cannon.x);
  assert.equal(parry.arms.length,2);assert.equal(melee.arms.length,2);
});

test('native arm masks include the claw outlines and exclude the rigid eyes and mouth',()=>{
  const inside=([x,y],points)=>{
    let hit=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const a=points[i],b=points[j];
      if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
    }
    return hit;
  };
  for(const point of [[790,986],[844,1045],[920,1001],[705,900]])
    assert.ok(inside(point,INK_SALTIK_PARTS.arms[0].polygon),`near claw outline ${point} is removed from the body`);
  for(const point of [[1010,985],[1090,1025],[1125,979]])
    assert.ok(inside(point,INK_SALTIK_PARTS.arms[1].polygon),`far claw outline ${point} is removed from the body`);
  for(const part of INK_SALTIK_PARTS.arms)for(const point of [[877,711],[1005,711],[913,823]])
    assert.equal(inside(point,part.polygon),false,`rigid face pixel ${point} remains on the cabin`);
  assert.equal(inside([675,895],INK_SALTIK_PARTS.arms[0].polygon),false,'the black shoulder socket remains attached to the cabin');
});

test('native side and turn wheels never invent a floor over a real support gap',()=>{
  const floor=x=>x<base.x-8?base.y:null,p={...base};
  p.supportPose=computeSupportPose(p,floor);
  const side=inkSaltikGeometry(p);
  assert.ok(side.legs.some(leg=>leg.grounded));
  assert.ok(side.legs.some(leg=>!leg.grounded),'overhanging wheels are unsupported');
  for(const leg of side.legs.filter(leg=>leg.grounded))assert.ok(Number.isFinite(floor(leg.contact.x)));
  const turn=inkTurnGeometry({...p,turn:{yaw:Math.PI/2,active:true}},{sampleGround:floor});
  assert.ok(turn.legs.some(leg=>!leg.grounded));
  for(const leg of turn.legs){assert.ok(Number.isFinite(leg.contact.x));assert.ok(Number.isFinite(leg.contact.y));}
});

test('native cabin lowers on its suspension under a low stair landing without scaling the face',()=>{
  const p={...base,supportClearance:112};p.supportPose=computeSupportPose(p,()=>base.y);
  const geo=inkSaltikGeometry(p);
  assert.ok(geo.sourcePoint([742,24]).y>=p.y-p.supportClearance,'rigid cabin clears real overhead stone');
  for(const leg of geo.legs)assert.ok(leg.grounded);
  const turn=inkTurnGeometry({...p,turn:{yaw:Math.PI/2,active:true}},{sampleGround:()=>base.y});
  assert.ok(turn.point([turn.view.anchor[0],turn.view.top]).y>=p.y-p.supportClearance);
  for(const leg of turn.legs)assert.ok(leg.grounded);
});
