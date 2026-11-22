// A soft comic cue distinguishes a sleeping/KO brother from a destroyed wreck.
// Simulation time owns the motion, so pause and a settled body stay coherent.
export function drawSaltikKO(c,e,{camera=0,time=0}={}){
 const saltik=e.type==='saltik'&&e.groundedDefeat&&e.hp<=0,carrier=e.type==='carrier'&&e.knockedOut;
 if(!saltik&&!carrier)return null;
 const age=carrier?Math.max(0,e.koElapsed??0):Math.max(0,time-(e.defeatStartedAt??time)),k=e.artScale??1;
 const appear=Math.min(1,age/.16),x=e.x-camera,y=e.y-151*k+Math.sin(age*2.2)*1.5*k;
 c.save();c.globalAlpha*=appear;c.translate(x,y);c.scale(k,k);c.lineJoin='round';c.lineCap='round';
 // Loose ink curls circling the head communicate dizziness without writing,
 // a speech bubble, or destruction imagery.
 c.strokeStyle='#30372d';c.lineWidth=3;
 for(let i=0;i<3;i++){
  const phase=age*1.65+i*Math.PI*2/3,xx=Math.cos(phase)*23,yy=Math.sin(phase)*6;
  c.save();c.translate(xx,yy);c.rotate(-phase*.3);c.beginPath();
  for(let j=0;j<=18;j++){const a=j/18*Math.PI*2.6,r=1+j/18*3.5,px=Math.cos(a)*r,py=Math.sin(a)*r*.65;if(j)c.lineTo(px,py);else c.moveTo(px,py);}
  c.strokeStyle='#f4dfad';c.lineWidth=4;c.stroke();c.strokeStyle='#30372d';c.lineWidth=1.6;c.stroke();c.restore();
 }
 c.restore();return{age,x,y};
}
