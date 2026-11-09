"""Exercise shipped voice clips and their lifecycle through normal browser controls."""

import asyncio
import json
import os
from pathlib import Path

from playwright.async_api import async_playwright


URL = os.environ.get('FERAL_PREVIEW_URL', 'http://127.0.0.1:4173')
OUT = Path('/workspace/deliverables/saltik-menu-qa')
OUT.mkdir(parents=True, exist_ok=True)

INSTRUMENT = """(() => {
  const Native = window.AudioContext || window.webkitAudioContext;
  const qa = window.__voiceQA = {starts: []};
  window.AudioContext = class extends Native {
    constructor(...args) { super(...args); qa.context = this; }
    createBufferSource() {
      const source = super.createBufferSource();
      const start = source.start.bind(source), stop = source.stop.bind(source);
      const connect = source.connect.bind(source);
      let connections = 0, record = null;
      source.connect = (...args) => { connections++; return connect(...args); };
      source.start = (...args) => {
        if (!source.loop && source.buffer) {
          const data = source.buffer.getChannelData(0);
          let sum = 0, peak = 0;
          for (const value of data) { sum += value * value; peak = Math.max(peak, Math.abs(value)); }
          record = {at: this.currentTime, duration: source.buffer.duration,
            rms: Math.sqrt(sum / data.length), peak, connections, contextState: this.state};
          qa.starts.push(record);
          source.addEventListener('ended', () => { record.endedAt = this.currentTime; }, {once: true});
        }
        return start(...args);
      };
      source.stop = (...args) => { if (record) record.stoppedAt = this.currentTime; return stop(...args); };
      return source;
    }
  };
})();"""


async def prepared(browser):
    context = await browser.new_context(viewport={'width': 1440, 'height': 900})
    page = await context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    await page.add_init_script(INSTRUMENT)
    await page.goto(URL, wait_until='networkidle')
    await page.wait_for_function('!document.querySelector("#start").disabled')
    await page.evaluate('async()=>window.readGame=(await import("./src/main.js")).getSnapshot')
    return context, page, errors


async def snapshot(page):
    return await page.evaluate('''() => ({
      view: readGame().view, time: readGame().time, speech: readGame().speech,
      homingSalvos: readGame().stats.homingSalvos, starts: __voiceQA.starts,
      contextState: __voiceQA.context?.state, musicPaused: document.querySelector('#game-music').paused
    })''')


async def delayed_ready_case(browser, action):
    context, page, errors = await prepared(browser)
    gate = asyncio.Event()
    requested = asyncio.Event()

    async def hold_ready(route):
        requested.set()
        await gate.wait()
        await route.continue_()

    await page.route('**/audio/voices/ready.ogg', hold_ready)
    try:
        await page.click('#start')
        await asyncio.wait_for(requested.wait(), timeout=8)
        if action == 'pause':
            await page.keyboard.press('Escape')
            await page.wait_for_function('readGame().view==="paused"')
        elif action == 'mute':
            await page.click('#sound')
            assert await page.get_attribute('#sound', 'aria-pressed') == 'true'
        elif action == 'home':
            # The brand home link is hidden during combat; dispatch its real
            # handler to cover the home lifecycle without a production hook.
            await page.locator('#home-link').dispatch_event('click')
            await page.wait_for_function('readGame().view==="title"')
        gate.set()
        await page.wait_for_timeout(350)
        before = await snapshot(page)
        assert not before['starts'], (action, before)
        assert before['speech']['queued'] == 0, (action, before)
        if action == 'pause':
            await page.click('#resume')
            await page.wait_for_function('readGame().view==="playing"')
        elif action == 'mute':
            await page.click('#sound')
            assert await page.get_attribute('#sound', 'aria-pressed') == 'false'
        await page.wait_for_timeout(350)
        after = await snapshot(page)
        assert not after['starts'], (action, after)
        assert after['speech']['played'].get('ready', 0) == 0, (action, after)
        assert not errors, errors
        return {'before': before, 'after': after, 'pageErrors': errors}
    finally:
        gate.set()
        await context.close()


async def active_ready_case(browser, action):
    """Stop the longer decoded Ready clip while its samples are still playing."""
    context, page, errors = await prepared(browser)
    try:
        await page.click('#start')
        await page.wait_for_function('readGame().speech.playing==="ready"', timeout=10000)
        before = await snapshot(page)
        assert len(before['starts']) == 1 and 1.5 < before['starts'][0]['duration'] < 2.2, before
        if action == 'pause':
            await page.keyboard.press('Escape')
            await page.wait_for_function('readGame().view==="paused"')
        elif action == 'mute':
            await page.click('#sound')
            assert await page.get_attribute('#sound', 'aria-pressed') == 'true'
        elif action == 'home':
            await page.locator('#home-link').dispatch_event('click')
            await page.wait_for_function('readGame().view==="title"')
        elif action == 'restart':
            await page.keyboard.press('Escape')
            await page.click('#restart-pause')
            await page.wait_for_function('readGame().speech.played.ready===2', timeout=10000)
        result = await snapshot(page)
        first = result['starts'][0]
        assert first.get('stoppedAt') is not None, (action, result)
        assert first['stoppedAt'] < first['at'] + first['duration'] - .25, (action, result)
        if action == 'restart':
            assert len(result['starts']) == 2 and result['speech']['playing'] == 'ready', result
        else:
            assert result['speech']['playing'] is None and result['speech']['queued'] == 0, (action, result)
            if action == 'pause':
                await page.click('#resume')
            elif action == 'mute':
                await page.click('#sound')
            await page.wait_for_timeout(250)
            resumed = await snapshot(page)
            assert len(resumed['starts']) == 1 and resumed['speech']['played']['ready'] == 1, (action, resumed)
        assert not errors, errors
        return {'before': before, 'after': result, 'pageErrors': errors}
    finally:
        await context.close()


