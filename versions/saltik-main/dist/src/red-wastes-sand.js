// Sand marks live in simulation/world coordinates, so camera motion never
// slides them and pause never advances their fade or particle motion.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hash=n=>{const f=Math.sin(n*127.1+311.7)*43758.5453;return f-Math.floor(f);};
export function advanceRedWastesSand(g,dt,contacts=[]){
 if(![5,6].includes(g.level))return;
 if(g.status==='won'){if(g.redWastes.sand)g.redWastes.sand.dust=[];return;}
 if(g.status!=='playing'||!(dt>0)||!Number.isFinite(dt)||g.introElapsed<g.introDuration)return;
 const s=g.redWastes.sand??(g.redWastes.sand={tracks:[],dust:[],last:[],serial:0,dustDistance:0});
 const p=g.player;
 for(const t of s.tracks)t.age+=dt;
 s.tracks=s.tracks.filter(t=>t.age<11&&Math.abs(t.x-p.x)<1300);
 for(const d of s.dust){d.age+=dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.vx*=Math.exp(-dt*2.1);d.vy-=dt*9;}
 s.dust=s.dust.filter(d=>d.age<d.life);
 if(g.duel||g.carrierShutdown||!p.onGround||Math.abs(p.vx)<15||p.evasion?.active){s.last=[];s.dustDistance=0;return;}
 const feet=contacts.filter(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)&&Math.abs(q.y-g.groundAt(q.x))<8);
 const previous=s.last;
 s.last=feet.map((q,i)=>{
  const a=previous[i];
  if(!a||Math.hypot(q.x-a.x,q.y-a.y)>=9){
   if(a&&Math.abs(q.x-a.x)<35){const angle=Math.atan2(q.y-a.y,q.x-a.x);s.tracks.push({x:q.x,y:q.y+1.5,angle,age:0,pressure:.65+hash(s.serial++)*.35});}
   return{x:q.x,y:q.y};
  }
  return a;
 });
 s.tracks=s.tracks.slice(-650);
 s.dustDistance+=Math.abs(p.vx)*dt;
 if(feet.length&&s.dustDistance>=15){
  s.dustDistance%=15;const rear=feet.reduce((a,b)=>p.dir===-1?(a.x>b.x?a:b):(a.x<b.x?a:b)),id=s.serial++;
  s.dust.push({x:rear.x-4*p.dir,y:rear.y-2,vx:-p.dir*(12+hash(id)*19),vy:-12-hash(id+7)*16,age:0,life:.5+hash(id+3)*.35,size:4+hash(id+2)*7});
  s.dust=s.dust.slice(-40);
 }
}
export function drawRedWastesTracks(c,g,{camera=0,width}){
 const s=g.redWastes?.sand;if(!s)return;
 c.save();
 for(const t of s.tracks){const x=t.x-camera;if(x<-15||x>width+15)continue;
  c.save();c.globalAlpha=.28*t.pressure*clamp((11-t.age)/2,0,1);c.translate(x,t.y);c.rotate(t.angle);c.fillStyle='#76341f';
  c.fillRect(-3,-1,5,1.3);c.fillRect(-2,2,5,1.3);c.fillRect(-1,-2,1,6);c.restore();
 }
 c.restore();
}
export function drawRedWastesDust(c,g,{camera=0,width}){
 const s=g.redWastes?.sand;if(!s)return;c.save();
 for(const d of s.dust){const x=d.x-camera;if(x<-40||x>width+40)continue;const u=d.age/d.life;
  c.globalAlpha=.3*Math.sin(Math.PI*u);c.fillStyle='#e8a163';
  c.beginPath();c.ellipse(x,d.y,d.size*(.5+u),d.size*(.3+u*.55),0,0,Math.PI*2);c.fill();
 }
 c.restore();
}
