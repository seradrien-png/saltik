// Combat clocks are independent of artwork and use simulation time only.
const EPS=1e-9;
export function initializeGatling(p){
  if(p.character!=='gatling')return null;
  const state=p.gatling??={};
  for(const [key,value] of Object.entries({firing:false,heat:0,sustained:0,cooldown:0,spin:0,rocketFlash:0,rocketIndex:0,gunIndex:0,shotClock:0,rocketClock:0,rocketRemaining:0,rocketRecharge:0,recoil:0}))state[key]??=value;
  return state;
}
export function stopGatling(p){const s=initializeGatling(p);if(!s)return;s.firing=false;s.sustained=0;s.shotClock=0;s.recoil=0;s.rocketRemaining=0;}
export function gatlingCanFire(p,input){const s=initializeGatling(p);return !!s&&!!input.fire&&s.cooldown<=EPS&&!p.turn?.active&&!p.evasion?.active&&!input.shift&&(!p.melee||p.melee.phase==='idle');}
export function advanceGatling(p,input,dt,{shot,rocket,event}){
  const s=initializeGatling(p),locked=p.turn?.active||p.evasion?.active||input.shift||(p.melee&&p.melee.phase!=='idle');
  s.rocketFlash=Math.max(0,s.rocketFlash-dt);s.rocketRecharge=Math.max(0,s.rocketRecharge-dt);if(s.rocketRecharge<EPS)s.rocketRecharge=0;
  if(locked){s.rocketRemaining=0;}
  if(!locked&&input.missile&&s.rocketRecharge===0){s.rocketRecharge=5.2;s.rocketRemaining=8;s.rocketClock=0;s.rocketIndex=0;}
  if(s.rocketRemaining){let at=s.rocketClock;while(s.rocketRemaining&&at<dt-EPS){rocket(s.rocketIndex++);s.rocketRemaining--;s.rocketFlash=.16;at+=.04;}s.rocketClock=at-dt;}
  s.firing=false;
  if(s.cooldown>0){s.cooldown=Math.max(0,s.cooldown-dt);if(s.cooldown<EPS){s.cooldown=0;event('gatling-cooled');}s.heat=s.cooldown/5;s.sustained=0;s.shotClock=0;return;}
  if(!gatlingCanFire(p,input)){s.sustained=0;s.shotClock=0;s.heat=Math.max(0,s.heat-dt*.35);return;}
  s.firing=true;
  const active=Math.min(dt,5-s.sustained);let at=s.shotClock;
  while(at<active-EPS){shot(s.gunIndex++%2);at+=1/30;}
  s.shotClock=Math.max(0,at-active);s.spin+=active*30;s.sustained=Math.min(5,s.sustained+active);s.heat=s.sustained/5;
  if(s.sustained>=5-EPS){s.sustained=5;s.heat=1;s.cooldown=5;s.firing=false;s.shotClock=0;event('gatling-overheat');}
}
