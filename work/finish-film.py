import json,subprocess,sys,re,html
from pathlib import Path
sys.path.insert(0,str(Path('work/qa/video-runtime').resolve()))
import imageio_ffmpeg
from PIL import Image,ImageDraw
FF=imageio_ffmpeg.get_ffmpeg_exe();OUT=Path('Videos/DSS-Flex-Verfahren-2026');TMP=Path('work/qa/video')
formats=[('YouTube',1920,1080),('Reels-Shorts',1080,1920),('Facebook-Feed',1080,1350)]
if len(sys.argv)>1:formats=[f for f in formats if f[0] in sys.argv[1:]]
report=[]
for name,w,h in formats:
 for suffix,audio,target in [('Sprecher','narrated',-16),('Musik','music',-20)]:
  dest=OUT/f'DiTom-DSS-Flex-Verfahren-{name}-{suffix}.mp4'
  if not dest.exists() or dest.stat().st_mtime < max((TMP/f'{name}-silent.mp4').stat().st_mtime,(TMP/f'{audio}.wav').stat().st_mtime):subprocess.run([FF,'-y','-hide_banner','-loglevel','error','-i',str(TMP/f'{name}-silent.mp4'),'-i',str(TMP/f'{audio}.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-af',f'loudnorm=I={target}:TP=-1.5:LRA=9','-ar','48000','-ac','2','-t','78','-movflags','+faststart',str(dest)],check=True)
  check=subprocess.run([FF,'-hide_banner','-i',str(dest),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,errors='replace')
  if check.returncode:raise RuntimeError(check.stderr[-1500:])
  metadata=check.stderr
  assert f'{w}x{h}' in metadata and '30 fps' in metadata and 'h264' in metadata and 'aac' in metadata
  assert 'Subtitle:' not in metadata
  volume=re.search(r'max_volume: ([\-\d.]+) dB',metadata);peak=float(volume[1]) if volume else None
  if peak is None or peak>=0:raise RuntimeError('Audio peak validation failed')
  item={'file':dest.name,'format':name,'width':w,'height':h,'fps':30,'duration':78,'bytes':dest.stat().st_size,'audioPeakDB':peak,'fullDecode':'passed','subtitleTracks':0};report.append(item);print(item,flush=True)
 # Contact sheet is extracted from the actual final encoded movie.
 times=[1.5,5.5,11,17.5,24,27.5,34,38.5,45,55,58.8,61,65,69,71.5,75.5];thumbw=400 if w>h else 250;thumbh=round(thumbw*h/w)
 sheet=Image.new('RGB',(thumbw*4,(thumbh+26)*4),'#e8edef');draw=ImageDraw.Draw(sheet)
 for i,t in enumerate(times):
  still=TMP/f'{name}-encoded-{i}.jpg';subprocess.run([FF,'-v','error','-y','-ss',str(t),'-i',str(dest),'-frames:v','1','-vf',f'scale={thumbw}:{thumbh}',str(still)],check=True)
  if i==0:Image.open(still).save(OUT/f'{name}-Vorschau.jpg',quality=92)
  sheet.paste(Image.open(still),(i%4*thumbw,i//4*(thumbh+26)));draw.text((i%4*thumbw+7,i//4*(thumbh+26)+thumbh+5),f'{t:g} s',fill='#173343')
 sheet.save(OUT/f'{name}-Kontaktbogen.jpg',quality=90)
(OUT/'pruefbericht.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
cards=[]
for item in report:
 label=item['file'].replace('DiTom-DSS-Flex-Verfahren-','').replace('.mp4','').replace('-Sprecher',' · Mit Sprecher').replace('-Musik',' · Ohne Sprecher, mit Musik')
 cards.append(f'<article><h2>{html.escape(label)}</h2><video controls preload="metadata" poster="{item["format"]}-Vorschau.jpg" src="{item["file"]}"></video><p>{item["width"]} × {item["height"]} · 78 Sekunden · {item["bytes"]/1048576:.1f} MB</p><a download href="{item["file"]}">MP4 herunterladen</a></article>')
(OUT/'Videos-ansehen.html').write_text('''<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>DiTom · DSS-Flex Verfahren</title><style>body{font:17px system-ui;margin:0;background:#111b25;color:#e9f1f7}main{max-width:1400px;margin:auto;padding:36px}h1{font-size:32px}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:24px}article{background:#1d2c39;padding:22px;border-radius:16px}h2{font-size:20px}video{width:100%;height:340px;background:#14232c;border-radius:8px}p{color:#abc0d0}a{color:#6bbef0}footer{margin:32px 0}</style><main><p><a href="../../index.html">3D-Animation</a> · <a download href="../../Praesentationen/DSS-Flex-Verfahren.pptx">PowerPoint herunterladen</a></p><h1>DiTom · DSS-Flex Verfahren</h1><p>Aktueller Animationsstand · Originales DiTom-Logo · Fräsen und Sanierung ohne Explosionsansicht.</p><section>'''+''.join(cards)+'''</section><footer>Deutsche synthetische Sprecherstimme und eigens erzeugte Instrumentalmusik. Schematische Verfahrensdarstellung auf Basis des aktuellen 3D-Modells.</footer></main></html>''',encoding='utf-8')
print(f'{len(report)} videos decoded and validated; local gallery ready.')
