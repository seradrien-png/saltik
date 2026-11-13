import {missionSurface} from './player-skins.js';
import {opaqueGatlingCell,registerGatlingTurn} from './gatling-registration.js';
const release=image=>{if(image&&'src' in image){image.onload=image.onerror=null;image.src='';}};
export function prepareModernGatling(images){
 const atlas=images['modern-gatling-atlas'];if(!atlas)return;
 const beigeAtlas=images['modern-gatling-limule-atlas'];
 for(const [level,theme]of [[1,'normal'],[2,'lunar'],[3,'velvet'],[4,'desert']]){
  const index=level-1,x=index%2*627,y=Math.floor(index/2)*627;
  images[`modern-gatling-${level}`]=opaqueGatlingCell(atlas,x,y,627).canvas;
  const turn=images[`modern-gatling-turn-${theme}`];images[`modern-gatling-turn-${level}`]=registerGatlingTurn(turn);release(turn);images[`modern-gatling-turn-${theme}`]=null;
  const {canvas:raw,box}=opaqueGatlingCell(beigeAtlas,x,y,627),beige=document.createElement('canvas');beige.width=beige.height=627;const ratio=box?543/box.h:1;beige.getContext('2d').drawImage(raw,314-314*ratio,box?560-(box.y+box.h)*ratio:0,627*ratio,627*ratio);
  images[`modern-gatling-limule-${level}`]=beige;
 }
 const rawTurn=images['modern-gatling-limule-turn'],beigeTurn=registerGatlingTurn(rawTurn);release(rawTurn);images['modern-gatling-limule-turn']=null;
 for(const level of [1,2,3,4])Object.defineProperty(images,`modern-gatling-limule-turn-${level}`,{configurable:true,get(){const value=missionSurface(beigeTurn,level);value.gatlingTurnTransforms=beigeTurn.gatlingTurnTransforms;Object.defineProperty(images,`modern-gatling-limule-turn-${level}`,{value,configurable:true});return value;}});
 release(atlas);release(beigeAtlas);images['modern-gatling-atlas']=images['modern-gatling-limule-atlas']=null;
}
