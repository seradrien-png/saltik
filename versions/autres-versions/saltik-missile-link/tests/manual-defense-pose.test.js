import test from 'node:test';
import assert from 'node:assert/strict';
import {tachikomaGeometry} from '../src/tachikoma-pose.js';
import {createDeflectState,createEvasionState,beginEvasion,advanceEvasion} from '../src/evasion.js';
const base={x:300,y:550,supportY:550,onGround:true,vx:0,vy:0,dir:1};
const hand=elapsed=>({...createDeflectState(),active:true,elapsed});
const dodge=elapsed=>{const state=createEvasionState();beginEvasion(state);advanceEvasion(state,elapsed);return state;};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} versus ${b}`);

test('only the separate manual state selects the original four hand cells and sore-arm partition',()=>{
  for(const [elapsed,frame] of [[.05,8],[.15,9],[.31,10],[.60,11]])for(const dir of [-1,1]){
    const p={...base,dir,deflect:hand(elapsed)},geo=tachikomaGeometry(p);
    assert.equal(geo.atlas,'saltik-evasion');assert.equal(geo.frame,frame);assert.equal(geo.weaponsLocked,true);assert.equal(geo.distalParts.length,0);
    assert.equal(!!geo.handPart,frame===10);assert.equal(geo.y,p.y);assert.equal(geo.bodyOffsetX,0);assert.equal(geo.depthScale,1);
  }
  assert.equal(tachikomaGeometry({...base,evasion:{kind:'deflect',active:true,elapsed:.31}}).atlas,'tachikoma');
});
test('manual parry does not displace or contract its native hand, body or apertures',()=>{
  const a=tachikomaGeometry({...base,deflect:hand(.31)}),b=tachikomaGeometry({...base,deflect:hand(.37)});
  assert.deepEqual(a.arm,b.arm);assert.deepEqual(a.cannon,b.cannon);assert.deepEqual(a.tubes,b.tubes);assert.deepEqual(a.bounds,b.bounds);
  close(a.handPart.pivot[0],b.handPart.pivot[0]);close(a.handPart.pivot[1],b.handPart.pivot[1]);assert.notEqual(a.handPart.rotation,b.handPart.rotation);
});
test('a held rear stance takes precedence over manual hand, contracts once and mirrors its local travel in either facing',()=>{
  for(const elapsed of [0,1,10]){
    const right=tachikomaGeometry({...base,evasion:dodge(elapsed),deflect:hand(.31)}),left=tachikomaGeometry({...base,dir:-1,evasion:dodge(elapsed),deflect:hand(.31)});
    assert.equal(right.atlas,'saltik-dodge');assert.equal(left.atlas,'saltik-dodge');assert.equal(right.depthScale,.92);assert.equal(right.rear,1);
    close(right.bodyOffsetX,-left.bodyOffsetX);close(right.k,left.k);assert.equal(right.handPart,null);assert.equal(right.y,550);assert.equal(left.y,550);
  }
});

test('tilt balances around the measured inner-wheel contact for the entire hold',()=>{
  for(const dir of [-1,1])for(const elapsed of [0,.25,1.65,10]){
    const geo=tachikomaGeometry({...base,dir,evasion:dodge(elapsed)}),pivot=geo.measurement.supportPivot;
    assert.ok(Array.isArray(pivot),'native inner-wheel contact is measured');const contact=geo.spritePoint(pivot);
    close(contact.y,base.y);assert.equal(geo.heave,0,'inner support stays planted throughout rear protection');close(contact.x,base.x+geo.bodyOffsetX+geo.mirror*geo.bodyPivot[0]);
  }
});
