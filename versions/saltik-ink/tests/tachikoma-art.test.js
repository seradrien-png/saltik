import test from 'node:test';
import assert from 'node:assert/strict';
import {drawTachikoma} from '../src/tachikoma-art.js';
import {tachikomaGeometry} from '../src/tachikoma-pose.js';
import {computeSupportPose} from '../src/support-pose.js';
import {createEvasionState,beginEvasion,advanceEvasion,DEFLECT_MOVE} from '../src/evasion.js';
const heldDodge=elapsed=>{const state=createEvasionState();beginEvasion(state);advanceEvasion(state,elapsed);return state;};

function canvasRecorder(){
  let matrix=[1,0,0,1,0,0];const stack=[],calls=[],translations=[],paths=[],rects=[],clips=[],clipPaths=[];let currentPath=[];
  const multiply=([a,b,c,d,e,f])=>{const [u,v,w,x,y,z]=matrix;matrix=[u*a+w*b,v*a+x*b,u*c+w*d,v*c+x*d,u*e+w*f+y,v*e+x*f+z];};
  return {calls,translations,paths,rects,clips,clipPaths,globalAlpha:1,
    save(){stack.push([...matrix]);},restore(){matrix=stack.pop();},
    scale(x,y){multiply([x,0,0,y,0,0]);},rotate(a){multiply([Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0]);},
    translate(x,y){multiply([1,0,0,1,x,y]);translations.push({x:matrix[4],y:matrix[5]});},
    drawImage(...args){calls.push({args,matrix:[...matrix],alpha:this.globalAlpha});},
    beginPath(){paths.push([...matrix]);currentPath=[];},moveTo(...point){currentPath.push(['M',...point]);},lineTo(...point){currentPath.push(['L',...point]);},closePath(){currentPath.push(['Z']);},clip(rule){clips.push(rule);clipPaths.push(currentPath.map(point=>[...point]));},fill(){},
    fillRect(...args){rects.push(args);},ellipse(){}};
}
const sheet={width:1536,height:1024},turnSheet={width:1536,height:1024};
const images={tachikoma:sheet,'tachikoma-turn':turnSheet};
const base={x:300,y:550,supportY:550,dir:1,vx:0,vy:0,onGround:true};
const close=(actual,want,message)=>assert.ok(Math.abs(actual-want)<1e-9,`${message}: ${actual} versus ${want}`);

// SALTIK STRIKER acceptance: inspect the NEW canonical sheets before replacing
// crop fixtures. A crop must retain its entire vehicle and contain no adjacent
// vehicle pixels. Mark measured coax/main/pod openings on inspection copies for
// peer review; launch/art agreement alone cannot prove the points match pixels.
test('action artwork uses all four gait cells and native idle, crouch, jump and damage cells',()=>{
  const poses=[
    {p:{...base,vx:160},time:.02,frame:0,crop:[15,116,370,340]},
    {p:{...base,vx:160},time:.12,frame:1,crop:[415,116,359,343]},
    {p:{...base,vx:160},time:.22,frame:2,crop:[800,119,355,340]},
    {p:{...base,vx:160},time:.32,frame:3,crop:[1195,117,326,339]},
    {p:base,time:0,frame:4,crop:[20,603,373,339]},
    {p:{...base,crouching:true},time:0,frame:5,crop:[431,656,321,287]},
    {p:{...base,onGround:false,vy:-300},time:0,frame:6,crop:[775,550,373,333]},
    {p:{...base,damagePose:true},time:0,frame:7,crop:[1171,601,363,341]},
  ];
  for(const {p,time,frame,crop} of poses){
    const c=canvasRecorder();drawTachikoma(c,images,p,time);
    assert.equal(tachikomaGeometry(p,time).frame,frame);
    assert.equal(c.calls.length,1,'native crouching is one authored image');
    assert.equal(c.calls[0].args[0],sheet);assert.deepEqual(c.calls[0].args.slice(1,5),crop);
  }
});

