"""Render the current six native Saltiks, then encode the 36-second level-one epilogue.

python scripts/faithful-film/export.py --output /tmp/saltik-film
Review the generated MP4 before replacing the deployed asset. Existing story
and commercial audio are reused at their original speed and timing.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
import subprocess,base64,json,argparse
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
root=Path(__file__).resolve().parents[2];work=args.output;work.mkdir(parents=True,exist_ok=True);target=work/'saltik-free-together.mp4'
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',4174),partial(H,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=browser.new_page(viewport={'width':1280,'height':720},device_scale_factor=1);page.set_default_timeout(120000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:4174/scripts/faithful-film/preview.html');page.evaluate('window.ready')
  for i,t in enumerate([2,6,10,14,19,25,33]):page.evaluate('(t)=>window.renderFilm(t)',t);page.screenshot(path=str(work/f'shot-{i}.png'))
  cmd=['ffmpeg','-hide_banner','-loglevel','warning','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',str(root/'scripts/faithful-film/assets/original-story.m4a'),'-i',str(root/'scripts/faithful-film/assets/commercial.wav'),'-filter_complex','[0:v]scale=in_range=full:out_range=tv,format=yuv420p[v];[1:a]afade=t=out:st=29:d=3,apad[a0];[2:a]adelay=32000,apad[a1];[a0][a1]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.89[a]','-map','[v]','-map','[a]','-t','36','-c:v','libx264','-preset','medium','-crf','21','-maxrate','2600k','-bufsize','5200k','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:a','aac','-b:a','160k','-movflags','+faststart',str(target)]
  encoder=subprocess.Popen(cmd,stdin=subprocess.PIPE)
  try:
   for frame in range(1080):
    data=page.evaluate('(t)=>{window.renderFilm(t);return document.querySelector("canvas").toDataURL("image/jpeg",.95).split(",")[1]}',frame/30);encoder.stdin.write(base64.b64decode(data))
    if frame%180==0:print(f'{frame}/1080',flush=True)
   encoder.stdin.close()
   if encoder.wait():raise RuntimeError('ffmpeg failed')
  except BaseException:encoder.kill();encoder.wait();raise
  assert not errors,errors;browser.close()
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(work/'shot-5.png'),'-q:v','2',str(work/'saltik-free-together-poster.jpg')],check=True)
 result={'output':str(target),'duration':36,'frames':1080,'width':1280,'height':720,'bytes':target.stat().st_size,'current_models':6,'heroes':['striker','gatling'],'captives':['bt','gold','longrange','dr01'],'errors':errors};(work/'render-report.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result),flush=True)
finally:server.shutdown();server.server_close()
