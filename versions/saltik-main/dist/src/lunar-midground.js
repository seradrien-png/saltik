// Sparse, fully opaque floating astronomical ruins, physically behind the
// playable citadels. The distant painting and stone face remain unchanged.
export const LUNAR_MIDDLE_SITES=[{x:800,scale:.34},{x:4100,scale:.39},{x:7800,scale:.32},{x:11800,scale:.37},{x:15800,scale:.34}];
export function lunarMiddleBounds(site,{camera,width,height}){const h=height*site.scale;return{x:width*.55+(site.x-camera)*.24,y:height*.52,w:h*1001/819,h};}
export function drawLunarMidground(c,{camera,width,height,layers}){
 if(!layers)return;
 c.save();c.globalAlpha=1;
 for(const site of LUNAR_MIDDLE_SITES){const b=lunarMiddleBounds(site,{camera,width,height});if(b.x+b.w<-20||b.x>width+20)continue;c.drawImage(layers,920,0,1001,819,b.x,b.y,b.w,b.h);}
 c.restore();
}
