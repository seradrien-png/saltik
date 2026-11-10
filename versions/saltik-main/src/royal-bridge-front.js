// Extract only original bridge pixels through the registered native mask.
// This keeps posts, rope texture and fascia aligned exactly with the back pass.
export function maskBridgePixels(pixels,mask){
 if(pixels.length!==mask.length)throw new Error('Masque de pont incompatible');
 for(let i=3;i<pixels.length;i+=4)if(mask[i]<160)pixels[i]=0;
 return pixels;
}
export function bakeBridgeForeground(image,mask){
 const w=image.naturalWidth??image.width,h=image.naturalHeight??image.height,c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(image,0,0,w,h);const base=ctx.getImageData(0,0,w,h);ctx.clearRect(0,0,w,h);ctx.drawImage(mask,0,0,w,h);const selection=ctx.getImageData(0,0,w,h);
 maskBridgePixels(base.data,selection.data);ctx.putImageData(base,0,0);return c;
}
