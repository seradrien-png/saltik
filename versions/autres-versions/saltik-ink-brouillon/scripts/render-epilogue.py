"""Render the deterministic comic into 30fps H.264; runtime has no canvas cost."""
import argparse
import base64
import json
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--music',required=True)
parser.add_argument('--frames-only',action='store_true')
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
output=root/'dist/video/saltik-libres-ensemble.mp4'
shots=Path('/workspace/recovery-saltik/epilogue/frames')
shots.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1280,'height':720},device_scale_factor=1)
 page.goto('http://127.0.0.1:4173/scripts/epilogue-render.html')
 page.evaluate('window.epilogueReady')
 for t in [2,6,10.5,15.5,21,26.5]:
  page.evaluate('(t)=>window.renderEpilogueFrame(t)',t)
  page.screenshot(path=str(shots/f'scene-{t}.png'))
 if not args.frames_only:
  output.parent.mkdir(exist_ok=True)
  cmd=['ffmpeg','-hide_banner','-loglevel','warning','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',args.music,
       '-map','0:v:0','-map','1:a:0','-t','30','-c:v','libx264','-preset','slow','-crf','24','-maxrate','2400k','-bufsize','4800k','-pix_fmt','yuv420p',
       '-c:a','aac','-b:a','160k','-af','afade=t=in:d=1.4,afade=t=out:st=27:d=3,loudnorm=I=-17:TP=-1.5:LRA=11',
       '-movflags','+faststart','-metadata','title=SALTIK — Libres. Ensemble.',str(output)]
  encoder=subprocess.Popen(cmd,stdin=subprocess.PIPE)
  try:
   for frame in range(900):
    data=page.evaluate('(t)=>{window.renderEpilogueFrame(t);return document.querySelector("canvas").toDataURL("image/jpeg",.94).split(",")[1];}',frame/30)
    encoder.stdin.write(base64.b64decode(data))
    if frame%150==0: print(f'Frames {frame}/900',flush=True)
  finally:
   encoder.stdin.close()
  if encoder.wait()!=0: raise SystemExit('Video encoding failed')
  print(json.dumps({'output':str(output),'frames':900,'duration':30,'bytes':output.stat().st_size}),flush=True)
 browser.close()
