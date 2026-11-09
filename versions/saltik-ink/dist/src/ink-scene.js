import {createGame,update,LEVEL_END} from './engine.js';
import {inkSaltikGeometry} from './ink-saltik.js';
import {applyInkLandmarkLayout} from './ink-demo-layout.js';
import {inkEnemyGeometry} from './ink-actors.js';
import {inkEnemySaltikGeometry} from './ink-enemy-saltik.js';
export const INK_SCENE_END=LEVEL_END;
export function inkWeaponGeometry(p,time){
 const pose=inkSaltikGeometry(p,{time});
 const tubes=[[354,483],[1135,484],[1200,546]].map(([x,y])=>({muzzle:pose.sourcePoint([x,y]),base:pose.sourcePoint([x-30,y+50])}));
 return {...pose,cannonDirection:{x:Math.cos(pose.cannonAngle),y:Math.sin(pose.cannonAngle)},cabinTubes:tubes,tubes:tubes.map(t=>t.muzzle)};
}
export function createInkScene(options={}){
 const g=createGame(options);g.inkPreview=true;g.inkCampaign=true;g.weaponGeometry=inkWeaponGeometry;
 g.enemyWeaponGeometry=inkEnemyGeometry;g.enemySaltikGeometry=inkEnemySaltikGeometry;
 applyInkLandmarkLayout(g);
 return g;
}
export function updateInkScene(g,input,dt){
 update(g,input,dt);
}
