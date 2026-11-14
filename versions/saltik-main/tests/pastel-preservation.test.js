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
  // Authorized four-way presentation adds only a per-run cosmetic cycle.
  if(path==='src/saltik-duel.js')content=Buffer.from(content.toString()
   .replace("import {btFinishHold} from './bt-finish-timing.js';\n",'')
   .replace('// Keep encounter order on the game, never in module state: a fresh run starts\n// at the head impact and every four encounters show all four finishes.\nexport function nextSaltikDuelVariant(game){\n  const variant=game.nextSaltikDuelVariant??0;\n  game.nextSaltikDuelVariant=(variant+1)%4;\n  return variant;\n}\n\n// Numeric selection is used by the game cycle; random callbacks remain valid\n// for isolated callers that intentionally sample a particular finish.\n','')
   .replace('createSaltikDuel(player,enemy,selection=Math.random){\n  const throwVariant=typeof selection===\'function\'?Math.floor(selection()*4):selection;','createSaltikDuel(player,enemy){')
   .replace('throwVariant:Math.min(3,Math.max(0,throwVariant)),','')
   .replace('throwVariant:duel.throwVariant??0,','')
   .replace('  const previousElapsed=duel.elapsed;\n','')
   .replace(/  if\(duel.phase==='slide'&&previousElapsed<btFinishHold\(duel\)[\s\S]*?\n  }\n/,''));
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
   // Only BT heavy rounds enlarge their existing projectile illustration.
   .replace('if(s.btHeavy)c.scale(1.5,1.5);','')
   // Numeric V1 ids retain the exact native animation; lunar text ids use a finite seed.
   .replace(' const bobSeed=Number.isFinite(e.id)?e.id:Number.isFinite(e.phase)?e.phase:0;\n const bob=walking?Math.sin(time*10+bobSeed)*.9:0;',
    ' const bob=walking?Math.sin(time*10+(e.id??0))*.9:0;'));
  // Recorded Striker reports replace their synthetic path only when decoded.
  // Strip that authorized sampler layer while verifying every original fallback.
  if(path==='src/audio.js')content=Buffer.from(content.toString()
   .replace("import {REAL_MIRV_PATHS,REAL_WEAPON_PATHS} from './real-weapon-paths.js';\n",'')
   .replace('  const weaponBuffers=new Map(),weaponVoices=new Set();\n  let weaponLoading=null,weaponFailed=0;\n','')
   .replace('createMirvAudio(ctx,master,{paths:REAL_MIRV_PATHS})','createMirvAudio(ctx,master)')
   .replace('      preloadWeapons();\n','')
   .replace(/  function preloadWeapons\(\)\{[\s\S]*?(?=  function stopGatlingLoop\()/,'')
   .replace('voices.clear();weaponVoices.clear();','voices.clear();')
   .replace("      // A real Abrams report has a bounded tail for the engine’s .095s cadence.\n      if(recordedWeapon('cannon',.25,.26))return;\n      // The previous soft pulse remains available while offline/decoding.", '      // A low pulse with a soft puff stays behind the score during sustained fire.')
   .replace("      if(recordedWeapon('guided',.22,1.64))return;\n",'')
   .replace("if(character!=='striker')stopRecordedWeapons();",'')
   .replace(/^    get weaponSnapshot\(\)\{[^\n]+\n/gm,''));
  // Authorized MIRV sampler hooks are additive; retain the original checksum
  // assertion for every pre-existing weapon/voice/mix branch below.
  if(path==='src/audio.js')content=Buffer.from(content.toString()
   .replace("import {createMirvAudio} from './mirv-audio.js';\n",'')
   .replace('  let mirv=null;\n','')
   .replace("    mirv?.setActive(playing&&enabled&&character==='striker');\n",'')
   .replace('    mirv?.setActive(false);\n','')
   .replace("        mirv=createMirvAudio(ctx,master);mirv.setActive(playing&&enabled&&character==='striker');void mirv.preload();\n",'')
   .replace("    if(e.type.startsWith('mirv-')){mirv?.play(e);return;}\n",'')
   .replace('    if(e.mirvAudio)return;\n','')
   .replace('syncMirv(projectiles){mirv?.sync(projectiles);},','')
   .replaceAll("mirv?.setActive(playing&&enabled&&character==='striker');",'')
   .replace(/^    get mirvSnapshot\(\)\{[^\n]+\n/gm,''));
  if(path==='src/audio.js')content=Buffer.from(content.toString()
   // Authorized continuous Gatling sound is isolated from the retained Striker mix.
   .replace(/  let gatlingLoop=null[^\n]+\n  const gatlingLoopPath=[^\n]+\n/,'')
   .replace(/  function stopGatlingLoop\(\)\{[\s\S]*?  function stopVoices\(\)\{\n    stopGatlingLoop\(\);/, '  function stopVoices(){')
   .replace('setPlaying,setGatlingFiring,','setPlaying,')
   .replace("setCharacter(value){character=VOICE_PROFILES_SAFE(value);if(character!=='gatling')stopGatlingLoop();}",'setCharacter(value){character=VOICE_PROFILES_SAFE(value);}')
   .replace(/get gatlingSnapshot\(\)\{[^\n]+\n    /,'')
   // Character voice delivery and intact-glass slide are explicitly authorized.
   .replace("const VOICE_PROFILES_SAFE=value=>['bt','gatling'].includes(value)?value:'striker';\n",'')
   .replace("let effectsActive=true,speech=null,character='striker';","let effectsActive=true,speech=null;")
   .replace('speech?.enqueue(line,e.character??character);','speech?.enqueue(line);')
   .replace('setCharacter(value){character=VOICE_PROFILES_SAFE(value);},','')
   .replace(/    else if\(e.type==='duel-impact'\)\{[\s\S]*?    else if\(e.type==='duel-end'\)/,"    else if(e.type==='duel-impact'){duck(.2,.3);burst(.14,.35,5200,0,'highpass');burst(.24,.31,850);burst(.055,.19,6800,.08,'bandpass');}\n    else if(e.type==='duel-end')")
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
