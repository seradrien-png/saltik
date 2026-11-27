// Native world coordinates shared by painted landmarks and walkable supports.
// A plateau at each buried structure registers its entrances with the sand.
export const RED_WASTES_RELIEF=.6;
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
 let y=duneAt(x),roughness=1;
 for(const site of RED_WASTES_SITES){
  const outside=Math.max(site.x-x,x-site.x-site.w,0);
  const weight=1-smooth(clamp(outside/650,0,1));
  y+=(duneAt(site.x+site.w/2)-y)*weight;
  roughness*=smooth(clamp(outside/200,0,1));
 }
 // Wheel-scale sand ridges are physical supports, not a timed body wobble.
 // Fade only at concrete/bone junctions so their painted entries stay joined.
 const ripples=RED_WASTES_RELIEF*(10*Math.sin(x/77)+6*Math.sin(x/43+.7)+2*Math.sin(x/23+1.4));
 return y+roughness*ripples;
}
export function structurePlacement(site){
 const foot=redWastesGroundAt(site.x+site.w/2);
 return {x:site.x,y:foot-site.h*(site.kind==='skull'?.8:1),w:site.w,h:site.h,foot,midY:foot-150,roofY:foot-300,tunnelY:foot-400};
}
const cap=(site,name,x1,x2,y,tier)=>({id:`${site.id}-${name}`,siteId:site.id,kind:site.kind,tier,x1:site.x+x1,x2:site.x+x2,points:[[site.x+x1,y],[site.x+x2,y]],bodyDepth:3,seed:91,walkableEntries:[]});
const ramp=(site,name,upper,lower,from,to)=>({id:`${site.id}-${name}`,platformId:upper.id,lowerId:lower?.id??null,nativeArt:true,stepRun:12,points:[[site.x+from,lower?lower.points[0][1]:redWastesGroundAt(site.x+from)],[site.x+to,upper.points[0][1]]]});
export function createRedWastesRoutes(){
 const platforms=[];
 for(const site of RED_WASTES_SITES){
  const box=structurePlacement(site);
  if(site.kind==='skull'){
   // The image includes a soft shadow below the teeth; bury that margin.
   // These points trace the nose bridge, actual orbital sill, and cheekbone.
   const painted=(x,v)=>[site.x+x,box.y+v*box.h];
   const tunnel=cap(site,'tunnel',780,1050,box.y+.625*box.h,1);
   tunnel.points=[painted(780,.60),painted(900,.625),painted(1000,.625),painted(1050,.61)];
   tunnel.walkableEntries=[
    {...ramp(site,'eye-entry',tunnel,null,0,780),stepRun:1,points:[
     [site.x,box.foot],painted(100,.75),painted(180,.68),painted(300,.61),painted(440,.56),painted(590,.43),painted(660,.53),painted(720,.59),painted(780,.60)]},
    {...ramp(site,'eye-exit',tunnel,null,1600,1050),stepRun:1,points:[
     [site.x+1600,box.foot],painted(1500,.82),painted(1400,.77),painted(1300,.71),painted(1200,.67),painted(1150,.64),painted(1100,.60),painted(1050,.61)]}
   ];
   const crown=cap(site,'crown',740,1120,box.y+.12*box.h,2);
   crown.kind='skull-crown';crown.points=[painted(740,.16),painted(900,.105),painted(1050,.12),painted(1120,.15)];
   crown.bottomPoints=[painted(740,.42),painted(900,.37),painted(1050,.39),painted(1120,.45)];
   platforms.push(tunnel,crown);
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

// Bone is static scenery, never a damageable combat target. The orbital sill
// and access bones have the exact same top as native walking supports.
export function createRedWastesSolids(platforms){
 return platforms.filter(p=>p.kind==='skull'||p.kind==='skull-crown').flatMap(platform=>[
  {id:platform.id,platformId:platform.id,tier:platform.tier,points:platform.points,smooth:true,depth:65,bottomPoints:platform.bottomPoints},
  ...platform.walkableEntries.map(entry=>({id:entry.id,rampId:entry.id,tier:platform.tier,points:entry.points,depth:55}))
 ]);
}
function solidHeight(solid,x){
 const points=solid.points[0][0]<solid.points.at(-1)[0]?solid.points:[...solid.points].reverse();
 const i=points.findIndex((p,i)=>i<points.length-1&&x<=points[i+1][0]);
 const a=points[Math.max(0,i)],b=points[Math.max(0,i)+1],t=clamp((x-a[0])/(b[0]-a[0]),0,1);
 return a[1]+(b[1]-a[1])*(solid.smooth?smooth(t):t);
}
export function resolveRedWastesSolids(g,p,oldX,oldY,{finalPose=false}={}){
 let bodyHeight,boxes;
 for(const solid of g.worldSolids??[]){
  const lo=Math.min(solid.points[0][0],solid.points.at(-1)[0]),hi=Math.max(solid.points[0][0],solid.points.at(-1)[0]);
  if(p.x<lo-300||p.x>hi+300)continue;
  boxes??=g.playerHitboxes?.(p,g.time)??[{x:p.x-25,y:p.y-p.h,w:50,h:p.h}];
  if(p.x<lo||p.x>hi){
   // A cannon or cabin can reach the orbital arch before its anchor does.
   // Include the actual native part extents when testing its underside.
   const reaching=boxes.filter(box=>box.x<hi&&box.x+box.w>lo);
   if(!reaching.length)continue;
   if(solid.bottomPoints){
    let correction=0;
    for(const box of reaching)for(const x of [clamp(box.x,lo,hi),clamp(box.x+box.w/2,lo,hi),clamp(box.x+box.w,lo,hi)]){
     const top=solidHeight(solid,x),bottom=solidHeight({...solid,points:solid.bottomPoints},x);
     if(box.y<bottom&&box.y+box.h>top&&p.y>=bottom)correction=Math.max(correction,bottom-box.y+8);
    }
    if(correction){p.y+=correction;p.vy=Math.max(0,p.vy);}
   }
   continue;
  }
  bodyHeight??=Math.max(p.h,...boxes.map(box=>p.y-box.y+8));
  const top=solidHeight(solid,p.x),bottom=solid.bottomPoints?solidHeight({...solid,points:solid.bottomPoints},p.x):top+solid.depth;
  if(p.onGround&&(p.platformId===solid.platformId&&solid.platformId||p.rampId===solid.rampId&&solid.rampId))continue;
  if(p.y<=top||p.y-bodyHeight>=bottom)continue;
  if(oldY<=solidHeight(solid,clamp(oldX,lo,hi))+.01&&p.vy>=0){
   p.y=top;p.vy=0;p.onGround=true;p.platformId=solid.platformId??null;p.rampId=solid.rampId??null;p.tier=solid.tier;p.dropThrough=null;
  }else if(oldY-bodyHeight>=bottom-.01&&p.vy<0||finalPose&&p.y>=bottom){p.y=bottom+bodyHeight;p.vy=Math.max(0,p.vy);}
  else if(oldX<lo||oldX>hi){p.x=oldX;p.vx=0;}
 }
}
