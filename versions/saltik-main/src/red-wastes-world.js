import {redWastesGroundAt} from './red-wastes-level.js';
import {RED_WASTES_SITES,structurePlacement,createRedWastesRoutes} from './red-wastes-layout.js';

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
 const h=Math.max(660,height-310),w=h*image.width/image.height,strip=24;
 // Join both ends of every slice with an affine shear. Translating independent
 // columns made every painted dune break into stairs. World-anchored sections
 // also keep the texture stable while the camera moves by a fractional pixel.
 const first=Math.floor(camera/w),last=Math.floor((camera+width)/w);
 for(let tile=first;tile<=last;tile++){
  const start=tile*w,flip=Math.abs(tile%2)===1;
  for(let local=Math.max(0,Math.floor((camera-start)/strip)*strip);local<w&&start+local<camera+width;local+=strip){
   const span=Math.min(strip,w-local),world=start+local;
   const left=redWastesGroundAt(world)-270,right=redWastesGroundAt(world+span)-270;
   const source=flip?w-local-span:local;
   c.save();c.transform(flip?-1:1,flip?-(right-left)/span:(right-left)/span,0,1,world-camera+(flip?span:0),flip?right:left);
   c.drawImage(image,source/w*image.width,0,span/w*image.width,image.height,0,0,span,h);
   c.restore();
  }
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

export function drawRedWastesWorld(c,images,g,{camera=0,width,height,beforeStructures}){
 // Distant moving bones sit behind the opaque native dune crest and sites.
 beforeStructures?.();
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
   skull(c,images['red-wastes-skull'],b.x+b.w/2-camera,b.y+b.h,b.w);
  }
 }
}

export function drawRedWastesFrontStructures(c,images,g,{camera=0,width}){
 const image=images['red-wastes-skull'];if(!image)return;
 for(const site of RED_WASTES_SITES){
  if(site.kind!=='skull'||site.x+site.w<camera||site.x>camera+width)continue;
  const b=structurePlacement(site),x=b.x-camera,y=b.y;
  // Draw only the lower orbital lip in front of the wheels. A full-width
  // contour has no vertical clipping edge cutting through the original skull.
  c.save();c.beginPath();
  const route=createRedWastesRoutes().find(route=>route.id===`${site.id}-tunnel`);
  // Share the physical sill rather than a second approximate silhouette. The
  // former mask rose 130px above the exit support and erased the native rig.
  const points=[...route.walkableEntries[0].points,...route.points.slice(1),...route.walkableEntries[1].points.slice(0,-1).reverse()];
  c.moveTo(x,y+b.h);
  for(const [worldX,worldY]of points)c.lineTo(worldX-camera,worldY+4);
  c.lineTo(x+b.w,y+b.h);
  c.closePath();c.clip();c.drawImage(image,x,y,b.w,b.h);c.restore();
 }
}

export function drawRedWastesForeground(c,images,g,{camera=0,width}){
 const p=g.player;if(!p?.onGround||p.x-camera<-100||p.x-camera>width+100)return;
 const support=Number.isFinite(p.supportY)?p.supportY:redWastesGroundAt(p.x);
 c.save();c.fillStyle='#6e2c20';c.beginPath();c.ellipse(p.x-camera,support+1.7,31,1.3,0,0,TAU);c.fill();c.restore();
}
