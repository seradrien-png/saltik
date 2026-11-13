import test from 'node:test';
import assert from 'node:assert/strict';
import {inkSaltikGeometry,drawInkSaltik,INK_SALTIK_PARTS} from '../src/ink-saltik.js';
import {computeSupportPose} from '../src/support-pose.js';

const base={x:300,y:400,dir:1,onGround:true,vx:0,vy:0};
const close=(a,b,tolerance=1e-7)=>assert.ok(Math.abs(a-b)<tolerance,`${a} versus ${b}`);

test('acceleration pitch and suspension heave move the rigid cabin without unplanting wheels',()=>{
  for(const dir of [-1,1])for(const slope of [-.16,0,.16])for(const scale of [.8,1,1.5]){
    const floor=x=>400+(x-300)*slope,p={...base,dir};
    p.supportPose=computeSupportPose(p,floor);
    const still=inkSaltikGeometry(p,{camera:57,time:.23,scale});
    const live=inkSaltikGeometry({...p,motionLean:.045,motionHeave:1.1},{camera:57,time:.23,scale});
    close(live.tilt-still.tilt,.045);close(live.heave-still.heave,1.1*scale);
    assert.notDeepEqual(live.face,still.face);
    for(const leg of live.legs){
      assert.equal(leg.grounded,true);
      const worldX=300+(leg.contact.x-live.x)/scale;
      close(leg.contact.y,400+(floor(worldX)-400)*scale,.001);
    }
    const a=live.sourcePoint([877,711]),b=live.sourcePoint([1005,711]);
    close(Math.hypot(a.x-b.x,a.y-b.y),128*live.k);
  }
});

test('wheel ink follows signed travel and stays still when only idle time changes',()=>{
  for(const dir of [-1,1]){
    const p={...base,dir,vx:230*dir,motionDistance:0};
    const a=inkSaltikGeometry(p,{time:.2}),b=inkSaltikGeometry({...p,motionDistance:17*dir},{time:.2});
    const later=inkSaltikGeometry({...p,motionDistance:17*dir},{time:3.5});
    for(let i=0;i<a.legs.length;i++){
      assert.ok(Number.isFinite(b.legs[i].wheelSpin));
      assert.notEqual(b.legs[i].wheelSpin,a.legs[i].wheelSpin);
      close(b.legs[i].wheelSpin,later.legs[i].wheelSpin);
      assert.ok(b.legs[i].wheelSpin>0,'a wheel rotates forward in its native facing');
      close(b.legs[i].contact.y,400,.001);
    }
  }
});

test('idle hands and eye reflections change gently while the faceplate remains rigid',()=>{
  const a=inkSaltikGeometry(base,{time:0}),b=inkSaltikGeometry(base,{time:.8});
  assert.notEqual(a.arms[0].rotation,b.arms[0].rotation);
  assert.notEqual(a.arms[1].rotation,b.arms[1].rotation);
  assert.notDeepEqual(a.eyeReflections,b.eyeReflections);
  assert.equal(b.arms.length,2);assert.equal(b.legs.length,3);
  assert.deepEqual(b.face,b.sourcePoint([930,747]));
  for(const time of [0,.1,.4,.8,1.2,1.9]){
    const idle=inkSaltikGeometry(base,{time}),running=inkSaltikGeometry({...base,vx:230},{time});
    for(const arm of idle.arms)assert.ok(Math.abs(arm.rotation)<=.06);
    for(const arm of running.arms)assert.ok(Math.abs(arm.rotation)<=.12);
    for(const eye of idle.eyeReflections){assert.ok(eye.rx<=5);assert.ok(eye.ry<=6);}
  }
});

test('the native elevated barrel recoils along its measured bore in either facing',()=>{
  for(const dir of [-1,1])for(const elevation of [0,.45,1.1]){
    const p={...base,dir,tilt:.17,motionLean:.035,cannonElevation:elevation};
    const rest=inkSaltikGeometry({...p,cannonRecoil:0},{time:0});
    const shot=inkSaltikGeometry({...p,cannonRecoil:1},{time:0});
    const dx=shot.cannon.x-rest.cannon.x,dy=shot.cannon.y-rest.cannon.y;
    close(dx*Math.sin(rest.cannonAngle)-dy*Math.cos(rest.cannonAngle),0);
    close(dx*Math.cos(rest.cannonAngle)+dy*Math.sin(rest.cannonAngle),-26*rest.k);
    close(shot.cannonAngle,rest.cannonAngle);
    assert.deepEqual(shot.arm,rest.arm,'the primary coax aperture stays on its own fixed mount');
    close(Math.hypot(shot.cannon.x-shot.cannonBase.x,shot.cannon.y-shot.cannonBase.y),Math.hypot(rest.cannon.x-rest.cannonBase.x,rest.cannon.y-rest.cannonBase.y));
  }
});

test('animated native draw preserves simulation state and uses no new image layers',()=>{
  const p={...base,vx:230,motionLean:.05,motionHeave:1.2,motionDistance:42},before=structuredClone(p);
  const images=[],fills=[];
  const c={globalAlpha:1,save(){},restore(){},translate(){},rotate(){},scale(){},transform(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){},ellipse(){},fill(){fills.push({color:this.fillStyle,images:images.length});},drawImage(...args){images.push(args[0]);}};
  const image={width:1422,height:1106};
  drawInkSaltik(c,image,p,{time:.7});
  assert.deepEqual(p,before);
  assert.equal(images.length,11);
  assert.ok(images.every(item=>item===image));
  assert.equal(fills.filter(fill=>fill.images<=6&&fill.color==='#fff4da').length,0,'painted tires have no added rotating highlights');
  assert.equal(INK_SALTIK_PARTS.arms.length,2);
});
