import {terrainHeight,terrainAt,surfaceHeight,routeThickness,scenarioAt} from './world.js';
import {inkLandmark,inkLandmarkVault,configureInkLandmarkArt,paintInkLandmarkCliff,paintInkLandmarkArt,
  paintInkVoussoirs,paintInkBridgeRoots,paintInkLandmarkFoliage,paintInkObservatory,inkLandmarkBounds,paintInkLandmarkGrounding,paintInkSalvageGrain} from './ink-landmarks.js';
import {paintInkCampaignScenery} from './ink-landmarks.js';
import {stairTreads,stairCenterHeight} from './walkable-routes.js';

// The walking line is always the physics contour. Everything engraved below
// it belongs to a separate, cached face; there is no perspective road strip.
const INK='#161715',PAPER='#fff0c9',STONE='#c9ae75',DARK='#465338',LIGHT='#e4cf9b';
const TAU=Math.PI*2,TILE=512,PIXEL_BUDGET=5500000;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const cache=new Map();let cachedPixels=0;
let terrainTexture=null;
let sharedNativeRoutes=new Set();

export function setInkTerrainTexture(image){
  terrainTexture=image&&(image.naturalWidth??image.width)>0&&(image.naturalHeight??image.height)>0?image:null;
  cache.clear();cachedPixels=0;
}

// Native landmark cutouts are registered in world coordinates. Supplying a
// fresh image invalidates exactly the same bounded cache as terrain changes.
export function setInkLandmarkArt(images){
  configureInkLandmarkArt(images);cache.clear();cachedPixels=0;
  // Shared roof/turn platforms reuse the parent checkpoint painting. They
  // contain no pixels of their own: caching their full atlas-sized bounds
  // used to evict the actual checkpoint and visible ground every frame.
  sharedNativeRoutes=new Set(Object.values(images??{}).filter(value=>value?.shared&&
    (value.image?.naturalWidth??value.image?.width)>0&&(value.image?.naturalHeight??value.image?.height)>0).map(value=>value.routeId));
}

function line(c,points,color=INK,width=1){
  if(!points.length)return;
  c.strokeStyle=color;c.lineWidth=width;c.beginPath();
  points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
}
function polygon(c,points,fill,stroke=INK,width=2){
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
  if(fill){c.fillStyle=fill;c.fill();}
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function oval(c,x,y,rx,ry,color,rotation=0){
  c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,TAU);c.fill();
}
function contour(c,left,right,top,step=8,join=false){
  if(join)c.lineTo(left,top(left));else c.moveTo(left,top(left));
  for(let x=left+step;x<right;x+=step)c.lineTo(x,top(x));
  c.lineTo(right,top(right));
}
function strip(c,left,right,top,bottom){
  c.beginPath();contour(c,left,right,top);
  c.lineTo(right,bottom(right));
  for(let x=right-8;x>left;x-=8)c.lineTo(x,bottom(x));
  c.lineTo(left,bottom(left));c.closePath();
}

function makeSurface(w,h){
  // Tests and older WebViews can draw directly using the same painter. No DOM
  // or optional Canvas API is needed by any of the geometry functions.
  try{
    let canvas;
    if(typeof OffscreenCanvas==='function')canvas=new OffscreenCanvas(w,h);
    else if(typeof document!=='undefined'&&document.createElement)canvas=document.createElement('canvas');
    if(!canvas)return null;
    canvas.width=w;canvas.height=h;
    const context=canvas.getContext('2d');
    return context?{canvas,context}:null;
  }catch{return null;}
}
function cached(c,key,bounds,camera,paint){
  let item=cache.get(key);
  if(item){cache.delete(key);cache.set(key,item);}
  else{
    const surface=makeSurface(Math.ceil(bounds.w),Math.ceil(bounds.h));
    if(surface){
      const sc=surface.context;sc.save();sc.translate(-bounds.x,-bounds.y);paint(sc);sc.restore();
      item={...surface,bounds,pixels:surface.canvas.width*surface.canvas.height};
      while(cachedPixels+item.pixels>PIXEL_BUDGET&&cache.size){
        const first=cache.keys().next().value;cachedPixels-=cache.get(first).pixels;cache.delete(first);
      }
      if(item.pixels<=PIXEL_BUDGET){cache.set(key,item);cachedPixels+=item.pixels;}
    }
  }
  if(item){c.drawImage(item.canvas,item.bounds.x-camera,item.bounds.y);return;}
  c.save();c.translate(-camera,0);paint(c);c.restore();
}

function nativeTexture(c,left,right,top,bottom,alpha=.7){
  if(!terrainTexture)return;
  const sourceW=terrainTexture.naturalWidth??terrainTexture.width,sourceH=terrainTexture.naturalHeight??terrainTexture.height;
  const tileW=512,tileH=tileW*sourceH/sourceW;
  c.save();c.globalAlpha*=alpha;
  // Both axes are anchored to world coordinates. Panning never changes the
  // material sample, and no source is stretched into a narrow terrain strip.
  for(let ix=Math.floor(left/tileW);ix<Math.ceil(right/tileW);ix++){
    for(let iy=Math.floor(top/tileH);iy<Math.ceil(bottom/tileH);iy++){
      c.drawImage(terrainTexture,ix*tileW,iy*tileH,tileW,tileH);
    }
  }
  c.restore();
}

