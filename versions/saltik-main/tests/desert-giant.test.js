import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceDesertGiant,desertGiantPose,drawDesertGiant} from '../src/desert-giant.js';
const game=()=>({level:4,status:'playing',player:{x:2799},desert:{phase:'outbound'}});
test('giant passage triggers once outbound, freezes on pause, and never restarts on return',()=>{
 const g=game();advanceDesertGiant(g,1/60);assert.equal(g.desert.giant.triggered,false);
 g.player.x=2800;advanceDesertGiant(g,1/60);assert.equal(g.desert.giant.triggered,true);
 const time=g.desert.giant.elapsed;g.status='paused';advanceDesertGiant(g,2);assert.equal(g.desert.giant.elapsed,time);
 g.status='playing';for(let i=0;i<480;i++)advanceDesertGiant(g,1/60);
 assert.equal(g.desert.giant.complete,true);assert.equal(g.desert.giant.elapsed,8);
 g.desert.phase='return';advanceDesertGiant(g,2);assert.equal(g.desert.giant.elapsed,8);
 const restarted=game();advanceDesertGiant(restarted,1/60);assert.equal(restarted.desert.giant.triggered,false);
});
test('outbound simulation clock is deterministic and preserved through interior visit',()=>{
 const a=game(),b=game();a.player.x=b.player.x=2800;
 for(let i=0;i<120;i++)advanceDesertGiant(a,1/60);for(let i=0;i<60;i++)advanceDesertGiant(b,1/30);
 assert.ok(Math.abs(a.desert.giant.elapsed-b.desert.giant.elapsed)<1e-10);
 a.desert.phase='interior';const saved={...a.desert.giant};advanceDesertGiant(a,2);assert.deepEqual(a.desert.giant,saved);
 for(const dt of [0,-1,NaN,Infinity])advanceDesertGiant(b,dt);assert.ok(Number.isFinite(b.desert.giant.elapsed));
});
test('stance locks contact, swing lifts and lands with alternating leg phases',()=>{
 const b={x:10,y:20,w:1000,h:500};const p=t=>desertGiantPose(t,b);
 assert.equal(p(.1)[0].x,p(.9)[0].x);assert.equal(p(.1)[0].lift,0);
 assert.ok(p(1.8)[0].lift>0);assert.equal(p(2.4)[0].lift,0);
 assert.equal(p(.6)[0].lift,0);assert.ok(p(.6)[1].lift>0);
 assert.ok(Math.abs(p(2.4-1e-5)[0].x-p(2.4)[0].x)<.001);
 assert.equal(p(.6)[0].groundY,430);assert.equal(p(.6)[0].shinHeight,1500);
});
test('renderer clips panorama and draws only separate foot and long lower-shin atlas regions',()=>{
 const g=game();g.player.x=2800;advanceDesertGiant(g,.6);
 const calls=[];const c=new Proxy({},{get:(_,key)=> (...args)=>calls.push([key,...args]),set:()=>true});
 drawDesertGiant(c,{},g,{box:{x:0,y:0,w:1000,h:500},time:100});
 assert.ok(calls.some(a=>a[0]==='clip'));const paints=calls.filter(a=>a[0]==='drawImage');assert.equal(paints.length,4);
 assert.equal(paints.filter(a=>a[2]===145).length,2);assert.equal(paints.filter(a=>a[2]===520).length,2);
 // The concave lower shin must overlap inside the ankle socket instead of
 // ending above its rim; the foot is painted afterward to occlude the join.
 for(let i=0;i<paints.length;i+=2){const shin=paints[i],foot=paints[i+1],scale=foot[8]/734;assert.ok(shin[7]+shin[9]>=60*scale);assert.equal(foot[2],520);}
 const a=JSON.stringify(calls);calls.length=0;drawDesertGiant(c,{},g,{box:{x:0,y:0,w:1000,h:500},time:200});assert.equal(JSON.stringify(calls),a);
});
