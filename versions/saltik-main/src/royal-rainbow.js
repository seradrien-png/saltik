// Geometry is immutable: only light/color moves inside the native embroidery.
const OUTLINE=[[934,242],[980,202],[1043,179],[1110,167],[1179,170],[1244,188],[1305,220],[1355,260],[1396,311],[1425,364],[1444,423],[1375,451],[1358,407],[1334,366],[1304,333],[1267,307],[1226,291],[1181,281],[1136,281],[1092,289],[1053,306],[1017,331],[996,301],[978,274]];
export const rainbowFlow=(time=0)=>({offset:((time*18)%260+260)%260,period:260});
const colorMasks=new WeakMap();
function rainbowColorPath(image){
 if(typeof document==='undefined'||typeof Path2D==='undefined'||!image.width)return null;
 if(colorMasks.has(image))return colorMasks.get(image);
 const canvas=document.createElement('canvas');canvas.width=518;canvas.height=286;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,930,166,518,286,0,0,518,286);
 const data=c.getImageData(0,0,518,286).data,path=new Path2D();
 // Keep gold seams, pale embroidery and all native outline pixels unchanged.
 const colored=(x,y)=>{const i=(y*518+x)*4,r=data[i],g=data[i+1],b=data[i+2];return Math.max(r,g,b)-Math.min(r,g,b)>35&&(b>r*.75||g>r*.75)&&!(r>150&&g>80&&b<g*.8);};
 for(let y=0;y<286;y+=2){let start=-1;for(let x=0;x<=518;x+=2){const color=x<518&&colored(x,y)&&colored(x+1,y)&&colored(x,y+1)&&colored(x+1,y+1);
  if(color&&start<0)start=x;if(!color&&start>=0){path.rect(930+start,166+y,x-start,2);start=-1;}
 }}colorMasks.set(image,path);return path;
}
export function drawRoyalRainbow(c,image,{x=0,y=0,scale=1,scaleY=scale,time=0}={}){
 if(!image)return;c.save();c.translate(x,y);c.scale(scale,scaleY);c.beginPath();c.moveTo(...OUTLINE[0]);for(const p of OUTLINE.slice(1))c.lineTo(...p);c.closePath();c.clip();
 // Exact 1:1 copy, never displace or resize source bands. Also restores the
 // native arc as an opaque occluder for anything in the farther scenic layer.
 c.drawImage(image,930,166,518,286,930,166,518,286);
 c.save();const mask=rainbowColorPath(image);if(mask)c.clip(mask);
 const flow=rainbowFlow(time),gradient=c.createLinearGradient(930-flow.offset,0,930-flow.offset+flow.period*3,0);
 for(let i=0;i<=18;i++)gradient.addColorStop(i/18,`hsl(${i*60%360} 85% 62%)`);
 c.globalCompositeOperation='soft-light';c.globalAlpha=.34;c.fillStyle=gradient;c.fillRect(930,166,518,286);c.restore();
 c.strokeStyle='#fff1a0';c.lineCap='round';c.lineWidth=1.1;
 for(let i=0;i<14;i++){const a=Math.PI+((time*.06+i/14)%1)*Math.PI,r=218+(i%3)*16,cx=1164+Math.cos(a)*r,cy=447+Math.sin(a)*r;c.globalAlpha=.12+.18*Math.sin(time*.7+i)**2;c.beginPath();c.moveTo(cx-1.5,cy+1.5);c.lineTo(cx+1.5,cy-1.5);c.stroke();}
 c.restore();
}
