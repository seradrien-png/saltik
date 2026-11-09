import {bossGeometry,bossCannonWarningProgress} from './boss-tank.js';
import {drawBreachedTank} from './boss-breach-art.js';
import {drawBossPod} from './boss-pod-art.js';

const NATIVE_WIDTH=1817,NATIVE_HEIGHT=866,TURRET_SPLIT=480;
const BARREL={x:0,y:211,w:570,h:234};
const TAU=Math.PI*2;

function ellipse(c,x,y,rx,ry,color){
  c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();
}

function chargeWarning(c,b,g,camera,time){
  const nose=g.front.x-camera+6,ground=b.y-8;
  const end=(b.chargeTargetX??g.front.x)-camera;
  const pulse=.5+.5*Math.sin(time*15);
  c.save();
  c.strokeStyle=`rgba(255,130,61,${.55+.3*pulse})`;c.lineWidth=3;
  c.setLineDash([12,10]);c.beginPath();c.moveTo(nose,ground);c.lineTo(end,ground);c.stroke();c.setLineDash([]);
  c.fillStyle=`rgba(255,151,68,${.35+.3*pulse})`;
  for(let x=nose-45;x>end;x-=55){c.beginPath();c.moveTo(x,ground-8);c.lineTo(x-15,ground);c.lineTo(x,ground+8);c.closePath();c.fill();}
  c.strokeStyle=`rgba(255,109,48,${.65+.3*pulse})`;c.lineWidth=2;
  c.beginPath();c.arc(nose,g.front.y+g.front.h*.42,14+pulse*4,0,TAU);c.stroke();
  c.restore();
}

function chargeTreads(c,b,g,camera,time){
  const behind=g.hull.x+g.hull.w-camera,ground=b.y-10;
  c.save();
  for(let i=0;i<5;i++){
    const drift=(time*95+i*23)%115;
    ellipse(c,behind+8+drift,ground-2-i%2*10,7+i*2,3+i*.9,`rgba(116,117,88,${.38-i*.045})`);
  }
  c.strokeStyle='#27372c99';c.lineWidth=2;
  for(let i=0;i<4;i++){
    const x=behind+8+i*24;c.beginPath();c.moveTo(x,ground+1);c.lineTo(x+13,ground+1);c.stroke();
  }
  c.restore();
}

function drawIntactTurret(c,image,sprite,x,recoil){
  const scaleX=sprite.w/NATIVE_WIDTH,scaleY=sprite.h/NATIVE_HEIGHT;
  if(!(recoil>0)){
    c.drawImage(image,0,0,NATIVE_WIDTH,TURRET_SPLIT,x,sprite.y,sprite.w,TURRET_SPLIT*scaleY);
    return;
  }
  const {y,w,h}=BARREL;
  // Source rectangles outside the moving barrel region remain planted.
  c.drawImage(image,0,0,NATIVE_WIDTH,y,x,sprite.y,sprite.w,y*scaleY);
  c.drawImage(image,0,y+h,NATIVE_WIDTH,TURRET_SPLIT-y-h,
    x,sprite.y+(y+h)*scaleY,sprite.w,(TURRET_SPLIT-y-h)*scaleY);
  c.drawImage(image,0,y,w,h,
    x+13*recoil,sprite.y+y*scaleY,w*scaleX,h*scaleY);
  c.drawImage(image,w,y,NATIVE_WIDTH-w,h,
    x+w*scaleX,sprite.y+y*scaleY,(NATIVE_WIDTH-w)*scaleX,h*scaleY);
}

export function drawBossTank(c,images,b,{camera=0,time=0,breach=null}={}){
  if(!b||b.hp<=0)return false;
  const g=bossGeometry(b),sprite=g.sprite,x=sprite.x-camera;
  ellipse(c,b.x-camera,b.y-2,170,14,'#06151199');
  if(b.chargePhase==='telegraph')chargeWarning(c,b,g,camera,time);
  if(b.chargePhase==='charge')chargeTreads(c,b,g,camera,time);
  c.save();
  if(b.hit>0)c.globalAlpha*=.68;
  const image=images.boss;
  if(b.breached&&drawBreachedTank(c,images,b,{camera,breach})){
    // The new native breached hull replaces the intact source illustration.
  }else if(image){
    const lowerH=NATIVE_HEIGHT-TURRET_SPLIT,scaleY=sprite.h/NATIVE_HEIGHT;
    // The lower art includes the entire moving tread chassis. Its upper edge
    // is the same physical roof used for landing and riding.
    c.drawImage(image,0,TURRET_SPLIT,NATIVE_WIDTH,lowerH,
      x,sprite.y+TURRET_SPLIT*scaleY,sprite.w,lowerH*scaleY);
    // The upper native art has the original paired cannons, armor, and moss.
    // A yaw projection turns it about the gameplay turret pivot without ever
    // spinning or shifting the supporting chassis.
    const pivotX=g.turretPivot.x-camera,pivotY=g.turretPivot.y;
    c.save();c.translate(pivotX,pivotY);
    c.scale(Math.cos(b.turretSpin||0),1);
    c.translate(-pivotX,-pivotY);
    drawIntactTurret(c,image,sprite,x,Math.max(0,Math.min(1,b.cannonRecoil||0)));
    c.restore();
  }else{
    c.fillStyle='#465648';c.fillRect(g.hull.x-camera,g.hull.y,g.hull.w,g.hull.h);
    c.fillStyle='#26352e';c.fillRect(x,g.roof.y+7,sprite.w,29);
    c.fillStyle='#657364';c.fillRect(g.turretPivot.x-camera-62,g.turretRoof.y,124,56);
    c.fillStyle='#222c28';c.fillRect(x,g.turretRoof.y+21,152,12);
  }
  c.restore();
  drawBossPod(c,images,b,{camera,time,breach});
  const cannonWarning=bossCannonWarningProgress(b);
  if(cannonWarning>0){
    const a=cannonWarning,nose=g.muzzle.x-camera,gunY=g.muzzle.y-8;
    c.save();c.strokeStyle=`rgba(255,103,68,${a*.65})`;c.lineWidth=2;c.setLineDash([12,15]);
    c.beginPath();c.moveTo(nose+21,gunY);c.lineTo(nose-920,gunY+Math.sin(time*3)*20);c.stroke();c.setLineDash([]);
    ellipse(c,nose+19,gunY-1,8+a*12,8+a*12,`rgba(255,145,74,${a*.8})`);c.restore();
  }
  return true;
}
