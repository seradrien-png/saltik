import {royalGroundAt} from './royal-layout.js';
export const ROYAL_PROPS=[
 {x:590,cell:0,w:250},{x:1980,cell:1,w:260},{x:4360,cell:2,w:310},
 {x:6100,cell:3,w:330},{x:8740,cell:0,w:290},{x:11150,cell:2,w:280},
 {x:13830,cell:1,w:270},{x:15800,cell:3,w:340},{x:17360,cell:0,w:240}
];
export function royalPropBounds(p){const h=p.cell===3?royalGroundAt(p.x)+220:p.w*512/768;return{x:p.x-p.w*.5,y:royalGroundAt(p.x)+34-h,w:p.w,h};}
export function drawRoyalProps(c,image,{camera,width}){
 if(!image)return;c.save();c.globalAlpha=1;
 for(const p of ROYAL_PROPS){const b=royalPropBounds(p);if(b.x+b.w<camera||b.x>camera+width)continue;c.drawImage(image,(p.cell%2)*768,Math.floor(p.cell/2)*512,768,512,b.x-camera,b.y,b.w,b.h);}
 c.restore();
}
