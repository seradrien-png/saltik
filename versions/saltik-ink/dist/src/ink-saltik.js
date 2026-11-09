import {sampleSupportSurface} from './support-pose.js';
import {inkTurnFrame,drawInkTurn} from './ink-turn.js';
import {plantInkWheel} from './ink-leg-support.js';

// The single native cream/ink cutout is 1422 × 1106. Alpha above 32 has
// bounds [102,24]–[1347,1079]; the wider file contains almost transparent noise.
// The fourth leg is behind the cabin. Never invent another limb to expose it.
export const INK_SALTIK_CROP=Object.freeze([98,20,1254,1062]);
export const INK_SALTIK_ANCHOR=Object.freeze([742,1078]);
export const INK_SALTIK_HEIGHT=126;
const PIXEL_SCALE=INK_SALTIK_HEIGHT/(1078-24);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;

// Coordinates follow painted edges, including each original black outline.
// Moving patches are also holes in the cabin draw, so no resting limbs remain.
export const INK_SALTIK_PARTS={
  legs:[
    {id:'rear-far',foot:[206,1058],hinge:720,wheelTop:928,polygon:[
      [249,711],[341,711],[392,766],[410,834],[365,951],[301,1067],
      [128,1067],[95,990],[92,936],[113,865],[173,789],[237,730],
    ]},
    {id:'rear-near',foot:[513,1078],hinge:758,wheelTop:950,polygon:[
      [511,739],[609,743],[656,793],[669,850],[640,934],[620,1010],
      [589,1085],[440,1085],[413,1043],[405,951],[417,873],[455,797],[488,757],
    ]},
    {id:'front',foot:[1257,1050],hinge:742,wheelTop:940,polygon:[
      [1144,740],[1205,740],[1268,793],[1320,858],[1356,924],
      [1356,982],[1340,1035],[1313,1063],[1212,1063],[1175,1028],
      [1146,972],[1120,910],[1098,858],[1096,811],[1115,770],
    ]},
  ],
  arms:[
    {id:'near-hand',pivot:[743,869],polygon:[
      [716,830],[754,826],[789,834],[824,859],[852,894],[858,907],
      [901,917],[924,944],[942,975],[944,1018],[924,1047],
      [892,1068],[835,1068],[800,1050],[774,1027],[760,977],
      [749,957],[718,934],[695,905],[687,884],[697,849],
    ]},
    {id:'far-hand',pivot:[1018,870],polygon:[
      [979,831],[1019,832],[1050,846],[1079,883],[1087,908],
      [1112,923],[1130,951],[1134,985],[1123,1014],[1098,1038],
      [1074,1046],[1046,1043],[1035,1028],[1035,1018],[1016,1014],
      [1004,990],[1003,965],[1006,947],[983,936],[966,912],[963,878],[969,849],
    ]},
  ],
  cannon:{id:'main-cannon',pivot:[913,270],muzzle:[1234,264],polygon:[
    [911,219],[970,212],[1013,218],[1034,226],[1139,213],
    [1158,198],[1206,188],[1242,191],[1269,207],[1284,237],
    [1287,284],[1276,313],[1253,333],[1218,340],[1172,331],
    [1144,312],[1040,317],[1012,330],[977,333],[918,327],
  ]},
};

function splitAtY(points,y,lower){
  const result=[],inside=point=>lower?point[1]>=y:point[1]<=y;
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],ai=inside(a),bi=inside(b);
    if(ai)result.push(a);
    if(ai!==bi){const t=(y-a[1])/(b[1]-a[1]);result.push([a[0]+(b[0]-a[0])*t,y]);}
  }
  return result;
}
for(const leg of INK_SALTIK_PARTS.legs){
  leg.strutPolygon=splitAtY(leg.polygon,leg.wheelTop,false);
  leg.wheelPolygon=splitAtY(leg.polygon,leg.wheelTop,true);
}
const CROP_POLYGON=[
  [98,20],[1352,20],[1352,1082],[98,1082],
];

function rotatePoint(point,pivot,rotation,offsetX=0){
  const x=point[0]-pivot[0],y=point[1]-pivot[1],cos=Math.cos(rotation),sin=Math.sin(rotation);
  return [pivot[0]+x*cos-y*sin+offsetX,pivot[1]+x*sin+y*cos];
}

