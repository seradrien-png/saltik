// Native world coordinates shared by painted landmarks and walkable supports.
// A plateau at each buried structure registers its entrances with the sand.
export const RED_WASTES_SITES=Object.freeze([
 Object.freeze({id:'west-bunker',kind:'bunker',x:4200,w:1800,h:420}),
 Object.freeze({id:'eye-passage',kind:'skull',x:8400,w:1600,h:1067}),
 Object.freeze({id:'east-bunker',kind:'bunker',x:12800,w:1800,h:420}),
]);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=t=>t*t*(3-2*t);
export const RED_WASTES_DUNE_POINTS=Object.freeze([[0,620],[2200,480],[4200,645],[6500,505],[8200,635],[10900,485],[13200,630],[16000,490],[18400,640],[20000,620],[23000,620]].map(Object.freeze));
function duneAt(x){
 const points=RED_WASTES_DUNE_POINTS;
 const index=points.findIndex((p,i)=>i<points.length-1&&x<=points[i+1][0]);
 const i=index<0?points.length-2:index,a=points[i],b=points[i+1];
 return a[1]+(b[1]-a[1])*smooth(clamp((x-a[0])/(b[0]-a[0]),0,1));
}
export function redWastesGroundAt(x){
 let y=duneAt(x);
 for(const site of RED_WASTES_SITES){
  const outside=Math.max(site.x-x,x-site.x-site.w,0);
  const weight=1-smooth(clamp(outside/650,0,1));
  y+=(duneAt(site.x+site.w/2)-y)*weight;
 }
 return y;
}
export function structurePlacement(site){
 const foot=redWastesGroundAt(site.x+site.w/2);
 return {x:site.x,y:foot-site.h,w:site.w,h:site.h,foot,midY:foot-150,roofY:foot-300,tunnelY:foot-400};
}
const cap=(site,name,x1,x2,y,tier)=>({id:`${site.id}-${name}`,siteId:site.id,kind:site.kind,tier,x1:site.x+x1,x2:site.x+x2,points:[[site.x+x1,y],[site.x+x2,y]],bodyDepth:3,seed:91,walkableEntries:[]});
const ramp=(site,name,upper,lower,from,to)=>({id:`${site.id}-${name}`,platformId:upper.id,lowerId:lower?.id??null,nativeArt:true,stepRun:12,points:[[site.x+from,lower?lower.points[0][1]:redWastesGroundAt(site.x+from)],[site.x+to,upper.points[0][1]]]});
export function createRedWastesRoutes(){
 const platforms=[];
 for(const site of RED_WASTES_SITES){
  const box=structurePlacement(site);
  if(site.kind==='skull'){
   const tunnel=cap(site,'tunnel',650,1200,box.tunnelY,1);
   tunnel.walkableEntries=[ramp(site,'eye-entry',tunnel,null,0,680),ramp(site,'eye-exit',tunnel,null,1600,1150)];
   platforms.push(tunnel);
  }else{
   const mid=cap(site,'gallery',350,1450,box.midY,1),roof=cap(site,'roof',900,1250,box.roofY,2);
   // A short landing between flights lets native support finish one entry
   // before crossing the next junction in either direction.
   mid.walkableEntries=[ramp(site,'sand-entry',mid,null,0,390),ramp(site,'sand-exit',mid,null,1800,1400)];
   roof.lower=mid;roof.lowerId=mid.id;
   const entry=ramp(site,'roof-entry',roof,mid,400,900);
   // Sampled from the painted upper dune silhouette at its native crop scale.
   entry.points.splice(1,0,[site.x+500,box.foot-182],[site.x+600,box.foot-209],[site.x+700,box.foot-245],[site.x+800,box.foot-293]);
   const exit=ramp(site,'roof-exit',roof,mid,1380,1250);
   exit.stepRun=1;
   exit.points.splice(1,0,[site.x+1350,box.foot-190],[site.x+1300,box.foot-209]);
   roof.walkableEntries=[entry,exit];
   platforms.push(mid,roof);
  }
 }
 return platforms;
}
