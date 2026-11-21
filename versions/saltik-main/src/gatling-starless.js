// Image-generated plain metal patches replace only the white military markings.
// Original atlas cells and all articulated outlines remain pixel-registered.
export const GATLING_DESERT_STAR_PATCHES=Object.freeze({
 atlas:Object.freeze([[885,698,70,78],[670,1012,80,80],[830,1012,82,80],[1154,1007,80,80]]),
 turn:Object.freeze([[290,87,70,79],[86,455,77,77],[270,451,82,81],[619,455,70,79],
  [836,453,77,77],[1263,453,82,77],[1842,88,78,80],[1480,451,80,79],[1825,451,97,82],[2024,451,80,79]])
});
export const STARLESS_GATLING_ASSETS=Object.freeze(['gatling-desert-starless-atlas','gatling-desert-starless-turn']);
export function bakeStarlessDesertGatling(original,material,rectangles){
 if(!original||!material)return original;
 const canvas=document.createElement('canvas');canvas.width=original.naturalWidth??original.width;canvas.height=original.naturalHeight??original.height;
 const c=canvas.getContext('2d');c.drawImage(original,0,0,canvas.width,canvas.height);
 c.save();c.beginPath();for(const box of rectangles)c.rect(...box);c.clip();
 c.drawImage(material,0,0,canvas.width,canvas.height);c.restore();return canvas;
}
export function prepareStarlessDesertGatling(images){
 if(images.starlessDesertGatlingReady)return;
 if(!images['modern-gatling-atlas']||!images[STARLESS_GATLING_ASSETS[0]]||!images['modern-gatling-turn-desert']||!images[STARLESS_GATLING_ASSETS[1]])return;
 images['modern-gatling-atlas']=bakeStarlessDesertGatling(images['modern-gatling-atlas'],images[STARLESS_GATLING_ASSETS[0]],GATLING_DESERT_STAR_PATCHES.atlas);
 images['modern-gatling-turn-desert']=bakeStarlessDesertGatling(images['modern-gatling-turn-desert'],images[STARLESS_GATLING_ASSETS[1]],GATLING_DESERT_STAR_PATCHES.turn);
 images.starlessDesertGatlingReady=true;
}
