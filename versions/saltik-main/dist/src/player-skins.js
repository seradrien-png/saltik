import {bakeEnemyArt} from './enemy-styles.js';
export function normalizeSkin(character='striker',skin){return character==='striker'&&skin==='dragon'||character==='gatling'&&skin==='limule'?skin:'default';}
export function finishMissionPixels(data,w,h,level){
 if(level===1)return data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;if(!data[i+3])continue;const light=data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722;if(light<52||light>244)continue;
  let factor=1,add=0;
  if(level===2){const wave=Math.sin(x*.12+Math.sin(y*.04)*3);add=wave>.96?13:Math.sin(y*.11)>.98?5:0;factor=.985;}
  else if(level===3){const a=((x+y)%64+64)%64,b=((x-y)%64+64)%64;add=a<2||b<2?14:0;factor=.94+.07*Math.sin(a*Math.PI/64)*Math.sin(b*Math.PI/64);}
  else if(level===4){const dirt=Math.max(0,(y/h-.48)/.52),grain=((x*37+y*19)%31)/31;factor=1-dirt*.07;add=dirt*grain*10;}
  for(let j=0;j<3;j++)data[i+j]=Math.max(0,Math.min(255,data[i+j]*factor+add));
 }
 return data;
}
export function missionSurface(image,level){
 if(level===1)return image;const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height);finishMissionPixels(pixels.data,c.width,c.height,level);ctx.putImageData(pixels,0,0);return c;
}
export function prepareModernStriker(images){
 if(!images['modern-striker-atlas'])return;
 const crop=(image,index)=>{const c=document.createElement('canvas');c.width=c.height=724;c.getContext('2d').drawImage(image,index*724,0,724,724,0,0,724,724);return c;};
 // These new illustrations have their own clean outlines. Blending older ink
 // over slightly shifted facial details creates double pupils and pod rims.
 const dragonAtlas=images['modern-striker-dragon-atlas'],dragonTurn=images['modern-striker-dragon-turn-material'];
 for(const level of [1,2,3,4]){const costume=level===2?2:level===3?1:0;
  images[`modern-striker-${level}`]=missionSurface(crop(images['modern-striker-atlas'],costume),level===4?4:1);
  images[`modern-striker-turn-${level}`]=missionSurface(images[`modern-striker-turn-${level===2?'lunar':level===3?'velvet':'normal'}`],level===4?4:1);
  const dragonBody=document.createElement('canvas');dragonBody.width=dragonBody.height=724;dragonBody.getContext('2d').drawImage(dragonAtlas,costume*724,16,724,697,0,17,724,689);
  images[`modern-striker-dragon-${level}`]=missionSurface(dragonBody,level===4?4:1);
  images[`modern-striker-dragon-turn-${level}`]=missionSurface(dragonTurn,level);
  // The embroidered emerald/red costume is exclusive to the Velvet Dragon.
  // Its registered native sheet uses the same rig, anchor and gameplay scale.
  if(level===3){
   images['modern-striker-dragon-3']=images['dragon-velvet-body']??images['modern-striker-dragon-3'];
   if(images['dragon-velvet-body'])images['dragon-velvet-body'].velvetDragonCutout=true;
   images['modern-striker-dragon-turn-3']=images['dragon-velvet-turn']??images['modern-striker-dragon-turn-3'];
  }
 }
}
export function preparePlayerSkins(images){
 prepareModernStriker(images);
 const dragon=bakeEnemyArt(images['ink-saltik'],images['dragon-striker-material']),dragonTurn=bakeEnemyArt(images['ink-turn'],images['dragon-turn-material']);
 const limule=bakeEnemyArt(images['gatling-snow'],images['limule-gatling-material']),limuleTurn=bakeEnemyArt(images['gatling-turn'],images['limule-gatling-turn-material']);
 const missionTurns={};for(const character of ['bt','gatling'])for(const [level,theme]of [[2,'lunar'],[3,'velvet']])missionTurns[`${character}-${level}`]=bakeEnemyArt(images[`${character}-turn`],images[`${character}-turn-${theme}-material`]);
 const cache=(key,base,level)=>Object.defineProperty(images,key,{configurable:true,get(){const value=missionSurface(base,level);Object.defineProperty(images,key,{value,configurable:true});return value;}});
 for(const level of [1,2,3,4]){
  cache(`cosmetic-striker-dragon-${level}`,dragon,level);cache(`cosmetic-striker-dragon-turn-${level}`,dragonTurn,level);
  cache(`cosmetic-gatling-limule-${level}`,limule,level);cache(`cosmetic-gatling-limule-turn-${level}`,limuleTurn,level);
  cache(`bt-turn-${level}`,missionTurns[`bt-${level}`]??images['bt-turn'],missionTurns[`bt-${level}`]?1:level);cache(`gatling-turn-${level}`,missionTurns[`gatling-${level}`]??images['gatling-turn'],missionTurns[`gatling-${level}`]?1:level);
 }
 for(const name of ['dragon-striker-material','dragon-turn-material','limule-gatling-material','limule-gatling-turn-material','bt-turn-lunar-material','bt-turn-velvet-material','gatling-turn-lunar-material','gatling-turn-velvet-material']){if(images[name]&&'src' in images[name]){images[name].onload=images[name].onerror=null;images[name].src='';}images[name]=null;}
}
