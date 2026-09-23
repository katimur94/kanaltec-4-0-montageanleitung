"""Web versions of the realistic DSS-Flex films and the trailer walk-through for GitHub Pages.

Masters come from the local production folder next to the repository
(../Videos-Realistisch-2026, not versioned). Output: Videos/DSS-Flex-Verfahren-2026
with MP4s under 49 MB, preview stills, contact sheets, pruefbericht.json and the
gallery page (the closure-film section of the existing page is kept).
"""
import hashlib, html, json, re, subprocess
from pathlib import Path
from PIL import Image, ImageDraw

FF = 'ffmpeg'
SRC = Path('../Videos-Realistisch-2026')
OUT = Path('Videos/DSS-Flex-Verfahren-2026')
TMP = Path('work/qa/video'); TMP.mkdir(parents=True, exist_ok=True)
formats = [('YouTube', 'YouTube-FullHD', 1920, 1080, '2900k'), ('Reels-Shorts', 'Reels-Shorts', 1080, 1920, '2900k'), ('Facebook-Feed', 'Facebook-Feed', 1080, 1350, '1900k')]


def probe(path):
    r = subprocess.run([FF, '-hide_banner', '-xerror', '-i', str(path), '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True, errors='replace')
    if r.returncode:
        raise RuntimeError(r.stderr[-1500:])
    return r.stderr


def item_for(dest, fmt, w, h, dur):
    meta = probe(dest)
    assert f'{w}x{h}' in meta and '30 fps' in meta and 'h264' in meta and 'aac' in meta, dest
    assert dest.stat().st_size < 49_000_000, dest
    peak = float(re.search(r'max_volume: ([\-\d.]+) dB', meta)[1])
    assert peak < 0, dest
    return {'file': dest.name, 'format': fmt, 'width': w, 'height': h, 'fps': 30, 'duration': dur, 'bytes': dest.stat().st_size,
            'audioPeakDB': peak, 'fullDecode': 'passed', 'revision': hashlib.sha256(dest.read_bytes()).hexdigest()[:12]}


def stills(dest, name, w, h, dur):
    times = [t for t in [1.5, 5.5, 11, 17.5, 23, 27.5, 31, 35, 41, 47, 55, 61, 65, 69, 71.5, 75.5] if t < dur]
    tw = 400 if w > h else 250; th = round(tw * h / w)
    sheet = Image.new('RGB', (tw * 4, (th + 26) * 4), '#e8edef'); draw = ImageDraw.Draw(sheet)
    for i, t in enumerate(times):
        still = TMP / f'web-{name}-{i}.jpg'
        subprocess.run([FF, '-v', 'error', '-y', '-ss', str(t), '-i', str(dest), '-frames:v', '1', '-vf', f'scale={tw}:{th}', str(still)], check=True)
        sheet.paste(Image.open(still), (i % 4 * tw, i // 4 * (th + 26))); draw.text((i % 4 * tw + 7, i // 4 * (th + 26) + th + 5), f'{t:g} s', fill='#173343')
    sheet.save(OUT / f'{name}-Kontaktbogen.jpg', quality=90)
    subprocess.run([FF, '-v', 'error', '-y', '-ss', '6.5' if name != 'Sanierungsanhaenger' else '9', '-i', str(dest), '-frames:v', '1', '-vf', f'scale={tw * 2}:-2', '-q:v', '3', str(OUT / f'{name}-Vorschau.jpg')], check=True)


report = []
for name, master, w, h, rate in formats:
    for suffix, folder in [('Sprecher', 'Mit-Sprecher'), ('Musik', 'Ohne-Sprecher')]:
        src = SRC / folder / f'DiTom-DSS-Flex-Verfahren-{master}-{suffix}.mp4'
        dest = OUT / f'DiTom-DSS-Flex-Verfahren-{name}-{suffix}.mp4'
        subprocess.run([FF, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(src), '-map', '0:v:0', '-map', '0:a:0', '-c:v', 'libx264', '-preset', 'slow',
                        '-b:v', rate, '-maxrate', rate, '-bufsize', str(int(rate[:-1]) * 2) + 'k', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-g', '60',
                        '-c:a', 'copy', '-movflags', '+faststart', str(dest)], check=True)
        report.append(item_for(dest, name, w, h, 78)); print(report[-1], flush=True)
    stills(OUT / f'DiTom-DSS-Flex-Verfahren-{name}-Musik.mp4', name, w, h, 78)

trailer_src = SRC / 'Anhaenger' / 'DSS-Flex-Sanierungsanhaenger-Rundgang.mp4'
trailer = OUT / 'DiTom-DSS-Flex-Sanierungsanhaenger-Rundgang.mp4'
trailer.write_bytes(trailer_src.read_bytes())
report.append(item_for(trailer, 'Sanierungsanhaenger', 1920, 1080, 78)); print(report[-1], flush=True)
stills(trailer, 'Sanierungsanhaenger', 1920, 1080, 78)
(OUT / 'pruefbericht.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')


def card(item, label, poster):
    url = f'{item["file"]}?v={item["revision"]}'
    return (f'<article><h2>{html.escape(label)}</h2><video controls preload="metadata" poster="{poster}?v={item["revision"]}" src="{url}"></video>'
            f'<p>{item["width"]} × {item["height"]} · {item["duration"]} Sekunden · {item["bytes"] / 1048576:.1f} MB</p><a download href="{url}">MP4 herunterladen</a></article>')


films = [card(i, i['file'].replace('DiTom-DSS-Flex-Verfahren-', '').replace('.mp4', '').replace('-Sprecher', ' · Mit Sprecher').replace('-Musik', ' · Ohne Sprecher, mit Musik'), f'{i["format"]}-Vorschau.jpg') for i in report[:-1]]
tr = report[-1]
trailer_section = ('<!-- trailer-film:start --><h2 id="trailer">Neu: DSS-Flex Sanierungsanhänger – Rundgang</h2><p>Aufbau in Arbeitsstellung, Mischpumpe über die Rampen unter die Markise, '
                   'Einstieg über den Klapptritt, Technikfach, Schalungen, Werkbank und Heck · Nur Musik, kein Sprecher · '
                   '<a href="../../DSS-Flex-Sanierungsanhaenger.html">Anhänger interaktiv in 3D ansehen</a></p><section>'
                   + card(tr, 'Sanierungsanhänger · Rundgang · Nur Musik', 'Sanierungsanhaenger-Vorschau.jpg') + '</section><!-- trailer-film:end -->')
gallery = OUT / 'Videos-ansehen.html'
old = gallery.read_text(encoding='utf-8') if gallery.exists() else ''
closure = re.search(r'<!-- closure-films:start -->.*?<!-- closure-films:end -->', old, re.S)
page = ('<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>DiTom · DSS-Flex Verfahren</title>'
        '<style>body{font:17px system-ui;margin:0;background:#111b25;color:#e9f1f7}main{max-width:1400px;margin:auto;padding:36px}h1{font-size:32px}'
        'section{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:24px}article{background:#1d2c39;padding:22px;border-radius:16px}'
        'h2{font-size:20px}video{width:100%;height:340px;background:#14232c;border-radius:8px}p{color:#abc0d0}a{color:#6bbef0}footer{margin:32px 0}</style>'
        '<main><p><a href="../../index.html">3D-Animation</a> · <a href="../../DSS-Flex-Sanierungsanhaenger.html">Sanierungsanhänger 3D</a> · '
        '<a download href="../../Praesentationen/DSS-Flex-Verfahren.pptx">PowerPoint (Stand 17.09.2026)</a></p>'
        '<h1>DiTom · DSS-Flex Verfahren</h1><p>Stand 23.09.2026 · Originales DiTom-Logo · Realistische Darstellung: verzweigte Wurzeln aus dem Hohlraum, Infiltration, '
        'Fräsgut, Restwasser über und neben der Bumper-Platte.</p>'
        + trailer_section + (closure[0] if closure else '')
        + '<h2>Anschluss mit Blase offen halten · Realistische Fassung</h2><section>' + ''.join(films) + '</section>'
        '<footer>Deutsche synthetische Sprecherstimme und eigens erzeugte Instrumentalmusik. Schematische Verfahrensdarstellung auf Basis des aktuellen 3D-Modells. '
        'YouTube-Originale in 4K liegen lokal in der Produktion; hier Web-Fassungen.</footer></main></html>')
gallery.write_text(page, encoding='utf-8')
print(f'{len(report)} videos validated; gallery written.')
