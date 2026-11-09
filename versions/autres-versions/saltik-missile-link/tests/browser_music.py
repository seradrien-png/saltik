"""Real media playback, including a seek-assisted repeat of the Black Canopy score."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
import os
OUT=Path('/tmp/feral-black-canopy-music-qa');OUT.mkdir(exist_ok=True)
URL=os.environ.get('FERAL_PREVIEW_URL','http://127.0.0.1:4173')
METER="""(() => {
  const Native=window.AudioContext||window.webkitAudioContext;
  window.AudioContext=class extends Native {
    createMediaElementSource(media){
      const source=super.createMediaElementSource(media);
      const analyser=this.createAnalyser();analyser.fftSize=2048;
      const silent=this.createGain();silent.gain.value=0;
      source.connect(analyser);analyser.connect(silent);silent.connect(this.destination);
      window.__musicAnalyser=analyser;
      return source;
    }
  };
})();"""
LOOP_PROBE="""async()=>{
  const media=document.querySelector('#game-music');
  // The preview server need not implement byte ranges. Reuse the exact local
  // Ogg bytes through a blob URL so a near-end seek completes immediately.
  const bytes=await(await fetch(media.currentSrc)).blob();
  const metadata=new Promise(resolve=>media.addEventListener('loadedmetadata',resolve,{once:true}));
  media.src=URL.createObjectURL(bytes);await metadata;
  const metadataDuration=media.duration;
  media.currentTime=media.duration-.65;
  await new Promise(resolve=>media.addEventListener('seeked',resolve,{once:true}));
  const seekDuration=media.duration;
  await media.play();
  const analyser=window.__musicAnalyser, samples=new Float32Array(analyser.fftSize);
  let before=0,tail=0,after=0,wrapped=false,wrapDuration=null,previous=media.currentTime;
  const deadline=performance.now()+3000;
  while(performance.now()<deadline){
    await new Promise(resolve=>requestAnimationFrame(resolve));
    analyser.getFloatTimeDomainData(samples);
    const rms=Math.sqrt(samples.reduce((sum,value)=>sum+value*value,0)/samples.length);
    if(!wrapped)before=Math.max(before,rms);
    if(!wrapped&&media.currentTime>media.duration-.15)tail=Math.max(tail,rms);
    if(previous>media.duration-.3 && media.currentTime<.3){wrapped=true;wrapDuration=media.duration;}
    if(wrapped){after=Math.max(after,rms);if(media.currentTime>.25)break;}
    previous=media.currentTime;
  }
  const result={wrapped,before,tail,after,currentTime:media.currentTime,paused:media.paused,metadataDuration,seekDuration,wrapDuration,finalDuration:media.duration};
  return result;
}"""
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    results=[]
    for width,height in [(1440,900),(844,390)]:
        context=browser.new_context(viewport={'width':width,'height':height},has_touch=width<1000,is_mobile=width<1000)
        page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.add_init_script(METER)
        page.goto(URL,wait_until='networkidle')
        assert page.locator('#game-music').count()==1,'Supplied music element is missing'
        assert page.evaluate('()=>document.querySelector("#game-music").paused'),'title must stay quiet'
        page.wait_for_function('!document.querySelector("#start").disabled');page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
        page.wait_for_function('()=>{const m=document.querySelector("#game-music");return !m.paused&&m.currentTime>.5}',timeout=12000)
        loaded=page.evaluate('()=>{const m=document.querySelector("#game-music");return {src:m.currentSrc,duration:m.duration,loop:m.loop,volume:m.volume,error:m.error?.code??null}}')
        assert loaded['src'].endswith('/audio/forest-loop.ogg'),loaded
        # This simple server omits byte ranges, so Chromium may initially
        # estimate Ogg duration from bitrate before it can index the tail.
        assert loaded['duration']>0 and loaded['loop'] and 0<loaded['volume']<.6 and loaded['error'] is None,loaded
        loop=page.evaluate(LOOP_PROBE)
        assert 59.98<loop['metadataDuration']<60.02,loop
        assert loop['wrapped'] and not loop['paused'] and .25<loop['currentTime']<1,loop
        assert loop['before']>.001 and loop['after']>.001,'music must remain audible across the real media loop: '+str(loop)
        assert loop['tail']>.001,'the last 150 ms before repeating must contain music: '+str(loop)
        page.keyboard.press('Escape');page.wait_for_function('document.querySelector("#game-music").paused')
        paused=page.evaluate('document.querySelector("#game-music").currentTime')
        page.wait_for_timeout(350)
        assert abs(page.evaluate('document.querySelector("#game-music").currentTime')-paused)<.08
        page.click('#resume');page.wait_for_function('(at)=>document.querySelector("#game-music").currentTime>at+.15',arg=paused)
        page.click('#sound');assert page.evaluate('document.querySelector("#game-music").muted')
        page.click('#sound');assert not page.evaluate('document.querySelector("#game-music").muted')
        page.keyboard.press('Escape');page.click('#restart-pause')
        page.wait_for_function('document.querySelector("#game-music").currentTime<.5')
        page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
        page.wait_for_function('()=>!document.querySelector("#game-music").paused')
        page.keyboard.press('Escape')
        assert page.evaluate('document.querySelector("#game-music").paused')
        assert not errors,errors
        results.append({'device':[width,height],'media':loaded,'loop':loop,'pauseResumeMuteRestart':'passed','pageErrors':errors})
        context.close()
    context=browser.new_context(viewport={'width':1440,'height':900});page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)));page.route('**/audio/forest-loop.ogg',lambda route:route.abort())
    page.goto(URL,wait_until='networkidle');page.wait_for_function('!document.querySelector("#start").disabled');page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
    page.evaluate('async()=>window.readGame=(await import("./src/main.js")).getSnapshot')
    page.wait_for_function('()=>window.readGame().time>1')
    assert page.evaluate('()=>window.readGame().status')=='playing' and not errors,errors
    results.append({'missingMusic':'game keeps running','pageErrors':errors});context.close()
    (OUT/'music-results.json').write_text(json.dumps(results,indent=2));print(json.dumps(results));browser.close()
