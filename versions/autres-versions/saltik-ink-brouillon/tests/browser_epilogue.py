"""Exercise the real victory/result boundary; test trigger is routed, never shipped."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('SALTIK_TEST_URL', 'http://127.0.0.1:4173/dist/')
OUT = Path('/workspace/recovery-saltik/epilogue/qa')
OUT.mkdir(parents=True, exist_ok=True)

def prepare(browser, phone=False, setup=None):
    page = browser.new_page(viewport={'width': 851 if phone else 1280, 'height': 393 if phone else 720}, is_mobile=phone, has_touch=phone)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    def instrument(route):
        response = route.fetch()
        source = response.text() + '\nwindow.__testFinish=(status)=>{game.status=status;finish();resultAt=performance.now()-1;};\n'
        route.fulfill(response=response, body=source)
    page.route('**/src/main.js', instrument)
    if setup:
        page.add_init_script(setup)
    requests = []
    page.on('request', lambda request: requests.append(request.url))
    page.goto(BASE, wait_until='networkidle')
    page.wait_for_function('window.__testFinish !== undefined')
    assert not any('.mp4' in url for url in requests), 'film must not download before victory'
    return page, errors

def win(page):
    page.evaluate("window.__testFinish('won')")
    expect(page.locator('#epilogue-overlay')).to_be_visible(timeout=8000)
    expect(page.locator('#result-screen')).to_be_hidden()

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'])
    results = []
    for phone in [False, True]:
        page, errors = prepare(browser, phone)
        win(page)
        page.wait_for_function('document.querySelector("#epilogue-video").readyState >= 2')
        page.screenshot(path=str(OUT / ('phone-film.png' if phone else 'desktop-film.png')))
        page.click('#epilogue-skip')
        expect(page.locator('#epilogue-overlay')).to_be_hidden()
        expect(page.locator('#result-screen')).to_be_visible()
        page.click('#replay-film')
        expect(page.locator('#epilogue-overlay')).to_be_visible()
        page.wait_for_function('document.querySelector("#epilogue-video").readyState >= 2')
        # The local static fixture has no byte-range seeking. Let the real media
        # clock reach its natural end at accelerated playback instead.
        page.evaluate('document.querySelector("#epilogue-video").playbackRate=8')
        expect(page.locator('#epilogue-overlay')).to_be_hidden(timeout=8000)
        expect(page.locator('#result-screen')).to_be_visible()
        page.click('#replay-film')
        page.keyboard.press('Escape')
        expect(page.locator('#result-screen')).to_be_visible()
        page.click('#replay')
        expect(page.locator('#epilogue-overlay')).to_be_hidden()
        assert page.evaluate('document.querySelector("#epilogue-video").paused')
        page.evaluate("window.__testFinish('dead')")
        expect(page.locator('#result-screen')).to_be_visible()
        expect(page.locator('#replay-film')).to_be_hidden()
        expect(page.locator('#epilogue-overlay')).to_be_hidden()
        assert not errors, errors
        results.append({'device': 'phone' if phone else 'desktop', 'victory_skip_natural_end_replay_defeat': 'passed'})
        page.close()

    denial = """window.__originalPlay=HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play=function(){if(this.id==='epilogue-video')return Promise.reject(new DOMException('Gesture required','NotAllowedError'));return window.__originalPlay.call(this);};"""
    page, errors = prepare(browser, setup=denial)
    page.evaluate("localStorage.setItem('feral-steel-sound','off')")
    page.reload(wait_until='networkidle')
    win(page)
    expect(page.locator('#epilogue-play')).to_be_visible()
    assert page.evaluate('document.querySelector("#epilogue-video").muted')
    page.evaluate('HTMLMediaElement.prototype.play=window.__originalPlay')
    page.click('#epilogue-play')
    page.wait_for_function('!document.querySelector("#epilogue-video").paused')
    page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))")
    assert page.evaluate('document.querySelector("#epilogue-video").paused')
    page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))")
    expect(page.locator('#epilogue-play')).to_be_visible()
    page.click('#epilogue-play')
    page.evaluate('document.querySelector("#epilogue-video").dispatchEvent(new Event("error"))')
    expect(page.locator('#result-screen')).to_be_visible()
    expect(page.locator('#epilogue-overlay')).to_be_hidden()
    assert not errors, errors
    results.append({'autoplay_denial_mute_visibility_error': 'passed'})
    page.close()

    late = """window.__originalPlay=HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play=function(){if(this.id==='epilogue-video')return new Promise(resolve=>{window.__resolveLate=()=>window.__originalPlay.call(this).then(resolve);});return window.__originalPlay.call(this);};"""
    page, errors = prepare(browser, setup=late)
    win(page)
    page.wait_for_function('window.__resolveLate !== undefined')
    page.click('#epilogue-skip')
    page.evaluate('window.__resolveLate()')
    page.wait_for_timeout(400)
    assert page.evaluate('document.querySelector("#epilogue-video").paused'), 'late play must not leak sound after skip'
    expect(page.locator('#result-screen')).to_be_visible()
    assert not errors, errors
    results.append({'late_play_cancellation': 'passed'})
    page.close()
    browser.close()
    (OUT / 'results.json').write_text(json.dumps(results, indent=2))
    print(json.dumps(results, indent=2))
