import {terrainHeight,terrainAt,surfaceHeight,routeThickness} from './world.js';
import {INK_WORLD_ART} from './ink-campaign-art.js';

// These are individual pieces of scenery, not a material stamped across the
// expedition. Their solid edge is still the route authored by world.js.
const INK='#191b16',PAPER='#ffe9bb',LIGHT='#e3ce9b',MID='#bb9469',DARK='#5e6742';
const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
let art={};
const DEFINITIONS=Object.freeze(Object.fromEntries(Object.entries(INK_WORLD_ART)
  .filter(([,d])=>d.routeId).map(([name,d])=>[d.routeId,Object.freeze({name,bounds:d.bounds})])));

export function inkLandmark(p){return DEFINITIONS[p.id]??null;}
export function configureInkLandmarkArt(images={}){
  const next={};
  for(const [key,definition] of Object.entries(INK_WORLD_ART)){
    const value=images[key],image=value?.image??value;
    if(!image||!((image.naturalWidth??image.width)>0)||!((image.naturalHeight??image.height)>0))continue;
    const bounds=value?.bounds??definition.bounds;
    if(![bounds.x,bounds.y,bounds.w,bounds.h].every(Number.isFinite)||bounds.w<=0||bounds.h<=0)continue;
    const source=value?.source??definition.source;
    if(source&&![source.x,source.y,source.w,source.h].every(Number.isFinite))continue;
    next[key]={...definition,...value,image,source,bounds:{...bounds},clip:['mass','roof','none'].includes(value?.clip)?value.clip:key==='bridge'?'mass':'none'};
  }
  art=next;
}

// An opening is the actual bottom of the physical bridge. An ornamental
// semicircle below this edge would make the lower walker appear inside stone.
export function inkLandmarkVault(p){
  if(!inkLandmark(p))return null;
  return {left:p.x1,right:p.x2,top:x=>surfaceHeight(p,x)+routeThickness(p,x),
    floor:x=>p.lower?surfaceHeight(p.lower,x):terrainHeight(x)};
}
function path(c,points,fill,stroke=INK,width=1){
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function line(c,points,color=INK,width=1){
  c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
}
function ellipse(c,x,y,rx,ry,fill,rotation=0){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rotation,0,TAU);c.fill();}
function vine(c,x,y,length,seed,size=1){
  c.strokeStyle=INK;c.lineWidth=1.3*size;c.beginPath();c.moveTo(x,y);
  c.bezierCurveTo(x-11*size,y+length*.28,x+9*size,y+length*.61,x-6*size,y+length);c.stroke();
  for(let j=0;j<length/(12*size);j++){
    const yy=y+j*12*size,xx=x+Math.sin(j*.9+seed)*3*size;
    for(const direction of [-1,1]){
      ellipse(c,xx+direction*3.8*size,yy,4.9*size,1.8*size,'#7b8a54',direction*.9);
      if(j%3===1)line(c,[[xx+direction*2,yy],[xx+direction*6*size,yy-2*size]],LIGHT,.5);
    }
  }
}