async def restart_case(browser):
    context, page, errors = await prepared(browser)
    gate = asyncio.Event()
    first_requested = asyncio.Event()
    requests = 0

    async def ready_route(route):
        nonlocal requests
        requests += 1
        if requests == 1:
            first_requested.set()
            await gate.wait()
        await route.continue_()

    await page.route('**/audio/voices/ready.ogg', ready_route)
    try:
        await page.click('#start')
        await asyncio.wait_for(first_requested.wait(), timeout=8)
        await page.keyboard.press('Escape')
        await page.click('#restart-pause')
        await page.wait_for_function('readGame().speech.played.ready===1', timeout=10000)
        gate.set()
        await page.wait_for_timeout(500)
        result = await snapshot(page)
        assert requests == 2, requests
        assert result['speech']['played']['ready'] == 1, result
        assert len(result['starts']) == 1, result
        assert not errors, errors
        return {'requests': requests, 'result': result, 'pageErrors': errors}
    finally:
        gate.set()
        await context.close()


async def missing_case(browser):
    context, page, errors = await prepared(browser)
    await page.route('**/audio/voices/ready.ogg', lambda route: route.abort())
    try:
        await page.click('#start')
        await page.wait_for_function('readGame().speech.failed>=1')
        await page.wait_for_function('readGame().time>2.4', timeout=10000)
        result = await snapshot(page)
        assert result['view'] == 'playing' and result['speech']['playing'] is None, result
        assert result['speech']['played'].get('ready', 0) == 0, result
        assert not errors, errors
        await page.screenshot(path=str(OUT / 'voices-missing.png'))
        return {'result': result, 'pageErrors': errors}
    finally:
        await context.close()


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
                                                    args=['--no-sandbox', '--disable-dev-shm-usage'])
        context, page, errors = await prepared(browser)
        try:
            await page.click('#start')
            await page.wait_for_function('readGame().speech.played.ready===1', timeout=10000)
            intro = await snapshot(page)
            assert intro['contextState'] == 'running', intro
            assert len(intro['starts']) == 1, intro
            assert 1.5 < intro['starts'][0]['duration'] < 2.2, intro
            assert intro['starts'][0]['rms'] > .005 and intro['starts'][0]['connections'] > 0, intro
            assert intro['starts'][0]['contextState'] == 'running', intro
            await page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
            await page.wait_for_function('readGame().speech.playing===null')
            ended = await snapshot(page)
            assert ended['starts'][0]['endedAt'] - ended['starts'][0]['at'] >= 1.5, ended
            await page.screenshot(path=str(OUT / 'voices-intro.png'))
            await page.keyboard.down('ArrowRight')
            await page.keyboard.down('KeyL')
            await page.wait_for_function('readGame().stats.homingSalvos===1', timeout=18000)
            await page.wait_for_function('readGame().speech.played["target-lock"]===1', timeout=10000)
            await page.wait_for_timeout(500)
            guided = await snapshot(page)
            await page.keyboard.up('KeyL')
            await page.keyboard.up('ArrowRight')
            assert guided['homingSalvos'] == 1 and guided['speech']['played']['target-lock'] == 1, guided
            assert len(guided['starts']) == 2 and guided['starts'][1]['rms'] > .005, guided
            assert not errors, errors
            await page.screenshot(path=str(OUT / 'voices-target-lock.png'))
            natural = {'intro': intro, 'guided': guided, 'pageErrors': errors}
        finally:
            await context.close()
        paused = await delayed_ready_case(browser, 'pause')
        muted = await delayed_ready_case(browser, 'mute')
        home = await delayed_ready_case(browser, 'home')
        restarted = await restart_case(browser)
        active = {action: await active_ready_case(browser, action)
                  for action in ('pause', 'mute', 'home', 'restart')}
        missing = await missing_case(browser)
        report = {'natural': natural, 'pause': paused, 'mute': muted, 'home': home,
                  'restart': restarted, 'activeReady': active, 'missingFile': missing}
        (OUT / 'voices-results.json').write_text(json.dumps(report, indent=2) + '\n')
        print(json.dumps(report, indent=2))
        await browser.close()


if __name__ == '__main__':
    asyncio.run(main())
