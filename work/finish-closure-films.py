"""Mux the instrumental score, fully decode exports, and update the public gallery."""
import json,subprocess,sys,re,shutil,os,hashlib
from pathlib import Path
sys.path.insert(0,str(Path('work/qa/video-runtime').resolve()))
from PIL import Image,ImageDraw
FF=os.environ.get('KANALTEC_FFMPEG') or shutil.which('ffmpeg')
if not FF:raise RuntimeError('Set KANALTEC_FFMPEG or install ffmpeg on PATH')
OUT=Path('Videos/DSS-Flex-Verfahren-2026');TMP=Path('work/qa/closure-video')
cases=[('pipe','Loch'),('closure','Anschluss')];report=[];cards=[]
for kind,label in cases:
 dest=OUT/f'DiTom-DSS-Flex-{label}-verschliessen-Musik.mp4'
 silent=TMP/f'{kind}-silent.mp4';music=TMP/'music.wav'
 if not dest.exists() or dest.stat().st_mtime<max(silent.stat().st_mtime,music.stat().st_mtime):
  subprocess.run([FF,'-y','-hide_banner','-loglevel','error','-i',str(silent),'-i',str(music),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-af','loudnorm=I=-20:TP=-1.5:LRA=9','-ar','48000','-ac','2','-t','60','-movflags','+faststart',str(dest)],check=True)
 check=subprocess.run([FF,'-hide_banner','-xerror','-i',str(dest),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,errors='replace')
 if check.returncode:raise RuntimeError(check.stderr[-1500:])
 meta=check.stderr
 assert '1920x1080' in meta and '30 fps' in meta and 'h264' in meta and 'aac' in meta and 'Subtitle:' not in meta
 assert 'Duration: 00:01:00.00' in meta
 peak=float(re.search(r'max_volume: ([\-\d.]+) dB',meta)[1]);assert peak<0
 assert dest.stat().st_size<49_000_000
 item={'file':dest.name,'width':1920,'height':1080,'fps':30,'duration':60,'bytes':dest.stat().st_size,'audioPeakDB':peak,'fullDecode':'passed','subtitleTracks':0,'sound':'Original procedural instrumental only, no speech'}
 report.append(item);print(item,flush=True)
 times=[1.5,5.5,11,14.5,18,22,25.5,29,35,40,44.5,49,52.5,55.5,58.5]
 sheet=Image.new('RGB',(1600,1004),'#e8edef');draw=ImageDraw.Draw(sheet)
 for i,t in enumerate(times):
  still=TMP/f'{kind}-encoded-{i}.jpg'
  subprocess.run([FF,'-v','error','-y','-ss',str(t),'-i',str(dest),'-frames:v','1','-vf','scale=400:225',str(still)],check=True)
  x=i%4*400;y=i//4*251;sheet.paste(Image.open(still),(x,y));draw.text((x+8,y+230),f'{t:g} s',fill='#173343')
 sheet.save(TMP/f'{kind}-encoded-contact.jpg',quality=92)
 poster=f'{label}-verschliessen-Vorschau.jpg'
 subprocess.run([FF,'-v','error','-y','-ss','1.5','-i',str(dest),'-frames:v','1','-vf','scale=960:540',str(OUT/poster)],check=True)
 revision=hashlib.sha256(dest.read_bytes()).hexdigest()[:12]
 url=f'{dest.name}?v={revision}'
 cards.append(f'<article><h2>{label} verschließen · Nur Musik</h2><video controls preload="metadata" poster="{poster}?v={revision}" src="{url}"></video><p>1920 × 1080 · 60 Sekunden · {dest.stat().st_size/1048576:.1f} MB</p><a download href="{url}">MP4 herunterladen</a></article>')
(TMP/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
gallery=OUT/'Videos-ansehen.html';content=gallery.read_text(encoding='utf-8')
content=re.sub(r'<!-- closure-films:start -->.*?<!-- closure-films:end -->','',content,flags=re.S)
section='<!-- closure-films:start --><h2>Neu: Loch und stillgelegten Anschluss verschließen</h2><p>Geschlossene Schalung ohne Anschlussblase · Mittiger Einfüllstutzen · Kompakte, leicht ovale Endfläche · Ohne Einragung direkt verpressen · Nur Musik, kein Sprecher.</p><section>'+''.join(cards)+'</section><!-- closure-films:end -->'
content=content.replace('<section>',section+'<section>',1)
gallery.write_text(content,encoding='utf-8')
print('Two closure films validated and added to the existing gallery.')
