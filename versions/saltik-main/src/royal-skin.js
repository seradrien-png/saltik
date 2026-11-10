// Registered material maps add embroidery while native ink/alpha retain the
// original limbs, weapon mouths and animation seams in every player pose.
export function applyRoyalPixels(base,paint){
 if(base.length!==paint.length||base.length%4)throw new Error('Peinture royale incompatible');
 for(let i=0;i<base.length;i+=4){
  if(!base[i+3])continue;
  const light=base[i]*.2126+base[i+1]*.7152+base[i+2]*.0722;
  if(light<42)continue;
  const coverage=paint[i+3]/255;
  if(coverage<.5){base[i]=Math.min(255,light*1.1);base[i+1]=light*.67;base[i+2]=light*.12;continue;}
  for(let j=0;j<3;j++)base[i+j]=paint[i+j]*.92+base[i+j]*.08;
 }
 return base;
}
export function bakeRoyalArt(original,paint){
 const w=original.naturalWidth??original.width,h=original.naturalHeight??original.height;
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const c=canvas.getContext('2d',{willReadFrequently:true});
 if(!c)throw new Error('Texture royale indisponible');
 c.drawImage(original,0,0,w,h);const base=c.getImageData(0,0,w,h);c.clearRect(0,0,w,h);c.drawImage(paint,0,0,w,h);const wash=c.getImageData(0,0,w,h);
 applyRoyalPixels(base.data,wash.data);c.putImageData(base,0,0);return canvas;
}
export function royalPlayerImages(images,level){return level===2?{...images,'ink-saltik':images['lunar-saltik']??images['ink-saltik'],'ink-turn':images['lunar-turn']??images['ink-turn']}:level===3?{...images,'ink-saltik':images['royal-saltik']??images['ink-saltik'],'ink-turn':images['royal-turn']??images['ink-turn']}:images;}