function hatch(c,left,right,top,bottom,seed,{light=false,spacing=12}={}){
  c.strokeStyle=light?'#d5c490':'#596344';c.lineWidth=light?.65:.8;c.beginPath();
  for(let n=Math.floor((left-35)/spacing);n<(right+35)/spacing;n++){
    const x=n*spacing,j=hash(n+seed)*10;
    for(let band=0;band<12;band++){
      const y=top(x)+11+band*27+j;
      if(y>bottom(x)-5)break;
      const reach=10+hash(n+seed+band*11)*17;
      c.moveTo(x,y);c.lineTo(x-reach*.47,y+reach);
    }
  }
  c.stroke();
}
function fractures(c,left,right,top,bottom,seed,count=5){
  c.strokeStyle=INK;c.lineWidth=1.4;c.beginPath();
  for(let n=Math.floor(left/112)-1;n<right/112+1;n++){
    const x=n*112+hash(n+seed)*51,y=top(x)+16+hash(n+seed+9)*28;
    let xx=x,yy=y;c.moveTo(xx,yy);
    for(let j=0;j<count;j++){
      xx+=(hash(n*7+j+seed)-.45)*24;yy+=9+hash(n+j+70)*18;
      if(yy>=bottom(xx)-4)break;
      c.lineTo(xx,yy);
      if(j===2){c.lineTo(xx+12,yy+5);c.moveTo(xx,yy);}
    }
  }
  c.stroke();
}
function engraving(c,left,right,top,bottom,seed){
  // Short, irregular cuts and pin dots, grouped into three paths. They are
  // baked once into the cached face rather than issued during animation.
  c.strokeStyle='#38382f';c.lineWidth=.55;c.beginPath();
  for(let ix=Math.floor(left/7)-1;ix<right/7+1;ix++){
    const x=ix*7,lo=top(x),hi=bottom(x);
    for(let iy=Math.floor(lo/7);iy<hi/7;iy++){
      const n=ix*79+iy*273+seed,r=hash(n);if(r<.39)continue;
      const xx=x+hash(n+1)*4,y=iy*7+hash(n+7)*4,len=2+r*5;
      c.moveTo(xx,y);c.lineTo(xx-len*.35,y+len);
      if(r>.86){c.moveTo(xx-2,y+len*.45);c.lineTo(xx+2,y+len*.72);}
    }
  }c.stroke();
  c.fillStyle='#282a24';c.beginPath();
  for(let ix=Math.floor(left/9)-1;ix<right/9+1;ix++){
    const x=ix*9;for(let iy=Math.floor(top(x)/9);iy<bottom(x)/9;iy++){
      const n=ix*151+iy*37+seed;if(hash(n)<.52)continue;
      c.rect(x+hash(n+4)*7,iy*9+hash(n+3)*7,.65+hash(n+8)*.7,.65);
    }
  }c.fill();
  c.strokeStyle='#ffebbd';c.lineWidth=.6;c.beginPath();
  for(let ix=Math.floor(left/17)-1;ix<right/17+1;ix++){
    const x=ix*17;for(let iy=Math.floor(top(x)/19);iy<bottom(x)/19;iy++){
      const n=ix*79+iy*71+seed;if(hash(n)<.55)continue;
      const y=iy*19+hash(n+7)*13;c.moveTo(x,y);c.lineTo(x+4+hash(n+9)*9,y-1.5);
    }
  }c.stroke();
}
function rockFacets(c,left,right,top,bottom,seed,scale=1){
  const cell=82*scale;
  for(let n=Math.floor(left/cell)-1;n<right/cell+1;n++){
    const x=n*cell+hash(n+seed)*cell*.23,y=top(x)+18+hash(n+seed+3)*24;
    const w=(30+hash(n+seed+7)*45)*scale,h=(18+hash(n+seed+15)*32)*scale;
    if(y+h>bottom(x))continue;
    polygon(c,[[x-w*.5,y+8],[x-w*.17,y],[x+w*.34,y+2],[x+w*.52,y+h*.6],[x+w*.15,y+h],[x-w*.42,y+h*.78]],
      n%3===0?LIGHT:STONE,'#424438',1.1);
    line(c,[[x-w*.17,y+1],[x-w*.02,y+h*.54],[x+w*.49,y+h*.6]],'#f6dfae',.9);
    line(c,[[x-w*.43,y+h*.75],[x-w*.02,y+h*.54],[x+w*.14,y+h]],'#4a4b3e',1);
    c.strokeStyle='#4b493b';c.lineWidth=.7;c.beginPath();
    for(let j=1;j<7;j++){
      const u=j/7,xx=x-w*.33+u*w*.56;
      c.moveTo(xx,y+7+u*7);c.lineTo(xx-w*.08,y+h*.54);
    }c.stroke();
  }
}
function stoneCap(c,left,right,top,depth,seed){
  const under=x=>top(x)+Math.max(1,depth(x)*(.68+hash(Math.floor(x/13)+seed)*.32));
  strip(c,left,right,top,under);c.fillStyle='#d4bb83';c.fill();
  c.save();strip(c,left,right,top,under);c.clip();
  // Chipped individual blocks share the true walking line while their lower
  // edges and gaps break the long pale stripe into small material changes.
  for(let n=Math.floor(left/31)-1;n<right/31+1;n++){
    const x=n*31+hash(n+seed)*5,w=25+hash(n+seed+1)*9;
    const a=top(x),b=top(x+w),h=Math.max(2,depth(x));
    polygon(c,[[x,a+1],[x+w,b+.5],[x+w-3,b+h*.76],[x+w*.59,top(x+w*.59)+h*.92],
      [x+w*.2,top(x+w*.2)+h*.7],[x-2,a+h*.6]],
      [PAPER,'#f5ddab','#d9be89',PAPER,'#e5ce98'][((n+seed)%5+5)%5],INK,.65);
  }
  c.strokeStyle=STONE;c.lineWidth=.8;c.beginPath();
  for(let n=Math.floor(left/29)-1;n<right/29+1;n++){
    const x=n*29+hash(n+seed)*9,y=top(x);
    c.moveTo(x,y+2);c.lineTo(x-5,y+13);c.moveTo(x-6,y+8);c.lineTo(x-16,y+9);
  }
  c.stroke();
  c.fillStyle='#625f4f';
  for(let n=Math.floor(left/13);n<right/13;n++){
    const x=n*13+hash(n+seed)*8;c.fillRect(x,top(x)+3+hash(n+7)*5,.8+hash(n)*1.7,.8);
  }
  c.restore();
  const points=[];for(let x=left;x<right;x+=8)points.push([x,top(x)]);points.push([right,top(right)]);
  line(c,points,INK,2.5);
  const edge=[];for(let x=left;x<right;x+=8)edge.push([x,under(x)]);edge.push([right,under(right)]);
  line(c,edge,'#454638',1.2);
}

function mossPockets(c,left,right,top,seed,scale=1){
  for(let n=Math.floor(left/91)-1;n<right/91+1;n++){
    const x=n*91+hash(n+seed)*37;
    if(x<left||x>right||hash(n+seed+4)<.33)continue;
    const y=top(x)+10*scale,r=(6+hash(n+seed+9)*8)*scale;
    c.fillStyle='#66754b';c.beginPath();
    for(let j=0;j<10;j++){
      const xx=x+(hash(n*17+j+seed)-.5)*r*2.6,yy=y+hash(n+j+7)*r*.5;
      const rr=(1.3+hash(n+j+19)*3.4)*scale;
      c.moveTo(xx+rr,yy);c.ellipse(xx,yy,rr,rr*.6,-.4,0,TAU);
    }c.fill();
    c.strokeStyle=INK;c.lineWidth=.85;c.beginPath();
    for(let j=0;j<4;j++){
      const xx=x+(j-1.5)*r*.45,yy=y+r*.1,len=(5+hash(n+j+11)*12)*scale;
      c.moveTo(xx,yy);c.quadraticCurveTo(xx-2,yy+len*.55,xx+Math.sin(n+j)*2,yy+len);
    }c.stroke();
    c.strokeStyle=LIGHT;c.lineWidth=.65;c.beginPath();
    for(let j=0;j<5;j++){
      const xx=x-r+j*r*.4;c.moveTo(xx,y);c.lineTo(xx+2,y-1);
    }c.stroke();
  }
}

