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
 c.lineCap='round';c.lineWidth=Math.max(1.5,rx*.055);
 // Small alternating ribs follow the tread, with the same elliptical projection
 // as the source hub instead of spinning the entire oval wheel painting.
 c.strokeStyle='rgba(19,24,24,.52)';c.beginPath();
 for(let i=0;i<12;i++){const a=spin+i*Math.PI/6;c.moveTo(...point(a,.83));c.lineTo(...point(a+.055,.98));}c.stroke();
 c.strokeStyle='rgba(225,215,185,.44)';c.lineWidth=Math.max(1.5,rx*.065);c.beginPath();
 for(let i=0;i<5;i++){const a=spin+i*Math.PI*2/5;c.moveTo(...point(a,.18));c.lineTo(...point(a,.58));}c.stroke();
 c.restore();
}