test('each directional octant uses its own turn artwork without horizontal mirroring',()=>{
  for(let frame=0;frame<8;frame++){
    const c=canvasRecorder(),p={...base,dir:-1,turn:{yaw:frame*Math.PI/4,active:true}};
    drawTachikoma(c,images,p,0);assert.equal(c.calls.length,1);assert.equal(c.calls[0].args[0],turnSheet);
    const geo=tachikomaGeometry(p,0);assert.equal(geo.frame,frame);assert.equal(geo.atlas,'tachikoma-turn');
    const [a,b,cross,d]=c.calls[0].matrix;assert.ok(a*d-b*cross>0,'authored perspectives are never mirrored');
  }
});

test('the left-facing action sheet is normalized before applying gameplay facing',()=>{
  for(const dir of [-1,1]){
    const c=canvasRecorder();drawTachikoma(c,images,{...base,dir},0);
    const [a,b,cross,d]=c.calls[0].matrix;
    assert.equal(Math.sign(a*d-b*cross),-dir,'raw left artwork mirrors only when requested right');
  }
});

test('registered body feet stay on physical support in both directions, crouch and turn poses',()=>{
  for(const dir of [-1,1])for(const crouching of [false,true])for(const turning of [false,true]){
    const p={...base,dir,crouching,depth:.5,turn:turning?{yaw:Math.PI/2,active:true}:null};
    const c=canvasRecorder();drawTachikoma(c,images,p,0,{camera:77});
    const {args,matrix:[a,b,cc,d,e,f]}=c.calls[0],geo=tachikomaGeometry(p,0,{camera:77});
    const localX=args[5]+(geo.feet[0]+(geo.frame%4)*384-args[1])*args[7]/args[3];
    const localY=args[6]+(geo.feet[1]+Math.floor(geo.frame/4)*512-args[2])*args[8]/args[4];
    close(a*localX+cc*localY+e,223,'feet x');close(b*localX+d*localY+f,550,'feet y');
  }
});

test('obsolete depth values preserve sprite size, opacity and physical registration',()=>{
  const c=canvasRecorder();drawTachikoma(c,images,{...base,depth:1},0);
  assert.equal(c.calls[0].alpha,1);close(c.calls[0].args[7]/c.calls[0].args[3],.2955223880597015,'registered pixel scale');
  assert.ok(c.translations.some(at=>at.x===300&&at.y===550));
});

test('only the painted lateral box pods appear when no weapon flash is active',()=>{
  const c=canvasRecorder();drawTachikoma(c,images,base,0);
  assert.equal(c.calls.length,1);assert.equal(c.paths.length,0);assert.equal(c.rects.length,0,'no replacement tube overlay');
});

test('weapon flashes share the small coax, large main and lateral-pod mouths with combat',()=>{
  for(const dir of [-1,1])for(const crouching of [false,true]){
    const p={...base,dir,crouching,tilt:.17,depth:.6,muzzle:.05,mirvFlash:.1,homingFlash:.1};
    const c=canvasRecorder(),options={camera:77,scale:1.4},geo=tachikomaGeometry(p,.25,options);
    drawTachikoma(c,images,p,.25,options);
    for(const point of [geo.arm,geo.cannon,...geo.tubes])
      assert.ok(c.translations.some(at=>Math.hypot(point.x-at.x,point.y-at.y)<1e-9),'drawn flash must match the launch point');
    assert.equal(c.rects.length,0);
  }
});

test('the rear turn never draws a weapon flash through the armor hiding both turret muzzles',()=>{
  const c=canvasRecorder();drawTachikoma(c,images,{...base,turn:{yaw:Math.PI*1.5,active:true},muzzle:.05,mirvFlash:.1},0);
  assert.equal(c.calls.length,1);assert.equal(c.paths.length,0);
});

