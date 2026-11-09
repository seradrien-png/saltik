import {tachikomaTurnFrame} from './tachikoma-turn.js';
import {sampleSupportSurface} from './support-pose.js';
import {evasionPose,deflectPose} from './evasion.js';

// SALTIK STRIKER measurements use nominal cell-local pixels. The raw action
// sheet faces LEFT; native direction cells already face their authored octants.
// Front hands are unarmed: arm is the SMALL coax aperture below the LARGE
// main turret cannon. Crops retain each silhouette without adjacent actors.
export const ATLAS_WIDTH=1536,ATLAS_HEIGHT=1024,CELL_WIDTH=384,CELL_HEIGHT=512;
export const PIXEL_SCALE=.30,PLAYER_SCALE=1,STANDING_PIXELS=330,BASE_FACING=-1,ACTION_REGISTRATION=330/335;
export const FEET_LINES=[454,457,457,454,428,429,369,428];
export const TURN_FEET_LINES=[495,491,494,496,467,467,460,467];
export const ACTION_ATLAS=[
  {crop:[15,116,370,340],feet:[201.5,454],top:118,mouths:[[318,253],[341,275],[91,259]],coax:[109,208],main:[71,173],forward:[-1,0]},
  {crop:[415,116,359,343],feet:[208.5,457],top:118,mouths:[[317,253],[340,275],[90,258]],coax:[109,208],main:[66,170],forward:[-1,0]},
  {crop:[800,119,355,340],feet:[208.5,457],top:121,mouths:[[318,256],[340,278],[101,261]],coax:[111,211],main:[66,175],forward:[-1,0]},
  {crop:[1195,117,326,339],feet:[205.5,454],top:119,mouths:[[318,254],[341,276],[93,257]],coax:[113,208],main:[73,172],forward:[-1,0]},
  {crop:[20,603,373,339],feet:[205.5,428],top:93,mouths:[[320,228],[342,251],[91,234]],coax:[109,184],main:[71,147],forward:[-1,0]},
  {crop:[431,656,321,287],feet:[206.5,429],top:146,mouths:[[318,280],[338,301],[86,283]],coax:[112,237],main:[65,204],forward:[-1,0]},
  {crop:[775,550,373,333],feet:[194,369],top:40,mouths:[[313,175],[334,197],[77,181]],coax:[108,131],main:[63,95],forward:[-1,0]},
  {crop:[1171,601,363,341],feet:[200,428],top:91,mouths:[[317,228],[339,250],[93,233]],coax:[111,183],main:[63,145],forward:[-1,0]},
];
export const TURN_ATLAS=[
  {crop:[14,97,372,400],feet:[192,495],top:99,mouths:[[160,266],[183,290],[73,266]],forward:[1,0],podVisible:[true,true,false],coax:[306,218],main:[373,185]},
  {crop:[388,99,380,394],feet:[195,491],top:101,mouths:[[81,261],[98,285],[287,261]],forward:[1,0.2],coax:[299,201],main:[344,162]},
  {crop:[777,98,370,398],feet:[193,494],top:100,mouths:[[53,265],[79,289],[314,265]],forward:[0,1],coax:[117,199],main:[125,155]},
  {crop:[1155,99,373,399],feet:[191,496],top:101,mouths:[[255,266],[278,291],[99,266]],forward:[-1,0.2],coax:[91,209],main:[36,162]},
  {crop:[15,593,369,388],feet:[211,467],top:83,mouths:[[234,244],[255,268],[323,244]],forward:[-1,0],podVisible:[true,true,false],coax:[108,202],main:[41,168]},
  {crop:[399,586,364,395],feet:[195,467],top:76,mouths:[[87,242],[87,263],[346,242]],forward:[-1,-0.2],podVisible:[true,true,false],coax:[86,191],main:[47,159]},
  {crop:[775,590,364,384],feet:[189,460],top:80,mouths:[[46,235],[70,259],[308,235]],forward:[0,-1],occluded:true,coax:[191,125],main:[191,105]},
  {crop:[1151,580,369,401],feet:[184.5,467],top:70,mouths:[[295,242],[294,263],[100,242]],forward:[1,-0.2],podVisible:[true,true,false],coax:[300,190],main:[338,157]},
];

