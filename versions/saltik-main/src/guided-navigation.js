// Steering owns velocity and its planner only. The engine owns every physical hit.
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const angleDifference=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const GRID=24,MAX_EXPANSIONS=8000,REPLAN_INTERVAL=.32,TURN_RATE=7;
// Only a predicted physical collision permits launch override / tight maneuvering.
// Creation always keeps the exact native axis; ordinary clear launches keep .10s.
const AVOID_TURN_RATE=20,AVOID_SPEED=180,MIN_AVOID_SPEED=140;
const living=e=>e&&e.hp>0&&e.type!=='crate'&&e.type!=='obstacle'&&e.bounds&&e.target;
const rectDistance=(point,rect)=>Math.hypot(Math.max(rect.x-point.x,0,point.x-rect.x-rect.w),Math.max(rect.y-point.y,0,point.y-rect.y-rect.h));

export function selectGuidedTargets(targets,origin,viewport,range=1450){
  return (targets??[]).filter(e=>{
    if(!living(e)||distance(origin,e.target)>range)return false;
    const b=e.bounds,v=viewport;
    return !v||b.x+b.w>=v.x-40&&b.x<=v.x+v.w+40&&b.y+b.h>=v.y-40&&b.y<=v.y+v.h+40;
  }).sort((a,b)=>distance(origin,a.target)-distance(origin,b.target)||String(a.id).localeCompare(String(b.id)));
}

export function initializeGuidedShot(shot,{index=0,count=3,target,context}={}){
  shot.guidance={index,count,side:count>1?index/(count-1)*2-1:0,targetId:target?.id??shot.targetId,
    origin:{x:shot.x,y:shot.y},path:[],pathIndex:0,replanIn:0,approached:false,expanded:0};
  return shot;
}

function segmentRect(a,b,rect,pad){
  let low=0,high=1;
  for(const [origin,delta,min,max] of [[a.x,b.x-a.x,rect.x-pad,rect.x+rect.w+pad],[a.y,b.y-a.y,rect.y-pad,rect.y+rect.h+pad]]){
    if(Math.abs(delta)<1e-9){if(origin<min||origin>max)return false;continue;}
    const one=(min-origin)/delta,two=(max-origin)/delta;
    low=Math.max(low,Math.min(one,two));high=Math.min(high,Math.max(one,two));
    if(low>high)return false;
  }
  return true;
}

function worldGeometry(context,start,goal){
  let minX=Math.min(start.x,goal.x)-320,maxX=Math.max(start.x,goal.x)+320;
  const minY=Math.max(-1100,Math.min(start.y,goal.y)-650),maxY=Math.max(start.y,goal.y)+360;
  // Engine slabs arrive in short spans with a shared route ID. Their physical
  // ends can lie beyond the direct-flight window; include those entrances when
  // a slab separates launch and impact, while retaining a finite detour budget.
  const groups=new Map();
  for(const [index,b] of (context.blockers??[]).entries()){
    if(!(b.w>0&&b.h>0))continue;
    const key=b.id??`span:${index}`,old=groups.get(key);
    if(!old){groups.set(key,{x:b.x,y:b.y,w:b.w,h:b.h});continue;}
    const right=Math.max(old.x+old.w,b.x+b.w),bottom=Math.max(old.y+old.h,b.y+b.h);
    old.x=Math.min(old.x,b.x);old.y=Math.min(old.y,b.y);old.w=right-old.x;old.h=bottom-old.y;
  }
  for(const slab of groups.values())if(segmentRect(start,goal,slab,12)){
    if(slab.x>=Math.min(start.x,goal.x)-1100)minX=Math.min(minX,slab.x-96);
    if(slab.x+slab.w<=Math.max(start.x,goal.x)+1100)maxX=Math.max(maxX,slab.x+slab.w+96);
  }
  const blockers=(context.blockers??[]).filter(b=>b.w>0&&b.h>0&&b.x<=maxX&&b.x+b.w>=minX&&b.y<=maxY&&b.y+b.h>=minY);
  // Bucket long route slabs once per plan instead of scanning a whole canyon per node.
  const buckets=new Map(),cell=96;
  for(const b of blockers){
    const x0=Math.floor(Math.max(minX,b.x)/cell),x1=Math.floor(Math.min(maxX,b.x+b.w)/cell);
    const y0=Math.floor(Math.max(minY,b.y)/cell),y1=Math.floor(Math.min(maxY,b.y+b.h)/cell);
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
      const key=`${x},${y}`;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(b);
    }
  }
  const groundAt=context.groundAt??(()=>Infinity),heightSamples=new Map();
  // Terrain is static for this short-lived plan. Repeated arc/grid probes use
  // identical coordinates: retain exact heights rather than resampling the
  // complete native landmark profile for every safety candidate.
  const heightAt=x=>{if(!heightSamples.has(x))heightSamples.set(x,groundAt(x));return heightSamples.get(x);};
  function clear(a,b,pad=8,cacheTerrain=false){
    const lowX=Math.min(a.x,b.x)-pad,highX=Math.max(a.x,b.x)+pad,lowY=Math.min(a.y,b.y)-pad,highY=Math.max(a.y,b.y)+pad;
    const seen=new Set();
    for(let y=Math.floor(lowY/cell);y<=Math.floor(highY/cell);y++)for(let x=Math.floor(lowX/cell);x<=Math.floor(highX/cell);x++){
      for(const rect of buckets.get(`${x},${y}`)??[]){
        if(seen.has(rect))continue;seen.add(rect);if(segmentRect(a,b,rect,pad))return false;
      }
    }
    const steps=Math.max(1,Math.ceil(distance(a,b)/10));
    for(let i=0;i<=steps;i++){
      const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
      const floor=cacheTerrain?heightAt:groundAt;
      if(y+pad>=floor(x)||y+pad>=floor(x-pad)||y+pad>=floor(x+pad))return false;
    }
    return true;
  }
  return {minX,maxX,minY,maxY,clear};
}

