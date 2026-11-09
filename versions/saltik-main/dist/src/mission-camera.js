// Pure world projection. Physics stays in the same coordinates as the camera moves.
import {LEVEL_END} from './engine.js';

export const BASE_ZOOM=1.155;
export const CLOSE_ZOOM=2.1;
export const MOVE_DURATION=2.2;

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const smooth=t=>t*t*(3-2*t);
const lerp=(a,b,t)=>a+(b-a)*t;

export function missionZoom({view='playing',introDuration=0,introElapsed=0,presentationAge=0}={}){
  if(view==='won')return lerp(BASE_ZOOM,CLOSE_ZOOM,smooth(clamp(presentationAge/MOVE_DURATION,0,1)));
  if(view!=='title'&&introDuration>0&&introElapsed<introDuration)
    return lerp(CLOSE_ZOOM,BASE_ZOOM,smooth(clamp(introElapsed/introDuration,0,1)));
  return BASE_ZOOM;
}

export function projectMissionCamera({cssWidth,cssHeight,zoom,game,playerTop,view='playing',intro=false,dt=0,camera=0,cameraY=0,phone=cssWidth<900}){
  const height=720/zoom,width=cssWidth/cssHeight*height,p=game.player;
  const centerWeight=clamp((zoom-BASE_ZOOM)/(CLOSE_ZOOM-BASE_ZOOM),0,1);
  const duel=game.duel,boss=game.boss;
  const normalFraming=duel?duel.x-width*.5:boss&&boss.hp>0?
    Math.min(p.x-110,((p.x-80)+(boss.x+185)-width)/2):p.x-width*(phone?.35:.29);
  const normalX=clamp(normalFraming,70-width*(phone?.35:.29),LEVEL_END-width+250);
  const targetX=lerp(normalX,p.x-width*.5,centerWeight);
  const cinematic=intro||view==='won';
  const nextX=cinematic?targetX:camera+(targetX-camera)*Math.min(1,dt*5);
  // Ordinary routes keep a world-space 85-unit HUD margin. During the
  // cinematic, controls are hidden and the full native pod only needs to fit.
  const topMargin=cinematic?18:85;
  let targetY=Math.max(height-720,topMargin-playerTop);
  // Lunar vaults also have a lower route beneath their illustrated arches.
  // Follow those deeper banks while preserving the canyon's original camera.
  if(game.level===2)targetY=Math.min(targetY,height-(cinematic?28:76)-p.y);
  const nextY=cinematic||targetY>cameraY?targetY:cameraY+(targetY-cameraY)*Math.min(1,dt*8);
  return {zoom,width,height,camera:nextX,cameraY:nextY};
}
