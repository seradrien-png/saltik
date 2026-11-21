import {addLongrangePositions} from './longrange-enemy.js';
import {isSpecialist,specialistGeometry} from './enemy-specialists.js';
import {inkPlayerHitboxes} from './ink-player-hitbox.js';
import {advanceRedWastesSand} from './red-wastes-sand.js';
import {advanceRoyalPovCombat,clearRoyalPovCombat} from './royal-pov-combat.js';
import {beginRoyalBoarding,ROYAL_FINALE_TIMING} from './royal-finale.js';
import {nativeTurnSockets} from './character-turns.js';
import {normalizeSkin} from './player-skins.js';
import {applyRedWastesLevel,advanceRedWastesObjective} from './red-wastes-level.js';
import {advanceDesertGiant} from './desert-giant.js';
import {applyDesertLevel,advanceDesertObjective,desertInput} from './desert-level.js';
import {applyRoyalLevel,advanceRoyalObjective} from './royal-level.js';
import {createGame,update,LEVEL_END,advanceRoyalWeaponSimulation} from './engine.js';
import {applyLunarLevel,advanceLunarObjective} from './lunar-level.js';
import {inkSaltikGeometry} from './ink-saltik.js';
import {inkPlayerPodGeometry} from './ink-pods.js';
import {applyInkLandmarkLayout} from './ink-demo-layout.js';
import {inkEnemyGeometry} from './ink-actors.js';
import {inkEnemySaltikGeometry} from './ink-enemy-saltik.js';
export const INK_SCENE_END=LEVEL_END;
export function inkWeaponGeometry(p,time){
 const pose=inkSaltikGeometry(p,{time,scale:p.evasion?.active ? .92 : 1});
 if(p.character==='bt'){const tubes=nativeTurnSockets(p,{scale:p.evasion?.active ? .92 : 1})??pose.btTubes;return {...pose,btTubes:tubes,cannonDirection:pose.armDirection,cabinTubes:tubes.map(t=>({muzzle:t.muzzle,base:t.base})),tubes:tubes.map(t=>t.muzzle)};}
 if(p.character==='gatling')return {...pose,armDirection:pose.gatlingDirections[0],cannonDirection:{x:p.dir===-1?-1:1,y:0},tubes:pose.rocketMuzzles,cabinTubes:pose.rocketMuzzles.map(muzzle=>({muzzle,base:{x:muzzle.x-(p.dir===-1?-8:8),y:muzzle.y}}))};
 if(pose.modern){
  const tubes=nativeTurnSockets(p,{scale:p.evasion?.active?.92:1})??pose.modernTubes,cabinTubes=tubes.filter((t,i)=>[2,4,7].includes(i));
  return {...pose,armDirection:pose.modernGuns[1].direction,cannonDirection:pose.modernGuns[0].direction,cabinTubes,tubes:cabinTubes.map(t=>t.muzzle)};
 }
 const armBase=pose.coaxPoint(pose.coaxPart.pivot),dx=pose.arm.x-armBase.x,dy=pose.arm.y-armBase.y,length=Math.hypot(dx,dy)||1;
 const armDirection={x:dx/length,y:dy/length};
 const tubes=inkPlayerPodGeometry(p,pose).filter(slot=>slot.activeIndex>=0).sort((a,b)=>a.activeIndex-b.activeIndex).map(slot=>({muzzle:slot.muzzle,base:slot.base}));
 return {...pose,armDirection,cannonDirection:{x:Math.cos(pose.cannonAngle),y:Math.sin(pose.cannonAngle)},cabinTubes:tubes,tubes:tubes.map(t=>t.muzzle)};
}
export function createInkScene(options={}){
 const g=createGame(options);if(!g.player.character||g.player.character==='striker')g.player.visualModel='modern-striker';else if(g.player.character==='gatling')g.player.visualModel='modern-gatling';const cosmetic=normalizeSkin(options.character,options.skin);if(cosmetic!=='default')g.player.cosmeticSkin=cosmetic;g.inkPreview=true;g.inkCampaign=true;g.weaponGeometry=inkWeaponGeometry;
 if([4,5].includes(options.level)&&g.player.visualModel==='modern-striker'&&cosmetic==='default')g.player.strikerVariant='desert';
 g.playerHitboxes=inkPlayerHitboxes;
 if([4,5].includes(options.level)&&g.player.character==='bt')g.player.btVariant='desert';
 g.enemyWeaponGeometry=inkEnemyGeometry;
 g.enemySaltikGeometry=(enemy,...args)=>isSpecialist(enemy)?specialistGeometry(enemy,...args):inkEnemySaltikGeometry(enemy,...args);
 g.level=1;g.levelTitle='Le Canyon';
 if(options.level===5)return addLongrangePositions(applyRedWastesLevel(g));
 if(options.level===4)return addLongrangePositions(applyDesertLevel(g));
 if(options.level===2)return addLongrangePositions(applyLunarLevel(g));
 if(options.level===3)return addLongrangePositions(applyRoyalLevel(g));
 applyInkLandmarkLayout(g);
 // This rock previously occupied the carrier's exact spawn and trapped it.
 // Move the authored cover to the far shoulder; preserve physical collisions.
 const carrierCover=g.obstacles.find(o=>!o.platformId&&o.x===8940);
 if(carrierCover){carrierCover.x=9140;carrierCover.y=g.groundAt(carrierCover.x);}
 const carrierId='saltik-carrier-midpoint';
 const guardian=g.schedule.filter(e=>e.type==='saltik'&&!e.platformId).sort((a,b)=>Math.abs(a.x-8700)-Math.abs(b.x-8700))[0];
 if(guardian){guardian.x=8700;guardian.protectsCarrierId=carrierId;}
 g.schedule.push({id:carrierId,type:'carrier',x:8940,guardianId:guardian?.id});g.schedule.sort((a,b)=>a.x-b.x);
 return addLongrangePositions(g);
}
export function updateInkScene(g,input,dt=1/60){
 if(g.level===3&&g.royal?.finale?.active){
  if(g.status!=='playing')return;
  const step=Math.max(0,Math.min(1/30,Number.isFinite(dt)?dt:0));
  const f=g.royal.finale;
  if(f.stage==='approach'){
   const end=g.levelEnd;g.levelEnd=Math.max(end,f.launchX+500);
   try{update(g,{right:g.player.x<f.launchX},step);}finally{g.levelEnd=end;}
   if(g.player.onGround&&g.player.x>=f.launchX)beginRoyalBoarding(f,g.player);
   advanceRoyalObjective(g,step);return;
  }
  const previous=f.elapsed;g.time+=step;advanceRoyalObjective(g,step);
  const combatStep=Math.max(0,Math.min(f.elapsed,ROYAL_FINALE_TIMING.combatEnd)-Math.max(previous,ROYAL_FINALE_TIMING.combatStart));
  if(combatStep>0)advanceRoyalPovCombat(g,input,combatStep);
  else advanceRoyalWeaponSimulation(g,{},step);
  if(previous<ROYAL_FINALE_TIMING.combatEnd&&f.elapsed>=ROYAL_FINALE_TIMING.combatEnd)clearRoyalPovCombat(g);
  return;
 }
 const before=g.time;
 update(g,desertInput(g,input),dt);
 if(g.level===2)advanceLunarObjective(g,g.time-before);
 if(g.level===4)advanceDesertObjective(g,g.time-before);
 if(g.level===5){
  advanceRedWastesObjective(g,g.time-before);advanceDesertGiant(g,g.time-before);
  const pose=inkSaltikGeometry(g.player,{time:g.time}),feet=(pose.modernLegs??pose.btNative?.legs??pose.nativeLegs??pose.legs??[]).map(l=>l.contact);
  advanceRedWastesSand(g,g.time-before,feet);
 }
 if(g.level===3)advanceRoyalObjective(g,g.time-before);
}