// Final canonical six-cell sheet: thresholded alpha component crops include
// the impact knuckles that cross their nominal 512px cell boundary. All points
// below are cell-local; ground registration is the measured 398px antenna-to-
// wheel span, keeping the established 99-unit Saltik body height.
export const MELEE_PIXEL_SCALE=99/398;
export const MELEE_ATLAS=[
  {crop:[26,82,458,406],feet:[246,484],top:86,main:[86,150],coax:[132,193],mouths:[[399,246],[427,272],[117,249]],forward:[-1,0]},
  {crop:[503,83,512,405],feet:[257,484],top:87,main:[100,151],coax:[144,193],mouths:[[408,246],[438,273],[125,249]],forward:[-1,0],root:[162,378],fist:[18,368],hand:[-5,338,49,59],radius:32},
  {crop:[1057,82,463,406],feet:[257,484],top:86,main:[100,150],coax:[145,192],mouths:[[411,246],[439,272],[127,248]],forward:[-1,0]},
  {crop:[33,539,449,392],feet:[249,415],top:31,main:[88,94],coax:[134,134],mouths:[[401,188],[430,216],[119,191]],forward:[-1,0]},
  {crop:[491,539,526,409],feet:[259,432],top:31,main:[100,95],coax:[145,135],mouths:[[410,188],[440,216],[127,191]],forward:[-1,0],root:[160,309],fist:[10,300],hand:[-17,272,57,55],radius:32},
  {crop:[1058,540,456,406],feet:[259,430],top:32,main:[100,95],coax:[145,135],mouths:[[412,188],[440,216],[127,191]],forward:[-1,0]},
];
const meleePhaseFrame={windup:0,impact:1,recovery:2};

// Thresholded alpha components on the ACTUAL 1254px sheet, padded by two
// pixels. Points are global atlas pixels: several wheels cross the nominal
// 313.5px grid, so neither crops nor registration use an equal-cell formula.
export const EVASION_ATLAS_WIDTH=1254,EVASION_ATLAS_HEIGHT=1254;
export const EVASION_PIXEL_SCALE=99/260;
export const EVASION_ATLAS=[
  {crop:[21,51,317,266],feet:[180,314],top:53,main:[83,94],coax:[109,122],mouths:[[98,158],[113,177],[274,150]],mainBase:[194,100]},
  {crop:[353,35,284,278],feet:[492,310],top:37,main:[397,63],coax:[421,100],mouths:[[409,145],[424,163],[580,128]],mainBase:[503,91]},
  {crop:[656,45,295,255],feet:[800,297],top:47,main:[718,80],coax:[740,111],mouths:[[711,157],[726,173],[903,145]],mainBase:[824,99]},
  {crop:[966,55,280,265],feet:[1106,317],top:57,main:[1018,99],coax:[1040,128],mouths:[[1032,165],[1047,181],[1206,164]],mainBase:[1128,107]},
  {crop:[17,409,296,232],feet:[166,638],top:411,main:[77,450],coax:[102,479],mouths:[[93,516],[108,533],[275,515]],mainBase:[188,457]},
  {crop:[324,336,314,270],feet:[480,603],top:338,main:[418,355],coax:[441,389],mouths:[[411,428],[426,445],[584,457]],mainBase:[519,383]},
  {crop:[656,345,286,267],feet:[797,609],top:347,main:[858,385],coax:[847,421],mouths:[[891,459],[905,476],[714,455]],mainBase:[798,406],occluded:true},
  {crop:[963,370,278,263],feet:[1104,630],top:372,main:[1028,409],coax:[1050,438],mouths:[[1033,482],[1049,498],[1205,481]],mainBase:[1137,419]},
  {crop:[23,689,300,258],feet:[174,944],top:691,main:[79,739],coax:[102,765],mouths:[[98,805],[113,822],[284,799]],mainBase:[190,744]},
  {crop:[347,689,292,257],feet:[493,943],top:691,main:[391,738],coax:[414,765],mouths:[[414,801],[429,818],[597,800]],mainBase:[504,744]},
  {crop:[654,687,300,261],feet:[805,945],top:689,main:[710,733],coax:[732,762],mouths:[[732,800],[747,817],[908,800]],mainBase:[824,741]},
  {crop:[968,689,283,257],feet:[1110,943],top:691,main:[1026,741],coax:[1049,768],mouths:[[1033,802],[1049,819],[1215,801]],mainBase:[1140,747]},
  {crop:[41,1010,270,223],feet:[178,1230],top:1012,main:[83,1059],coax:[106,1085],mouths:[[99,1124],[114,1141],[281,1126]],mainBase:[194,1066]},
  {crop:[371,1059,242,171],feet:[495,1227],top:1061,main:[387,1115],coax:[410,1142],mouths:[[398,1181],[413,1198],[585,1181]],mainBase:[500,1120]},
  {crop:[675,1076,250,160],feet:[800,1233],top:1078,main:[695,1132],coax:[718,1159],mouths:[[708,1198],[723,1215],[893,1197]],mainBase:[808,1137]},
  {crop:[964,965,280,264],feet:[1104,1226],top:967,main:[1017,1008],coax:[1040,1036],mouths:[[1031,1075],[1046,1092],[1206,1075]],mainBase:[1128,1015]},
].map(m=>({...m,origin:[0,0],forward:[-1,0]}));
// Pain recovery's ONE small native hand and white forearm. The rear elbow
// cap stays on the body; the contour stops before the adjacent left eye rim.
EVASION_ATLAS[10].soreArm={pivot:[724,847],polygon:[
  [686,799],[697,802],[706,815],[708,820],[716,820],[723,824],
  [729,832],[730,840],[727,849],[721,856],[711,860],[701,856],
  [695,852],[688,853],[679,858],[671,857],[666,852],[669,844],
  [674,838],[669,839],[664,835],[665,827],[674,821],[683,817],
  [689,819],[686,811],
]};

