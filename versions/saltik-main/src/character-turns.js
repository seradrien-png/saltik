import {MODERN_GATLING_TURN_FRAMES,MODERN_GATLING_TURN_GUNS,MODERN_GATLING_SIDE_TURN_LEGS,MODERN_GATLING_FRONT_TURN_LEGS} from './modern-gatling-profile.js';
import {MODERN_STRIKER} from './modern-striker-art.js';
import {TURN_SOCKETS} from './character-turn-sockets.js';
import {podSlotPresentation} from './ink-pods.js';
import {inkTurnFrame} from './ink-turn.js';
const FRAMES={'modern-gatling':MODERN_GATLING_TURN_FRAMES,'modern-striker':[{anchor:[371,706],height:690},{anchor:[362,706],height:691},{anchor:[351,705],height:691}],bt:[{anchor:[385,689],height:644},{anchor:[362,686],height:635},{anchor:[343.5,689],height:644}],gatling:[{anchor:[370.5,698],height:682},{anchor:[367,693],height:677},{anchor:[360.5,698],height:682}]};
const modelKey=p=>FRAMES[p.visualModel]?p.visualModel:p.character;
export function nativeTurnView(p){const model=modelKey(p),frames=FRAMES[model],index=inkTurnFrame(p)-1;if(!frames||!p.turn?.active||index<0||index>2)return null;return{...frames[index],model,index,crop:[index*724,0,724,724],targetHeight:p.character==='bt'?770*70/393:126};}
const BT_SIDE_LEGS=[
 {hinge:480,wheelTop:606,poly:[[83,499],[138,470],[187,486],[186,550],[161,613],[145,690],[43,690],[38,646],[54,579]]},
 {hinge:480,wheelTop:610,poly:[[246,469],[309,473],[354,522],[352,580],[320,639],[309,699],[207,699],[205,650],[212,590]]},
 {hinge:495,wheelTop:609,poly:[[604,486],[659,504],[706,557],[729,619],[728,684],[625,689],[606,640],[582,575],[576,520]]}
];
const MODERN_TURN_LEGS=MODERN_STRIKER.legs.map(l=>({hinge:l.hinge,wheelTop:l.wheelTop,poly:l.polygon}));
const MODERN_FRONT_LEGS=[{hinge:440,wheelTop:585,poly:[[100,425],[225,425],[258,470],[260,538],[241,602],[241,724],[70,724],[67,620],[79,540]]},{hinge:440,wheelTop:585,poly:[[624,425],[499,425],[466,470],[464,538],[483,602],[483,724],[654,724],[657,620],[645,540]]}];
const BT_FRONT_LEGS=[
 {hinge:478,wheelTop:606,poly:[[125,467],[194,464],[238,501],[239,552],[211,624],[195,696],[42,696],[39,644],[68,566],[96,512]]},
 {hinge:478,wheelTop:606,poly:[[599,467],[530,464],[486,501],[485,552],[513,624],[529,696],[682,696],[685,644],[656,566],[628,512]]}
];
function polygon(c,points){c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();}
function split(points,y,lower){const out=[],inside=p=>lower?p[1]>=y:p[1]<=y;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],aa=inside(a),bb=inside(b);if(aa)out.push(a);if(aa!==bb){const t=(y-a[1])/(b[1]-a[1]);out.push([a[0]+(b[0]-a[0])*t,y]);}}return out;}
export function drawNativeTurn(c,image,p,{camera=0,scale=1,time=0}={}){
 const v=nativeTurnView(p);if(!image||!v)return false;const k=v.targetHeight/v.height*scale*(p.artScale??1),[sx,sy,w,h]=v.crop,[ax,ay]=v.anchor,drop=(p.character==='bt'||p.visualModel==='modern-striker'||p.visualModel==='modern-gatling')&&p.crouching?12*scale*(p.artScale??1)/k:0;
 c.save();if(p.invulnerable>0&&Math.floor(time*18)%2)c.globalAlpha*=.65;c.imageSmoothingEnabled=true;c.translate(p.x-camera,p.y);c.rotate(p.supportPose?.tilt??0);c.scale(k,k);c.translate(-ax,-ay);
 if(drop&&(p.visualModel==='modern-striker'||p.visualModel==='modern-gatling')){c.beginPath();c.rect(0,0,w,ay+1);c.clip();}
 const t=image.gatlingTurnTransforms?.[v.index]??{ratio:1,x:0,y:0},registered=([x,y,rx,ry])=>[x*t.ratio+t.x,y*t.ratio+t.y,rx*t.ratio,ry*t.ratio];
 const draw=()=>c.drawImage(image,sx,sy,w,h,0,0,w,h);
 if(drop){const source=p.visualModel==='modern-gatling'?MODERN_GATLING_SIDE_TURN_LEGS:p.visualModel==='modern-striker'?MODERN_TURN_LEGS:BT_SIDE_LEGS;const legs=v.index===1?(p.visualModel==='modern-gatling'?MODERN_GATLING_FRONT_TURN_LEGS:p.visualModel==='modern-striker'?MODERN_FRONT_LEGS:BT_FRONT_LEGS):source.map(l=>v.index===2?{...l,poly:l.poly.map(([x,y])=>[724-x,y])}:l);
  for(const leg of legs){c.save();c.translate(0,leg.wheelTop);c.scale(1,Math.max(.25,1-drop/(leg.wheelTop-leg.hinge)));c.translate(0,-leg.wheelTop);c.beginPath();polygon(c,split(leg.poly,leg.wheelTop,false));c.clip();draw();c.restore();c.save();c.beginPath();polygon(c,split(leg.poly,leg.wheelTop,true));c.clip();draw();c.restore();}
  c.save();c.translate(0,drop);for(const leg of legs){c.beginPath();c.rect(0,0,w,h);polygon(c,leg.poly);c.clip('evenodd');}draw();c.restore();
 }else draw();
 if(v.model==='modern-gatling')for(const [i,face]of MODERN_GATLING_TURN_GUNS[v.index].entries()){
  const [x,y,rx,ry]=registered(face);
  const heat=p.gatling?.heat??0;c.save();c.translate(0,drop);c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.clip();
  if(p.gatling?.spin){c.translate(x,y);c.scale(rx,ry);c.rotate(p.gatling.spin);c.scale(1/rx,1/ry);c.translate(-x,-y);draw();}
  c.restore();if(heat>.2){c.save();c.globalAlpha*=Math.min(.4,(heat-.2)*.5);c.fillStyle='#ff671e';c.beginPath();c.ellipse(x,y+drop,rx,ry,0,0,Math.PI*2);c.fill();c.restore();}
  if(heat>.65||p.gatling?.cooldown>0)for(let j=0;j<3;j++){const age=(time*.75+j*.33+i*.13)%1;c.save();c.globalAlpha*=.15*(1-age)*heat;c.fillStyle='#eee9da';c.beginPath();c.ellipse(x+Math.sin(age*5+i)*15,y+drop-ry-age*90,8+age*20,6+age*14,-.3,0,Math.PI*2);c.fill();c.restore();}
 }
 for(const [i,slot]of (TURN_SOCKETS[modelKey(p)]?.[v.index]??[]).entries()){
  const empty=p.visualModel==='modern-striker'?podSlotPresentation(p,i<4?0:i<6?1:2).round<1:p.character==='bt'?p.bt?.loaded&&!p.bt.loaded[i]&&!p.bt.loaded[i+8]:(p.gatling?.rocketRecharge??0)>0&&i<(p.gatling?.rocketIndex??0);if(!empty)continue;
  const [x,y,rx,ry]=v.model==='modern-gatling'?registered(slot):slot;c.fillStyle='#161c19';c.strokeStyle='#6f756b';c.lineWidth=2;c.beginPath();c.ellipse(x,y+drop,rx,ry,0,0,Math.PI*2);c.fill();c.stroke();
 }
 c.restore();return true;
}

export function nativeTurnSockets(p,{camera=0,scale=1}={}){
 const v=nativeTurnView(p);if(!v)return null;const k=v.targetHeight/v.height*scale*(p.artScale??1),[ax,ay]=v.anchor,angle=p.supportPose?.tilt??0,co=Math.cos(angle),si=Math.sin(angle),dx=Math.cos(p.turn.yaw)*.48,dy=-.85,n=Math.hypot(dx,dy),axis={x:dx/n*co-dy/n*si,y:dx/n*si+dy/n*co};
 return TURN_SOCKETS[modelKey(p)][v.index].map(([x,y])=>{const xx=(x-ax)*k,yy=(y-ay)*k+((p.character==='bt'||p.visualModel==='modern-gatling'||p.visualModel==='modern-striker')&&p.crouching?12*scale*(p.artScale??1):0),muzzle={x:p.x-camera+xx*co-yy*si,y:p.y+xx*si+yy*co};return{muzzle,base:{x:muzzle.x-axis.x*8,y:muzzle.y-axis.y*8},axis};});
}
