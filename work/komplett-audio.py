"""Soundtracks for the complete-process films (milling, manhole insertion, rehabilitation).
Usage: python work/komplett-audio.py   (needs edge-tts, imageio-ffmpeg, numpy in work/qa/video-runtime)
Writes work/qa/komplett/audio/{film-narrated,film-music,ad-narrated}.wav and a report.
Speech: Microsoft neural voice de-DE-ConradNeural (synthetic). Music: own procedural
instrumental, no third-party material."""
import asyncio,json,sys,wave,subprocess,os
from pathlib import Path
sys.path.insert(0,str(Path('work/qa/video-runtime').resolve()))
import numpy as np
import certifi
if os.path.exists('/root/.ccr/ca-bundle.crt'):certifi.where=lambda:'/root/.ccr/ca-bundle.crt'
import edge_tts,imageio_ffmpeg
FF=imageio_ffmpeg.get_ffmpeg_exe();SR=48000;OUT=Path('work/qa/komplett/audio');OUT.mkdir(parents=True,exist_ok=True)
# "Ditom" is written phonetically (the voice reads "DiTom" as two words).
FILM=[(0.3,3.2,'DSS-Flex Verfahren von Ditom.'),
 (3.5,4.7,'Einragende Anschlüsse, Wurzeln und eindringendes Grundwasser.'),
 (8.2,5.6,'Zuerst fräst der Roboter Einragungen und Wurzeln kontrolliert zurück.'),
 (14.2,5.6,'Danach wird die Fläche um den Anschluss sauber vorbereitet.'),
 (20.6,3.6,'Dann geht es in den Schacht.'),
 (24.6,8.6,'Der Kran hebt Roboter und Schalung am Hebebügel an und senkt sie durch die Schachtöffnung ab.'),
 (33.6,9.0,'Unten setzt die Schalung vor dem Rohr auf. Die Klappvorrichtung gleicht den Winkel aus, dann fährt der Roboter ins Rohr.'),
 (43.3,7.6,'Am Anschluss wird die Schalung positioniert, angepresst und abgedichtet.'),
 (53.3,5.5,'Die Anschlussblase hält den Durchgang frei.'),
 (59.3,11.5,'Über den Opferschlauch gelangt der Injektionsmörtel zur Schalung. Er füllt den Ausbruch und die Hohlräume im Erdreich und stoppt das eindringende Wasser.'),
 (73.3,4.5,'Nach dem Aushärten wird ausgeschalt.'),
 (78.2,4.6,'Der Anschluss ist dicht und bleibt frei.'),
 (83.5,4.2,'Ditom. Das DSS-Flex Verfahren.')]
AD=[(0.2,3.3,'Das DSS-Flex Verfahren von Ditom.'),
 (3.6,4.5,'Wurzeln, Einragungen, eindringendes Grundwasser?'),
 (8.3,7.2,'Fräsen, einbauen, sanieren: in einem Ablauf, grabenlos über den vorhandenen Schacht.'),
 (15.9,5.8,'Die Schalung dichtet ab, der Mörtel verfüllt Ausbruch und Hohlraum.'),
 (22.1,2.6,'Der Anschluss bleibt frei.'),
 (24.9,4.5,'Ditom. Präzision für die Kanalsanierung.')]
def wav(path,data):
 with wave.open(str(path),'wb') as f:
  f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((np.clip(data,-.99,.99)*32767).astype('<i2').tobytes())
def decode(path,speed=1):
 args=[FF,'-v','error','-i',str(path)]+(['-af',f'atempo={speed:.6f}'] if speed!=1 else [])
 return np.frombuffer(subprocess.run(args+['-f','f32le','-ar',str(SR),'-ac','1','pipe:1'],capture_output=True,check=True).stdout,dtype='<f4')
async def speak(rows,tag):
 for i,(_,_,text) in enumerate(rows):
  dest=OUT/f'{tag}-{i:02}.mp3';stamp=dest.with_suffix('.txt')
  if dest.exists() and stamp.exists() and stamp.read_text(encoding='utf-8')==text:continue
  await edge_tts.Communicate(text,'de-DE-ConradNeural',rate='-2%').save(str(dest));stamp.write_text(text,encoding='utf-8')