// Large vertical strata have their own silhouettes and dark, branching
// fissures. Their scale is deliberately unlike the little voussoir stones.
export function paintInkLandmarkCliff(c,p,bounds){
  const {x:left,y:top,w,h}=bounds,right=left+w,bottom=top+h,seed=p.seed??13;
  const cuts=new Map();
  const engrave=(points,color=INK,width=1)=>{const key=color+':'+width;if(!cuts.has(key))cuts.set(key,{color,width,paths:[]});cuts.get(key).paths.push(points);};
  c.fillStyle=p.id==='ledge-1'?'#dcc28e':'#d1b47d';c.fillRect(left,top,w,h);
  for(let n=Math.floor(left/108)-1;n<right/108+1;n++){
    const x=n*108+noise(n+seed)*31,y=top+15+noise(n+seed+8)*60;
    const ww=74+noise(n+seed+5)*59,hh=170+noise(n+seed+13)*240;
    const points=[[x-ww*.55,y+8],[x-ww*.19,y-11],[x+ww*.3,y+3],[x+ww*.46,y+hh*.19],
      [x+ww*.28,y+hh*.38],[x+ww*.5,y+hh*.64],[x+ww*.17,y+hh],[x-ww*.34,y+hh*.91],
      [x-ww*.47,y+hh*.56],[x-ww*.29,y+hh*.31]];
    path(c,points,[LIGHT,'#c9ac78','#ead19c','#a69562'][((n%4)+4)%4],DARK,1.8);
    path(c,[[x+ww*.3,y+3],[x+ww*.46,y+hh*.19],[x+ww*.28,y+hh*.38],[x+ww*.5,y+hh*.64],
      [x+ww*.17,y+hh],[x+ww*.07,y+hh*.51],[x+ww*.14,y+hh*.3]],'#97855a',null);
    engrave([[x-ww*.47,y+hh*.56],[x-ww*.26,y+hh*.53],[x-ww*.13,y+hh*.38],[x-ww*.03,y+hh*.35]],PAPER,1.2);
    engrave([[x-ww*.16,y],[x-ww*.23,y+hh*.24],[x-ww*.12,y+hh*.3],[x-ww*.2,y+hh*.46],
      [x-ww*.04,y+hh*.53],[x-ww*.13,y+hh*.71],[x+ww*.04,y+hh*.89]],INK,2.1);
    for(let j=0;j<16;j++){
      const xx=x+(noise(n*29+j+seed)-.5)*ww*.75,yy=y+noise(n*51+j+7)*hh;
      engrave([[xx,yy],[xx-3-noise(n+j)*9,yy+11+noise(n+j+2)*29]],j%4===0?PAPER:'#55523f',j%4===0?.8:.55);
    }
    // Deep short joints and crushed rock, never complete wallpaper courses.
    for(let row=0;row<4;row++){
      const yy=y+row*61+noise(n+row+3)*27;
      engrave([[x-ww*.47,yy],[x-ww*.09,yy-6],[x+ww*.3,yy-3]],INK,1.6);
      engrave([[x-ww*.41,yy+3],[x-ww*.15,yy-1]],PAPER,.9);
    }
  }
  for(let n=Math.floor(left/61);n<right/61;n++){
    const x=n*61+noise(n+seed)*29,y=top+noise(n+seed+19)*(bottom-top);
    path(c,[[x,y],[x+3,y+14],[x+16,y+28],[x+7,y+24],[x+1,y+45],[x-3,y+26],[x-12,y+21]],INK,null);
    engrave([[x+3,y+5],[x+6,y+15],[x+17,y+25]],PAPER,.65);
  }
  for(const {color,width,paths} of cuts.values()){
    c.strokeStyle=color;c.lineWidth=width;c.beginPath();
    for(const points of paths)points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
  }
}

export function paintInkLandmarkArt(c,p,clip='mass'){
  const descriptor=art[inkLandmark(p)?.name];
  if(!descriptor||descriptor.clip!==clip)return false;
  if(descriptor.shared)return true;
  c.save();
  // Replace the old cropped canopy with a complete separately illustrated
  // tree, retaining the original bridge's exact stones and walking contour.
  if(descriptor.replaceCanopy&&p.inkNative&&art.treeTransition){
    c.beginPath();c.moveTo(p.x1,surfaceHeight(p,p.x1));
    for(let x=p.x1+8;x<p.x2;x+=8)c.lineTo(x,surfaceHeight(p,x));
    c.lineTo(p.x2,surfaceHeight(p,p.x2));
    c.lineTo(descriptor.bounds.x+descriptor.bounds.w,descriptor.bounds.y+descriptor.bounds.h);
    c.lineTo(descriptor.bounds.x,descriptor.bounds.y+descriptor.bounds.h);c.closePath();c.clip();
  }
  drawArt(c,descriptor,descriptor.bounds);c.restore();return true;
}

function drawArt(c,descriptor,bounds){
  const {image,source}=descriptor;
  if(source)c.drawImage(image,source.x,source.y,source.w,source.h,bounds.x,bounds.y,bounds.w,bounds.h);
  else c.drawImage(image,bounds.x,bounds.y,bounds.w,bounds.h);
}

export function paintInkLandmarkGrounding(c,p,paint){
  const descriptor=art[inkLandmark(p)?.name];
  if(descriptor?.clip==='none'&&!descriptor.shared&&descriptor.foundation&&p.inkGroundAt)
    paint(c,descriptor,descriptor.bounds,p.inkGroundAt,p);
}

