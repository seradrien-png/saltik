// Wheel texture moves inside its measured projected ellipse. The painted tire,
// suspension, contact patch and leg mask never rotate or walk.
export function wheelRollPhase(entity,hub,pixelScale=1,orientation=1){
 if(entity.groundedDefeat||entity.drawingGroundedDefeat||entity.defeated||entity.neutralized||entity.hp<=0)return 0;
 const distance=Number.isFinite(entity.motionDistance)?entity.motionDistance:0;
 return distance/(hub[3]*pixelScale)*orientation;
}
export function drawWheelRoll(c,{hub,spin=0}, {disabled=false}={}){
 if(disabled||!hub)return;
 const [x,y,rx,ry,angle=0]=hub,co=Math.cos(angle),si=Math.sin(angle),point=(a,r=1)=>{
  const xx=Math.cos(a)*rx*r,yy=Math.sin(a)*ry*r;
  return[x+xx*co-yy*si,y+xx*si+yy*co];
 };
 c.save();c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.clip();
 c.lineCap='round';
 // Fewer, broader marks stay legible at phone size instead of becoming a
 // nearly uniform blur. Their phase still follows real travelled distance.
 c.strokeStyle='rgba(12,17,18,.94)';c.lineWidth=Math.max(3,rx*.16);c.beginPath();
 for(let i=0;i<8;i++){const a=spin+i*Math.PI/4;c.moveTo(...point(a,.72));c.lineTo(...point(a+.065,.99));}c.stroke();
 for(const [color,width]of [['rgba(12,17,18,.92)',.21],['rgba(239,224,187,.88)',.105]]){
  c.strokeStyle=color;c.lineWidth=Math.max(2,rx*width);c.beginPath();
  for(let i=0;i<3;i++){const a=spin+i*Math.PI*2/3;c.moveTo(...point(a,.15));c.lineTo(...point(a,.68));}c.stroke();
 }
 // One asymmetric bright rim segment makes forward/reverse rotation readable
 // even when regular spokes would alias at a steady speed.
 c.strokeStyle='rgba(245,229,192,.92)';c.lineWidth=Math.max(2.5,rx*.15);c.beginPath();
 for(let i=0;i<=9;i++){const p=point(spin+.08*i,.87);if(i)c.lineTo(...p);else c.moveTo(...p);}c.stroke();
 c.restore();
}
