// Native troops arrive in place. The simulation owns this clock; painting is
// read-only so pausing, slow frames, and a fresh level cannot age the effect.
const TYPES=new Set(['soldier','walker','turret','drone']);
export const ENEMY_DOWNLOAD_DURATION=1.15;
export function initializeEnemyDownload(g,e,groundY=e.y){
 if(g.inkCampaign&&TYPES.has(e.type)&&!e.carrierId)e.download={phase:'waiting',elapsed:0,groundY};
 return e;
}
export const enemyDownloadPending=e=>!!e.download&&e.download.phase!=='solid';
export function advanceEnemyDownload(g,e,dt){
 const d=e.download;if(!d||d.phase==='solid')return false;
 if(d.phase==='waiting'){
  const v=g.viewport??{x:g.player.x-360,w:1280};
  // A small inset keeps even the narrow phone view's first scan visible. The
  // authored spawn-ahead distance must never silently consume the arrival.
  if(e.x<v.x+40||e.x>v.x+v.w-40)return true;
  d.phase='assembling';
 }
 d.elapsed=Math.min(ENEMY_DOWNLOAD_DURATION,d.elapsed+dt);
 if(d.elapsed>=ENEMY_DOWNLOAD_DURATION){d.phase='solid';return false;}
 return true;
}
export function drawEnemyDownload(c,e,bounds,{camera=0}={},drawBody){
 const d=e.download;if(!d||d.phase==='solid'){drawBody();return;}
 if(d.phase==='waiting')return;
 const p=d.elapsed/ENEMY_DOWNLOAD_DURATION,x=bounds.x-camera,y=bounds.y,w=bounds.w,h=bounds.h;
 const scan=y+h*(1-p),ground=d.groundY,center=e.x-camera;
 // Each assembled band is the real opaque actor artwork, using its unchanged
 // transform and exclusions. No substitute silhouette or new texture exists.
 c.save();c.beginPath();c.rect(x-2,scan,w+4,y+h-scan+3);c.clip();drawBody();c.restore();
 c.save();c.fillStyle='#476C66';c.fillRect(center-18,ground-2,36,3);
 c.fillStyle='#C4EAE0';c.fillRect(center-13,ground-4,26,2);
 c.strokeStyle='#79BDAE';c.lineWidth=1;c.beginPath();c.moveTo(center-18,ground-3);c.lineTo(x,scan);c.moveTo(center+18,ground-3);c.lineTo(x+w,scan);c.stroke();
 c.fillStyle='#DDF8E8';c.fillRect(x-3,scan-2,w+6,3);c.fillStyle='#4A8B7D';c.fillRect(x,scan+1,w,1);
 // Twelve fixed packets bound work on mobile. They settle toward the moving
 // scan rather than adding persistent particles to the game state.
 for(let i=0;i<12;i++){
  const phase=(p*2.6+i*.173)%1,px=x+((i*37+17)%101)/101*w,py=scan-6-phase*Math.min(h*.38,35);
  c.fillStyle=i%3?'#8FCDBB':'#E6F6D5';c.fillRect(px,py,2+i%3,2+i%2);
 }
 c.restore();
}