def music(duration,seed,brand):
 n=int(SR*duration);m=np.zeros((n,2),np.float32);rng=np.random.default_rng(seed)
 def add(at,s,pan=0):
  st=int(at*SR);k=min(len(s),n-st)
  if k>0:m[st:st+k,0]+=s[:k]*np.sqrt((1-pan)/2);m[st:st+k,1]+=s[:k]*np.sqrt((1+pan)/2)
 def note(f,d,kind='pad'):
  t=np.arange(int(d*SR))/SR
  if kind=='pad':return (.55*np.sin(2*np.pi*f*t)+.18*np.sin(4*np.pi*f*t)+.13*np.sin(2*np.pi*f*1.003*t))*np.minimum(t/.5,1)*np.minimum((d-t)/.8,1)
  return (np.sin(2*np.pi*f*t)+.22*np.sin(4*np.pi*f*t))*np.exp(-t*5)*np.minimum(t/.008,1)
 chords=[[146.83,174.61,220],[116.54,146.83,174.61],[130.81,174.61,220],[130.81,164.81,196]];beat=60/104;bar=beat*4
 for b in range(int(duration/bar)+1):
  ch=chords[(b//2)%4];at=b*bar;build=min(1,b/4)
  for j,f in enumerate(ch):add(at,note(f,bar*1.1)*.048,(j-1)*.4)
  for j in range(8):add(at+j*beat/2,note(ch[[0,1,2,1,0,2,1,2][j]]*2,beat*.8,'pluck')*.055*build,np.sin(j)*.45)
  for j in range(4):
   t=np.arange(int(.22*SR))/SR;add(at+j*beat,np.sin(2*np.pi*(48*t+10*(1-np.exp(-t*28))))*np.exp(-t*18)*.11*build)
   add(at+j*beat,note(ch[0]/2,beat*.8,'pluck')*.09)
   if j%2:t=np.arange(int(.12*SR))/SR;z=np.concatenate(([0],np.diff(rng.normal(0,1,len(t)))));add(at+j*beat,z*np.exp(-t*34)*.025*build,.08)
  for j in range(8):t=np.arange(int(.065*SR))/SR;z=np.concatenate(([0],np.diff(rng.normal(0,1,len(t)))));add(at+j*beat/2,z*np.exp(-t*70)*.013*build,-.25)
 for at in brand:
  for j,f in enumerate([293.66,349.23,440,587.33]):add(at+j*.16,note(f,1.8,'pluck')*.10,(j-1.5)*.2)
 t=np.arange(n)/SR;m*=(np.minimum(t/.7,1)*np.minimum((duration-t)/1.4,1))[:,None];return m/max(1,float(np.max(np.abs(m)))/.5)
def mix(duration,rows,tag,m):
 n=len(m);voice=np.zeros(n,np.float32);duck=np.ones(n,np.float32);rep=[]
 for i,(start,window,text) in enumerate(rows):
  d=decode(OUT/f'{tag}-{i:02}.mp3');raw=len(d)/SR;speed=max(1,raw/(window-.12))
  if speed>1:d=decode(OUT/f'{tag}-{i:02}.mp3',speed)
  d=d/max(float(np.max(np.abs(d))),.01)*.69;st=int(start*SR);k=min(len(d),n-st);voice[st:st+k]+=d[:k]
  duck[max(0,st-int(.12*SR)):min(n,st+k+int(.28*SR))]=.29;rep.append(dict(start=start,window=window,text=text,raw=round(raw,2),speed=round(speed,3)))
 p=np.arange(0,n,480);duck=np.interp(np.arange(n),p,np.convolve(duck[p],np.ones(21)/21,'same')).astype(np.float32)
 x=m*duck[:,None]+voice[:,None];return x*min(1,.92/max(.01,float(np.max(np.abs(x))))),rep
if __name__=='__main__':
 asyncio.run(speak(FILM,'film'));asyncio.run(speak(AD,'ad'))
 fm=music(88,17092026,[.3,83.3]);am=music(29.5,28092026,[.2,25.0])
 wav(OUT/'film-music.wav',fm*(.89/max(.01,float(np.max(np.abs(fm))))));fn,r1=mix(88,FILM,'film',fm);wav(OUT/'film-narrated.wav',fn);an,r2=mix(29.5,AD,'ad',am);wav(OUT/'ad-narrated.wav',an)
 (OUT/'report.json').write_text(json.dumps({'voice':'de-DE-ConradNeural (Microsoft, synthetic)','music':'own procedural instrumental','film':r1,'ad':r2},ensure_ascii=False,indent=1),encoding='utf-8')
 print(json.dumps({'film':[(r['text'][:30],r['raw'],r['speed']) for r in r1],'ad':[(r['text'][:30],r['raw'],r['speed']) for r in r2]},ensure_ascii=False,indent=0))
