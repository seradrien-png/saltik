// Approval-only visual placement. Production hitboxes/animation are not changed.
let image=null;
export async function loadProposal(){image=new Image();image.src='/scripts/carrier-preview/assets/proposed-carrier.png';await image.decode();}
export const HEIGHT=140,ANCHOR=[700,1158],BAYS=[[310,220],[1025,225]],MUZZLE=[625,625];
export function drawProposal(c,e,{camera=0,scale=1}={}){
 if(!image)return;
 const k=HEIGHT/(1174-21)*scale,x=e.x-camera,y=e.y,dir=e.dir===-1?-1:1;
 c.save();c.translate(x,y);c.scale(k*dir,k);c.translate(-ANCHOR[0],-ANCHOR[1]);c.drawImage(image,0,0);c.restore();
 return {x,y,k,bays:BAYS.map(([a,b])=>({x:x+(a-ANCHOR[0])*k*dir,y:y+(b-ANCHOR[1])*k})),muzzle:{x:x+(MUZZLE[0]-ANCHOR[0])*k*dir,y:y+(MUZZLE[1]-ANCHOR[1])*k}};
}