test('missing required atlas skips the sprite rather than substituting an unrelated body or perspective',()=>{
  for(const [supplied,p] of [[{tank:{}},base],[{tachikoma:sheet},{...base,turn:{yaw:Math.PI/2,active:true}}]]){
    const c=canvasRecorder();drawTachikoma(c,supplied,p,0);assert.equal(c.calls.length,0);
  }
});

test('support removes native distal pixels from the body and draws each moved assembly once at its actual contact',()=>{
  for(const dir of [-1,1])for(const melee of [undefined,{phase:'impact'}]){
    const p={...base,dir,melee},floor=x=>550+(x-300)*.14+Math.sin((x-300)/18)*3;
    p.supportPose=computeSupportPose(p,floor);p.tilt=p.supportPose.tilt;
    const geo=tachikomaGeometry(p,.22),c=canvasRecorder();
    drawTachikoma(c,{...images,'saltik-melee':sheet},p,.22);
    assert.equal(c.calls.length,7,'one clipped cabin plus three disjoint native strut/wheel pairs');
    assert.deepEqual(c.clips,[undefined,undefined,undefined,undefined,undefined,undefined,'evenodd']);
    assert.equal(c.rects.length,0,'no substitute ground/wheel overlay');
    for(const [i,part] of geo.distalParts.entries()){
      const {matrix:[a,b,cc,d,e,f]}=c.calls[i*2+1];
      const xx=(part.foot[0]-geo.feet[0])*geo.k,yy=(part.foot[1]-geo.feet[1])*geo.k;
      close(a*xx+cc*yy+e,part.contact.x,'native wheel draw x');close(b*xx+d*yy+f,part.contact.y,'native wheel draw y');
    }
  }
});

