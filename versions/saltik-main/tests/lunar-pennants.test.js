import test from 'node:test';import assert from 'node:assert/strict';
import {drawLunarPennants} from '../src/lunar-pennants.js';
import {inkEnemySaltikGeometry} from '../src/ink-enemy-saltik.js';
import {inkCarrierGeometry} from '../src/ink-carrier.js';
test('ordinary and royal materials never receive lunar pennants',()=>{assert.equal(drawLunarPennants({}, {}, {}),0);assert.equal(drawLunarPennants({}, null, {}),0);});
test('pennants stay attached to the native raising pods and follow the exact camera transform',()=>{
 const image={lunarPennant:{width:256,height:384}},e={x:1000,y:540,hp:100,dir:1,artScale:.9},matrices=[];
 const c={save(){},restore(){},transform(...v){matrices.push(v)},drawImage(){}};
 const draw=(actor,camera)=>{matrices.length=0;drawLunarPennants(c,image,inkEnemySaltikGeometry(actor,0,{camera}));return matrices.map(m=>[...m]);};
 const a=draw(e,100),b=draw(e,140),raised=draw({...e,podRaise:1},100);
 assert.equal(a.length,2);for(let i=0;i<2;i++){assert.ok(Math.abs(a[i][4]-b[i][4]-40)<1e-9);assert.equal(a[i][5],b[i][5]);assert.ok(a[i].every(Number.isFinite));}assert.notDeepEqual(a,raised);
 matrices.length=0;assert.equal(drawLunarPennants(c,image,inkEnemySaltikGeometry(e,0,{view:'front'})),2);assert.ok(matrices.flat().every(Number.isFinite));
 matrices.length=0;assert.equal(drawLunarPennants(c,image,inkCarrierGeometry({...e,knockedOut:true,koElapsed:1},0),true),0);assert.equal(matrices.length,0);
});
