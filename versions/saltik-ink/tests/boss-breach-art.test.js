import test from 'node:test';
import assert from 'node:assert/strict';
import {bossBreachVisual,drawBossBreach,drawBreachedTank} from '../src/boss-breach-art.js';

const boss={x:17520,y:560,hp:100,breached:true,turretSpin:0};
test('three complete effort strokes alternate native grips and strain before the hatch opens',()=>{
  for(let effort=0;effort<3;effort++){
    const q={phase:'qte',taps:3,effortsCompleted:effort,effortElapsed:0};
    assert.equal(bossBreachVisual(q,boss).frame,0);
    assert.equal(bossBreachVisual({...q,effortElapsed:.16},boss).frame,1);
    assert.equal(bossBreachVisual({...q,effortElapsed:.3199},boss).frame,0);
  }
  assert.equal(bossBreachVisual({phase:'tear'},boss).frame,2);
  assert.equal(bossBreachVisual({phase:'fire',elapsed:0},boss).frame,0);
});
test('paired grip and tear poses keep the tank tracks aligned, including a fatal assault',()=>{
  const c=new Proxy({globalAlpha:1,drawImage(...args){this.draws.push(args);},draws:[]},{get:(o,k)=>k in o?o[k]:()=>{}}),images={'boss-assault':{width:1536,height:1024}};
  for(const phase of ['qte','tear']){
    const v=bossBreachVisual({phase,taps:0,effortsCompleted:0},boss,{camera:17000});
    assert.equal(v.x,528);assert.equal(v.y,553);
    assert.equal(drawBossBreach(c,images,{phase}, {...boss,hp:0},{camera:17000}),true);
  }
  assert.equal(drawBossBreach(c,images,{phase:'leap'},boss),false);
  assert.equal(drawBossBreach(c,images,{phase:'eject'},boss),false,'physical jump renders separately from tank');
  assert.equal(c.draws.length,2);
});
test('hull-first paired poses paint the still-intact native pod',()=>{
  const draws=[],c=new Proxy({drawImage(...args){draws.push(args);}},{get:(o,k)=>k in o?o[k]:()=>{}});
  const images={'boss-assault':{},'boss-pod':{}};
  for(const phase of ['qte','tear']){
    draws.length=0;
    assert.equal(drawBossBreach(c,images,{kind:'hull',phase},{...boss,podDestroyed:false,podPhase:'stowed'}),true);
    assert.equal(draws.length,2);
    assert.equal(draws[0][0],images['boss-assault']);
    assert.equal(draws[1][0],images['boss-pod']);
  }
});
test('the native breached tank remains in the world and its cannon can push while its chassis stays planted',()=>{
  const draws=[],rotations=[],c=new Proxy({drawImage(...a){draws.push(a);},rotate(a){rotations.push(a);}},{get:(o,k)=>k in o?o[k]:()=>{}});
  assert.equal(drawBreachedTank(c,{'boss-assault':{}},boss,{breach:{phase:'eject',elapsed:.2}}),true);
  assert.equal(draws.length,2);assert.ok(rotations.some(a=>Math.abs(a)>.1));
  assert.equal(drawBreachedTank(c,{},boss),false);
});

test('grip and tear paint the whole tank but the 1.25-second fire sequence paints only Saltik',()=>{
  assert.equal(bossBreachVisual({kind:'hull',phase:'qte'},boss).paintsTank,true);
  assert.equal(bossBreachVisual({kind:'hull',phase:'tear'},boss).paintsTank,true);
  const early=bossBreachVisual({kind:'hull',phase:'fire',elapsed:.05,shotsFired:0},boss);
  const late=bossBreachVisual({kind:'hull',phase:'fire',elapsed:1.05,shotsFired:5},boss);
  assert.equal(early.paintsTank,false);
  assert.equal(early.sheet,'saltik-breach-fire');
  assert.notEqual(early.frame,late.frame,'the native burst advances through distinct firing poses');
});

test('pod assault paints an actor over the tank and does not duplicate the pod',()=>{
  const q={kind:'pod',phase:'qte',taps:1,effortsCompleted:0,effortElapsed:.16};
  const v=bossBreachVisual(q,boss);
  assert.equal(v.paintsTank,false);
  assert.equal(v.sheet,'boss-pod');
  assert.equal(v.frame,4);
  const c=new Proxy({draws:[],drawImage(...a){this.draws.push(a);}},{get:(o,k)=>k in o?o[k]:()=>{}});
  assert.equal(drawBossBreach(c,{'boss-pod':{}},q,boss),true);
  assert.equal(c.draws.length,1);
});

