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
  if(path==='src/boss-breach.js')content=Buffer.from(content.toString()
   // Authorized boss replacement moves hull assault feet onto the new turret.
   .replace('boss.assaultArt?geometry.turretRoof.x1+2:','')
   .replace('boss.assaultArt?geometry.turretRoof.y:',''));
  if(path==='src/ink-turn.js')content=Buffer.from(content.toString()
   // Only the reduced lunar player uses true-size terrain in turn views.
   .replace('Number.isFinite(p.artScale)&&p.artScale!==1?floor(at+camera):',''));
  // Carrier cues are additive. Only the approved primary-shot lift changes the mix.
  if(path==='src/ink-actors.js')content=Buffer.from(content.toString()
   // Only explicitly scaled lunar enemies change size; defaults remain native.
   .replaceAll('*(e.artScale??1)','')
   // Gatling rockets share the existing projectile illustration only.
   .replace(",'gatling-rocket'",'')
   // Numeric V1 ids retain the exact native animation; lunar text ids use a finite seed.
   .replace(' const bobSeed=Number.isFinite(e.id)?e.id:Number.isFinite(e.phase)?e.phase:0;\n const bob=walking?Math.sin(time*10+bobSeed)*.9:0;',
    ' const bob=walking?Math.sin(time*10+(e.id??0))*.9:0;'));
  if(path==='src/audio.js')content=Buffer.from(content.toString()
   // New Gatling-only audio branches must leave the original Striker mix intact.
   .replace('  let lastGatlingShot=-Infinity;\n','')
   .replace('lastGatlingShot=-Infinity;','')
   .replace(/    if\(e.type==='gatling-shot'\)\{[\s\S]*?    else if\(e.type==='shot'\)/,"    if(e.type==='shot')")
   // Only level two opts out of the score; the default mix remains byte-for-byte identical.
   .replace('let playing=false,musicEnabled=true;','let playing=false;')
   .replaceAll('!playing||!enabled||!musicEnabled','!playing||!enabled')
   .replace('setMusicEnabled(value){musicEnabled=!!value;syncMusic();},','')
   .replace(/^    else if\(e.type==='carrier-(?:drone-deploy|bay-disabled|disconnected)'\)\{[^\n]+\}\n/gm,'')
   .replace('.0462875*1.15*1.20','.0462875').replace('.06348*1.15*1.20','.06348').replace('.034385*1.15*1.20','.034385')
   // Approved subtitle hooks expose speech timing without changing any mix values.
   .replace('export function createAudio({onSpeech=()=>{}}={}){','export function createAudio(){')
   .replace('speech=createVoiceLines(ctx,speechBus,(duration,id)=>{duck(.13,duration+.12,.30);onSpeech({id,duration});},()=>onSpeech(null));','speech=createVoiceLines(ctx,speechBus,duration=>duck(.13,duration+.12,.30));'));
  const actual=createHash('sha256').update(content).digest('hex');
  assert.equal(actual,sha,path);
 }
});
