import test from 'node:test';
import assert from 'node:assert/strict';
import {drawCanyonMotion} from '../src/background-motion.js';

const ART={width:1672,height:941};

function canvasRecorder(){
  const calls=[],strokes=[];
  let matrix=[1,0,0,1,0,0],path=[],clips=[],stack=[];
  const point=(x,y)=>[matrix[0]*x+matrix[2]*y+matrix[4],matrix[1]*x+matrix[3]*y+matrix[5]];
  const multiply=([a,b,c,d,e,f])=>{
    const [A,B,C,D,E,F]=matrix;
    matrix=[A*a+C*b,B*a+D*b,A*c+C*d,B*c+D*d,A*e+C*f+E,B*e+D*f+F];
  };
  return {calls,strokes,globalAlpha:1,lineWidth:1,
    save(){stack.push({matrix:[...matrix],clips:[...clips],alpha:this.globalAlpha});},
    restore(){const prior=stack.pop();assert.ok(prior,'unbalanced restore');matrix=prior.matrix;clips=prior.clips;this.globalAlpha=prior.alpha;},
    translate(x,y){multiply([1,0,0,1,x,y]);},
    scale(x,y){multiply([x,0,0,y,0,0]);},
    beginPath(){path=[];},
    moveTo(x,y){path.push(point(x,y));},
    lineTo(x,y){path.push(point(x,y));},
    bezierCurveTo(...coords){for(let i=0;i<coords.length;i+=2)path.push(point(coords[i],coords[i+1]));},
    ellipse(){},fill(){assert.ok(clips.length,'spray stays within the painted waterfall');},
    stroke(){assert.ok(clips.length,'foam stays within the painted waterfall');strokes.push({path:[...path],mask:clips.at(-1)});},
    closePath(){},
    clip(){assert.ok(path.length>=3,'motion uses a polygon mask');clips.push(path.map(p=>[...p]));},
    drawImage(image,sx,sy,sw,sh,dx,dy,dw,dh){
      assert.strictEqual(image,ART,'motion samples the original canyon image');
      assert.ok(clips.length,'all moving pixels remain inside a native mask');
      calls.push({source:[sx,sy,sw,sh],dest:[point(dx,dy),point(dx+dw,dy+dh)],mask:clips.at(-1)});
    },
    assertBalanced(){assert.equal(stack.length,0);assert.equal(clips.length,0);}
  };
}

const bounds=points=>{
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
};

test('samples painted water and leaf patches inside local source-space masks under tile scaling and mirroring',()=>{
  const c=canvasRecorder(),opts={x:24,y:13,w:1254,h:620,time:1.75,sourceHeight:ART.height*.85};
  drawCanyonMotion(c,ART,opts);
  assert.ok(c.calls.length>=12&&c.calls.length<=13,'two wrapped water samples per fall plus three foliage patches');
  assert.ok(c.strokes.length>=35,'visible foam ribbons animate inside the actual water');
  const masks=c.calls.map(call=>bounds(call.mask));
  assert.ok(masks.some(([left,top,right,bottom])=>left<24+960&&right>24+685&&top<13+330&&bottom>13+250),
    'upper painted waterfall receives source-positioned motion');
  assert.ok(masks.some(([left,top,right,bottom])=>left<24+755&&right>24+700&&top<13+600&&bottom>13+500),
    'lower waterfall receives source-positioned motion');
  assert.ok(masks.every(([left,top,right,bottom])=>right-left<100&&bottom-top<120),
    'nothing can wobble an entire rock, building, or tile');
  assert.ok(masks.filter(([left,top])=>left>opts.x+690&&top>opts.y+500)
    .every(([, , ,bottom])=>bottom<opts.y+580),
    'the lower waterfall mask stops before the painted shore plants');
  c.assertBalanced();

  const flipped=canvasRecorder();
  flipped.translate(1254,0);flipped.scale(-1,1);
  drawCanyonMotion(flipped,ART,{...opts,x:0,y:0});
  assert.equal(flipped.calls.length,c.calls.length);
  for(let i=0;i<c.calls.length;i++){
    assert.deepEqual(flipped.calls[i].source,c.calls[i].source,'flipped tile samples the same native pixels');
    const ordinary=bounds(c.calls[i].mask),mirror=bounds(flipped.calls[i].mask);
    assert.ok(Math.abs((ordinary[0]-24)+mirror[2]-1254)<1e-6,'clip mirrors with its tile');
  }
  flipped.assertBalanced();
});

test('samples only the visible image crop and stays below the four-tile draw budget',()=>{
  const c=canvasRecorder();
  for(let i=0;i<4;i++)drawCanyonMotion(c,ART,{x:i*1254,y:0,w:1254,h:620,time:2,sourceHeight:ART.height*.85});
  assert.ok(c.calls.length<=100,'motion stays within the canvas draw budget');
  assert.ok(c.calls.every(({source:[,sy,,sh]})=>sy>=0&&sy+sh<=ART.height*.85+1e-6));
  c.assertBalanced();

  const short=canvasRecorder();
  drawCanyonMotion(short,ART,{x:0,y:0,w:1254,h:620,time:2,sourceHeight:470});
  assert.ok(short.calls.length>0&&short.calls.length<c.calls.length/4);
  assert.ok(short.calls.every(({source:[,sy,,sh]})=>sy+sh<=470+1e-6));
  short.assertBalanced();
});

test('motion is a deterministic function of game time, so pause repeats an identical frame',()=>{
  function frame(time){
    const c=canvasRecorder();drawCanyonMotion(c,ART,{x:0,y:0,w:1254,h:620,time,sourceHeight:ART.height*.85});
    c.assertBalanced();return c.calls;
  }
  const before=frame(1.25);
  assert.deepEqual(frame(1.25),before);
  assert.notDeepEqual(frame(1.75),before,'moving water and leaves advance with game time');
});

test('a painted water feature travels visibly downward while the waterfall contour stays fixed',()=>{
  function frame(time){const c=canvasRecorder();drawCanyonMotion(c,ART,{x:0,y:0,w:1672,h:941*.85,time,sourceHeight:941*.85});return c;}
  const a=frame(.1),b=frame(.2);
  assert.deepEqual(a.calls[0].mask,b.calls[0].mask,'waterfall edges stay attached to the background');
  assert.equal(a.calls[0].source[1],b.calls[0].source[1],'track the same painted feature');
  assert.ok(b.calls[0].dest[0][1]-a.calls[0].dest[0][1]>6,'flow advances at least six native pixels per 100ms, rather than wobbling in place');
  assert.ok(a.calls[0].source[2]<30,'only the water core is reused, with no rock or shore pixels');
});
