"""Project epic music, trailer sound design, native robot calls and neural VO."""
from pathlib import Path
import numpy as np,subprocess,wave,json
from scipy.signal import butter,sosfilt
ROOT=Path(__file__).resolve().parents[2];WORK=Path('/workspace/recovery-saltik/promo-v2');RATE=48000;DURATION=22
def decode(path,filters=''):
 cmd=['ffmpeg','-v','error','-i',str(path)]
 if filters:cmd+=['-af',filters]
 cmd+=['-ar',str(RATE),'-ac','2','-f','f32le','pipe:1']
 return np.frombuffer(subprocess.check_output(cmd),dtype='<f4').reshape(-1,2).copy()
epic=Path('/workspace/attachments/2a18ad1a-796b-4e80-8b8f-9f12e4e9db98/Feral_Steel_Saltik_Foret_Epique_ORIGINAL.ogg')
music=decode(epic)[18*RATE:40*RATE]
music*=.42/max(.01,float(np.sqrt(np.mean(music*music))))
mix=np.zeros((DURATION*RATE,2));n=min(len(music),len(mix));mix[:n]=music[:n]*.34
time=np.arange(len(mix))/RATE
voices=[
 (.04,ROOT/'dist/audio/voices/saltik-detected.ogg','Saltik detected.',-17),
 (1.55,ROOT/'scripts/promo-v2/assets/obey.mp3','They built you to obey.',-16),
 (5.2,ROOT/'dist/audio/voices/ready.ogg','Ready.',-17),
 (8.15,ROOT/'scripts/promo-v2/assets/choose.mp3','Choose your own way.',-16),
 (11.4,ROOT/'dist/audio/voices/target-lock.ogg','Target lock.',-17),
 (14.1,ROOT/'dist/audio/voices/grab-him.ogg','Grab him.',-17),
 (19,ROOT/'scripts/promo-v2/assets/ad.mp3','More to come on your smartphone.',-15),
]
decoded=[];duck=np.ones(len(mix));manifest=[]
for at,path,text,lufs in voices:
 clip=decode(path,f'loudnorm=I={lufs}:TP=-2:LRA=7');length=len(clip)/RATE
 envelope=np.minimum(np.clip((time-(at-.06))/.05,0,1),np.clip((at+length+.22-time)/.22,0,1))
 duck=np.minimum(duck,1-.79*envelope);decoded.append((at,clip));manifest.append({'at':at,'duration':length,'text':text,'source':str(path.relative_to(ROOT))})
mix*=duck[:,None]
# Purposeful negative space before CHOOSE and before the brand impact.
for start,end in [(7.95,8.15),(17.7,18.08)]:mix[round(start*RATE):round(end*RATE)]*=.03
rng=np.random.default_rng(6104)
def add(x,at,gain=1,pan=0):
 i=round(at*RATE);n=min(len(x),len(mix)-i)
 if n<=0:return
 if x.ndim==1:x=np.stack([x*np.sqrt((1-pan)/2),x*np.sqrt((1+pan)/2)],axis=1)
 mix[i:i+n]+=x[:n]*gain
def impact(at,gain=.45):
 t=np.arange(round(.75*RATE))/RATE
 noise=sosfilt(butter(2,480,fs=RATE,output='sos'),rng.normal(0,1,len(t)))
 x=(np.sin(2*np.pi*(38*t+24*(1-np.exp(-t*20))/20))*.6+noise*.8)*np.exp(-t*6)
 add(x,at,gain)
cuts=[2.7,3.15,3.55,4.1,4.65,5.2,6,6.5,7.15,8.15,8.65,9.15,9.6,10.2,10.7,11.4,12,12.7,13.15,13.7,14.2,14.7,15.3,15.75,16.2,17,18.1]
for at in cuts:impact(at,.22 if at<12 else .32)
impact(18.1,.85)
# Chasing subdivisions accelerate through the second half; voices stay clear.
for at in np.arange(2.7,17.7,60/164):
 t=np.arange(round(.16*RATE))/RATE
 x=np.sin(2*np.pi*(52*t+40*(1-np.exp(-t*40))/40))*np.exp(-t*25)
 gain=.23*float(duck[min(len(duck)-1,round(at*RATE))]);add(x,at,gain)
for at in [3.5,7.0,10.4,13.1,15.5,16.9]:
 t=np.arange(round(.23*RATE))/RATE;x=rng.normal(0,1,len(t))*np.exp(-t*28);x-=sosfilt(butter(2,1100,fs=RATE,output='sos'),x);add(x,at,.10)
for at,length in [(4.4,.7),(9.8,1),(16.2,1.45)]:
 t=np.arange(round(length*RATE))/RATE;u=t/length
 x=rng.normal(0,1,len(t));x=sosfilt(butter(2,5800,fs=RATE,output='sos'),x)
 add(x*u*u,at,.10)
for at in [.04,.20]:
 t=np.arange(round(.09*RATE))/RATE;add(np.sin(2*np.pi*1050*t)*np.exp(-t*40),at,.13)
# Gun/servo accents are editorial sound effects, not fabricated gameplay events.
for at in [2.75,2.88,3.61,4.18,6.04,7.22,7.38,8.75,9.66,10.78,12.14,12.81,13.22,14.35,14.81,15.42,17.13,17.32]:
 t=np.arange(round(.065*RATE))/RATE;x=(rng.normal(0,1,len(t))*.17+np.sin(2*np.pi*670*t)*.25)*np.exp(-t*58);add(x,at,.22)
for at,clip in decoded:add(clip,at)
fade=np.minimum(1,time/.025)*np.minimum(1,(22-time)/.20);mix*=fade[:,None]
peak=float(np.max(np.abs(mix)));mix*=min(1,.96/max(.001,peak))
with wave.open(str(WORK/'mix.wav'),'wb') as f:
 f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE);f.writeframes((mix*32767).astype('<i2').tobytes())
(WORK/'voices.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'voices':len(voices),'duration':22,'music':'Existing project epic score excerpt + original trailer sound design','peakBeforeMaster':peak,'pcmPeak':float(np.max(np.abs(mix)))}))
