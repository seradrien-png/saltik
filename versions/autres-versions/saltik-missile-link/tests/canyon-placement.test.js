import test from 'node:test';
import assert from 'node:assert/strict';
import {canyonProjection,alliedBackgroundPoint,ALLY_ROCK_ANCHOR} from '../src/canyon-placement.js';
import {batterySpriteSize} from '../src/missile-link-art.js';
import {PARALLAX_LAYERS,createGame} from '../src/engine.js';
import {tachikomaGeometry} from '../src/tachikoma-pose.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('the allied support shares the canyon pixel transform across pan, elevation and resize',()=>{
 for(const w of [880,1108,1349,1800])for(const x of [0,8400,10000,16000])for(const y of [-210,0,130]){
  const v={x,y,w,h:623},p=alliedBackgroundPoint(v),bg=canyonProjection(x,w);
  close((p.x-x-bg.offset)/bg.scaleX,ALLY_ROCK_ANCHOR.x);
  close((p.y-y)/bg.scaleY,ALLY_ROCK_ANCHOR.y);
  assert.ok(p.height>33&&p.height<35);assert.equal(bg.speed,PARALLAX_LAYERS[0].speed);
 }
});
test('horizontal motion is exactly the painted-background parallax, with no camera following',()=>{
 const a=alliedBackgroundPoint({x:8000,y:100,w:1349}),b=alliedBackgroundPoint({x:8500,y:100,w:1349});
 close((b.x-8500)-(a.x-8000),-500*.025);
 close(a.y,b.y);
});
test('intro and foreground battery native silhouettes match player standing height',()=>{
 const g=createGame(),p=tachikomaGeometry(g.player,0),height=g.player.y-p.top;
 assert.ok(height>=98&&height<=103);
 for(const [team,nativeHeight] of [['ally',488],['enemy',460]])close(batterySpriteSize(team)*nativeHeight/512,99);
});
