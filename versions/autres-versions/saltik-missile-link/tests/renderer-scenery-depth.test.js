import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderer} from '../src/renderer.js';
import {createGame} from '../src/engine.js';

test('the painted canyon has no large translucent primitive silhouettes floating in front of it',()=>{
  const prior=globalThis.window;globalThis.window={devicePixelRatio:1,addEventListener(){}};
  const violations=[],gradient={addColorStop(){}},path=[],stack=[];
  const c=new Proxy({globalAlpha:1,lineWidth:1,
    save(){stack.push({alpha:this.globalAlpha,lineWidth:this.lineWidth});},
    restore(){const s=stack.pop();this.globalAlpha=s.alpha;this.lineWidth=s.lineWidth;},
    beginPath(){path.length=0;},moveTo(x,y){path.push([x,y]);},lineTo(x,y){path.push([x,y]);},
    bezierCurveTo(...v){for(let i=0;i<v.length;i+=2)path.push([v[i],v[i+1]]);},
    quadraticCurveTo(...v){for(let i=0;i<v.length;i+=2)path.push([v[i],v[i+1]]);},
    fill(){
      if(this.globalAlpha>=.8||path.length<3)return;
      const xs=path.map(p=>p[0]),ys=path.map(p=>p[1]);
      if(Math.max(...xs)-Math.min(...xs)>100&&Math.max(...ys)-Math.min(...ys)>100)violations.push('polygon');
    },
    stroke(){if(this.globalAlpha<.8&&this.lineWidth>=9)violations.push('trunk');},
    createLinearGradient(){return gradient;},createRadialGradient(){return gradient;},
  },{get:(target,key)=>key in target?target[key]:()=>{}});
  const canvas={width:1280,height:720,clientWidth:1280,getContext:()=>c,getBoundingClientRect:()=>({width:1280,height:720})};
  try{
    createRenderer(canvas).render(createGame(),1000,'title');
    assert.deepEqual(violations,[]);
  }finally{if(prior===undefined)delete globalThis.window;else globalThis.window=prior;}
});
