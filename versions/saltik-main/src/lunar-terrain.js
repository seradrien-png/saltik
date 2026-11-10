export const LUNAR_LENGTH=17800;
const anchors=[[0,580],[1100,540],[2300,601],[3500,556],[4800,592],[6100,516],[7600,570],[9100,536],[10500,584],[11800,505],[13200,562],[14800,590],[16200,530],[17800,550]];
export function lunarBaseGroundAt(x){
 const at=Math.max(0,Math.min(LUNAR_LENGTH,x));
 const i=Math.max(0,Math.min(anchors.length-2,anchors.findIndex((a,i)=>i<anchors.length-1&&at<=anchors[i+1][0]))),a=anchors[i],b=anchors[i+1];
 const t=(at-a[0])/(b[0]-a[0]),smooth=t*t*(3-2*t);
 return a[1]+(b[1]-a[1])*smooth+Math.sin(Math.PI*t)*(22*Math.sin(at/440+i*1.27)+8*Math.sin(at/128));
}
