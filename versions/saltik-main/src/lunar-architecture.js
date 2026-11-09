// Architectural depth for Les Archives lunaires. All masses are hand-drawn in
// deterministic world coordinates; none adds invisible collision surfaces.
import {lunarGroundAt,LUNAR_END} from './lunar-level.js';
import {surfaceHeight} from './world.js';
const INK='#35414a',STONE='#c4bfb0',IVORY='#e8e0c9',GOLD='#c5a46e',SHADE='#53636b',TAU=Math.PI*2;
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
function polygon(c,pts,fill,stroke=INK,lineWidth=1.8){
 c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();
 c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lineWidth;c.stroke();}
}
function arch(c,x,y,w,h,color){
 // y is the threshold; top is a real rounded masonry opening, not a hole in the ground.
 c.fillStyle=color;c.beginPath();c.moveTo(x-w/2,y);c.lineTo(x-w/2,y-h*.57);
 c.bezierCurveTo(x-w/2,y-h*1.07,x+w/2,y-h*1.07,x+w/2,y-h*.57);
 c.lineTo(x+w/2,y);c.closePath();c.fill();
}
function masonry(c,x,y,w,h,seed){
 c.strokeStyle='#67727a';c.lineWidth=1;
 for(let row=1;row<Math.floor(h/32);row++){
  const yy=y+row*32;c.beginPath();c.moveTo(x,yy);c.lineTo(x+w,yy);c.stroke();
  for(let col=0;col<Math.ceil(w/70);col++){
   const xx=x+(col+(row%2)*.5)*70;
   if(xx>x+5&&xx<x+w-5){c.beginPath();c.moveTo(xx,yy-31);c.lineTo(xx,yy);c.stroke();}
  }
 }
 for(let i=0;i<4;i++){
  const xx=x+14+hash(seed+i)*Math.max(1,w-28),yy=y+12+hash(seed+20+i)*Math.max(1,h-20);
  c.strokeStyle='#847f76';c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+7,yy+13);c.lineTo(xx+3,yy+19);c.stroke();
 }
}
function column(c,x,base,h,w,seed){
 c.fillStyle='#a3aba9';c.fillRect(x-w*.55,base-h,w*1.1,h);
 c.fillStyle=IVORY;c.fillRect(x-w*.34,base-h+7,w*.72,h-10);
 c.fillStyle=STONE;c.fillRect(x-w*.75,base-h-9,w*1.5,15);c.fillRect(x-w*.7,base-8,w*1.4,13);
 c.strokeStyle=INK;c.lineWidth=2;c.strokeRect(x-w*.55,base-h,w*1.1,h);
 c.strokeStyle='#858e8c';c.lineWidth=1;
 for(let j=1;j<4;j++){const xx=x-w*.31+j*w*.16;c.beginPath();c.moveTo(xx,base-h+14);c.lineTo(xx,base-14);c.stroke();}
 for(let j=0;j<3;j++){const yy=base-h+36+j*45+hash(seed+j)*6;c.beginPath();c.moveTo(x-w*.52,yy);c.lineTo(x+w*.52,yy);c.stroke();}
}
function monolith(c,x,ground,w,h,type,texture,opacity=1){
 c.save();c.translate(x,ground+12);c.globalAlpha*=opacity;
 const left=-w/2,right=w/2,roof=-h*.7;
 // The foundation intersects the playable soil so no building floats behind it.
 polygon(c,[[left-26,14],[right+28,14],[right+9,-38],[left-9,-38]],'#798486');
 c.fillStyle='#777b78';c.fillRect(left-11,-40,w+22,52);
 c.fillStyle=STONE;c.fillRect(left,roof,w,-roof+24);
 const wall=c.createLinearGradient(left,roof,right,0);wall.addColorStop(0,'#9da9a8');wall.addColorStop(.45,IVORY);wall.addColorStop(1,'#918e86');
 c.fillStyle=wall;c.fillRect(left+7,roof+7,w-14,-roof);
 if(texture){c.save();c.globalAlpha*=.19;c.beginPath();c.rect(left+7,roof+7,w-14,-roof);c.clip();c.drawImage(texture,left+7,roof+7,w-14,-roof);c.restore();}
 masonry(c,left+7,roof+9,w-14,-roof-9,type*19+3);
 // A monumental real doorway framed by stepped jambs and concentric arches.
 arch(c,0,5,w*.4,h*.48,'#364a53');
 c.strokeStyle='#c6ac7a';c.lineWidth=7;c.beginPath();c.moveTo(-w*.23,6);c.lineTo(-w*.23,-h*.235);
 c.bezierCurveTo(-w*.23,-h*.55,w*.23,-h*.55,w*.23,-h*.235);c.lineTo(w*.23,6);c.stroke();
 c.strokeStyle=INK;c.lineWidth=2;c.stroke();
 for(const side of [-1,1])column(c,side*(w*.39),9,h*.6,w*.12,type*17+side);
 // The three skylines are deliberately different: archive, observatory, gate.
 if(type%3===0){
  polygon(c,[[left-23,roof],[right+23,roof],[right+10,roof-25],[left-9,roof-25]],'#777c80');
  polygon(c,[[left-28,roof-25],[0,roof-h*.26],[right+28,roof-25]],'#b8b5a7');
  polygon(c,[[left-18,roof-25],[0,roof-h*.2],[right+18,roof-25]],IVORY);
  c.strokeStyle=GOLD;c.lineWidth=5;c.beginPath();c.moveTo(0,roof-h*.2);c.lineTo(0,roof-16);c.stroke();
  for(let k=-2;k<=2;k++){c.fillStyle=GOLD;c.fillRect(k*w*.115-3,roof-13,6,6);}
 }else if(type%3===1){
  c.fillStyle='#818d90';c.fillRect(left-13,roof-17,w+26,24);
  c.fillStyle='#e4dbc4';c.beginPath();c.ellipse(0,roof-14,w*.4,h*.22,0,Math.PI,TAU);c.fill();
  c.strokeStyle=INK;c.lineWidth=3;c.stroke();c.strokeStyle=GOLD;c.lineWidth=3;
  for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(k*w*.13,roof-20);c.lineTo(0,roof-h*.23);c.stroke();}
  c.fillStyle=GOLD;c.beginPath();c.arc(0,roof-h*.23,12,0,TAU);c.fill();
 }else{
  for(let k=-2;k<=2;k++){
   const xx=k*w*.19;c.fillStyle=k%2===0?'#a6aaa5':'#dcd4be';
   c.fillRect(xx-18,roof-33,36,34);c.strokeStyle=INK;c.lineWidth=1.6;c.strokeRect(xx-18,roof-33,36,34);
  }
  c.fillStyle=GOLD;c.fillRect(left-17,roof-8,w+34,10);
  polygon(c,[[-31,roof-42],[0,roof-86],[31,roof-42]],'#9b8577');
 }
 // The opening is dark and readable, with a thin copper machinery nucleus.
 c.strokeStyle=GOLD;c.lineWidth=3;c.beginPath();c.arc(0,-h*.28,20,0,TAU);c.stroke();
 c.fillStyle='#8db5b7';c.beginPath();c.arc(0,-h*.28,6,0,TAU);c.fill();
 for(let i=0;i<3;i++){
  const yy=roof+39+i*43;c.fillStyle='#52616b';
  for(const sign of [-1,1]){c.fillRect(sign*w*.285-9,yy,18,25);c.strokeStyle=GOLD;c.lineWidth=1.4;c.strokeRect(sign*w*.285-9,yy,18,25);}
 }
 c.restore();
}
export function drawLunarAtmosphere(c,{camera,width,height,time}){
 // Four distinct speed planes: sky texture (caller), mountains, ruins, haze.
 c.save();const far=camera*.055;
 polygon(c,[[-40,height],[width+40,height],...[...Array(Math.ceil(width/40)+3)].map((_,i)=>{
  const x=width+40-i*40,world=x+far;
  return [x,height*.67+Math.sin(world/290)*27+Math.sin(world/115)*14];
 })],'#68717c',null);
 c.globalAlpha=.4;
 for(let layer=0;layer<2;layer++){
  const rate=layer? .16:.095,step=layer?580:820,base=height*(layer?.72:.65);
  const from=Math.floor(camera*rate/step)-2,to=Math.ceil((camera*rate+width)/step)+2;
  for(let i=from;i<=to;i++){
   const x=i*step-camera*rate,tw=layer?100:64,th=110+hash(i*9+layer)*130;
   c.fillStyle=layer?'#5d6d76':'#53626b';c.fillRect(x-tw/2,base-th,tw,th+45);
   c.fillRect(x-tw*.69,base-th+18,tw*1.38,12);
   c.fillStyle='#43535b';c.fillRect(x-14,base-th+30,28,42);
   if(i%3===0){c.strokeStyle='#c1b9a2';c.lineWidth=3;c.beginPath();c.arc(x,base-th-16,tw*.57,0,TAU);c.stroke();}
  }
 }
 c.globalAlpha=.16;c.fillStyle='#ede3cc';c.fillRect(0,height*.59,width,height*.25);
 c.restore();
}
export function drawLunarArchitecture(c,{camera,width,time,texture}){
 // Medium-depth sanctuaries travel at one third player speed.
 c.save();c.globalAlpha=.5;
 const rate=.30,spacing=1070;
 const from=Math.floor(camera*rate/spacing)-2,to=Math.ceil((camera*rate+width)/spacing)+2;
 for(let i=from;i<=to;i++){
  const x=i*spacing-camera*rate,y=635+Math.sin(i*1.75)*24;
  monolith(c,x,y,250+(i%3+3)%3*65,270+(i%4+4)%4*35,(i%3+3)%3,null,.8);
 }
 c.restore();
 // These individual great structures live on the same world coordinates as
 // the terrain and terrace entries, and disappear behind the foreground soil.
 const sites=[700,3100,5350,7620,10100,12100,14900,17050];
 for(let i=0;i<sites.length;i++){
  const x=sites[i];if(x<camera-650||x>camera+width+650)continue;
  monolith(c,x-camera,lunarGroundAt(x),310+(i%3)*85,335+(i%4)*42,i,texture,.98);
  // Astronomical instruments belong to masonry, not to a free-floating sky.
  if(i===0||i===7){const xx=x-camera,y=lunarGroundAt(x)-345;c.save();c.strokeStyle=GOLD;c.lineWidth=5;
   c.beginPath();c.arc(xx,y,66,0,TAU);c.stroke();c.lineWidth=2;
   c.beginPath();c.ellipse(xx,y,55,15,time*.035,0,TAU);c.stroke();c.restore();}
 }
}
export function drawLunarGround(c,{camera,width,texture}){
 const left=Math.floor((camera-120)/28)*28,right=Math.ceil((camera+width+120)/28)*28,bottom=1320;
 const pts=[];for(let x=left;x<=right;x+=28)pts.push([x-camera,lunarGroundAt(x)]);
 // A continuous earth and buried masonry mass, never suspended tiles or holes.
 c.save();c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);
 c.lineTo(pts.at(-1)[0],bottom);c.lineTo(pts[0][0],bottom);c.closePath();
 const soil=c.createLinearGradient(0,490,0,1050);soil.addColorStop(0,'#b8b0a0');soil.addColorStop(.25,'#98958b');soil.addColorStop(.7,'#6b7476');soil.addColorStop(1,'#46535b');
 c.fillStyle=soil;c.fill();c.clip();
 if(texture){c.save();c.globalAlpha=.28;
  for(let x=Math.floor(left/300)*300;x<=right;x+=300)for(let y=490;y<=930;y+=220)c.drawImage(texture,x-camera,y,300,220);
  c.restore();}
 for(let band=0;band<4;band++){
  c.beginPath();for(let x=left;x<=right;x+=28){
   const y=lunarGroundAt(x)+28+band*49+7*Math.sin(x/95+band);
   if(x===left)c.moveTo(x-camera,y);else c.lineTo(x-camera,y);
  }
  c.strokeStyle=band%2?'#59666b':'#dad0ba';c.globalAlpha=.28;c.lineWidth=band===0?4:2;c.stroke();
 }
 c.globalAlpha=.48;
 for(let x=Math.floor(left/155)*155;x<=right;x+=155){
  const y=lunarGroundAt(x)+32,dx=hash(x*.07)*30;
  polygon(c,[[x-camera-45+dx,y+24],[x-camera+30+dx,y],[x-camera+68+dx,y+35],[x-camera+21+dx,y+75]],'#778081',null);
 }
 c.restore();
 c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);
 c.strokeStyle=INK;c.lineWidth=4;c.stroke();
 c.beginPath();pts.forEach(([x,y],i)=>{if(i===0)c.moveTo(x,y+8);else c.lineTo(x,y+8);});
 c.strokeStyle='#e3d6b7';c.lineWidth=3;c.stroke();
 // Rock fragments at the true ground boundary, with a stable world seed.
 for(let x=Math.floor(left/240)*240;x<=right;x+=240){
  const y=lunarGroundAt(x),sx=x-camera,seed=Math.floor(x/240);
  polygon(c,[[sx-32,y+1],[sx-14,y-17-hash(seed)*14],[sx+15,y-7],[sx+36,y+4]],seed%2?'#777c79':'#b5b0a4',INK,1.2);
 }
}
export function drawLunarTerraceSupports(c,p,{camera,texture}){
 const total=p.x2-p.x1;
 for(const fraction of [.10,.32,.55,.78,.94]){
  const wx=p.x1+fraction*total,yTop=surfaceHeight(p,wx)+29,yBase=lunarGroundAt(wx)+24;
  if(yBase<=yTop+9)continue;
  const x=wx-camera,w=34+(fraction===.55?22:0),h=yBase-yTop;
  c.fillStyle='#879094';c.fillRect(x-w*.57,yTop,w*1.14,h);
  c.fillStyle=IVORY;c.fillRect(x-w*.37,yTop+3,w*.74,h-3);
  c.fillStyle='#ac9275';c.fillRect(x-w*.7,yTop-7,w*1.4,12);
  c.fillStyle='#788081';c.fillRect(x-w*.78,yBase-14,w*1.56,20);
  c.strokeStyle=INK;c.lineWidth=1.6;c.strokeRect(x-w*.57,yTop,w*1.14,h);
  c.strokeStyle='#909896';c.lineWidth=1.2;
  for(let line=36;line<h;line+=45){c.beginPath();c.moveTo(x-w*.53,yTop+line);c.lineTo(x+w*.53,yTop+line);c.stroke();}
 }
 // Massive retaining arches rather than a disconnected narrow floating shelf.
 for(let j=0;j<3;j++){
  const x1=p.x1+(j+.20)*total/3,x2=p.x1+(j+.82)*total/3,
   sx1=x1-camera,sx2=x2-camera,y=surfaceHeight(p,(x1+x2)/2)+43;
  c.strokeStyle='#828a8b';c.lineWidth=18;c.beginPath();c.moveTo(sx1,y+55);
  c.quadraticCurveTo((sx1+sx2)/2,y-22,sx2,y+55);c.stroke();
  c.strokeStyle='#c6bdab';c.lineWidth=5;c.stroke();
 }
}
export function drawLunarForeground(c,{camera,width,time}){
 // Closest plane: occasional low silhouettes, deliberately below the actor.
 c.save();
 const from=Math.floor((camera-60)/260),to=Math.ceil((camera+width+60)/260);
 for(let i=from;i<=to;i++){
  const wx=i*260+hash(i+90)*50,x=wx-camera,y=lunarGroundAt(wx)+27;
  c.globalAlpha=.65;c.fillStyle='#4b595d';
  polygon(c,[[x-24,y+12],[x-11,y-9],[x+13,y-7],[x+33,y+14]],'#69777a',null);
  c.strokeStyle='#738b80';c.lineWidth=2;
  for(let k=0;k<3;k++){
   const ox=x+k*11-11,tip=13+hash(i+k)*11;
   c.beginPath();c.moveTo(ox,y+15);c.quadraticCurveTo(ox+6,y+3,ox+4+Math.sin(time*.35+i+k)*2,y-tip);c.stroke();
  }
 }
 c.restore();
}
