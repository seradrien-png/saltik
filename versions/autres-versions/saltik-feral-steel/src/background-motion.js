// Regions traced on the 1672 × 941 canyon.webp, in its original source pixels.
// The falls are the five painted cascades; the other three regions are fern
// crowns and sunlit leaves. None of the masks crosses a building or a rock.
const WATER=[
  {phase:0,points:[[908,354],[944,353],[950,361],[950,374],[958,386],[956,417],[949,438],[935,447],[921,443],[908,418],[909,389],[904,370]]},
  {phase:1.4,points:[[1013,392],[1023,393],[1020,406],[1019,435],[1023,449],[1017,460],[1003,455],[1005,423],[1001,407]]},
  {phase:2.2,points:[[982,509],[1050,510],[1043,529],[1040,557],[1033,579],[1023,601],[1011,615],[990,610],[981,590],[978,562],[980,536]]},
  {phase:3.3,points:[[943,678],[994,679],[998,691],[998,716],[997,731],[992,735],[958,735],[947,726],[941,704]]},
  {phase:4.1,points:[[856,688],[865,689],[867,701],[870,723],[867,742],[855,742],[852,728],[853,708]]}
];
const LEAVES=[
  {phase:.3,points:[[76,139],[87,134],[100,138],[112,150],[113,163],[108,177],[102,187],[91,194],[78,184],[72,168]]},
  {phase:2.5,points:[[170,111],[181,104],[195,111],[200,128],[199,149],[203,166],[195,182],[179,188],[168,177],[165,151]]},
  {phase:4.4,points:[[629,23],[647,19],[666,31],[685,27],[704,36],[724,53],[718,69],[698,77],[682,68],[664,80],[640,76],[620,59]]}
];
const ART_WIDTH=1672,ART_HEIGHT=941;

function maskedPatch(c,points,sx,sy,draw){
  c.save();
  c.beginPath();
  points.forEach(([x,y],i)=>i?c.lineTo(x*sx,y*sy):c.moveTo(x*sx,y*sy));
  c.closePath();
  c.clip();
  draw();
  c.restore();
}

/** Draw local motion from canyon.webp inside the current sky tile transform.
 * `time` is game time in seconds, so a paused game paints an identical frame.
 * The caller first draws the base image crop, then calls this function.
 */
export function drawCanyonMotion(c,image,{x,y,w,h,time,sourceHeight}){
  if(!image?.width||!image?.height||!w||!h||!sourceHeight)return;
  const sx=image.width/ART_WIDTH,sy=image.height/ART_HEIGHT;
  const visible=Math.min(sourceHeight,image.height);
  const now=Number.isFinite(time)?time:0;
  c.save();
  c.translate(x,y);
  c.scale(w/image.width,h/sourceHeight);
  for(const region of WATER){
    const minX=Math.min(...region.points.map(p=>p[0]))*sx;
    const maxX=Math.max(...region.points.map(p=>p[0]))*sx;
    const top=Math.min(...region.points.map(p=>p[1]))*sy;
    const bottom=Math.max(...region.points.map(p=>p[1]))*sy;
    if(bottom>visible)continue;
    maskedPatch(c,region.points,sx,sy,()=>{
      const width=maxX-minX,height=bottom-top,opacity=c.globalAlpha;
      const speed=(64+height/sy*.24)*sy;
      const flow=((now*speed+region.phase*17*sy)%height+height)%height;
      // Advect the painted WATER core downwards. The two wrapped pieces make
      // a continuous loop; the original shoreline and waterfall contour stay fixed.
      const coreX=minX+width*.31,coreWidth=width*.38;
      c.globalAlpha=opacity*.82;
      if(height-flow>1e-6)c.drawImage(image,coreX,top,coreWidth,height-flow,minX,top+flow,width,height-flow);
      if(flow>1e-6)c.drawImage(image,coreX,bottom-flow,coreWidth,flow,minX,top,width,flow);
      // Fast, uneven foam ribbons make the movement legible at phone size.
      // Every ribbon and spray puff is clipped to this same painted-water mask.
      c.lineCap='round';
      for(let n=0;n<7;n++){
        const px=minX+width*(.12+(n+.5)/7*.76);
        const py=top+(now*speed*(1+n*.045)+n*19*sy+region.phase*17*sy)%(height+30*sy)-22*sy;
        const length=(11+n%3*6)*sy,bend=Math.sin(now*1.3+n+region.phase)*1.2*sx;
        c.globalAlpha=opacity*(n%3===0?.27:.57);
        c.strokeStyle=n%3===0?'#377f94':'#eaffff';c.lineWidth=(n%3===0?1.1:1.7)*sx;
        c.beginPath();c.moveTo(px,py);c.bezierCurveTo(px+bend,py+length*.3,px-bend,py+length*.7,px+bend*.4,py+length);c.stroke();
      }
      c.fillStyle='#eafff5';
      for(let n=0;n<3;n++){
        const breath=.5+.5*Math.sin(now*3+n*2+region.phase);
        c.globalAlpha=opacity*(.08+.09*breath);c.beginPath();
        c.ellipse(minX+width*(.3+n*.2),bottom-(3+breath*3)*sy,width*(.15+breath*.07),(3+breath*3)*sy,0,0,Math.PI*2);c.fill();
      }
    });
  }
  for(const region of LEAVES){
    const minX=Math.min(...region.points.map(p=>p[0]))*sx;
    const maxX=Math.max(...region.points.map(p=>p[0]))*sx;
    const top=Math.min(...region.points.map(p=>p[1]))*sy;
    const bottom=Math.max(...region.points.map(p=>p[1]))*sy;
    if(bottom>visible)continue;
    maskedPatch(c,region.points,sx,sy,()=>{
      const sway=1.2*sx*Math.sin(now*.9+region.phase);
      c.drawImage(image,minX,top,maxX-minX,bottom-top,minX+sway,top,maxX-minX,bottom-top);
    });
  }
  c.restore();
}
