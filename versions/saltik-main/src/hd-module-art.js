// Individually redrawn paintings retain the authored, logical crop coordinates.
// A larger source image changes texture detail without changing world geometry.
export const HD_MODULE_ASSETS=Object.freeze([
 'ink-bridge','ink-observatory','ink-wreck','ink-gorge','ink-checkpoint','ink-breach',
 'lunar-aqueduct','lunar-observatory','lunar-bastion','lunar-gate',
 'royal-root','royal-wheel','royal-spool','royal-tree','royal-arch','royal-bridge','desert-dais'
].map(name=>`hd-${name}`));
export function hdModuleImage(art,name){return art?.hd?.[`hd-${name}`]??null;}
export function drawHDModule(c,image,x,y,w,h){
 c.drawImage(image,0,0,image.naturalWidth??image.width,image.naturalHeight??image.height,x,y,w,h);
}