// NEW rear-plane dodge sheet: actual1536x1024, thresholded alpha component
// bounds padded by two pixels. All points are global atlas pixels. A single
// 344px antenna-to-inner-wheel registration preserves the existing99 units.
// Tilt1/2 balance on the inner wheel plane with both near legs visibly raised;
// spin5 is the native rear view,6 returns through the front,7 lands.
export const DODGE_ATLAS_WIDTH=1536,DODGE_ATLAS_HEIGHT=1024,DODGE_PIXEL_SCALE=99/344;
export const DODGE_ATLAS=[
  {crop:[16,119,367,349],feet:[201,465],top:121,main:[71,185],mainBase:[207,189],coax:[109,221],mouths:[[326,270],[349,293],[96,274]]},
  {crop:[410,119,365,357],feet:[590,473],supportPivot:[735,473],top:121,main:[483,140],mainBase:[619,180],coax:[522,190],mouths:[[712,264],[735,286],[511,246]]},
  {crop:[794,125,360,351],feet:[976,473],supportPivot:[1106,473],top:127,main:[854,147],mainBase:[994,182],coax:[890,192],mouths:[[1104,284],[1127,305],[889,251]]},
  {crop:[1171,119,360,348],feet:[1355,464],top:121,main:[1220,185],mainBase:[1359,190],coax:[1261,220],mouths:[[1474,273],[1496,295],[1246,274]]},
  {crop:[50,589,327,320],feet:[204,906],top:591,main:[76,656],mainBase:[210,660],coax:[113,692],mouths:[[320,738],[344,761],[100,765]]},
  {crop:[420,572,342,340],feet:[590,909],top:574,main:[722,610],mainBase:[640,634],coax:[680,648],mouths:[[700,721],[720,743],[474,705]],occluded:true},
  {crop:[784,580,365,329],feet:[974,906],top:582,main:[855,606],mainBase:[989,628],coax:[891,647],mouths:[[1090,719],[1113,742],[878,706]]},
  {crop:[1170,598,361,349],feet:[1353,944],top:600,main:[1221,665],mainBase:[1356,667],coax:[1260,700],mouths:[[1478,756],[1502,779],[1248,753]]},
].map(m=>({...m,origin:[0,0],forward:[-1,0]}));

