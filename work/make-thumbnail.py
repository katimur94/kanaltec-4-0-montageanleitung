"""YouTube thumbnail (1280x720) from the final 4K film: root intrusion close-up,
original DiTom logo and product name. Usage: python work/make-thumbnail.py VIDEO OUT.jpg [seconds]"""
import subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

video, out = sys.argv[1], Path(sys.argv[2])
t = sys.argv[3] if len(sys.argv) > 3 else '6.8'
frame = out.with_suffix('.frame.png')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', t, '-i', video, '-frames:v', '1', str(frame)], check=True)
# Crop away the small logo burnt into the film frame (top left), keep 16:9.
src = Image.open(frame).convert('RGB')
W, H = src.size
x0, y0 = round(W * .146), round(H * .139)
w = W - x0
img = src.crop((x0, y0, x0 + w, y0 + round(w * 9 / 16))).resize((1280, 720), Image.LANCZOS)
# Darken the left third for the title; keep the roots on the right bright.
shade = Image.new('L', (1280, 720))
d = ImageDraw.Draw(shade)
for x in range(1280):
    d.line([(x, 0), (x, 720)], fill=int(205 * max(0, 1 - x / 700) ** 1.6))
img = Image.composite(Image.new('RGB', img.size, '#05090d'), img, shade)
logo = Image.open('src/logo-film.png').convert('RGBA')
lw = 420
logo = logo.resize((lw, round(lw * logo.height / logo.width)), Image.LANCZOS)
glow = Image.new('RGBA', img.size, (0, 0, 0, 0))
glow.paste(logo, (48, 44), logo)
img = img.convert('RGBA')
img.alpha_composite(glow)
draw = ImageDraw.Draw(img)
def font(names, size):
    for n in names:
        try:
            return ImageFont.truetype(n, size)
        except OSError:
            pass
    return ImageFont.load_default()
bold = font(['C:/Windows/Fonts/segoeuib.ttf', 'arialbd.ttf'], 74)
light = font(['C:/Windows/Fonts/segoeui.ttf', 'arial.ttf'], 38)
draw.text((52, 250), 'DSS-Flex', font=bold, fill='#f2f7fb')
draw.text((52, 330), 'Verfahren', font=bold, fill='#f2f7fb')
draw.rectangle([56, 428, 176, 434], fill='#62b7ec')
draw.text((52, 452), 'Wurzeln & Infiltration', font=light, fill='#d6e5ef')
draw.text((52, 500), 'grabenlos saniert', font=light, fill='#d6e5ef')
img.convert('RGB').save(out, quality=92)
frame.unlink()
print('thumbnail', out)