// A stable binary heap keeps expansion bounded and avoids full-list sorting.
class Frontier{
  constructor(){this.items=[];}
  push(item){
    const a=this.items;a.push(item);let i=a.length-1;
    while(i){const p=(i-1)>>1;if(a[p].priority<=item.priority)break;a[i]=a[p];i=p;}a[i]=item;
  }
  pop(){
    const a=this.items,first=a[0],last=a.pop();if(!a.length)return first;
    let i=0;while(i*2+1<a.length){let child=i*2+1;if(child+1<a.length&&a[child+1].priority<a[child].priority)child++;
      if(a[child].priority>=last.priority)break;a[i]=a[child];i=child;}a[i]=last;return first;
  }
  get length(){return this.items.length;}
}

function findPath(world,start,goal,padding,budget){
  // Clearance tapers only at apertures and impact points, where a full turn radius
  // cannot fit. The engine still sweeps the real projectile radius everywhere.
  const padAt=point=>Math.min(padding,8+distance(point,start)*.48,8+distance(point,goal)*.48);
  const clear=(a,b)=>world.clear(a,b,Math.min(padAt(a),padAt(b)),true);
  if(clear(start,goal))return {path:[goal],expanded:0};
  const width=Math.ceil((world.maxX-world.minX)/GRID)+1,height=Math.ceil((world.maxY-world.minY)/GRID)+1;
  const point=index=>({x:world.minX+(index%width)*GRID,y:world.minY+Math.floor(index/width)*GRID});
  const nearest=p=>clamp(Math.round((p.y-world.minY)/GRID),0,height-1)*width+clamp(Math.round((p.x-world.minX)/GRID),0,width-1);
  const startKey=nearest(start),frontier=new Frontier(),cost=new Map(),parent=new Map(),closed=new Set();
  // Connect the real muzzle to neighboring grid points without snapping through cover.
  const startColumn=startKey%width,startRow=Math.floor(startKey/width);
  for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++){
    const col=startColumn+x,row=startRow+y;if(col<0||row<0||col>=width||row>=height)continue;
    const key=row*width+col,p=point(key);if(!clear(start,p))continue;
    const g=distance(start,p);cost.set(key,g);parent.set(key,-1);frontier.push({key,priority:g+distance(p,goal)});
  }
  let expanded=0,found=null;
  const directions=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  while(frontier.length&&expanded<budget){
    const {key}=frontier.pop();if(closed.has(key))continue;closed.add(key);expanded++;
    const a=point(key),col=key%width,row=Math.floor(key/width);
    if(distance(a,goal)<GRID*2&&clear(a,goal)){found=key;break;}
    for(const [dx,dy] of directions){
      const x=col+dx,y=row+dy;if(x<0||y<0||x>=width||y>=height)continue;
      const next=y*width+x;if(closed.has(next))continue;const b=point(next),nextCost=cost.get(key)+distance(a,b);
      if(nextCost>=(cost.get(next)??Infinity)||!clear(a,b))continue;
      cost.set(next,nextCost);parent.set(next,key);frontier.push({key:next,priority:nextCost+distance(b,goal)});
    }
  }
  if(found===null)return {path:null,expanded};
  const raw=[goal];while(found!==-1){raw.push(point(found));found=parent.get(found);}raw.push(start);raw.reverse();
  const path=[];let anchor=0;
  while(anchor<raw.length-1){let next=raw.length-1;while(next>anchor+1&&!clear(raw[anchor],raw[next]))next--;path.push(raw[next]);anchor=next;}
  return {path,expanded};
}