// Native barrel pivots sit at the sleeve/turret joint, behind the measured
// aperture. Only these existing painted pixels rotate; the small coax stays.
const actionPivots=[[208,176],[207,176],[208,178],[205,176],[207,151],[208,206],[205,101],[203,153]];
const meleePivots=[[255,154],[269,156],[270,154],[255,99],[270,100],[270,99]];
const turnPivots=[[252,185],[244,171],[185,183],[191,176],[194,166],[166,158],[191,116],[219,157]];
ACTION_ATLAS.forEach((m,i)=>{m.mainBase=actionPivots[i];});
MELEE_ATLAS.forEach((m,i)=>{m.mainBase=meleePivots[i];});
TURN_ATLAS.forEach((m,i)=>{m.mainBase=turnPivots[i];});
export const CANNON_MAX_ELEVATION=Math.atan2(600,325);

function barrelPolygon(measurement,wide=false){
  const [mx,my]=measurement.main,[bx,by]=measurement.mainBase,r=wide?29:25;
  const angle=Math.atan2(my-by,mx-bx),u=[Math.cos(angle),Math.sin(angle)],n=[-u[1],u[0]];
  const point=(x,y)=>[x[0]+n[0]*y,x[1]+n[1]*y];
  const tip=[mx+u[0]*24,my+u[1]*24];
  return [point(tip,-r),point([bx,by],-r),point([bx,by],r),point(tip,r)];
}

// Each polygon isolates one original painted lower leg and wheel. The body
// draw excludes these same polygons. Only the upper strut changes length;
// the complete painted tire below its measured top translates rigidly.
const leg=(id,foot,hinge,polygon)=>({id,foot,hinge,polygon});
const legs=(front,near,far)=>[
  leg('front',front.foot,front.hinge,front.polygon),
  leg('rear-near',near.foot,near.hinge,near.polygon),
  leg('rear-far',far.foot,far.hinge,far.polygon),
];
const lowerLeg=(foot,hinge,left,right)=>({foot,hinge,polygon:[[left,hinge],[right-20,hinge],[right,hinge+58],[right,foot[1]+3],[left,foot[1]+3]]});
export const DISTAL_ATLAS=[
  legs({foot:[42,439],hinge:344,polygon:[[15,346],[64,339],[89,349],[82,383],[72,443],[15,444]]},lowerLeg([274,454],348,225,297),lowerLeg([364,450],347,319,387)),
  legs({foot:[57,450],hinge:348,polygon:[[30,354],[78,342],[102,353],[89,390],[81,454],[31,455]]},lowerLeg([272,457],350,225,299),lowerLeg([367,438],347,319,389)),
  legs({foot:[60,450],hinge:351,polygon:[[30,363],[83,345],[106,354],[91,400],[87,454],[31,454]]},lowerLeg([282,457],352,234,310),lowerLeg([367,442],349,322,389)),
  legs({foot:[70,451],hinge:347,polygon:[[43,358],[87,340],[110,351],[97,389],[96,455],[43,455]]},lowerLeg([272,454],350,226,298),lowerLeg([342,449],347,302,373)),
  legs({foot:[43,426],hinge:325,polygon:[[18,343],[63,320],[89,326],[97,346],[83,383],[79,431],[17,431]]},lowerLeg([278,428],326,226,303),lowerLeg([376,426],325,324,398)),
  legs({foot:[70,422],hinge:353,polygon:[[47,358],[87,342],[107,357],[97,392],[91,428],[46,428]]},lowerLeg([279,428],353,235,313),lowerLeg([345,427],350,304,372)),
  legs({foot:[28,349],hinge:273,polygon:[[7,289],[51,267],[82,279],[79,304],[61,351],[7,354]]},lowerLeg([275,368],281,228,306),lowerLeg([352,367],280,308,381)),
  legs({foot:[48,426],hinge:326,polygon:[[18,344],[66,321],[92,328],[100,349],[86,385],[83,431],[18,431]]},lowerLeg([281,428],327,231,309),lowerLeg([373,427],325,324,399)),
];

