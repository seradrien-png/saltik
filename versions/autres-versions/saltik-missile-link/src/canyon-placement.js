// Original canyon source pixels. The ally lives on this painted rock, never
// on a camera-relative support or a foreground clearance search.
export const CANYON_PARALLAX=.025;
export const ALLY_ROCK_ANCHOR=Object.freeze({x:826,y:343,height:44});
export function canyonProjection(camera,width){
 const tileW=Math.max(width*1.13,1280),sourceHeight=941*.85;
 return {tileW,offset:-(camera*CANYON_PARALLAX)%tileW,scaleX:tileW/1672,scaleY:620/sourceHeight,speed:CANYON_PARALLAX};
}
export function alliedBackgroundPoint(viewport){
 const {x:camera,y=0,w}=viewport,bg=canyonProjection(camera,w),a=ALLY_ROCK_ANCHOR;
 return {x:camera+bg.offset+a.x*bg.scaleX,y:y+a.y*bg.scaleY,height:a.height*bg.scaleY};
}
