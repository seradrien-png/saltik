import test from 'node:test';
import assert from 'node:assert/strict';
import {drawBossTank} from '../src/boss-tank-art.js';
import {bossGeometry} from '../src/boss-tank.js';

function canvas(){
  const draws=[],scales=[],dashes=[],ellipses=[];
  const c=new Proxy({draws,scales,dashes,ellipses,globalAlpha:1,
    drawImage(...args){draws.push(args);},scale(...args){scales.push(args);},setLineDash(v){dashes.push(v);},ellipse(...args){ellipses.push(args);},
    createLinearGradient(){return{addColorStop(){}};},
  },{get:(target,key)=>key in target?target[key]:()=>{}});
  return c;
}
const boss={x:17300,y:600,hp:200,maxHp:200,weaponPhase:'pod-wait',weaponElapsed:0,chargePhase:'idle',chargeProgress:0,turretSpin:0,hit:0};

test('native cannon warns near its scheduled volley but stays quiet through the pod cycle',()=>{
  const image={width:1817,height:866};
  const warning=b=>{const c=canvas();drawBossTank(c,{boss:image},b,{camera:17000,time:1});return c.dashes.some(d=>d.length>0);};
  assert.equal(warning({...boss,weaponPhase:'pod-wait',weaponElapsed:1.95}),false);
  assert.equal(warning({...boss,weaponPhase:'pod-raising',weaponElapsed:.70,podPhase:'raising',podRaise:.97}),false);
  assert.equal(warning({...boss,weaponPhase:'after-pod',weaponElapsed:3.7}),false);
  assert.equal(warning({...boss,weaponPhase:'after-pod',weaponElapsed:4.2}),true);
  assert.equal(warning({...boss,weaponPhase:'after-cannon',weaponElapsed:7.4}),false);
  assert.equal(warning({...boss,podDestroyed:true,weaponPhase:'after-pod',weaponElapsed:4.2}),false);
  assert.equal(warning({...boss,podDestroyed:true,weaponPhase:'fallback',weaponElapsed:4.7}),true);
});

test('native hull stays on shared physical support while only the turret yaws around its pivot',()=>{
  const image={width:1817,height:866},c=canvas(),b={...boss,turretSpin:1.05};
  assert.equal(drawBossTank(c,{boss:image},b,{camera:17000,time:2}),true);
  assert.equal(c.draws.length,2);
  const [hull,turret]=c.draws;
  assert.deepEqual(hull.slice(1,5),[0,480,1817,386]);
  assert.deepEqual(turret.slice(1,5),[0,0,1817,480]);
  assert.equal(hull[5],bossGeometry(b).sprite.x-17000);
  assert.equal(hull[6],bossGeometry(b).sprite.y+480*176/866);
  assert.ok(c.scales.some(([x,y])=>Math.abs(x-Math.cos(1.05))<1e-8&&y===1));
  assert.ok(!c.scales.some(([,y])=>y!==1),'the whole tank never spins or changes roof height');
});

test('charge gives a separate ground warning, then tread dust only during translation',()=>{
  const image={width:1817,height:866},c=canvas(),b={...boss,chargePhase:'telegraph',chargeTargetX:16700,chargeProgress:0};
  drawBossTank(c,{boss:image},b,{camera:16600,time:1});
  assert.ok(c.dashes.some(d=>d.length>0),'a charge path warns in front of the physical nose');
  const ordinary=canvas();drawBossTank(ordinary,{boss:image},boss,{camera:16600,time:1});
  const moving=canvas();drawBossTank(moving,{boss:image},{...boss,chargePhase:'charge',chargeProgress:.5,dx:-22},{camera:16600,time:1});
  assert.ok(moving.ellipses.length>ordinary.ellipses.length,'moving treads shed dust behind the chassis');
});

test('cannon recoil moves only native barrel pixels while keeping turret body and tracks planted',()=>{
  const image={width:1817,height:866},rest=canvas(),kick=canvas();
  drawBossTank(rest,{boss:image},boss,{camera:17000});
  drawBossTank(kick,{boss:image},{...boss,cannonRecoil:1},{camera:17000});
  assert.equal(rest.draws.length,2);
  assert.ok(kick.draws.length>2,'recoil splits out the two native barrels');
  assert.deepEqual(kick.draws[0],rest.draws[0],'track and hull image box is unchanged');
  assert.ok(kick.draws.some(d=>d[1]===0&&d[2]>0&&d[3]<650&&d[5]>rest.draws[1][5]),'barrel crop retracts toward turret');
  assert.ok(kick.draws.some(d=>d[1]>550&&d[2]<480),'the turret body remains a separate fixed source crop');
});
