import {LUNAR_GAPS,lunarGroundAt} from './lunar-level.js';
import {surfaceHeight} from './world.js';
import {stairTreads} from './walkable-routes.js';
const INK='#343b45',IVORY='#eee5ce',GOLD='#c4a163',COPPER='#ab7256',TAU=Math.PI*2;
function orbit(c,x,y,r,time=0){
 c.save();c.translate(x,y);c.strokeStyle=GOLD;c.lineWidth=5;
 for(const radius of [r,r*.83]){c.beginPath();c.arc(0,0,radius,0,TAU);c.stroke();}
 c.lineWidth=1;for(let i=0;i<24;i++){const a=i*TAU/24;c.beginPath();c.moveTo(Math.cos(a)*r*.85,Math.sin(a)*r*.85);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);c.stroke();}
 c.rotate(time*.025);c.beginPath();c.ellipse(0,0,r*.62,r*.23,-.5,0,TAU);c.stroke();c.restore();
}
export function drawLunarBackdrop(c,{camera,width,height,time,image}){
 c.fillStyle='#536779';c.fillRect(0,0,width,height);
 if(image){const h=Math.max(height,width*image.height/image.width),w=h*image.width/image.height;c.drawImage(image,(width-w)/2-camera*.012%80,0,w+80,h);}
 else{c.fillStyle='#bba477';c.beginPath();c.arc(width*.72-camera*.012,170,155,0,TAU);c.fill();}
 // Restrained clouds, distant suspended sanctuaries: world geometry is painted separately.
 c.save();c.globalAlpha=.23;c.fillStyle='#e8e4d7';
 for(let i=-1;i<7;i++){const x=i*420-(camera*.1%420);c.beginPath();c.ellipse(x,height*.67+Math.sin(i*3)*45,330,48,0,0,TAU);c.fill();}
 c.restore();
}
function slab(c,points,bottom,texture,camera){
 c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);
 const end=points.at(-1),start=points[0];c.lineTo(end[0]-22,bottom-12);c.lineTo((start[0]+end[0])/2,bottom+22);c.lineTo(start[0]+25,bottom);c.closePath();
 c.fillStyle=IVORY;c.fill();
 if(texture){c.save();c.clip();c.globalAlpha=.94;const startX=Math.floor((points[0][0]+camera)/320)*320;
  for(let x=startX;x<points.at(-1)[0]+camera;x+=320)c.drawImage(texture,x-camera,points[0][1]-30,320,230);
  c.restore();}
 c.strokeStyle=INK;c.lineWidth=2;c.stroke();
 c.save();c.clip();c.strokeStyle='#afa68d';c.lineWidth=1;
 for(let y=start[1]+35;!texture&&y<bottom;y+=34){c.beginPath();c.moveTo(start[0],y);c.lineTo(end[0],y);c.stroke();
  for(let x=Math.floor((start[0]+camera)/100)*100-camera+(Math.round(y/34)%2)*50;x<end[0];x+=100){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+34);c.stroke();}}
 c.fillStyle='#59646a';c.globalAlpha=.25;c.fillRect(start[0],bottom-25,end[0]-start[0],55);c.restore();
 c.strokeStyle='#a7a394';c.lineWidth=1;
 for(let x=start[0]+45;x<end[0]-20;x+=78){c.beginPath();c.moveTo(x,bottom-7);c.lineTo(x+12,bottom-33);c.stroke();}
 c.beginPath();c.moveTo(start[0]+6,start[1]+9);for(const [x,y] of points.slice(1))c.lineTo(x-6,y+9);c.stroke();
}
function foliage(c,x,y,seed){
 c.strokeStyle=INK;c.lineWidth=1.2;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+9,y+40,x-8,y+88);c.stroke();
 for(let j=0;j<5;j++){c.fillStyle=j%2?COPPER:'#788677';c.beginPath();c.ellipse(x+(j%2?9:-3),y+j*15+12,12,4,(j%2?-.6:.6)+seed,0,TAU);c.fill();c.stroke();}
}
export function drawLunarWorld(c,g,{camera,width,time,texture}){
 // Temple columns and astronomical monuments behind the traversable surfaces.
 for(const x of [700,3100,5350,7620,10100,12100,14900,17050]){
  if(x<camera-500||x>camera+width+500)continue;
  const sx=x-camera,y=lunarGroundAt(x);c.save();c.globalAlpha=.94;
  for(const dx of [-125,125]){c.fillStyle='#bfc4be';c.strokeStyle=INK;c.lineWidth=2;c.fillRect(sx+dx-20,y-210,40,210);if(texture)c.drawImage(texture,90,20,220,1100,sx+dx-20,y-210,40,210);c.strokeRect(sx+dx-20,y-210,40,210);c.fillRect(sx+dx-31,y-222,62,16);c.strokeRect(sx+dx-31,y-222,62,16);}
  if(x===700||x===17050)orbit(c,sx,y-180,x===17050?156:100,time);else{c.fillStyle=COPPER;c.beginPath();c.moveTo(sx+90,y-212);c.lineTo(sx+122,y-212);c.lineTo(sx+122,y-91);c.lineTo(sx+106,y-106);c.lineTo(sx+90,y-91);c.closePath();c.fill();c.stroke();orbit(c,sx+106,y-169,12,time);}c.restore();
 }
 const spans=[];let left=0;for(const [a,b] of LUNAR_GAPS){spans.push([left,a]);left=b;}spans.push([left,17800]);
 for(const [a,b] of spans){if(b<camera-100||a>camera+width+100)continue;const start=a,end=b,points=[];
  for(let x=start;x<end;x+=25)points.push([x-camera,lunarGroundAt(x)]);points.push([end-camera,lunarGroundAt(end===b?end-.01:end)]);
  // The underside is suspended and never hides an invisible floor in a gap.
  slab(c,points,Math.max(...points.map(p=>p[1]))+130,texture,camera);
  for(let x=Math.ceil(start/310)*310;x<end;x+=310){const y=lunarGroundAt(x);c.strokeStyle='#a89570';c.lineWidth=1;foliage(c,x-camera+32,y+72,x*.01);}
 }
 for(const p of g.platforms){if(p.x2<camera-100||p.x1>camera+width+100)continue;
  slab(c,p.points.map(([x,y])=>[x-camera,y]),Math.max(...p.points.map(p=>p[1]))+65,texture,camera);
  for(const entry of p.walkableEntries??[])for(const tread of stairTreads(entry)){
   c.fillStyle=IVORY;c.strokeStyle=INK;c.lineWidth=1.2;c.fillRect(tread.x1-camera,tread.y,tread.x2-tread.x1,15);if(texture)c.drawImage(texture,0,0,300,120,tread.x1-camera,tread.y,tread.x2-tread.x1,15);c.strokeRect(tread.x1-camera,tread.y,tread.x2-tread.x1,15);
  }
  foliage(c,p.x2-camera-30,surfaceHeight(p,p.x2)+34,.3);
 }
 // Gold edge marks tell the player where to jump without adding false supports.
 for(const [a,b] of LUNAR_GAPS)for(const x of [a-22,b+22]){if(x<camera-50||x>camera+width+50)continue;const y=lunarGroundAt(x);c.fillStyle=GOLD;c.fillRect(x-camera-10,y-5,20,5);}
 const l=g.lunar,x=l.portalX-camera,y=550;
 if(x>-250&&x<width+250){orbit(c,x,y-160,148,time);c.save();c.globalAlpha=l.phase==='open'?.7:.16;c.fillStyle=l.phase==='open'?'#f9eac2':'#8db9c6';c.beginPath();c.ellipse(x,y-160,115,130,0,0,TAU);c.fill();c.restore();
  for(let i=0;i<3;i++){c.fillStyle=i<l.wave?GOLD:'#657579';c.beginPath();c.arc(x-36+i*36,y-319,8,0,TAU);c.fill();}
 }
}