export function inkSaltikGeometry(p,{camera=0,time=0,scale=1,victoryAge=null}={}){
  scale=Math.max(.01,finite(scale,1));
  const k=PIXEL_SCALE*scale,x=finite(p.x)-camera,y=finite(p.y);
  const yaw=Number.isFinite(p.turn?.yaw)?p.turn.yaw:(p.dir===-1?Math.PI:0);
  // The actual front and quarter views handle intermediate yaw. The side
  // geometry never collapses to zero width, including its camera bounds.
  const orientation=inkTurnFrame(p)>2?-1:1;
  const airborne=p.onGround===false,walking=!airborne&&Math.abs(finite(p.vx))>5;
  const explicitCompression=clamp(finite(p.jumpCompression,finite(p.preJump)),0,1);
  // Immediate V1 jumps provide no charge interval. Their first ascent frames
  // still release the same spring pose; callers can supply jumpCompression
  // during a purely presentational anticipation without changing collisions.
  const takeoff=airborne?clamp((-finite(p.vy)-610)/110,0,1):0;
  const compression=Math.max(explicitCompression,takeoff);
  const crouch=!!p.crouching,landing=clamp(finite(p.landingCompression),0,1);
  const gait=walking?Math.sin(time*14)*.65:Math.sin(time*1.8)*.17;
  const ceilingCompression=Number.isFinite(p.supportClearance)?clamp(INK_SALTIK_HEIGHT-p.supportClearance+4,0,20):0;
  const bodyDrop=(Math.max(crouch?12:0,ceilingCompression)+compression*7.4+landing*6.5+gait)*scale;
  const back=sampleSupportSurface(p.supportPose,finite(p.x)-50),front=sampleSupportSurface(p.supportPose,finite(p.x)+50);
  const slope=!airborne&&Number.isFinite(back)&&Number.isFinite(front)?Math.atan2(front-back,100):finite(p.tilt,finite(p.supportPose?.tilt));
  let tilt=clamp(slope,-.42,.42);
  const heave=finite(p.supportPose?.heave)*scale;
  if(!airborne&&Number.isFinite(p.supportClearance)){
    const rise=angle=>-Math.min(...CROP_POLYGON.map(([px,py])=>(px-INK_SALTIK_ANCHOR[0])*k*orientation*Math.sin(angle)+(py-INK_SALTIK_ANCHOR[1])*k*Math.cos(angle)));
    const available=p.supportClearance*scale+heave+bodyDrop;
    if(rise(tilt)>available){const sign=Math.sign(tilt);let lo=0,hi=Math.abs(tilt);for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(rise(sign*mid)<=available)lo=mid;else hi=mid;}tilt=sign*lo;}
  }
  const cos=Math.cos(tilt),sin=Math.sin(tilt);
  const sourcePoint=([px,py])=>{
    const xx=(px-INK_SALTIK_ANCHOR[0])*k*orientation,yy=(py-INK_SALTIK_ANCHOR[1])*k;
    return {x:x+xx*cos-yy*sin,y:y+heave+bodyDrop+xx*sin+yy*cos};
  };
  const legs=INK_SALTIK_PARTS.legs.map((part,index)=>{
    const native=sourcePoint(part.foot);
    let offset=airborne?-(22+compression*30)+Math.sin(time*7+index*1.9)*3:0,roll=0,grounded=false;
    if(!airborne){
      const floor=at=>{const support=sampleSupportSurface(p.supportPose,finite(p.x)+(at-x)/scale);if(p.supportPose?.surface&&!Number.isFinite(support))return NaN;return y+((support??finite(p.supportY,y))-y)*scale;};
      ({offset,roll,grounded}=plantInkWheel(native,{k,cos,sin,floor,orientation}));
    }
    const stretch=1+offset/(part.wheelTop-part.hinge);
    return {...part,offset,roll,stretch,grounded,contact:sourcePoint([part.foot[0]+roll,part.foot[1]+offset])};
  });
  const elapsed=finite(p.deflect?.elapsed),parrying=!!p.deflect?.active;
  let nearRotation=0,farRotation=0;
  if(parrying){
    const envelope=elapsed<.1?elapsed/.1:elapsed<.27?1:clamp(1-(elapsed-.27)/.35,0,1);
    nearRotation=-.95*envelope;
    farRotation=-.22*envelope;
    if(elapsed>.27)nearRotation+=Math.sin((elapsed-.27)*48)*.045*envelope;
  }else if(p.melee?.phase==='windup')nearRotation=.18;
  else if(p.melee?.phase==='impact')nearRotation=-.82;
  else if(p.melee?.phase==='recovery')nearRotation=-.82*clamp(1-finite(p.melee.elapsed)/.35,0,1);
  else if(victoryAge!==null){nearRotation=-.35-Math.sin(finite(victoryAge)*5)*.12;farRotation=-.25;}
  else if(walking){nearRotation=Math.sin(time*7)*.035;farRotation=-nearRotation*.6;}
  const arms=INK_SALTIK_PARTS.arms.map((part,index)=>({...part,rotation:index?farRotation:nearRotation}));
  const weaponsLocked=parrying||!!p.evasion?.active||!!p.turn?.active;
  const recoil=clamp(finite(p.cannonRecoil,Math.max(finite(p.mirvFlash)/.18,finite(p.muzzle)/.07*.22)),0,1);
  const cannonPart={...INK_SALTIK_PARTS.cannon,rotation:weaponsLocked?0:-clamp(finite(p.cannonElevation),0,1.1),offsetX:-26*recoil};
  const cannon=sourcePoint(rotatePoint(cannonPart.muzzle,cannonPart.pivot,cannonPart.rotation,cannonPart.offsetX));
  const cannonBase=sourcePoint([cannonPart.pivot[0]+cannonPart.offsetX,cannonPart.pivot[1]]);
  const arm=sourcePoint([1046,368]),face=sourcePoint([930,747]);
  const boundsPoints=[...CROP_POLYGON.map(sourcePoint),...legs.map(leg=>leg.contact),
    ...arms.flatMap(part=>part.polygon.map(point=>sourcePoint(rotatePoint(point,part.pivot,part.rotation)))),
    ...cannonPart.polygon.map(point=>sourcePoint(rotatePoint(point,cannonPart.pivot,cannonPart.rotation,cannonPart.offsetX)))];
  const xs=boundsPoints.map(point=>point.x),ys=boundsPoints.map(point=>point.y);
  const bounds={x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
  return {x,y,k,scale,yaw,orientation,tilt,heave,bodyDrop,compression,airborne,legs,arms,cannonPart,cannon,cannonBase,
    cannonAngle:Math.atan2(cannon.y-cannonBase.y,cannon.x-cannonBase.x),arm,face,sourcePoint,bounds,
    visibleHeight:INK_SALTIK_HEIGHT*scale,weaponsLocked};
}

