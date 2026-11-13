from pathlib import Path
import subprocess,json,hashlib,tempfile
site=Path(__file__).resolve().parents[1]
proof=Path(tempfile.mkdtemp(prefix='saltik-gatling-audio-'))
assets=site/'dist/audio'
def run(args):
 r=subprocess.run(['ffmpeg','-y','-v','error',*args],capture_output=True,text=True,check=True)
 return r
uploaded=site/'audio-sources/A10_BRRRT_boucle.wav'
loop=assets/'gatling-brrrt-loop.ogg'
# Preserve the full supplied 3.2 second stereo loop, without trimming or fades.
run(['-i',str(uploaded),'-c:a','libvorbis','-q:a','5',str(loop)])
phrases={'ready':'Gatling online.','target-lock':'Target lock!','enemy-brother':'Enemy brother','grab-him':'Grab him!','see-you-later':'See you later','carrier':"Saltik don't kill Saltik",'victory':'Victory!'}
clips=[]
for key,phrase in phrases.items():
 name='gatling-'+key
 text=proof/(name+'.txt');text.write_text(phrase)
 raw=proof/(name+'-rms.wav');processed=proof/(name+'-metal.wav')
 # rms is a different native male voice from original Saltik's female slt.
 run(['-f','lavfi','-i',f'flite=textfile={text}:voice=rms','-ar','44100','-ac','1',str(raw)])
 chain='highpass=f=180,lowpass=f=4200,asplit=2[dry][wet];[wet]aecho=0.6:0.4:12:0.35,tremolo=f=45:d=0.24[metal];[dry][metal]amix=inputs=2:weights=1 0.35:normalize=0,loudnorm=I=-19:TP=-3:LRA=6,afade=t=in:st=0:d=0.008'
 run(['-i',str(raw),'-filter_complex',chain,'-ar','44100','-ac','1',str(processed)])
 out=assets/'voices'/(name+'.ogg');run(['-i',str(processed),'-c:a','libvorbis','-q:a','4',str(out)])
 clips.append({'path':str(out.relative_to(site)),'text':phrase,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()})
report={'loop':{'original':str(uploaded.relative_to(site)),'original_sha256':hashlib.sha256(uploaded.read_bytes()).hexdigest(),'asset':str(loop.relative_to(site)),'asset_sha256':hashlib.sha256(loop.read_bytes()).hexdigest(),'conversion':'Full original 3.2 s stereo 48000 Hz; Ogg Vorbis quality 5; no trim/fades/pitch changes'},'voice':{'provider':'Local FFmpeg libflite','speaker':'rms (male); original uses slt (female)','method':'All seven phrases synthesized anew from text. Highpass/lowpass, short metallic echo and 45 Hz tremolo; no old clip input or browser TTS. Local Ogg Vorbis mono 44100 Hz.','clips':clips}}
(proof/'provenance.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
