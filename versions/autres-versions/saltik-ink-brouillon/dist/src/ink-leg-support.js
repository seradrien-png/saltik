const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

// A wheel can step a few units forward on its own articulated strut when its
// vertical suspension ray meets a riser. Only original leg pixels move.
export function plantInkWheel(native,{k,cos,sin,floor,maxOffset=180,orientation=1}){
  const candidates=[0,...Array.from({length:7},(_,i)=>[-(i+1)/k,(i+1)/k]).flat()];
  let best={offset:0,roll:0,grounded:false,error:Infinity};
  for(const roll of candidates){
    const x=native.x+roll*k*orientation*cos,y=native.y+roll*k*orientation*sin;let offset=0;
    for(let i=0;i<10;i++){
      const support=floor(x-offset*k*sin);if(!Number.isFinite(support))break;
      offset=clamp((support-y)/(cos*k),-maxOffset,maxOffset);
    }
    const contact={x:x-offset*k*sin,y:y+offset*k*cos},support=floor(contact.x);
    const error=Number.isFinite(support)?Math.abs(contact.y-support):Infinity;
    if(error<best.error)best={offset,roll,grounded:error<.05,error};
    if(best.grounded)break;
  }
  return best;
}
