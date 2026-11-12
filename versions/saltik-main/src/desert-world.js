import {DESERT_STRUCTURES,DESERT_ROOMS,desertStructurePlacement,desertVistaBox,projectDesertPlayer} from './desert-layout.js';
import {drawInkSaltik} from './ink-saltik.js';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export const desertTransitionCurtain=t=>t<=0||t>=.8?0:Math.sin(Math.PI*t/.8);
export function desertVisualStage(g){const d=g.desert;return d.phase==='interior'||d.phase==='entering'&&d.phaseElapsed>=.4||d.phase==='exiting'&&d.phaseElapsed<.4?'interior':'exterior';}
export function drawDesertCurtain(c,width,height,amount){if(amount<=0)return;const h=height*clamp(amount)/2;c.fillStyle='#11100e';c.fillRect(0,0,width,h);c.fillRect(0,height-h,width,h);}
export function drawDesertVista(c,image,{width,height}){
 c.fillStyle='#10110f';c.fillRect(0,0,width,height);if(!image)return;
 const b=desertVistaBox(width,height);
 // A cinemascope frame preserves the complete reference and its proportions
 // on every display; no stretched sky, hidden gate or cropped approach track.
 c.drawImage(image,b.x,b.y,b.w,b.h);
}
function prop(c,atlas,index,x,foot,width,flip=false){if(!atlas)return;const sx=index%2*768,sy=Math.floor(index/2)*512,h=width*512/768;c.save();c.translate(x,foot);if(flip)c.scale(-1,1);c.drawImage(atlas,sx,sy,768,512,-width/2,-h,width,h);c.restore();}
export function drawDesertExterior(c,images,g,{width,height,time=0,victoryAge=null}){
 drawDesertVista(c,images['desert-red-vista'],{width,height});
 const exit=g.desert.phase==='exiting',x=exit?6200:g.player.x,p=projectDesertPlayer(x,width,height),actor={...g.player,x:p.x,y:p.y,supportY:p.y,supportPose:null,artScale:p.scale,dir:exit?-1:g.player.dir,turn:exit?null:g.player.turn,platformId:null,rampId:null,onGround:true,vx:g.player.vx*.12,motionDistance:(g.player.motionDistance??0)*p.scale};
 c.save();c.fillStyle='#5f261c';c.beginPath();c.ellipse(p.x,p.y+1,41*p.scale,3.5*p.scale,0,0,Math.PI*2);c.fill();c.restore();
 drawInkSaltik(c,images['ink-saltik'],actor,{time,victoryAge,turnImage:images['ink-turn']});
 const b=desertVistaBox(width,height);
 prop(c,images['desert-structures'],2,b.x+b.w*.39,b.y+b.h+25,b.w*.19);
 prop(c,images['desert-structures'],2,b.x+b.w*.97,b.y+b.h+25,b.w*.19,true);
 // Wind-driven opaque grains sit on the near sand, not a transparent world layer.
 c.fillStyle='#e29559';for(let i=0;i<24;i++){const xx=b.x+((i*73+time*(8+i%4))%b.w),yy=b.y+b.h*(.83+(i%6)*.026);c.fillRect(xx,yy,2+i%3,.7);}
}
export function drawDesertInteriorBackdrop(c,image,{camera,width,height,cameraY=0}){
 c.fillStyle='#231710';c.fillRect(0,0,width,height);if(!image)return;
 const iw=image.naturalWidth??image.width,ih=image.naturalHeight??image.height,w=Math.max(2600,width*1.9),h=w*ih/iw,x=-camera*.18,y=620-h*.842+cameraY;
 c.drawImage(image,x,y,w,h);
 // Near structural ribs make the enormous hall read as an enclosed building.
 c.fillStyle='#211710';for(const at of [110,2450,5010,7460]){const xx=at-camera*.30;if(xx>width+80||xx<-80)continue;c.fillRect(xx,0,17,Math.min(height,510+cameraY));c.fillStyle='#4b2d1d';c.fillRect(xx+4,0,5,Math.min(height,510+cameraY));c.fillStyle='#211710';}
}
export function drawDesertWorld(c,g,{camera,width,height,atlas,texture,vista}){
 const floor=g.groundAt,left=camera-80,right=camera+width+80;
 for(const s of DESERT_STRUCTURES){if(s.right<left||s.left>right)continue;const p=desertStructurePlacement(s);c.drawImage(atlas,...s.crop,s.left-camera,p.y,s.right-s.left,512*p.k);}
 // The physical ground and the illustrated foundation share this exact outline.
 c.save();c.beginPath();c.moveTo(left-camera,height+400);for(let x=left;x<right;x+=18)c.lineTo(x-camera,floor(x));c.lineTo(right-camera,floor(right));c.lineTo(right-camera,height+400);c.closePath();c.clip();
 c.fillStyle='#6f3522';c.fillRect(-80,400,width+160,height+400);
 if(texture){const iw=texture.naturalWidth??texture.width,ih=texture.naturalHeight??texture.height;for(let x=Math.floor(left/420)*420;x<right;x+=420)for(let y=550;y<height+250;y+=160)c.drawImage(texture,iw*.13,ih*.84,iw*.52,ih*.16,x-camera,y,420,160);}
 c.restore();
 c.strokeStyle='#211711';c.lineWidth=5;c.beginPath();for(let x=left;x<right;x+=10){if(x===left)c.moveTo(x-camera,floor(x));else c.lineTo(x-camera,floor(x));}c.stroke();
 c.strokeStyle='#e1a263';c.lineWidth=2;c.beginPath();for(let x=left;x<right;x+=10){if(x===left)c.moveTo(x-camera,floor(x)-2);else c.lineTo(x-camera,floor(x)-2);}c.stroke();
 for(let x=Math.ceil(left/42)*42;x<right;x+=42){c.fillStyle='#2d2118';c.fillRect(x-camera,floor(x)+8,4,4);c.fillStyle='#cf8952';c.fillRect(x-camera,floor(x)+8,2,1);}
 const room=DESERT_ROOMS[g.desert.roomsCleared];if(room)drawAirlock(c,texture,room.gate-camera,floor(room.gate),width);
 drawAirlock(c,texture,7420-camera,floor(7420),width,g.desert.roomsCleared===3,vista);

}
function drawAirlock(c,texture,x,y,width,open=false,vista=null){
 if(!texture||x<-260||x>width+60)return;
 const iw=texture.naturalWidth??texture.width,ih=texture.naturalHeight??texture.height;
 c.save();c.beginPath();c.ellipse(x+120,y-150,120,150,0,0,Math.PI*2);c.rect(x+18,y-38,204,38);c.clip();c.drawImage(texture,iw*.82,ih*.15,iw*.17,ih*.64,x,y-300,240,300);c.restore();
 c.strokeStyle='#251a14';c.lineWidth=5;c.beginPath();c.ellipse(x+120,y-150,119,148,0,0,Math.PI*2);c.stroke();c.strokeStyle='#b46d39';c.lineWidth=2;c.beginPath();c.ellipse(x+120,y-150,114,143,0,0,Math.PI*2);c.stroke();
 if(open){c.save();c.beginPath();c.ellipse(x+120,y-144,86,121,0,0,Math.PI*2);c.clip();c.fillStyle='#f1ae70';c.fillRect(x+30,y-270,180,250);if(vista){const w=vista.naturalWidth??vista.width,h=vista.naturalHeight??vista.height;c.drawImage(vista,w*.32,0,w*.24,h,x+30,y-270,180,250);}c.restore();c.strokeStyle='#efad64';c.lineWidth=3;c.beginPath();c.ellipse(x+120,y-144,87,122,0,0,Math.PI*2);c.stroke();}
 c.fillStyle=open?'#badca0':'#f2bd63';c.fillRect(x+203,y-177,3,6);
}
export function drawDesertForeground(c,g,{camera,width,atlas}){
 const floor=g.groundAt;
 for(const [i,x]of [650,2780,5220,7050].entries()){if(x<camera-280||x>camera+width+280)continue;prop(c,atlas,i%2?2:3,x-camera,floor(x)+52,i%2?220:200,i===2);}
 // The illustrated dais' front fascia occludes feet at its deck edge, while
 // the actors remain in front of the back-side railing.
 for(const s of DESERT_STRUCTURES.filter(s=>s.walkable)){const p=desertStructurePlacement(s);const top=p.point(s.cap[0])[1];if(s.right<camera||s.left>camera+width)continue;c.save();c.beginPath();c.rect(s.left-camera,top+2,s.right-s.left,24);c.clip();c.drawImage(atlas,...s.crop,s.left-camera,p.y,s.right-s.left,512*p.k);c.restore();}
}
