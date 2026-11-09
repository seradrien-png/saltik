import test from 'node:test';import assert from 'node:assert/strict';
const art=await import('../src/mirv-preview.js').catch(()=>({}));
function context(){const calls=[],c={calls,globalAlpha:1,save(){calls.push(['save']);},restore(){calls.push(['restore']);}};Object.defineProperty(c,'lineWidth',{set(v){calls.push(['lineWidth',v]);}});Object.defineProperty(c,'strokeStyle',{set(v){calls.push(['strokeStyle',v]);}});return new Proxy(c,{get:(o,k)=>k in o?o[k]:(...args)=>{calls.push([k,...args]);}});}
const prediction={muzzle:{x:120,y:400},points:[{x:120,y:400},{x:250,y:240},{x:450,y:320}],branches:[],impacts:[{x:400,y:600},{x:450,y:610},{x:500,y:600}],zone:{x:450,y:605,radius:147.5,minX:400,maxX:500,minY:600,maxY:610}};
const game=()=>({time:1,status:'playing',player:{x:100,y:600,dir:1,mirvAiming:false,cannonElevation:.6}});
test('MIRV scope never predicts or draws while idle and cancels immediately',()=>{
 assert.equal(typeof art.createMirvPreview,'function');let count=0;const overlay=art.createMirvPreview({predict:()=>{count++;return prediction;}}),g=game(),c=context();overlay.draw(c,g,{camera:0,width:1000,height:720});assert.equal(count,0);assert.equal(c.calls.length,0);
 g.player.mirvAiming=true;overlay.draw(c,g,{camera:0,width:1000,height:720});assert.equal(count,1);g.player.mirvAiming=false;const before=c.calls.length;overlay.draw(c,g,{camera:0,width:1000,height:720});assert.equal(c.calls.length,before);
});
test('scope displays actual world impacts at their sampled floor and bounds prediction work',()=>{
 assert.equal(typeof art.createMirvPreview,'function');let count=0;const overlay=art.createMirvPreview({predict:()=>{count++;return prediction;}}),g=game(),c=context();g.player.mirvAiming=true;
 for(let i=0;i<60;i++){g.time=1+i/60;overlay.draw(c,g,{camera:100,width:900,height:720});}
 assert.ok(count<=14&&count>=10,'prediction must stay below one quarter of frame rate');
 assert.ok(c.calls.some(([fn,x,y])=>fn==='ellipse'&&Math.abs(x-350)<1&&Math.abs(y-610)<1),'a footprint sits on its actual sampled ground after camera projection');
 assert.equal(c.calls.filter(([fn])=>fn==='save').length,c.calls.filter(([fn])=>fn==='restore').length);
 const before=count;g.player.dir=-1;overlay.draw(c,g,{camera:100,width:900,height:720});assert.equal(count,before+1,'facing changes invalidate stale world shots');
});
test('off-screen impacts get a directional scope indicator instead of a false ground target',()=>{
 assert.equal(typeof art.createMirvPreview,'function');const far={...prediction,zone:{...prediction.zone,x:1800,minX:1750,maxX:1850}};const overlay=art.createMirvPreview({predict:()=>far}),g=game(),c=context();g.player.mirvAiming=true;const result=overlay.draw(c,g,{camera:0,cameraY:-100,width:900,height:500});assert.equal(result.offscreen,1);assert.ok(c.calls.some(([fn,text])=>fn==='fillText'&&text.includes('MIRV')));const label=c.calls.find(([fn])=>fn==='fillText');assert.ok(label[3]-100<180,'offscreen distance indicator stays above the right weapon controls');
});

test('scope keeps a bold red ink contour rather than a thin pastel target',()=>{
 assert.equal(typeof art.createMirvPreview,'function');const overlay=art.createMirvPreview({predict:()=>prediction}),g=game(),c=context();g.player.mirvAiming=true;overlay.draw(c,g,{camera:0,width:1000,height:720});
 assert.ok(c.calls.some(([key,v])=>key==='lineWidth'&&v>=6),'dark brush contour must stay strong at phone scale');
 assert.ok(c.calls.some(([key,v])=>key==='strokeStyle'&&v==='#e45f50'),'reticle uses visible saturated ink red');
});
