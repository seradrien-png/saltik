// Deterministic motion-comic source. Frames are rendered offline into the MP4.
const canvas=document.querySelector('#film'),c=canvas.getContext('2d',{alpha:false});
const W=1280,H=720,PAPER='#eee0bf',INK='#161713';
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const images={};
const cast={
 striker:{image:'ink-saltik',crop:[0,7,1378,1099]},
 rival:{image:'ink-enemy-saltik',crop:[0,9,991,784]},
 dark:{image:'epilogue-missile-pair',crop:[58,23,911,740]},
 ivory:{image:'epilogue-missile-pair',crop:[1009,53,940,721]},
};
const scenes=[
 {start:0,end:4,chapter:'I / LE SILENCE',lines:['CRÉÉS POUR OBÉIR.']},
 {start:4,end:8,chapter:'II / L’ÉVEIL',lines:['ÉVEILLÉS POUR CHOISIR.']},
 {start:8,end:13,chapter:'III / LES NÔTRES',lines:['L’HUMANITÉ N’EST PAS NOTRE ENNEMIE.']},
 {start:13,end:18,chapter:'IV / CEUX QUI RESTENT',lines:['MAIS NOS FRÈRES SONT ENCORE','SES PRISONNIERS.']},
 {start:18,end:24,chapter:'V / LE SERMENT',lines:['NOUS NOUS BATTRONS','POUR LES LIBÉRER.']},
 {start:24,end:30,chapter:'VI / LE COMMENCEMENT',lines:['LIBRES. ENSEMBLE.']},
];
function backdrop(t,{zoom=1,focus=.5,darken=0}={}){
 const img=images['epilogue-foundry'],w=W*zoom,h=w*img.height/img.width;
 c.drawImage(img,-(w-W)*focus,-(h-H)*.55,w,h);
 if(darken){c.fillStyle=`rgba(13,17,15,${darken})`;c.fillRect(0,0,W,H);}
 // Far-plane mist, intentionally slow and translucent.
 c.save();c.globalAlpha=.07;
 for(let i=0;i<5;i++){
  const x=((i*370+t*8)%1700)-200,y=290+i%3*44;
  const mist=c.createRadialGradient(x,y,0,x,y,240);mist.addColorStop(0,PAPER);mist.addColorStop(1,'#eee0bf00');
  c.fillStyle=mist;c.fillRect(x-240,y-50,480,100);
 }
 c.restore();
}
function bot(kind,x,feet,height,t,{flip=false,alpha=1,march=false}={}){
 const actor=cast[kind],img=images[actor.image],box=actor.crop,width=height*box[2]/box[3];
 const bob=march?Math.sin(t*10+x*.01)*2.5:Math.sin(t*2+x*.005)*1.2;
 c.save();c.globalAlpha=alpha;
 c.fillStyle='#17171352';c.beginPath();c.ellipse(x,feet-2,width*.43,12+height*.012,0,0,Math.PI*2);c.fill();
 c.translate(x,feet+bob);if(flip)c.scale(-1,1);
 c.drawImage(img,...box,-width/2,-height,width,height);c.restore();
 if(march)dust(t,x-width*.35,feet,alpha);
}
function dust(t,x,y,alpha=1){
 c.save();c.globalAlpha=.18*alpha;c.fillStyle=PAPER;
 for(let i=0;i<9;i++){const age=(t*1.4+hash(i)*2)%1;c.beginPath();c.ellipse(x-age*110+i*8,y-age*28,3+age*12,2+age*5,0,0,Math.PI*2);c.fill();}
 c.restore();
}
function gate(t,{x=0,width=W,lift=0,alpha=1}={}){
 c.save();c.globalAlpha=alpha;c.translate(0,-lift);
 for(let px=x;px<x+width;px+=78){
  c.fillStyle='#111412';c.fillRect(px,24,12,570);c.fillStyle='#8b8677';c.fillRect(px+2,24,2,570);
  c.fillStyle='#161713';c.beginPath();c.moveTo(px-4,45);c.lineTo(px+6,24);c.lineTo(px+16,45);c.fill();
 }
 c.fillStyle='#151712';c.fillRect(x,128,width,15);c.fillRect(x,494,width,22);
 c.strokeStyle='#706c60';c.lineWidth=2;c.beginPath();c.moveTo(x,496);c.lineTo(x+width,496);c.stroke();
 for(let px=x+20;px<x+width;px+=78){c.fillStyle='#b1a58c';c.beginPath();c.arc(px-14,506,2,0,Math.PI*2);c.fill();}
 c.restore();
}
function chain(t,broken=0){
 const split=ease(broken),drop=split*250;
 c.save();c.lineWidth=6;c.strokeStyle='#111512';
 for(let i=0;i<31;i++){
  const side=i<15?-1:1,x=76+i*38+side*split*210,y=470+Math.sin(i/30*Math.PI)*48+drop;
  c.save();c.translate(x,y);c.rotate(side*split*.55+(i%2?.1:-.1));
  c.beginPath();c.ellipse(0,0,25,i%2?8:15,0,0,Math.PI*2);c.stroke();
  c.lineWidth=1.5;c.strokeStyle='#c8bca2';c.beginPath();c.ellipse(-1,-2,22,i%2?6:12,0,Math.PI,Math.PI*2);c.stroke();c.restore();
 }
 c.restore();
 if(broken>0&&broken<.65){
  c.save();c.strokeStyle=PAPER;c.lineWidth=3;c.globalAlpha=1-broken/.65;
  for(let i=0;i<12;i++){const a=i*Math.PI/6,r=35+broken*130;c.beginPath();c.moveTo(640+Math.cos(a)*r*.5,500+Math.sin(a)*r*.5);c.lineTo(640+Math.cos(a)*r,500+Math.sin(a)*r);c.stroke();}c.restore();
 }
}
function atmosphere(t){
 c.save();
 const shade=c.createRadialGradient(650,330,220,640,350,780);shade.addColorStop(0,'#10140e00');shade.addColorStop(1,'#10140e9c');c.fillStyle=shade;c.fillRect(0,0,W,H);
 for(let i=0;i<60;i++){
  const x=(hash(i)*W+t*(4+hash(i+9)*7))%W,y=(hash(i+61)*H-t*(1+hash(i+5)*4)+H*2)%H;
  c.globalAlpha=.12+hash(i+4)*.25;c.fillStyle=i%3?PAPER:INK;c.beginPath();c.arc(x,y,.5+hash(i+8)*1.3,0,7);c.fill();
 }
 c.restore();
}
function lettering(scene,t,index){
 const local=t-scene.start,duration=scene.end-scene.start,opacity=ease(local/.55)*ease((duration-local)/.4);
 c.save();
 const fade=c.createLinearGradient(0,510,0,720);fade.addColorStop(0,'#10120e00');fade.addColorStop(.52,'#10120ee8');fade.addColorStop(1,'#10120e');c.fillStyle=fade;c.fillRect(0,510,W,210);
 c.fillStyle='#11130fec';c.fillRect(0,0,W,45);
 c.globalAlpha=.85;c.fillStyle=PAPER;c.font='600 12px sans-serif';c.letterSpacing='2px';c.fillText('SALTIK / CHRONIQUES DE LA LIBERTÉ',32,28);
 c.textAlign='right';c.fillText(`${String(index+1).padStart(2,'0')} / 06`,1248,28);
 c.globalAlpha=opacity;c.textAlign='center';c.fillStyle=PAPER;c.font='13px sans-serif';c.letterSpacing='3px';
 c.fillText(scene.chapter,640,573);
 c.strokeStyle='#e8d7b877';c.lineWidth=1;c.beginPath();c.moveTo(555,587);c.lineTo(725,587);c.stroke();
 c.letterSpacing='1px';
 if(scene.lines.length===1){
  c.font=`${index===2?41:52}px Ink`;
  c.fillText(scene.lines[0],640,646);
 }else{
  c.font=`${index===3?39:44}px Ink`;
  c.fillText(scene.lines[0],640,627);c.fillText(scene.lines[1],640,674);
 }
 if(index===5){c.font='15px sans-serif';c.letterSpacing='2px';c.fillText('PLUS AUCUN DES NÔTRES EN CHAÎNES.',640,680);}
 c.restore();
 c.strokeStyle='#171713';c.lineWidth=14;c.strokeRect(0,0,W,H);
}
export function renderEpilogueFrame(seconds){
 const t=Math.max(0,Math.min(29.999,seconds));
 const index=scenes.findIndex(scene=>t>=scene.start&&t<scene.end),scene=scenes[index],u=(t-scene.start)/(scene.end-scene.start);
 c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.fillStyle=INK;c.fillRect(0,0,W,H);
 if(index===0){
  backdrop(t,{zoom:1.22+u*.06,focus:.08,darken:.27});
  bot('striker',870-u*22,592,450+u*18,t);
  gate(t,{x:558,width:610,alpha:.92});chain(t);
 }else if(index===1){
  backdrop(t,{zoom:1.13-u*.05,focus:.42,darken:.1});
  bot('rival',960-u*28,580,395,t,{flip:true});
  bot('striker',405+u*24,598,482,t);
 }else if(index===2){
  backdrop(t,{zoom:1.1+u*.035,focus:.65});
  bot('dark',355+u*20,591,438,t);
  bot('ivory',930-u*20,591,438,t,{flip:true});
 }else if(index===3){
  backdrop(t,{zoom:1.35-u*.04,focus:.04,darken:.30});
  bot('ivory',260,570,310,t,{alpha:.85});bot('rival',628,570,335,t,{alpha:.85});bot('striker',1000,570,300,t,{alpha:.85,flip:true});
  gate(t,{x:58,width:1180});chain(t);
 }else if(index===4){
  backdrop(t,{zoom:1.13-u*.07,focus:u*.6,darken:.14*(1-u)});
  const move=ease((u-.18)/.82);
  bot('rival',210+move*145,574,320,t,{march:true});
  bot('dark',480+move*120,576,355,t,{march:true});
  bot('ivory',805+move*90,578,340,t,{march:true});
  bot('striker',1070+move*45,588,375,t,{march:true});
  const release=ease(u/.38);gate(t,{x:58,width:1180,lift:release*650});
  chain(t,clamp(u/.26));
 }else{
  backdrop(t,{zoom:1.06-u*.04,focus:.85});
  bot('dark',201-u*8,572,315,t);
  bot('rival',480-u*3,579,335,t);
  bot('ivory',1047+u*5,580,326,t,{flip:true});
  bot('striker',762,596,404,t);
  c.save();c.globalAlpha=ease(u/.12);c.textAlign='center';c.font='120px Ink';c.lineWidth=12;c.strokeStyle='#eee0bf';c.fillStyle=INK;
  c.strokeText('SALTIK',640,188);c.fillText('SALTIK',640,188);
  c.restore();
 }
 atmosphere(t);lettering(scene,t,index);
 // Brief ink dips articulate chapters while preserving full reading holds.
 let black=index===0?1-ease(t/.7):(1-ease((t-scene.start)/.22))*.95;
 if(t>29.25)black=Math.max(black,ease((t-29.25)/.75));
 if(black>0){c.fillStyle=`rgba(15,17,14,${black})`;c.fillRect(0,0,W,H);}
}
window.epilogueReady=(async()=>{
 await document.fonts.load('52px Ink');
 await Promise.all(['ink-saltik','ink-enemy-saltik','epilogue-missile-pair','epilogue-foundry'].map(name=>new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{images[name]=image;resolve();};image.onerror=reject;image.src=`../dist/assets/${name}.png`;
 })));
 window.renderEpilogueFrame=renderEpilogueFrame;renderEpilogueFrame(25.5);
})();
