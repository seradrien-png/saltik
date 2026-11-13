// Only the visible embroidered arc is refracted. The original outer silhouette
// and all surrounding sky/mountains stay in the native reference painting.
const OUTLINE=[[934,242],[980,202],[1043,179],[1110,167],[1179,170],[1244,188],[1305,220],[1355,260],[1396,311],[1425,364],[1444,423],[1375,451],[1358,407],[1334,366],[1304,333],[1267,307],[1226,291],[1181,281],[1136,281],[1092,289],[1053,306],[1017,331],[996,301],[978,274]];
export function rainbowBands(time=0){const out=[];for(let y=166;y<452;y+=4)out.push({y,h:Math.min(4,452-y),shift:Math.sin(time*1.7-y*.045)*2.4});return out;}
export function drawRoyalRainbow(c,image,{x=0,y=0,scale=1,scaleY=scale,time=0}={}){
 if(!image)return;c.save();c.translate(x,y);c.scale(scale,scaleY);c.beginPath();c.moveTo(...OUTLINE[0]);for(const p of OUTLINE.slice(1))c.lineTo(...p);c.closePath();c.clip();
 for(const b of rainbowBands(time))c.drawImage(image,930,b.y+b.shift,518,b.h,930,b.y,518,b.h);
 // Golden highlights drift around the textile curve rather than floating text.
 c.strokeStyle='#fff1a0';c.lineCap='round';c.lineWidth=1.3;
 for(let i=0;i<14;i++){const a=Math.PI+((time*.1+i/14)%1)*Math.PI,r=218+(i%3)*16,cx=1164+Math.cos(a)*r,cy=447+Math.sin(a)*r;c.globalAlpha=.16+.24*Math.sin(time+i)**2;c.beginPath();c.moveTo(cx-2,cy+2);c.lineTo(cx+2,cy-2);c.stroke();}
 c.restore();
}
