import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkScene} from '../src/ink-scene.js';
import {inkSaltikGeometry} from '../src/ink-saltik.js';
import {drawModernStriker} from '../src/modern-striker-art.js';
import {drawGatling} from '../src/gatling-art.js';
import {drawInkEnemySaltik} from '../src/ink-enemy-saltik.js';

// Record the real canvas masks in world coordinates, including every clip.
function maskCanvas(){
 let matrix=[1,0,0,1,0,0],clips=[],path=[],stack=[];const draws=[];
 const point=(x,y)=>[matrix[0]*x+matrix[2]*y+matrix[4],matrix[1]*x+matrix[3]*y+matrix[5]];
 const multiply=([a,b,c,d,e,f])=>{const [A,B,C,D,E,F]=matrix;matrix=[A*a+C*b,B*a+D*b,A*c+C*d,B*c+D*d,A*e+C*f+E,B*e+D*f+F];};
 const api={globalAlpha:1,save(){stack.push({matrix:[...matrix],clips:[...clips]});},restore(){({matrix,clips}=stack.pop());},translate(x,y){multiply([1,0,0,1,x,y]);},scale(x,y){multiply([x,0,0,y,0,0]);},rotate(a){multiply([Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0]);},transform(...m){multiply(m);},beginPath(){path=[];},moveTo(x,y){path.push([point(x,y)]);},lineTo(x,y){path.at(-1).push(point(x,y));},rect(x,y,w,h){path.push([[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(q=>point(...q)));},clip(rule){clips.push({polygons:path.map(p=>p.slice()),rule});},drawImage(){draws.push(clips.slice());}};
 return {context:new Proxy(api,{get:(o,k)=>k in o?o[k]:(()=>{})}),draws};
}
function inside([x,y],polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function painted(draws,point){return draws.some(clips=>clips.every(({polygons,rule})=>{const n=polygons.filter(poly=>inside(point,poly)).length;return rule==='evenodd'?n%2===1:n>0;}));}
for(const character of ['striker','gatling','bt'])test(`${character} jump preserves original body attachment mask in both directions`,()=>{
 for(const dir of [-1,1])for(const scale of [.55,1,1.4])for(const spread of [.25,.65,1]){
  const p={...createInkScene({character}).player,x:500,y:500,dir,onGround:false,supportPose:null,artScale:scale,jumpLegs:{spread},invulnerable:0};
  const g=inkSaltikGeometry(p),native=g.btNative??g,legs=g.modernLegs??g.nativeLegs??native.legs,point=native.nativePoint??native.sourcePoint;
  const c=maskCanvas();
  if(character==='striker')drawModernStriker(c.context,{},p,g);
  else if(character==='gatling')drawGatling(c.context,{},p,g);
  else drawInkEnemySaltik(c.context,{},p);
  for(const [index,leg]of legs.entries()){
   // A point just inside the top of each existing root cutout must remain painted.
   const center=leg.polygon.reduce((a,b)=>[a[0]+b[0]/leg.polygon.length,a[1]+b[1]/leg.polygon.length],[0,0]);
   for(const [i,a] of leg.polygon.entries()){const b=leg.polygon[(i+1)%leg.polygon.length];for(const t of [.1,.5,.9]){const edge=[a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t],sample=[edge[0]*.999+center[0]*.001,edge[1]*.999+center[1]*.001];if(sample[1]>=leg.hinge)continue;const world=point(sample);
   assert(painted(c.draws,[world.x,world.y]),`${character} leg${index} dir${dir} scale${scale} spread${spread} sample${sample}: fixed root cutout is empty`);}}
  }
 }
});

test('full jump splay keeps a compact eight-unit stance independent of native resolution',async()=>{
 const {jumpLegOffset,jumpLegExtension}=await import('../src/jump-leg-pose.js');
 for(const k of [126/689,126/543,70/393])for(const scale of [.55,1,1.4]){
  const actor={jumpLegs:{spread:1}};
  assert(Math.abs(jumpLegOffset(actor,0,300,k*scale,scale)*k*scale)<=8*scale+1e-9);
  assert(jumpLegExtension(actor,k*scale,scale)*k*scale<=4.8*scale+1e-9);
 }
});
