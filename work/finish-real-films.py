"""Mux the cinematic renders with the existing narration/music tracks, decode-check
every file, and write contact sheets. Usage: python work/finish-real-films.py OUTDIR
Audio is copied bit-exact from the approved 78 s narration and music mixes."""
import json, re, subprocess, sys, hashlib
from pathlib import Path
from PIL import Image, ImageDraw

FF = 'ffmpeg'
TMP = Path('work/qa/video')
AUDIO = Path('work/qa/audio')
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else 'work/qa/final')
OUT.mkdir(parents=True, exist_ok=True)
# (name, width, height, source master, crf, maxrate): platform-friendly bitrates
# from the near-lossless render master (YouTube recommends 35-45 Mbit/s for 4K30).
formats = [('YouTube-4K', 3840, 2160, 'YouTube', 17, '45M'), ('YouTube-FullHD', 1920, 1080, 'YouTube', 17, '16M'),
           ('Reels-Shorts', 1080, 1920, 'Reels-Shorts', 18, '14M'), ('Facebook-Feed', 1080, 1350, 'Facebook-Feed', 18, '12M')]
if len(sys.argv) > 2:
    formats = [f for f in formats if f[0] in sys.argv[2:]]
report = []
for name, w, h, master, crf, maxrate in formats:
    silent = TMP / f'{master}-silent.mp4'
    video = TMP / f'{name}-delivery.mp4'
    bufsize = str(int(maxrate[:-1]) * 2) + 'M'
    subprocess.run([FF, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(silent), '-an', '-vf', f'scale={w}:{h}:flags=lanczos,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf), '-maxrate', maxrate, '-bufsize', bufsize, '-profile:v', 'high',
                    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-g', '60', str(video)], check=True)
    for suffix, audio in [('Sprecher', 'sprecher.m4a'), ('Musik', 'musik.m4a')]:
        # Separate folders: with narration and music only (no narrator).
        folder = OUT / ('Mit-Sprecher' if suffix == 'Sprecher' else 'Ohne-Sprecher')
        folder.mkdir(parents=True, exist_ok=True)
        dest = folder / f'DiTom-DSS-Flex-Verfahren-{name}-{suffix}.mp4'
        subprocess.run([FF, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(video), '-i', str(AUDIO / audio),
                        '-map', '0:v:0', '-map', '1:a:0', '-c', 'copy', '-t', '78', '-movflags', '+faststart',
                        '-metadata', 'title=DiTom · DSS-Flex Verfahren', '-metadata:s:a:0', 'language=deu', str(dest)], check=True)
        check = subprocess.run([FF, '-hide_banner', '-xerror', '-i', str(dest), '-af', 'volumedetect', '-f', 'null', '-'],
                               capture_output=True, text=True, errors='replace')
        if check.returncode:
            raise RuntimeError(check.stderr[-1500:])
        meta = check.stderr
        assert f'{w}x{h}' in meta and '30 fps' in meta and 'h264' in meta and 'aac' in meta, meta[-800:]
        assert 'Subtitle:' not in meta and 'Duration: 00:01:18.0' in meta, meta[-800:]
        peak = float(re.search(r'max_volume: ([\-\d.]+) dB', meta)[1])
        assert peak < 0
        item = {'file': f'{folder.name}/{dest.name}', 'format': name, 'width': w, 'height': h, 'fps': 30, 'duration': 78,
                'bytes': dest.stat().st_size, 'mbit': round(dest.stat().st_size * 8 / 78 / 1e6, 1),
                'audioPeakDB': peak, 'fullDecode': 'passed', 'sha256': hashlib.sha256(dest.read_bytes()).hexdigest()[:12]}
        report.append(item)
        print(item, flush=True)
    # Contact sheet from the final encoded movie, not from the renderer.
    times = [1.5, 4, 6.5, 9, 12, 17.5, 23, 27.5, 31, 35, 41, 47, 55, 61, 65, 69, 71.5, 75.5]
    tw = 400 if w > h else 225
    th = round(tw * h / w)
    cols = 6
    rows = (len(times) + cols - 1) // cols
    sheet = Image.new('RGB', (tw * cols, (th + 26) * rows), '#0d141b')
    draw = ImageDraw.Draw(sheet)
    for i, t in enumerate(times):
        still = TMP / f'{name}-final-{i}.jpg'
        subprocess.run([FF, '-v', 'error', '-y', '-ss', str(t), '-i', str(dest), '-frames:v', '1', '-vf', f'scale={tw}:{th}', str(still)], check=True)
        sheet.paste(Image.open(still), (i % cols * tw, i // cols * (th + 26)))
        draw.text((i % cols * tw + 7, i // cols * (th + 26) + th + 6), f'{t:g} s', fill='#9fc3da')
    sheet.save(OUT / f'{name}-Kontaktbogen.jpg', quality=90)
    subprocess.run([FF, '-v', 'error', '-y', '-ss', '6.5', '-i', str(dest), '-frames:v', '1', '-q:v', '2', str(OUT / f'{name}-Vorschau.jpg')], check=True)
previous = json.loads((OUT / 'pruefbericht.json').read_text(encoding='utf-8')) if (OUT / 'pruefbericht.json').exists() else []
names = {r['file'] for r in report}
merged = [r for r in previous if r.get('file') not in names and '/' in r.get('file', '')] + report
(OUT / 'pruefbericht.json').write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'{len(report)} videos decoded and validated in {OUT}')
