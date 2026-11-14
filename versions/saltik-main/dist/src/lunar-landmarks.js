import {hdModuleImage,drawHDModule} from './hd-module-art.js';
import {lunarBaseGroundAt} from './lunar-terrain.js';
// Native painted contours, measured in the unmodified 1536 x 1024 atlas.
// All art stays in world coordinates, exactly like the level-one cutouts.
export const LUNAR_ART='lunar-monuments';
export const LUNAR_CELLS={
 aqueduct:{source:'bridge',crop:[0,0,1774,887],cap:[[450,391],[470,392],[650,399],[850,404],[1080,406],[1300,407],[1500,410],[1640,415]],foot:805,ground:[[70,805],[300,767],[600,760],[1000,758],[1450,770],[1720,800]],stair:[[70,805],[130,747],[202,671],[278,595],[351,518],[413,449],[470,392]]},
 observatory:{registration:{first:[75,326],last:[720,348]},crop:[768,0,768,500],cap:[[75,315],[132,325],[210,345],[275,350],[450,351],[620,349],[720,348]],foot:470,stair:[[280,470],[260,450],[232,425],[206,400],[180,375],[156,350],[132,325]]},
 bastion:{registration:{first:[24,302],last:[710,304]},crop:[0,512,768,512],cap:[[24,302],[125,302],[162,307],[330,309],[465,309],[560,307],[625,302]],foot:464,stair:[[288,464],[275,450],[250,425],[225,400],[202,375],[176,350],[150,325],[125,302]],rightStair:[[490,464],[501,450],[520,425],[539,400],[555,375],[572,350],[587,325],[603,302]]},
 gate:{crop:[768,512,768,512],cap:[[64,300],[180,300],[355,300],[500,300],[650,298],[720,293]],foot:460,stair:[[304,460],[290,450],[265,425],[240,400],[215,375],[190,350],[165,325],[140,300]]},
};
function interpolate(points,x){
 const index=points.findIndex((p,i)=>i<points.length-1&&x<=points[i+1][0]),i=index<0?points.length-2:Math.max(0,index);
 const a=points[i],b=points[i+1],t=Math.max(0,Math.min(1,(x-a[0])/(b[0]-a[0])));return a[1]+(b[1]-a[1])*t;
}
function fromBounds(id,kind,left,top,scale,encounters=false){
 const cell=LUNAR_CELLS[kind],point=([x,y])=>[left+x*scale,top+y*scale],points=cell.cap.map(point);
 const stairs=[cell.stair,cell.rightStair].filter(Boolean).map(flight=>{
  const p=flight.map(point),last=p.at(-1);last[1]=top+interpolate(cell.cap,flight.at(-1)[0])*scale;return p;
 });
 const groundPoints=(cell.ground??[[0,cell.foot],[cell.crop[2],cell.foot]]).map(point);
 return {id,kind,left,top,scale,encounters,x1:points[0][0],x2:points.at(-1)[0],y:points[0][1],points,stairs,nativeStair:stairs[0],groundPoints,
  groundLeft:left,groundRight:left+cell.crop[2]*scale};
}
const main=[['aqueduct',950,2050,410],['observatory',3540,4240,400],['aqueduct',5410,6580,360],['bastion',7460,8260,410],['observatory',11750,13000,355],['bastion',14500,15700,410]].map(([kind,x1,x2,y],i)=>{
 const cell=LUNAR_CELLS[kind],first=cell.registration?.first??cell.cap[0],last=cell.registration?.last??cell.cap.at(-1),scale=(x2-x1)/(last[0]-first[0]);
 return fromBounds(`lunar-terrace-${i}`,kind,x1-first[0]*scale,y-first[1]*scale,scale,true);
});
// Only three former decorative annexes fit between the real landmarks.
// All visible foreground stairs now belong to these actual playable routes.
const annexes=[['west','bastion',2860,1040],['middle','bastion',10240,1040],['east','observatory',13600,880]].map(([name,kind,x,w])=>{
 const cell=LUNAR_CELLS[kind],scale=w/cell.crop[2];
 return fromBounds(`lunar-annex-${name}`,kind,x-w/2,lunarBaseGroundAt(x)-cell.foot*scale,scale);
});
export const LUNAR_PORTAL=fromBounds('lunar-portal','gate',16250,550-300*1600/768,1600/768);
export const LUNAR_SITES=[...main,...annexes,LUNAR_PORTAL].sort((a,b)=>a.groundLeft-b.groundLeft);
export function lunarFoundationAt(site,x){return interpolate(site.groundPoints,x);}
export function lunarPaintedBounds(site){const cell=LUNAR_CELLS[site.kind];return{x:site.left,y:site.top,w:cell.crop[2]*site.scale,h:cell.crop[3]*site.scale};}
export function paintLunarCutout(c,art,kind,{x,y,w,h,alpha=1,flip=false}){
 if(!art)return;const cell=LUNAR_CELLS[kind],pack='atlas' in art||'bridge' in art;
 const image=pack?(cell.source==='bridge'?art.bridge:art.atlas):art;if(!image)return;
 c.save();c.globalAlpha*=alpha;c.translate(x+(flip?w:0),y);if(flip)c.scale(-1,1);
 const hd=hdModuleImage(art,`lunar-${kind}`);
 if(hd)drawHDModule(c,hd,0,0,w,h);else c.drawImage(image,...cell.crop,0,0,w,h);c.restore();
}
export function paintLunarStair(c,art,entry,camera){
 if(!art)return;
 const a=entry.points[0],b=entry.points.at(-1),w=b[0]-a[0],h=a[1]-b[1];
 // The atlas observatory has a complete painted staircase. Its measured
 // bottom-to-top samples are mirrored to make a forward ascent here.
 c.save();c.translate(b[0]-camera+14,b[1]-7);c.scale(-1,1);
 c.drawImage(art,846,322,218,159,-14,0,w+28,h+14);c.restore();
}
