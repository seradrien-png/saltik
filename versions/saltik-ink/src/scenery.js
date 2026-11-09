import {terrainHeight,surfaceHeight,routeThickness,scenarioAt,EXPEDITION_SCENARIOS} from './world.js';
const TAU=Math.PI*2;
const hash=n=>{const a=Math.sin(n*127.1+311.7)*43758.5453;return a-Math.floor(a);};
const foliage=['#304c2b','#486338','#688345','#8a9c56','#b0ad69'];
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function ellipse(c,x,y,rx,ry,color,angle=0){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);c.fill();}
function fern(c,x,y,size,seed,t=0){
  const angle=(hash(seed)-.5)*.6+Math.sin(t*.65+seed)*.018;
  c.save();c.translate(x,y);c.rotate(angle);
  for(let b=0;b<5;b++){
    const lean=(b-2)*.37,reach=size*(.69+hash(seed+b)*.35);c.save();c.rotate(lean);c.strokeStyle='#758456';c.lineWidth=.8;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(7,-reach*.6,0,-reach);c.stroke();
    for(let i=1;i<8;i++){const u=i/8,w=reach*.19*Math.sin(u*Math.PI),yy=-u*reach,color=foliage[(i+b)%4];poly(c,[[1,yy],[w,yy-reach*.16],[w*.78,yy-1],[0,yy+2]],color);poly(c,[[0,yy],[-w,yy-reach*.15],[-w*.82,yy-1],[0,yy+2]],color);}
    c.restore();
  }
  c.restore();
}
function shrub(c,x,y,size,seed){
  // Small overlapping leaves, with darker volume beneath the lit tips.
  for(let i=0;i<54;i++){
    const xx=x+(hash(seed+i)-.5)*size*1.8,yy=y-hash(seed+i+29)*size*.6,r=size*(.035+hash(i+seed*2)*.055);
    ellipse(c,xx,yy,r*1.45,r*.55,foliage[i%4],(hash(i)-.5)*1.5);
    if(i%5===0)ellipse(c,xx-r*.2,yy-r*.2,r*.45,r*.15,'#929c62',-.4);
  }
}
function vine(c,x,y,length,seed,t){
  const bend=Math.sin(seed)*12+Math.sin(t*.5+seed)*2;
  c.strokeStyle='#263d29';c.lineWidth=5;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+bend,y+length*.25,x-bend,y+length*.72,x+bend*.3,y+length);c.stroke();
  c.strokeStyle='#849462';c.lineWidth=1.4;c.stroke();
  for(let j=0;j<length/9;j++){
    const f=j/(length/9),xx=x+Math.sin(f*TAU)*bend*.37,yy=y+j*9,side=j%2?1:-1;
    ellipse(c,xx+side*4,yy+1,6.3,3.4,'#294b30',side*-.6);
    ellipse(c,xx+side*4,yy,5.2,2.5,j%3?'#4a6a36':'#788c49',side*-.6);
  }
}
function roots(c,x,y,size,seed){
  for(let k=0;k<4;k++){const dir=k%2?1:-1,dx=dir*size*(.3+hash(seed+k)*.7),dy=size*(.6+hash(seed+k+5)*.5);c.strokeStyle=k%2?'#3f4831':'#646044';c.lineWidth=1.8-k*.27;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+dx*.1,y+dy*.1,x+dx*.2,y+dy*.8,x+dx,y+dy);c.stroke();c.strokeStyle='#92815744';c.lineWidth=.4;c.stroke();}
}
function traceTop(c,left,right,height,camera){
  c.moveTo(left-camera,height(left));
  for(let x=left+8;x<right;x+=8)c.lineTo(x-camera,height(x));
  c.lineTo(right-camera,height(right));
}
function slabPath(c,left,right,height,bottom,camera){
  c.beginPath();traceTop(c,left,right,height,camera);
  c.lineTo(right-camera,bottom(right));
  for(let x=right-8;x>left;x-=8)c.lineTo(x-camera,bottom(x));
  c.lineTo(left-camera,bottom(left));c.closePath();
}
function nativeTiles(c,image,left,right,top,camera,scale=.5,crop=null){
  if(!image)return;
  const source=crop??{x:0,y:0,w:image.width,h:image.height},span=source.w*scale,h=source.h*scale;
  // A world-anchored native scale keeps rocks and roots recognizable. Only the
  // silhouette clips the image; the art is never bent into affine road strips.
  for(let x=Math.floor(left/span)*span;x<right;x+=span)c.drawImage(image,source.x,source.y,source.w,source.h,x-camera,top,span,h);
}
function rockTexture(c,images,left,right,top,bottom,camera,seed){
  const texture=images['cliff-texture'];
  if(texture)nativeTiles(c,texture,left,right,top,camera,.52);
  // Long, discontinuous fractures follow stone bedding without a panel grid.
  for(let band=0;band<4;band++){
    const yy=top+28+band*64;c.strokeStyle=band%2?'#122c2344':'#b4ad842b';c.lineWidth=1.2;
    c.beginPath();c.moveTo(left-camera,yy);
    for(let x=left+24;x<=right;x+=24)c.lineTo(x-camera,yy+Math.sin(x/139+seed+band)*7);c.stroke();
  }
}
function soilCrown(c,images,left,right,height,bottom,camera,seed,originY){
  c.save();slabPath(c,left,right,height,bottom,camera);c.clip();
  c.fillStyle='#827454';c.fillRect(left-camera,originY,right-left,600);
  const image=images['ground-surface'];
  if(image)nativeTiles(c,image,left,right,originY,camera,.52);
  else for(let n=Math.floor(left/15);n<right/15;n++){const wx=n*15+hash(n+seed)*5;ellipse(c,wx-camera,height(wx)+3,1+hash(n)*2,.7,'#b2a17b');}
  c.fillStyle='#3f543022';c.fillRect(left-camera,originY,right-left,600);c.restore();
}
function vegetation(c,left,right,height,camera,seed,t,{dense=false}={}){
  for(let n=Math.floor(left/73);n<right/73;n++){
    const wx=n*73+hash(n+seed)*18;if(wx<left||wx>right)continue;
    const x=wx-camera,y=height(wx),h=3+hash(n+9)*7;
    for(let b=0;b<3;b++){const lean=(hash(n+b+seed)-.5)*9;c.strokeStyle=foliage[(n+b+5000)%4];c.lineWidth=.8;c.beginPath();c.moveTo(x+b*2,y+1);c.quadraticCurveTo(x+b*2+lean,y-h*.5,x+b*2+lean,y-h*(.5+b*.3));c.stroke();}
    if(dense&&hash(n+seed)>.72)fern(c,x,y,15+hash(n)*10,n+seed,t);
  }
}
function fallingWater(c,x,top,bottom,width,t,seed){
  if(bottom<=top)return;
  c.save();const water=c.createLinearGradient(x-width/2,0,x+width/2,0);
  water.addColorStop(0,'#c1e8d500');water.addColorStop(.3,'#a9d7c13a');water.addColorStop(.6,'#d2f0dc6a');water.addColorStop(1,'#92c7c000');
  c.fillStyle=water;c.fillRect(x-width/2,top,width,bottom-top);
  for(let i=0;i<9;i++){const y=top+(t*91+i*27+seed)%(bottom-top),xx=x+(hash(i+seed)-.5)*width*.65;c.strokeStyle=i%3?'#d8f4e02b':'#eaffed66';c.lineWidth=i%3?1:2;c.beginPath();c.moveTo(xx,y);c.lineTo(xx-1,y+8+hash(i)*16);c.stroke();}
  ellipse(c,x,bottom,width*.85,5,'#b7e1c72d');c.restore();
}
function massCrown(p,upper,x){
  const core=surfaceHeight(p,x);
  if(!upper)return core;
  const blend=Math.min(1,Math.max(0,(x-upper.x1+135)/135),Math.max(0,(upper.x2+175-x)/175));
  return core+(surfaceHeight(upper,x)-core)*blend;
}
function landformOutline(c,p,upper,camera){
  const left=p.x1-p.mass.left,right=p.x2+p.mass.right;
  const crown=x=>massCrown(p,upper,x),entry=crown(p.x1),exit=crown(p.x2);
  // Broad unequal slopes bury the route in one bank instead of balancing a
  // strip on supports. Their shoulders belong to the rear cliff plane.
  const points=[
    [left-camera,terrainHeight(left)+90],
    [left-camera+p.mass.left*.16,terrainHeight(left+p.mass.left*.16)+10],
    [left-camera+p.mass.left*.47,entry+(terrainHeight(left)-entry)*.6],
    [p.x1-camera-58,entry+24],[p.x1-camera,entry]
  ];
  for(let x=p.x1+12;x<p.x2;x+=12)points.push([x-camera,crown(x)]);
  points.push([p.x2-camera,exit],[p.x2-camera+65,exit+17],
    [p.x2-camera+p.mass.right*.5,exit+(terrainHeight(right)-exit)*.48],
    [right-camera-33,terrainHeight(right)+8],[right-camera,terrainHeight(right)+100]);
  for(let x=right-32;x>left;x-=32)points.push([x-camera,terrainHeight(x)+115]);
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
  return {left,right,top:Math.min(...points.map(q=>q[1]))};
}
function paintLandform(c,images,p,upper,camera,bounds){
  const {left,right,top}=bounds,middle=(p.x1+p.x2)/2;
  rockTexture(c,images,left,right,top-26,terrainHeight(middle)+150,camera,p.seed);
  // Only geological material belongs to a bank face. Intact hulls and ancient
  // buildings are drawn once on the landmark plane, with their native alpha;
  // they never inherit this terrain silhouette or any cavity clip.
  const tone=c.createLinearGradient(0,top,0,terrainHeight(middle)+100);
  tone.addColorStop(0,'#3b553515');tone.addColorStop(.58,'#173b2920');tone.addColorStop(1,'#102c2877');c.fillStyle=tone;c.fillRect(left-camera,top,right-left,650);
}
function appendArchOpenings(c,roof,camera){
  const bays=roof.mass?.openings??roof.openings??[];
  const floor=x=>roof.lower?surfaceHeight(roof.lower,x):terrainHeight(x);
  for(const [a,b] of bays){
    const left=roof.x1+(roof.x2-roof.x1)*a,right=roof.x1+(roof.x2-roof.x1)*b;
    c.moveTo(left-camera,floor(left)+4);
    for(let x=left+6;x<right;x+=6){
      const u=(x-left)/(right-left),ceiling=surfaceHeight(roof,x)+routeThickness(roof,x);
      const arch=Math.sin(Math.PI*u)**(.3+.12*u);
      c.lineTo(x-camera,floor(x)+4-Math.max(0,floor(x)-ceiling-5)*arch);
    }
    c.lineTo(right-camera,floor(right)+4);
    for(let x=right-8;x>left;x-=8)c.lineTo(x-camera,floor(x)+12);
    c.closePath();
  }
}
function vaultShadow(c,roof,camera){
  const left=roof.x1,right=roof.x2,ceiling=x=>surfaceHeight(roof,x)+routeThickness(roof,x);
  // Only a local reflected shadow belongs below the vault. The broad opening
  // is subtracted from the mass and shows the unchanged canyon behind it.
  c.save();slabPath(c,left,right,ceiling,x=>ceiling(x)+29,camera);c.clip();
  const top=Math.min(...[left,(left+right)/2,right].map(ceiling));
  const shade=c.createLinearGradient(0,top,0,top+40);shade.addColorStop(0,'#102c2866');shade.addColorStop(1,'#102c2800');c.fillStyle=shade;c.fillRect(left-camera,top-100,right-left,500);c.restore();
}
function drawLandform(c,images,p,upper,camera,t){
  c.save();const bounds=landformOutline(c,p,upper,camera);appendArchOpenings(c,p,camera);if(upper)appendArchOpenings(c,upper,camera);c.clip('evenodd');c.fillStyle='#57684d';c.fillRect(bounds.left-camera,bounds.top,bounds.right-bounds.left,750);paintLandform(c,images,p,upper,camera,bounds);
  vaultShadow(c,p,camera);if(upper)vaultShadow(c,upper,camera);c.restore();
  // Broad rear rock faces are intentional on filled sections. The foreground
  // driving crown and all actors remain in front of those non-colliding banks.
  // Large root systems and irregular vegetation unify the crown with its bank.
  for(const u of [.08,.36,.72,.93]){
    const wx=p.x1+(p.x2-p.x1)*u,y=massCrown(p,upper,wx);
    if(p.mass.kind==='root-bank'||p.mass.kind==='wet-vault'){
      c.save();slabPath(c,p.x1,p.x2,x=>surfaceHeight(p,x),x=>surfaceHeight(p,x)+routeThickness(p,x),camera);c.clip();roots(c,wx-camera,y+3,50+hash(p.seed+u)*52,p.seed+u);c.restore();
    }
    shrub(c,wx-camera,y+1,23+hash(u+p.seed)*17,p.seed+u*43);fern(c,wx-camera+29,y,24+hash(u)*13,p.seed+u,t);
  }
  if(p.mass.kind==='wet-vault'){
    const wx=p.x1+(p.x2-p.x1)*.59;fallingWater(c,wx-camera,surfaceHeight(p,wx)+routeThickness(p,wx)+2,terrainHeight(wx)-6,31,t,p.seed);
  }
}
const REMNANTS=[
  {x:410,w:150,h:58},{x:2520,w:190,h:49},{x:3410,w:155,h:64,material:'hull'},
  {x:5020,w:156,h:45,material:'hull'},{x:6020,w:160,h:76},{x:6720,w:215,h:80},
  {x:8590,w:170,h:56},{x:9310,w:180,h:73,material:'concrete'},
  {x:11610,w:210,h:54,material:'concrete'},{x:12480,w:210,h:85},
  {x:13380,w:155,h:55},{x:14180,w:245,h:95},{x:14650,w:120,h:35},
  {x:15000,w:150,h:65},{x:16040,w:170,h:47,material:'hull'}
];
export function drawRockButtresses(c,images,platforms,camera,width,t){
  for(const p of platforms.filter(p=>p.mass)){
    if(p.x2+p.mass.right<camera-100||p.x1-p.mass.left>camera+width+100)continue;
    drawLandform(c,images,p,platforms.find(q=>q.lower===p),camera,t);
  }
  for(const [i,r] of REMNANTS.entries()){
    if(r.x+r.w/2<camera-60||r.x-r.w/2>camera+width+60)continue;
    const y=terrainHeight(r.x)+13,left=r.x-r.w/2,right=r.x+r.w/2;
    const outline=[[left-camera-10,y+35],[left-camera+15,y-r.h*.38],[r.x-camera-r.w*.15,y-r.h],[r.x-camera+r.w*.23,y-r.h*.81],[right-camera-14,y-r.h*.16],[right-camera+10,y+26]];
    c.save();poly(c,outline,'#53684e');c.beginPath();outline.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();rockTexture(c,images,left-10,right+10,y-r.h,y+35,camera,i+31);
    c.fillStyle='#1c43304a';c.fillRect(left-camera-12,y-r.h,r.w+24,r.h+40);c.restore();
    fern(c,r.x-camera-r.w*.28,y-3,21+hash(i)*11,i+79,t);shrub(c,right-camera-8,y+1,25,i+19);
  }
}
export function drawNaturalGround(c,images,camera,width,t){
  const left=Math.floor((camera-80)/16)*16,right=camera+width+80;
  c.save();slabPath(c,left,right,terrainHeight,()=>790,camera);c.clip();
  c.fillStyle='#425442';c.fillRect(left-camera,360,right-left,440);rockTexture(c,images,left,right,370,790,camera,17);
  const shade=c.createLinearGradient(0,540,0,790);shade.addColorStop(0,'#17372100');shade.addColorStop(1,'#081d17de');c.fillStyle=shade;c.fillRect(left-camera,500,right-left,290);c.restore();
  // Broad native images are clipped to the real contour. Their y registration
  // is stable per world tile, so panning cannot make soil slide under wheels.
  const span=2172*.52;
  for(let n=Math.floor(left/span);n<right/span;n++){
    const a=Math.max(left,n*span),b=Math.min(right,(n+1)*span),originY=terrainHeight(n*span+span*.5)-154;
    soilCrown(c,images,a,b,terrainHeight,x=>terrainHeight(x)+23,camera,23,originY);
  }
  vegetation(c,left,right,terrainHeight,camera,29,t);
  for(let n=Math.floor(left/340);n<right/340;n++){const wx=n*340+95,y=terrainHeight(wx);if(scenarioAt(wx).material!=='concrete')roots(c,wx-camera,y+7,21+hash(n)*25,n);}
  for(const s of EXPEDITION_SCENARIOS){
    if(s.material!=='wetstone')continue;
    const a=Math.max(left,s.x1),b=Math.min(right,s.x2);
    for(let x=Math.floor(a/250)*250;x<b;x+=250){const wx=x+54,y=terrainHeight(wx)+2;ellipse(c,wx-camera,y,25+hash(x)*19,2,'#88bca52b');}
  }
}
export function drawNaturalRoutes(c,images,platforms,camera,width,t){
  for(const p of [...platforms].sort((a,b)=>b.tier-a.tier)){
    if(p.x2<camera-120||p.x1>camera+width+120)continue;
    const left=Math.max(p.x1,camera-120),right=Math.min(p.x2,camera+width+120),height=x=>surfaceHeight(p,x),bottom=x=>height(x)+routeThickness(p,x);
    const top=Math.min(...(p.points?.map(point=>point[1])??[height(p.x1),height(p.x2)]));
    c.save();slabPath(c,left,right,height,bottom,camera);c.clip();
    // This near stone face is the actual substantial solid roof. Painting it
    // only inside the shared collision depth preserves every open lower path.
    rockTexture(c,images,left,right,top-26,top+180,camera,p.seed);
    c.fillStyle='#536a3f19';c.fillRect(left-camera,top,right-left,240);
    // The rim stays inside the solid geometry, with no dark artificial road
    // stripe beyond the carved ceiling. The native bank remains visible.
    c.strokeStyle='#142f2770';c.lineWidth=4;c.beginPath();traceTop(c,left,right,x=>bottom(x)-2,camera);c.stroke();c.restore();
    soilCrown(c,images,left,right,height,x=>height(x)+Math.min(8,routeThickness(p,x)),camera,p.seed,top-144);
    vegetation(c,left,right,height,camera,p.seed,t);
    for(const [wx,dir] of [[p.x1,1],[p.x2,-1]]){
      const x=wx-camera;if(x<-80||x>width+80)continue;
      // Low vegetation joins the route entrance to its continuous rear bank.
      shrub(c,x+dir*30,height(wx+dir*30)+1,18,p.seed+dir);fern(c,x+dir*60,height(wx+dir*60),19,p.seed,t);
    }
  }
}
// Compatibility only: a physical actor has no fictitious rear lane to mask.
export function clipNearRoofs(){}
export function drawNaturalForeground(c,images,platforms,camera,width,t){
  const left=camera-60,right=camera+width+60;
  for(let n=Math.floor(left/173);n<right/173;n++){
    const wx=n*173+hash(n+41)*22;if(wx<left||wx>right)continue;
    roots(c,wx-camera,terrainHeight(wx)+9,12+hash(n)*13,n+57);
  }
  // A few fine roots fit inside the measured standing margin below a slab.
  for(const p of platforms){
    const a=Math.max(left,p.x1+40),b=Math.min(right,p.x2-40);
    for(let n=Math.floor(a/233);n<b/233;n++){
      const wx=n*233+hash(n+p.seed)*37;if(wx<a||wx>b||hash(n+p.seed)<.66)continue;
      const y=surfaceHeight(p,wx)+routeThickness(p,wx);c.strokeStyle='#526645';c.lineWidth=.8;c.beginPath();c.moveTo(wx-camera,y-1);c.quadraticCurveTo(wx-camera-2,y+1,wx-camera+Math.sin(t*.5+n),y+3);c.stroke();
    }
  }
}