function impactPoint(target,planner,shot){
  const b=target.bounds,inset=Math.min(9,b.h*.18),spread=Math.min(24,Math.max(0,(b.h-2*inset)/2));
  const base={x:clamp(target.target.x,b.x+Math.min(8,b.w/3),b.x+b.w-Math.min(8,b.w/3)),
    y:clamp(target.target.y+planner.side*spread,b.y+inset,b.y+b.h-inset)};
  // Lead a moving body without aiming at its stale feet. This is still a real
  // intercept: a swept live enemy bounds test is the only source of damage.
  const lead=clamp(distance(shot,base)/470,0,.65);
  return {x:base.x+(target.vx??0)*lead,y:base.y+(target.vy??0)*lead};
}

function approachPoint(shot,goal,planner,world){
  if(planner.approached||distance(shot,goal)<210)return goal;
  if(planner.approach&&world.clear(planner.approach,goal,8))return planner.approach;
  const origin=planner.origin,angle=Math.atan2(origin.y-goal.y,origin.x-goal.x),wanted=-planner.side*.78;
  const alternatives=[wanted,wanted+.3,wanted-.3,wanted+.6,wanted-.6,wanted+1.0,wanted-1.0];
  for(const offset of alternatives){
    const p={x:goal.x+Math.cos(angle+offset)*155,y:goal.y+Math.sin(angle+offset)*155};
    if(world.clear(p,p,24)&&world.clear(p,goal,8)){planner.approach=p;return p;}
  }
  planner.approached=true;return goal;
}

function buildPlan(shot,context,goal,planner){
  const world=worldGeometry(context,shot,goal),stage=approachPoint(shot,goal,planner,world);
  let remaining=MAX_EXPANSIONS,answer=null,total=0;
  for(const padding of [68,32,12]){
    const result=findPath(world,shot,stage,padding,remaining);remaining-=result.expanded;total+=result.expanded;
    if(result.path){answer=result.path;planner.clearance=padding;break;}if(remaining<=0)break;
  }
  planner.expanded=total;planner.path=answer??[];planner.pathIndex=0;planner.goal={...goal};
  planner.stage={...stage};planner.replanIn=REPLAN_INTERVAL;planner.world=world;planner.failed=!answer;
}

function reacquire(shot,context,planner){
  const candidates=selectGuidedTargets(context.targets,shot,context.viewport,1700);
  const load=id=>(context.projectiles??[]).filter(p=>p!==shot&&p.kind==='homing'&&p.team==='player'&&p.life>0&&p.targetId===id).length;
  candidates.sort((a,b)=>load(a.id)-load(b.id)||distance(shot,a.target)-distance(shot,b.target)||String(a.id).localeCompare(String(b.id)));
  const target=candidates[0];shot.targetId=target?.id??null;
  planner.targetId=shot.targetId;planner.path=[];planner.replanIn=0;planner.approach=null;planner.approached=false;planner.origin={x:shot.x,y:shot.y};
  return target;
}

function predictArc(shot,heading,error,speed,rate,world,horizon){
  let point={x:shot.x,y:shot.y},angle=heading,left=error;
  const step=.025,pad=(shot.radius??5)+2;
  for(let elapsed=0;elapsed<horizon-1e-8;elapsed+=step){
    const dt=Math.min(step,horizon-elapsed),turn=clamp(left,-rate*dt,rate*dt);angle+=turn;left-=turn;
    const next={x:point.x+Math.cos(angle)*speed*dt,y:point.y+Math.sin(angle)*speed*dt};
    if(!world.clear(point,next,pad))return {safe:false,time:elapsed,point};point=next;
  }
  return {safe:true,time:horizon,point};
}

