import test from 'node:test';
import assert from 'node:assert/strict';
import * as layout from '../src/control-layout.js';
const viewport={camera:1000,cameraY:-200,width:1000,height:600};
const canvas={left:20,top:30,width:500,height:300};

test('pad overlap uses rendered bounds with both camera axes and CSS scaling',()=>{
  assert.equal(typeof layout.padCoversPlayer,'function');
  const bounds={x:1100,y:500,w:150,h:126};
  assert.equal(layout.padCoversPlayer({left:60,top:170,width:100,height:100},bounds,viewport,canvas),true);
  assert.equal(layout.padCoversPlayer({left:60,top:245,width:100,height:100},bounds,viewport,canvas),false);
  assert.equal(layout.padCoversPlayer({left:60,top:170,width:100,height:100},bounds,{...viewport,camera:1200},canvas),false);
});

test('duel button sits over the locked pair and stays fully inside accessible edges',()=>{
  assert.equal(typeof layout.duelQtePosition,'function');
  const pair={x:1400,top:554};
  const button={width:88,height:88},safe={left:12,top:64,right:12,bottom:12};
  assert.deepEqual(layout.duelQtePosition(pair,viewport,canvas,button,safe),{left:176,top:107});
  assert.deepEqual(layout.duelQtePosition({...pair,x:900,top:154},viewport,canvas,button,safe),{left:32,top:94});
  assert.deepEqual(layout.duelQtePosition({...pair,x:2500,top:1374},viewport,canvas,button,safe),{left:420,top:230});
});
