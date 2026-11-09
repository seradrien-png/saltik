import test from 'node:test';
import assert from 'node:assert/strict';
import {drawInkGround,drawInkRoutes,drawInkObstacles,drawInkForeground,setInkTerrainTexture,setInkLandmarkArt} from '../src/ink-world.js';
import {inkLandmark,inkLandmarkVault,paintInkVoussoirs} from '../src/ink-landmarks.js';
import {createRoutes,createObstacles,terrainHeight,surfaceHeight,routeThickness} from '../src/world.js';

// Recording actual Canvas commands checks the contract between rendering and
// physics without a browser, a DOM, or a second copy of the contour formulas.
function recordingContext(){
  let transform=[0,0],path=[],stack=[];const strokes=[],fills=[],images=[];
  const c=new Proxy({lineWidth:1,globalAlpha:1,
    save(){stack.push({transform:[...transform],lineWidth:this.lineWidth,fillStyle:this.fillStyle,strokeStyle:this.strokeStyle,globalAlpha:this.globalAlpha});},
    restore(){assert.ok(stack.length,'balanced canvas state');const s=stack.pop();transform=s.transform;Object.assign(this,s);},
    translate(x,y){transform[0]+=x;transform[1]+=y;},
    beginPath(){path=[];},
    moveTo(x,y){path.push([x+transform[0],y+transform[1]]);},
    lineTo(x,y){path.push([x+transform[0],y+transform[1]]);},
    stroke(){strokes.push({points:path.map(p=>[...p]),width:this.lineWidth,color:this.strokeStyle});},
    fill(rule){fills.push({points:path.map(p=>[...p]),rule,color:this.fillStyle});},
    drawImage(image,x,y,w,h){images.push({image,x:x+transform[0],y:y+transform[1],w,h,alpha:this.globalAlpha});},
  },{get(target,key){return key in target?target[key]:()=>{};}});
  return {c,strokes,fills,images,get depth(){return stack.length;}};
}
const near=(a,b)=>Math.abs(a-b)<1e-7;

test('ink ground caps stay registered to terrain while the camera moves',()=>{
  for(const camera of [0,591,13455]){
    const ctx=recordingContext();drawInkGround(ctx.c,{}, {camera,width:880,height:780});
    const caps=ctx.strokes.filter(s=>s.width===2.5);
    assert.ok(caps.length>=2);
    for(const cap of caps)for(const [x,y] of cap.points)assert.ok(near(y,terrainHeight(x+camera)));
    assert.ok(ctx.fills.some(fill=>fill.points.some(([,y])=>y>=960)),'soil continues below the viewport');
    assert.equal(ctx.depth,0);
  }
});

test('every elevated ink lip and underside uses the actual authored solid geometry',()=>{
  const platforms=createRoutes();
  for(const p of platforms){
    const ctx=recordingContext(),camera=p.x1-160;
    drawInkRoutes(ctx.c,{platforms:[p]},{camera,width:p.x2-p.x1+320});
    const cap=ctx.strokes.find(s=>s.width===2.5&&near(s.points[0]?.[0],p.x1-camera));
    assert.ok(cap,`${p.id} has a walking cap`);
    assert.ok(near(cap.points.at(-1)[0],p.x2-camera));
    for(const [x,y] of cap.points)assert.ok(near(y,surfaceHeight(p,x+camera)),`${p.id} cap matches physics`);
    const underside=ctx.strokes.find(s=>s.width===2.4&&s.points.length>8&&s.points.every(([x,y])=>
      x+camera>=p.x1&&x+camera<=p.x2&&near(y,surfaceHeight(p,x+camera)+routeThickness(p,x+camera))));
    assert.ok(underside,`${p.id} underside matches solid thickness`);
    assert.ok(ctx.fills.some(fill=>fill.rule==='evenodd'),'a bank contains a real open arch');
    assert.equal(ctx.depth,0);
  }
});

