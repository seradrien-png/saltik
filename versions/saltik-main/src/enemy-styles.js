import {royalPlayerImages} from './royal-skin.js';
export const ENEMY_MATERIALS=Object.freeze([
 {name:'lunar-enemy-saltik',base:'ink-enemy-saltik',asset:'lunar-enemy-saltik-material'},
 {name:'royal-enemy-saltik',base:'ink-enemy-saltik',asset:'royal-enemy-saltik-material'},
 {name:'lunar-enemies',base:'ink-enemies',asset:'lunar-enemies-material'},
 {name:'royal-enemies',base:'ink-enemies',asset:'royal-enemies-material'},
 {name:'lunar-carrier',base:'ink-carrier',asset:'lunar-carrier-dressed-material'},
 {name:'royal-carrier',base:'ink-carrier',asset:'royal-carrier-material'},
]);
const sets={2:{'ink-enemies':'lunar-enemies','ink-enemy-saltik':'lunar-enemy-saltik','ink-carrier':'lunar-carrier'},3:{'ink-enemies':'royal-enemies','ink-enemy-saltik':'royal-enemy-saltik','ink-carrier':'royal-carrier'}};
export function sceneArtImages(images,level,character){
 let player=royalPlayerImages(images,level);const set=sets[level];
 if(character==='gatling')player={...player,'ink-saltik':images[level===2?'gatling-lunar':level===3?'gatling-velvet':'gatling-snow']??images['ink-saltik'],'ink-turn':null};
 if(!set)return player;
 const result={...player};for(const [native,name] of Object.entries(set))result[native]=images[name]??images[native];return result;
}
export function applyEnemyMaterialPixels(base,paint){
 if(base.length!==paint.length||base.length%4)throw new Error('Matière ennemie incompatible');
 for(let i=0;i<base.length;i+=4){
  if(!base[i+3]||paint[i+3]<160)continue;
  const light=base[i]*.2126+base[i+1]*.7152+base[i+2]*.0722;
  // Native ink, apertures and the original alpha own the exact registration.
  if(light<36)continue;
  for(let j=0;j<3;j++)base[i+j]=base[i+j]*.08+paint[i+j]*.92;
 }
 return base;
}
export function bakeEnemyArt(original,material){
 const w=original.naturalWidth??original.width,h=original.naturalHeight??original.height;
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('Matière ennemie indisponible');
 ctx.drawImage(original,0,0,w,h);const base=ctx.getImageData(0,0,w,h);ctx.clearRect(0,0,w,h);ctx.drawImage(material,0,0,w,h);const paint=ctx.getImageData(0,0,w,h);
 applyEnemyMaterialPixels(base.data,paint.data);ctx.putImageData(base,0,0);return c;
}