function paintGround(c,left,right,bottom,groundAt=terrainHeight){
  c.save();strip(c,left,right,groundAt,()=>bottom);c.clip();
  c.fillStyle=STONE;c.fillRect(left,300,right-left,bottom-300);
  // Unequal bedding follows the real hills. Long light seams, deep cuts and
  // small fractured blocks make the soil a volume rather than a dark carpet.
  for(let band=0;band<5;band++){
    const offset=31+band*43;
    const bedding=x=>groundAt(x)+offset+Math.sin(x/(51+band*19)+band)*9;
    strip(c,left-2,right+2,bedding,()=>bottom+2);c.fillStyle=['#b7a375','#938a5b','#717748','#515f3b','#364b32'][band];c.fill();
    const points=[];for(let x=left-8;x<right+8;x+=12)points.push([x,bedding(x)]);
    line(c,points,band<2?'#515f40':'#c8b783',band<2?1.3:.8);
  }
  rockFacets(c,left,right,x=>groundAt(x)+7,x=>groundAt(x)+112,37);
  nativeTexture(c,left,right,300,bottom,.82);
  if(terrainTexture){
    const shade=c.createLinearGradient?.(0,500,0,bottom);
    if(shade?.addColorStop){
      shade.addColorStop(0,'#16171500');shade.addColorStop(.45,'#16171518');shade.addColorStop(1,'#161715a8');
      c.fillStyle=shade;c.fillRect(left,300,right-left,bottom-300);
    }
  }
  hatch(c,left,right,groundAt,x=>Math.min(bottom,groundAt(x)+175),29,{spacing:terrainTexture?24:10});
  hatch(c,left,right,x=>groundAt(x)+164,()=>bottom,63,{light:true,spacing:terrainTexture?29:14});
  fractures(c,left,right,groundAt,x=>Math.min(bottom,groundAt(x)+200),16,7);
  if(!terrainTexture)engraving(c,left,right,groundAt,()=>bottom,37);
  mossPockets(c,left,right,groundAt,42,.7);
  // Thin fossil-like cross sections break up the repeated bedding.
  if(!terrainTexture)for(let n=Math.floor(left/171)-1;n<right/171+1;n++){
    const x=n*171+hash(n+87)*54,y=groundAt(x)+86+hash(n+8)*97;
    polygon(c,[[x-25,y+2],[x-16,y-2],[x-7,y-1],[x+4,y-5],[x+22,y-4],[x+11,y],[x-4,y+4]],INK,null);
    line(c,[[x-18,y-2],[x-5,y-3],[x+12,y-5]],LIGHT,.75);
    c.strokeStyle='#e6d1a1';c.lineWidth=.7;c.beginPath();
    for(let j=0;j<6;j++){c.moveTo(x-12+j*5,y+7);c.lineTo(x-15+j*5,y+13);}c.stroke();
  }
  c.restore();
  stoneCap(c,left,right,groundAt,()=>9,21);
  // The playable edge stays readable: tiny split tufts never conceal a foot.
  c.strokeStyle=INK;c.lineWidth=1;c.beginPath();
  for(let n=Math.floor(left/78);n<right/78;n++){
    const x=n*78+hash(n+91)*22,y=groundAt(x)+1;
    if(scenarioAt(x).material==='concrete')continue;
    c.moveTo(x-2,y);c.lineTo(x-4,y-4);c.moveTo(x,y);c.lineTo(x+3,y-5);c.moveTo(x+2,y);c.lineTo(x+6,y-2);
  }
  c.stroke();
}

export function drawInkGround(c,g,{camera=0,width=1280,height=720}={}){
  const bottom=Math.max(960,Math.ceil((height+150)/64)*64);
  for(let n=Math.floor((camera-8)/TILE);n<Math.ceil((camera+width+8)/TILE);n++){
    const left=n*TILE-2,right=(n+1)*TILE+2;
    cached(c,`ground:${g.inkPreview?"ink":"v1"}:${n}:${bottom}`,{x:left,y:300,w:right-left,h:bottom-299},camera,
      sc=>paintGround(sc,left,right,bottom,g.groundAt??terrainHeight));
  }
  // Treads are in front of the soil, on the identical support coordinates
  // sampled by each wheel. Their stringers settle into rough stone feet.
  for(const p of g.platforms??[])for(const entry of p.walkableEntries??[]){
    if(entry.nativeArt)continue;
    const xs=entry.points.map(point=>point[0]),ys=entry.points.map(point=>point[1]);
    const lower=g.platforms.find(p=>p.id===entry.lowerId),lowerAt=x=>lower?surfaceHeight(lower,x):terrainAt(g,x);
    const left=Math.min(...xs)-26,right=Math.max(...xs)+26,top=Math.min(...ys)-4;
    let base=Math.max(...ys)+64;for(let x=left;x<=right;x+=40)base=Math.max(base,lowerAt(x)+22);
    if(right<camera-12||left>camera+width+12)continue;
    const signature=entry.points.flat().join(',');
    cached(c,`stair:${entry.id}:${entry.stepRun}:${signature}`,{x:left,y:top,w:right-left,h:base-top},camera,sc=>paintInkStairs(sc,entry,lowerAt));
  }
}

function paintInkStairs(c,entry,lowerAt){
  const treads=stairTreads(entry),first=entry.points[0],last=entry.points.at(-1),depth=38;
  // Two rooted piers tie the stair to its actual lower support. The gaps
  // remain open; the stringer is a built arch rather than loose stone tiles.
  for(const [i,u] of [.3,.7].entries()){
    const x=first[0]+(last[0]-first[0])*u,y=stairCenterHeight(entry,x)+depth,floor=lowerAt(x);
    if(floor-y<35)continue;
    const shape=[[x-12,y-5],[x+14,y-5],[x+11,y+22],[x+17,floor+5],[x+5,floor+13],[x-22,floor+7],[x-15,y+20]];
    polygon(c,shape,STONE,INK,1.7);c.save();polygon(c,shape,null,null);c.clip();
    nativeTexture(c,x-24,x+24,y-5,floor+16,.9);
    fractures(c,x-20,x+20,()=>y,()=>floor,17+i,5);c.restore();
    line(c,[[x-10,y+1],[x-9,floor-4]],LIGHT,1.1);
    root(c,x+9,y-2,x+27,floor+6,5.5,entry.points[0][0]+i);
  }
  const upper=[];
  for(const tread of treads)upper.push([tread.x1,tread.y],[tread.x2,tread.y]);
  upper.push([...last]);
  const lower=[...upper].reverse().map(([x,y],i)=>[x,y+depth+Math.sin(i*.8)*2]);
  const shape=[...upper,...lower],left=Math.min(first[0],last[0]),right=Math.max(first[0],last[0]);
  polygon(c,shape,STONE,INK,2);c.save();polygon(c,shape,null,null);c.clip();
  nativeTexture(c,left,right,Math.min(first[1],last[1]),Math.max(first[1],last[1])+depth+5,.92);
  hatch(c,left,right,x=>stairCenterHeight(entry,x)+5,x=>stairCenterHeight(entry,x)+depth,entry.points[0][0],{spacing:9});
  fractures(c,left,right,x=>stairCenterHeight(entry,x)+3,x=>stairCenterHeight(entry,x)+depth,37,3);
  c.restore();
  for(const [i,tread] of treads.entries()){
    const x1=Math.min(tread.x1,tread.x2),x2=Math.max(tread.x1,tread.x2),y=tread.y,w=x2-x1;
    polygon(c,[[x1,y],[x2,y],[x2-2,y+4],[x1+2,y+5]],PAPER,INK,.65);
    line(c,[[x1+2,y+2],[x2-3,y+2]],'#fff0c9',.8);
    line(c,[[x1+w*.18,y+7],[x1+w*.24,y+16],[x1+w*.12,y+25]],INK,.8);
    if(i%5===1)mossPockets(c,x1,x2,()=>y+depth-3,i+31,.5);
  }
  line(c,lower,INK,1.8);
}

