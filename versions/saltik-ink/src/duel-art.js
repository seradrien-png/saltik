// Native poses measured against the alpha silhouettes of saltik-duel.webp.
const FRAMES={
  engage:{crop:[37,63,731,409],anchor:[411,470]},
  strain:{crop:[768,57,738,428],anchor:[1206,481]},
  throw:{crop:[146,536,515,416]},
  impact:{crop:[878,536,482,415]}
};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=n=>n*n*(3-2*n);
const lerp=(a,b,t)=>a+(b-a)*t;

export function duelVisual(duel,{width,height,camera=0,cameraY=0}={}){
  if(!duel)return null;
  const phase=duel.phase,elapsed=duel.elapsed??0;
  const result={world:phase==='engage'||phase==='qte',pair:null,screen:null,cracks:0,crackX:width*.56,crackY:height*.44};
  if(result.world){
    const active=phase==='qte'&&(duel.effortsCompleted??0)<duel.taps;
    const effort=active?Math.sin(Math.PI*clamp((duel.effortElapsed??0)/.24)):0;
    const frameName=effort>.35?'strain':'engage',frame=FRAMES[frameName];
    const slope=Math.atan2((duel.enemyY-duel.playerY)*duel.dir,Math.max(1,Math.abs(duel.enemyX-duel.playerX)));
    result.pair={...frame,frame:frameName,effort,effortIndex:active?(duel.effortsCompleted??0)+1:0,x:duel.x-camera,y:duel.y,scale:.25,flip:duel.dir,angle:clamp(slope,-.38,.38)};
    return result;
  }
  const targetHeight=height*.64,tx=result.crackX,ty=result.crackY;
  if(phase==='throw'){
    const u=smooth(clamp(elapsed/.48));
    result.screen={crop:FRAMES.throw.crop,x:lerp(duel.enemyX-camera,tx,u),y:lerp(duel.enemyY+cameraY-55,ty,u),height:lerp(110,targetHeight,u),angle:-.12*Math.sin(u*Math.PI)*duel.dir,alpha:1};
  }else if(phase==='impact'){
    const u=clamp(elapsed/.18);
    result.screen={crop:FRAMES.impact.crop,x:tx+Math.sin(u*Math.PI*4)*4*(1-u),y:ty,height:targetHeight*(1+.045*Math.sin(u*Math.PI)),angle:0,alpha:1};result.cracks=1;
  }else if(phase==='slide'){
    const u=clamp(elapsed/.95),fall=smooth(u);
    result.screen={crop:FRAMES.impact.crop,x:tx+duel.dir*fall*35,y:ty+fall*(height+targetHeight*.65),height:targetHeight*(1-.12*fall),angle:duel.dir*fall*.2,alpha:1-.15*u};result.cracks=1-.25*u;
  }else if(phase==='recover')result.cracks=.75*(1-clamp(elapsed/.2));
  return result;
}

export function drawDuelWorld(c,images,duel,viewport){
  const v=duelVisual(duel,viewport),sheet=images['saltik-duel'];if(!v?.world||!sheet)return false;
  const p=v.pair,[x,y,w,h]=p.crop,[ax,ay]=p.anchor;
  c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.scale(p.scale*p.flip,p.scale);c.imageSmoothingEnabled=true;
  c.drawImage(sheet,x,y,w,h,x-ax,y-ay,w,h);c.restore();return true;
}

function cracks(c,x,y,width,height,alpha){
  if(alpha<=0)return;
  c.save();c.globalAlpha*=alpha;c.lineJoin='round';c.lineCap='round';
  // Uneven radial fractures and secondary branches stay attached to the glass.
  const rays=9,segments=[];
  for(let i=0;i<rays;i++){
    const angle=i*Math.PI*2/rays+.15*Math.sin(i*7.3),length=Math.min(width*.33,height*(.29+.11*Math.sin(i*2.1)**2));
    const points=[[x,y]];
    for(let j=1;j<=4;j++){
      const a=angle+Math.sin(i*13+j*4.1)*.11;
      points.push([x+Math.cos(a)*length*j/4,y+Math.sin(a)*length*j/4]);
    }
    segments.push(points);
    const [bx,by]=points[2],branch=angle+(i%2?-.5:.55);
    segments.push([[bx,by],[bx+Math.cos(branch)*length*.16,by+Math.sin(branch)*length*.16],[bx+Math.cos(branch+.2)*length*.29,by+Math.sin(branch+.2)*length*.29]]);
  }
  for(const [color,lineWidth] of [['#061015a6',2.8],['#e5f4efb3',1.15]]){
    c.strokeStyle=color;c.lineWidth=lineWidth;c.beginPath();
    for(const points of segments){points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));}c.stroke();
  }
  c.restore();
}

export function drawDuelScreen(c,images,duel,viewport){
  const v=duelVisual(duel,viewport),sheet=images['saltik-duel'];if(!v||(!v.screen&&v.cracks<=0)||!sheet)return false;
  if(v.screen){const p=v.screen,[x,y,w,h]=p.crop,scale=p.height/h;
    c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.scale(scale,scale);c.globalAlpha*=p.alpha;c.imageSmoothingEnabled=true;
    c.drawImage(sheet,x,y,w,h,-w/2,-h/2,w,h);c.restore();}
  cracks(c,v.crackX,v.crackY,viewport.width,viewport.height,v.cracks);return true;
}

export function drawEnemyDeflection(c,images,e,{camera=0}={}){
  if(!images['saltik-duel']||e.guardResponse!=='deflect'||!(e.guardFlash>0))return false;
  const [x,y,w,h]=FRAMES.impact.crop,scale=.21;
  c.save();c.translate(e.x-camera,e.y);c.imageSmoothingEnabled=true;
  c.drawImage(images['saltik-duel'],x,y,w,h,-w*scale/2,-h*scale,w*scale,h*scale);c.restore();return true;
}