export function paintInkSalvageGrain(c,{x,y,w,h}){
  const descriptor=art.wreck;if(!descriptor?.source)return;
  // A measured patch of the existing cylindrical wreck supplies engraved
  // steel grain. Its drawing is only a material wash inside each cover shell.
  const s=descriptor.source,k=descriptor.sourceScale??1,sx=s.x+92*k,sy=s.y+105*k,sw=160*k,sh=116*k,tileW=112,tileH=tileW*sh/sw;
  c.save();c.globalAlpha*=.38;
  for(let ix=Math.floor(x/tileW);ix<Math.ceil((x+w)/tileW);ix++)
    for(let iy=Math.floor(y/tileH);iy<Math.ceil((y+h)/tileH);iy++)
      c.drawImage(descriptor.image,sx,sy,sw,sh,ix*tileW,iy*tileH,tileW,tileH);
  c.restore();
}

// Unique transition pieces belong to the same foreground plane as the
// landmarks. Their ragged bottoms settle into the physical lower earth.
export function paintInkCampaignScenery(c,world,left,right,paintFoundation){
  for(const descriptor of Object.values(art)){
    if(!descriptor.decoration)continue;
    const bounds={...descriptor.bounds};
    if(bounds.x+bounds.w<left||bounds.x>right)continue;
    if(descriptor.grounded)bounds.y=terrainAt(world,bounds.x+bounds.w*.5)+95-bounds.h;
    if(descriptor.foundation&&paintFoundation)paintFoundation(c,descriptor,bounds,x=>terrainAt(world,x));
    drawArt(c,descriptor,bounds);
  }
}

// Each stone is built against samples of the real underside and points into
// the solid on its normal. No fake arch or pale road is drawn over the void.
export function paintInkVoussoirs(c,p){
  if(!inkLandmark(p))return;
  const under=x=>surfaceHeight(p,x)+routeThickness(p,x),step=22,highlights=[],cuts=[];
  for(let x=p.x1;x<p.x2;x+=step){
    const a=x,b=Math.min(x+step-1,p.x2),ya=under(a),yb=under(b),middle=(a+b)/2;
    const available=Math.max(1,routeThickness(p,middle)-5),depth=Math.min(27,available);
    if(depth<4)continue;
    const slope=(under(Math.min(p.x2,middle+2))-under(Math.max(p.x1,middle-2)))/4;
    const nx=slope/Math.hypot(1,slope),ny=-1/Math.hypot(1,slope),jitter=noise(x+p.seed)*3;
    const pointA=[a+nx*depth,Math.max(surfaceHeight(p,a)+2,ya+ny*depth+jitter)];
    const pointB=[b+nx*depth,Math.max(surfaceHeight(p,b)+2,yb+ny*depth-jitter*.5)];
    path(c,[[a,ya],[b,yb],pointB,pointA],[PAPER,'#dfc28e','#ecd5a3','#c7ac76'][Math.floor(noise(x+41)*4)],INK,1.1);
    highlights.push([[a+3,ya-3],[b-3,yb-3]]);
    cuts.push([[pointA[0]+3,pointA[1]+3],[pointA[0]+6,pointA[1]+7]]);
    if(noise(x+18)>.65)cuts.push([[a+6,ya-5],[a+10,ya-depth*.55],[a+7,ya-depth*.66]]);
  }
  for(const [segments,color,width] of [[highlights,'#fff0c8',.8],[cuts,DARK,.7]]){
    c.strokeStyle=color;c.lineWidth=width;c.beginPath();
    for(const points of segments)points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
  }
  const edge=[];for(let x=p.x1;x<p.x2;x+=6)edge.push([x,under(x)]);edge.push([p.x2,under(p.x2)]);
  line(c,edge,INK,3.3);
}

function ribbon(c,points,widths,seed){
  const normals=points.map(([x,y],i)=>{
    const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)],dx=after[0]-before[0],dy=after[1]-before[1],length=Math.hypot(dx,dy)||1;
    return [-dy/length,dx/length];
  });
  const side=(i,u)=>[points[i][0]+normals[i][0]*widths[i]*u,points[i][1]+normals[i][1]*widths[i]*u];
  path(c,[...points.map((_,i)=>side(i,-.5)),...points.map((_,i)=>side(points.length-1-i,.5))],MID,INK,3);
  for(let strand=0;strand<10;strand++){
    const amount=-.44+strand*.094,curve=points.map(([x,y],i)=>{
      const offset=amount*widths[i]+Math.sin(i*.7+strand)*Math.min(2,widths[i]*.04);
      return [x+normals[i][0]*offset,y+normals[i][1]*offset];
    });
    line(c,curve,strand===2||strand===3?'#ebc596':strand%3===0?'#463e2c':'#806442',strand===2?1.9:strand%3===0?1.4:.8);
  }
  for(let i=2;i<points.length-2;i+=3){
    const [x,y]=points[i],n=normals[i],w=widths[i];
    line(c,[[x-n[0]*w*.37,y-n[1]*w*.37],[x-n[0]*w*.12-3,y-n[1]*w*.12+2],
      [x+n[0]*w*.24-2,y+n[1]*w*.24+6]],'#3c3d2e',.85);
    if(noise(seed+i)>.55)ellipse(c,x+n[0]*w*.14,y+n[1]*w*.14,2.4,4.3,INK,Math.atan2(n[1],n[0]));
  }
}

