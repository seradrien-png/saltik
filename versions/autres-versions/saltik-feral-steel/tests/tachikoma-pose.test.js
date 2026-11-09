import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update} from '../src/engine.js';
import * as pose from '../src/tachikoma-pose.js';
import {projectPlayer} from '../src/world.js';
import {computeSupportPose} from '../src/support-pose.js';
import {createEvasionState,beginEvasion,advanceEvasion} from '../src/evasion.js';
const {tachikomaGeometry}=pose;
const base={x:200,y:500,supportY:500,dir:1,onGround:true,vx:0,vy:0};
// SALTIK STRIKER acceptance: arm is the SMALL coax mouth beneath the
// LARGE turret cannon; the manipulator hands are unarmed. Replace numerical
// fixtures only after inspecting the new canonical action and direction sheets.
// Every crop must exclude adjacent actors; the three guided origins must be
// circular forward ports on two lateral box pods, with their real launch axes.
const close=(actual,want,message='point')=>assert.ok(Math.abs(actual-want)<1e-9,`${message}: ${actual} versus ${want}`);

test('held native rear wheel stays on the sampled slope in both facings without pose motion',()=>{
  for(const dir of [-1,1])for(const slope of [-.18,.18]){
    const floor=x=>500+(x-300)*slope,p={...base,x:300,y:500,dir};
    p.supportPose=computeSupportPose(p,floor);p.tilt=p.supportPose.tilt;
    const samples=[0,.2,.38,.63,.95,1.25,10].map(elapsed=>{const evasion=createEvasionState();beginEvasion(evasion);advanceEvasion(evasion,elapsed);return tachikomaGeometry({...p,evasion},0,{camera:37});});
    for(const g of samples){
      assert.equal(g.frame,1);assert.equal(g.atlas,'saltik-dodge');
      assert.deepEqual(g.measurement.supportPivot,[735,473]);
      const contact=g.spritePoint(g.measurement.supportPivot);
      close(contact.y,floor(contact.x+37),'painted far wheel on terrain');
    }
    for(const g of samples.slice(1)){
      close(g.tilt,samples[0].tilt,'held roll');close(g.heave,samples[0].heave,'held heave');
      assert.deepEqual(g.bounds,samples[0].bounds);
    }
  }
});

test('measured feet, small coax and large main mouths register correctly in either settled direction',()=>{
  const right=tachikomaGeometry(base,0),left=tachikomaGeometry({...base,dir:-1},0);
  assert.equal(right.frame,4);assert.equal(right.atlas,'tachikoma');
  close(right.arm.x,228.51791044776118);close(right.arm.y,427.89253731343285);close(right.cannon.x,239.74776119402986);close(right.cannon.y,416.9582089552239);
  close(left.arm.x,171.48208955223882);close(left.arm.y,427.89253731343285);close(left.cannon.x,160.25223880597014);close(left.cannon.y,416.9582089552239);
  close(right.k,.2955223880597015);assert.equal(pose.PLAYER_SCALE,1);assert.deepEqual(right.feet,[205.5,428]);
  assert.equal(right.mirror,-1);assert.equal(left.mirror,1);assert.ok(right.cannon.y<right.arm.y,'small coax is below the large main cannon');
});

test('native crouch and jump retain the real coax and main-cannon mouths above the unarmed hands',()=>{
  const crouch=tachikomaGeometry({...base,crouching:true},0),air=tachikomaGeometry({...base,onGround:false,vy:-300},0);
  assert.equal(crouch.frame,5);close(crouch.arm.x,227.9268656716418);close(crouch.arm.y,443.2597014925373);close(crouch.cannon.x,241.81641791044777);close(crouch.cannon.y,433.5074626865672);
  assert.equal(air.frame,6);close(air.arm.x,225.41492537313434);close(air.arm.y,429.66567164179105);close(air.cannon.x,238.7134328358209);close(air.cannon.y,419.02686567164176);
});

test('three guided mouths use circular forward cells in two lateral box pods',()=>{
  const g=tachikomaGeometry(base,0);assert.equal(g.cabinTubes.length,3);assert.equal(g.tubes.length,3);
  assert.deepEqual(g.cabinTubes.map(t=>t.pod),[0,0,1]);
  const expected=[[166.16268656716417,440.8955223880597],[159.66119402985075,447.6925373134328],[233.83731343283583,442.6686567164179]];
  g.tubes.forEach((mouth,i)=>{close(mouth.x,expected[i][0]);close(mouth.y,expected[i][1]);});
  for(const tube of g.cabinTubes)assert.ok(Math.hypot(tube.muzzle.x-tube.base.x,tube.muzzle.y-tube.base.y)>0);
});

