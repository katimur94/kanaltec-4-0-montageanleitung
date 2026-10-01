"""Finish the formwork motion video (Reel 1080x1920, 30 s, music only).
Input: render chunks in work/qa/schalung/chunks (render-komplett-film.mjs --studio=work/qa/schalung/studio).
Output: Videos/DSS-Flex-Verfahren-2026/DiTom-DSS-Flex-Schalung-Motion-Reel.mp4 (+ preview), decoded completely."""
import importlib.util,json,re,subprocess,sys,wave
from pathlib import Path
sys.path.insert(0,str(Path('work/qa/video-runtime').resolve()))
import numpy as np,imageio_ffmpeg
spec=importlib.util.spec_from_file_location('ka','work/komplett-audio.py');ka=importlib.util.module_from_spec(spec);spec.loader.exec_module(ka)
FF=imageio_ffmpeg.get_ffmpeg_exe();SRC=Path('work/qa/schalung');OUT=Path('Videos/DSS-Flex-Verfahren-2026')
def run(a):
 r=subprocess.run([FF,'-hide_banner','-y','-loglevel','error']+a,capture_output=True,text=True)
 if r.returncode:raise RuntimeError(r.stderr[-1500:])
# Own procedural music, brand tones on the title and end cards.
m=ka.music(30,1102026,[.2,27.2]);m*=.89/max(.01,float(np.max(np.abs(m))));ka.wav(SRC/'music.wav',m)
parts=sorted((SRC/'chunks').glob('Reel-*-silent.mp4'),key=lambda p:int(p.name.split('-')[1]))
lst=SRC/'chunks'/'list.txt';lst.write_text(''.join(f"file '{p.resolve()}'\n" for p in parts))
master=SRC/'Reel-silent.mp4';run(['-f','concat','-safe','0','-i',str(lst),'-c','copy',str(master)])
dest=OUT/'DiTom-DSS-Flex-Schalung-Motion-Reel.mp4'
run(['-i',str(master),'-i',str(SRC/'music.wav'),'-map','0:v','-map','1:a','-shortest','-c:v','libx264','-preset','slow','-crf','19','-maxrate','4500k','-bufsize','9000k',
 '-pix_fmt','yuv420p','-r','25','-c:a','aac','-b:a','160k','-movflags','+faststart',str(dest)])
r=subprocess.run([FF,'-hide_banner','-xerror','-i',str(dest),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,errors='replace');assert r.returncode==0
info=dict(size=dest.stat().st_size,peak=float(re.search(r'max_volume: ([\-\d.]+) dB',r.stderr)[1]),res='1080x1920' in r.stderr,dur=re.search(r'Duration: ([\d:.]+)',r.stderr)[1])
assert info['res'] and info['size']<49_000_000 and info['peak']<0,info
run(['-ss','13','-i',str(dest),'-frames:v','1','-q:v','3',str(OUT/'Schalung-Motion-Vorschau.jpg')])
print(json.dumps(info))
