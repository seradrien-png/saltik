import {specialistGeometry} from './enemy-specialists.js';
export const LONGRANGE_TUNING=Object.freeze({range:3600,interval:5.2,warning:1.15,spacing:.22,salvo:6,maxHostile:48});
export function advanceLongrange(e,{g,dt,groundAt}){
 const shots=[],events=[],t=LONGRANGE_TUNING,p=g.player;
 if(!(dt>0))return{shots,events};
 if(e.hp<=0||e.neutralized||p.hp<=0){e.longrangePending=[];return{shots,events};}
 e.y=groundAt(e.x);e.vx=0;e.dir=p.x>=e.x?1:-1;e.longrangeClock=(e.longrangeClock??0)+dt;
 const distance=Math.abs(p.x-e.x);if(distance>t.range||p.x-e.x>2500){e.longrangePending=[];e.attackPhase='idle';return{shots,events};}
 if(!e.longrangePending?.length&&e.longrangeClock>=(e.longrangeNext??.8)){
  e.longrangeSpent=Array(8).fill(false);e.longrangeNext=e.longrangeClock+t.interval;e.longrangePending=Array.from({length:t.salvo},(_,i)=>({at:e.longrangeClock+t.warning+i*t.spacing,index:[0,4,1,5,2,6][i]}));e.attackPhase='lock';events.push({type:'enemy-lock',x:e.x,y:e.y-85,enemyId:e.id,weapon:'longrange'});
 }
 for(const q of e.longrangePending??[])if(q.at<=e.longrangeClock){
  if(g.projectiles.filter(s=>s.team==='enemy'&&s.life>0).length+shots.length<t.maxHostile){const slot=specialistGeometry(e,g.time).podSlots[q.index];shots.push({kind:'enemy-missile',team:'enemy',sourceEnemyId:e.id,longrange:true,x:slot.muzzle.x,y:slot.muzzle.y,vx:slot.axis.x*250,vy:-300,damage:8,radius:6,life:16,hp:1,hostileLoft:true,locking:true,age:0,trail:[{...slot.muzzle}]});e.longrangeSpent[q.index]=true;events.push({type:'enemy-missile',x:slot.muzzle.x,y:slot.muzzle.y,enemyId:e.id});}q.fired=true;e.attackPhase='launch';
 }
 e.longrangePending=(e.longrangePending??[]).filter(q=>!q.fired);return{shots,events};
}
export function addLongrangePositions(g){
 if(g.level===4)return g;
 const sites=g.level===5?[10150,18200]:g.level===3?[6250,13800]:g.level===2?[5160,14350]:[6200,13500];
 for(const [i,x]of sites.entries())g.schedule.push({id:`longrange-${g.level}-${i}`,type:'saltik',enemyModel:'longrange',x,anchorX:x,spawnAt:x-2400});g.schedule.sort((a,b)=>(a.spawnAt??a.x)-(b.spawnAt??b.x));return g;
}
