const TAU=Math.PI*2;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Opaque clouds cross several nominal cells. These measured isolated crops
// retain each full cloud without sampling the adjacent explosion.
export const BLAST_CROPS=Object.freeze([
  [5,152,338,333],[356,49,410,443],[768,36,375,460],[1152,11,379,487],
  [47,656,260,287],[355,554,393,445],[757,519,403,485],[1158,548,375,452]
]);
const MAX_BLASTS=24,MAX_FRAGMENTS=264;
const noise=n=>{const s=Math.sin(n*127.13+311.7)*43758.5453;return s-Math.floor(s);};
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}

export function createCombatEffects(){
  let blasts=[],fragments=[],serial=0;
  function add(event){
    if(!event||!Number.isFinite(event.x)||!Number.isFinite(event.y))return;
    const explosion=event.type==='explosion',debris=event.type==='debris';
    const impact=['intercept','deflect','avoid','evasion-avoid'].includes(event.type);
    if(!explosion&&!debris&&!impact)return;
    const seed=++serial*19+event.x*.03+event.y*.07;
    const radius=clamp(event.radius??(event.big?185:explosion?70:debris?26:18),12,220);
    const artillery=!!event.artillery;
    if(explosion||impact||debris)blasts.push({x:event.x,y:event.y,radius,age:0,
      life:artillery?(explosion?3.2:1.6):explosion?2.1:debris?1.05:.55,hot:!debris,seed,impact,artillery});
    const count=explosion?(artillery?24:event.big?29:18):debris?18:8;
    for(let i=0;i<count;i++){
      const n=seed+i*3.17,spark=!debris&&i<(impact?6:7),angle=-Math.PI+noise(n)*Math.PI;
      const speed=(spark?180:75)+noise(n+1)*(spark?220:145),size=spark?1:2+noise(n+2)*5;
      const metal=event.material==='metal';
      fragments.push({x:event.x,y:event.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-25,
        age:0,life:spark?.13+noise(n+3)*.19:.65+noise(n+3)*.65,
        size,spark,angle:noise(n+4)*TAU,spin:(noise(n+5)-.5)*12,
        color:spark?'#ffda8a':metal?['#5e665c','#373d39','#9b8b69'][i%3]:['#78654e','#4d4738','#a18a65'][i%3],
        shape:[[-1,-.3],[-.35,-1],[.65,-.8],[1,.25],[.2,.72],[-.7,1]].map(([x,y],j)=>[x*(.7+noise(n+j)*.5),y*(.7+noise(n+j+8)*.5)])});
    }
    if(blasts.length>MAX_BLASTS)blasts.splice(0,blasts.length-MAX_BLASTS);
    if(fragments.length>MAX_FRAGMENTS)fragments.splice(0,fragments.length-MAX_FRAGMENTS);
  }
  function update(dt){
    if(!Number.isFinite(dt)||dt<=0)return;
    for(const b of blasts)b.age+=dt;
    for(const p of fragments){
      p.age+=dt;
      // Analytic gravity preserves weight at every renderer update rate.
      const gravity=p.spark?185:620;
      p.x+=p.vx*dt;p.y+=p.vy*dt+.5*gravity*dt*dt;p.vy+=gravity*dt;
      p.angle+=p.spin*dt;
    }
    blasts=blasts.filter(b=>b.age<b.life);fragments=fragments.filter(p=>p.age<p.life);
  }
  function nativeCloud(c,sheet,b,frame,alpha,camera,smoke=false){
    if(alpha<=0)return;
    const [sx,sy,sw,sh]=BLAST_CROPS[frame],u=b.age/b.life;
    const h=b.radius*(smoke?1.4+u*1.05:1.8+Math.min(b.age/.5,1)*.35)*(b.artillery?(smoke?1.32:1.25):1),w=h*sw/sh;
    const base=b.y+b.radius*(smoke?.42:.58)-b.age*(smoke?24:8);
    c.save();c.globalAlpha=alpha;
    if(sheet)c.drawImage(sheet,sx,sy,sw,sh,b.x-camera-w*.5,base-h,w,h);
    else{
      for(let i=0;i<6;i++){
        const a=i*TAU/6,r=b.radius*(.25+noise(b.seed+i)*.25);
        oval(c,b.x-camera+Math.cos(a)*b.radius*.34,b.y+Math.sin(a)*b.radius*.27-b.age*22,
          r*(1+u),r*(1.1+u),smoke?'#55554c':i%2?'#ed7b27':'#ffd579');
      }
    }
    c.restore();
  }
  function draw(c,images,{camera=0}={}){
    const sheet=images['combat-blast'];
    for(const b of blasts){
      const x=b.x-camera,a=b.age,u=clamp(a/.34,0,1);
      if(b.hot&&a<.34){
        const r=b.radius*(.25+u*1.08)*(b.artillery?1.45:1);
        c.save();c.globalCompositeOperation='screen';c.globalAlpha=(1-u)*(b.artillery?.82:.56);
        const light=c.createRadialGradient(x,b.y,0,x,b.y,Math.max(1,r));
        light.addColorStop(0,'#fff6d2');light.addColorStop(.28,'#ffc67b');light.addColorStop(1,'#ed713000');
        oval(c,x,b.y,r,r*.8,light);
        c.strokeStyle='#ffe8bd';c.lineWidth=(1-u)*2.5;c.beginPath();c.ellipse(x,b.y,r,r*.58,0,0,TAU);c.stroke();
        if(a<.075)oval(c,x,b.y,b.radius*(.22+a*3),b.radius*(.13+a*2),'#fffce5');
        c.restore();
      }
      if(b.hot&&a<.72){
        const phase=clamp(a/.19,0,3),frame=Math.floor(phase),blend=phase-frame;
        const fade=clamp((.72-a)/.21,0,1);
        nativeCloud(c,sheet,b,frame,fade*(1-blend),camera);
        if(frame<3)nativeCloud(c,sheet,b,frame+1,fade*blend,camera);
      }
      const smokeStart=b.hot?.20:0;
      if(a>=smokeStart){
        const progress=clamp((a-smokeStart)/(b.life-smokeStart),0,1),phase=progress*3,frame=Math.min(3,Math.floor(phase)),blend=phase-frame;
        const alpha=Math.sin(Math.min(1,(a-smokeStart)*6)*Math.PI*.5)*(1-progress)*.73;
        nativeCloud(c,sheet,b,4+frame,alpha*(1-blend),camera,true);
        if(frame<3)nativeCloud(c,sheet,b,5+frame,alpha*blend,camera,true);
      }
    }
    for(const p of fragments){
      const fade=clamp((p.life-p.age)/Math.min(.25,p.life),0,1);
      c.save();c.globalAlpha=fade;
      if(p.spark){
        const length=.017;c.strokeStyle=p.color;c.lineWidth=1.1;c.beginPath();
        c.moveTo(p.x-camera,p.y);c.lineTo(p.x-camera-p.vx*length,p.y-p.vy*length);c.stroke();
      }else{
        c.translate(p.x-camera,p.y);c.rotate(p.angle);c.fillStyle=p.color;c.beginPath();
        p.shape.forEach(([x,y],i)=>i?c.lineTo(x*p.size,y*p.size):c.moveTo(x*p.size,y*p.size));
        c.closePath();c.fill();
      }
      c.restore();
    }
  }
  return{add,update,draw,reset(){blasts=[];fragments=[];serial=0;},get count(){return blasts.length+fragments.length;}};
}
