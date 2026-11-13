import {jumpLegOffset,jumpLegExtension} from './jump-leg-pose.js';
import {augmentModernGeometry,drawModernStriker} from './modern-striker-art.js';
import {drawNativeTurn} from './character-turns.js';
import {btGeometry,drawBT} from './bt-art.js';
import {sampleSupportSurface} from './support-pose.js';
import {inkTurnFrame,inkTurnGeometry,drawInkTurn} from './ink-turn.js';
import {plantInkWheel} from './ink-leg-support.js';
import {drawInkPlayerPods} from './ink-pods.js';
import {augmentGatlingGeometry,drawGatling} from './gatling-art.js';

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
    {id:'rear-far',foot:[206,1058],hinge:720,wheelTop:928,wheelCenter:[223,1000],wheelRadius:[43,55],polygon:[
      [249,711],[341,711],[392,766],[410,834],[365,951],[301,1067],
      [128,1067],[95,990],[92,936],[113,865],[173,789],[237,730],
    ]},
    {id:'rear-near',foot:[513,1078],hinge:758,wheelTop:950,wheelCenter:[540,1021],wheelRadius:[38,51],polygon:[
      [511,739],[609,743],[656,793],[669,850],[640,934],[620,1010],
      [589,1085],[440,1085],[413,1043],[405,951],[417,873],[455,797],[488,757],
    ]},
    {id:'front',foot:[1257,1050],hinge:742,wheelTop:940,wheelCenter:[1272,1001],wheelRadius:[35,46],polygon:[
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
  coax:{id:'small-coax',pivot:[830,365],muzzle:[1046,368],polygon:[[786,337],[829,331],[863,335],[892,343],[1009,340],[1048,344],[1060,357],[1062,381],[1049,396],[1016,398],[1001,390],[884,392],[857,401],[820,397],[789,383],[780,360]]},
  cannon:{id:'main-cannon',pivot:[913,270],muzzle:[1234,264],polygon:[
    [911,219],[970,212],[1013,218],[1034,226],[1139,213],
    [1158,198],[1206,188],[1242,191],[1269,207],[1284,237],
    [1287,284],[1276,313],[1253,333],[1218,340],[1172,331],
    [1144,312],[1040,317],[1012,330],[977,333],[918,327],
  ]},
  // The whole original roof assembly: optic, cream housing, sight, main
  // barrel, coax and their black mounting foot. The aerials and cabin stay.
  // Keep cannon above as the barrel-only mask used by the boss breach rig.
  turret:{id:'upper-turret',pivot:[742,408],polygon:[
    [545,266],[574,246],[612,230],[608,203],[611,181],[624,161],
    [647,148],[693,134],[730,131],[762,138],[782,158],[792,187],
    [817,187],[840,192],[875,186],[928,186],[958,193],[980,212],
    [1138,208],[1157,192],[1206,184],[1244,187],[1274,204],
    [1290,237],[1293,284],[1281,317],[1257,337],[1218,345],
    [1171,337],[1141,319],[1080,323],[1049,330],[1068,342],
    [1081,359],[1081,383],[1066,402],[1049,409],[1017,409],[1000,400],[930,401],
    [916,418],[885,422],[834,409],[793,411],[774,418],
    [742,411],[707,411],[693,416],[660,416],[641,405],
    [606,410],[574,398],[548,376],
  ]},
};

// Pivoting exposes the ink edges hidden by the resting mount. Carry the
// complete outlines, while leaving the legacy boss breach masks unchanged.
// Include the two-pixel production ink outline around the native roof mask.
// At rest the original mask/draw path is retained exactly.
const PIVOT_TURRET_POLYGON=outsetPolygon(INK_SALTIK_PARTS.turret.polygon,4);
const PIVOT_CANNON_POLYGON=[
 [908,215],[971,208],[1015,213],[1040,222],[1138,209],[1158,193],
 [1207,184],[1245,187],[1274,202],[1290,235],[1293,285],[1281,317],
 [1256,338],[1217,345],[1170,336],[1140,318],[1040,322],
 [1015,331],[977,333],[912,329],
];
const PIVOT_COAX_POLYGON=[
 [785,335],[829,329],[863,333],[892,340],[1008,334],[1048,333],
 [1064,344],[1078,359],[1078,381],[1064,399],[1048,405],[1014,405],
 [1000,396],[884,398],[857,407],[819,403],[786,389],[775,361],
];
// Native turn views keep their original resting roof while weapons are locked.
// These points describe their painted mouths; no side-view roof is overlaid.
const TURN_TURRETS=[
 {polygon:[[305,183],[318,162],[350,143],[345,119],[354,99],[385,82],[415,76],[438,81],[451,99],[454,121],[485,115],[509,117],[533,128],[559,119],[582,107],[607,107],[632,123],[642,145],[644,177],[631,199],[608,211],[579,212],[556,204],[540,211],[544,232],[534,248],[512,254],[478,249],[460,262],[419,260],[398,265],[359,263],[336,257],[308,251]],
  cannon:{pivot:[451,173],muzzle:[593,169]},coax:{pivot:[472,240],muzzle:[523,240]}},
 {polygon:[[969,194],[978,166],[994,146],[989,123],[996,103],[1018,86],[1042,77],[1062,80],[1081,94],[1086,113],[1110,107],[1138,111],[1160,130],[1172,153],[1183,179],[1188,219],[1186,249],[1168,259],[1128,258],[1110,268],[1085,268],[1069,256],[1030,258],[1004,263],[973,256]],
  cannon:{pivot:[1090,192],muzzle:[1090,164]},coax:{pivot:[1086,251],muzzle:[1086,239]}},
 {polygon:[[1530,146],[1540,123],[1566,107],[1592,107],[1615,119],[1641,128],[1665,117],[1688,115],[1720,121],[1722,99],[1736,81],[1761,76],[1790,82],[1820,99],[1830,119],[1826,143],[1857,162],[1870,183],[1867,251],[1839,257],[1816,263],[1777,265],[1756,260],[1714,262],[1696,249],[1662,254],[1640,248],[1630,232],[1634,211],[1618,204],[1595,212],[1566,211],[1543,199],[1530,177]],
  cannon:{pivot:[1723,173],muzzle:[1581,169]},coax:{pivot:[1702,240],muzzle:[1651,240]}},
];

function outsetPolygon(points,margin){
  return points.map((point,index)=>{
    const a=points[(index+points.length-1)%points.length],b=points[(index+1)%points.length];
    const ax=point[0]-a[0],ay=point[1]-a[1],bx=b[0]-point[0],by=b[1]-point[1];
    const al=Math.hypot(ax,ay),bl=Math.hypot(bx,by),nx=ay/al+by/bl,ny=-ax/al-bx/bl;
    const amount=margin/(1+(ax*bx+ay*by)/(al*bl));
    return [point[0]+nx*amount,point[1]+ny*amount];
  });
}

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

function rotatePoint(point,pivot,rotation,offsetX=0,offsetY=0){
  const x=point[0]-pivot[0],y=point[1]-pivot[1],cos=Math.cos(rotation),sin=Math.sin(rotation);
  return [pivot[0]+x*cos-y*sin+offsetX,pivot[1]+x*sin+y*cos+offsetY];
}

export function inkSaltikGeometry(p,{camera=0,time=0,scale=1,victoryAge=null,sampleGround}={}){
  scale=Math.max(.01,finite(scale,1)*finite(p.artScale,1));
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
  const speed=clamp(Math.abs(finite(p.vx))/230,0,1);
  const gait=walking?Math.sin(time*14)*(1+.35*speed):Math.sin(time*1.8)*.24;
  const ceilingCompression=Number.isFinite(p.supportClearance)?clamp(INK_SALTIK_HEIGHT-p.supportClearance+4,0,20):0;
  let bodyDrop=(Math.max(crouch?12:0,ceilingCompression)+compression*7.4+landing*6.5+gait)*scale;
  const back=sampleSupportSurface(p.supportPose,finite(p.x)-50),front=sampleSupportSurface(p.supportPose,finite(p.x)+50);
  const slope=!airborne&&Number.isFinite(back)&&Number.isFinite(front)?Math.atan2(front-back,100):finite(p.tilt,finite(p.supportPose?.tilt));
  // Momentum is smoothed by the fixed-step simulation. It changes only the
  // rigid cabin transform; the same support solver still plants every wheel.
  const motionLean=clamp(finite(p.motionLean),-.055,.055);
  let tilt=clamp(slope+motionLean,-.42,.42);
  let heave=(finite(p.supportPose?.heave)+clamp(finite(p.motionHeave),-1.35,1.35))*scale;
  if(!airborne&&Number.isFinite(p.supportClearance)){
    const rise=angle=>-Math.min(...CROP_POLYGON.map(([px,py])=>(px-INK_SALTIK_ANCHOR[0])*k*orientation*Math.sin(angle)+(py-INK_SALTIK_ANCHOR[1])*k*Math.cos(angle)));
    const available=p.supportClearance*scale+heave+bodyDrop;
    if(rise(tilt)>available){const sign=Math.sign(tilt);let lo=0,hi=Math.abs(tilt);for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(rise(sign*mid)<=available)lo=mid;else hi=mid;}tilt=sign*lo;}
  }
  if(p.visualModel==='modern-striker'&&p.modernStage){tilt=finite(p.modernStage.tilt,tilt);heave=finite(p.modernStage.heave,heave);bodyDrop=finite(p.modernStage.bodyDrop,bodyDrop);}
  if(p.character==='gatling'&&p.gatlingStage){tilt=finite(p.gatlingStage.tilt,tilt);heave=finite(p.gatlingStage.heave,heave);bodyDrop=finite(p.gatlingStage.bodyDrop,bodyDrop);}
  const cos=Math.cos(tilt),sin=Math.sin(tilt);
  const sourcePoint=([px,py])=>{
    const xx=(px-INK_SALTIK_ANCHOR[0])*k*orientation,yy=(py-INK_SALTIK_ANCHOR[1])*k;
    return {x:x+xx*cos-yy*sin,y:y+heave+bodyDrop+xx*sin+yy*cos};
  };
  const legs=INK_SALTIK_PARTS.legs.map((part,index)=>{
    const splay=jumpLegOffset(p,part.foot[0],INK_SALTIK_ANCHOR[0],k,scale),native=sourcePoint([part.foot[0]+splay,part.foot[1]]);
    let offset=airborne?(p.jumpLegs?jumpLegExtension(p,k,scale):-(22+compression*30)+Math.sin(time*7+index*1.9)*3):0,roll=splay,grounded=false;
    if(!airborne){
      const floor=at=>{
        if(finite(p.artScale,1)!==1){
          const worldX=at+camera,support=sampleGround?.(worldX)??sampleSupportSurface(p.supportPose,worldX);
          if(p.supportPose?.surface&&!Number.isFinite(support))return NaN;
          return support??finite(p.supportY,y);
        }
        const support=sampleSupportSurface(p.supportPose,finite(p.x)+(at-x)/scale);if(p.supportPose?.surface&&!Number.isFinite(support))return NaN;return y+((support??finite(p.supportY,y))-y)*scale;
      };
      ({offset,roll,grounded}=plantInkWheel(native,{k,cos,sin,floor,orientation}));roll+=splay;
    }
    const stretch=1+offset/(part.wheelTop-part.hinge);
    // Travel rather than the animation clock turns the ink on the tire. A
    // stopped or paused Saltik does not spin its wheels in place.
    const wheelSpin=finite(p.motionDistance)/(part.wheelRadius[1]*PIXEL_SCALE)*orientation;
    return {...part,offset,roll,stretch,grounded,wheelSpin,contact:sourcePoint([part.foot[0]+roll,part.foot[1]+offset])};
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
  else if(walking){nearRotation=Math.sin(time*7)*(.065+.025*speed);farRotation=-Math.sin(time*7+.3)*(.045+.015*speed);}
  else{nearRotation=Math.sin(time*1.65)*.032;farRotation=-Math.sin(time*1.65)*.024;}
  const arms=INK_SALTIK_PARTS.arms.map((part,index)=>({...part,rotation:index?farRotation:nearRotation}));
  const frame=inkTurnFrame(p),turnFrame=frame>0&&frame<4;
  const weaponsLocked=parrying||!!p.evasion?.active||!!p.turn?.active||turnFrame;
  const pulse=(remaining,duration)=>{const t=clamp(1-finite(remaining)/duration,0,1);return Math.sin(Math.PI*t)**2;};
  const recoil=Number.isFinite(p.cannonRecoil)?clamp(p.cannonRecoil,0,1):pulse(p.mirvFlash,.18);
  const elevation=weaponsLocked?0:clamp(finite(p.cannonElevation),0,1.1);
  const turretArticulated=elevation>0,seating=elevation/1.1;
  // The roof and yellow carénage rotate around the original attached foot.
  // A two-world-unit seating stroke follows the hinge, never a detached lift.
  let turretPart={...INK_SALTIK_PARTS.turret,polygon:turretArticulated?PIVOT_TURRET_POLYGON:INK_SALTIK_PARTS.turret.polygon,rotation:-elevation,
    offsetX:-1.6/PIXEL_SCALE*seating,offsetY:-1.2/PIXEL_SCALE*seating};
  let turretPoint=point=>sourcePoint(rotatePoint(point,turretPart.pivot,turretPart.rotation,turretPart.offsetX,turretPart.offsetY));
  const coaxStroke=12*pulse(p.muzzle,.07),coaxBore=Math.atan2(3,216);
  let coaxPart={...INK_SALTIK_PARTS.coax,polygon:turretArticulated?PIVOT_COAX_POLYGON:INK_SALTIK_PARTS.coax.polygon,
    rotation:0,offsetX:-coaxStroke*Math.cos(coaxBore),offsetY:-coaxStroke*Math.sin(coaxBore)};
  // Keep the established idle barrel aim and original cutouts pixel-identical.
  // During MIRV the barrel inherits the roof angle and only slides axially.
  const idleAim=elevation||p.mirvPending?0:Math.sin(time*1.15)*.012;
  const rotation=weaponsLocked||turretArticulated?0:idleAim-(Number.isFinite(p.cannonRecoil)?0:.008*recoil);
  const bore=rotation+Math.atan2(-6,321);
  let cannonPart={...INK_SALTIK_PARTS.cannon,polygon:turretArticulated?PIVOT_CANNON_POLYGON:INK_SALTIK_PARTS.cannon.polygon,
    rotation,offsetX:-26*recoil*Math.cos(bore),offsetY:-26*recoil*Math.sin(bore)};
  let weaponSourcePoint=turretArticulated?turretPoint:sourcePoint,turnTurret=null;
  if(turnFrame){
    const turn=inkTurnGeometry(p,{camera,scale,sampleGround}),part=TURN_TURRETS[frame-1];
    weaponSourcePoint=turn.point;turretPoint=turn.point;
    turretPart={id:'upper-turret-turn',pivot:part.cannon.pivot,polygon:part.polygon,rotation:0,offsetX:0,offsetY:0};
    cannonPart={...part.cannon,rotation:0,offsetX:0,offsetY:0,polygon:part.polygon};
    coaxPart={...part.coax,rotation:0,offsetX:0,offsetY:0,polygon:part.polygon};
    turnTurret=turn;
  }
  const cannonPoint=point=>weaponSourcePoint(rotatePoint(point,cannonPart.pivot,cannonPart.rotation,cannonPart.offsetX,cannonPart.offsetY));
  const coaxPoint=point=>weaponSourcePoint(rotatePoint(point,coaxPart.pivot,coaxPart.rotation,coaxPart.offsetX,coaxPart.offsetY));
  const cannon=cannonPoint(cannonPart.muzzle),cannonBase=cannonPoint(cannonPart.pivot);
  const arm=coaxPoint(coaxPart.muzzle),face=sourcePoint([930,747]);
  const gaze=Math.sin(time*.72)*4+clamp(finite(p.vx)/230,-1,1)*2;
  const eyeReflections=[[891,713],[1021,713]].map(([px,py],index)=>({x:px+gaze,y:py+Math.sin(time*.91+index*.12)*2,rx:3.2,ry:4.3}));
  const boundsPoints=[...CROP_POLYGON.map(sourcePoint),...legs.map(leg=>leg.contact),
    ...arms.flatMap(part=>part.polygon.map(point=>sourcePoint(rotatePoint(point,part.pivot,part.rotation)))),
    ...cannonPart.polygon.map(cannonPoint),...coaxPart.polygon.map(coaxPoint),
    ...turretPart.polygon.map(turretPoint)];
  const xs=boundsPoints.map(point=>point.x),ys=boundsPoints.map(point=>point.y);
  const bounds={x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
  const result={x,y,k,scale,yaw,orientation,tilt,heave,bodyDrop,compression,airborne,legs,arms,eyeReflections,coaxPart,cannonPart,cannon,cannonBase,
    turretLift:0,turretArticulated,turretPart,turretPoint,turretSupports:[],turnTurret,cannonPoint,coaxPoint,
    cannonAngle:Math.atan2(cannon.y-cannonBase.y,cannon.x-cannonBase.x),arm,face,sourcePoint,bounds,
    visibleHeight:INK_SALTIK_HEIGHT*scale,weaponsLocked};
  if(p.visualModel==='modern-striker')return augmentModernGeometry(p,result,{camera,time,sampleGround});
  if(p.character==='bt')return btGeometry(p,{camera,time,scale:scale/(p.artScale??1)},result);
  return p.character==='gatling'?augmentGatlingGeometry(p,result,{camera,time,sampleGround}):result;
}

function polygon(c,points){
  c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();
}

function drawWheelInk(c,part){
  const [x,y]=part.wheelCenter,[rx,ry]=part.wheelRadius;
  c.globalAlpha*=.62;c.fillStyle='#fff4da';
  // Two short, offset tread highlights rotate inside the original wheel mask.
  // Keeping the texture and silhouette fixed avoids distorting painted tires.
  for(const phase of [part.wheelSpin,part.wheelSpin+Math.PI]){
    const cos=Math.cos(phase),sin=Math.sin(phase),r=.7;
    const cx=x+cos*rx*r,cy=y+sin*ry*r,tx=-sin*5,ty=cos*6;
    c.beginPath();polygon(c,[[cx+tx+cos*2.3,cy+ty+sin*2.3],[cx-tx+cos*2.3,cy-ty+sin*2.3],
      [cx-tx-cos*2.3,cy-ty-sin*2.3],[cx+tx-cos*2.3,cy+ty-sin*2.3]]);c.fill();
  }
}

function transformPart(c,part){
  c.translate(part.pivot[0]+finite(part.offsetX),part.pivot[1]+finite(part.offsetY));
  c.rotate(part.rotation);c.translate(-part.pivot[0],-part.pivot[1]);
}

export function drawInkSaltik(c,image,p,{camera=0,time=0,scale=1,victoryAge=null,turnImage=null,sampleGround}={}){
  if(!image)return null;
  if(victoryAge!==null)p={...p,jumpLegs:null};
  let geo=inkSaltikGeometry(p,{camera,time,scale,victoryAge,sampleGround});
  if(drawNativeTurn(c,turnImage,p,{camera,scale,time}))return geo;
  if(p.visualModel==='modern-striker')return drawModernStriker(c,image,p,geo,{time});
  if(p.character==='bt')return drawBT(c,image,p,{camera,time,scale});
  if(p.character==='gatling')return drawGatling(c,image,p,geo,{time});
  if(geo.turnTurret&&!turnImage){
    // Match the established side-view fallback when the optional atlas is
    // unavailable; its returned mouth positions must match that same draw.
    geo=inkSaltikGeometry({...p,turn:{...p.turn,yaw:geo.orientation<0?Math.PI:0}},{camera,time,scale,victoryAge,sampleGround});
  }
  const draw=()=>c.drawImage(image,...INK_SALTIK_CROP,...INK_SALTIK_CROP);
  c.save();c.imageSmoothingEnabled=true;
  if(p.invulnerable>0&&Math.floor(time*18)%2)c.globalAlpha*=.65;
  if(drawInkTurn(c,turnImage,p,{camera,scale:geo.scale,sampleGround})){c.restore();drawInkPlayerPods(c,p,geo,{time});return geo;}
  c.translate(geo.x,geo.y+geo.heave+geo.bodyDrop);c.rotate(geo.tilt);
  c.scale(geo.k*geo.orientation,geo.k);c.translate(-INK_SALTIK_ANCHOR[0],-INK_SALTIK_ANCHOR[1]);
  for(const part of geo.legs){
    c.save();c.translate(0,part.hinge);c.transform(1,0,part.roll/(part.wheelTop-part.hinge),part.stretch,0,0);c.translate(0,-part.hinge);
    c.beginPath();polygon(c,part.strutPolygon);c.clip();draw();c.restore();
    c.save();c.translate(part.roll,part.offset);
    c.beginPath();polygon(c,part.wheelPolygon);c.clip();draw();/* Painted tires stay rigid; no spinning highlight overlay. */c.restore();
  }
  c.save();c.beginPath();polygon(c,CROP_POLYGON);
  for(const part of [...geo.legs,...geo.arms,...(geo.turretArticulated?[geo.turretPart]:[geo.cannonPart,geo.coaxPart])])polygon(c,part.polygon);
  c.clip('evenodd');draw();c.restore();
  if(geo.turretArticulated){
    c.save();transformPart(c,geo.turretPart);c.beginPath();polygon(c,geo.turretPart.polygon);
    for(const part of [geo.cannonPart,geo.coaxPart])polygon(c,part.polygon);
    c.clip('evenodd');draw();c.restore();
  }
  for(const part of [geo.cannonPart,geo.coaxPart,...geo.arms]){
    c.save();
    if(geo.turretArticulated&&(part===geo.cannonPart||part===geo.coaxPart))transformPart(c,geo.turretPart);
    transformPart(c,part);
    c.beginPath();polygon(c,part.polygon);c.clip();draw();c.restore();
  }
  // Only a faint reflected pin of light changes in the existing black eyes.
  // The eyes, mouth aperture and the entire faceplate remain the same pixels.
  c.globalAlpha*=.19+.05*Math.sin(time*1.65);
  c.fillStyle='#fff9e6';
  for(const eye of geo.eyeReflections){c.beginPath();c.ellipse(eye.x,eye.y,eye.rx,eye.ry,0,0,Math.PI*2);c.fill();}
  c.restore();
  drawInkPlayerPods(c,p,geo,{time});
  return geo;
}
