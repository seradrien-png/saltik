import {normalizeSkin} from './player-skins.js';
const cache=new Map();
export function menuPortraitPath({level=1,character='striker',cosmeticSkin='default'}={}){
 const l=[1,2,3,4].includes(level)?level:1,c=['striker','gatling','bt'].includes(character)?character:'striker';
 return `../menu/level${l}-${c}-${normalizeSkin(c,cosmeticSkin)}.webp`;
}
// Small, complete current-model portraits have priority over full game textures.
// Never render a half-prepared legacy atlas while the game is loading.
export function drawMenuPortrait(c,player,{level,x,y,scale}){
 const path=menuPortraitPath({level,...player});let entry=cache.get(path);
 if(!entry&&typeof Image!=='undefined'){
  const image=new Image();entry={image,ready:false};cache.set(path,entry);
  image.decoding='async';image.fetchPriority='high';image.onload=()=>{entry.ready=true;};
  image.src=new URL(path,import.meta.url).href;
 }
 if(!entry?.ready)return false;
 const ratio=scale/3;c.drawImage(entry.image,x-256*ratio,y-490*ratio,512*ratio,512*ratio);return true;
}
