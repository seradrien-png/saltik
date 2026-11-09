const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

// Geometry is in world units; DOM hit targets stay in unscaled CSS pixels.
export function padCoversPlayer(pad,bounds,view,canvas){
  const left=canvas.left+(bounds.x-view.camera)*canvas.width/view.width;
  const top=canvas.top+(bounds.y+view.cameraY)*canvas.height/view.height;
  const right=left+bounds.w*canvas.width/view.width,bottom=top+bounds.h*canvas.height/view.height;
  return left<pad.left+pad.width&&right>pad.left&&top<pad.top+pad.height&&bottom>pad.top;
}

export function duelQtePosition(pair,view,canvas,button,safe){
  const x=canvas.left+(pair.x-view.camera)*canvas.width/view.width-button.width/2;
  const y=canvas.top+(pair.top+view.cameraY)*canvas.height/view.height-button.height-12;
  return {left:clamp(x,canvas.left+safe.left,canvas.left+canvas.width-safe.right-button.width),
    top:clamp(y,canvas.top+safe.top,canvas.top+canvas.height-safe.bottom-button.height)};
}
