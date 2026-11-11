export const DESERT_TRAVEL_END=6200,DESERT_INTERIOR_END=7800;
export const DESERT_ROOMS=Object.freeze([
 {name:'SAS D’EXCAVATION',center:1400,gate:2350,types:['soldier','drone','walker','soldier','turret']},
 {name:'LA CHAMBRE DES FOSSILES',center:3800,gate:4750,types:['drone','soldier','saltik','turret','walker','drone']},
 {name:'LE CŒUR DE C-07',center:6400,gate:7300,types:['saltik','drone','walker','turret','soldier','drone','turret']}
]);
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export const desertTravelAt=x=>clamp((x-180)/(DESERT_TRAVEL_END-180));
export const desertDepthAt=x=>1-.72*desertTravelAt(x);
// Measured on the authored illustrated tyre track, ending at the C-07 gate.
const PATH=[[.245,.885],[.29,.842],[.38,.795],[.47,.767],[.525,.72],[.54,.682],[.60,.648],[.675,.628],[.733,.588]];
export function desertPathAt(t){t=clamp(t);const at=t*(PATH.length-1),i=Math.min(PATH.length-2,Math.floor(at)),u=at-i;
 const p0=PATH[Math.max(0,i-1)],p1=PATH[i],p2=PATH[i+1],p3=PATH[Math.min(PATH.length-1,i+2)];
 const curve=k=>.5*((2*p1[k])+(-p0[k]+p2[k])*u+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*u*u+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*u*u*u);
 return{x:curve(0),y:curve(1)};
}
export function desertVistaBox(width,height){const w=Math.min(width,height*3),h=w/3;return{x:(width-w)/2,y:(height-h)/2,w,h};}
export function projectDesertPlayer(x,width,height){const p=desertPathAt(desertTravelAt(x)),b=desertVistaBox(width,height);return{x:b.x+p.x*b.w,y:b.y+p.y*b.h,scale:desertDepthAt(x)*b.w/1108};}
const FLOOR=[[0,620],[900,620],[1500,620],[2350,620],[3200,650],[4500,650],[4600,650],[5000,620],[6000,620],[6800,635],[7800,620]];
export function desertInteriorGroundAt(x){const i=Math.max(0,FLOOR.findIndex((p,i)=>i<FLOOR.length-1&&x<=FLOOR[i+1][0])),a=FLOOR[i]??FLOOR.at(-2),b=FLOOR[i+1]??FLOOR.at(-1),t=clamp((x-a[0])/(b[0]-a[0])),s=t*t*(3-2*t);return a[1]+(b[1]-a[1])*s;}
export const DESERT_STRUCTURES=[
 {id:'desert-dais',kind:'dais',walkable:true,left:1100,right:2100,crop:[0,0,768,512],foot:454,cap:[[374,213],[735,213]],ramps:[[[60,454],[374,213]]]},
 {id:'desert-service-bridge',kind:'bridge',walkable:false,left:3500,right:4600,crop:[768,0,768,512],foot:448,cap:[[190,205],[640,205]],ramps:[]}
];
export function desertStructurePlacement(s){const k=(s.right-s.left)/s.crop[2],y=desertInteriorGroundAt(s.left)-s.foot*k;return{x:s.left,y,k,point:([x,yy])=>[s.left+x*k,y+yy*k]};}
export function createDesertRoutes(){return DESERT_STRUCTURES.filter(s=>s.walkable).map((s,i)=>{const {point}=desertStructurePlacement(s),points=s.cap.map(point);return{id:s.id,tier:1,x1:points[0][0],x2:points.at(-1)[0],points,bodyDepth:70,seed:800+i,desertKind:s.kind,walkableEntries:s.ramps.map((r,j)=>({id:s.id+'-ramp-'+j,lowerId:null,nativeArt:true,points:r.map(point),stepRun:0}))};});}
