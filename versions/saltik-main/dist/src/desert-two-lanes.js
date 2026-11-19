import {advanceDesertNativeMovement,finishDesertNativeFrame,advanceRoyalWeaponSimulation,spawnDesertNativeTarget,fireDesertNativeTarget,clearPlayerWeaponQueue} from './engine.js';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export const DESERT_LANE_START=180,DESERT_LANE_END=6200;
export const DESERT_LANE_DEFAULTS=Object.freeze({ground:620,separation:96,transitionSeconds:.75,highScale:.8,switchEverywhere:true,junctions:[]});
// Normalized artist registration: both hand-authored routes end at the C-07 door.
export const DESERT_LANE_CURVES=Object.freeze({
 low:[[0.13,0.805],[0.2,0.825],[0.28,0.847],[0.36,0.87],[0.46,0.88],[0.54,0.877],[0.62,0.831],[0.72,0.765],[0.82,0.696],[0.9,0.647],[0.95,0.628]],
 high:[[0.13,0.804],[0.22,0.793],[0.31,0.758],[0.39,0.697],[0.43,0.656],[0.46,0.591],[0.5,0.53],[0.55,0.478],[0.61,0.427],[0.67,0.395],[0.71,0.404],[0.76,0.432],[0.81,0.485],[0.86,0.554],[0.91,0.622],[0.95,0.628]]
});
export function desertLogicalGround(depth=0,config=DESERT_LANE_DEFAULTS){return config.ground-clamp(depth)*config.separation;}
function curveY(points,x){
 let i=1;while(i<points.length-1&&points[i][0]<x)i++;
 const [ax,ay]=points[i-1],[bx,by]=points[i],t=clamp((x-ax)/(bx-ax));
 // Smoothstep tangents avoid visible hard corners without drifting from the traced path.
 return ay+(by-ay)*t*t*(3-2*t);
}
export function desertLaneProjection(x,depth=0,box={x:0,y:0,w:1536,h:768},config=DESERT_LANE_DEFAULTS){
 const progress=clamp((x-DESERT_LANE_START)/(DESERT_LANE_END-DESERT_LANE_START)),u=.13+.82*progress,d=clamp(depth),curves=config.curves??DESERT_LANE_CURVES;
 const low=curveY(curves.low,u),high=curveY(curves.high,u);
 return {x:box.x+u*box.w,y:box.y+(low+(high-low)*d)*box.h,scale:1+(config.highScale-1)*d,depth:d};
}
export function projectDesertLaneEntity(entity,box,config=DESERT_LANE_DEFAULTS){
 const p=desertLaneProjection(entity.x,entity.desertDepth??0,box,config),height=desertLogicalGround(entity.desertDepth??0,config)-entity.y;
 return {...p,y:p.y-height*p.scale*(box.h/768),height};
}
export function initializeDesertTwoLanes(g,options={}){
 if(g.desert.lanes?.active)return g.desert.lanes;
 const config={...DESERT_LANE_DEFAULTS,spawnTargets:g.desert.phase!=='return',...options},state={active:true,elapsed:0,depth:0,targetDepth:0,transition:null,upHeld:false,downHeld:false,config,previousGroundAt:g.groundAt};
 g.desert.lanes=state;g.player.desertDepth=0;g.player.artScale=1;g.player.y=config.ground;g.player.supportY=config.ground;
 // The movement floor follows the hero; navigation sees the common logical floor.
 g.groundAt=()=>desertLogicalGround(g.player.desertDepth,config);
 const safelyImpactDepth=()=>state.impactDepth??g.player.desertDepth;
 g.desertCombatHooks={
  primaryAngle:p=>p.dir===-1?Math.PI:0,
  navigationGroundAt:()=>config.ground,
  initializeProjectile(shot){shot.desertDepth=g.player.desertDepth;shot.desertLaunchDepth=shot.desertDepth;if(shot.kind==='bullet'){shot.vx=Math.abs(Math.hypot(shot.vx,shot.vy))*g.player.dir;shot.vy=0;}},
  decorateEvent(event){
   const actor=g.enemies.find(e=>Math.abs(e.x-event.x)<.001&&[e.y-35,e.y-40,e.y].some(y=>Math.abs(y-event.y)<.001));
   event.desertDepth=actor?.desertDepth??safelyImpactDepth();
  },
  onImpact(shot){state.impactDepth=shot.desertDepth;},
  beforeProjectileStep(shot,dt){
   shot.desertDepth??=g.player.desertDepth;
   if(shot.kind==='homing'){const target=g.enemies.find(e=>e.id===(shot.targetId??shot.guidance?.targetId)&&e.hp>0);if(target){const d=target.desertDepth??0;shot.desertDepth+=clamp(d-shot.desertDepth,-dt/.5,dt/.5);}}
  },
  projectileGroundAt:shot=>shot?.kind==='homing'?config.ground:desertLogicalGround(shot?.desertDepth??0,config),
  canHit:(shot,target)=>shot.kind!=='bullet'&&shot.team!=='enemy'||Math.abs((shot.desertDepth??0)-(target.desertDepth??0))<.35
 };
 // Four stationary native bodies and native guns make a deliberately sparse prototype.
 if(config.spawnTargets)for(const [i,[x,depth,type]] of [[850,0,'turret'],[1100,1,'turret'],[3000,0,'soldier'],[3350,1,'soldier']].entries()){
  const e=spawnDesertNativeTarget(g,{id:`desert-lane-${i}`,x,type,desertDepth:depth,desertPrototype:true});
  e.y=desertLogicalGround(depth,config);e.artScale=1;e.cooldown=3+i*.7;e.dir=-1;
 }
 return state;
}
export function clearDesertTwoLanes(g){
 const s=g.desert?.lanes;if(!s?.active)return;
 s.active=false;g.groundAt=s.previousGroundAt;delete g.desertCombatHooks;
 g.enemies=g.enemies.filter(e=>!e.desertPrototype);g.projectiles=[];clearPlayerWeaponQueue(g.player);delete g.player.desertDepth;
}
export function advanceDesertTwoLanes(g,input={},dt=1/60){
 if(g.status!=='playing')return;
 dt=clamp(Number.isFinite(dt)?dt:0,0,1/30);if(!dt)return;
 const playerStart={x:g.player.x,y:g.player.y};
 const s=g.desert.lanes?.active?g.desert.lanes:initializeDesertTwoLanes(g),p=g.player,c=s.config;
 g.time+=dt;
 if(g.introElapsed<g.introDuration){g.introElapsed=Math.min(g.introDuration,g.introElapsed+dt);return;}
 if(!['outbound','return'].includes(g.desert.phase)){advanceRoyalWeaponSimulation(g,{},dt);finishDesertNativeFrame(g,dt);return;}
 s.elapsed+=dt;delete s.impactDepth;
 const up=!!(input.laneUp||input.jump||input.up),down=!!(input.laneDown||input.drop||input.crouch||input.down);
 const allowed=c.switchEverywhere||c.junctions.some(j=>Math.abs(p.x-(typeof j==='number'?j:j.x))<=(j.radius??100));
 if(allowed){const requested=up&&!s.upHeld?1:down&&!s.downHeld?0:null;if(requested!==null&&requested!==s.targetDepth){s.targetDepth=requested;s.transition={from:s.depth,to:requested,elapsed:0};}}
 s.upHeld=up;s.downHeld=down;
 if(s.transition){const t=s.transition;t.elapsed=Math.min(c.transitionSeconds,t.elapsed+dt);const u=t.elapsed/c.transitionSeconds;s.depth=t.from+(t.to-t.from)*u*u*(3-2*u);if(t.elapsed>=c.transitionSeconds-1e-9){s.depth=t.to;s.transition=null;}}
 p.desertDepth=s.depth;p.artScale=1;p.y=desertLogicalGround(s.depth,c);p.supportY=p.y;p.onGround=true;p.vy=0;
 const movement=advanceDesertNativeMovement(g,{...input,jump:false,drop:false,crouch:false},dt);
 p.x=clamp(p.x,DESERT_LANE_START,DESERT_LANE_END);
 movement.x=p.x-playerStart.x;movement.y=p.y-playerStart.y;
 g.maxX=Math.max(g.maxX,p.x);
 // The panorama camera is fixed in pixels; native target selection follows logical progression.
 g.viewport={x:p.x-360,y:0,w:1280,h:720};
 for(const e of g.enemies){if(!e.desertPrototype||e.hp<=0)continue;e.phase+=dt;e.hit=Math.max(0,e.hit-dt);e.firePose=Math.max(0,e.firePose-dt);e.cooldown-=dt;
  if(e.cooldown<=0&&Math.abs(e.x-p.x)<850&&Math.abs(e.desertDepth-p.desertDepth)<.35){fireDesertNativeTarget(g,e);e.firePose=.16;e.cooldown=e.type==='turret'?3.6:5.4;}
 }
 advanceRoyalWeaponSimulation(g,movement.fireEligible?input:{...input,fire:false},dt,movement);
 finishDesertNativeFrame(g,dt);
 delete s.impactDepth;
 for(const shot of g.projectiles)shot.desertDepth??=p.desertDepth;
 // Impacts retain logical coordinates; only their depth is extra rendering metadata.
 for(const event of g.events)if(event.desertDepth===undefined&&Number.isFinite(event.y))event.desertDepth=p.desertDepth;
 if(g.events.length>200)g.events.splice(0,g.events.length-200);
}