// The great root has the same upper silhouette as the support line. Its
// thickness and exposed strands vary below that line, so feet still touch.
export function paintInkBridgeRoots(c,p){
  if(p.id!=='ledge-0')return;
  const top=x=>surfaceHeight(p,x),points=[],widths=[];
  for(let x=p.x1;x<=p.x2;x+=12){
    const u=(x-p.x1)/(p.x2-p.x1),available=Math.max(0,routeThickness(p,x)-2);
    const width=Math.min(available,9+43*Math.sin(Math.PI*u)**.6+Math.sin(u*18)*4);
    points.push([x,top(x)+width*.5+1]);widths.push(width);
  }
  points.push([p.x2,top(p.x2)+1]);widths.push(1.7);
  ribbon(c,points,widths,13);
}

function broadLeaf(c,x,y,length,width,angle,seed){
  c.save();c.translate(x,y);c.rotate(angle);
  c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-width,-length*.18,-width*.75,-length*.8,0,-length);
  c.bezierCurveTo(width*.5,-length*.77,width*.58,-length*.21,0,0);c.fillStyle='#34412d';c.fill();
  line(c,[[0,-2],[-2,-length*.43],[0,-length*.88]],'#96a16e',.8);
  c.strokeStyle=DARK;c.lineWidth=.65;c.beginPath();
  for(let j=1;j<5;j++){
    const yy=-length*j/6,spread=width*Math.sin(Math.PI*j/6)*.58;
    c.moveTo(0,yy);c.lineTo(spread,yy-length*.13);
    c.moveTo(0,yy);c.lineTo(-spread*.9,yy-length*.15);
  }c.stroke();c.restore();
}
export function paintInkLandmarkFoliage(c,p,{foreground=false,player,world}={}){
  if(!inkLandmark(p))return;
  const clusters=p.id==='ledge-0'?[p.x1-246,p.x1-101,p.x2+97,p.x2+298]:[p.x1-263,p.x2+96];
  for(const [index,x] of clusters.entries()){
    if(foreground!==(index%2===1))continue;
    const floor=terrainAt(world,x),y=floor+57;
    for(let j=0;j<7;j++)broadLeaf(c,x+(j-3)*7,y,37+noise(index*19+j+71)*40,13+noise(j+13)*9,-1.2+j*.39,index+j);
    ellipse(c,x,y,31,7,'#405638');
  }
}

function cylinder(c,x,y,w,h){
  path(c,[[x-w*.48,y],[x+w*.48,y],[x+w*.5,y+h],[x-w*.5,y+h]],'#e5cd9b',INK,2);
  path(c,[[x+w*.25,y],[x+w*.48,y],[x+w*.5,y+h],[x+w*.22,y+h]],'#ad9c70',null);
  for(let j=0;j<14;j++){
    const xx=x-w*.43+noise(j*17+x)*w*.86,yy=y+noise(j*19+x+8)*h;
    line(c,[[xx,yy],[xx-3,yy+13],[xx+1,yy+28]],j%4===0?PAPER:DARK,.7);
  }
  for(const yy of [y+12,y+h*.45,y+h-7]){
    ellipse(c,x,yy,w*.51,7,DARK);ellipse(c,x,yy-2,w*.51,5,PAPER);
    line(c,[[x-w*.49,yy+2],[x+w*.49,yy+2]],INK,1);
  }
}