function openingIntervals(p){
  if(inkLandmark(p))return [[0,1]];
  const authored=p.mass?.openings??p.openings;
  if(authored?.length)return authored;
  // Root arches and broken galleries have a clear lower passage even where
  // their rear-bank metadata describes a solid, non-colliding hillside.
  if(p.kind==='root-arch'||p.material==='rooted')return [[.13,.88]];
  if(p.material==='hull')return [[.12,.61],[.7,.94]];
  if(!p.mass)return [[.08,.94]];
  return [[.2,.83]];
}
function archGeometry(p,a,b){
  const landmark=inkLandmarkVault(p);if(landmark)return landmark;
  const left=p.x1+(p.x2-p.x1)*a,right=p.x1+(p.x2-p.x1)*b;
  const floor=x=>p.lower?surfaceHeight(p.lower,x):terrainHeight(x);
  const top=x=>{
    const u=clamp((x-left)/(right-left),0,1),ceiling=surfaceHeight(p,x)+routeThickness(p,x)+2;
    return floor(x)+5-Math.max(0,floor(x)-ceiling)*Math.sin(Math.PI*u)**.34;
  };
  return {left,right,top,floor};
}
function bankPath(c,p,left,right){
  const entry=surfaceHeight(p,p.x1),exit=surfaceHeight(p,p.x2);
  const floor=x=>p.lower?surfaceHeight(p.lower,x):terrainHeight(x);
  c.beginPath();c.moveTo(left,floor(left)+58);
  c.lineTo(left+(p.x1-left)*.16,floor(left)+6);
  c.lineTo(left+(p.x1-left)*.5,entry+(floor(left)-entry)*.57);
  c.lineTo(p.x1-36,entry+19);contour(c,p.x1,p.x2,x=>surfaceHeight(p,x),10,true);
  c.lineTo(p.x2+38,exit+16);c.lineTo(p.x2+(right-p.x2)*.58,exit+(floor(right)-exit)*.55);
  c.lineTo(right-20,floor(right)+9);c.lineTo(right,floor(right)+58);
  for(let x=right-20;x>left;x-=20)c.lineTo(x,floor(x)+65);c.closePath();
  for(const [a,b] of openingIntervals(p)){
    const arch=archGeometry(p,a,b);contour(c,arch.left,arch.right,arch.top,7);
    c.lineTo(arch.right,arch.floor(arch.right)+13);
    for(let x=arch.right-10;x>arch.left;x-=10)c.lineTo(x,arch.floor(x)+13);
    c.lineTo(arch.left,arch.floor(arch.left)+13);c.closePath();
  }
}
function masonry(c,left,right,top,bottom,seed){
  c.strokeStyle='#373a31';c.lineWidth=1.4;c.beginPath();
  for(let row=Math.floor(top/34);row<bottom/34;row++){
    const y=row*34+hash(row+seed)*4,offset=row%2*39;
    for(let n=Math.floor((left-90)/78);n<(right+90)/78;n++){
      const x=n*78+offset+hash(n+row+seed)*7;
      c.moveTo(x+3,y);c.lineTo(x+70,y+hash(n+seed)*2-1);
      c.moveTo(x,y+2);c.lineTo(x-2,y+30);
    }
  }
  c.stroke();
  c.strokeStyle='#f5dfaf';c.lineWidth=.65;c.beginPath();
  for(let row=Math.floor(top/34);row<bottom/34;row++){
    const y=row*34+5,offset=row%2*39;
    for(let n=Math.floor((left-60)/78);n<(right+60)/78;n++){
      const x=n*78+offset;c.moveTo(x+8,y);c.lineTo(x+39+hash(n+seed)*20,y-1);
    }
  }
  c.stroke();
}
function hullPlates(c,left,right,top,bottom,seed){
  c.strokeStyle=INK;c.lineWidth=1.4;c.beginPath();
  for(let n=Math.floor(left/104)-1;n<right/104+1;n++){
    const x=n*104;for(let y=Math.floor(top/55)*55;y<bottom;y+=55){
      c.moveTo(x+4,y+2);c.lineTo(x+99,y+2);c.lineTo(x+98,y+51);c.lineTo(x+4,y+51);c.closePath();
      c.moveTo(x+10,y+9);c.lineTo(x+43,y+9);c.moveTo(x+13,y+13);c.lineTo(x+13,y+36);
    }
  }c.stroke();
  c.fillStyle=INK;c.beginPath();
  for(let n=Math.floor(left/104)-1;n<right/104+1;n++){
    const x=n*104;for(let y=Math.floor(top/55)*55;y<bottom;y+=55){
      for(const dx of [9,94])for(const dy of [8,45]){c.moveTo(x+dx+1.5,y+dy);c.arc(x+dx,y+dy,1.5,0,TAU);}
    }
  }c.fill();
  fractures(c,left,right,()=>top,()=>bottom,seed,4);
}
function root(c,x,y,endX,endY,size,seed){
  const bend=(endX-x)*.3+Math.sin(seed)*9;
  c.lineCap='round';c.strokeStyle=INK;c.lineWidth=size;c.beginPath();c.moveTo(x,y);
  c.bezierCurveTo(x+bend,y+13,endX-bend*.45,endY-35,endX,endY);c.stroke();
  c.strokeStyle='#c69e72';c.lineWidth=Math.max(.9,size*.48);c.stroke();
  c.strokeStyle='#33392d';c.lineWidth=Math.max(.65,size*.12);c.beginPath();c.moveTo(x+size*.17,y);
  c.bezierCurveTo(x+bend+1,y+20,endX-bend*.45+1,endY-28,endX+1,endY);c.stroke();
  const point=u=>{
    const v=1-u;return [v*v*v*x+3*v*v*u*(x+bend)+3*v*u*u*(endX-bend*.45)+u*u*u*endX,
      v*v*v*y+3*v*v*u*(y+13)+3*v*u*u*(endY-35)+u*u*u*endY];
  };
  for(let j=0;j<11;j++){
    const u=.08+j*.078,[xx,yy]=point(u);
    line(c,[[xx-size*.27,yy-1],[xx+size*.25,yy+2]],'#4a493b',.8);
    if(j===4||j===8){
      const dir=j===4?-1:1,ex=xx+dir*(20+hash(seed+j)*23),ey=yy+23+hash(seed+j+2)*32;
      c.strokeStyle=INK;c.lineWidth=size*.33;c.beginPath();c.moveTo(xx,yy);
      c.bezierCurveTo(xx+dir*7,yy+6,ex-dir*5,ey-11,ex,ey);c.stroke();
      c.strokeStyle='#c69e72';c.lineWidth=size*.1;c.stroke();
      line(c,[[ex,ey],[ex+dir*9,ey+8]],INK,.7);
    }
  }
  c.lineCap='butt';
}
function archDetails(c,p){
  // The authored vault ring is painted once, after the physical roof face.
  if(inkLandmark(p))return;
  const rooted=p.material==='rooted'||p.material==='wetstone';
  for(const [a,b] of openingIntervals(p)){
    const arch=archGeometry(p,a,b),points=[];
    for(let x=arch.left;x<arch.right;x+=8)points.push([x,arch.top(x)]);points.push([arch.right,arch.top(arch.right)]);
    line(c,points,INK,rooted?9:5);
    line(c,points,rooted?STONE:LIGHT,rooted?2.1:1.2);
    // Radial joints turn the opening into an actual built vault.
    c.strokeStyle=INK;c.lineWidth=1.3;c.beginPath();
    for(let x=arch.left+15;x<arch.right-10;x+=rooted?16:25){
      const u=(x-arch.left)/(arch.right-arch.left),y=arch.top(x);
      c.moveTo(x,y-1);c.lineTo(x+(u-.5)*17,y-15-hash(x+p.seed)*8);
    }c.stroke();
  }
}
function paintFoundation(c,descriptor,bounds,groundAt,p){
  const foundation=descriptor.foundation;
  // These are rear bank faces, bounded by the existing cutout. The complete
  // native drawing covers their upper seams; the real ground covers the foot.
  // Separate pier spans retain every illustrated arch and lower passage.
  for(const [u,v] of foundation.spans??[[0,1]]){
    const left=bounds.x+bounds.w*u,right=bounds.x+bounds.w*v;
    const base=x=>groundAt(x)+24;
    const top=x=>Math.min(base(x)-2,foundation.route&&p?surfaceHeight(p,clamp(x,p.x1,p.x2))+1:bounds.y+bounds.h*foundation.top);
    let high=Math.min(top(left),top(right)),low=Math.max(base(left),base(right));
    for(let x=left;x<right;x+=16){high=Math.min(high,top(x));low=Math.max(low,base(x));}
    c.save();strip(c,left,right,top,base);c.fillStyle=STONE;c.fill();c.clip();
    rockFacets(c,left,right,x=>top(x)+12,base,descriptor.bounds.x,1.1);
    if(!terrainTexture){
      hatch(c,left,right,top,base,descriptor.bounds.x,{spacing:15});
      engraving(c,left,right,top,base,descriptor.bounds.x);
    }
    // The same world-registered native stone continues into the lower earth.
    // It covers the fallback facets, so exposed fringes never become bright
    // vector patches against the much denser engraved landmark.
    nativeTexture(c,left,right,high,low,.98);
    fractures(c,left,right,top,base,descriptor.bounds.x,4);
    c.restore();
  }
}

