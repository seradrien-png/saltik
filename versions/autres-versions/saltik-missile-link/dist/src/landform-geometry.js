import {terrainHeight,surfaceHeight} from './world.js';
export function massCrown(p,upper,x){
  const core=surfaceHeight(p,x);
  if(!upper)return core;
  const blend=Math.min(1,Math.max(0,(x-upper.x1+135)/135),Math.max(0,(upper.x2+175-x)/175));
  return core+(surfaceHeight(upper,x)-core)*blend;
}
export function landformCrownPoints(p,upper){
  const left=p.x1-p.mass.left,right=p.x2+p.mass.right;
  const crown=x=>massCrown(p,upper,x),entry=crown(p.x1),exit=crown(p.x2);
  const points=[
    [left,terrainHeight(left)+90],
    [left+p.mass.left*.16,terrainHeight(left+p.mass.left*.16)+10],
    [left+p.mass.left*.47,entry+(terrainHeight(left)-entry)*.6],
    [p.x1-58,entry+24],[p.x1,entry]
  ];
  for(let x=p.x1+12;x<p.x2;x+=12)points.push([x,crown(x)]);
  points.push([p.x2,exit],[p.x2+65,exit+17],
    [p.x2+p.mass.right*.5,exit+(terrainHeight(right)-exit)*.48],
    [right-33,terrainHeight(right)+8],[right,terrainHeight(right)+100]);
  return points;
}
