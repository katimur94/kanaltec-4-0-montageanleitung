"""Finish the film "Verpressen hinter dem Liner" (1920x1080, 66 s, narrated).
Input: render chunks in work/qa/liner/chunks2 (render-komplett-film.mjs --studio=work/qa/liner/studio)
and work/qa/liner/audio/film-narrated.wav (work/liner-audio.py).
Output: Videos/DSS-Flex-Verfahren-2026/DiTom-Verpressen-hinter-dem-Liner.mp4 (+ preview), decoded completely."""
import json,re,subprocess,sys
from pathlib import Path
sys.path.insert(0,str(Path('work/qa/video-runtime').resolve()))
import imageio_ffmpeg
FF=imageio_ffmpeg.get_ffmpeg_exe();SRC=Path('work/qa/liner');OUT=Path('Videos/DSS-Flex-Verfahren-2026')
def run(a):
 r=subprocess.run([FF,'-hide_banner','-y','-loglevel','error']+a,capture_output=True,text=True)
 if r.returncode:raise RuntimeError(r.stderr[-1500:])
parts=sorted((SRC/'chunks2').glob('YouTube-*-silent.mp4'),key=lambda p:int(p.name.split('-')[1]))
assert [int(p.name.split('-')[1]) for p in parts]==list(range(0,66,6)),parts
lst=SRC/'chunks2'/'list.txt';lst.write_text(''.join(f"file '{p.resolve()}'\n" for p in parts))
master=SRC/'YouTube-silent.mp4';run(['-f','concat','-safe','0','-i',str(lst),'-c','copy',str(master)])
dest=OUT/'DiTom-Verpressen-hinter-dem-Liner.mp4'
run(['-i',str(master),'-i',str(SRC/'audio'/'film-narrated.wav'),'-map','0:v','-map','1:a','-shortest','-c:v','libx264','-preset','slow','-crf','19','-maxrate','9000k','-bufsize','18000k',
 '-pix_fmt','yuv420p','-r','25','-c:a','aac','-b:a','192k','-movflags','+faststart',str(dest)])
r=subprocess.run([FF,'-hide_banner','-xerror','-i',str(dest),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,errors='replace');assert r.returncode==0,r.stderr[-800:]
info=dict(size=dest.stat().st_size,peak=float(re.search(r'max_volume: ([\-\d.]+) dB',r.stderr)[1]),res='1920x1080' in r.stderr,dur=re.search(r'Duration: ([\d:.]+)',r.stderr)[1])
assert info['res'] and info['size']<49_000_000 and info['peak']<0,info
run(['-ss','38','-i',str(dest),'-frames:v','1','-q:v','3',str(OUT/'Liner-Verpressen-Vorschau.jpg')])
print(json.dumps(info))
