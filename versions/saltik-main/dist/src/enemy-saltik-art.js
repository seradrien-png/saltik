// Crops follow the connected opaque silhouettes, rather than nominal 384×512
// cells. Frame 6 is deliberately absent: its generated face has extra eyes.
const SCALE=.27;
const FRAMES=[
  {crop:[22,62,357,407],anchor:[203,465],gun:[85,245],pods:[[63,98],[285,92]],native:-1},
  {crop:[406,62,350,407],anchor:[588,465],gun:[468,247],pods:[[447,102],[669,95]],native:-1},
  {crop:[782,72,358,405],anchor:[970,473],gun:[850,250],pods:[[832,111],[1054,104]],native:-1},
  {crop:[1164,68,355,402],anchor:[1355,466],gun:[1232,255],pods:[[1217,112],[1443,99]],native:-1},
  {crop:[24,540,354,432],anchor:[201,968],gun:[83,752],pods:[[59,578],[297,571]],native:-1},
  {crop:[410,571,349,401],anchor:[585,968],gun:[467,744],pods:[[452,614],[640,606]],native:-1},
  null,
  {crop:[1160,557,352,410],anchor:[1335,963],gun:[1453,743],pods:[[1261,597],[1464,599]],native:1}
];
const unit=(x,y)=>{const n=Math.hypot(x,y);return{x:x/n,y:y/n};};
const POD_AXES=[unit(-1,-.08),unit(-1,-.10)];

export function enemySaltikGeometry(e,time=0){
  const dir=e.dir===1?1:-1;
  const launching=e.attackPhase==='launch'||e.attackPhase==='missile'||e.podLaunch>0;
  const raising=!launching&&((e.podRaise??0)>0||['lock','raise'].includes(e.attackPhase));
  const walking=Math.abs(e.vx??0)>1;
  const frame=launching?5:raising?4:e.firePose>0?1:walking?2+Math.floor((e.phase??time)*7)%2:dir===1?7:0;
  const m=FRAMES[frame],[x,y,w,h]=m.crop,[ax,ay]=m.anchor;
  const flip=dir===m.native?1:-1;
  const point=([px,py])=>({x:e.x+(px-ax)*SCALE*flip,y:e.y+(py-ay)*SCALE});
  const bounds={x:e.x-46,y:e.y-81,w:92,h:81},target={x:e.x,y:e.y-43};
  return{bounds,targetY:target.y,target,muzzle:point(m.gun),podMuzzles:m.pods.map(point),
    podDirections:POD_AXES.map(d=>({x:d.x*(dir===1?-1:1),y:d.y})),
    podsOpen:launching,crop:{x,y,w,h},anchor:{x:ax,y:ay},scale:SCALE,frame,flip};
}

export function drawEnemySaltik(c,images,e,time=0,{camera=0}={}){
  const sheet=images['enemy-saltik'];if(!sheet)return false;
  const {crop,anchor,scale,flip}=enemySaltikGeometry(e,time);
  c.save();c.translate(e.x-camera,e.y);c.scale(flip,1);c.imageSmoothingEnabled=true;
  if(e.hit>0)c.filter='brightness(1.65)';
  c.drawImage(sheet,crop.x,crop.y,crop.w,crop.h,
    (crop.x-anchor.x)*scale,(crop.y-anchor.y)*scale,crop.w*scale,crop.h*scale);
  c.restore();return true;
}
