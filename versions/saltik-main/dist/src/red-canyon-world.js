import {drawRedWastesForeground} from './red-wastes-world.js';
import {drawInkRoutes,drawInkGround,drawInkObstacles} from './ink-world.js';
export {drawRedWastesBackdrop as drawRedCanyonBackdrop} from './red-wastes-world.js';
// The registered routes, native cutouts and physics remain those of Matin Dore.
// Terracotta weathering preserves every original high-resolution outline.
export const RED_CANYON_FILTER='sepia(1) saturate(2.2) hue-rotate(325deg) brightness(.92)';
export function drawRedCanyonWorld(c,images,g,opts){
 const image=images['red-wastes-skull'];
 // These smaller fossils are scenery behind the banks, not false platforms.
 if(image)for(const [x,w]of [[2400,480],[12400,620],[17400,540]]){
  if(x+w<opts.camera||x-w>opts.camera+opts.width)continue;
  const h=w*image.height/image.width;
  c.drawImage(image,x-opts.camera-w/2,g.groundAt(x)+h*.38-h,w,h);
 }
 c.save();c.filter=RED_CANYON_FILTER;
 drawInkRoutes(c,g,opts);drawInkGround(c,g,opts);drawInkObstacles(c,g,opts);c.restore();
}
export {drawRedWastesForeground as drawRedCanyonForeground};
