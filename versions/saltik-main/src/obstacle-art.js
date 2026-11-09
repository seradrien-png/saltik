// The authored 1536×1024 atlas has 384×512 cells. Crops use alpha>16
// hull bounds; faint RGB/background pixels outside those bounds never draw.
export const OBSTACLE_ART=Object.freeze({
  rock:{intact:{x:4,y:202,w:376,h:265},damaged:{x:5,y:681,w:376,h:272}},
  barricade:{intact:{x:385,y:257,w:381,h:207},damaged:{x:386,y:753,w:380,h:204}},
  checkpoint:{intact:{x:771,y:106,w:381,h:360},damaged:{x:772,y:590,w:380,h:367}},
  hull:{intact:{x:1152,y:191,w:382,h:274},damaged:{x:1152,y:679,w:381,h:275}}
});

export function obstacleGeometry(o,{camera=0}={}){
  const art=OBSTACLE_ART[o.type]??OBSTACLE_ART.rock,damaged=o.hp<o.maxHp*.65,crop={...(damaged?art.damaged:art.intact)};
  // A shared native scale retains both the intact and broken silhouettes.
  // Its physical AABB remains stable when pieces are chipped off the prop.
  const scale=o.w/art.intact.w,w=crop.w*scale,h=crop.h*scale,x=o.x-camera;
  return {bounds:{x:x-o.w/2,y:o.y-o.h,w:o.w,h:o.h},crop,feet:{x,y:o.y},draw:{x:x-w/2,y:o.y-h,w,h},damaged,scale};
}

export function drawObstacle(c,images,o,{camera=0,time=0}={}){
  const atlas=images.destructibles;if(o.hp<=0||!atlas)return false;
  const g=obstacleGeometry(o,{camera}),{crop,draw}=g;
  c.save();
  c.fillStyle='#071a1570';c.beginPath();c.ellipse(g.feet.x,g.feet.y-1,o.w*.48,4,0,0,Math.PI*2);c.fill();
  if(o.hit>0)c.globalAlpha=.68+Math.sin(time*90)*.08;
  c.imageSmoothingEnabled=true;c.drawImage(atlas,crop.x,crop.y,crop.w,crop.h,draw.x,draw.y,draw.w,draw.h);
  if(o.hp<o.maxHp){
    c.globalAlpha=.8;c.fillStyle='#14251cd9';c.fillRect(g.bounds.x,g.bounds.y-8,o.w,3);
    c.fillStyle='#d4ac69';c.fillRect(g.bounds.x+1,g.bounds.y-7,(o.w-2)*Math.max(0,o.hp/o.maxHp),1);
  }
  c.restore();return true;
}
