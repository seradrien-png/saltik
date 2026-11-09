import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {INK_CARRIER_ASSET,INK_CARRIER_CROP,INK_CARRIER_FRAMES,INK_CARRIER_PARTS,inkCarrierGeometry} from '../src/ink-carrier.js';

// Decode the real RGBA atlas so geometry checks cannot pass while the renderer
// still receives an older silhouette, baked drones, or an obstructed bore.
const bytes=await readFile(new URL(`../dist/assets/${INK_CARRIER_ASSET}.png`,import.meta.url));
const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20),chunks=[];
for(let at=8;at<bytes.length;){const n=bytes.readUInt32BE(at);if(bytes.toString('ascii',at+4,at+8)==='IDAT')chunks.push(bytes.subarray(at+8,at+8+n));at+=n+12;}
const raw=inflateSync(Buffer.concat(chunks)),stride=width*4,pixels=Buffer.alloc(stride*height);
const paeth=(a,b,c)=>{const p=a+b-c,aa=Math.abs(p-a),bb=Math.abs(p-b),cc=Math.abs(p-c);return aa<=bb&&aa<=cc?a:bb<=cc?b:c;};
for(let y=0,at=0;y<height;y++){
 const filter=raw[at++];
 for(let x=0;x<stride;x++){
  const a=x>=4?pixels[y*stride+x-4]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=4?pixels[(y-1)*stride+x-4]:0;
  const predictor=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];
  pixels[y*stride+x]=(raw[at++]+predictor)&255;
 }
}
const rgba=(x,y)=>{const at=(y*width+x)*4;return [...pixels.subarray(at,at+4)];};
const alpha=(x,y)=>rgba(x,y)[3];
const inside=([x,y],points)=>{let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};

test('the approved raised carrier is the exact validated transparent painting with empty pads',async()=>{
 const {createHash}=await import('node:crypto');
 assert.equal(INK_CARRIER_ASSET,'ink-carrier-raised-dr01');assert.deepEqual([width,height,bytes[24],bytes[25]],[1319,1192,8,6]);assert.ok(bytes.length<3_000_000);assert.equal(INK_CARRIER_FRAMES.length,1);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'ee45864e7aa3947a187d8e137d86e8b660f95387d5671d4b547291db9117e31d');
 assert.deepEqual(INK_CARRIER_FRAMES[0].crop,INK_CARRIER_CROP);assert.equal(alpha(0,0),0);
 for(const [x,y,w,h] of [[40,30,530,90],[780,30,480,90]])for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)assert.ok(alpha(xx,yy)<=32,'raised pads keep empty air for independent drones');
 for(const [x,y] of [[310,198],[1025,210]])assert.ok(alpha(x,y)>200,'each anchor touches its real H pad');
});
test('the four actual right-facing Gatling bores register their visible metal rims and dark mouths',()=>{
 assert.deepEqual(INK_CARRIER_PARTS.cannon.muzzle,[642,619]);
 for(const [cx,cy] of [[588,598],[623,597],[587,640],[622,638]]){let dark=0,ring=0;for(let y=cy-14;y<=cy+14;y++)for(let x=cx-11;x<=cx+11;x++){const [r,g,b,a]=rgba(x,y);if(a>200&&r+g+b<140)dark++;if(a>200&&r>140&&g>100&&b<220)ring++;}assert.ok(dark>130&&ring>15,'each real barrel has its own dark bore and metal rim');}
});
test('both low optical disks and the angular face belong to the same movable native head',()=>{
 assert.equal(INK_CARRIER_PARTS.eyes.length,2);
 for(const eye of INK_CARRIER_PARTS.eyes){const [cx,cy]=eye.center,[rx,ry]=eye.radius;let dark=0,gloss=0;
  for(let y=cy-ry;y<=cy+ry;y++)for(let x=cx-rx;x<=cx+rx;x++){const [r,g,b,a]=rgba(x,y),d=((x-cx)/rx)**2+((y-cy)/ry)**2;if(d<.8**2&&a>200&&r+g+b<150)dark++;if(d<1&&a>200&&Math.min(r,g,b)>180)gloss++;}
  assert.ok(dark>2000,'large dark lens');assert.ok(gloss>150,'native glossy highlight');assert.ok(inside(eye.center,INK_CARRIER_PARTS.head.polygon),'KO overlay follows its actual eye');
 }
 for(const [x,y] of [[740,345],[665,95],[900,640]])assert.ok(alpha(x,y)>200,'registered cabin, mast and angular face remain native equipment');
});
test('visible tire ink belongs to one native assembly and the far fourth contact stays occluded',()=>{
 const g=inkCarrierGeometry({x:500,y:620,knockedOut:true,koElapsed:.8});assert.equal(g.legs.length,4);assert.equal(g.legs.filter(l=>l.occluded).length,1);
 for(const leg of g.legs.filter(l=>!l.occluded)){assert.ok(alpha(...leg.foot)>200,`${leg.id} plants a real tire pixel`);assert.ok(inside(leg.foot,leg.wheelPolygon));}
 for(let y=1060;y<1174;y++)for(let x=0;x<1309;x++)if(alpha(x,y)>32){const legs=g.legs.filter(l=>!l.occluded&&inside([x,y],l.wheelPolygon));assert.equal(legs.length,1,`tire ink ${x}/${y} cannot duplicate or disappear`);}
});
test('KO retains the intact approved platforms, face and wheels without destruction frames',()=>{
 for(const flags of [{knockedOut:true,koElapsed:.8},{shuttingDown:true},{neutralized:true}]){
  const g=inkCarrierGeometry({x:500,y:620,...flags});assert.equal(g.frameIndex,0);assert.equal(g.frame.id,'intact');assert.deepEqual(g.smokeEmitters,[]);assert.ok(g.legs.every(l=>!l.broken));
  for(const [x,y] of [[310,198],[1025,210],[812,751],[665,95]])assert.ok(alpha(x,y)>200);
 }
});
test('both approved claws contain their own attached joints and dark fingers',()=>{
 for(const hand of INK_CARRIER_PARTS.hands){assert.ok(alpha(...hand.pivot)>200);assert.ok(inside(hand.pivot,hand.polygon));assert.ok(alpha(...hand.tip)>100);}
});
