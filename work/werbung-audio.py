"""Soundtrack of the DSS-Flex commercial (25 s, 120 BPM): tension and hits, riser, drop at
the product reveal (5.5 s), impacts on explosion, cuts and logo slam. Own synthesis, no samples.
Writes work/qa/werbung/music.wav."""
import sys,wave
from pathlib import Path
sys.path.insert(0,str(Path('work/qa/video-runtime').resolve()))
import numpy as np
SR=48000;D=25.0;N=int(SR*D);mix=np.zeros((N,2),np.float32);rng=np.random.default_rng(2102026)
def add(at,s,g=1,pan=0):
 st=int(at*SR);k=min(len(s),N-st)
 if k<=0:return
 mix[st:st+k,0]+=s[:k]*g*np.sqrt((1-pan)/2)*1.41;mix[st:st+k,1]+=s[:k]*g*np.sqrt((1+pan)/2)*1.41
tt=lambda d:np.arange(int(d*SR))/SR
def lowpass(x,a):
 # Moving-average low-pass; a ~ 1/window length.
 k=max(1,int(1/a));return np.convolve(x,np.ones(k,np.float32)/k,'same').astype(np.float32)
def kick2():t=tt(.4);f=np.cumsum(50+140*np.exp(-t*30))/SR;return np.sin(2*np.pi*f)*np.exp(-t*7)
def noise(d,decay):t=tt(d);n=rng.normal(0,1,len(t));return n*np.exp(-t*decay)
def clap():s=noise(.25,22);return np.concatenate(([0],np.diff(s)))*.6
def hat():s=noise(.06,80);return np.concatenate(([0],np.diff(s)))*.35
def impact(size=1):
 t=tt(2.2);f=np.cumsum(30+90*np.exp(-t*6))/SR;boom=np.sin(2*np.pi*f)*np.exp(-t*2.2)
 crash=lowpass(rng.normal(0,1,len(t)).astype(np.float32),.25)*np.exp(-t*3)*.5
 return (boom+crash)*size
def whoosh(d=.45,up=True):
 t=tt(d);n=rng.normal(0,1,len(t)).astype(np.float32);env=np.sin(np.pi*t/d)**2;return lowpass(n,.08 if up else .2)*env*1.6
def riser(d):
 t=tt(d);f=np.cumsum(120+900*(t/d)**2)/SR;tone=np.sign(np.sin(2*np.pi*f))*.15;w=rng.normal(0,1,len(t)).astype(np.float32);p=(t/d)**2;n=lowpass(w,.02)*(1-p)+lowpass(w,.3)*p
 return (tone+n*.9)*(t/d)**1.5
def bass(freq,d):t=tt(d);return (np.sign(np.sin(2*np.pi*freq*t))*.35+np.sin(2*np.pi*freq*t))*np.exp(-t*3)*np.minimum(t/.005,1)
def stab(freqs,d):
 t=tt(d);s=sum(np.sign(np.sin(2*np.pi*f*t+k))*.3+np.sin(2*np.pi*f*1.005*t) for k,f in enumerate(freqs));return lowpass((s*np.exp(-t*5)).astype(np.float32),.18)
def bell(f):t=tt(1.2);return (np.sin(2*np.pi*f*t)+.4*np.sin(2*np.pi*f*2.76*t))*np.exp(-t*4)
beat=.5
# Tension: drone, heartbeat, hook hits and the three problem cuts.
t=tt(5.5);drone=(np.sin(2*np.pi*55*t)+.5*np.sin(2*np.pi*82.5*t+np.sin(t*3)))*np.minimum(t/.3,1)*.18;add(0,drone)
for at in [.2,.6]:add(at,impact(.8));add(at,clap(),.6)
for at in [1.0,1.5,2.0]:add(at,kick2(),.55)
for at in [2.5,3.0,3.5]:add(at,impact(.55));add(at,clap(),.8);add(at-.18,whoosh(.2),.5)
add(4.0,riser(1.45),.9)
# Drop at the reveal: four on the floor, claps on 2/4, off-beat hats, bass and stabs.
chords=[[146.83,174.61,220],[116.54,146.83,174.61],[130.81,164.81,196],[110,130.81,164.81]]
for b in range(int((D-5.5-1.2)/beat)):
 at=5.5+b*beat;bar=b//4;ch=chords[bar%4]
 add(at,kick2(),.85)
 if b%2:add(at,clap(),.55)
 add(at+beat/2,hat(),.6,.3);add(at+beat/4,hat(),.25,-.3)
 add(at,bass(ch[0]/2,beat*.9),.32);add(at+beat/2,bass(ch[0]/2,beat*.45),.22)
 if b%4==0:add(at,stab([f*2 for f in ch],.6),.16)
for at in [5.5,7.0,7.6,19.5,21.5,22.1]:add(at,impact(1.0 if at in (5.5,7.6,22.1) else .7))
for at in [6.85,9.3,10.8,12.3,13.8,19.3]:add(at,whoosh(.3),.6)
for k,at in enumerate([15.5,16.5,17.5,18.5]):add(at,bell([880,988,1175,1319][k]),.18)
# Ending: ring out, fade.
tt_=np.arange(N)/SR;env=np.minimum(tt_/.05,1)*np.clip((D-tt_)/.6,0,1);mix*=env[:,None]
mix/=max(1e-3,float(np.max(np.abs(mix))))/.89
with wave.open('work/qa/werbung/music.wav','wb') as f:
 f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((np.clip(mix,-1,1)*32767).astype('<i2').tobytes())
print('ok',float(np.max(np.abs(mix))))