function paintCampaignFoundation(c,descriptor,bounds,groundAt){
  let top=bounds.y+bounds.h*descriptor.foundation.top,bottom=top;
  const ground=[];
  for(let x=bounds.x;x<=bounds.x+bounds.w+16;x+=16){
    const xx=Math.min(x,bounds.x+bounds.w),y=groundAt(xx)+24;
    ground.push(y);top=Math.min(top,y-2);bottom=Math.max(bottom,y);
  }
  const face={x:Math.floor(bounds.x),y:Math.floor(top),w:Math.ceil(bounds.w)+1,h:Math.ceil(bottom-top)+1};
  const key=`foundation:${descriptor.asset}:${bounds.x}:${bounds.y}:${bounds.w}:${bounds.h}:${ground.join(',')}`;
  cached(c,key,face,0,sc=>paintFoundation(sc,descriptor,bounds,groundAt));
}

function paintRoute(c,p,bounds){
  // The native terrace is the entire landmark, including its tree/building,
  // vault and roots. The lower earth path is painted in front of its rear
  // abutments; the upper path follows the artwork's measured walking edge.
  if(p.inkNative){
    paintInkLandmarkGrounding(c,p,paintFoundation);
    if(paintInkLandmarkArt(c,p,'none'))return;
  }
  const left=bounds.x+4,right=bounds.x+bounds.w-4,top=bounds.y+5,bottom=bounds.y+bounds.h-5;
  const rooted=p.material==='rooted'||p.material==='wetstone';
  c.save();bankPath(c,p,left,right);c.fillStyle=p.material==='hull'?'#d4bc9e':rooted?'#bca474':STONE;c.fill('evenodd');
  c.strokeStyle=INK;c.lineWidth=2.4;c.stroke();bankPath(c,p,left,right);c.clip('evenodd');
  if(inkLandmark(p))paintInkLandmarkCliff(c,p,{x:left,y:top,w:right-left,h:bottom-top});
  else if(p.material==='hull')hullPlates(c,left,right,top,bottom,p.seed??0);
  else if(p.material==='concrete'||p.material==='breachstone')masonry(c,left,right,top,bottom,p.seed??0);
  else{
    rockFacets(c,left,right,x=>surfaceHeight(p,clamp(x,p.x1,p.x2))+5,()=>bottom,p.seed??0,1.4);
    fractures(c,left,right,()=>top,()=>bottom,p.seed??0,9);
    // Oblique bedding and scratched highlights remain visible through roots.
    for(let band=0;band<6;band++){
      const points=[];for(let x=left;x<right;x+=18)points.push([x,top+40+band*49+Math.sin(x/83+band)*15]);
      line(c,points,band%2?'#596747':'#ebd4a4',band%2?1.4:.8);
    }
  }
  nativeTexture(c,left,right,top,bottom,inkLandmark(p)?.28:p.material==='hull'?.75:.84);
  if(inkLandmark(p))paintInkLandmarkArt(c,p,'mass');
  hatch(c,left,right,()=>top,()=>bottom,p.seed??0,{spacing:terrainTexture?25:11});
  // Dense broken ink at fractures and abutments gives the bank the same
  // carved shadows as the cliff illustration, with pale cuts inside the ink.
  if(!terrainTexture)for(let n=Math.floor(left/143)-1;n<right/143+1;n++){
    const x=n*143+hash(n+(p.seed??0))*40,y=surfaceHeight(p,clamp(x,p.x1,p.x2))+27+hash(n+8)*23;
    const w=28+hash(n+3)*32,h=22+hash(n+7)*39;
    polygon(c,[[x,y],[x+w*.26,y+5],[x+w*.21,y+h*.4],[x+w,y+h],[x+w*.17,y+h*.67],[x-4,y+h*.3]],'#424033',null);
    line(c,[[x+2,y+7],[x+5,y+h*.38],[x+w*.66,y+h*.81]],LIGHT,.8);
  }
  if(!terrainTexture)engraving(c,left,right,()=>top,()=>bottom,(p.seed??0)+109);
  mossPockets(c,p.x1,p.x2,x=>surfaceHeight(p,x),(p.seed??0)+39,rooted?1.1:.8);
  archDetails(c,p);
  if(rooted&&(!terrainTexture||inkLandmark(p))){
    for(const u of [.035,.16,.73,.94]){
      const x=p.x1+(p.x2-p.x1)*u,y=surfaceHeight(p,x)+5;
      const end=x+(u<.5?-1:1)*(45+hash(x)*70),floor=p.lower?surfaceHeight(p.lower,end):terrainHeight(end);
      root(c,x,y,end,floor+20,10+hash(x+5)*11,x);
      root(c,x+5,y+3,end+(u<.5?-22:26),floor+35,3.7,x+4);
    }
  }
  c.restore();

  let nativeLandmark=false;
  if(inkLandmark(p)){
    // Buildings stand behind the walking lip; the native bridge face remains
    // clipped to its bank so it cannot paint across the lower passage.
    nativeLandmark=paintInkLandmarkArt(c,p,'none');
    if(!nativeLandmark)paintInkObservatory(c,p);
    paintInkLandmarkFoliage(c,p);
  }

  const cap=x=>surfaceHeight(p,x),under=x=>cap(x)+routeThickness(p,x);
  // The near roof face is the physical depth, and is drawn independently of
  // the rear bank. Every lip and underside therefore matches collision.
  c.save();strip(c,p.x1,p.x2,cap,under);c.clip();
  c.fillStyle=rooted?'#d4bc88':p.material==='hull'?'#dfc6a4':LIGHT;c.fillRect(p.x1,top,p.x2-p.x1,bottom-top);
  if(inkLandmark(p))paintInkLandmarkCliff(c,p,{x:p.x1,y:top,w:p.x2-p.x1,h:bottom-top});
  else if(p.material==='hull')hullPlates(c,p.x1,p.x2,top,bottom,p.seed??0);
  else if(!rooted)masonry(c,p.x1,p.x2,top,bottom,p.seed??0);
  nativeTexture(c,p.x1,p.x2,top,bottom,inkLandmark(p)?.2:.86);
  if(inkLandmark(p)){
    // A mass cutout also supplies the near face. Otherwise the later physical
    // roof painter would erase its painted roots and vault stones.
    nativeLandmark=paintInkLandmarkArt(c,p,'roof')||paintInkLandmarkArt(c,p,'mass')||paintInkLandmarkArt(c,p,'none')||nativeLandmark;
  }
  hatch(c,p.x1,p.x2,cap,under,(p.seed??0)+9,{spacing:terrainTexture?19:8});
  fractures(c,p.x1,p.x2,cap,under,(p.seed??0)+16,4);
  if(!terrainTexture)engraving(c,p.x1,p.x2,cap,under,(p.seed??0)+21);
  mossPockets(c,p.x1,p.x2,cap,(p.seed??0)+17,rooted?1:.6);
  if(rooted&&!terrainTexture){
    for(let x=p.x1+35;x<p.x2-30;x+=107){
      const y=cap(x)+16;root(c,x,y,x+67,cap(x+67)+Math.min(31,routeThickness(p,x+67)-3),4.7,x);
    }
  }
  c.restore();
  if(inkLandmark(p)&&!nativeLandmark){
    c.save();strip(c,p.x1,p.x2,cap,under);c.clip();
    paintInkVoussoirs(c,p);paintInkBridgeRoots(c,p);c.restore();
  }
  const underside=[];for(let x=p.x1;x<p.x2;x+=8)underside.push([x,under(x)]);underside.push([p.x2,under(p.x2)]);
  line(c,underside,INK,2.4);
  stoneCap(c,p.x1,p.x2,cap,x=>Math.min(11,Math.max(1,routeThickness(p,x)-1)),p.seed??0);

  // A few restrained plant forms tie the entrance to the illustrated bank.
  // They remain below the walking contour and cannot hide a standing actor.
  if(rooted){
    for(const u of [.07,.9]){
      const x=p.x1+(p.x2-p.x1)*u,y=surfaceHeight(p,x)+12;
      for(let j=0;j<5;j++)oval(c,x+j*4,y+2+Math.sin(j)*3,5.8,2.2,'#66754b',-.6+j*.18);
    }
  }
}
function routeBounds(p){
  const left=p.x1-(p.mass?.left??65),right=p.x2+(p.mass?.right??95);
  let top=Infinity,bottom=-Infinity;
  for(let x=left;x<=right;x+=24){
    top=Math.min(top,surfaceHeight(p,clamp(x,p.x1,p.x2)));
    bottom=Math.max(bottom,p.lower?surfaceHeight(p.lower,x):terrainHeight(x));
  }
  top=Math.min(top,surfaceHeight(p,p.x2));
  const artBounds=inkLandmarkBounds(p),x=Math.min(left-4,artBounds?.x??left),y=Math.min(top-7,artBounds?.y??top);
  const end=Math.max(right+4,artBounds?artBounds.x+artBounds.w:right),base=Math.max(bottom+76,artBounds?artBounds.y+artBounds.h:bottom);
  return {x:Math.floor(x),y:Math.floor(y),w:Math.ceil(end-x),h:Math.ceil(base-y)};
}
export function drawInkRoutes(c,g,{camera=0,width=1280}={}){
  const routes=[...(g.platforms??[])].sort((a,b)=>(a.tier??1)-(b.tier??1));
  for(const p of routes){
    if(p.inkNative&&sharedNativeRoutes.has(p.id))continue;
    const bounds=routeBounds(p);
    if(bounds.x+bounds.w<camera-25||bounds.x>camera+width+25)continue;
    const signature=[p.id,p.seed,p.material,p.kind,p.x1,p.x2,p.bodyDepth,p.points?.flat().join(','),p.profile?.join(','),p.mass?.kind,p.mass?.left,p.mass?.right,JSON.stringify(p.mass?.openings??p.openings)].join(':');
    cached(c,`route:${signature}`,bounds,camera,sc=>paintRoute(sc,p,bounds));
  }
  c.save();c.translate(-camera,0);paintInkCampaignScenery(c,g,camera-30,camera+width+30,paintCampaignFoundation);c.restore();
}

