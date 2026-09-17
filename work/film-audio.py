"""Local soundtrack production. Install edge-tts/imageio-ffmpeg in ignored QA runtime."""
import asyncio,json,sys,wave,subprocess
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path('work/qa/video-runtime').resolve()))
import edge_tts,imageio_ffmpeg
OUT=Path('Videos/DSS-Flex-Verfahren-2026'); TMP=Path('work/qa/video')
FF=imageio_ffmpeg.get_ffmpeg_exe(); SR=48000; DURATION=78
OUT.mkdir(parents=True,exist_ok=True);TMP.mkdir(parents=True,exist_ok=True)
rows=json.loads(Path('work/film-script.json').read_text(encoding='utf-8'))
previous=json.loads((OUT/'audio-report.json').read_text(encoding='utf-8')).get('segments',[]) if (OUT/'audio-report.json').exists() else []
(OUT/'sprechertext.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
def wav(path,data):
 with wave.open(str(path),'wb') as f:
  f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((np.clip(data,-.99,.99)*32767).astype('<i2').tobytes())
def decode(path,speed=1):
 args=[FF,'-v','error','-i',str(path)]
 if speed!=1:args+=['-af',f'atempo={speed:.6f}']
 result=subprocess.run(args+['-f','f32le','-ar',str(SR),'-ac','1','pipe:1'],capture_output=True,check=True)
 return np.frombuffer(result.stdout,dtype='<f4')
async def speech():
 for i,row in enumerate(rows):
  dest=TMP/f'voice-{i:02}.mp3'
  stamp=dest.with_suffix('.txt');cached=stamp.read_text(encoding='utf-8') if stamp.exists() else previous[i]['text'] if i<len(previous) else None
  if not dest.exists() or cached!=row['text']:
   pending=dest.with_suffix('.pending.mp3');await edge_tts.Communicate(row['text'],'de-DE-ConradNeural',rate='-2%').save(str(pending));pending.replace(dest)
  stamp.write_text(row['text'],encoding='utf-8')
  print('Speech',i,row['text'],flush=True)
def compose():
 n=SR*DURATION;music=np.zeros((n,2),np.float32);voice=np.zeros(n,np.float32);rng=np.random.default_rng(17092026)
 def add(at,signal,pan=0):
  start=int(at*SR);size=min(len(signal),n-start)
  if size<=0:return
  music[start:start+size,0]+=signal[:size]*np.sqrt((1-pan)/2);music[start:start+size,1]+=signal[:size]*np.sqrt((1+pan)/2)
 def note(freq,dur,kind='pad'):
  t=np.arange(int(dur*SR))/SR
  if kind=='pad':env=np.minimum(t/.5,1)*np.minimum((dur-t)/.8,1);return (.55*np.sin(2*np.pi*freq*t)+.18*np.sin(2*np.pi*freq*2*t)+.13*np.sin(2*np.pi*freq*1.003*t))*env
  return (np.sin(2*np.pi*freq*t)+.22*np.sin(2*np.pi*freq*2*t))*np.exp(-t*5)*np.minimum(t/.008,1)
 chords=[[146.83,174.61,220],[116.54,146.83,174.61],[130.81,174.61,220],[130.81,164.81,196]];beat=60/104;bar=beat*4
 for b in range(int(DURATION/bar)+1):
  ch=chords[(b//2)%4];at=b*bar
  for j,f in enumerate(ch):add(at,note(f,bar*1.1)*.048,(j-1)*.4)
  for j in range(8):add(at+j*beat/2,note(ch[[0,1,2,1,0,2,1,2][j]]*2,beat*.8,'pluck')*.055,np.sin(j)*.45)
  for j in range(4):
   t=np.arange(int(.22*SR))/SR;kick=np.sin(2*np.pi*(48*t+10*(1-np.exp(-t*28))))*np.exp(-t*18)
   add(at+j*beat,kick*.11)
   add(at+j*beat,note(ch[0]/2,beat*.8,'pluck')*.09)
   if j%2:
    t=np.arange(int(.12*SR))/SR;noise=rng.normal(0,1,len(t));noise=np.concatenate(([0],np.diff(noise)));add(at+j*beat,noise*np.exp(-t*34)*.025,.08)
  for j in range(8):
   t=np.arange(int(.065*SR))/SR;noise=rng.normal(0,1,len(t));noise=np.concatenate(([0],np.diff(noise)));add(at+j*beat/2,noise*np.exp(-t*70)*.013,-.25)
 # Brand tones for the opening and closing logo.
 for at in [.3,73.3]:
  for j,f in enumerate([293.66,349.23,440,587.33]):add(at+j*.16,note(f,1.8,'pluck')*.10,(j-1.5)*.2)
 report=[];duck=np.ones(n,np.float32)
 for i,row in enumerate(rows):
  data=decode(TMP/f'voice-{i:02}.mp3');raw_duration=len(data)/SR
  speed=max(1,raw_duration/(row['window']-.12));data=decode(TMP/f'voice-{i:02}.mp3',speed) if speed>1 else data
  peak=float(np.max(np.abs(data)));data=data/max(peak,.01)*.69;start=int(row['start']*SR);size=min(len(data),n-start);voice[start:start+size]+=data[:size]
  lo=max(0,start-int(.12*SR));hi=min(n,start+size+int(.28*SR));duck[lo:hi]=.29
  report.append({**row,'rawDuration':raw_duration,'speed':speed,'end':row['start']+size/SR})
 # Short smoothing ramps avoid abrupt changes in background level.
 points=np.arange(0,n,480);sm=np.convolve(duck[points],np.ones(21)/21,'same');duck=np.interp(np.arange(n),points,sm).astype(np.float32)
 t=np.arange(n)/SR;fade=np.minimum(t/.7,1)*np.minimum((DURATION-t)/1.4,1);music*=fade[:,None]
 music/=max(1,float(np.max(np.abs(music)))/.50)
 mixed=music*duck[:,None]+voice[:,None];mixed*=min(1,.92/max(.01,float(np.max(np.abs(mixed)))))
 wav(TMP/'music.wav',music);wav(TMP/'narrated.wav',mixed)
 (OUT/'audio-report.json').write_text(json.dumps({'voice':'de-DE-ConradNeural (synthetic)','sampleRate':SR,'music':'Original procedural instrumental, seed 17092026','segments':report,'peakMusic':float(np.max(np.abs(music))),'peakNarrated':float(np.max(np.abs(mixed)))},ensure_ascii=False,indent=2),encoding='utf-8')
 print('Audio composed. FFmpeg:',FF)
if '--speech' in sys.argv:asyncio.run(speech())
if '--compose' in sys.argv:compose()
