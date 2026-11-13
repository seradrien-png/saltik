// Alpha-registered six poses of the same native olive/orange BT.
export const BT_FINISH_FRAMES=[[48, 21, 445, 469], [547, 54, 442, 415], [1053, 54, 443, 408], [43, 538, 433, 462], [536, 530, 448, 477], [1033, 536, 470, 452]];
export function prepareBTFinishFrames(images){
 const source=images['bt-finish-frames'];if(!source)return;
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(source,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height);
 for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=128?255:0;
 c.putImageData(pixels,0,0);images['bt-finish-frames']=canvas;
}
