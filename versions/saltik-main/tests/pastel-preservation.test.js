import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const preserved=JSON.parse(readFileSync(new URL('../docs/ink-v1-preserved-files.json',import.meta.url)));
const approvedChanges=new Set(['src/input.js','src/enemy-saltik.js','src/ink-campaign-art.js','src/ink-saltik.js','src/ink-scene.js']);
test('V2 preserves V1 native pixels, walkable geometry, native motions and encounter timing',()=>{
 for(const [path,sha] of Object.entries(preserved)){
  if(approvedChanges.has(path))continue;
  let content=readFileSync(new URL('../'+path,import.meta.url));
  // Carrier cues are additive. Only the approved primary-shot lift changes the mix.
  if(path==='src/audio.js')content=Buffer.from(content.toString()
   .replace(/^    else if\(e.type==='carrier-(?:drone-deploy|bay-disabled|disconnected)'\)\{[^\n]+\}\n/gm,'')
   .replace('.0462875*1.15*1.20','.0462875').replace('.06348*1.15*1.20','.06348').replace('.034385*1.15*1.20','.034385')
   // Approved subtitle hooks expose speech timing without changing any mix values.
   .replace('export function createAudio({onSpeech=()=>{}}={}){','export function createAudio(){')
   .replace('speech=createVoiceLines(ctx,speechBus,(duration,id)=>{duck(.13,duration+.12,.30);onSpeech({id,duration});},()=>onSpeech(null));','speech=createVoiceLines(ctx,speechBus,duration=>duck(.13,duration+.12,.30));'));
  const actual=createHash('sha256').update(content).digest('hex');
  assert.equal(actual,sha,path);
 }
});
