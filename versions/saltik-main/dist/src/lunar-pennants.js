// The attachment is present only on the level-two material canvases. Native
// geometry supplies the pod/roof transform, including slopes, turns and KO.
export function drawLunarPennants(c,image,geo,carrier=false){
 if(carrier)return 0;
 const flag=image?.lunarPennant;if(!flag)return 0;
 const places=carrier?[[48,331,180,240],[1030,349,180,235]]:
  geo.view==='front'?[[1168,165,145,190],[1660,165,150,190]]:
  [[195,122,110,175],[805,195,125,185]];
 for(const [i,[x,y,w,h]] of places.entries()){
  const project=p=>!carrier&&geo.view!=='front'?geo.podSourcePoint(p,i):geo.sourcePoint(p);
  const a=project([x,y]),b=project([x+w,y]),d=project([x,y+h]);
  c.save();c.transform((b.x-a.x)/flag.width,(b.y-a.y)/flag.width,(d.x-a.x)/flag.height,(d.y-a.y)/flag.height,a.x,a.y);
  c.drawImage(flag,0,0);c.restore();
 }
 return places.length;
}
