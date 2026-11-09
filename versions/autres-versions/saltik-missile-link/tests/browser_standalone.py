"""Check the packaged single-file game with real input and no subresources."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
import os

OUT=Path('/workspace/deliverables/saltik-identity-qa/standalone');OUT.mkdir(parents=True,exist_ok=True)
URL=os.environ.get('FERAL_STANDALONE_URL','http://127.0.0.1:4174/Feral-Steel-jouer.html')
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
        args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':844,'height':390})
    errors=[];subresources=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('request',lambda request:subresources.append(request.url) if request.url!=URL and not request.url.startswith('data:') else None)
    page.goto(URL,wait_until='networkidle')
    page.wait_for_function("!document.querySelector('#start').disabled")
    assert 'SALTIK' in page.locator('#start').inner_text()
    assert page.locator('.title-credit').inner_text()=='by limule & regalec'
    page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
    page.wait_for_function('()=>{const m=document.querySelector("#game-music");return !m.paused&&m.currentTime>.1}')
    page.wait_for_function('()=>modules.main.getSnapshot().speech.played.ready===1')
    assert page.evaluate('document.querySelector("#game-music").currentSrc.startsWith("data:audio/ogg;base64,")')
    for key in ['ArrowRight','KeyJ','KeyK','KeyL']:page.keyboard.down(key)
    page.wait_for_function('()=>modules.main.getSnapshot().stats.homingSalvos>0',timeout=12000)
    for key in ['ArrowRight','KeyJ','KeyK','KeyL']:page.keyboard.up(key)
    page.wait_for_function('()=>modules.main.getSnapshot().speech.played["target-lock"]===1')
    voices=page.evaluate('()=>modules.main.getSnapshot().speech')
    weapons=page.evaluate('()=>modules.main.getSnapshot().stats')
    assert weapons['shots']>0 and weapons['mirvs']>0 and weapons['homingSalvos']>0,weapons
    page.keyboard.press('Escape');page.click('#restart-pause');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
    page.keyboard.down('KeyF')
    page.wait_for_function('()=>modules.main.getSnapshot().player.evasion.active')
    evasion=page.evaluate('''()=>{
      const s=modules.main.getSnapshot();
      return {kind:s.player.evasion.kind,
        atlas:modules['tachikoma-pose'].tachikomaGeometry(s.player,s.time).atlas};
    }''')
    assert evasion['atlas']=='saltik-dodge',evasion
    page.keyboard.up('KeyF')
    page.wait_for_function('()=>!modules.main.getSnapshot().player.evasion.active')
    page.keyboard.press('KeyH')
    page.wait_for_function('()=>modules.main.getSnapshot().player.deflect.active')
    manual=page.evaluate('()=>modules.main.getSnapshot().player.deflect')
    assert manual['duration']==.78 and manual['cooldown']==0,manual
    page.wait_for_function('()=>!modules.main.getSnapshot().player.deflect.active')
    page.keyboard.down('ArrowRight')
    page.wait_for_function('()=>modules.main.getSnapshot().player.melee.phase==="impact"',timeout=16000)
    melee=page.evaluate('''()=>{
      const s=modules.main.getSnapshot();
      return {atlas:modules['tachikoma-pose'].tachikomaGeometry(s.player,s.time).atlas,
        hits:s.stats.meleeHits,phase:s.player.melee.phase};
    }''')
    page.keyboard.up('ArrowRight')
    assert melee['atlas']=='saltik-melee' and melee['hits']>0,melee
    page.screenshot(path=str(OUT/'standalone-native-melee.png'))
    # The newly bundled pure duel module and native cinematic must also work
    # without importing modules or requesting any external artwork or sound.
    for key in ['ArrowRight','KeyJ','KeyK','KeyL']:page.keyboard.down(key)
    page.wait_for_function('()=>modules.main.getSnapshot().duel?.phase==="qte"',timeout=45000)
    for key in ['ArrowRight','KeyJ','KeyK','KeyL']:page.keyboard.up(key)
    before_duel=page.evaluate('()=>modules.main.getSnapshot().stats.kills')
    for count in range(1,6):
        page.locator('#qte-button').click()
        page.wait_for_function('count=>modules.main.getSnapshot().duel?.taps===count',arg=count)
        page.wait_for_timeout(100)
    page.wait_for_function('()=>!modules.main.getSnapshot().duel')
    assert page.evaluate('()=>modules.main.getSnapshot().stats.kills')==before_duel+1
    assert page.locator('#controls').is_visible()
    page.wait_for_function('()=>modules.main.getSnapshot().speech.played.goodbye===1')
    assert page.locator('#progress-value,#score-value,#weapon-status').count()==0
    assert not errors,errors
    assert not subresources,subresources
    report={'embeddedVoices':voices,'embeddedMusic':'playing without external request','threeWeapons':weapons,'nativeEvasion':evasion,'manualParry':manual,'nativeMelee':melee,'fivePressDuel':'passed with one kill and restored controls','goodbye':'played once at the throw','pageErrors':errors,'subresources':subresources}
    (OUT/'standalone-results.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report));browser.close()