function rivet(c,x,y,r=1.6){oval(c,x,y,r,r,INK);oval(c,x-.35,y-.35,r*.37,r*.37,PAPER);}
function objectHatch(c,w,h,seed){
  hatch(c,-w/2,w/2,()=>-h,()=>2,seed,{spacing:7});
  engraving(c,-w/2,w/2,()=>-h,()=>2,seed);
  c.strokeStyle='#f0d9a9';c.lineWidth=.7;c.beginPath();
  for(let n=0;n<8;n++){
    const x=(hash(seed+n)-.5)*w*.9,y=-h*(.1+hash(seed+n+11)*.8);
    c.moveTo(x,y);c.lineTo(x+6,y-3);c.moveTo(x+1,y+2);c.lineTo(x+8,y-1);
  }c.stroke();
}
function objectWeathering(c,w,h,seed,metal){
  // Small clustered pits, cross cuts and worn edges keep the plates at the
  // same engraving scale as the native ruins, rather than clean UI blocks.
  for(const [color,width,light] of [[INK,.65,false],[PAPER,.55,true]]){
    c.strokeStyle=color;c.lineWidth=width;c.beginPath();
    for(let row=0;row<h/5;row++)for(let column=0;column<w/5;column++){
      const n=seed+row*73+column*131,r=hash(n);if(r<(light?.76:.45))continue;
      const x=-w*.36+column*3.6+hash(n+1)*2,y=-h+9+row*4.2;
      if(y>-h*.12)continue;
      c.moveTo(x,y);c.lineTo(x-1-r*2.3,y+1.5+r*2.5);
      if(!light&&r>.87){c.moveTo(x-1,y+3);c.lineTo(x+2,y+4);}
    }c.stroke();
  }
  if(metal){
    for(let i=0;i<6;i++){
      const x=(hash(seed+i*7)-.5)*w*.68,y=-h*(.18+hash(seed+i+13)*.65),r=1.1+hash(seed+i+19)*1.6;
      polygon(c,[[x-r,y],[x+r*.8,y-1],[x+r,y+r],[x,y+r*2.2],[x-r*.7,y+r]],'#9b7751',null);
      line(c,[[x-r,y-.8],[x+r*.5,y-1]],PAPER,.65);
    }
    for(const side of [-1,1])line(c,[[side*w*.43,-h+9],[side*w*.39,-h*.55],[side*w*.4,-h*.14]],INK,1.1);
  }
}
function paintObstacle(c,o,support){
  const {x,y,w,h}=o,seed=(o.x??0)*.17+(o.type==='rock'?19:41);
  let shell;
  c.save();c.translate(x,y);
  // Keep the authored horizontal collision top. A narrow packed-stone bed
  // meets the actual sloping floor; the floor clips the uphill side of it.
  const feet=support.map(([xx,yy])=>[xx-x,yy-y]);
  c.beginPath();c.moveTo(-w/2-4,-h-4);c.lineTo(w/2+4,-h-4);
  c.lineTo(w/2+4,feet.at(-1)[1]);
  for(const point of [...feet].reverse())c.lineTo(...point);
  c.lineTo(-w/2-4,feet[0][1]);c.closePath();c.clip();
  const bed=[[-w/2,-4],[w/2,-4],...[...feet].reverse()];
  polygon(c,bed,STONE,INK,1.1);
  c.save();polygon(c,bed,null,null);c.clip();
  c.translate(-x,-y);nativeTexture(c,x-w/2,x+w/2,y-8,Math.max(y,...support.map(p=>p[1]))+2,.8);c.restore();
  if(o.type==='rock'){
    const shape=[[-w/2,-h],[w/2,-h],[w*.49,-h*.58],[w*.39,-h*.11],[w*.11,0],[-w*.39,-2],[-w*.49,-h*.26]];
    polygon(c,shape,STONE,INK,2.6);c.save();polygon(c,shape,null,null);c.clip();
    c.save();c.translate(-x,-y);nativeTexture(c,x-w/2,x+w/2,y-h,y,.45);c.restore();
    polygon(c,[[-w/2,-h],[w*.1,-h],[w*.03,-h*.49],[-w*.39,-h*.22]],LIGHT,'#3f4237',1.3);
    polygon(c,[[w*.1,-h],[w/2,-h],[w*.49,-h*.58],[w*.16,-h*.25],[w*.03,-h*.49]],'#aa9466','#353b31',1.3);
    line(c,[[-w*.39,-h*.22],[w*.03,-h*.49],[w*.16,-h*.25],[w*.11,-2]],INK,1.4);
    objectHatch(c,w,h,seed);
    c.save();c.translate(-x,-y);nativeTexture(c,x-w/2,x+w/2,y-h,y,.68);c.restore();
    fractures(c,-w/2,w/2,()=>-h,()=>0,seed,4);c.restore();
    line(c,[[-w/2+2,-h+2],[-w*.13,-h+2],[-w*.08,-h+4],[w*.35,-h+2]],PAPER,1.1);
  }else if(o.type==='barricade'){
    shell=[[-w/2,-h],[w/2,-h],[w*.48,-h*.19],[w/2,-1],[-w/2,-1],[-w*.45,-h*.3]];
    polygon(c,shell,'#a9a789',INK,2.7);
    c.save();c.beginPath();c.rect(-w/2+2,-h+2,w-4,h-4);c.clip();objectHatch(c,w,h,seed);
    for(let j=-2;j<5;j++)polygon(c,[[-w/2+j*31,-h+8],[-w/2+j*31+13,-h+8],[-w/2+j*31+35,-10],[-w/2+j*31+21,-10]],DARK,null);
    c.restore();c.fillStyle=LIGHT;c.fillRect(-w/2+1,-h+1,w-2,6);c.fillRect(-w/2+1,-8,w-2,6);
    line(c,[[-w/2,-h+8],[w/2,-h+8]],INK,1.6);line(c,[[-w/2,-9],[w/2,-9]],INK,1.7);
    for(const xx of [-w*.42,w*.42])for(const yy of [-h+4,-5])rivet(c,xx,yy);
  }else if(o.type==='checkpoint'){
    shell=[[-w/2,-h],[w/2,-h],[w/2,-h*.74],[w*.38,-h*.68],[w*.4,-2],[-w*.43,-2],[-w*.4,-h*.67],[-w/2,-h*.73]];
    polygon(c,shell,'#b3b18c',INK,2.7);
    c.save();c.beginPath();c.rect(-w/2+1,-h+1,w-2,h-2);c.clip();objectHatch(c,w,h,seed);c.restore();
    c.fillStyle=PAPER;c.fillRect(-w/2+1,-h+1,w-2,7);
    polygon(c,[[-w*.34,-h*.72],[w*.32,-h*.72],[w*.29,-h*.18],[-w*.31,-h*.18]],DARK,INK,2);
    c.fillStyle=LIGHT;c.fillRect(-w*.27,-h*.64,w*.52,3);c.fillRect(-w*.27,-h*.54,w*.52,2);
    for(let j=0;j<4;j++){c.fillStyle=INK;c.fillRect(-w*.25+j*w*.14,-h*.45,w*.07,h*.19);}
    for(const xx of [-w*.4,w*.4])for(const yy of [-h+14,-h*.12])rivet(c,xx,yy,1.8);
    line(c,[[-w*.3,-h*.13],[w*.3,-h*.13]],INK,2);
    // An enamel checkpoint disk echoes the round observatory windows behind it.
    oval(c,0,-h*.36,9,9,PAPER);c.strokeStyle=INK;c.lineWidth=1.4;c.beginPath();c.arc(0,-h*.36,9,0,TAU);c.stroke();
    c.fillStyle=INK;c.fillRect(-6,-h*.36-1.5,12,3);
  }else{
    shell=[[-w/2,-h],[w/2,-h],[w*.49,-h*.31],[w*.39,-2],[-w*.43,-1],[-w*.5,-h*.38]];
    polygon(c,shell,'#969e88',INK,2.7);
    c.save();c.beginPath();c.rect(-w/2+2,-h+2,w-4,h-4);c.clip();objectHatch(c,w,h,seed);c.restore();
    polygon(c,[[-w*.43,-h*.8],[w*.4,-h*.8],[w*.29,-h*.28],[-w*.36,-h*.22]],'#8b936a',INK,1.7);
    line(c,[[-w*.4,-h*.64],[w*.36,-h*.64]],PAPER,1.3);
    for(let j=0;j<4;j++)line(c,[[-w*.25+j*w*.15,-h*.58],[-w*.25+j*w*.15,-h*.3]],INK,3);
    c.fillStyle=PAPER;c.fillRect(-w/2+1,-h+1,w-2,5);
    for(const xx of [-w*.43,w*.43])for(const yy of [-h+10,-h*.15])rivet(c,xx,yy);
    line(c,[[w*.15,-h+7],[w*.1,-h*.73],[w*.21,-h*.65]],INK,1.2);
  }
  if(shell){
    c.save();polygon(c,shell,null,null);c.clip();c.translate(-x,-y);
    paintInkSalvageGrain(c,{x:x-w/2,y:y-h,w,h});c.restore();
  }
  objectWeathering(c,w,h,seed,o.type!=='rock');
  line(c,[[-w/2,-h],[w/2,-h]],INK,2.3);
  line(c,feet,INK,2.8);c.restore();
}
export function drawInkObstacles(c,g,{camera=0,width=1280}={}){
  for(const o of g.obstacles??[]){
    if(o.hp<=0||o.x+o.w/2<camera-12||o.x-o.w/2>camera+width+12)continue;
    const platform=(g.platforms??[]).find(p=>p.id===o.platformId);
    const supportAt=platform?x=>surfaceHeight(platform,clamp(x,platform.x1,platform.x2)):g.groundAt?x=>terrainAt(g,x):()=>o.y;
    const support=[];for(let x=o.x-o.w/2;x<o.x+o.w/2;x+=8)support.push([x,supportAt(x)]);
    support.push([o.x+o.w/2,supportAt(o.x+o.w/2)]);
    const top=Math.floor(o.y-o.h)-4,bottom=Math.max(o.y,...support.map(p=>p[1]))+5;
    const bounds={x:Math.floor(o.x-o.w/2)-4,y:top,w:Math.ceil(o.w)+8,h:Math.ceil(bottom-top)};
    c.save();if(o.hit>0)c.globalAlpha=.72;
    cached(c,`obstacle:${o.id}:${o.type}:${o.x}:${o.y}:${o.w}:${o.h}:${support.flat().join(',')}`,bounds,camera,sc=>paintObstacle(sc,o,support));c.restore();
  }
}

