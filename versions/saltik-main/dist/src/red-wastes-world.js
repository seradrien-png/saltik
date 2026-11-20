import {redWastesGroundAt} from './red-wastes-level.js';
import {RED_WASTES_SITES,structurePlacement} from './red-wastes-layout.js';

export const RED_WASTES_ART_ASSETS=Object.freeze(['red-wastes-sand-plane','red-wastes-skull','red-wastes-bunker']);
const TAU=Math.PI*2;
const vista=images=>images['desert-two-routes-vista']??images['desert-red-vista'];

export function drawRedWastesBackdrop(c,images,{camera=0,width,height,cameraY=0}){
 c.fillStyle='#127eda';c.fillRect(0,0,width,height);
 const image=vista(images);if(!image)return;
 const h=850,w=h*image.width/image.height,y=620-h*.88+cameraY*.18,offset=camera*.035;
 for(let i=Math.floor(offset/w);i<=Math.ceil((offset+width)/w);i++){
  c.save();c.translate(i*w-offset,y);if(i%2){c.translate(w,0);c.scale(-1,1);}c.drawImage(image,0,0,w,h);c.restore();
 }
}

function sandPlane(c,image,{camera,width,height}){
 if(!image)return;
 // Bend the complete opaque painting with the same broad dune curve as feet.
 // Its transparent horizon stays well above the route: no exposed earth edge.
 const h=Math.max(660,height-310),w=h*image.width/image.height,strip=24;
 c.fillStyle='#d74a15';c.fillRect(0,500,width,Math.max(0,height-500));
 // Fixed-sized strips bound the loop independently of floating-point seams.
 // A tiny negative world coordinate can otherwise round local back to w,
 // produce span=0 and stall the browser during ordinary camera motion.
 for(let screen=-strip;screen<width+strip;screen+=strip){
  const world=screen+camera,tile=Math.floor(world/w),local=Math.max(0,Math.min(w-strip,world-tile*w));
  const source=tile%2?w-local-strip:local,y=redWastesGroundAt(world+strip/2)-270;
  c.save();
  if(tile%2){c.translate(screen+strip,y);c.scale(-1,1);c.drawImage(image,source/w*image.width,0,strip/w*image.width,image.height,0,0,strip,h);}
  else c.drawImage(image,source/w*image.width,0,strip/w*image.width,image.height,screen,y,strip,h);
  c.restore();
 }
}

function skull(c,image,x,foot,w,flip=false){
 if(!image)return;const h=w*image.height/image.width;
 c.save();c.translate(x,foot);if(flip)c.scale(-1,1);c.drawImage(image,-w/2,-h,w,h);c.restore();
}

function bunker(c,images,site,camera){
 const b=structurePlacement(site),image=images['red-wastes-bunker'];
 // Let the original buried dune silhouette supply every visible access slope.
 // The 18px registration lift aligns its painted concrete with native supports.
 if(image)c.drawImage(image,0,160,2172,515,b.x-camera,b.roofY-18,b.w,b.foot-b.roofY+18);
}

const DISTANT_SKULLS=[{x:2650,w:880},{x:19300,w:1050,flip:true}];

export function drawRedWastesWorld(c,images,g,{camera=0,width,height}){
 sandPlane(c,images['red-wastes-sand-plane'],{camera,width,height});
 for(const p of DISTANT_SKULLS){
  const x=p.x-camera*.85;if(x+p.w/2<-80||x-p.w/2>width+80)continue;
  skull(c,images['red-wastes-skull'],x,redWastesGroundAt(x+camera)+30,p.w,p.flip);
 }
 for(const site of RED_WASTES_SITES){
  if(site.x+site.w<camera-80||site.x>camera+width+80)continue;
  if(site.kind==='bunker')bunker(c,images,site,camera);
  else{
   const b=structurePlacement(site);
   skull(c,images['red-wastes-skull'],b.x+b.w/2-camera,b.foot,b.w);
  }
 }
}

export function drawRedWastesFrontStructures(c,images,g,{camera=0,width}){
 const image=images['red-wastes-skull'];if(!image)return;
 for(const site of RED_WASTES_SITES){
  if(site.kind!=='skull'||site.x+site.w<camera||site.x>camera+width)continue;
  const b=structurePlacement(site),x=b.x-camera,y=b.y;
  // Original opaque bone forms the orbital sill in front of native actors.
  c.save();
  // Only the near orbital sill crosses the playable eye passage. The outer
  // jaw stays behind entering actors, avoiding an isolated wheel below bone.
  c.beginPath();c.rect(x+600,y,650,b.h);c.clip();c.beginPath();
  const contour=[[0,.74],[.28,.70],[.42,.60],[.49,.65],[.60,.65],[.69,.59],[.77,.50],[1,.58],[1,1],[0,1]];
  contour.forEach(([u,v],i)=>i?c.lineTo(x+u*b.w,y+v*b.h):c.moveTo(x+u*b.w,y+v*b.h));
  c.closePath();c.clip();c.drawImage(image,x,y,b.w,b.h);c.restore();
 }
}

export function drawRedWastesForeground(c,images,g,{camera=0,width}){
 const p=g.player;if(!p?.onGround||p.x-camera<-100||p.x-camera>width+100)return;
 const support=Number.isFinite(p.supportY)?p.supportY:redWastesGroundAt(p.x);
 c.save();c.fillStyle='#6e2c20';c.beginPath();c.ellipse(p.x-camera,support+1.7,31,1.3,0,0,TAU);c.fill();c.restore();
}
