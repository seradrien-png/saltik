from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import functools,subprocess,base64,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
WORK=Path('/workspace/recovery-saltik/promo');WORK.mkdir(parents=True,exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  if self.path.startswith('/assets/'):self.path='/dist'+self.path
  return super().do_GET()
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',4176),functools.partial(Handler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
errors=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1920,'height':1080},device_scale_factor=1)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:4176/scripts/promo/render.html')
  page.evaluate('window.promoReady')
  cmd=['ffmpeg','-hide_banner','-loglevel','warning','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-vf','scale=in_range=full:out_range=tv,format=yuv420p','-c:v','libx264','-preset','medium','-crf','21','-maxrate','6000k','-bufsize','12000k','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',str(WORK/'picture.mp4')]
  encoder=subprocess.Popen(cmd,stdin=subprocess.PIPE)
  for i in range(600):
   encoder.stdin.write(base64.b64decode(page.evaluate('window.nextPromoFrame()')))
   if i in [35,110,180,240,300,355,410,460,495,565]:page.screenshot(path=str(WORK/f'frame-{i}.jpg'))
   if i%90==0:print(f'{i}/600',flush=True)
  encoder.stdin.close()
  if encoder.wait():raise RuntimeError('Picture encoder failed')
  evidence=page.evaluate('window.promoEvidence()');evidence['browserErrors']=errors
  (WORK/'evidence.json').write_text(json.dumps(evidence,indent=2))
  assert not errors,errors
  browser.close()
finally:server.shutdown()
subprocess.run(['python',str(ROOT/'scripts/promo/audio.py')],check=True)
out=ROOT/'dist/video/saltik-gameplay-promo.mp4'
subprocess.run(['ffmpeg','-v','error','-y','-i',str(WORK/'picture.mp4'),'-i',str(WORK/'original-score.wav'),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-af','loudnorm=I=-15:TP=-1.5:LRA=8','-t','20','-movflags','+faststart','-metadata','title=SALTIK — Small machine. Big rebellion.',str(out)],check=True)
subprocess.run(['ffmpeg','-v','error','-y','-ss','7.8','-i',str(out),'-frames:v','1','-q:v','2',str(ROOT/'dist/video/saltik-gameplay-promo-poster.jpg')],check=True)
print(json.dumps({'file':str(out),'bytes':out.stat().st_size,'duration':20}),flush=True)
