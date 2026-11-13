import test from 'node:test';
import assert from 'node:assert/strict';
import {menuPortraitPath,drawMenuPortrait} from '../src/menu-portraits.js';
test('loading menu selects the exact chassis, costume and level without a legacy fallback',()=>{
 for(const level of [1,2,3,4])for(const [character,skin]of [['striker','default'],['striker','dragon'],['gatling','default'],['gatling','limule'],['bt','default']]){
  assert.equal(menuPortraitPath({level,character,cosmeticSkin:skin}),`../menu/level${level}-${character}-${skin}.webp`);
 }
 assert.equal(menuPortraitPath({level:999,character:'other',cosmeticSkin:'limule'}),'../menu/level1-striker-default.webp');
});
test('an undecoded menu portrait draws no partial atlas',()=>{
 let draws=0;const before=globalThis.Image;class PendingImage{set src(v){this.url=v;}}globalThis.Image=PendingImage;
 try{assert.equal(drawMenuPortrait({drawImage(){draws++;}},{character:'gatling',cosmeticSkin:'limule'},{level:1,x:0,y:0,scale:1}),false);assert.equal(draws,0);}finally{if(before===undefined)delete globalThis.Image;else globalThis.Image=before;}
});
