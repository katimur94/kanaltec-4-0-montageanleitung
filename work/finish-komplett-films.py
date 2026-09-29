"""Finish the complete-process films: narrated and music-only full film plus a
short commercial, each for YouTube (1920x1080) and Reels (1080x1920).
Inputs: work/qa/komplett/{YouTube,Reel}-0-88-silent.mp4 (render-komplett-film.mjs)
and work/qa/komplett/audio/*.wav (komplett-audio.py).
Output: Videos/DSS-Flex-Verfahren-2026/DiTom-DSS-Flex-Gesamtablauf-*.mp4 (< 49 MB),
preview stills and the gallery section; decodes every file completely."""
import hashlib,json,re,subprocess,sys
from pathlib import Path
sys.path.insert(0,str(Path('work/qa/video-runtime').resolve()))
import imageio_ffmpeg
FF=imageio_ffmpeg.get_ffmpeg_exe();SRC=Path('work/qa/komplett');AUD=SRC/'audio';OUT=Path('Videos/DSS-Flex-Verfahren-2026');OUT.mkdir(parents=True,exist_ok=True)
FMT=[('YouTube',1920,1080),('Reel',1080,1920)]
# Commercial cut (seconds of the full film) with 0.35 s cross-fades.
AD=[(0.4,3.0),(8.0,12.0),(21.0,24.0),(25.5,28.5),(30.0,33.0),(34.5,37.0),(47.3,50.0),(63.0,67.5),(78.2,80.0),(82.5,88.0)];XF=.35
def run(a):
 r=subprocess.run([FF,'-hide_banner','-y','-loglevel','error']+a,capture_output=True,text=True)
 if r.returncode:raise RuntimeError(r.stderr[-2000:])
def enc(w,h):return ['-c:v','libx264','-preset','slow','-crf','20','-maxrate','3800k','-bufsize','7600k','-pix_fmt','yuv420p','-r','25','-g','50',
 '-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:a','aac','-b:a','160k','-ar','48000','-movflags','+faststart']
