"""Finish the DSS-Flex commercial: join render chunks, add work/qa/werbung/music.wav,
encode Reel 1080x1920 (< 49 MB), decode completely, preview still.
Output: Videos/DSS-Flex-Verfahren-2026/DiTom-DSS-Flex-Werbespot-Motion-Reel.mp4"""
import json,re,subprocess,sys
from pathlib import Path
sys.path.insert(0,str(Path('work/qa/video-runtime').resolve()))
import imageio_ffmpeg
FF=imageio_ffmpeg.get_ffmpeg_exe();SRC=Path('work/qa/werbung');OUT=Path('Videos/DSS-Flex-Verfahren-2026')
def run(a):
 r=subprocess.run([FF,'-hide_banner','-y','-loglevel','error']+a,capture_output=True,text=True)
 if r.returncode:raise RuntimeError(r.stderr[-1500:])
parts=sorted((SRC/'chunks').glob('Reel-*-silent.mp4'),key=lambda p:int(p.name.split('-')[1]))
lst=SRC/'chunks'/'list.txt';lst.write_text(''.join(f"file '{p.resolve()}'\n" for p in parts))
master=SRC/'Reel-silent.mp4';run(['-f','concat','-safe','0','-i',str(lst),'-c','copy',str(master)])
dest=OUT/'DiTom-DSS-Flex-Werbespot-Motion-Reel.mp4'
run(['-i',str(master),'-i',str(SRC/'music.wav'),'-map','0:v','-map','1:a','-shortest','-c:v','libx264','-preset','slow','-crf','18','-maxrate','8000k','-bufsize','16000k',
 '-pix_fmt','yuv420p','-r','25','-c:a','aac','-b:a','192k','-movflags','+faststart',str(dest)])
r=subprocess.run([FF,'-hide_banner','-xerror','-i',str(dest),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,errors='replace');assert r.returncode==0,r.stderr[-500:]
info=dict(size=dest.stat().st_size,peak=float(re.search(r'max_volume: ([\-\d.]+) dB',r.stderr)[1]),res='1080x1920' in r.stderr,dur=re.search(r'Duration: ([\d:.]+)',r.stderr)[1])
assert info['res'] and info['size']<49_000_000 and info['peak']<0,info
run(['-ss','8.6','-i',str(dest),'-frames:v','1','-q:v','3',str(OUT/'Werbespot-Motion-Vorschau.jpg')])
print(json.dumps(info))
