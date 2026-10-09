"""Sprecher, Zeitplan und Ton für den Film „Laser-Positionierhilfe – Anbau und Einsatz“.

python work/laser-anbau-audio.py --speak   Sprecher je Szene erzeugen (edge-tts, de-DE-ConradNeural),
                                           Längen messen, Zeitplan work/qa/laser-anbau/timeline.json schreiben
python work/laser-anbau-audio.py --mix     eigene Musik + Sprecher mischen -> audio/narrated.wav, audio/music.wav

Die Szenendauer richtet sich nach der Sprecherlänge (mindestens script.min). Musik: eigene
prozedurale Komposition (wie work/komplett-audio.py), keine Fremdmaterialien.
"""
import asyncio, json, os, subprocess, sys, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'work/qa/laser-anbau'
AUD = OUT / 'audio'
AUD.mkdir(parents=True, exist_ok=True)
SR = 48000
SCRIPT = json.loads((ROOT / 'work/laser-anbau-script.json').read_text(encoding='utf-8'))
LEAD, TAIL = .5, .9

def ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return os.environ.get('KANALTEC_FFMPEG', 'ffmpeg')
FF = ffmpeg()

def decode(path):
    raw = subprocess.run([FF, '-v', 'error', '-i', str(path), '-f', 'f32le', '-ar', str(SR), '-ac', '1', 'pipe:1'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<f4')

async def speak():
    import certifi
    ca = '/root/.ccr/ca-bundle.crt'
    if os.path.exists(ca):
        certifi.where = lambda: ca
    import edge_tts.communicate as c
    if os.path.exists(ca) and hasattr(c, '_SSL_CTX'):
        import ssl
        c._SSL_CTX = ssl.create_default_context(cafile=ca)
    for s in SCRIPT['shots']:
        text = s.get('say', s['text'])
        dest, stamp = AUD / f'{s["id"]}.mp3', AUD / f'{s["id"]}.txt'
        if dest.exists() and stamp.exists() and stamp.read_text(encoding='utf-8') == text:
            continue
        await c.Communicate(text, 'de-DE-ConradNeural', rate='-2%').save(str(dest))
        stamp.write_text(text, encoding='utf-8')

def timeline():
    t, rows = 0.0, []
    for s in SCRIPT['shots']:
        voice = len(decode(AUD / f'{s["id"]}.mp3')) / SR
        dur = round(max(s['min'], LEAD + voice + TAIL), 2)
        rows.append({**s, 'start': round(t, 3), 'end': round(t + dur, 3), 'voiceStart': round(t + LEAD, 3), 'voice': round(voice, 2)})
        t += dur
    tl = {'title': SCRIPT['title'], 'dn': SCRIPT['dn'], 'duration': round(t, 3), 'shots': rows}
    (OUT / 'timeline.json').write_text(json.dumps(tl, ensure_ascii=False, indent=1), encoding='utf-8')
    return tl

def music(duration, seed=9102026):
    n = int(SR * duration); m = np.zeros((n, 2), np.float32); rng = np.random.default_rng(seed)
    def add(at, s, pan=0):
        st = int(at * SR); k = min(len(s), n - st)
        if k > 0:
            m[st:st + k, 0] += s[:k] * np.sqrt((1 - pan) / 2); m[st:st + k, 1] += s[:k] * np.sqrt((1 + pan) / 2)
    def note(f, d, kind='pad'):
        t = np.arange(int(d * SR)) / SR
        if kind == 'pad':
            return (.55 * np.sin(2 * np.pi * f * t) + .18 * np.sin(4 * np.pi * f * t) + .13 * np.sin(2 * np.pi * f * 1.003 * t)) * np.minimum(t / .5, 1) * np.minimum((d - t) / .8, 1)
        return (np.sin(2 * np.pi * f * t) + .22 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 5) * np.minimum(t / .008, 1)
    # ruhiger als der Werbespot: Pad, leise Plucks, weicher Puls
    chords = [[146.83, 174.61, 220], [130.81, 164.81, 196], [116.54, 146.83, 174.61], [130.81, 174.61, 220]]
    beat = 60 / 96; bar = beat * 4
    for b in range(int(duration / bar) + 1):
        ch = chords[(b // 2) % 4]; at = b * bar; build = min(1, b / 3)
        for j, f in enumerate(ch):
            add(at, note(f, bar * 1.1) * .05, (j - 1) * .4)
        for j in range(8):
            add(at + j * beat / 2, note(ch[[0, 1, 2, 1, 0, 2, 1, 2][j]] * 2, beat * .8, 'pluck') * .04 * build, np.sin(j) * .45)
        for j in range(4):
            t = np.arange(int(.22 * SR)) / SR
            add(at + j * beat, np.sin(2 * np.pi * (48 * t + 10 * (1 - np.exp(-t * 28)))) * np.exp(-t * 18) * .07 * build)
            add(at + j * beat, note(ch[0] / 2, beat * .8, 'pluck') * .07)
    for at in (.3, duration - 4.2):
        for j, f in enumerate([293.66, 349.23, 440, 587.33]):
            add(at + j * .16, note(f, 1.8, 'pluck') * .10, (j - 1.5) * .2)
    t = np.arange(n) / SR
    m *= (np.minimum(t / .7, 1) * np.minimum((duration - t) / 1.4, 1))[:, None]
    return m / max(1, float(np.max(np.abs(m))) / .5)

def wav(path, data):
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes((np.clip(data, -.99, .99) * 32767).astype('<i2').tobytes())

def mix(tl):
    m = music(tl['duration']); n = len(m)
    voice = np.zeros(n, np.float32); duck = np.ones(n, np.float32)
    for s in tl['shots']:
        d = decode(AUD / f'{s["id"]}.mp3'); d = d / max(float(np.max(np.abs(d))), .01) * .7
        st = int(s['voiceStart'] * SR); k = min(len(d), n - st); voice[st:st + k] += d[:k]
        duck[max(0, st - int(.15 * SR)):min(n, st + k + int(.3 * SR))] = .3
    p = np.arange(0, n, 480)
    duck = np.interp(np.arange(n), p, np.convolve(duck[p], np.ones(21) / 21, 'same')).astype(np.float32)
    x = m * duck[:, None] + voice[:, None]
    wav(AUD / 'narrated.wav', x * min(1, .92 / max(.01, float(np.max(np.abs(x))))))
    wav(AUD / 'music.wav', m * (.85 / max(.01, float(np.max(np.abs(m))))))

if __name__ == '__main__':
    if '--speak' in sys.argv:
        asyncio.run(speak())
        tl = timeline()
        print(f'Dauer {tl["duration"]:.1f} s')
        for s in tl['shots']:
            print(f'{s["id"]:6} {s["start"]:6.1f}–{s["end"]:6.1f}  Sprecher {s["voice"]:.1f} s')
    if '--mix' in sys.argv:
        mix(json.loads((OUT / 'timeline.json').read_text(encoding='utf-8')))
        print('Ton gemischt:', AUD / 'narrated.wav')
