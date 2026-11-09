import {sampleSupportSurface} from './support-pose.js';
import {plantInkWheel} from './ink-leg-support.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// Three individually drawn views, not flipped copies of the side sprite.
// Crops stop in the transparent gutters of the 2172 × 724 atlas.
export const INK_TURN_VIEWS=Object.freeze([
  {crop:[12,11,734,697],anchor:[380,702],top:13,legs:[
    {foot:[82,674],hinge:438,wheelTop:594,polygon:[[103,440],[168,419],[212,456],[224,520],[177,625],[137,681],[47,681],[14,633],[14,581],[53,499]]},
    {foot:[247,702],hinge:474,wheelTop:615,polygon:[[218,474],[284,469],[333,497],[344,548],[314,635],[296,708],[192,708],[168,665],[172,585]]},
    {foot:[702,674],hinge:448,wheelTop:602,polygon:[[618,448],[665,440],[709,495],[736,550],[746,601],[738,662],[705,686],[649,686],[621,660],[610,593],[589,516]]},
  ]},
  {crop:[747,11,680,691],anchor:[1086,694],top:14,legs:[
    {foot:[809,692],hinge:415,wheelTop:607,polygon:[[811,413],[864,412],[905,458],[915,509],[898,575],[873,656],[850,700],[766,700],[749,653],[748,601],[768,523]]},
    {foot:[1363,693],hinge:415,wheelTop:606,polygon:[[1300,416],[1341,414],[1380,448],[1415,525],[1425,589],[1422,659],[1396,700],[1327,700],[1296,673],[1278,597],[1265,527]]},
  ]},
  {crop:[1429,11,730,697],anchor:[1790,702],top:13,legs:[
    {foot:[1472,674],hinge:448,wheelTop:602,polygon:[[1554,448],[1507,440],[1463,495],[1436,550],[1429,601],[1434,662],[1467,686],[1523,686],[1551,660],[1562,593],[1583,516]]},
    {foot:[1919,702],hinge:474,wheelTop:615,polygon:[[1954,474],[1888,469],[1839,497],[1828,548],[1858,635],[1876,708],[1980,708],[2004,665],[2000,585]]},
    {foot:[2088,674],hinge:438,wheelTop:594,polygon:[[2069,440],[2004,419],[1960,456],[1948,520],[1995,625],[2035,681],[2125,681],[2158,633],[2158,581],[2119,499]]},
  ]},
]);

export function inkTurnFrame(p){
  const yaw=Number.isFinite(p.turn?.yaw)?p.turn.yaw:p.dir===-1?Math.PI:0;
  return Math.round(clamp(yaw,0,Math.PI)*4/Math.PI);
}
function split(points,y,lower){
  const result=[],inside=p=>lower?p[1]>=y:p[1]<=y;
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],ai=inside(a),bi=inside(b);
    if(ai)result.push(a);
    if(ai!==bi){const u=(y-a[1])/(b[1]-a[1]);result.push([a[0]+(b[0]-a[0])*u,y]);}
  }
  return result;
}
function polygon(c,points){c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();}

export function inkTurnGeometry(p,{camera=0,scale=1,sampleGround}={}){
  const frame=inkTurnFrame(p),view=INK_TURN_VIEWS[frame-1];if(!view)return null;
  const compression=Number.isFinite(p.supportClearance)?clamp(126-p.supportClearance+4,0,20):0;
  const k=126*scale/(view.anchor[1]-view.top),x=p.x-camera,groundY=p.y,y=p.y+compression*scale;
  const floor=at=>{
    const value=sampleGround?sampleGround(at):sampleSupportSurface(p.supportPose,at);
    if((sampleGround||p.supportPose?.surface)&&!Number.isFinite(value))return NaN;
    return value??p.supportY??p.y;
  };
  const airborne=p.onGround===false;
  const back=floor(p.x-44),front=floor(p.x+44);
  const slope=airborne||!Number.isFinite(back)||!Number.isFinite(front)?(p.tilt??0):Math.atan((front-back)/88);
  const tilt=clamp(slope,-.42,.42),cos=Math.cos(tilt),sin=Math.sin(tilt);
  const point=([px,py])=>{
    const xx=(px-view.anchor[0])*k,yy=(py-view.anchor[1])*k;
    return {x:x+xx*cos-yy*sin,y:y+xx*sin+yy*cos};
  };
  const legs=view.legs.map(leg=>{
    const native=point(leg.foot);let offset=airborne?-25:0,roll=0,grounded=false;
    if(!airborne)({offset,roll,grounded}=plantInkWheel(native,{k,cos,sin,maxOffset:120,floor:at=>Number.isFinite(p.artScale)&&p.artScale!==1?floor(at+camera):groundY+(floor(p.x+(at-x)/scale)-groundY)*scale}));
    return {...leg,offset,roll,grounded,stretch:1+offset/(leg.wheelTop-leg.hinge),contact:point([leg.foot[0]+roll,leg.foot[1]+offset])};
  });
  return {frame,view,k,x,y,tilt,legs,point};
}

export function drawInkTurn(c,image,p,options={}){
  const geo=inkTurnGeometry(p,options);if(!image||!geo)return null;
  const {view}=geo,[cx,cy,cw,ch]=view.crop,draw=()=>c.drawImage(image,...view.crop,...view.crop);
  c.save();c.translate(geo.x,geo.y);c.rotate(geo.tilt);c.scale(geo.k,geo.k);c.translate(-view.anchor[0],-view.anchor[1]);
  for(const leg of geo.legs){
    c.save();c.translate(0,leg.hinge);c.transform(1,0,leg.roll/(leg.wheelTop-leg.hinge),leg.stretch,0,0);c.translate(0,-leg.hinge);
    c.beginPath();polygon(c,split(leg.polygon,leg.wheelTop,false));c.clip();draw();c.restore();
    c.save();c.translate(leg.roll,leg.offset);c.beginPath();polygon(c,split(leg.polygon,leg.wheelTop,true));c.clip();draw();c.restore();
  }
  c.beginPath();polygon(c,[[cx,cy],[cx+cw,cy],[cx+cw,cy+ch],[cx,cy+ch]]);
  for(const leg of geo.legs)polygon(c,leg.polygon);
  c.clip('evenodd');draw();c.restore();return geo;
}
