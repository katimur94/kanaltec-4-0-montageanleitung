"""Original instrumental score; no speech recordings or network services."""
import sys,wave
from pathlib import Path
sys.path.insert(0,str(Path('work/qa/video-runtime').resolve()))
import numpy as np
SR=48000;DURATION=60
n=SR*DURATION;music=np.zeros((n,2),np.float32);rng=np.random.default_rng(17092026)
def add(at,signal,pan=0):
 start=int(at*SR);size=min(len(signal),n-start)
 if size<=0:return
 music[start:start+size,0]+=signal[:size]*np.sqrt((1-pan)/2)
 music[start:start+size,1]+=signal[:size]*np.sqrt((1+pan)/2)
def note(freq,dur,kind='pad'):
 t=np.arange(int(dur*SR))/SR
 if kind=='pad':
  env=np.minimum(t/.5,1)*np.minimum((dur-t)/.8,1)
  return (.55*np.sin(2*np.pi*freq*t)+.18*np.sin(2*np.pi*freq*2*t)+.13*np.sin(2*np.pi*freq*1.003*t))*env
 return (np.sin(2*np.pi*freq*t)+.22*np.sin(2*np.pi*freq*2*t))*np.exp(-t*5)*np.minimum(t/.008,1)
chords=[[146.83,174.61,220],[116.54,146.83,174.61],[130.81,174.61,220],[130.81,164.81,196]]
beat=60/104;bar=beat*4
for b in range(int(DURATION/bar)+1):
 ch=chords[(b//2)%4];at=b*bar
 for j,f in enumerate(ch):add(at,note(f,bar*1.1)*.048,(j-1)*.4)
 for j in range(8):add(at+j*beat/2,note(ch[[0,1,2,1,0,2,1,2][j]]*2,beat*.8,'pluck')*.055,np.sin(j)*.45)
 for j in range(4):
  t=np.arange(int(.22*SR))/SR;add(at+j*beat,np.sin(2*np.pi*(48*t+10*(1-np.exp(-t*28))))*np.exp(-t*18)*.11)
  add(at+j*beat,note(ch[0]/2,beat*.8,'pluck')*.09)
  if j%2:
   t=np.arange(int(.12*SR))/SR;noise=rng.normal(0,1,len(t));noise=np.concatenate(([0],np.diff(noise)));add(at+j*beat,noise*np.exp(-t*34)*.025,.08)
 for j in range(8):
  t=np.arange(int(.065*SR))/SR;noise=rng.normal(0,1,len(t));noise=np.concatenate(([0],np.diff(noise)));add(at+j*beat/2,noise*np.exp(-t*70)*.013,-.25)
for at in [.3,57.3]:
 for j,f in enumerate([293.66,349.23,440,587.33]):add(at+j*.16,note(f,1.8,'pluck')*.10,(j-1.5)*.2)
t=np.arange(n)/SR;music*=(np.minimum(t/.7,1)*np.minimum((DURATION-t)/1.4,1))[:,None]
music/=max(1,float(np.max(np.abs(music)))/.50)
out=Path('work/qa/closure-video/music.wav');out.parent.mkdir(parents=True,exist_ok=True)
with wave.open(str(out),'wb') as f:
 f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((np.clip(music,-.99,.99)*32767).astype('<i2').tobytes())
print('Original instrumental score: 60 seconds, stereo, no voice.')