// The old expedition station is a small family of recognizable structures.
// Concrete ribs, inset glass, oxidized copper and vegetation share one palette.
function station(c,x,y,w,h,type,seed,t){
  c.save();c.translate(x,y);
  if(type===0){
    poly(c,[[-w*.5,0],[-w*.48,-h*.67],[-w*.29,-h*.94],[w*.13,-h],[w*.45,-h*.79],[w*.49,0]],'#526359');
    poly(c,[[-w*.48,-h*.67],[-w*.29,-h*.94],[-w*.23,-h*.62],[-w*.24,0],[-w*.5,0]],'#89907b');
    poly(c,[[-w*.23,-h*.62],[-w*.29,-h*.94],[w*.13,-h],[w*.35,-h*.76],[w*.29,-h*.62]],'#b4ac8e');
    for(let j=0;j<4;j++){const xx=-w*.16+j*w*.135;poly(c,[[xx,-h*.62],[xx+w*.08,-h*.62],[xx+w*.06,-h*.2],[xx,-h*.16]],j===2?'#152f2d':'#243f3a');c.fillStyle='#72938477';c.fillRect(xx+2,-h*.58,2,h*.28);}
    poly(c,[[w*.1,-h],[w*.17,-h*.89],[w*.2,-h*.98],[w*.32,-h*.9],[w*.45,-h*.79],[w*.34,-h*.76]],'#283e34');
    c.fillStyle='#9a8b66';c.fillRect(-w*.17,-h*.15,w*.5,4);
  }else if(type===1){
    poly(c,[[-w*.5,0],[-w*.48,-h*.32],[-w*.33,-h*.49],[-w*.1,-h*.52],[-w*.11,-h*.91],[w*.02,-h],[w*.18,-h*.89],[w*.22,-h*.45],[w*.49,-h*.37],[w*.48,0]],'#637469');
    poly(c,[[-w*.11,-h*.91],[w*.02,-h],[w*.04,-h*.45],[-w*.1,-h*.52]],'#9c9d82');
    c.fillStyle='#253f39';c.fillRect(-w*.04,-h*.83,w*.14,h*.35);c.fillStyle='#8a9d7e';c.fillRect(-w*.03,-h*.79,3,h*.26);
    for(let j=0;j<4;j++){c.fillStyle='#263d35';c.fillRect(-w*.36+j*w*.2,-h*.32,w*.13,h*.2);c.fillStyle='#8a937a';c.fillRect(-w*.36+j*w*.2,-h*.32,w*.13,3);}
    c.strokeStyle='#8c8060';c.lineWidth=10;c.beginPath();c.moveTo(w*.22,-h*.43);c.quadraticCurveTo(w*.3,-h*.57,w*.37,-h*.43);c.lineTo(w*.37,-h*.2);c.stroke();
    c.strokeStyle='#31463a';c.lineWidth=5;c.stroke();
  }else{
    poly(c,[[-w*.5,0],[-w*.46,-h*.7],[-w*.3,-h*.93],[w*.27,-h*.89],[w*.48,-h*.6],[w*.5,0]],'#536a5d');
    c.strokeStyle='#a1a58b';c.lineWidth=17;c.beginPath();c.ellipse(0,-h*.38,w*.3,h*.43,0,Math.PI,0);c.stroke();
    poly(c,[[-w*.3,0],[-w*.28,-h*.4],[-w*.15,-h*.64],[w*.12,-h*.61],[w*.3,-h*.35],[w*.3,0]],'#1c3730');
    for(let j=0;j<3;j++){c.strokeStyle='#4a6755';c.lineWidth=3;c.beginPath();c.moveTo(-w*.16+j*w*.15,0);c.lineTo(-w*.16+j*w*.15,-h*.49);c.stroke();}
    poly(c,[[w*.05,-h*.9],[w*.12,-h*.75],[w*.19,-h*.91],[w*.27,-h*.89],[w*.22,-h*.69],[w*.03,-h*.73]],'#314b3b');
  }
  // Sparse surviving cyan instruments sit behind the broken facade.
  c.fillStyle='#99d4bc';c.globalAlpha=.5+Math.sin(t*.7+seed)*.1;c.fillRect(w*.05,-h*.27,14,2);c.globalAlpha=1;
  for(let i=0;i<11;i++){const xx=(hash(seed+i)-.5)*w*.8,yy=-h*.1-hash(seed+i+40)*h*.5;c.strokeStyle=i%2?'#b1aa7a44':'#233b2d77';c.lineWidth=1;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx-5,yy+12);c.lineTo(xx+1,yy+23);c.stroke();}
  for(let i=0;i<5;i++){const xx=(i-2)*w*.19,yy=-h*(type===1?.39:.73)+hash(seed+i)*14;shrub(c,xx,yy,w*.115,seed+i);if(i%2===0)vine(c,xx,yy+4,h*.5,seed+i,t);}
  shrub(c,-w*.4,0,w*.21,seed+35);shrub(c,w*.36,0,w*.2,seed+36);fern(c,w*.4,3,w*.26,seed,t);c.restore();
}
export function drawAncientRuins(c,images,camera,width,t){
  const speed=.65,offset=camera*speed;
  for(let n=Math.floor((offset-700)/2100);n<(offset+width+700)/2100;n++){
    const type=((n%3)+3)%3,x=n*2100-offset+790,y=553+hash(n+9)*13,w=[300,490,340][type],h=[350,390,360][type];
    if(x+w*.6<-100||x-w*.6>width+100)continue;
    c.save();
    // Native architecture already includes its weathered stone footing.
    // The simple plinth is only needed by the vector fallback.
    if(!images['ruins-atlas'])poly(c,[[x-w*.7,y+30],[x-w*.53,y-19],[x-w*.3,y-36],[x+w*.33,y-26],[x+w*.68,y+24]],'#455c47');
    const atlas=images['ruins-atlas'];
    if(atlas){const crop=[{x:10,y:45,w:555,h:664},{x:610,y:5,w:885,h:705},{x:1495,y:0,w:677,h:710}][type];const dw=h*crop.w/crop.h;ellipse(c,x,y-2,dw*.43,13,'#17352b70');c.drawImage(atlas,crop.x,crop.y,crop.w,crop.h,x-dw/2,y-h,dw,h);}
    else station(c,x,y,w,h,type,n+37,t);
    for(let j=0;j<5;j++)fern(c,x-w*.42+j*w*.19,y+4,28+hash(n+j)*25,n*9+j,t);
    shrub(c,x-w*.46,y+2,45,n+4);shrub(c,x+w*.47,y+4,43,n+5);
    c.restore();
  }
  if(images.wreck){
    // One immense landmark shares the established ruins plane. Its intact RGBA
    // crop includes the roots and rock cradle; the near canyon floor buries the
    // lowest broken stones rather than letting the hull float above the scene.
    const wreck=images.wreck,left=2530-offset,w=1900,h=w*724/2172,base=660;
    if(left+w>-120&&left<width+120){
      c.save();
      ellipse(c,left+w*.49,565,w*.43,32,'#17362c80');
      c.drawImage(wreck,0,0,2172,724,left,base-h,w,h);
      // The continuing jungle grows into the hull's existing moss and roots.
      for(const [f,size] of [[.035,42],[.19,29],[.46,35],[.72,38],[.96,45]]){
        const x=left+w*f,y=559+hash(f*119)*20;
        shrub(c,x,y,size,f*913);fern(c,x+18,y+4,size*.85,f*101,t);
      }
      c.restore();
    }
  }
}
