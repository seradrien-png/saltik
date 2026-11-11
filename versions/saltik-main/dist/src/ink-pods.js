import {inkTurnFrame,inkTurnGeometry} from './ink-turn.js';
// The rings belong to the native artwork. Only the round inside each bore
// changes: three player rounds and two enemy rounds retain original balance.
export const INK_PLAYER_POD_SLOTS=Object.freeze([
 {center:[357,453.5],rx:20,ry:23,activeIndex:-1},
 {center:[429,458],rx:19,ry:22,activeIndex:-1},
 {center:[355.5,527],rx:20,ry:22,activeIndex:0},
 {center:[427.5,531],rx:19,ry:21,activeIndex:-1},
 {center:[1078,489],rx:16,ry:19,activeIndex:1},
 {center:[1138,491],rx:15,ry:18,activeIndex:-1},
 {center:[1078.5,552.5],rx:16,ry:18,activeIndex:-1},
 {center:[1137.5,553.5],rx:15,ry:18,activeIndex:2},
]);
export const INK_ENEMY_POD_SLOTS=Object.freeze([
 {center:[334,52.5],rx:25,ry:23,activeIndex:0},
 {center:[392,66.5],rx:25,ry:23,activeIndex:-1},
 {center:[331,109.5],rx:25,ry:23,activeIndex:-1},
 {center:[387,124],rx:25,ry:23,activeIndex:-1},
 {center:[893.5,104],rx:25,ry:23,activeIndex:1},
 {center:[953.5,114.5],rx:25,ry:23,activeIndex:-1},
 {center:[892,160.5],rx:25,ry:23,activeIndex:-1},
 {center:[950.5,170.5],rx:25,ry:23,activeIndex:-1},
]);
const ENEMY_FRONT_PODS=[
 {center:[1225.5,78.5],rx:28,ry:24,activeIndex:0},
 {center:[1300,79],rx:28,ry:24,activeIndex:-1},
 {center:[1224.5,141.5],rx:28,ry:24,activeIndex:-1},
 {center:[1299,142],rx:28,ry:24,activeIndex:-1},
 {center:[1713,78],rx:28,ry:24,activeIndex:1},
 {center:[1787,77.5],rx:28,ry:24,activeIndex:-1},
 {center:[1714,141.5],rx:28,ry:24,activeIndex:-1},
 {center:[1788,140],rx:28,ry:24,activeIndex:-1},
];
const TURN_CENTERS=[
 [[169,279.5],[219.5,282],[168,328.5],[218.5,330],[628,299],[670,300],[628,342.5],[670,342]],
 [[821,290.5],[872.5,290.5],[821,337.5],[872.5,337.5],[1299,291],[1349.5,291],[1299,337.5],[1349.5,338]],
 [[1545.5,299],[1503,300],[1546,342],[1503,342],[2003.5,279],[1952.5,282],[2003.5,328.5],[1952.5,330]],
];
const clamp=n=>Math.max(0,Math.min(1,n));
export function podSlotPresentation(actor,index){
 if(actor?.bt)return {round:actor.bt.loaded[index]?1:0,flash:actor.bt.lastTube===index?Math.min(1,(actor.bt.launchFlash??0)/.18):0,feeding:false};
 if(index<0)return {round:0,flash:0,feeding:false};
 const cycle=actor?.podCycle;
 if(!cycle||!cycle.fired?.[index])return {round:1,flash:0,feeding:false};
 const duration=cycle.duration||9.5,elapsed=Math.max(0,cycle.elapsed||0),feedAt=duration-.62+index*.12;
 const round=clamp((elapsed-feedAt)/.32),firedAt=cycle.firedAt?.[index]??index*.085;
 return {round,flash:clamp(1-(elapsed-firedAt)/.11),feeding:round>0&&round<1};
}
function geometry(actor,geo,slots){
 return slots.map(slot=>{
  const point=p=>geo.podSourcePoint?geo.podSourcePoint(p,slot.podIndex??(slot.center[0]<600?0:1)):geo.sourcePoint(p);
  const muzzle=point(slot.center),base=point([slot.center[0]-28*(slot.direction??1),slot.center[1]+50]);
  const dx=muzzle.x-base.x,dy=muzzle.y-base.y,length=Math.hypot(dx,dy)||1;
  return {...slot,k:geo.k,angle:geo.tilt??geo.rotation??0,muzzle,base,axis:{x:dx/length,y:dy/length},...podSlotPresentation(actor,slot.ammoIndex??slot.activeIndex),flash:slot.activeIndex<0?0:podSlotPresentation(actor,slot.activeIndex).flash};
 });
}
export function inkPlayerPodGeometry(p,geo){
 const frame=inkTurnFrame(p);
 if(frame>0&&frame<4){
  const turn=inkTurnGeometry(p,{camera:p.x-geo.x,scale:geo.scale??1});
  const active=frame===3?[1,-1,-1,2,-1,-1,0,-1]:[-1,-1,0,-1,1,-1,-1,2];
  const slots=TURN_CENTERS[frame-1].map((center,i)=>({center,rx:frame===2?14:13,ry:14,activeIndex:active[i],direction:frame===3?-1:frame===2?0:1}));
  return geometry(p,{sourcePoint:turn.point,k:turn.k,tilt:turn.tilt},slots.map((s,i)=>({...s,ammoIndex:s.activeIndex>=0?s.activeIndex:frame===3?([1,1,2,2,0,0,0,0][i]):([0,0,0,0,1,1,2,2][i])})));
 }
 return geometry(p,geo,INK_PLAYER_POD_SLOTS.map((s,i)=>({...s,ammoIndex:i<4?0:i<6?1:2})));
}
export function inkEnemyPodGeometry(e,geo){return geometry(e,geo,(geo.view==='front'?ENEMY_FRONT_PODS:INK_ENEMY_POD_SLOTS).map((s,i)=>({...s,activeIndex:e.bt?i:s.activeIndex,ammoIndex:e.bt?i:i<4?0:1,podIndex:i<4?0:1})));}
function drawSlots(c,geo,slots,enemy){
 if(typeof c.ellipse!=='function'||typeof c.stroke!=='function')return;
 for(const slot of slots){
  const {muzzle,rx,ry,round,flash}=slot,k=slot.k??geo.k,angle=slot.angle??geo.tilt??geo.rotation??0;
  c.save();c.translate(muzzle.x,muzzle.y);c.rotate(angle);
  // Deep dark sockets cover the native drawn warhead, leaving its rim intact.
  c.fillStyle='#141814';c.beginPath();c.ellipse(0,0,rx*k,ry*k,0,0,Math.PI*2);c.fill();
  c.strokeStyle='#464b40';c.lineWidth=.55;c.beginPath();c.ellipse(0,0,rx*k*.88,ry*k*.88,0,0,Math.PI*2);c.stroke();
  if(round>0){
   c.save();c.beginPath();c.ellipse(0,0,rx*k*.9,ry*k*.9,0,0,Math.PI*2);c.clip();
   const drop=(1-round)*ry*k*1.8;c.translate(0,drop);
   c.fillStyle=enemy?'#f5a145':'#36c6dc';c.strokeStyle='#20251f';c.lineWidth=.6;
   c.beginPath();c.ellipse(0,0,rx*k*.94,ry*k*.94,-.12,0,Math.PI*2);c.fill();c.stroke();
   c.fillStyle='#fff1cd';c.beginPath();c.ellipse(-rx*k*.16,-ry*k*.21,rx*k*.53,ry*k*.56,-.25,0,Math.PI*2);c.fill();c.restore();
  }
  if(flash>0){c.globalAlpha*=flash;c.strokeStyle='#fff0c6';c.lineWidth=1;c.beginPath();c.ellipse(0,0,rx*k*(1.1+flash*.5),ry*k*(1.1+flash*.5),0,0,Math.PI*2);c.stroke();}
  c.restore();
 }
}
export function drawInkPlayerPods(c,p,geo){drawSlots(c,geo,inkPlayerPodGeometry(p,geo),false);}
export function drawInkEnemyPods(c,e,geo){drawSlots(c,geo,inkEnemyPodGeometry(e,geo),true);}
