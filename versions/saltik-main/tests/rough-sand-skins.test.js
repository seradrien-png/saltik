import test from 'node:test';
import assert from 'node:assert/strict';
import {redWastesGroundAt,RED_WASTES_SITES,structurePlacement} from '../src/red-wastes-layout.js';
import {createInkScene} from '../src/ink-scene.js';
import {sceneArtImages} from '../src/enemy-styles.js';
import {normalizeSkin} from '../src/player-skins.js';
import {menuPortraitPath} from '../src/menu-portraits.js';
test('open red sand has local relief at wheelbase scale, including the final stretch',()=>{
 for(const start of [600,2600,6900,11200,16300,20600]){
  let curvature=0,span=0;
  for(let x=start;x<start+500;x+=5){curvature=Math.max(curvature,Math.abs(redWastesGroundAt(x-45)+redWastesGroundAt(x+45)-2*redWastesGroundAt(x)));span=Math.max(span,Math.abs(redWastesGroundAt(x+80)-redWastesGroundAt(x)));}
  assert(curvature>5,`${start}: no wheel-scale bumps`);assert(span>9);
 }
 for(const site of RED_WASTES_SITES){const box=structurePlacement(site);assert.equal(redWastesGroundAt(site.x),box.foot);assert.equal(redWastesGroundAt(site.x+site.w),box.foot);}
});
test('all levels default to base chassis; military is explicit and available outside sand levels',()=>{
 for(const level of [1,2,3,4,5])for(const character of ['striker','gatling','bt']){
  const p=createInkScene({level,character}).player;assert.equal(p.strikerVariant,undefined);assert.equal(p.btVariant,undefined);
  if(character!=='bt')assert.equal(normalizeSkin(character,'military'),'military');
  const m=createInkScene({level,character,skin:'military'}).player;
  assert.equal(m.strikerVariant,character==='striker'?'desert':undefined);
 }
 assert.equal(normalizeSkin('gatling','limule'),'default');
});
test('live art and all native turn sheets select base, green Dragon or military independently of world',()=>{
 const images={};for(const key of ['modern-striker-1','modern-striker-turn-1','modern-striker-dragon-1','modern-striker-dragon-turn-1','desert-striker-body','desert-striker-turn','modern-gatling-1','modern-gatling-turn-1','modern-gatling-4','modern-gatling-turn-4','ink-enemy-saltik','bt-turn-1'])images[key]={key};
 for(const level of [1,2,3,4,5])for(const [char,skin,model,body,turn]of [
  ['striker','default','modern-striker','modern-striker-1','modern-striker-turn-1'],['striker','dragon','modern-striker','modern-striker-dragon-1','modern-striker-dragon-turn-1'],['striker','military','modern-striker','desert-striker-body','desert-striker-turn'],['gatling','default','modern-gatling','modern-gatling-1','modern-gatling-turn-1'],['gatling','military','modern-gatling','modern-gatling-4','modern-gatling-turn-4'],['bt','default',null,'ink-enemy-saltik','bt-turn-1']]){
  const a=sceneArtImages(images,level,char,skin,model);assert.equal(a['ink-saltik'],images[body],`${level}/${char}/${skin}`);assert.equal(a['ink-turn'],images[turn]);
 }
 assert.equal(menuPortraitPath({level:3,character:'striker'}),'../menu/level1-striker-default.webp');
 assert.equal(menuPortraitPath({level:2,character:'gatling',cosmeticSkin:'military'}),'../menu/level4-gatling-default.webp');
});

test('all base Saltiks visibly work their suspension over rough sand without slowing or artificial jumps',async()=>{
 const {update}=await import('../src/engine.js');const {inkSaltikGeometry}=await import('../src/ink-saltik.js');const {supportHeight}=await import('../src/world.js');
 for(const character of ['striker','gatling','bt']){
  const g=createInkScene({level:5,character});g.schedule=[];g.enemies=[];g.obstacles=[];g.pickups=[];
  const p=g.player;Object.assign(p,{x:600,y:g.groundAt(600),supportY:g.groundAt(600),onGround:true});let lo=Infinity,hi=-Infinity;
  for(let i=0;i<220;i++){
   update(g,{right:true},1/60);assert.equal(p.vx,230);assert(p.onGround);
   const q=inkSaltikGeometry(p,{time:g.time,sampleGround:x=>supportHeight(g,p,x)}),n=q.btNative??q,legs=q.modernLegs??q.nativeLegs??n.legs,k=q.nativeK??n.k;
   for(const l of legs){lo=Math.min(lo,l.offset*k);hi=Math.max(hi,l.offset*k);}
  }
  assert(hi-lo>9,`${character}: suspension travel ${hi-lo}`);
 }
});

test('rough sand painting overlaps neighboring slices to hide fractional-pixel hairlines',async()=>{
 const {drawRedWastesWorld}=await import('../src/red-wastes-world.js');let matrix=[1,0,0,1,0,0],stack=[];const spans=[],image={width:2172,height:724};
 const c={save(){stack.push([...matrix]);},restore(){matrix=stack.pop();},transform(...m){matrix=m;},translate(){},scale(){},drawImage(img,sx,sy,sw,sh,x,y,w,h){if(img!==image)return;const a=matrix[4]+matrix[0]*x,b=matrix[4]+matrix[0]*(x+w);spans.push([Math.min(a,b),Math.max(a,b)]);}};
 drawRedWastesWorld(c,{'red-wastes-sand-plane':image},{},{camera:500.35,width:1000,height:720});spans.sort((a,b)=>a[0]-b[0]);
 assert(spans.length>20);for(let i=1;i<spans.length;i++)assert(spans[i-1][1]-spans[i][0]>.5,'sand slices leave a visible seam');
});
