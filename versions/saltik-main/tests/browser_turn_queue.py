"""Exercise released turn taps and actual rear-roof composition through controls."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json

OUT=Path('/tmp/feral-wreck-qa');OUT.mkdir(exist_ok=True)
def snapshot(page):return page.evaluate('()=>window.readGameSnapshot()')
def until(page,condition,timeout=15000):
    page.wait_for_function('()=>{const s=window.readGameSnapshot();return '+condition+'}',timeout=timeout)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':900});errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:4173',wait_until='networkidle');page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
    page.evaluate("async()=>{window.readGameSnapshot=(await import('./src/main.js')).getSnapshot}")
    page.keyboard.down('ArrowLeft');until(page,'s.player.turn?.active')
    page.keyboard.press('KeyK');queued=snapshot(page)
    assert queued['player']['turn']['active'] and queued['stats']['mirvs']==0,queued
    assert queued['player']['weaponQueue']['missile'],queued
    page.keyboard.up('ArrowLeft');until(page,'!s.player.turn.active&&s.stats.mirvs===1')
    page.wait_for_timeout(150);assert snapshot(page)['stats']['mirvs']==1

    page.keyboard.down('ArrowRight');until(page,'s.player.turn.active')
    page.keyboard.press('KeyJ');queued=snapshot(page)
    assert queued['player']['weaponQueue']['fire'] and queued['stats']['shots']==0,queued
    page.keyboard.press('Escape');paused=snapshot(page)
    assert paused['status']=='paused' and not any(paused['player']['weaponQueue'].values()),paused
    assert not any(paused['inputs'].values()),paused
    page.keyboard.up('ArrowRight');page.click('#resume')
    until(page,'!s.player.turn.active');assert snapshot(page)['stats']['shots']==0

    assert not errors,errors
    print(json.dumps({'releasedMirvTap':'one prepared shot after real turn','pause':'cleared deferred primary shot','pageErrors':errors}))
    browser.close()
