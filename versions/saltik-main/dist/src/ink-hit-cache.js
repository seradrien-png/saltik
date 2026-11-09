// Preserve the native brightness flash while filtering each source only once.
// Two current atlases total 3,145,047 pixels. The shared LRU never retains more
// than 3.2M pixels (12.8 MB RGBA), regardless of replacement art or new scenes.
const PIXEL_BUDGET=3200000,cache=new Map();let pixels=0;
export function inkHitImage(image){
 if(!image)return null;
 const found=cache.get(image);if(found){cache.delete(image);cache.set(image,found);return found.canvas;}
 const width=image.naturalWidth??image.width,height=image.naturalHeight??image.height;
 if(!(width>0&&height>0)||width*height>PIXEL_BUDGET)return null;
 try{
  const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):typeof document!=='undefined'?document.createElement('canvas'):null;
  if(!canvas)return null;canvas.width=width;canvas.height=height;
  const c=canvas.getContext('2d');if(!c||!('filter' in c))return null;
  c.filter='brightness(1.4)';c.drawImage(image,0,0);c.filter='none';
  // A detached bitmap makes the filtered pixels immutable, so a destination
  // canvas cannot replay the source canvas's filter commands on every draw.
  const source=typeof canvas.transferToImageBitmap==='function'?canvas.transferToImageBitmap():canvas;
  const item={canvas:source,pixels:width*height};
  while(pixels+item.pixels>PIXEL_BUDGET&&cache.size){const first=cache.keys().next().value,old=cache.get(first);pixels-=old.pixels;old.canvas.close?.();cache.delete(first);}
  cache.set(image,item);pixels+=item.pixels;return source;
 }catch{return null;}
}