function polygon(c,points){
  c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();
}

export function drawInkSaltik(c,image,p,{camera=0,time=0,scale=1,victoryAge=null,turnImage=null,sampleGround}={}){
  if(!image)return null;
  const geo=inkSaltikGeometry(p,{camera,time,scale,victoryAge});
  const draw=()=>c.drawImage(image,...INK_SALTIK_CROP,...INK_SALTIK_CROP);
  c.save();c.imageSmoothingEnabled=true;
  if(p.invulnerable>0&&Math.floor(time*18)%2)c.globalAlpha*=.65;
  if(drawInkTurn(c,turnImage,p,{camera,scale,sampleGround})){c.restore();return geo;}
  c.translate(geo.x,geo.y+geo.heave+geo.bodyDrop);c.rotate(geo.tilt);
  c.scale(geo.k*geo.orientation,geo.k);c.translate(-INK_SALTIK_ANCHOR[0],-INK_SALTIK_ANCHOR[1]);
  for(const part of geo.legs){
    c.save();c.translate(0,part.hinge);c.transform(1,0,part.roll/(part.wheelTop-part.hinge),part.stretch,0,0);c.translate(0,-part.hinge);
    c.beginPath();polygon(c,part.strutPolygon);c.clip();draw();c.restore();
    c.save();c.translate(part.roll,part.offset);
    c.beginPath();polygon(c,part.wheelPolygon);c.clip();draw();c.restore();
  }
  c.save();c.beginPath();polygon(c,CROP_POLYGON);
  for(const part of [...geo.legs,...geo.arms,geo.cannonPart])polygon(c,part.polygon);
  c.clip('evenodd');draw();c.restore();
  for(const part of [geo.cannonPart,...geo.arms]){
    c.save();c.translate(part.pivot[0]+finite(part.offsetX),part.pivot[1]);c.rotate(part.rotation);
    c.translate(-part.pivot[0],-part.pivot[1]);
    c.beginPath();polygon(c,part.polygon);c.clip();draw();c.restore();
  }
  // Only a faint reflected pin of light changes in the existing black eyes.
  // The eyes, mouth aperture and the entire faceplate remain the same pixels.
  c.globalAlpha*=.10+.05*Math.sin(time*1.65);
  c.fillStyle='#fff9e6';
  for(const [x,y] of [[891,713],[1021,713]]){c.beginPath();c.ellipse(x,y,3.2,4.3,0,0,Math.PI*2);c.fill();}
  c.restore();
  return geo;
}
