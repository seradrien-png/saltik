import {createGame,update,LEVEL_END} from './engine.js';
import {inkSaltikGeometry} from './ink-saltik.js';
import {inkPlayerPodGeometry} from './ink-pods.js';
import {applyInkLandmarkLayout} from './ink-demo-layout.js';
import {inkEnemyGeometry} from './ink-actors.js';
import {inkEnemySaltikGeometry} from './ink-enemy-saltik.js';
export const INK_SCENE_END=LEVEL_END;
export function inkWeaponGeometry(p,time){
 const pose=inkSaltikGeometry(p,{time,scale:p.evasion?.active ? .92 : 1});
 const armBase=pose.coaxPoint(pose.coaxPart.pivot),dx=pose.arm.x-armBase.x,dy=pose.arm.y-armBase.y,length=Math.hypot(dx,dy)||1;
 const armDirection={x:dx/length,y:dy/length};
 const tubes=inkPlayerPodGeometry(p,pose).filter(slot=>slot.activeIndex>=0).sort((a,b)=>a.activeIndex-b.activeIndex).map(slot=>({muzzle:slot.muzzle,base:slot.base}));
 return {...pose,armDirection,cannonDirection:{x:Math.cos(pose.cannonAngle),y:Math.sin(pose.cannonAngle)},cabinTubes:tubes,tubes:tubes.map(t=>t.muzzle)};
}
export function createInkScene(options={}){
 const g=createGame(options);g.inkPreview=true;g.inkCampaign=true;g.weaponGeometry=inkWeaponGeometry;
 g.enemyWeaponGeometry=inkEnemyGeometry;g.enemySaltikGeometry=inkEnemySaltikGeometry;
 applyInkLandmarkLayout(g);
 // This rock previously occupied the carrier's exact spawn and trapped it.
 // Move the authored cover to the far shoulder; preserve physical collisions.
 const carrierCover=g.obstacles.find(o=>!o.platformId&&o.x===8940);
 if(carrierCover){carrierCover.x=9140;carrierCover.y=g.groundAt(carrierCover.x);}
 const carrierId='saltik-carrier-midpoint';
 const guardian=g.schedule.filter(e=>e.type==='saltik'&&!e.platformId).sort((a,b)=>Math.abs(a.x-8700)-Math.abs(b.x-8700))[0];
 if(guardian){guardian.x=8700;guardian.protectsCarrierId=carrierId;}
 g.schedule.push({id:carrierId,type:'carrier',x:8940,guardianId:guardian?.id});g.schedule.sort((a,b)=>a.x-b.x);
 return g;
}
export function updateInkScene(g,input,dt){
 update(g,input,dt);
}
