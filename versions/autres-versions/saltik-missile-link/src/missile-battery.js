// The artillery Saltik is an ordinary foreground enemy. Its native pods are
// also the source of collision projectiles; it has no invisible remote twin.
export const BATTERY_ENCOUNTER_X=11850;
export const ARTILLERY_DAMAGE=50;
export const batterySpriteSize=(team,height=99)=>height*512/(team==='enemy'?460:488);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createMissileBattery(schedule,{y}={}){
 return {...schedule,type:'battery',y,onGround:true,engaged:false,retreating:false,hp:96,maxHp:96,tier:0,dir:-1,vx:0,vy:0,tilt:0,phase:0,hit:0,firePose:0,cooldown:.9,warning:0,attackPhase:'idle',lockProgress:0,volleys:0};
}
export function missileBatteryGeometry(e){
 const size=batterySpriteSize('enemy'),scale=size/512,flip=e.dir===1?-1:1,tilt=e.tilt??0,cos=Math.cos(tilt),sin=Math.sin(tilt);
 const point=([x,y])=>{const dx=(x-256)*scale*flip,dy=(y-500)*scale;return {x:e.x+dx*cos-dy*sin,y:e.y+dx*sin+dy*cos};};
 const target=point([256,280]);
 return {size,scale,flip,tilt,target,targetY:target.y,bounds:{x:e.x-49,y:e.y-94,w:98,h:94},podMuzzles:[[86,121],[384,115]].map(point)};
}
export function advanceMissileBattery(e,{player,dt,groundAt,inView=true,preservePosition=false}={}){
 const shots=[],events=[];if(e.retreating||e.clashStarted||!(dt>0)||!Number.isFinite(dt)||e.hp<=0||!player||player.hp<=0)return {shots,events};
 e.dir=player.x>=e.x?1:-1;e.firePose=Math.max(0,e.firePose-dt);
 if(groundAt&&!preservePosition){e.y=groundAt(e.x);e.tilt=clamp(Math.atan2(groundAt(e.x+40)-groundAt(e.x-40),80),-.2,.2);}
 const inRange=Math.hypot(player.x-e.x,player.y-e.y)<1100;
 if(!inView||!inRange){e.warning=0;e.lockProgress=0;e.attackPhase='idle';e.cooldown=Math.max(.5,e.cooldown);return {shots,events};}
 if(e.warning>0){
  e.warning=Math.max(0,e.warning-dt);e.lockProgress=1-e.warning/1.3;
  if(e.warning===0){
   e.firePose=.35;e.attackPhase='launch';e.volleys++;e.cooldown=9;
   const geo=missileBatteryGeometry(e);
   for(let i=0;i<4;i++){
    const p=geo.podMuzzles[i%2];
    shots.push({kind:'enemy-missile',team:'enemy',x:p.x,y:p.y,launchX:p.x,launchY:p.y,vx:e.dir*(165+i*15),vy:-135-i*24,damage:ARTILLERY_DAMAGE,artillery:true,radius:6,life:6,hp:1,locking:true,handDeflectable:true,age:0,trail:[{...p}],battery:true,sourceId:e.id});
   }
   events.push({type:'battery-volley',x:e.x,y:e.y-75,enemyId:e.id,count:4});
  }
 }else{
  if(e.firePose===0){e.attackPhase='idle';e.lockProgress=0;}
  e.cooldown=Math.max(0,e.cooldown-dt);
  if(e.cooldown===0){e.warning=1.3;e.attackPhase='lock';e.lockProgress=0;events.push({type:'battery-warning',x:e.x,y:e.y-75,enemyId:e.id});}
 }
 return {shots,events};
}