test('ink cover tops use their complete support width and destroyed/offscreen cover is omitted',()=>{
  const platforms=createRoutes(),obstacles=createObstacles(platforms);
  for(const type of ['rock','hull','barricade','checkpoint']){
    const o=obstacles.find(o=>o.type===type);assert.ok(o,type);
    const ctx=recordingContext(),camera=o.x-120;
    drawInkObstacles(ctx.c,{obstacles:[o]},{camera,width:240});
    const top=ctx.strokes.find(s=>s.width===2.3&&s.points.length===2);
    assert.deepEqual(top.points,[[o.x-o.w/2-camera,o.y-o.h],[o.x+o.w/2-camera,o.y-o.h]]);
    assert.equal(ctx.depth,0);
  }
  const ctx=recordingContext();
  drawInkObstacles(ctx.c,{obstacles:[{...obstacles[0],hp:0},{...obstacles[0],x:8000}]},{camera:0,width:800});
  assert.equal(ctx.strokes.length,0);
});

test('uncached ink detail is deterministic and bounded for a mobile viewport',()=>{
  const platforms=createRoutes(),g={platforms,obstacles:createObstacles(platforms),player:{x:1000,y:terrainHeight(1000)}};
  function frame(){
    const ctx=recordingContext(),opts={camera:900,width:900,height:720,time:0};
    drawInkGround(ctx.c,g,opts);drawInkRoutes(ctx.c,g,opts);drawInkObstacles(ctx.c,g,opts);drawInkForeground(ctx.c,g,opts);
    assert.equal(ctx.depth,0);return ctx.strokes;
  }
  const first=frame(),second=frame();assert.deepEqual(first,second);
  assert.ok(first.length<1000,`uncached frame uses ${first.length} grouped strokes`);
  for(const stroke of first)for(const point of stroke.points)assert.ok(point.every(Number.isFinite));
});

test('native rock texture keeps a fixed scale and world registration beneath ground and route contours',()=>{
  const image={width:1024,height:1024};setInkTerrainTexture(image);
  try{
    const route=createRoutes()[0];
    for(const camera of [333,817]){
      const ctx=recordingContext();
      drawInkGround(ctx.c,{}, {camera,width:800,height:720});
      drawInkRoutes(ctx.c,{platforms:[route]},{camera,width:1600});
      const images=ctx.images.filter(i=>i.image===image);assert.ok(images.length>0);
      for(const tile of images){
        assert.equal(tile.w,512);assert.equal(tile.h,512);
        assert.ok(near((tile.x+camera)/512,Math.round((tile.x+camera)/512)));
        assert.ok(near(tile.y/512,Math.round(tile.y/512)));
        assert.ok(tile.alpha>=.2&&tile.alpha<=.86,'native grain remains visible beneath authored landmark drawing');
      }
      assert.equal(ctx.depth,0);
    }
  }finally{setInkTerrainTexture(null);}
});

test('authored bridge and observatory vaults open at the complete physical underside',()=>{
  const routes=createRoutes();
  for(const p of routes.slice(0,2)){
    const vault=inkLandmarkVault(p);assert.ok(vault);
    assert.equal(vault.left,p.x1);assert.equal(vault.right,p.x2);
    for(let x=p.x1;x<=p.x2;x+=5){
      assert.ok(near(vault.top(x),surfaceHeight(p,x)+routeThickness(p,x)));
      assert.ok(near(vault.floor(x),terrainHeight(x)));
      assert.ok(vault.floor(x)-vault.top(x)>=110,'lower route retains a standing hull corridor');
    }
    const ctx=recordingContext();paintInkVoussoirs(ctx.c,p);
    const ring=ctx.strokes.find(s=>s.width===3.3);assert.ok(ring);
    for(const [x,y] of ring.points)assert.ok(near(y,surfaceHeight(p,x)+routeThickness(p,x)));
    assert.ok(ctx.fills.length>20,'vault has small individual stones');
    for(const block of ctx.fills)for(const [x,y] of block.points){
      assert.ok(Number.isFinite(x)&&Number.isFinite(y));
    }
  }
  assert.equal(new Set(routes.map(p=>inkLandmark(p)?.name)).size,routes.length,'each campaign support has a distinct native landmark');
});

