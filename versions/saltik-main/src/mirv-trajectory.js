// Shared by the live projectiles and the prefire impact preview. Screen y grows
// downward; the native cannon geometry supplies the complete bore direction.
export const MIRV_GRAVITY=125,GRENADE_GRAVITY=775,MIRV_SPLASH=147.5;
export const INK_MIRV_SPEED=940,MIRV_STEP=1/60;
export const MIRV_AIM_MIN=.35,MIRV_AIM_MAX=1.10,MIRV_AIM_PERIOD=5.6,MIRV_TAP_TIME=.22;
export function mirvLaunch(muzzle,direction,{dir=1,ink=false}={}){
 const speed=ink?INK_MIRV_SPEED:Math.hypot(325,600);
 return {kind:'mirv',team:'player',x:muzzle.x,y:muzzle.y,vx:direction.x*speed,vy:direction.y*speed,
  dir,inkMirv:ink,age:0,damage:9,life:4,radius:6,splash:MIRV_SPLASH,trail:[{...muzzle}]};
}
export function advanceMirvBallistic(shot,dt){
 shot.vy+=(shot.kind==='mirv'?MIRV_GRAVITY:GRENADE_GRAVITY)*dt;
 shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;
}
export const shouldSplitMirv=shot=>shot.age>=.72||shot.y<48;
export function splitMirv(shot){
 return Array.from({length:5},(_,i)=>({kind:'grenade',team:'player',x:shot.x,y:shot.y,
  vx:shot.inkMirv?shot.vx*.55+(-180+i*90)*(shot.dir||1):(-81.25+i*125)*(shot.dir||1),vy:93.75+i*15,
  age:0,spin:i,life:3,radius:5,damage:9,splash:MIRV_SPLASH,trail:[]}));
}