export const MELEE_DISTAL_ATLAS=[
  legs({foot:[55,478],hinge:355,polygon:[[26,384],[73,350],[118,353],[142,381],[110,425],[96,482],[26,482]]},lowerLeg([341,484],358,286,384),lowerLeg([454,480],357,394,487)),
  // The impact arm passes above the front wheel: isolate only its lower
  // native shin/wheel below the arm, so suspension never distorts the fist.
  legs({foot:[85,481],hinge:399,polygon:[[58,401],[128,397],[153,405],[138,447],[116,485],[57,485]]},lowerLeg([354,484],359,299,394),lowerLeg([477,483],358,411,507)),
  legs({foot:[94,481],hinge:384,polygon:[[127,384],[151,399],[157,430],[136,469],[117,485],[69,485],[69,421],[105,410]]},lowerLeg([354,484],358,300,395),lowerLeg([474,482],359,411,505)),
  legs({foot:[65,414],hinge:303,polygon:[[33,332],[76,300],[111,303],[138,333],[102,381],[94,420],[33,420]]},lowerLeg([342,415],300,287,384),lowerLeg([454,415],303,393,485)),
  legs({foot:[85,414],hinge:340,polygon:[[57,344],[129,337],[153,350],[136,389],[118,420],[57,420]]},lowerLeg([359,421],304,301,398),lowerLeg([481,432],311,415,509)),
  legs({foot:[94,412],hinge:326,polygon:[[128,326],[150,341],[157,369],[135,405],[115,418],[69,418],[69,361],[106,349]]},lowerLeg([359,416],301,301,398),lowerLeg([474,430],309,412,504)),
];

// Cell-local top cuts lie above the complete rubber tire and wheel hub.
// Keeping all pixels below each cut rigid preserves the authored round wheels.
const ACTION_WHEEL_TOPS=[[385,400,399],[395,401,389],[395,401,391],[394,399,394],[374,374,374],[381,378,378],[305,314,315],[375,376,375]];
const MELEE_WHEEL_TOPS=[[420,420,420],[420,420,420],[420,420,420],[356,355,355],[356,363,373],[357,356,371]];
DISTAL_ATLAS.forEach((parts,i)=>parts.forEach((part,j)=>{part.wheelTop=ACTION_WHEEL_TOPS[i][j];}));
MELEE_DISTAL_ATLAS.forEach((parts,i)=>parts.forEach((part,j)=>{part.wheelTop=MELEE_WHEEL_TOPS[i][j];}));

// Split an existing native polygon into nonoverlapping upper/lower pieces.
function splitAtY(points,y,lower){
  const inside=point=>lower?point[1]>=y:point[1]<=y,result=[];
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],aInside=inside(a),bInside=inside(b);
    if(aInside)result.push(a);
    if(aInside!==bInside){const t=(y-a[1])/(b[1]-a[1]);result.push([a[0]+(b[0]-a[0])*t,y]);}
  }
  return result;
}

export function playerPose(p,time=0){
  return {time,walk:Math.abs(p.vx||0)>0&&!p.crouching,airborne:p.onGround===false||Math.abs(p.vy||0)>1,
    crouch:!!p.crouching,damage:!!p.damagePose,tilt:p.tilt||0,supportPose:p.supportPose,melee:p.melee,
    evasion:evasionPose(p.evasion),deflect:deflectPose(p.deflect),cannonElevation:p.cannonElevation||0,supportClearance:p.supportClearance};
}
export function tachikomaFrame({time=0,walk=false,airborne=false,damage=false,crouch=false}={}){
  return airborne?6:damage?7:crouch?5:walk?Math.floor(time*10)%4:4;
}

