import {combatBounds} from './engine.js';
import {inkEnemySaltikGeometry} from './ink-enemy-saltik.js';
import {inkHitImage} from './ink-hit-cache.js';
const INK='#414744',PAPER='#FFF4DA',TAU=Math.PI*2;
const cells={walker:{crop:[20,54,528,632],anchor:[355,685],height:82,muzzle:[32,240],gunBase:[300,245],exclude:[[528,100,20,300]]},soldier:{crop:[534,114,499,573],anchor:[820,686],height:80,muzzle:[548,294],gunBase:[780,307],exclude:[[534,400,66,287],[980,114,53,286]]},turret:{crop:[1012,22,600,674],anchor:[1330,695],height:106,muzzle:[1036,266],gunBase:[1250,270],exclude:[[1012,350,32,346]]},drone:{crop:[1610,125,550,376],anchor:[1868,344],height:66,muzzle:[1656,448],gunBase:[1850,465]}};
export function inkEnemyGeometry(e,time=0){
 if(e.type==='saltik')return inkEnemySaltikGeometry(e,time);
 const cell=cells[e.type];if(!cell)return null;
 const [sx,sy,sw,sh]=cell.crop,k=cell.height/sh*(e.scale??1)*(e.artScale??1),flip=e.dir===1?-1:1;
 const walking=Math.abs(e.vx??-20)>2&&e.type!=='drone';
 const bobSeed=Number.isFinite(e.id)?e.id:Number.isFinite(e.phase)?e.phase:0;
 const bob=walking?Math.sin(time*10+bobSeed)*.9*(e.artScale??1):0;
 const rotation=walking?Math.sin(time*10)*.012:e.type==='drone'&&Number.isFinite(e.aimRotation)?e.aimRotation:0;
 const co=Math.cos(rotation),si=Math.sin(rotation);
 const sourcePoint=([px,py])=>{const x=(px-cell.anchor[0])*k*flip,y=(py-cell.anchor[1])*k;return{x:e.x+x*co-y*si,y:e.y-bob+x*si+y*co};};
 const muzzle=sourcePoint(cell.muzzle),base=sourcePoint(cell.gunBase),n=Math.hypot(muzzle.x-base.x,muzzle.y-base.y)||1;
 return{cell,k,flip,bob,rotation,sourcePoint,muzzle,muzzleDirection:{x:(muzzle.x-base.x)/n,y:(muzzle.y-base.y)/n}};
}
const oval=(c,x,y,rx,ry,fill)=>{c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();};
export function drawInkEnemy(c,image,e,{camera=0,time=0}={}){
 if(e.hp<=0)return;const cell=cells[e.type];
 if(!cell){c.save();c.translate(e.x-camera,e.y);c.fillStyle='#A8B28D';c.strokeStyle=INK;c.lineWidth=3;c.fillRect(-22,-45,44,45);c.strokeRect(-22,-45,44,45);c.beginPath();c.moveTo(-20,-43);c.lineTo(20,-2);c.moveTo(20,-43);c.lineTo(-20,-2);c.stroke();c.restore();return;}
 const {k,flip,bob,rotation,muzzle,muzzleDirection}=inkEnemyGeometry(e,time),[sx,sy,sw,sh]=cell.crop;
 const hit=e.hit>0?inkHitImage(image):null;
 c.save();if(e.hit>0&&!hit)c.filter='brightness(1.4)';
 if(e.type!=='drone')oval(c,e.x-camera,e.y+1,cell.height*.23*(e.artScale??1),3*(e.artScale??1),hit?'#5B636055':'#41474455');
 c.translate(e.x-camera,e.y-bob);c.rotate(rotation);c.scale(flip,1);
 c.beginPath();c.rect((sx-cell.anchor[0])*k,(sy-cell.anchor[1])*k,sw*k,sh*k);
 for(const [x,y,w,h] of cell.exclude??[])c.rect((x-cell.anchor[0])*k,(y-cell.anchor[1])*k,w*k,h*k);
 c.clip('evenodd');
 c.drawImage(hit??image,sx,sy,sw,sh,(sx-cell.anchor[0])*k,(sy-cell.anchor[1])*k,sw*k,sh*k);
 if(e.type==='drone'){
  for(const x of [-21,24]){c.strokeStyle=hit?'#EBFFFF':'#A8D4D6';c.lineWidth=1;c.beginPath();c.ellipse(x*(e.scale??1)*(e.artScale??1),-11*(e.scale??1)*(e.artScale??1),13*(e.scale??1)*(e.artScale??1),3*(e.scale??1)*(e.artScale??1),Math.sin(time*55)*.12,0,TAU);c.stroke();}
 }
 c.restore();
 if(e.firePose>0)inkFlash(c,{x:muzzle.x-camera,y:muzzle.y},Math.atan2(muzzleDirection.y,muzzleDirection.x),.75,'#DF9A8B');
}
export function inkFlash(c,p,angle,scale=1,color=PAPER){
 c.save();c.translate(p.x,p.y);c.rotate(angle);c.scale(scale,scale);c.strokeStyle=INK;c.lineWidth=1.8;c.fillStyle=color;
 c.beginPath();c.moveTo(0,-3);c.lineTo(10,-9);c.lineTo(12,-3);c.lineTo(27,0);c.lineTo(12,4);c.lineTo(11,9);c.lineTo(0,3);c.closePath();c.fill();c.stroke();c.restore();
}
export function drawInkProjectile(c,s,camera,time){
 const color=s.team==='enemy'?'#DF9A8B':s.kind==='homing'?'#9FCED1':s.kind==='mirv'?'#E9B19A':s.kind==='grenade'?'#B7A4CC':'#F3CB88';
 c.save();c.lineCap='round';
 if(s.trail?.length>1){c.strokeStyle=`${color}AA`;c.lineWidth=3;c.beginPath();s.trail.forEach((p,i)=>i?c.lineTo(p.x-camera,p.y):c.moveTo(p.x-camera,p.y));c.stroke();}
 c.translate(s.x-camera,s.y);c.rotate(Math.atan2(s.vy,s.vx));if(s.btHeavy)c.scale(1.5,1.5);c.strokeStyle=INK;c.fillStyle=color;c.lineWidth=1.5;
 if(['homing','mirv','enemy-missile','grenade','gatling-rocket'].includes(s.kind)){
  c.beginPath();c.moveTo(-9,-3);c.lineTo(7,-3);c.lineTo(12,0);c.lineTo(7,3);c.lineTo(-9,3);c.closePath();c.fill();c.stroke();
  c.fillStyle=s.kind==='mirv'?'#B7A4CC':INK;c.fillRect(-5,-5,3,10);c.fillStyle=PAPER;c.beginPath();c.moveTo(-10,-2);c.lineTo(-21-Math.sin(time*61)*4,0);c.lineTo(-10,2);c.fill();
 }else{c.fillStyle=PAPER;c.strokeStyle=color;c.lineWidth=1.4;c.beginPath();c.roundRect(-12,-2.2,19,4.4,2.2);c.fill();c.stroke();}
 c.restore();
}
export function drawInkLocks(c,g,camera){
 const ids=new Set(g.projectiles.filter(s=>s.kind==='homing'&&s.team==='player').map(s=>s.targetId));c.save();c.lineWidth=1.5;c.strokeStyle='#9FCED1';
 for(const e of g.enemies.filter(e=>ids.has(e.id)&&e.hp>0)){
  const b=combatBounds(e,g.time),x=b.x-camera-8,y=b.y-8,w=b.w+16,h=b.h+16;c.beginPath();
  for(const [xx,yy,dx,dy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]){c.moveTo(xx,yy+dy*8);c.lineTo(xx,yy);c.lineTo(xx+dx*8,yy);}c.stroke();
 }c.restore();
}