function frond(c,x,y,size,lean,seed){
  c.save();c.translate(x,y);c.rotate(lean);
  c.strokeStyle=INK;c.lineWidth=1.7;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-size*.12,-size*.5,0,-size);c.stroke();
  for(let j=1;j<8;j++){
    const u=j/8,yy=-size*u,w=size*.2*Math.sin(Math.PI*u);
    for(const dir of [-1,1])polygon(c,[[0,yy],[dir*w*.68,yy-size*.15],[dir*w,yy-size*.19],[dir*w*.86,yy-size*.045],[0,yy+1]],INK,null);
  }
  line(c,[[0,-2],[-size*.025,-size*.65]],STONE,.65);c.restore();
}
export function drawInkForeground(c,g,{camera=0,width=1280,height=720,time=0}={}){
  // World-anchored, low near foliage leaves the actor silhouette and touch
  // controls clear. No screen-wide black vignette conceals the engraved soil.
  const left=camera-40,right=camera+width+40,player=g.player;
  c.save();c.translate(-camera,0);
  for(let n=Math.floor(left/267);n<right/267;n++){
    const x=n*267+hash(n+51)*83,y=terrainAt(g,x)+77;
    const size=25+hash(n+71)*25;
    frond(c,x,y,size,-.65+hash(n)*.28,n);
    frond(c,x+4,y+2,size*.82,.36+hash(n+1)*.4,n+1);
    frond(c,x-2,y+2,size*.69,-.1,n+3);
    oval(c,x+1,y,10,3,INK);
  }
  // The occasional split root stays under the cap, and sways only a fraction
  // of a pixel. Static detail is cached; these few living marks are cheap.
  for(const p of g.platforms??[]){
    if(inkLandmark(p)&&p.x2+400>left&&p.x1-350<right)paintInkLandmarkFoliage(c,p,{foreground:true,player,world:g});
    if(p.material!=='rooted'&&p.material!=='wetstone')continue;
    for(const u of [.22,.8]){
      const x=p.x1+(p.x2-p.x1)*u;
      if(x<left||x>right)continue;
      const y=surfaceHeight(p,x)+routeThickness(p,x),bend=Math.sin(time*.6+x)*.7;
      line(c,[[x,y-1],[x+bend,y+5],[x-2+bend,y+9]],INK,.8);
    }
  }
  c.restore();
}
