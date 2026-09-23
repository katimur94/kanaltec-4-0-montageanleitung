"""Film version of the DiTom logo: the registered mark (R) carries an opaque
black fill between ring and letter, which shows as a black disc on dark video.
Only inside the mark are near-black pixels keyed out; everything else is the
unchanged original. Usage: python work/clean-logo.py  ->  src/logo-film.png"""
from PIL import Image

src = Image.open('src/logo-transparent.png').convert('RGBA')
W, H = src.size
px = src.load()
# Locate the mark: the right-most separate run of red columns in the top band
# (left of it is the letter "m", which must stay untouched).
red = lambda x, y: px[x, y][3] > 200 and px[x, y][0] > 150 and px[x, y][1] < 90 and px[x, y][2] < 90
band = range(0, int(H * .45))
cols = [any(red(x, y) for y in band) for x in range(W)]
x1 = max(x for x in range(W) if cols[x])
x0 = x1
while x0 > 0 and cols[x0 - 1]:
    x0 -= 1
xs, ys = [], []
for y in band:
    for x in range(x0, x1 + 1):
        if red(x, y):
            xs.append(x); ys.append(y)
cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
radius = max(max(xs) - min(xs), max(ys) - min(ys)) / 2
out = src.copy()
o = out.load()
for y in range(int(cy - radius - 3), int(cy + radius + 4)):
    for x in range(int(cx - radius - 3), int(cx + radius + 4)):
        if not (0 <= x < W and 0 <= y < H):
            continue
        if (x - cx) ** 2 + (y - cy) ** 2 > (radius * .93) ** 2:
            continue  # keep the outer bevel and outline of the ring
        r, g, b, a = o[x, y]
        level = max(r, g, b)
        keep = min(1.0, max(0.0, (level - 28) / 55))
        o[x, y] = (r, g, b, round(a * keep))
out.save('src/logo-film.png', optimize=True)
print(f'mark at ({cx:.0f},{cy:.0f}) r={radius:.0f}; wrote src/logo-film.png')
