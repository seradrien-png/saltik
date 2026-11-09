"""Replace the final 1.2 seconds with a boss leap, avoiding a victory spoiler."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import functools,subprocess,base64,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];WORK=Path('/workspace/recovery-saltik/promo')
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  if self.path.startswith('/assets/'):self.path='/dist'+self.path
  return super().do_GET()
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',4176),functools.partial(Handler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1920,'height':1080})
  page.goto('http://127.0.0.1:4176/scripts/promo/render.html');page.evaluate('window.promoReady');page.evaluate('window.beginPickup()')
  cmd=['ffmpeg','-v','error','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-vf','scale=in_range=full:out_range=tv,format=yuv420p','-c:v','libx264','-crf','21','-color_range','tv',str(WORK/'pickup.mp4')]
  encoder=subprocess.Popen(cmd,stdin=subprocess.PIPE)
  for i in range(36):
   encoder.stdin.write(base64.b64decode(page.evaluate('window.nextPromoFrame()')))
   if i==21:page.screenshot(path=str(WORK/'frame-495.jpg'))
  encoder.stdin.close();assert encoder.wait()==0
  evidence=json.loads((WORK/'evidence.json').read_text());new=page.evaluate('window.promoEvidence()')
  evidence['trace']=evidence['trace'][:-1]+new['trace'];evidence['clips']=new['clips'];evidence['events']=[e for e in evidence['events'] if e['at']<15.8]+new['events'];evidence['status']=new['status'];evidence['hp']=new['hp']
  (WORK/'evidence.json').write_text(json.dumps(evidence,indent=2));browser.close()
finally:server.shutdown()
subprocess.run(['ffmpeg','-v','error','-y','-i',str(WORK/'picture.mp4'),'-i',str(WORK/'pickup.mp4'),'-filter_complex','[0:v]trim=end_frame=474,setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[0:v]trim=start_frame=510,setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[v]','-map','[v]','-c:v','libx264','-preset','medium','-crf','21','-maxrate','6000k','-bufsize','12000k','-pix_fmt','yuv420p','-color_range','tv',str(WORK/'picture-final.mp4')],check=True)
subprocess.run(['python',str(ROOT/'scripts/promo/audio.py')],check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(WORK/'picture-final.mp4'),'-i',str(WORK/'original-score.wav'),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-af','loudnorm=I=-15:TP=-1.5:LRA=8','-t','20','-movflags','+faststart',str(ROOT/'dist/video/saltik-gameplay-promo.mp4')],check=True)
print('Final action pickup complete',flush=True)
