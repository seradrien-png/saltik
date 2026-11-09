from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import functools,subprocess,base64,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];WORK=Path('/workspace/recovery-saltik/promo-v2')
class Handler(SimpleHTTPRequestHandler):
 def translate_path(self,path):
  if path.startswith('/work/'):return str(WORK/path[len('/work/'):].split('?')[0])
  if path.startswith('/assets/'):path='/dist'+path
  return super().translate_path(path)
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',4178),functools.partial(Handler,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=b.new_page(viewport={'width':1920,'height':1080})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:4178/scripts/promo-v2/edit.html');page.evaluate('window.ready')
  # Inspect each type of shot before starting the final encode.
  for t in [1.5,3.3,5.5,6.8,8.4,10.4,12.3,16.5,20.2]:
   page.evaluate('(t)=>window.renderEdit(t)',t);page.screenshot(path=str(WORK/f'shot-{t}.jpg'))
  cmd=['ffmpeg','-v','warning','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-vf','scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p','-c:v','libx264','-preset','medium','-crf','21','-maxrate','6000k','-bufsize','12000k','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',str(WORK/'picture.mp4')]
  encoder=subprocess.Popen(cmd,stdin=subprocess.PIPE)
  for i in range(660):
   encoder.stdin.write(base64.b64decode(page.evaluate('(t)=>window.renderEdit(t)',i/30)))
   if i%90==0:print(f'Edited frames {i}/660',flush=True)
  encoder.stdin.close();assert encoder.wait()==0
  (WORK/'edit.json').write_text(json.dumps({'shots':page.evaluate('window.editShots'),'errors':errors},indent=2));assert not errors,errors
  page.evaluate('window.renderEdit(16.5)');page.screenshot(path=str(WORK/'poster.png'));b.close()
finally:server.shutdown()
subprocess.run(['python',str(ROOT/'scripts/promo-v2/sound.py')],check=True)
target=ROOT/'dist/video/saltik-gameplay-promo.mp4'
subprocess.run(['ffmpeg','-v','error','-y','-i',str(WORK/'picture.mp4'),'-i',str(WORK/'mix.wav'),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-af','loudnorm=I=-15:TP=-2:LRA=8','-t','22','-movflags','+faststart',str(target)],check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(WORK/'poster.png'),'-q:v','2',str(ROOT/'dist/video/saltik-gameplay-promo-poster.jpg')],check=True)
print(json.dumps({'file':str(target),'bytes':target.stat().st_size,'duration':22}),flush=True)
