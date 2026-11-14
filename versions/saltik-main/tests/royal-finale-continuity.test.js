import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoyalFinale,getRoyalFinalePose,advanceRoyalFinale,ROYAL_FINALE_TIMING} from '../src/royal-finale.js';

test('cinema inherits the live eel transform and joins the actual animated socket',()=>{
 const f=createRoyalFinale({x:17450,y:500});
 const options={startX:.35,startY:.74,aspect:16/9,eelStart:{x:.43,y:.47,scale:1.65,flip:-1},backSocket:{x:.58,y:.19}};
 const first=getRoyalFinalePose(f,options);
 assert.deepEqual(first.eel,{...options.eelStart});
 for(let t=0;t<ROYAL_FINALE_TIMING.total;t+=1/120){
  f.elapsed=t;const a=getRoyalFinalePose(f,options);f.elapsed=t+1/120;const b=getRoyalFinalePose(f,options);
  assert(Math.hypot(a.eel.x-b.eel.x,a.eel.y-b.eel.y)<.02,'eel never teleports');
  if(a.boarded)assert.deepEqual({x:a.player.x,y:a.player.y},a.rider);
 }
 f.elapsed=ROYAL_FINALE_TIMING.run+ROYAL_FINALE_TIMING.jump;
 const landed=getRoyalFinalePose(f,options);
 assert.equal(landed.player.x,landed.eel.x+(.5-options.backSocket.x)*landed.eel.scale);
 assert.equal(landed.player.y,landed.eel.y+(options.backSocket.y-.5)*landed.eel.scale*options.aspect/(1024/340));
 f.elapsed=ROYAL_FINALE_TIMING.total-1;
 assert(getRoyalFinalePose(f,options).pov>0.99,'forward ride is held before completion');
 assert(ROYAL_FINALE_TIMING.total<=10);
 assert(advanceRoyalFinale(f,2));
});

test('unboarded run and jump draw above world solids; boarded rider shares the eel depth plane',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../src/ink-renderer.js',import.meta.url),'utf8');
 const world=source.indexOf('if(g.level===4)drawDesertWorld');
 const foreground=source.indexOf('if(g.level===4)drawDesertForeground');
 const eelRider=source.indexOf('if(q.boarded)drawFinalePlayer()');
 const airborne=source.indexOf('if(finalePose&&!finalePose.boarded)');
 assert(eelRider>0&&eelRider<world,'only boarded rider renders with eel behind world');
 assert(airborne>world&&airborne<foreground,'run and jump stay above the solid world and below actual front rails');
});

test('visible ambient eel hands its actual drawing exposure and socket clock to the cinema',async()=>{
 const {captureRoyalFinaleEel}=await import('../src/ink-renderer.js');
 const {royalEelFrameAt,royalEelBackSocket}=await import('../src/royal-eel-frames.js');
 const {royalEelVisual}=await import('../src/royal-atmosphere.js');
 const atmosphere={active:1,age:8.39},time=123.71,width=1280,height=720;
 const ambient=royalEelVisual(atmosphere,{width,height});
 const handoff=captureRoyalFinaleEel(atmosphere,{width,height,time});
 const cinemaTime=time+handoff.eelTimeOffset;
 const before=royalEelFrameAt(ambient.age),after=royalEelFrameAt(cinemaTime);assert.equal(after.index,before.index);assert.equal(after.next,before.next);assert(Math.abs(after.mix-before.mix)<1e-10,'same exposure and dissolve at the branch');
 const image={swimFrames:Array.from({length:8},(_,i)=>({backSocket:{x:.58,y:.15+i*.01}}))};
 assert(Math.abs(royalEelBackSocket(image,cinemaTime).y-royalEelBackSocket(image,ambient.age).y)<1e-10);
 assert.equal(captureRoyalFinaleEel({active:-1},{width,height,time}).eelTimeOffset,0);
 const {readFile}=await import('node:fs/promises');const source=await readFile(new URL('../src/ink-renderer.js',import.meta.url),'utf8');
 assert.match(source,/royalEelBackSocket\(images\['royal-eel'\],eelTime\)/);
 assert.match(source,/flip:q.eel.flip,time:eelTime/,'sprite and socket must use the shared captured clock');
});