function safeSteering(shot,heading,error,speed,waypoint,world){
  const horizon=clamp(distance(shot,waypoint)/Math.max(speed,180),.14,.5);
  if(predictArc(shot,heading,error,speed,TURN_RATE,world,horizon).safe)return {error,speed,rate:TURN_RATE,avoiding:false};
  // The shortest angular turn can be the wrong side near terrain (especially
  // reacquiring behind the launcher). Prefer the open ordinary-radius turn.
  if(Math.abs(error)>2.0){
    const opposite=error-Math.sign(error)*Math.PI*2;
    if(predictArc(shot,heading,opposite,speed,TURN_RATE,world,.5).safe)return {error:opposite,speed,rate:TURN_RATE,avoiding:true};
  }
  const candidates=[error,-Math.PI/2,Math.PI/2,-Math.PI*.85,Math.PI*.85,-Math.PI/4,Math.PI/4,-Math.PI,Math.PI];
  let best=null,bestScore=Infinity;
  for(const candidate of candidates){
    const result=predictArc(shot,heading,candidate,AVOID_SPEED,AVOID_TURN_RATE,world,.5);
    const score=(result.safe?0:10000-result.time*1000)+distance(result.point,waypoint)+Math.abs(angleDifference(candidate,error))*16;
    if(score<bestScore){bestScore=score;best={error:candidate,speed:AVOID_SPEED,rate:AVOID_TURN_RATE,avoiding:true};}
  }
  return best;
}

export function steerGuidedProjectile(shot,context,dt){
  if(!shot.guidance)initializeGuidedShot(shot,{index:shot.salvoIndex??1,count:shot.salvoCount??3});
  const planner=shot.guidance;
  let target=(context.targets??[]).find(e=>e.id===shot.targetId&&living(e));
  if(!target)target=reacquire(shot,context,planner);
  if(!(dt>0))return;
  planner.avoiding=false;
  if((shot.age??0)<=.10){
    const world=worldGeometry(context,shot,target?.target??{x:shot.x+shot.vx,y:shot.y+shot.vy});
    const ahead={x:shot.x+shot.vx*.13,y:shot.y+shot.vy*.13};
    if(!planner.launchAvoided&&world.clear(shot,ahead,(shot.radius??5)+2))return;
    planner.launchAvoided=true;planner.avoiding=true;
  }
  let heading=Math.atan2(shot.vy,shot.vx),speed=Math.hypot(shot.vx,shot.vy);
  if(!target){speed=clamp(speed,390,620);shot.vx=Math.cos(heading)*speed;shot.vy=Math.sin(heading)*speed;return;}
  const goal=impactPoint(target,planner,shot);
  planner.replanIn-=dt;
  if(planner.approach&&!planner.approached&&distance(shot,planner.approach)<65){planner.approached=true;planner.replanIn=0;planner.approach=null;}
  if(planner.replanIn<=0||!planner.goal||distance(goal,planner.goal)>65)buildPlan(shot,context,goal,planner);
  const path=planner.path;
  while(planner.pathIndex<path.length-1&&distance(shot,path[planner.pathIndex])<62)planner.pathIndex++;
  let waypoint=path[planner.pathIndex];
  if(!waypoint){
    // No route within the bounded search: coast into ordinary expiry/collision.
    // Do not substitute a target hit or disable the wall that blocked the plan.
    speed=390;
  }else{
    if(planner.approached&&planner.pathIndex===path.length-1&&planner.world.clear(shot,goal,8))waypoint=goal;
    const desired=Math.atan2(waypoint.y-shot.y,waypoint.x-shot.x),error=angleDifference(desired,heading);
    // A low turn radius matters more than top speed near cover or the body.
    const requested=Math.abs(error)>.18||distance(shot,goal)<300||path.length-planner.pathIndex>1?390:540;
    speed=clamp(speed+clamp(requested-speed,-700*dt,360*dt),MIN_AVOID_SPEED,620);
    const steering=safeSteering(shot,heading,error,speed,waypoint,planner.world);
    planner.avoiding=planner.avoiding||steering.avoiding||speed<390;
    speed=steering.speed;heading+=clamp(steering.error,-steering.rate*dt,steering.rate*dt);
  }
  shot.vx=Math.cos(heading)*speed;shot.vy=Math.sin(heading)*speed;
}
