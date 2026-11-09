import {tachikomaGeometry} from './tachikoma-pose.js';

function polygon(c,points){c.moveTo(...points[0]);for(const point of points.slice(1))c.lineTo(...point);c.closePath();}
export function drawNativeBody(c,sheet,geo,additionalParts=[]){
  const {crop,k,dx,dy,distalParts,cannonPart,handPart}=geo,draw=()=>c.drawImage(sheet,...crop,dx,dy,crop[2]*k,crop[3]*k);
  const isolated=[...(cannonPart.rotation?[cannonPart]:[]),...(handPart?[handPart]:[]),...additionalParts];
  if(!distalParts.length&&!isolated.length){draw();return;}
  for(const part of distalParts){
    c.save();c.translate(0,part.hinge);c.scale(1,part.stretch);c.translate(0,-part.hinge);
    c.beginPath();polygon(c,part.strutPolygon);c.clip();draw();c.restore();
    c.save();c.translate(0,part.offset);
    c.beginPath();polygon(c,part.wheelPolygon);c.clip();draw();c.restore();
  }
  // Cabin armor occludes compressed struts that telescope behind it. Its holes
  // remove every original wheel pixel before the rigid patches are revealed.
  c.save();c.beginPath();polygon(c,[[dx,dy],[dx+crop[2]*k,dy],[dx+crop[2]*k,dy+crop[3]*k],[dx,dy+crop[3]*k]]);
  for(const part of distalParts)polygon(c,part.polygon);
  for(const part of isolated)polygon(c,part.polygon);
  c.clip('evenodd');draw();c.restore();
  for(const part of isolated){
    // Each native patch is excluded above, then drawn exactly once around
    // its measured joint. All other pixels keep the body's fixed transform.
    c.save();c.translate(...part.pivot);c.rotate(part.rotation);c.translate(-part.pivot[0],-part.pivot[1]);
    c.beginPath();polygon(c,part.polygon);c.clip();draw();c.restore();
  }
}

function flash(c,point,angle,scale,color,wide=false){
  c.save();c.translate(point.x,point.y);c.rotate(angle);c.scale(scale,scale);
  c.fillStyle=color;c.beginPath();c.moveTo(0,-4);c.lineTo(8,-3);
  c.lineTo(11,-7);c.lineTo(wide?24:27,0);c.lineTo(11,6);c.lineTo(6,3);c.lineTo(0,4);c.fill();
  c.fillStyle='#fff1c4';c.beginPath();c.moveTo(0,-2);c.lineTo(18,0);c.lineTo(0,2);c.fill();c.restore();
}

export function drawTachikoma(c,images,p,time,{camera=0,scale=1}={}){
  const geo=tachikomaGeometry(p,time,{camera,scale}),sheet=images[geo.atlas];if(!sheet)return;
  c.save();c.imageSmoothingEnabled=false;
  if(p.invulnerable>0&&Math.floor(time*18)%2)c.globalAlpha*=.6;
  c.save();c.translate(geo.x+geo.bodyOffsetX,geo.y+geo.heave);
  if(geo.bodyPivot[0]||geo.bodyPivot[1])c.translate(geo.mirror*geo.bodyPivot[0],geo.bodyPivot[1]);
  c.rotate(geo.tilt);c.scale(geo.mirror,1);
  if(geo.bodyPivot[0]||geo.bodyPivot[1])c.translate(-geo.bodyPivot[0],-geo.bodyPivot[1]);
  drawNativeBody(c,sheet,geo);c.restore();
  if(p.homingFlash>0&&!geo.weaponsLocked)for(const {base,muzzle,visible} of geo.cabinTubes)
    if(visible)flash(c,muzzle,Math.atan2(muzzle.y-base.y,muzzle.x-base.x),geo.scale*.65,'#efb269',true);
  if(p.mirvFlash>0&&geo.weaponsVisible&&!geo.weaponsLocked)flash(c,geo.cannon,geo.cannonAngle,geo.scale,'#73e3ff',true);
  if(p.muzzle>0&&geo.weaponsVisible&&!geo.weaponsLocked)flash(c,geo.arm,p.aim??(geo.dir===-1?Math.PI:0),geo.scale,'#ff9b36');
  c.restore();
}
