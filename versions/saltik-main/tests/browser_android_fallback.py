"""Verify the Android browser shortcut and explicit, gesture-owned Chrome handoff.
This does not claim to reproduce the user's Android launcher failure.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os

OUT=Path('/workspace/deliverables/saltik-android-fix-qa');OUT.mkdir(exist_ok=True)
BASE=os.environ.get('FERAL_URL','http://127.0.0.1:4285/')
LIVE='https://feral-steel-canopee.ser-adrien.chatgpt.site/'
ANDROID='Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    context=browser.new_context(viewport={'width':393,'height':851},is_mobile=True,has_touch=True,user_agent=ANDROID)
    page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE);page.locator('#install-shortcut-portrait').click()
    old_or_new_link=page.locator('.install-game-link').first
    assert old_or_new_link.get_attribute('href').startswith('intent://'), 'Android handoff still opens the same embedded browser'
    assert page.url==BASE, 'Opening the guide must not launch another app automatically'
    chrome=page.locator('#install-open-browser').get_attribute('href')
    assert 'package=com.android.chrome;' in chrome and 'S.browser_fallback_url=https%3A%2F%2F' in chrome
    fallback=page.locator('#install-android-fallback').get_attribute('href')
    assert '/android.html#Intent' in fallback and 'package=com.android.chrome;' in fallback
    page.screenshot(path=str(OUT/'android-recovery-guide.png'))
    # The browser-only page runs the same real game and offers a Chrome shortcut.
    response=page.goto(BASE+'android.html');assert response.status==200
    assert page.title()=='SALTIK — Feral Steel'
    assert page.locator('link[rel="manifest"]').count()==0
    assert page.locator('meta[name="mobile-web-app-capable"]').count()==0
    assert page.locator('link[rel="icon"]').get_attribute('href')=='./icons/saltik-192.png'
    page.evaluate('''()=>{
      window.promptCalls=0;const e=new Event('beforeinstallprompt',{cancelable:true});
      e.prompt=async()=>{window.promptCalls++;};e.userChoice=Promise.resolve({outcome:'accepted'});
      window.dispatchEvent(e);
    }''')
    page.locator('#install-shortcut-portrait').click()
    assert page.evaluate('window.promptCalls')==0, 'The fallback must not install another standalone app'
    assert 'Créer un raccourci' in page.locator('#install-instructions').inner_text()
    assert '/android.html#Intent' in page.locator('#install-open-browser').get_attribute('href')
    page.screenshot(path=str(OUT/'android-simple-shortcut-guide.png'))
    page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedLink=text;}}})")
    page.locator('#install-copy-link').click()
    assert page.evaluate('window.copiedLink')==LIVE+'android.html'
    # Embedded browsers may refuse clipboard access; the URL must remain usable.
    page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('blocked'))}})")
    page.locator('#install-copy-link').click()
    assert page.locator('#install-address').input_value()==LIVE+'android.html'
    assert page.locator('#install-address').is_visible()
    page.locator('#install-close').click();page.set_viewport_size({'width':851,'height':393})
    page.wait_for_function('!document.querySelector("#start").disabled')
    page.locator('#start').click();page.wait_for_timeout(400)
    assert 'state-playing' in page.locator('#app').get_attribute('class')
    page.screenshot(path=str(OUT/'browser-shortcut-game.png'))
    # Re-opening the saved address should start at the game menu, not the guide.
    page.reload();page.wait_for_function('!document.querySelector("#start").disabled')
    assert not page.locator('#install-guide').evaluate('(d)=>d.open')
    assert page.locator('#start').is_visible() and page.url.endswith('/android.html')
    assert not errors,errors
    (OUT/'browser-results.json').write_text(json.dumps({'androidChromeIntent':chrome,'fallbackIntent':fallback,'browserShortcutHTTP':200,'browserShortcutHasNoPwaManifest':True,'clipboardFallback':'selectable canonical URL','realGameLaunch':'passed','reopen':'game menu','automaticExternalLaunch':False,'pageErrors':errors,'limit':'Chrome handoff URI checked; no physical Android phone available'},indent=2))
    browser.close();print('Android browser shortcut, Chrome handoff and game relaunch passed')
