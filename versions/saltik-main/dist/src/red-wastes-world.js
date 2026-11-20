import {redWastesGroundAt} from './red-wastes-level.js';

export const RED_WASTES_ART_ASSETS=Object.freeze(['red-wastes-sand-plane','red-wastes-skull']);
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
 // The authored plane has a transparent rolling horizon and opaque sand all
 // the way down. Feet stand INSIDE the plane, never on a visible top edge.
 // Draw complete paintings at their native aspect, with native camera travel.
 const h=Math.max(660,height-310),w=h*image.width/image.height,y=350;
 const first=Math.floor(camera/w);
 for(let i=first;i<=Math.ceil((camera+width)/w);i++){
  c.save();c.translate(i*w-camera,y);if(i%2){c.translate(w,0);c.scale(-1,1);}c.drawImage(image,0,0,w,h);c.restore();
 }
}
function skull(c,image,x,foot,w,flip=false){
 if(!image)return;const h=w*image.height/image.width;
 c.save();c.translate(x,foot);if(flip)c.scale(-1,1);c.drawImage(image,-w/2,-h,w,h);c.restore();
}
function atlasProp(c,image,index,x,foot,w,flip=false){
 if(!image)return;const h=w*512/768;
 c.save();c.translate(x,foot);if(flip)c.scale(-1,1);c.drawImage(image,index%2*768,Math.floor(index/2)*512,768,512,-w/2,-h,w,h);c.restore();
}
// Distinct major landmarks, separated by several seconds of native fast travel.
const LANDMARKS=[
 {x:2650,w:880,kind:'skull'},
 {x:6200,w:530,kind:'machine'},
 {x:10600,w:470,kind:'fossil'},
 {x:11150,w:310,kind:'fossil',flip:true},
 {x:15300,w:730,kind:'bridge'},
 {x:19300,w:1050,kind:'skull',flip:true},
 {x:22500,w:520,kind:'machine',flip:true}
];
export function drawRedWastesWorld(c,images,g,{camera=0,width,height}){
 sandPlane(c,images['red-wastes-sand-plane'],{camera,width,height});
 for(const p of LANDMARKS){
  const x=p.x-camera*.85;if(x+p.w/2<-80||x-p.w/2>width+80)continue;
  const foot=redWastesGroundAt(x+camera)-18;
  if(p.kind==='skull')skull(c,images['red-wastes-skull'],x,foot+30,p.w,p.flip);
  else atlasProp(c,images['desert-structures'],p.kind==='fossil'?2:p.kind==='bridge'?1:3,x,foot,p.w,p.flip);
 }
}
export function drawRedWastesForeground(c,images,g,{camera=0,width}){
 const p=g.player;if(!p?.onGround||p.x-camera<-100||p.x-camera>width+100)return;
 c.save();c.fillStyle='#6e2c20';c.beginPath();c.ellipse(p.x-camera,redWastesGroundAt(p.x)+1.7,31,1.3,0,0,TAU);c.fill();c.restore();
}