def check(p,w,h):
 r=subprocess.run([FF,'-hide_banner','-xerror','-i',str(p),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,errors='replace')
 assert r.returncode==0,r.stderr[-800:];m=r.stderr
 assert f'{w}x{h}' in m and 'h264' in m and 'aac' in m,p
 dur=re.search(r'Duration: (\d+):(\d+):([\d.]+)',m);d=int(dur[1])*3600+int(dur[2])*60+float(dur[3])
 peak=float(re.search(r'max_volume: ([\-\d.]+) dB',m)[1]);size=p.stat().st_size
 assert size<49_000_000 and peak<0,(p,size,peak)
 return dict(file=p.name,width=w,height=h,duration=round(d,2),bytes=size,audioPeakDB=peak,fullDecode='passed',revision=hashlib.sha256(p.read_bytes()).hexdigest()[:12])
report=[]
for name,w,h in FMT:
 master=SRC/f'{name}-0-88-silent.mp4'
 # Chunked renders (8 s parts from a restart-safe run) are joined losslessly.
 parts=sorted((SRC/'chunks').glob(f'{name}-*-silent.mp4'),key=lambda p:int(p.name.split('-')[1]))
 if parts and not master.exists():
  lst=SRC/'chunks'/f'{name}.txt';lst.write_text(''.join(f"file '{p.resolve()}'\n" for p in parts))
  run(['-f','concat','-safe','0','-i',str(lst),'-c','copy','-movflags','+faststart',str(master)])
 for kind,audio in [('Sprecher','film-narrated.wav'),('Musik','film-music.wav')]:
  dest=OUT/f'DiTom-DSS-Flex-Gesamtablauf-{name}-{kind}.mp4'
  run(['-i',str(master),'-i',str(AUD/audio),'-map','0:v','-map','1:a','-shortest']+enc(w,h)+[str(dest)]);report.append(check(dest,w,h))
 # Commercial: trimmed parts joined with cross-fades.
 parts=[];inputs=[];off=0;chain='';prev='[v0]'
 for i,(a,b) in enumerate(AD):
  inputs+=['-ss',str(a),'-t',str(b-a),'-i',str(master)];parts.append(f'[{i}:v]setpts=PTS-STARTPTS,fps=25,format=yuv420p[v{i}]')
 for i in range(1,len(AD)):
  off+=AD[i-1][1]-AD[i-1][0]-XF;chain+=f';{prev}[v{i}]xfade=transition=fade:duration={XF}:offset={off:.3f}[x{i}]';prev=f'[x{i}]'
 dest=OUT/f'DiTom-DSS-Flex-Werbung-{name}.mp4'
 run(inputs+['-i',str(AUD/'ad-narrated.wav'),'-filter_complex',';'.join(parts)+chain,'-map',prev,'-map',f'{len(AD)}:a','-shortest']+enc(w,h)+[str(dest)]);report.append(check(dest,w,h))
 run(['-ss','40','-i',str(OUT/f'DiTom-DSS-Flex-Gesamtablauf-{name}-Musik.mp4'),'-frames:v','1','-q:v','3',str(OUT/f'Gesamtablauf-{name}-Vorschau.jpg')])
 run(['-ss','12','-i',str(OUT/f'DiTom-DSS-Flex-Werbung-{name}.mp4'),'-frames:v','1','-q:v','3',str(OUT/f'Werbung-{name}-Vorschau.jpg')])
(SRC/'finish-report.json').write_text(json.dumps(report,indent=1),encoding='utf-8')
# Gallery section (replaced on every run).
g=OUT/'Videos-ansehen.html';page=g.read_text(encoding='utf-8');rev={r['file']:r['revision'] for r in report}
def card(title,file,poster,w,h):
 r=next(x for x in report if x['file']==file);return f'<article><h2>{title}</h2><video controls preload="metadata" poster="{poster}?v={rev[file]}" src="{file}?v={rev[file]}"></video><p>{w} × {h} · {round(r["duration"])} Sekunden · {r["bytes"]/1e6:.1f} MB</p><a download href="{file}?v={rev[file]}">MP4 herunterladen</a></article>'
cards=[]
for name,w,h in FMT:
 label='YouTube' if name=='YouTube' else 'Reel / Instagram'
 cards+=[card(f'{label} · Mit Sprecher',f'DiTom-DSS-Flex-Gesamtablauf-{name}-Sprecher.mp4',f'Gesamtablauf-{name}-Vorschau.jpg',w,h),
  card(f'{label} · Nur Musik',f'DiTom-DSS-Flex-Gesamtablauf-{name}-Musik.mp4',f'Gesamtablauf-{name}-Vorschau.jpg',w,h),
  card(f'{label} · Werbespot',f'DiTom-DSS-Flex-Werbung-{name}.mp4',f'Werbung-{name}-Vorschau.jpg',w,h)]
section=('<!-- gesamtablauf:start --><h2 id="gesamtablauf">Neu: Gesamtablauf – Fräsen, Einbau im Schacht, Sanierung</h2>'
 '<p>Zuerst fräst der Roboter Einragung und Wurzeln zurück, dann werden Roboter und Schalung vom LKW mit Säulenkran über den Schacht eingebaut, danach folgt die Sanierung mit starkem Wassereintritt (Stufe „stark“). Sprecher: synthetische deutsche Stimme; Musik: eigene Komposition. Darstellung, keine Herstelleranleitung.</p>'
 '<section>'+''.join(cards)+'</section><!-- gesamtablauf:end -->')
page=re.sub(r'<!-- gesamtablauf:start -->.*?<!-- gesamtablauf:end -->','',page,flags=re.S)
page=page.replace('<!-- trailer-film:start -->',section+'<!-- trailer-film:start -->',1);g.write_text(page,encoding='utf-8')
print(json.dumps([(r['file'],r['duration'],round(r['bytes']/1e6,1),r['audioPeakDB']) for r in report],indent=0))
