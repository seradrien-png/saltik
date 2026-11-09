// Generated sheets have unequal painted rows. These measured crops retain
// complete boots and exclude neighboring silhouettes and muzzle-flash bleed.
const PROFILES=Object.freeze({
  walker:{column:0,w:44*.85,h:75*.85,scale:.30*.85,speed:23},
  soldier:{column:1,w:42*.85,h:74*.85,scale:.30*.85,speed:23},
  turret:{column:2,w:66,h:89,scale:.34,speed:0}
});
const FRAMES=[
  [
    {crop:[226,22,218,256],anchor:[357,274],muzzle:[230,106]},
    {crop:[210,294,240,242],anchor:[344,532],muzzle:[214,366]},
    {crop:[222,547,241,240],anchor:[350,783],muzzle:[226,621]},
    {crop:[165,789,301,226],anchor:[365,1011],muzzle:[239,845]}
  ],[
    {crop:[660,27,207,251],anchor:[783,274],muzzle:[664,106]},
    {crop:[651,294,235,241],anchor:[771,531],muzzle:[655,367]},
    {crop:[666,544,220,243],anchor:[788,783],muzzle:[670,625]},
    {crop:[593,790,302,225],anchor:[799,1011],muzzle:[670,845]}
  ],[
    {crop:[1046,10,290,268],anchor:[1214,273],muzzle:[1050,122]},
    {crop:[1046,280,325,254],anchor:[1244,531],muzzle:[1050,378]},
    {crop:[1054,534,324,254],anchor:[1241,786],muzzle:[1060,636]},
    {crop:[1000,788,385,227],anchor:[1288,1011],muzzle:[1103,843]}
  ]
];
export const enemyProfile=type=>PROFILES[type]??null;
export function enemyGeometry(e,time=0){
  const profile=enemyProfile(e.type);if(!profile)return null;
  const walking=Math.abs(e.vx??(profile.speed?-profile.speed:0))>1;
  const row=e.firePose>0?3:walking?1+Math.floor((e.phase??time)*7)%2:0;
  const frame=FRAMES[profile.column][row],[x,y,w,h]=frame.crop,[ax,ay]=frame.anchor,s=profile.scale;
  return {column:profile.column,row,crop:{x,y,w,h},anchor:{x:ax,y:ay},scale:s,
    muzzle:{x:e.x+(frame.muzzle[0]-ax)*s,y:e.y+(frame.muzzle[1]-ay)*s},
    targetY:e.y-profile.h*.52,bounds:{x:e.x-profile.w/2,y:e.y-profile.h,w:profile.w,h:profile.h}};
}
export function drawGroundEnemy(c,images,e,time,{camera=0}={}){
  const sheet=images.enemies,geo=enemyGeometry(e,time);if(!sheet||!geo)return false;
  const {crop,anchor,scale}=geo;
  c.save();c.imageSmoothingEnabled=false;
  c.drawImage(sheet,crop.x,crop.y,crop.w,crop.h,
    e.x-camera-(anchor.x-crop.x)*scale,e.y-(anchor.y-crop.y)*scale,crop.w*scale,crop.h*scale);
  c.restore();return true;
}
