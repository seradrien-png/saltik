"""Actual canyon pixel patches move in play and freeze with the game."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

OUT=Path('/tmp/feral-living-canyon-qa');OUT.mkdir(exist_ok=True)
INSTRUMENT="""(()=>{
 const draw=CanvasRenderingContext2D.prototype.drawImage,fill=CanvasRenderingContext2D.prototype.fillRect;
 window.canyonPatches=[];window.unrelatedWaterfalls=0;
 CanvasRenderingContext2D.prototype.drawImage=function(image,...a){
  if(image.src?.endsWith('/assets/canyon.webp')&&a.length===8){
   if(a[2]===image.width&&a[1]===0)window.canyonPatches=[];
   else if(a[2]<140&&a[3]<140)window.canyonPatches.push(a);
  }
  return draw.call(this,image,...a);
 };
 CanvasRenderingContext2D.prototype.fillRect=function(x,y,w,h){if(w===70&&h===310&&this.globalAlpha<.5)window.unrelatedWaterfalls++;return fill.call(this,x,y,w,h);};
})();"""
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':844,'height':390});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.add_init_script(INSTRUMENT)
 page.goto('http://127.0.0.1:4173',wait_until='networkidle');page.wait_for_function('!document.querySelector("#start").disabled');page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
 first=page.evaluate('()=>window.canyonPatches');page.wait_for_timeout(450);second=page.evaluate('()=>window.canyonPatches')
 assert 12<=len(first)<=13 and 12<=len(second)<=13 and first!=second,'native source pixels must move during play'
 page.keyboard.press('Escape');page.wait_for_timeout(150);frozen=page.evaluate('()=>window.canyonPatches');page.wait_for_timeout(350)
 assert page.evaluate('()=>window.canyonPatches')==frozen,'pause must freeze the actual water and leaf source patches'
 assert page.evaluate('()=>window.unrelatedWaterfalls')==0 and not errors,errors
 page.screenshot(path=str(OUT/'painted-water-and-leaves.png'))
 report={'nativePatchesPerTile':len(second),'motionDuringPlay':True,'pauseFreezesMotion':True,'unrelatedWaterfalls':0,'pageErrors':errors};(OUT/'results.json').write_text(json.dumps(report,indent=2));print(json.dumps(report));b.close()
