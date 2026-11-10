// Native velvet atlas cells, with authored deck, stair and foundation samples.
export const ROYAL_END=17800;
export const ROYAL_CELLS={
 bridge:{source:'bridge',crop:[0,0,1774,887],cap:[[90,585],[330,585],[510,535],[710,505],[910,442],[1100,365],[1280,275],[1450,190],[1580,140],[1710,140]],foot:887,
  ground:[[0,585],[330,585],[690,887],[1220,750],[1520,140],[1774,140]]},
 tree:{crop:[768,0,768,512],cap:[[250,274],[340,274],[450,276],[600,277],[730,276]],foot:480,stairs:[[[45,480],[80,447],[110,419],[141,389],[172,360],[203,331],[235,302],[265,274]]]},
 arch:{crop:[0,512,768,512],cap:[[280,270],[375,269],[530,268],[715,270]],foot:486,stairs:[[[55,486],[90,450],[125,418],[160,386],[194,355],[230,324],[265,295],[296,270]]]},
 terrace:{crop:[768,512,768,512],cap:[[500,208],[600,210],[740,210]],foot:486,stairs:[[[70,486],[140,442],[215,398],[290,352],[360,306],[430,257],[500,208]]]},
};
const anchors=[[0,570],[2400,600],[4000,240],[4700,560],[6500,610],[8900,540],[11000,600],[11920,600],[13380,240],[14100,560],[15400,595],[17800,540]];
const smooth=t=>t*t*(3-2*t);
export function royalBaseGroundAt(x){const at=Math.max(0,Math.min(ROYAL_END,x));let i=anchors.findIndex((a,i)=>i<anchors.length-1&&at<=anchors[i+1][0]);if(i<0)i=anchors.length-2;const a=anchors[i],b=anchors[i+1],u=(at-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*smooth(u)+Math.sin(u*Math.PI)*18;}
export function royalSample(points,x){let i=points.findIndex((p,i)=>i<points.length-1&&x<=points[i+1][0]);if(i<0)i=points.length-2;const a=points[i],b=points[i+1],t=Math.max(0,Math.min(1,(x-a[0])/(b[0]-a[0])));return a[1]+(b[1]-a[1])*t;}
function site(id,kind,left,width){const cell=ROYAL_CELLS[kind],scale=width/cell.crop[2],top=kind==='bridge'?royalBaseGroundAt(left)-585*scale:royalBaseGroundAt(left+width/2)-cell.foot*scale,point=([x,y])=>[left+x*scale,top+y*scale];const points=cell.cap.map(point);const groundPoints=(cell.ground??[[0,cell.foot],[cell.crop[2],cell.foot]]).map(point);const stairs=(cell.stairs??[]).map(p=>{const flight=p.map(point);flight.at(-1)[1]=top+royalSample(cell.cap,p.at(-1)[0])*scale;return flight;});if(kind==='bridge'){stairs.push([[points[0][0]-45,points[0][1]],points[0]],[ [points.at(-1)[0]+45,points.at(-1)[1]],points.at(-1)]);}
return{id,kind,left,top,scale,points,stairs,groundPoints,groundLeft:left,groundRight:left+width,x1:points[0][0],x2:points.at(-1)[0]};}
export const ROYAL_SITES=[site('royal-tree-entrance','tree',1200,1040),site('royal-bridge-cascade','bridge',2550,1480),site('royal-arch-west','arch',4800,1180),site('royal-terrace-rainbow','tree',7000,1260),site('royal-tree-canopy','tree',9900,1080),site('royal-bridge-east','bridge',11920,1460),site('royal-terrace-high','arch',14200,1180),site('royal-sanctuary','arch',16300,1420)];
export function royalGroundAt(x){const inside=ROYAL_SITES.find(s=>x>=s.groundLeft&&x<=s.groundRight);if(inside)return royalSample(inside.groundPoints,x);const nearest=ROYAL_SITES.map(s=>({s,d:Math.min(Math.abs(x-s.groundLeft),Math.abs(x-s.groundRight))})).sort((a,b)=>a.d-b.d)[0];const base=royalBaseGroundAt(x);if(!nearest||nearest.d>170)return base;const edge=x<nearest.s.groundLeft?nearest.s.groundLeft:nearest.s.groundRight;return base+(royalSample(nearest.s.groundPoints,edge)-base)*smooth(1-nearest.d/170);}
export function createRoyalRoutes(){return ROYAL_SITES.map((s,i)=>({id:s.id,x1:s.x1,x2:s.x2,tier:1,points:s.points.map(p=>[...p]),bodyDepth:80,seed:500+i,royalKind:s.kind,walkableEntries:s.stairs.map((points,j)=>({id:`${s.id}-entry-${j}`,lowerId:null,nativeArt:true,points:points.map(p=>[...p]),stepRun:22}))}));}

// Two three-quarter crossings recede in depth, then ease back into the next
// garden. Weapon geometry reads this same player art scale each frame.
export function royalDepthScaleAt(x){
 let scale=.8;
 for(const s of ROYAL_SITES.filter(s=>s.kind==='bridge')){
  const start=s.x1,end=s.x2,exit=end+700;
  if(x>=start&&x<=end)scale=Math.min(scale,.8-.14*smooth((x-start)/(end-start)));
  else if(x>end&&x<exit)scale=Math.min(scale,.66+.14*smooth((x-end)/(exit-end)));
 }
 return scale;
}
