import test from 'node:test';
import assert from 'node:assert/strict';
import {bossGeometry} from '../src/boss-tank.js';
import {INK_BOSS_FRAME,INK_BOSS_PARTS,inkBossGeometry,inkBossPodGeometry,inkBreachVisual,drawInkBossTank} from '../src/ink-encounters.js';

const boss={x:17000,y:550,hp:200,maxHp:200,podRaise:0,podPhase:'stowed',cannonRecoil:0};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} differs from ${b}`);
function context(){
 const calls=[];return new Proxy({calls,globalAlpha:1,drawImage(...args){calls.push(args);}},{get:(target,key)=>key in target?target[key]:()=>{}});
}
const images={'ink-boss':{},'ink-boss-parts':{}};

test('pastel boss preserves the native hull envelope and the physical cannon mouths',()=>{
 assert.deepEqual(INK_BOSS_FRAME.crop,[30,50,1720,788]);
 close(INK_BOSS_FRAME.crop[2]*INK_BOSS_FRAME.scale,370);
 for(const breached of [false,true])for(const cannonRecoil of [0,.5,1])for(const turretSpin of [0,Math.PI/2,Math.PI]){
  const b={...boss,breached,cannonRecoil,turretSpin},g=inkBossGeometry(b,{camera:16000}),physical=bossGeometry(b);
  close(g.muzzle.x,physical.muzzle.x-16000);close(g.muzzle.y,physical.muzzle.y);
  const painted=g.barrelPoint([130,324]);close(painted.x,g.muzzle.x);close(painted.y,g.muzzle.y);
 }
});

test('closed cassette and closed hatch remain native flush armor without pasted extra parts',()=>{
 const c=context();drawInkBossTank(c,images,boss);
 assert.equal(c.calls.filter(call=>call[0]===images['ink-boss-parts']).length,0);
 assert.equal(inkBossPodGeometry(boss).visible,false);
});

test('a broad continuous sleeve holds the deploying cassette at the exact firing muzzle',()=>{
 for(const podRaise of [.01,.25,.5,1]){
  const b={...boss,podRaise,podPhase:podRaise===1?'firing':'raising'},g=inkBossPodGeometry(b,{camera:16000}),p=INK_BOSS_PARTS.launcher,physical=bossGeometry(b);
  close(g.displayMuzzle.x,physical.podMuzzle.x-16000);close(g.displayMuzzle.y,physical.podMuzzle.y);
  close(g.box.x+(p.mouth[0]-p.box[0])*g.k,g.displayMuzzle.x);
  close(g.box.y+(p.mouth[1]-p.box[1])*g.k,g.displayMuzzle.y);
  assert.ok(g.guide.w>g.box.w*.6,'the sliding armor is broad, rather than a narrow stalk');
  if(g.guide.h)assert.ok(g.guide.y<g.box.y+g.box.h&&g.guide.y+g.guide.h>g.box.y+g.box.h);
  else assert.ok(g.box.y+g.box.h>g.shoulder.y-25,'the cassette is still recessed in its native shoulder');
  assert.ok(g.visible);
 }
 const a=inkBossPodGeometry({...boss,podRaise:.1}),b=inkBossPodGeometry({...boss,podRaise:1});
 assert.deepEqual(a.shoulder,b.shoulder,'native shoulder pocket stays planted');
 assert.ok(b.guide.h<b.box.h*.6,'full deployment exposes only a short guide');
});

test('native open and torn hatch states follow the front sloping armor and preserve combat state',()=>{
 const c=context(),b={...boss},q={kind:'hull',phase:'qte',taps:1,effortsCompleted:0,effortElapsed:.16};
 const before=structuredClone({b,q}),hatch=inkBossGeometry(b).sourcePoint(INK_BOSS_PARTS.hatchSource),v=inkBreachVisual(q,b);
 close(v.hatch.x,hatch.x);close(v.hatch.y,hatch.y);
 drawInkBossTank(c,images,b,{breach:q});
 assert.ok(c.calls.some(call=>call[0]===images['ink-boss-parts']&&call[1]===INK_BOSS_PARTS.hatches[1].crop[0]));
 c.calls.length=0;drawInkBossTank(c,images,{...b,breached:true,podDestroyed:true,podPhase:'destroyed'});
 assert.ok(c.calls.some(call=>call[0]===images['ink-boss-parts']&&call[1]===INK_BOSS_PARTS.hatches[2].crop[0]));
 assert.ok(c.calls.some(call=>call[0]===images['ink-boss-parts']&&call[1]===INK_BOSS_PARTS.ruined.crop[0]));
 assert.deepEqual({b,q},before);
});