function geometry(x,y,options){
  const defense=options.evasion?.kind?options.evasion:options.deflect;
  const defending=!options.forceMeleeImpact&&!!defense?.kind,evading=defending&&defense.kind!=='deflect';
  const melee=options.forceMeleeImpact||(!defending&&!options.turn?.active&&Object.hasOwn(meleePhaseFrame,options.melee?.phase));
  const turning=!defending&&!options.forceMeleeImpact&&!!options.turn?.active;
  const frame=defending?defense.frame:turning?tachikomaTurnFrame(options.turn):melee?(options.airborne?3:0)+(options.forceMeleeImpact?1:meleePhaseFrame[options.melee.phase]):tachikomaFrame(options);
  const atlas=defending?defense.atlas:turning?'tachikoma-turn':melee?'saltik-melee':'tachikoma',measurement=(defending?(evading?DODGE_ATLAS:EVASION_ATLAS):turning?TURN_ATLAS:melee?MELEE_ATLAS:ACTION_ATLAS)[frame];
  const {crop,feet,top}=measurement,scale=options.scale??PLAYER_SCALE;
  // Register the taller direction sheet by its antenna-to-foot span. The
  // action sheet keeps a single registration across native crouch/jump poses.
  const depthScale=defending?defense.depthScale:1,rear=defending?defense.rear:0;
  const k=(defending?(evading?DODGE_PIXEL_SCALE:EVASION_PIXEL_SCALE):melee?MELEE_PIXEL_SCALE:PIXEL_SCALE*(turning?STANDING_PIXELS/(feet[1]-top):ACTION_REGISTRATION))*scale*depthScale;
  const dir=options.dir===-1?-1:1,mirror=turning?1:dir*BASE_FACING;
  const bodyOffsetX=defending&&defense.bodyOffsetX?dir*defense.bodyOffsetX*scale:0;
  let tilt=(options.tilt||0)+(defending?defense.roll*dir:0);
  let heave=(defending?defense.bodyOffsetY:Number.isFinite(options.supportPose?.heave)?options.supportPose.heave:0)*scale;
  const [sx,sy]=measurement.origin??[melee?(frame%3)*512:(frame%4)*CELL_WIDTH,Math.floor(frame/(melee?3:4))*CELL_HEIGHT];
  const dx=(crop[0]-sx-feet[0])*k,dy=(crop[1]-sy-feet[1])*k;
  const bodyPivot=measurement.supportPivot?[(measurement.supportPivot[0]-feet[0])*k,(measurement.supportPivot[1]-feet[1])*k]:[0,0];
  if(evading&&defense.kind==='tilt'&&measurement.supportPivot){
    // The far painted wheel, not the settled stance center, is the support
    // during the held dodge. Sample its actual world X after mirroring and
    // depth contraction so both facings register on sloped ground.
    const contactX=x+(options.camera||0)+bodyOffsetX+mirror*bodyPivot[0];
    const ground=sampleSupportSurface(options.supportPose,contactX);
    if(ground!==null)heave=ground-y-bodyPivot[1];
  }
  if(defending&&Number.isFinite(options.supportClearance)){
    // A jump-spin shortens its visible lift under an actual overhead slab.
    // Keep the native body intact and the physical feet/support unchanged.
    const ceiling=y-options.supportClearance*scale;
    const topAt=angle=>Math.min(...[[dx,dy],[dx+crop[2]*k,dy],[dx,dy+crop[3]*k],[dx+crop[2]*k,dy+crop[3]*k]].map(([xx,yy])=>bodyPivot[1]+mirror*(xx-bodyPivot[0])*Math.sin(angle)+(yy-bodyPivot[1])*Math.cos(angle)));
    if(y+topAt(tilt)<ceiling){
      const sign=Math.sign(tilt);let lo=0,hi=Math.abs(tilt);
      for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(y+topAt(sign*mid)>=ceiling)lo=mid;else hi=mid;}
      tilt=sign*lo;
    }
    heave=Math.max(heave,ceiling-y-topAt(tilt));
  }
  const cos=Math.cos(tilt),sin=Math.sin(tilt);
  const localToWorld=([xx,yy])=>({x:x+bodyOffsetX+mirror*bodyPivot[0]+mirror*(xx-bodyPivot[0])*cos-(yy-bodyPivot[1])*sin,
    y:y+heave+bodyPivot[1]+mirror*(xx-bodyPivot[0])*sin+(yy-bodyPivot[1])*cos});
  const spritePoint=([px,py])=>localToWorld([(px-feet[0])*k,(py-feet[1])*k]);
  // The lateral box cells point forward. Register their back points behind
  // their mouths on that axis, preserving the horizontal settled launch.
  const forward=measurement.forward;
  const cabinTubes=measurement.mouths.map((mouth,i)=>({pod:i<2?0:1,cell:i===1?3:0,visible:measurement.podVisible?.[i]!==false,
    base:spritePoint([mouth[0]-forward[0]*12,mouth[1]-forward[1]*12]),muzzle:spritePoint(mouth)}));
  const corners=[[dx,dy],[dx+crop[2]*k,dy],[dx,dy+crop[3]*k],[dx+crop[2]*k,dy+crop[3]*k]].map(localToWorld);
  const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y),left=Math.min(...xs),upper=Math.min(...ys);
  const bounds={x:left,y:upper,w:Math.max(...xs)-left,h:Math.max(...ys)-upper};
  const distalParts=defending||turning||!options.supportPose?[]:(melee?MELEE_DISTAL_ATLAS:DISTAL_ATLAS)[frame].map(part=>{
    const contact=options.supportPose.contacts?.find(c=>c.id===part.id),native=spritePoint(part.foot);
    let offset=(Number.isFinite(contact?.offset)?contact.offset:0)*scale;
    let support=null;
    if(options.supportPose.grounded){
      // Gait/crouch/melee cells move a wheel horizontally as well as vertically.
      // Plant at that actual native wheel X, not at its settled-cell proxy.
      for(let i=0;i<6;i++){
        const worldX=x+(options.camera||0)+(native.x-x-offset*sin)/scale;
        support=sampleSupportSurface(options.supportPose,worldX);
        if(support===null)break;
        const desired=y+(support-y)*scale;
        offset=Math.max(-9*scale,Math.min(9*scale,(desired-native.y)/cos));
      }
    }
    const desired=support===null?null:y+(support-y)*scale;
    const wheelTop=(part.wheelTop-feet[1])*k,footY=(part.foot[1]-feet[1])*k;
    const originalHinge=(Math.min(part.hinge,...part.polygon.map(point=>point[1]))-feet[1])*k;
    // At full compression a short front strut telescopes under the cabin. Move
    // its concealed pivot upward rather than inverting its painted segment.
    const hinge=Math.min(originalHinge,wheelTop-Math.max(k,-offset/.95));
    const stretch=1+offset/(wheelTop-hinge);
    const polygon=part.polygon.map(([xx,yy])=>[(xx-feet[0])*k,(yy-feet[1])*k]);
    return {...part,offset,hinge,wheelTop,stretch,polygon,
      strutPolygon:splitAtY(polygon,wheelTop,false),wheelPolygon:splitAtY(polygon,wheelTop,true),
      grounded:desired!==null&&Math.abs(native.y+offset*cos-desired)<.05,
      contact:localToWorld([(part.foot[0]-feet[0])*k,footY+offset])};
  });
  const partPoints=distalParts.flatMap(part=>[
    ...part.strutPolygon.map(([xx,yy])=>localToWorld([xx,part.hinge+(yy-part.hinge)*part.stretch])),
    ...part.wheelPolygon.map(([xx,yy])=>localToWorld([xx,yy+part.offset])),
  ]);
  const pivot=[(measurement.mainBase[0]-feet[0])*k,(measurement.mainBase[1]-feet[1])*k];
  const muzzle=[(measurement.main[0]-feet[0])*k,(measurement.main[1]-feet[1])*k];
  const nativeAngle=Math.atan2(muzzle[1]-pivot[1],muzzle[0]-pivot[0]);
  const elevation=defending||turning?0:Math.max(0,Math.min(CANNON_MAX_ELEVATION,options.cannonElevation||0));
  const rotation=elevation?(Math.atan2(-600,-325)-nativeAngle)*elevation/CANNON_MAX_ELEVATION:0;
  const rotateBarrel=point=>{const xx=point[0]-pivot[0],yy=point[1]-pivot[1];return [pivot[0]+xx*Math.cos(rotation)-yy*Math.sin(rotation),pivot[1]+xx*Math.sin(rotation)+yy*Math.cos(rotation)];};
  const cannonBase=localToWorld(pivot),cannon=rotation?localToWorld(rotateBarrel(muzzle)):spritePoint(measurement.main);
  const cannonLength=Math.hypot(cannon.x-cannonBase.x,cannon.y-cannonBase.y);
  const cannonDirection={x:(cannon.x-cannonBase.x)/cannonLength,y:(cannon.y-cannonBase.y)/cannonLength};
  const nativePolygon=barrelPolygon(measurement,melee).map(([xx,yy])=>[(xx-feet[0])*k,(yy-feet[1])*k]);
  const cannonPart={pivot,rotation,polygon:nativePolygon,worldPolygon:nativePolygon.map(point=>localToWorld(rotateBarrel(point)))};
  let handPart=null;
  if(defending&&measurement.soreArm){
    const arm=measurement.soreArm,armPivot=[(arm.pivot[0]-feet[0])*k,(arm.pivot[1]-feet[1])*k],angle=defense.armShake||0;
    const polygon=arm.polygon.map(([xx,yy])=>[(xx-feet[0])*k,(yy-feet[1])*k]);
    const worldPolygon=polygon.map(([xx,yy])=>{const x=xx-armPivot[0],y=yy-armPivot[1];return localToWorld([armPivot[0]+x*Math.cos(angle)-y*Math.sin(angle),armPivot[1]+x*Math.sin(angle)+y*Math.cos(angle)]);});
    handPart={pivot:armPivot,rotation:angle,polygon,worldPolygon,sourcePivot:arm.pivot,sourcePolygon:arm.polygon};
  }
  const all=[...corners,...partPoints,...(rotation?cannonPart.worldPolygon:[]),...(handPart?.worldPolygon??[])],xx=all.map(p=>p.x),yy=all.map(p=>p.y);
  bounds.x=Math.min(...xx);bounds.y=Math.min(...yy);bounds.w=Math.max(...xx)-bounds.x;bounds.h=Math.max(...yy)-bounds.y;
  return {atlas,frame,crop,feet,x,y,k,scale,dx,dy,dir,mirror,tilt,measurement,rear,depthScale,bodyOffsetX,bodyPivot,crouch:!!options.crouch,crouchDrop:0,
    localToWorld,spritePoint,heave,distalParts,arm:spritePoint(measurement.coax),cannon,cannonBase,cannonDirection,cannonAngle:Math.atan2(cannonDirection.y,cannonDirection.x),cannonPart,handPart,weaponsVisible:!measurement.occluded,weaponsLocked:defending,
    cabinTubes,tubes:cabinTubes.map(t=>t.muzzle),visibleHeight:(feet[1]-top)*k,bounds,top:bounds.y,height:bounds.h};
}

export function tachikomaGeometry(p,time=0,{camera=0,scale=1}={}){
  const result=geometry(p.x-camera,p.y,{...playerPose(p,time),dir:p.dir,turn:p.turn,camera,scale:PLAYER_SCALE*scale});
  result.depth=0;result.groundY=p.supportY??p.y;return result;
}
// Compatibility with the original anchor-based drawing API (27 above feet).
export function tachikomaMounts(x,y,options={}){
  const scale=options.scale??1;
  return geometry(x,y+27*scale,{...options,scale});
}

// Acquisition always uses the fully extended native hand, including while the
// visible body is idle/winding up. Damage and art share this exact transform.
export function tachikomaMeleeReach(p,time=0,{camera=0,scale=1}={}){
  const geo=geometry(p.x-camera,p.y,
    {...playerPose(p,time),dir:p.dir,scale:PLAYER_SCALE*scale,forceMeleeImpact:true});
  const m=geo.measurement,[x,y,w,h]=m.hand;
  const points=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(geo.spritePoint);
  const xs=points.map(point=>point.x),ys=points.map(point=>point.y);
  return {origin:geo.spritePoint(m.root),fist:geo.spritePoint(m.fist),radius:m.radius*geo.k,
    hitbox:{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)}};
}
