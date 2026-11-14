import {hdModuleImage,drawHDModule} from './hd-module-art.js';
import {drawRoyalEel,drawRoyalGardenLife} from './royal-atmosphere.js';
import {drawRoyalRainbow} from './royal-rainbow.js';
import {drawRoyalWaterfalls} from './royal-waterfalls.js';
import {ROYAL_CELLS,ROYAL_SITES,royalGroundAt,royalSample} from './royal-layout.js';
const GOLD='#d99b29',TAU=Math.PI*2;
export function royalPaintedBounds(s){const cell=ROYAL_CELLS[s.kind];return{x:s.left,y:s.top,w:cell.crop[2]*s.scale,h:cell.crop[3]*s.scale};}
const foundationProfiles=new WeakMap();
function foundationProfile(image){
 if(foundationProfiles.has(image))return foundationProfiles.get(image);
 if(typeof document==='undefined')return null;
 const w=image.naturalWidth??image.width,h=image.naturalHeight??image.height,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)return null;
 context.drawImage(image,0,0);const pixels=context.getImageData(0,0,w,h).data,profile=[];
 for(let x=0;x<w;x+=8){let y=h-1;while(y>=0&&pixels[(y*w+x)*4+3]<128)y--;profile.push({u:x/w,v:(y+1)/h,visible:y>=0});}
 foundationProfiles.set(image,profile);return profile;
}
function paintFoundationSeam(c,art,image,s,b,camera){
 // The painted feet can end a few pixels above their authored ground sample.
 // Fill only that narrow seam with native velvet, following the opaque foot
 // in each column. No platform or collision coordinate moves.
 const profile=foundationProfile(image);if(!profile||!art?.ground)return;
 c.save();c.beginPath();let visible=false;
 for(let i=0;i<profile.length;i++){
  const p=profile[i],x=b.x+p.u*b.w,right=b.x+(profile[i+1]?.u??1)*b.w,y=b.y+p.v*b.h,floor=royalGroundAt((x+right)/2);
  if(p.visible&&floor>y&&floor-y<40){c.rect(x-camera,y-2,right-x+1,floor-y+10);visible=true;}
 }
 if(visible){c.clip();const tw=260,th=tw*art.ground.height/art.ground.width;
  for(let x=Math.floor(b.x/tw)*tw;x<b.x+b.w;x+=tw)for(let y=Math.floor((b.y+b.h-80)/th)*th;y<b.y+b.h+60;y+=th)c.drawImage(art.ground,x-camera,y,tw,th);
 }
 c.restore();
}
function paintSite(c,art,s,camera=0,time=0){
 const cell=ROYAL_CELLS[s.kind],image=cell.source==='bridge'?art?.bridge:cell.source==='organic'?art?.organic:art?.atlas;if(!image)return;
 const b=royalPaintedBounds(s),hd=hdModuleImage(art,`royal-${s.kind}`);
 if(hd){paintFoundationSeam(c,art,hd,s,b,camera);drawHDModule(c,hd,b.x-camera,b.y,b.w,b.h);}
 else c.drawImage(image,...cell.crop,b.x-camera,b.y,b.w,b.h);
 // Water animation keeps its original atlas registration; HD cells never
 // reinterpret these source rectangles as coordinates in another image.
 if(cell.source==='bridge'||cell.source==='organic')drawRoyalWaterfalls(c,image,cell.source,{x:b.x-camera-cell.crop[0]*s.scale,y:b.y-cell.crop[1]*s.scale,scale:s.scale,time,sourceCrop:cell.crop});
}
export function drawRoyalBackdrop(c,{camera,width,height,image,art,time=0,atmosphere=null,eel=null}){
 c.save();c.globalAlpha=1;c.fillStyle='#041454';c.fillRect(0,0,width,height);
 // Keep the reference composition readable: tree at left, mountains and full
 // rainbow in the center/right. Only a restrained panoramic drift is applied.
 if(image){const w=Math.max(width*1.08,height*image.width/image.height),h=w*image.height/image.width,x=(width-w)/2-Math.min(1,Math.max(0,camera/17800))*(w-width)*.35;const y=Math.min(0,(height-h)*.22);c.drawImage(image,x,y,w,h);drawRoyalWaterfalls(c,image,'backdrop',{x,y,scale:w/1672,scaleY:h/941,time});drawRoyalRainbow(c,image,{x,y,scale:w/1672,scaleY:h/941,time});drawRoyalGardenLife(c,{x,y,scale:w/1672,scaleY:h/941,time});}
 // Small opaque wooded islands occupy a clearly separate middle distance.
 if(art?.atlas)for(const [i,world] of [1600,5500,9800,14300,18500].entries()){
  const x=width*.7+(world-camera)*.19,w=290+(i%2)*70,h=w*512/768,y=height*.56;
  if(x+w<0||x>width)continue;const cell=ROYAL_CELLS[i%2?'arch':'tree'];c.drawImage(art.atlas,...cell.crop,x,y,w,h);
 }
 // The gigantic eel shares the same depth plane before and during boarding.
 drawRoyalEel(c,eel,atmosphere,{width,height,far:true});drawRoyalEel(c,eel,atmosphere,{width,height,far:false});
 c.restore();
}
function ground(c,{camera,width,art}){
 const left=Math.floor((camera-100)/20)*20,right=camera+width+120,pts=[];for(let x=left;x<=right;x+=20)pts.push([x-camera,royalGroundAt(x)]);
 c.save();c.beginPath();pts.forEach(([x,y],i)=>c[i?'lineTo':'moveTo'](x,y));c.lineTo(right-camera,1420);c.lineTo(left-camera,1420);c.closePath();c.fillStyle='#69113e';c.fill();c.clip();
 if(art?.ground){
  // Real embroidered velvet cropped from the native plinth, with no gray fill.
  const top=Math.min(...pts.map(p=>p[1])),tw=520,th=tw*art.ground.height/art.ground.width;
  for(let ix=Math.floor(left/tw);ix*tw<right;ix++)for(let iy=Math.floor(top/th);iy*th<1420;iy++){
   const flipX=Math.abs(ix%2)===1,flipY=Math.abs(iy%2)===1;
   c.save();c.translate(ix*tw-camera+(flipX?tw:0),iy*th+(flipY?th:0));c.scale(flipX?-1:1,flipY?-1:1);c.drawImage(art.ground,0,0,tw,th);c.restore();
  }
 }
 const shade=c.createLinearGradient(0,300,0,1150);shade.addColorStop(0,'#17051f00');shade.addColorStop(1,'#210920b3');c.fillStyle=shade;c.fillRect(left-camera,0,right-left,1420);c.restore();
 c.save();c.lineJoin='round';c.strokeStyle='#054c3f';c.lineWidth=24;c.beginPath();pts.forEach(([x,y],i)=>c[i?'lineTo':'moveTo'](x,y+12));c.stroke();
 if(art?.atlas)for(let i=0;i<pts.length-1;i++){
  const a=pts[i],b=pts[i+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);c.save();c.translate(a[0],a[1]-1);c.rotate(Math.atan2(b[1]-a[1],b[0]-a[0]));c.drawImage(art.atlas,390+((left+i*20)%120+120)%120,780,20,28,0,0,length+1,27);c.restore();
 }
 c.strokeStyle='#e4b64d';c.lineWidth=2.2;c.beginPath();pts.forEach(([x,y],i)=>c[i?'lineTo':'moveTo'](x,y+25));c.stroke();c.restore();
}
export function drawRoyalWorld(c,g,{camera,width,time,art}){
 ground(c,{camera,width,art});
 for(const s of ROYAL_SITES){const b=royalPaintedBounds(s);if(b.x+b.w<camera-100||b.x>camera+width+100)continue;paintSite(c,art,s,camera,time);}

}
export function drawRoyalForeground(c,g,{camera,width,art}){
 // The native near-side bridge rail occludes feet/legs in perspective, while
 // its far rail and deck stay behind the hero. A garden descent leaves this
 // depth plane, so it must not receive the near rail over its cabin.
 // Solid plinth riders can remain on ground support (no platformId). Use
 // the registered deck plane so both grounded crossings and jumps keep rails.
 const p=g.player;
 if(art?.railFront&&p)for(const s of ROYAL_SITES.filter(s=>s.kind==='bridge'&&p.x>=s.x1-45&&p.x<=s.x2+45&&p.y<=royalSample(s.points,p.x)+10)){
  const b=royalPaintedBounds(s);if(b.x+b.w<camera||b.x>camera+width)continue;
  c.drawImage(art.railFront,0,0,1774,887,b.x-camera,b.y,b.w,b.h);
 }
 // Keep the playable lane clear: no decorative plants, jars or textile props
 // in front of the Saltik. Near-side bridge rails remain the actual structure.
}
