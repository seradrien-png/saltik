// Approved rolling rig: real terrain drives the foot; the original hip pixels
// stay fixed. No animation clock or gait cycle is involved.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// The existing support pose is capped at .20 rad for the older small rig.
// Dampen its transient difference, without flattening a steep actual stair.
export function rollingBodyTilt(slope,pose){
 if(!Number.isFinite(pose?.tilt))return slope;
 return slope+clamp(pose.tilt-clamp(slope,-.20,.20),-.06,.06);
}
export function rollingLegPose(part,k,anchorX,enabled=true){
 if(!enabled||!(k>0)||!(part.wheelTop>part.hinge))return null;
 const knee=part.hinge+(part.wheelTop-part.hinge)*.54;
 const bend=Math.sign(part.foot[0]-anchorX)*clamp(-part.offset*k,-3,6)*.35/k;
 // Match vertical travel to the .54/.46 segment lengths. Both scales
 // then remain positive whenever the complete strut is still upright.
 return{knee,kneeRoll:part.roll*.46+bend,kneeOffset:part.offset*.54};
}
export function rollingStrutPoint(part,[x,y]){
 const pose=part.suspension;if(!pose||y<=part.hinge)return[x,y];
 if(y<=pose.knee){const u=(y-part.hinge)/(pose.knee-part.hinge);return[x+pose.kneeRoll*u,y+pose.kneeOffset*u];}
 const u=(y-pose.knee)/(part.wheelTop-pose.knee);
 return[x+pose.kneeRoll+(part.roll-pose.kneeRoll)*u,y+pose.kneeOffset+(part.offset-pose.kneeOffset)*u];
}
function split(points,y,lower){
 const out=[],inside=p=>lower?p[1]>=y:p[1]<=y;
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],aa=inside(a),bb=inside(b);if(aa)out.push(a);if(aa!==bb){const t=(y-a[1])/(b[1]-a[1]);out.push([a[0]+(b[0]-a[0])*t,y]);}}
 return out;
}
export function drawRollingLegStrut(c,part,points,draw){
 const {knee,kneeRoll,kneeOffset}=part.suspension;
 const paint=poly=>{if(poly.length<3)return;c.beginPath();c.moveTo(...poly[0]);for(const p of poly.slice(1))c.lineTo(...p);c.closePath();c.clip();draw();};
 c.save();paint(split(points,part.hinge,false));c.restore();
 c.save();c.translate(0,part.hinge);c.transform(1,0,kneeRoll/(knee-part.hinge),1+kneeOffset/(knee-part.hinge),0,0);c.translate(0,-part.hinge);paint(split(split(points,part.hinge,true),knee,false));c.restore();
 c.save();c.translate(kneeRoll,kneeOffset);c.translate(0,knee);c.transform(1,0,(part.roll-kneeRoll)/(part.wheelTop-knee),1+(part.offset-kneeOffset)/(part.wheelTop-knee),0,0);c.translate(0,-knee);paint(split(points,knee,true));c.restore();
}
