// The playable BT uses the exact existing green/orange enemy atlas and native rig.
import {inkEnemySaltikGeometry,drawInkEnemySaltik} from './ink-enemy-saltik.js';
export function btActor(p){
 return {...p,hp:Math.max(1,p.hp??100),type:'saltik',dir:p.dir===-1?-1:1,guard:false,guardFlash:0,lockProgress:0,hit:p.damagePose?.1:0,firePose:p.muzzle??0,
 cannonRecoil:(p.muzzle??0)/.12,podRaise:p.bt?.locking?1:0,supportPose:p.btStage?{...p.supportPose,tilt:p.btStage.tilt,heave:p.btStage.heave}:p.supportPose,
 btGripTargets:p.btGripTargets,btAimTarget:p.btAimTarget};
}
export function btGeometry(p,{camera=0,time=0,scale=1}={},base={}){
 const view=p.turn?.active&&Math.abs(Math.cos(p.turn.yaw??0))<.55?'front':'side';
 const native=inkEnemySaltikGeometry(btActor(p),time,{camera,scale,view}),tubes=native.podSlots;
 return {...base,btNative:native,btTubes:tubes,arm:native.muzzle,armDirection:native.muzzleDirection,cannon:native.muzzle,cannonAngle:Math.atan2(native.muzzleDirection.y,native.muzzleDirection.x),face:native.target,bounds:native.bounds,weaponsLocked:!!p.turn?.active};
}
export function drawBT(c,image,p,{camera=0,time=0,scale=1}={}){
 const view=p.turn?.active&&Math.abs(Math.cos(p.turn.yaw??0))<.55?'front':'side';
 c.save();if(p.invulnerable>0&&Math.floor(time*18)%2)c.globalAlpha*=.65;
 const native=drawInkEnemySaltik(c,image,btActor(p),{camera,time,scale,view});if(native)drawFriendlyEyes(c,native);c.restore();return native;
}
export function drawBTLocks(c,g,camera){
 const s=g.player.bt;if(!s?.locks.length)return;
 c.save();c.font='bold 11px sans-serif';c.textAlign='center';c.textBaseline='middle';
 const counts=new Map();s.locks.forEach((lock,index)=>{const target=[...g.enemies,...(g.boss?[g.boss]:[])].find(t=>t.id===lock.targetId&&t.hp>0);if(!target)return;const n=counts.get(target.id)??0;counts.set(target.id,n+1);const x=target.x-camera,y=target.y-(target.type==='saltik'?65:40),r=18+n*4;
 c.strokeStyle='#ffe7a3';c.lineWidth=1.3;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.moveTo(x-r-5,y);c.lineTo(x-r+3,y);c.moveTo(x+r-3,y);c.lineTo(x+r+5,y);c.moveTo(x,y-r-5);c.lineTo(x,y-r+3);c.stroke();c.fillStyle='#252b21';c.fillRect(x+r-5,y-7,16,14);c.fillStyle='#ffe7a3';c.fillText(String(index+1),x+r+3,y);});c.restore();
}

// Only the playable actor gets Striker-like clean black pupils and generous glints.
export function drawFriendlyEyes(c,g){
 const eyes=g.view==='front'?[[1454,572,32,37],[1561,572,32,37]]:[[621,550,32,39],[711,554,28,36]];
 c.save();c.translate(g.x+g.offsetX,g.y+g.heave+g.bodyDrop);c.rotate(g.rotation);c.scale(g.k*g.flip,g.k);c.translate(-g.anchor[0],-g.anchor[1]);
 for(const [x,y,rx,ry]of eyes){c.fillStyle='#090b0b';c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();c.fillStyle='#fffbed';c.beginPath();c.ellipse(x-rx*.30,y-ry*.43,rx*.33,ry*.31,-.12,0,Math.PI*2);c.fill();}
 c.restore();
}
