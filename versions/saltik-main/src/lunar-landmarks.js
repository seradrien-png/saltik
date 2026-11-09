// Native painted contours, measured in the unmodified 1536 x 1024 atlas.
// All art stays in world coordinates, exactly like the level-one cutouts.
export const LUNAR_ART='lunar-monuments';
export const LUNAR_CELLS={
 aqueduct:{source:'bridge',crop:[0,0,1774,887],cap:[[450,391],[470,392],[650,399],[850,404],[1080,406],[1300,407],[1500,410],[1640,415]],foot:805,ground:[[70,805],[300,767],[600,760],[1000,758],[1450,770],[1720,800]],stair:[[70,805],[130,747],[202,671],[278,595],[351,518],[413,449],[470,392]]},
 observatory:{crop:[768,0,768,500],cap:[[75,326],[100,326],[172,328],[275,348],[450,351],[620,349],[720,348]],foot:475,stair:[[270,475],[230,442],[185,400],[142,360],[100,326]]},
 bastion:{crop:[0,512,768,512],cap:[[24,302],[49,302],[162,307],[330,309],[465,309],[610,307],[710,304]],foot:475,stair:[[260,475],[203,433],[151,388],[98,344],[49,302]]},
 gate:{crop:[768,512,768,512],cap:[[64,294],[180,300],[355,300],[500,300],[650,298],[720,293]],depth:250},
};
export const LUNAR_SITES=[
 ['aqueduct',950,2050,410],['observatory',3540,4240,400],
 ['aqueduct',5410,6580,360],['bastion',7460,8260,410],
 ['observatory',11750,13000,355],['bastion',14500,15700,410],
].map(([kind,x1,x2,y],i)=>{
 const cell=LUNAR_CELLS[kind],first=cell.cap[0],last=cell.cap.at(-1),scale=(x2-x1)/(last[0]-first[0]);
 return {id:`lunar-terrace-${i}`,kind,x1,x2,y,scale,left:x1-first[0]*scale,top:y-first[1]*scale,
  points:cell.cap.map(([x,sy])=>[x1+(x-first[0])*scale,y+(sy-first[1])*scale]),
  nativeStair:cell.stair?.map(([x,sy])=>[x1+(x-first[0])*scale,y+(sy-first[1])*scale]),
  groundPoints:cell.ground?.map(([x,sy])=>[x1+(x-first[0])*scale,y+(sy-first[1])*scale]),
  floor:Math.min(880,y+((cell.foot??475)-first[1])*scale)};
});
export function lunarPaintedBounds(site){const cell=LUNAR_CELLS[site.kind];return{x:site.left,y:site.top,w:cell.crop[2]*site.scale,h:cell.crop[3]*site.scale};}
export function paintLunarCutout(c,art,kind,{x,y,w,h,alpha=1,flip=false}){
 if(!art)return;const cell=LUNAR_CELLS[kind],pack='atlas' in art||'bridge' in art;
 const image=pack?(cell.source==='bridge'?art.bridge:art.atlas):art;if(!image)return;
 c.save();c.globalAlpha*=alpha;c.translate(x+(flip?w:0),y);if(flip)c.scale(-1,1);
 c.drawImage(image,...cell.crop,0,0,w,h);c.restore();
}
export function paintLunarStair(c,art,entry,camera){
 if(!art)return;
 const a=entry.points[0],b=entry.points.at(-1),w=b[0]-a[0],h=a[1]-b[1];
 // The atlas observatory has a complete painted staircase. Its measured
 // bottom-to-top samples are mirrored to make a forward ascent here.
 c.save();c.translate(b[0]-camera+14,b[1]-7);c.scale(-1,1);
 c.drawImage(art,846,322,218,159,-14,0,w+28,h+14);c.restore();
}