// A concrete observatory, visibly different from the rooted stone bridge.
// It belongs behind the playing edge; its door and gallery are scenery.
export function paintInkObservatory(c,p){
  if(p.id!=='ledge-1')return;
  const x=p.x1+(p.x2-p.x1)*.73,base=surfaceHeight(p,x)+28,roof=base-227;
  c.save();
  cylinder(c,x,roof,126,base-roof+18);
  // Broken dome with thin longitudinal ribs and a surviving open shutter.
  c.beginPath();c.moveTo(x-68,roof+1);c.bezierCurveTo(x-68,roof-67,x-30,roof-100,x+6,roof-99);
  c.bezierCurveTo(x+36,roof-97,x+68,roof-55,x+68,roof+1);c.closePath();c.fillStyle='#dfb89d';c.fill();c.strokeStyle=INK;c.lineWidth=2.5;c.stroke();
  path(c,[[x-3,roof-98],[x+12,roof-96],[x+29,roof-73],[x+31,roof-7],[x+10,roof-1],[x+5,roof-69]],INK,INK,1);
  for(const u of [-.75,-.4,.42,.77]){
    c.beginPath();c.moveTo(x+u*68,roof);c.bezierCurveTo(x+u*54,roof-53,x+u*35,roof-83,x+u*8,roof-98);c.strokeStyle=DARK;c.lineWidth=1.2;c.stroke();
  }
  line(c,[[x-61,roof-23],[x-29,roof-32],[x-8,roof-33]],DARK,1.1);
  line(c,[[x+34,roof-33],[x+56,roof-22]],DARK,1.1);
  // Deep round windows with cream bevels and weather-dark interiors.
  for(const [yy,r] of [[roof+56,12],[roof+115,10]]){
    ellipse(c,x-10,yy,r+3,r+5,INK);ellipse(c,x-11,yy-1,r,r+2,PAPER);ellipse(c,x-10,yy,r-2,r,INK);
    line(c,[[x-10-r+3,yy],[x-10+r-3,yy]],LIGHT,1);line(c,[[x-10,yy-r+2],[x-10,yy+r-2]],LIGHT,1);
  }
  // External service gallery, pipes and antenna remain individually drawn.
  const balconyY=roof+149;
  path(c,[[x-98,balconyY],[x+83,balconyY],[x+76,balconyY+12],[x-94,balconyY+12]],DARK,INK,1.8);
  line(c,[[x-97,balconyY],[x-97,balconyY-27],[x+79,balconyY-27],[x+79,balconyY]],INK,1.7);
  for(let dx=-94;dx<83;dx+=22)line(c,[[x+dx,balconyY-27],[x+dx,balconyY]],INK,1.6);
  line(c,[[x-88,balconyY+12],[x-63,balconyY+45]],INK,2.8);line(c,[[x+67,balconyY+12],[x+58,balconyY+45]],INK,2.8);
  c.lineCap='round';line(c,[[x+45,roof+39],[x+70,roof+39],[x+73,roof+65],[x+73,base+26]],INK,10);
  line(c,[[x+44,roof+37],[x+68,roof+37],[x+70,roof+65],[x+70,base+25]],'#d4c6ae',5);c.lineCap='butt';
  const antenna=x-86;line(c,[[antenna,roof+16],[antenna,roof-114]],INK,3);
  line(c,[[antenna-15,roof-83],[antenna+16,roof-83],[antenna-15,roof-51],[antenna+16,roof-51]],INK,2);
  line(c,[[antenna-13,roof-84],[antenna-13,roof-48],[antenna+13,roof-84],[antenna+13,roof-48]],INK,1.5);
  for(let j=0;j<10;j++){
    const xx=x-61+j*13,yy=roof-1+noise(j+44)*10;
    ellipse(c,xx,yy,8+noise(j+13)*4,3.5,INK,-.2);vine(c,xx,yy,28+noise(j+61)*79,j,.8);
  }
  for(const [dx,yy,len] of [[-56,roof+105,100],[53,roof+31,176],[77,balconyY-3,76]])vine(c,x+dx,yy,len,dx,1);
  c.restore();
}

export function inkLandmarkBounds(p){
  const descriptor=art[inkLandmark(p)?.name];
  if(descriptor&&descriptor.clip==='none'){
    const b=descriptor.bounds;
    if(descriptor.foundation&&p.inkGroundAt){
      let base=b.y+b.h;
      for(let x=b.x;x<=b.x+b.w;x+=16)base=Math.max(base,p.inkGroundAt(x)+24);
      base=Math.max(base,p.inkGroundAt(b.x+b.w)+24);return {...b,h:base-b.y};
    }
    return b;
  }
  if(p.id==='ledge-1')return {x:p.x1+(p.x2-p.x1)*.73-110,y:surfaceHeight(p,p.x1+(p.x2-p.x1)*.73)-324,w:225,h:390};
  return null;
}