test('native landmarks retain authored world registration across camera pans',()=>{
  const image={width:1536,height:1024},bounds={x:500,y:90,w:1520,h:610};
  setInkLandmarkArt({bridge:{image,bounds,clip:'mass'}});
  try{
    for(const camera of [0,650,1133]){
      const ctx=recordingContext();drawInkRoutes(ctx.c,{platforms:[createRoutes()[0]]},{camera,width:1280});
      const cutouts=ctx.images.filter(i=>i.image===image);assert.ok(cutouts.length>0);
      for(const native of cutouts)assert.deepEqual([native.x+camera,native.y,native.w,native.h],[bounds.x,bounds.y,bounds.w,bounds.h]);
      assert.equal(ctx.depth,0);
    }
  }finally{setInkLandmarkArt({});}
});

test('replacing a native landmark invalidates cached physical faces',()=>{
  const previous=globalThis.OffscreenCanvas;let serial=0;
  globalThis.OffscreenCanvas=class {
    constructor(w,h){this.width=w;this.height=h;this.id=++serial;this.context=recordingContext().c;}
    getContext(){return this.context;}
  };
  const g={platforms:[createRoutes()[0]]},opts={camera:600,width:700};
  try{
    setInkLandmarkArt({bridge:{width:1024,height:768}});
    const first=recordingContext();drawInkRoutes(first.c,g,opts);
    const warm=recordingContext();drawInkRoutes(warm.c,g,opts);
    assert.deepEqual(first.images.map(i=>i.image.id),warm.images.map(i=>i.image.id));
    setInkLandmarkArt({bridge:{width:1024,height:768}});
    const changed=recordingContext();drawInkRoutes(changed.c,g,opts);
    assert.notDeepEqual(first.images.map(i=>i.image.id),changed.images.map(i=>i.image.id));
  }finally{
    setInkLandmarkArt({});
    if(previous===undefined)delete globalThis.OffscreenCanvas;else globalThis.OffscreenCanvas=previous;
  }
});

test('changing the native texture invalidates cached terrain surfaces',()=>{
  const previous=globalThis.OffscreenCanvas;let created=0;
  globalThis.OffscreenCanvas=class {
    constructor(w,h){this.width=w;this.height=h;this.id=++created;this.context=recordingContext().c;}
    getContext(){return this.context;}
  };
  try{
    setInkTerrainTexture({width:1024,height:1024});
    const first=recordingContext();drawInkGround(first.c,{}, {camera:0,width:400,height:720});
    const warm=recordingContext();drawInkGround(warm.c,{}, {camera:0,width:400,height:720});
    assert.deepEqual(warm.images.map(i=>i.image.id),first.images.map(i=>i.image.id),'unchanged texture reuses the same surfaces');
    setInkTerrainTexture({width:1024,height:1024});
    const updated=recordingContext();drawInkGround(updated.c,{}, {camera:0,width:400,height:720});
    assert.notDeepEqual(updated.images.map(i=>i.image.id),first.images.map(i=>i.image.id),'new texture is painted into new surfaces');
  }finally{
    setInkTerrainTexture(null);
    if(previous===undefined)delete globalThis.OffscreenCanvas;else globalThis.OffscreenCanvas=previous;
  }
});

test('foreground plants stay identical when the Saltik moves behind them',()=>{
  const platforms=createRoutes(),opts={camera:400,width:1100,height:720,time:.7};
  const frames=[420,820,1500,90000].map(x=>{
    const ctx=recordingContext();
    drawInkForeground(ctx.c,{platforms,player:{x,y:terrainHeight(x)}},opts);
    assert.equal(ctx.depth,0);return {strokes:ctx.strokes,fills:ctx.fills};
  });
  assert.ok(frames[0].strokes.length>0);
  for(const frame of frames.slice(1))assert.deepEqual(frame,frames[0],'plants are fixed scenery and may occlude the player');
});
