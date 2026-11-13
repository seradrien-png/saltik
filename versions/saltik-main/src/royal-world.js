import {drawRoyalWaterfalls} from './royal-waterfalls.js';
import {drawRoyalProps} from './royal-props.js';
import {ROYAL_CELLS,ROYAL_SITES,royalGroundAt} from './royal-layout.js';
const GOLD='#d99b29',TAU=Math.PI*2;
export function royalPaintedBounds(s){const cell=ROYAL_CELLS[s.kind];return{x:s.left,y:s.top,w:cell.crop[2]*s.scale,h:cell.crop[3]*s.scale};}
function paintSite(c,art,s,camera=0,time=0){const cell=ROYAL_CELLS[s.kind],image=cell.source==='bridge'?art?.bridge:cell.source==='organic'?art?.organic:art?.atlas;if(!image)return;const b=royalPaintedBounds(s);c.drawImage(image,...cell.crop,b.x-camera,b.y,b.w,b.h);if(s.kind==='bridge')drawRoyalWaterfalls(c,image,'bridge',{x:b.x-camera,y:b.y,scale:s.scale,time});}
export function drawRoyalBackdrop(c,{camera,width,height,image,art,time=0}){
 c.save();c.globalAlpha=1;c.fillStyle='#041454';c.fillRect(0,0,width,height);
 // Keep the reference composition readable: tree at left, mountains and full
 // rainbow in the center/right. Only a restrained panoramic drift is applied.
 if(image){const w=Math.max(width*1.08,height*image.width/image.height),h=w*image.height/image.width,x=(width-w)/2-Math.min(1,Math.max(0,camera/17800))*(w-width)*.35;const y=Math.min(0,(height-h)*.22);c.drawImage(image,x,y,w,h);drawRoyalWaterfalls(c,image,'backdrop',{x,y,scale:w/1672,scaleY:h/941,time});}
 // Small opaque wooded islands occupy a clearly separate middle distance.
 if(art?.atlas)for(const [i,world] of [1600,5500,9800,14300,18500].entries()){
  const x=width*.7+(world-camera)*.19,w=290+(i%2)*70,h=w*512/768,y=height*.56;
  if(x+w<0||x>width)continue;const cell=ROYAL_CELLS[i%2?'arch':'tree'];c.drawImage(art.atlas,...cell.crop,x,y,w,h);
 }
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
 // Three distinct story seals, gilded medallions rooted in their own gardens.
 for(const [i,x] of [4800,10400,16450].entries()){
  const screen=x-camera;if(screen<-100||screen>width+100)continue;const y=royalGroundAt(x)-95,opened=g.royal.seals>i;
  c.save();c.strokeStyle=opened?'#fff1ac':GOLD;c.fillStyle=opened?'#087a5a':'#59123b';c.lineWidth=4;c.beginPath();c.arc(screen,y,23,0,TAU);c.fill();c.stroke();c.fillStyle='#ffe3a0';c.font='bold 20px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText(opened?'✦':String(i+1),screen,y);c.restore();
 }
}
export function drawRoyalForeground(c,g,{camera,width,art}){
 // The native near-side bridge rail occludes feet/legs in perspective, while
 // its far rail and deck stay behind the hero. No translucent overlay.
 if(art?.railFront)for(const s of ROYAL_SITES.filter(s=>s.kind==='bridge')){
  const b=royalPaintedBounds(s);if(b.x+b.w<camera||b.x>camera+width)continue;
  c.drawImage(art.railFront,0,0,1774,887,b.x-camera,b.y,b.w,b.h);
 }
 drawRoyalProps(c,art?.props,{camera,width});
 // Small native velvet flowers frame the lower edge; no unusable foreground stairs.
 if(art?.flora)for(let i=Math.floor(camera*1.025/350)-1;i<Math.floor((camera*1.025+width)/350)+2;i++){
  const x=i*350-camera*1.025,world=x+camera,y=royalGroundAt(world)+60,sw=art.flora.width/3,sh=art.flora.height,w=180,h=w*sh/sw;
  c.drawImage(art.flora,Math.abs(i%3)*sw,0,sw,sh,x,y-h,w,h);
 }
}
