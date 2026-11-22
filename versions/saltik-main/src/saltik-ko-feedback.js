// A soft comic cue distinguishes a sleeping/KO brother from a destroyed wreck.
// Simulation time owns the motion, so pause and a settled body stay coherent.
export function drawSaltikKO(c,e,{camera=0,time=0}={}){
 const saltik=e.type==='saltik'&&e.groundedDefeat&&e.hp<=0,carrier=e.type==='carrier'&&e.knockedOut;
 if(!saltik&&!carrier)return null;
 const age=carrier?Math.max(0,e.koElapsed??0):Math.max(0,time-(e.defeatStartedAt??time)),k=e.artScale??1;
 const appear=Math.min(1,age/.16),x=e.x-camera,y=e.y-151*k+Math.sin(age*2.2)*1.5*k;
 const text=age<.65?'POUF !':'K.O.';
 c.save();c.globalAlpha*=appear;c.translate(x,y);c.scale(k,k);c.lineJoin='round';c.lineCap='round';
 c.fillStyle='#fff0cc';c.strokeStyle='#30372d';c.lineWidth=2;c.beginPath();c.roundRect(-23,-12,46,24,7);c.fill();c.stroke();
 c.beginPath();c.moveTo(-5,12);c.lineTo(-1,17);c.lineTo(5,12);c.stroke();
 c.fillStyle='#30372d';c.font='15px "InkLettering",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,0,0);
 // Two little loose ink loops orbit the label, without military insignia.
 for(let i=0;i<2;i++){const phase=age*1.8+i*Math.PI,xx=Math.cos(phase)*34,yy=Math.sin(phase)*8;c.beginPath();c.ellipse(xx,yy,3,2,phase,0,Math.PI*1.7);c.stroke();}
 c.restore();return{text,age,x,y};
}
