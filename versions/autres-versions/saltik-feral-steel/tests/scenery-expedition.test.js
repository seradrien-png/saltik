import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoutes,surfaceHeight,routeThickness,terrainHeight} from '../src/world.js';
import {drawNaturalRoutes,drawRockButtresses,drawNaturalGround,drawAncientRuins} from '../src/scenery.js';
function canvas(){
  const draws=[],paths=[],clips=[],clipRules=[],stack=[];let current=[],subpaths=[],subpath=null,active=null;
  const c={draws,paths,clips,clipRules,save(){stack.push(active);},restore(){active=stack.pop();},beginPath(){current=[];subpaths=[];subpath=null;},closePath(){},clip(rule){active=current.map(p=>[...p]);clips.push(active);clipRules.push({rule,paths:subpaths.map(path=>path.map(p=>[...p]))});},fill(){},stroke(){},translate(){},scale(){},rotate(){},transform(){},fillRect(){},moveTo(x,y){subpath=[[x,y]];subpaths.push(subpath);current.push([x,y]);paths.push([x,y]);},lineTo(x,y){subpath?.push([x,y]);current.push([x,y]);paths.push([x,y]);},ellipse(){},bezierCurveTo(){},quadraticCurveTo(){},drawImage(...args){draws.push({args,clip:active});},createLinearGradient(){return{addColorStop(){}};}};return c;
}
const images=Object.fromEntries(['ground-surface','cliff-texture','wreck','ruins-atlas'].map(key=>[key,{key,width:key==='cliff-texture'?1774:2172,height:key==='cliff-texture'?887:724}]));
function nativeScale(draw){const d=draw.args;assert.ok(Math.abs(d[7]/d[3]-d[8]/d[4])<.00001,`${d[0].key} crop ${d[3]}x${d[4]} must keep its native scale in ${d[7]}x${d[8]}`);}

test('ground and all seven crowns keep material proportions instead of thin affine strips',()=>{
  for(const p of createRoutes()){
    const c=canvas();drawNaturalRoutes(c,images,[p],p.x1-40,p.x2-p.x1+80,0);
    assert.ok(c.draws.length>0);c.draws.forEach(nativeScale);assert.ok(c.paths.every(p=>p.every(Number.isFinite)));
  }
  for(const camera of [0,3800,7400,9900,12800,15500]){const c=canvas();drawNaturalGround(c,images,camera,900,0);assert.ok(c.draws.length>0);c.draws.forEach(nativeScale);}
});
test('stone and soil textures stay inside each actual tapered physical route slab',()=>{
  for(const p of createRoutes()){
    const camera=p.x1-60,c=canvas();drawNaturalRoutes(c,images,[p],camera,p.x2-p.x1+120,0);
    for(const d of c.draws){assert.ok(d.clip?.length>3,'native material needs a physical silhouette clip');for(const [sx,y] of d.clip){const x=sx+camera;assert.ok(x>=p.x1-.01&&x<=p.x2+.01);assert.ok(y>=surfaceHeight(p,x)-.01&&y<=surfaceHeight(p,x)+routeThickness(p,x)+.01,`${p.id} painted slab at ${x},${y}`);}}
  }
});
test('each split passage belongs to one continuous landform connected below the ground',()=>{
  const routes=createRoutes();
  for(const p of routes.filter(p=>p.tier===1)){
    const c=canvas(),group=routes.filter(r=>r===p||r.lower===p);drawRockButtresses(c,images,group,p.x1-600,p.x2-p.x1+1200,0);
    assert.ok(c.draws.length>0);c.draws.forEach(nativeScale);
    assert.ok(c.clips.some(clip=>{const xs=clip.map(q=>q[0]),ys=clip.map(q=>q[1]);return Math.max(...xs)-Math.min(...xs)>p.x2-p.x1+150&&Math.max(...ys)>terrainHeight((p.x1+p.x2)/2)+45;}),`${p.id} needs a continuous grounded bank, hull or ruin`);
    assert.ok(c.paths.every(p=>p.every(Number.isFinite)));
  }
});
test('physical banks use only native stone and soil; intact landmarks stay outside their silhouette clips',()=>{
  const routes=createRoutes();
  for(const p of routes.filter(r=>r.mass)){
    const c=canvas();drawRockButtresses(c,images,routes.filter(r=>r===p||r.lower===p),p.x1-600,p.x2-p.x1+1200,0);
    assert.ok(c.draws.every(({args:d})=>d[0]!==images.wreck&&d[0]!==images['ruins-atlas']),`${p.id} must not use a hull or building as bank material`);
  }
  const landmark=canvas();drawAncientRuins(landmark,images,4000,1440,0);drawAncientRuins(landmark,images,10000,1440,0);
  const native=landmark.draws.filter(({args:d})=>d[0]===images.wreck||d[0]===images['ruins-atlas']);
  assert.ok(native.some(({args:d})=>d[0]===images.wreck&&d[1]===0&&d[2]===0&&d[3]===2172&&d[4]===724),'the whole native hull remains a landmark');
  assert.ok(native.some(({args:d})=>d[0]===images['ruins-atlas']&&d[4]>500),'old buildings remain upright complete silhouettes');
  for(const draw of native){nativeScale(draw);assert.equal(draw.clip,null,'native landmark alpha must not be cut into a bank or arch');}
});

const inside=(polygon,x,y)=>{let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [a,b]=polygon[i],[d,e]=polygon[j];if((b>y)!==(e>y)&&x<(d-a)*(y-b)/(e-b)+a)hit=!hit;}return hit;};
function rearPaintFraction(p,routes){
  const camera=p.x1-600,c=canvas();drawRockButtresses(c,images,routes.filter(r=>r===p||r.lower===p),camera,p.x2-p.x1+1200,0);
  const clip=c.clipRules.find(q=>q.rule==='evenodd');assert.ok(clip);
  let total=0,solid=0;
  for(let x=p.x1+90;x<=p.x2-90;x+=25)for(const lift of [25,55,85]){total++;if(clip.paths.filter(path=>inside(path,x-camera,terrainHeight(x)-lift)).length%2)solid++;}
  return solid/total;
}
test('some split routes have densely filled banks while the wet gorge keeps a broad open arch',()=>{
  const routes=createRoutes();
  for(const id of ['ledge-0','ledge-1','wreck-perch','ledge-5']){
    const fraction=rearPaintFraction(routes.find(p=>p.id===id),routes);
    assert.ok(fraction>.7,`${id} needs a substantial continuous rear bank, painted fraction ${fraction}`);
  }
  assert.ok(rearPaintFraction(routes.find(p=>p.id==='ledge-2'),routes)<.3,'the gorge remains open onto its waterfall landscape');
});
