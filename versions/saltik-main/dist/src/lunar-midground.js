// Sparse, fully opaque floating astronomical ruins, physically behind the
// playable citadels. The distant painting and stone face remain unchanged.
export const LUNAR_MIDDLE_SITES=[{x:800,scale:.34},{x:4100,scale:.39},{x:7800,scale:.32},{x:11800,scale:.37},{x:15800,scale:.34}];
export function lunarMiddleBounds(site,{camera,width,height}){const h=height*site.scale;return{x:width*.55+(site.x-camera)*.24,y:height*.64,w:h*1001/819,h};}
export function drawLunarMidground(c,{camera,width,height,layers}){
 if(!layers)return;
 c.save();c.globalAlpha=1;
 for(const site of LUNAR_MIDDLE_SITES){const b=lunarMiddleBounds(site,{camera,width,height});if(b.x+b.w<-20||b.x>width+20)continue;c.drawImage(layers,920,0,1001,819,b.x,b.y,b.w,b.h);}
 c.restore();
}

// Both opaque scenery planes sit behind the playable world and only occupy
// the lower view. Native road samples bury their base beneath the real ground.
export function lunarLowPlanes({camera,cameraY=0,width,height,groundAt}){
 const road=[];for(let x=-80;x<=width+160;x+=40)road.push(groundAt(camera+x)+cameraY);
 const floor=Math.max(...road)+180,ceiling=height*.55;
 return [{rate:.42,w:960,lift:190,row:0,capH:210,cut:.22},{rate:.7,w:1280,lift:115,row:1,capH:190,cut:.04}].map(p=>{
  const y=Math.max(ceiling,Math.min(...road)-p.lift),h=Math.max(180,floor-y),first=Math.floor(camera*p.rate/p.w);
  const tiles=[];for(let i=first;i<=first+Math.ceil(width/p.w);i++)tiles.push({x:i*p.w-camera*p.rate,flip:Math.abs(i%2)===1});
  return {...p,y,h:Math.max(h,p.capH),tiles};
 });
}
export function drawLunarLowDepth(c,opts){
 if(!opts.image)return;
 const {width,height,image,texture}=opts,sourceH=image.height/2;
 c.save();c.globalAlpha=1;c.beginPath();c.rect(0,height*.55,width,height*.45);c.clip();
 for(const plane of lunarLowPlanes(opts))for(const tile of plane.tiles){
  // Adjacent mirrored tiles meet at the exact same painted edge.
  c.save();c.translate(tile.x+(tile.flip?plane.w+1:0),plane.y);if(tile.flip)c.scale(-1,1);
  // Keep the architecture's visible height independent of the buried base;
  // stretching the entire atlas would hide all but its roofs behind the road.
  const baseTop=plane.capH-36;
  c.fillStyle='#b99462';c.fillRect(0,baseTop,plane.w+1,plane.h-baseTop);
  if(texture){
   // Valleys expose this base: tile real sandstone at the road's own scale,
   // rather than stretching a thin atlas edge into vertical streaks.
   c.save();c.beginPath();c.rect(0,baseTop,plane.w+1,plane.h-baseTop);c.clip();
   const tw=460,th=tw*texture.height/texture.width;
   for(let y=baseTop;y<plane.h;y+=th)for(let x=0;x<plane.w+1;x+=tw)c.drawImage(texture,x,y,tw,th);
   c.restore();
  }
  c.drawImage(image,0,(plane.row+plane.cut)*sourceH,image.width,sourceH*(1-plane.cut),0,0,plane.w+1,plane.capH);c.restore();
 }
 c.restore();
}

export function opaqueLunarDepthPixels(pixels){
 for(let i=3;i<pixels.length;i+=4)pixels[i]=pixels[i]>=128?255:0;
 return pixels;
}
export function bakeLunarLowDepth(image){
 const canvas=document.createElement('canvas');canvas.width=image.naturalWidth??image.width;canvas.height=image.naturalHeight??image.height;
 const c=canvas.getContext('2d',{willReadFrequently:true});if(!c)throw new Error('Décor lunaire indisponible');
 c.drawImage(image,0,0);const data=c.getImageData(0,0,canvas.width,canvas.height);opaqueLunarDepthPixels(data.data);c.putImageData(data,0,0);return canvas;
}