test('breached cannon recoils by cropping only the barrel area',()=>{
  const draws=[],c=new Proxy({drawImage(...a){draws.push(a);}},{get:(o,k)=>k in o?o[k]:()=>{}});
  assert.equal(drawBreachedTank(c,{'boss-assault':{}},{...boss,cannonRecoil:1}),true);
  assert.ok(draws.length>2);
  assert.ok(draws.some(d=>d[1]>=1024&&d[3]<260),'barrels are a native source crop');
});

test('each hull shot can paint a native impact on the exposed hole',()=>{
  const c=new Proxy({draws:[],drawImage(...a){this.draws.push(a);}},{get:(o,k)=>k in o?o[k]:()=>{}});
  const images={'boss-assault':{},'saltik-breach-fire':{}};
  drawBossBreach(c,images,{kind:'hull',phase:'fire',elapsed:.11,shotsFired:1},boss);
  assert.equal(c.draws.length,2,'Saltik and a native impact are both painted');
  assert.equal(c.draws[1][0],images['boss-assault']);
  c.draws.length=0;
  drawBossBreach(c,images,{kind:'hull',phase:'fire',elapsed:.18,shotsFired:1},boss);
  assert.equal(c.draws.length,1,'the impact clears between shots');
  c.draws.length=0;
  drawBossBreach(c,images,{kind:'hull',phase:'fire',elapsed:0,shotsFired:0},boss);
  assert.equal(c.draws.length,1,'the hole is quiet before the first shot');
});

test('six hull shot events alternate native flash and recovery poses',()=>{
  const fire=(shotsFired,elapsed)=>bossBreachVisual({kind:'hull',phase:'fire',shotsFired,elapsed},boss).frame;
  assert.equal(fire(0,.05),0);
  assert.equal(fire(1,.11),1);
  assert.equal(fire(1,.18),2);
  assert.equal(fire(2,.31),3);
  assert.equal(fire(2,.38),4);
  assert.equal(fire(3,.51),5);
  assert.equal(fire(3,.58),0);
  assert.equal(fire(4,.71),1);
});

test('the pod arrival shot flashes on the native grip pose briefly',()=>{
  const c=new Proxy({draws:[],drawImage(...a){this.draws.push(a);}},{get:(o,k)=>k in o?o[k]:()=>{}});
  const images={'boss-pod':{},'boss-assault':{}};
  drawBossBreach(c,images,{kind:'pod',phase:'qte',elapsed:.05},boss);
  assert.equal(c.draws.length,2);
  assert.equal(c.draws[1][0],images['boss-assault']);
  c.draws.length=0;
  drawBossBreach(c,images,{kind:'pod',phase:'qte',elapsed:.2},boss);
  assert.equal(c.draws.length,1);
});

test('pod pair crops include the complete overhanging pod without bleeding into the ruined socket',()=>{
  const grip=bossBreachVisual({kind:'pod',phase:'qte'},boss);
  const rip=bossBreachVisual({kind:'pod',phase:'tear'},boss);
  assert.deepEqual(grip.crop,[0,512,578,512]);
  assert.deepEqual(rip.crop,[580,512,532,512]);
  assert.ok(Math.abs(grip.x+(422-grip.anchor[0])*.25-(boss.x+95))<4);
  assert.ok(Math.abs(rip.x+(400-rip.anchor[0])*.25-(boss.x+95))<4);
});

test('the steep native firing muzzle reaches the hatch after Saltik braces',()=>{
  const first=bossBreachVisual({kind:'hull',phase:'fire',elapsed:0,shotsFired:0},boss);
  const firing=bossBreachVisual({kind:'hull',phase:'fire',elapsed:.11,shotsFired:1},boss);
  assert.equal(first.x,boss.x-85);
  assert.equal(firing.x,boss.x-50);
  assert.ok(firing.x+(150-firing.anchor[0])*.25>=boss.x-85,'native muzzle enters hole width');
  assert.ok(firing.x+(150-firing.anchor[0])*.25<=boss.x-33,'native muzzle stays inside hole width');
  assert.equal(firing.anchor[1],456,'wheels rest at the roof height in the flash cell');
});
