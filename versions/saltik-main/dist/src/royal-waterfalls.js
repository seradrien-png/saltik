// Registered water-only interiors of the supplied paintings. The untouched
// foam and embroidered banks hide the edges of the small moving ribbons.
export const ROYAL_WATERFALLS=Object.freeze({
 backdrop:[[815,291,16,34],[1513,175,14,66],[940,553,53,99],[1040,598,28,43],[1311,583,31,46],[909,699,207,61],[917,796,149,63]],
 bridge:[[1252,450,42,62],[1197,479,34,62],[1100,598,91,139],[1192,590,43,97]]
});
export function waterfallRibbons(zone,time=0){
 const [x,y,w,h]=zone,bands=[];
 for(let at=2;at<h-4;at+=6){
  const size=Math.min(6,h-3-at),wave=Math.sin(at*.19-time*5.5)*2.2;
  bands.push({sx:x+2,sy:Math.max(y+1,Math.min(y+h-size-1,y+at-wave)),sw:w-4,sh:size,dx:x+2,dy:y+at,dw:w-4,dh:size});
 }
 return bands;
}
export function drawRoyalWaterfalls(c,image,kind,{x=0,y=0,scale=1,scaleY=scale,time=0}={}){
 if(!image)return;
 c.save();c.globalAlpha=1;
 for(const zone of ROYAL_WATERFALLS[kind]??[])for(const b of waterfallRibbons(zone,time)){
  c.drawImage(image,b.sx,b.sy,b.sw,b.sh,x+b.dx*scale,y+b.dy*scaleY,b.dw*scale,b.dh*scaleY);
 }
 c.restore();
}
