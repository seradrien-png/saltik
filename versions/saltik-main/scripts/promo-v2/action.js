import {createInkScene,updateInkScene} from '/src/ink-scene.js';
import {createRenderer,loadArt} from '/src/ink-renderer.js';
import {availableBossAssault,availableCarrierShutdown} from '/src/engine.js';
const surface=document.querySelector('#game'),out=document.querySelector('#take'),c=out.getContext('2d',{alpha:false}),renderer=createRenderer(surface),game=createInkScene({intro:true});
const shots=[8.9,20.5,40.4,49,85,86.2];let f=0,index=0,frame=0;
function step(){
 game.viewport={x:renderer.camera,y:-renderer.cameraY,w:renderer.width,h:renderer.height};
 const b=game.boss;
 const input=game.duel?{qte:game.duel.phase==='qte'&&f%8===0}:game.bossBreach?{bossAction:game.bossBreach.phase==='qte'&&f%20===0}:game.carrierShutdown?{}:{right:true,fire:true,fireHeld:true,missile:f%100===0,missileHeld:f%100<35,missileReleased:f%100===35,homing:f%70===0,bossAction:!!availableCarrierShutdown(game)||!!availableBossAssault(game),shift:!!b&&['telegraph','charge'].includes(b.chargePhase)};
 updateInkScene(game,input,1/60);for(const e of game.events)renderer.addEvent(e);game.events.length=0;f++;
 if(f%2===0)renderer.render(game,f*1000/60,'playing');
}
window.ready=(async()=>{await loadArt();renderer.reset();})();
window.nextAction=()=>{
 const target=Math.round(shots[index]*60)+frame*2;
 if(target-f>6){surface.width=640;surface.height=270;while(f<target-4)step();}
 if(surface.width!==3840){surface.width=3840;surface.height=1620;}
 while(f<target)step();renderer.render(game,f*1000/60,'playing');
 const p=game.player,b=game.boss,focus=b?(p.x+b.x)/2:p.x+(index===2?180:index===1?110:130),floor=b?Math.max(p.y,b.y):p.y;
 const zoom=index>=4?1.9:2.05,w=surface.width/zoom,h=surface.height/zoom;
 const px=(focus-renderer.camera)/renderer.width*surface.width,py=(floor+renderer.cameraY)/renderer.height*surface.height;
 const x=Math.max(0,Math.min(surface.width-w,px-w*.48)),y=Math.max(0,Math.min(surface.height-h,py-h*.88));
 c.drawImage(surface,x,y,w,h,0,0,1920,810);
 frame++;if(frame===30){frame=0;index++;}
 return out.toDataURL('image/jpeg',.94).split(',')[1];
};
window.actionEvidence=()=>({frames:f,time:game.time,hp:game.player.hp,status:game.status,shots,restriction:'Only normal inputs through unmodified gameplay simulation and renderer.'});