test('native tires translate rigidly while only the upper strut changes length, including maximum travel',()=>{
  for(const state of [
    {vx:230,time:.12,offset:-9},
    {dir:-1,melee:{phase:'recovery'},offset:9},
    {dir:-1,melee:{phase:'impact'},offset:-9},
  ]){
    const p={...base,...state,tilt:.16,supportPose:{heave:0,contacts:['front','rear-near','rear-far'].map(id=>({id,offset:state.offset,grounded:false}))}};
    const geo=tachikomaGeometry(p,state.time||0),c=canvasRecorder();
    drawTachikoma(c,{...images,'saltik-melee':sheet},p,state.time||0);
    assert.equal(c.calls.length,7,'three disjoint strut/wheel pairs plus the clipped cabin');
    for(const [i,part] of geo.distalParts.entries()){
      const {matrix:[a,b,cc,d,e,f]}=c.calls[i*2+1];
      close(Math.hypot(a,b),1,'rigid tire horizontal basis');close(Math.hypot(cc,d),1,'rigid tire vertical basis');
      assert.ok(part.stretch>=.05,'compressed upper strut never inverts');
      const xx=(part.foot[0]-geo.feet[0])*geo.k,yy=(part.foot[1]-geo.feet[1])*geo.k;
      close(a*xx+cc*yy+e,part.contact.x,'rigid tire foot x');close(b*xx+d*yy+f,part.contact.y,'rigid tire foot y');
      close(part.hinge+(part.wheelTop-part.hinge)*part.stretch,part.wheelTop+part.offset,'strut meets rigid wheel without a gap');
      const upper=c.calls[i*2].matrix,seam=part.wheelPolygon.find(point=>Math.abs(point[1]-part.wheelTop)<1e-8);
      close(upper[0]*seam[0]+upper[2]*seam[1]+upper[4],a*seam[0]+cc*seam[1]+e,'drawn split seam x');
      close(upper[1]*seam[0]+upper[3]*seam[1]+upper[5],b*seam[0]+d*seam[1]+f,'drawn split seam y');
      const area=points=>Math.abs(points.reduce((sum,p,j)=>{const q=points[(j+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;
      close(area(part.polygon),area(part.strutPolygon)+area(part.wheelPolygon),'source partitions have no duplicated area');
      for(const [points,matrix] of [[part.strutPolygon,upper],[part.wheelPolygon,[a,b,cc,d,e,f]]])for(const point of points){
        const px=matrix[0]*point[0]+matrix[2]*point[1]+matrix[4],py=matrix[1]*point[0]+matrix[3]*point[1]+matrix[5];
        assert.ok(px>=geo.bounds.x-1e-8&&px<=geo.bounds.x+geo.bounds.w+1e-8&&py>=geo.bounds.y-1e-8&&py<=geo.bounds.y+geo.bounds.h+1e-8,'bounds contain both actual piecewise native draws');
      }
    }
  }
});

test('raised cannon clips its original painted barrel from the body and rotates only those same native pixels',()=>{
  for(const dir of [-1,1]){
    const p={...base,dir,cannonElevation:Math.atan2(600,325),mirvFlash:.1},c=canvasRecorder(),geo=tachikomaGeometry(p,0);
    drawTachikoma(c,images,p,0);
    assert.equal(c.calls.length,2,'one masked body and one isolated existing barrel');
    assert.equal(c.calls[0].args[0],sheet);assert.equal(c.calls[1].args[0],sheet);assert.deepEqual(c.clips,['evenodd',undefined]);
    assert.equal(c.rects.length,0);assert.ok(c.translations.some(at=>Math.hypot(at.x-geo.cannon.x,at.y-geo.cannon.y)<1e-8));
    const {matrix:[a,b,cc,d,e,f]}=c.calls[1],aperture=[(geo.measurement.main[0]-geo.feet[0])*geo.k,(geo.measurement.main[1]-geo.feet[1])*geo.k];
    close(a*aperture[0]+cc*aperture[1]+e,geo.cannon.x,'rotated native aperture x');close(b*aperture[0]+d*aperture[1]+f,geo.cannon.y,'rotated native aperture y');
  }
});

test('one native rear stance and the separate manual hand draw one body without stale weapon flashes',()=>{
  const dodgeSheet={width:1536,height:1024},handSheet={width:1254,height:1254};
  for(const [kind,elapsed,frame] of [['tilt',0,0],['tilt',.5,0],['tilt',10,0],...[0,1,2,3].map(frame=>['deflect',[DEFLECT_MOVE.frames[0]/2,DEFLECT_MOVE.frames[0]+.01,DEFLECT_MOVE.frames[1]+.01,DEFLECT_MOVE.frames[2]+.01][frame],frame])]){
    const manual=kind==='deflect';
    const p={...base,[manual?'deflect':'evasion']:manual?{active:true,kind,duration:DEFLECT_MOVE.duration,elapsed}:heldDodge(elapsed),muzzle:.1,mirvFlash:.1,homingFlash:.1,supportPose:{heave:4,contacts:[]}},c=canvasRecorder();
    drawTachikoma(c,{...images,'saltik-evasion':handSheet,'saltik-dodge':dodgeSheet},p,0);
    const pain=manual&&frame===2;assert.equal(c.calls.length,pain?2:1);assert.equal(c.calls[0].args[0],manual?handSheet:dodgeSheet);assert.equal(c.paths.length,pain?2:0);assert.equal(c.rects.length,0);
  }
});

test('MIRV flash uses the same raised aperture and unit axis as the carrier launch in either facing',()=>{
  for(const dir of [-1,1])for(const crouching of [false,true]){
    const p={...base,dir,crouching,cannonElevation:Math.atan2(600,325),tilt:.17,mirvFlash:.1},c=canvasRecorder(),geo=tachikomaGeometry(p,0);
    drawTachikoma(c,images,p,0);const [a,b,,,x,y]=c.paths.at(-2);
    close(x,geo.cannon.x,'flash aperture x');close(y,geo.cannon.y,'flash aperture y');close(a,geo.cannonDirection.x,'flash axis x');close(b,geo.cannonDirection.y,'flash axis y');
  }
});

test('the sore-arm shake partitions one native forearm and hand while the body, eyes, legs and weapon mounts stay steady',()=>{
  const evasionSheet={width:1254,height:1254},supplied={...images,'saltik-evasion':evasionSheet};
  const inside=(point,polygon)=>{const [x,y]=point;let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
  for(const dir of [-1,1]){
    const records=[.31,.37].map(elapsed=>{const p={...base,dir,tilt:.13,deflect:{active:true,elapsed,duration:.78}},c=canvasRecorder(),geo=tachikomaGeometry(p,0);drawTachikoma(c,supplied,p,0);return {c,geo};});
    for(const {c,geo} of records){
      assert.equal(c.calls.length,2,'one masked body plus exactly one existing native hand patch');assert.deepEqual(c.clips,['evenodd',undefined]);
      assert.equal(c.calls[0].args[0],evasionSheet);assert.deepEqual(c.calls[0].args,c.calls[1].args,'both partitions reuse the same source crop');
      assert.deepEqual(c.clipPaths[0].slice(5),c.clipPaths[1],'the body excludes exactly the source pixels reused by the hand patch');
      const hand=geo.handPart;assert.ok(hand);assert.deepEqual(hand.sourcePivot,[724,847]);
      for(const point of [[748,853],[790,853],[677,923],[849,924],[926,916],[693,881],[773,909],[710,733]])assert.equal(inside(point,hand.sourcePolygon),false,`fixed native pixel ${point} stays outside the arm patch`);
      assert.equal(inside([691,835],hand.sourcePolygon),true,'the original sore hand belongs to the isolated patch');
      const {matrix:[a,b,cc,d,e,f]}=c.calls[1],[x,y]=hand.pivot,pivot=geo.spritePoint(hand.sourcePivot);
      close(a*x+cc*y+e,pivot.x,'steady elbow x');close(b*x+d*y+f,pivot.y,'steady elbow y');
      assert.equal(c.rects.length,0,'no replacement hand or body geometry');
    }
    const [a,b]=records;assert.deepEqual(a.c.calls[0].matrix,b.c.calls[0].matrix,'all body pixels retain the same draw transform');
    assert.notDeepEqual(a.c.calls[1].matrix,b.c.calls[1].matrix,'only the native hand patch oscillates');
    assert.deepEqual(a.geo.arm,b.geo.arm);assert.deepEqual(a.geo.cannon,b.geo.cannon);assert.deepEqual(a.geo.tubes,b.geo.tubes);assert.deepEqual(a.geo.bounds,b.geo.bounds);
  }
});

test('the actual drawn inner-wheel contact stays on the floor while native rear tilt contracts around it',()=>{
  const dodgeSheet={width:1536,height:1024};
  for(const dir of [-1,1])for(const slope of [-.18,0,.18])for(const elapsed of [0,.25,1.65,10]){
    const floor=x=>base.y+(x-base.x)*slope;
    const p={...base,dir,evasion:heldDodge(elapsed)};
    p.supportPose=computeSupportPose(p,floor);p.tilt=p.supportPose.tilt;
    const geo=tachikomaGeometry(p,0),c=canvasRecorder();
    drawTachikoma(c,{...images,'saltik-dodge':dodgeSheet},p,0);
    assert.equal(c.calls.length,1);assert.equal(c.calls[0].args[0],dodgeSheet);assert.equal(geo.depthScale,.92);
    assert.deepEqual(geo.measurement.supportPivot,geo.frame===1?[735,473]:[1106,473]);
    const [sx,sy]=geo.measurement.supportPivot,xx=(sx-geo.feet[0])*geo.k,yy=(sy-geo.feet[1])*geo.k;
    const {matrix:[a,b,cc,d,e,f]}=c.calls[0],contact=geo.spritePoint([sx,sy]);
    close(a*xx+cc*yy+e,contact.x,'native support x');close(b*xx+d*yy+f,floor(contact.x),'native wheel pixel remains on physical support');close(contact.y,floor(contact.x),'geometry and drawing share grounded wheel');
  }
});
