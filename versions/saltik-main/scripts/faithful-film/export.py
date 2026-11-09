"""Offline 36-second edit, 1080 exact-design frames, no runtime game changes."""
from pathlib import Path
import subprocess,base64,json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2]
work=Path('/workspace/recovery-saltik/faithful-film')
work.mkdir(parents=True,exist_ok=True)
target=root/'dist/video/saltik-free-together.mp4'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1280,'height':720},device_scale_factor=1)
 page.goto('http://127.0.0.1:4174/scripts/faithful-film/preview.html')
 page.evaluate('window.ready')
 for i,t in enumerate([2,6,10,14,19,25,33]):
  page.evaluate('(t)=>window.renderFilm(t)',t)
  page.screenshot(path=str(work/f'final-shot-{i}.png'))
 cmd=['ffmpeg','-hide_banner','-loglevel','warning','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',str(root/'scripts/faithful-film/assets/original-story.m4a'),'-i',str(root/'scripts/faithful-film/assets/commercial.wav'),'-filter_complex',
      '[0:v]scale=in_range=full:out_range=tv,format=yuv420p[v];[1:a]afade=t=out:st=29:d=3,apad[a0];[2:a]adelay=32000,apad[a1];[a0][a1]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.89[a]',
      '-map','[v]','-map','[a]','-t','36','-c:v','libx264','-preset','medium','-crf','23','-maxrate','2600k','-bufsize','5200k','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:a','aac','-b:a','160k','-movflags','+faststart',str(target)]
 encoder=subprocess.Popen(cmd,stdin=subprocess.PIPE)
 for frame in range(1080):
  data=page.evaluate('(t)=>{window.renderFilm(t);return document.querySelector("canvas").toDataURL("image/jpeg",.95).split(",")[1]}',frame/30)
  encoder.stdin.write(base64.b64decode(data))
  if frame%180==0:print(f'{frame}/1080',flush=True)
 encoder.stdin.close()
 if encoder.wait():raise SystemExit('ffmpeg failed')
 page.evaluate('window.renderFilm(25)');page.screenshot(path=str(work/'poster.png'))
 browser.close()
subprocess.run(['ffmpeg','-v','error','-y','-i',str(work/'poster.png'),'-q:v','2',str(root/'dist/video/saltik-free-together-poster.jpg')],check=True)
print(json.dumps({'output':str(target),'duration':36,'frames':1080,'bytes':target.stat().st_size}),flush=True)
