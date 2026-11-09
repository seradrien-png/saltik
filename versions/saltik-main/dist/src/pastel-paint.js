// Generated material maps supply color only. The original native pixels own
// luminance, silhouette, alpha and every calibrated animation/weapon anchor.
export function applyPastelPixels(base,paint,{strength=.9,gain=1.08}={}){
 if(base.length!==paint.length||base.length%4)throw new Error('Calques de peinture incompatibles');
 const mix=Math.max(0,Math.min(1,strength));
 for(let i=0;i<base.length;i+=4){
  if(!base[i+3])continue;
  const r=paint[i],g=paint[i+1],b=paint[i+2];
  // Ignore neutral dark marks accidentally added to a material map. Only
  // the native illustration draws ink, avoiding doubled or shifted outlines.
  const neutralInk=Math.max(r,g,b)<105&&Math.max(r,g,b)-Math.min(r,g,b)<28;
  const amount=neutralInk?0:paint[i+3]/255*mix;
  const light=Math.min(255,(base[i]*.2126+base[i+1]*.7152+base[i+2]*.0722)*gain);
  base[i]=light*(1-amount+amount*r/255);
  base[i+1]=light*(1-amount+amount*g/255);
  base[i+2]=light*(1-amount+amount*b/255);
  // Alpha is intentionally never assigned: even antialiased edges retain
  // the exact original coverage, including holes between arms and wheels.
 }
 return base;
}

export function bakePastelArt(original,paint,options={}){
 const w=original.naturalWidth??original.width,h=original.naturalHeight??original.height;
 if(!(w>0&&h>0))throw new Error('Image native vide');
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const c=canvas.getContext('2d',{willReadFrequently:true});
 if(!c)throw new Error('Peinture Canvas indisponible');
 c.drawImage(original,0,0,w,h);const source=c.getImageData(0,0,w,h);
 c.clearRect(0,0,w,h);c.drawImage(paint,0,0,w,h);const wash=c.getImageData(0,0,w,h);
 applyPastelPixels(source.data,wash.data,options);c.putImageData(source,0,0);
 if(!(options.outline>0))return canvas;
 // Cache the strengthened exterior silhouette once; native detail and the
 // other enemy atlases are never thickened during drawing.
 const outlined=document.createElement('canvas');outlined.width=w;outlined.height=h;
 const line=outlined.getContext('2d');if(!line)return canvas;
 const radius=options.outline;
 for(let i=0;i<8;i++){const a=i*Math.PI/4;line.drawImage(canvas,Math.cos(a)*radius,Math.sin(a)*radius);}
 line.globalCompositeOperation='source-in';line.fillStyle='#151713';line.fillRect(0,0,w,h);
 line.globalCompositeOperation='source-over';line.drawImage(canvas,0,0);
 return outlined;
}

export async function mapWithConcurrency(values,limit,work){
 const result=new Array(values.length);let cursor=0;
 await Promise.all(Array.from({length:Math.min(values.length,Math.max(1,limit))},async()=>{
  while(cursor<values.length){const i=cursor++;result[i]=await work(values[i],i);}
 }));
 return result;
}