test('jumping lateral-pod ports and the damaged main cannon remain on their visible openings',()=>{
  const jump=tachikomaGeometry({...base,onGround:false,vy:-200},0);
  for(const [i,want] of [[0,[164.83283582089553,442.6686567164179]],[1,[158.62686567164178,449.1701492537313]],[2,[234.57611940298506,444.4417910447761]]]){
    close(jump.tubes[i].x,want[0]);close(jump.tubes[i].y,want[1]);
  }
  const damage=tachikomaGeometry({...base,damagePose:true},0);
  close(damage.cannon.x,240.48656716417912);close(damage.cannon.y,416.36716417910446);
});

test('turn registration keeps all eight native perspectives planted at the standing height',()=>{
  for(let frame=0;frame<8;frame++){
    const g=tachikomaGeometry({...base,dir:-1,turn:{yaw:frame*Math.PI/4,active:true}},0);
    assert.equal(g.atlas,'tachikoma-turn');assert.equal(g.frame,frame);assert.equal(g.mirror,1);
    const feet=g.spritePoint(g.feet);close(feet.x,200);close(feet.y,500);
    close(g.visibleHeight,99);assert.ok(g.bounds.h>=99&&g.bounds.h<101,'bounds include the antenna, turret and crop margins');
  }
});

test('physical feet and support preserve their world coordinates during a jump',()=>{
  for(const depth of [0,.2,.7,1])for(const dir of [-1,1]){
    const p={...base,dir,depth,y:420,onGround:false,vy:-200},g=tachikomaGeometry(p,0,{camera:37}),projected=projectPlayer(p);
    close(g.x,163);close(g.y,420);close(g.groundY-g.y,80);close(g.groundY,projected.groundY);
    close(g.k,.2955223880597015);close(g.scale,1);const feet=g.spritePoint(g.feet);close(feet.x,g.x);close(feet.y,g.y);
  }
});

test('tilted mounts and body bounds share the exact drawing transform',()=>{
  const g=tachikomaGeometry({...base,tilt:Math.PI/2},0,{camera:20});
  close(g.arm.x,252.10746268656715);close(g.arm.y,528.5179104477612);close(g.cannon.x,263.0417910447761);close(g.cannon.y,539.7477611940299);
  close(g.top,g.bounds.y);close(g.height,g.bounds.h);assert.ok(g.bounds.w>98);
});

test('lateral pod cells launch forward horizontally in either settled facing instead of up the old roof-rack axis',()=>{
  for(const dir of [-1,1])for(const crouching of [false,true]){
    const g=tachikomaGeometry({...base,dir,crouching},0);
    for(const {base:back,muzzle} of g.cabinTubes){
      assert.ok((muzzle.x-back.x)*dir>3);close(muzzle.y-back.y,0,'forward box-cell axis');
    }
  }
});

test('combat launches every weapon from the shared measured mount in either settled stance',()=>{
  for(const dir of [-1,1])for(const crouch of [false,true]){
    const g=createGame();g.schedule=[];g.obstacles=[];g.platforms=[];g.player.x=800;g.player.dir=dir;g.player.turn=null;
    g.enemies=[{id:1,x:800+dir*400,y:400,type:'turret',hp:100,maxHp:100,phase:0,cooldown:99}];
    update(g,{crouch,fire:true,missile:true,homing:true},1/60);
    const geometry=tachikomaGeometry(g.player,g.time);
    for(const [kind,mounts] of [['bullet',[geometry.arm]],['homing',geometry.tubes]]){
      const shots=g.projectiles.filter(s=>s.kind===kind);assert.equal(shots.length,mounts.length);
      shots.forEach((shot,i)=>{close(shot.launchX,mounts[i].x);close(shot.launchY,mounts[i].y);
        if(kind==='homing'){assert.ok(shot.vx*dir>350,'guided launch starts forward');assert.ok(Math.abs(shot.vy)<100,'forward box ports retain a nearly horizontal initial trajectory');}
      });
    }
    for(let i=0;i<14;i++)update(g,{crouch},1/60);
    const launchGeometry=tachikomaGeometry(g.player,g.time),carrier=g.projectiles.find(s=>s.kind==='mirv');assert.ok(carrier);
    close(carrier.launchX,launchGeometry.cannon.x);close(carrier.launchY,launchGeometry.cannon.y);
    close(carrier.vx,launchGeometry.cannonDirection.x*Math.hypot(325,600));
    close(carrier.vy-125/60,launchGeometry.cannonDirection.y*Math.hypot(325,600));
  }
});

test('a hit selects the native damage cell then returns to idle during the remaining invulnerability',()=>{
  const g=createGame();g.schedule=[];g.obstacles=[];
  g.projectiles=[{x:g.player.x-100,y:g.player.y-30,vx:12000,vy:0,team:'enemy',damage:8,life:1,radius:2}];
  update(g,{},1/60);assert.equal(g.player.hp,92);assert.equal(tachikomaGeometry(g.player,g.time).frame,7);
  update(g,{},1/60);update(g,{},1/60);assert.equal(tachikomaGeometry(g.player,g.time).frame,7);
  for(let i=0;i<6;i++)update(g,{},1/60);
  assert.ok(g.player.invulnerable>1);assert.equal(tachikomaGeometry(g.player,g.time).frame,4);
});
