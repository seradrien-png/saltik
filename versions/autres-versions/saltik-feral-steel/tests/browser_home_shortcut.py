"""Exercise the home-screen shortcut without pretending to install on a phone."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os

OUT=Path('/workspace/deliverables/saltik-shortcut-qa');OUT.mkdir(exist_ok=True)
URL=os.environ.get('FERAL_URL','http://127.0.0.1:4282/')
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':844,'height':390});errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(URL);page.wait_for_function('!document.querySelector("#start").disabled')
    assert page.locator('#install-shortcut').is_visible(), 'Home-screen shortcut entry point is missing'
    page.locator('#install-shortcut').click()
    assert page.get_by_role('dialog').is_visible()
    page.get_by_role('button',name='Fermer').click()
    assert page.locator('#install-shortcut').evaluate('(b)=>b===document.activeElement')
    # Native browser installation is available only after the browser offers it.
    # A canceled prompt is single-use: a second tap must display the guide.
    page.evaluate('''()=>{
      window.promptCalls=0;
      const e=new Event('beforeinstallprompt',{cancelable:true});
      e.prompt=async()=>{window.promptCalls++;};e.userChoice=Promise.resolve({outcome:'dismissed'});
      window.dispatchEvent(e);
    }''')
    assert page.evaluate('()=>window.promptCalls')==0
    page.locator('#install-shortcut').click()
    page.wait_for_function('window.promptCalls===1')
    page.locator('#install-shortcut').click()
    assert page.get_by_role('dialog').is_visible()
    page.keyboard.press('Escape')
    page.evaluate("()=>window.dispatchEvent(new Event('appinstalled'))")
    assert page.locator('#install-shortcut').is_hidden()
    # iPhone portrait must offer the shortcut above the rotate-to-play screen.
    iphone=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,
        user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1')
    phone=iphone.new_page();phone.on('pageerror',lambda e:errors.append(str(e)));phone.goto(URL)
    phone.locator('#install-shortcut-portrait').click()
    assert 'Safari' in phone.locator('#install-instructions').inner_text()
    assert 'Partager' in phone.locator('#install-instructions').inner_text()
    assert 'Sur l’écran d’accueil' in phone.locator('#install-instructions').inner_text()
    phone.screenshot(path=str(OUT/'iphone-guide.png'))
    box=phone.get_by_role('dialog').bounding_box();assert box['x']>=0 and box['x']+box['width']<=391
    # A launched standalone app should not offer to add itself again.
    standalone=browser.new_context(viewport={'width':844,'height':390})
    standalone.add_init_script("Object.defineProperty(navigator,'standalone',{get:()=>true})")
    launched=standalone.new_page();launched.goto(URL);launched.wait_for_function('!document.querySelector("#start").disabled')
    assert launched.locator('#install-shortcut').is_hidden()
    launched.locator('#start').click();launched.wait_for_timeout(350)
    assert 'state-playing' in launched.locator('#app').get_attribute('class')
    manifest=page.request.get(URL+'manifest.webmanifest');assert manifest.ok
    data=manifest.json();assert data['display']=='standalone' and data['short_name']=='SALTIK'
    for icon in data['icons']:
        response=page.request.get(URL+icon['src'].removeprefix('./'));assert response.ok and response.headers['content-type'].startswith('image/')
    assert not errors,errors
    (OUT/'browser-results.json').write_text(json.dumps({'nativePrompt':'only on tap; canceled prompt consumed once','iphonePortraitGuide':True,'installedEntryHidden':True,'gameLaunch':'passed','manifest':data,'pageErrors':errors},indent=2))
    browser.close();print('Home-screen shortcut browser checks passed')
