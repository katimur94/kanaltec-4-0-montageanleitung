// Walk-through film of the DSS-Flex rehabilitation trailer (music only, no voice).
// Renders DSS-Flex-Sanierungsanhaenger.html?film frame by frame with a scripted camera,
// encodes 1920 × 1080 / 30 fps H.264 and adds the existing music track.
//   node work/render-anhaenger-film.mjs            full film
//   node work/render-anhaenger-film.mjs --qa=5,20  stills at the given seconds
import {createRequire} from 'node:module';
import {spawn, execFileSync} from 'node:child_process';
import {mkdir, writeFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium} = createRequire(path.resolve('work/qa/runtime') + '/package.json')('playwright');
const arg = k => process.argv.find(a => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const FPS = 30, W = 1920, H = 1080, DUR = 78;
const OUT_DIR = path.resolve('../Videos-Realistisch-2026/Anhaenger');
const MUSIC = path.resolve('work/qa/audio/musik.m4a');

// ---------- camera keys: t [s], camera position, look-at target (world metres), fov ----------
const E = 2.38; // eye height inside (floor 0.76 + 1.62)
const keys = [
 [0, [7.6, 2.4, -6.2], [.4, 1.2, 0], 34],
 [3.5, [8.8, 2.2, 1.4], [.2, 1.3, 0], 34],
 [7, [4.8, 2.0, 7.6], [-.4, 1.35, 0], 34],
 [10.5, [-3.4, 2.2, 7.3], [-1.8, 1.3, .2], 36],
 [15, [-8.8, 3.0, 5.0], [-2.6, 1.2, .2], 38],
 [17, [-8.2, 2.2, 3.7], [-3.6, .75, .6], 40],
 [22.5, [-7.3, 1.75, 3.0], [-4.4, .6, .6], 42],
 [25, [-1.2, 1.65, 3.6], [.95, 1.45, 1.1], 58],
 [27, [.95, 1.65, 2.6], [.95, 1.62, 0], 62],
 [28.3, [.95, 2.05, 1.45], [.95, 2.0, 0], 62],
 [29.6, [.95, E, .75], [1.2, 2.2, -.5], 62],
 [31, [.7, E, .1], [2.0, 1.6, -.3], 62],
 [33.5, [.8, E - .02, .05], [1.9, 1.3, -.55], 62],
 [36.5, [.9, E - .02, -.05], [2.15, 1.5, .75], 62],
 [39, [.9, E - .02, 0], [2.52, 1.9, .1], 62],
 [42, [.05, E - .02, .25], [.75, 1.05, -.62], 62],
 [45, [0, E - .02, .25], [.72, 1.95, -.95], 62],
 [48, [.3, E - .08, .2], [-.35, 2.6, -.66], 62],
 [51, [.55, E - .02, -.2], [-.2, 1.55, .72], 62],
 [54.5, [.15, E - .08, -.25], [-.45, 1.6, .75], 62],
 [57.5, [-.6, E - .02, .05], [-1.6, 1.4, -.8], 62],
 [60, [-.95, E - .02, .1], [-1.4, 2.55, -.66], 62],
 [62.5, [-1.2, E - .02, .05], [-2.2, 1.35, -.75], 62],
 [65, [-1.5, E - .02, -.1], [-1.9, 1.9, .95], 62],
 [67.5, [-2.6, 2.3, -.15], [-4.5, 1.6, .4], 60],
 [69.5, [-4.2, 1.65, -.9], [-4.9, .8, .6], 56],
 [72, [-6.2, 1.9, -.6], [-2.4, 1.5, .1], 50],
 [76, [-9.4, 4.6, 6.8], [-1.6, 1.2, 0], 38],
 [78, [-9.8, 4.9, 7.2], [-1.6, 1.2, 0], 38],
];
// ---------- actions (toggle id, on/off at time) ----------
const actions = [[8, 'legs', 1], [9.5, 'doorL', 1], [10, 'doorR', 1], [11, 'awning', 1], [12.5, 'side', 1], [16, 'mixer', 1],
 [31.2, 'genDoor', 1], [35.3, 'box-1', 1], [40.3, 'drawer', 1], [49.3, 'bench-1', 1], [49.9, 'bench-2', 1], [50.5, 'bench-3', 1]];
// ---------- captions ----------
const captions = [
 [7.6, 15, 'Arbeitsstellung in wenigen Handgriffen', 'Stützen runter · Hecktüren 270° an die Seiten · Heckmarkise als Regendach'],
 [16, 23, 'Mischpumpe auf Rollen', 'Über zwei Klapprampen unter die Markise – Mörtel und Strom bleiben trocken'],
 [24, 31, 'Einstieg an der Seitentür', 'Klapptritt, freie Standfläche, Verkehrssicherung und Feuerlöscher griffbereit'],
 [31.6, 40, 'Technik vorn', 'Aggregat 12 kVA im belüfteten Technikfach · Kompressorregal · Unterverteilung'],
 [40.6, 48.8, 'DSS-Flex Schalungen', 'Schwerlastauszug DN 300 / 400 · Wechselschilde am Sattel · Blasen an der Decke'],
 [49.5, 56, 'Werkbank mit Schubladen', 'Messingwinkel, Schildaufnahmen und Kleinteile – wie in der bestehenden Anlage'],
 [56.6, 66, 'Wasser, Hochdruck, Versorgung', '2 × 300 l zwischen den Achsen · Hochdruckreiniger mit Haspel · Trommel und Verteiler'],
 [66.6, 73.4, 'Alles Nasse am Heck', 'Mischplatz, Trommelabgang und Reinigung unter der Markise'],
];
const cards = [[.3, 6.4, 'DSS-Flex Sanierungsanhänger', 'Rundgang durch das Konzept'], [74.2, 78.5, 'DSS-Flex Sanierungsanhänger', 'DiTom GmbH Kanaltechnik · www.ditom-kanaltechnik.de']];

// Catmull-Rom through the keys (time-parametrised), components interpolated independently.
function sample(t) {
 let i = keys.findIndex((k, j) => j < keys.length - 1 && t >= k[0] && t <= keys[j + 1][0]); if (i < 0) i = t < keys[0][0] ? 0 : keys.length - 2;
 const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(keys.length - 1, i + 2)];
 const u = Math.min(1, Math.max(0, (t - k1[0]) / (k2[0] - k1[0]))), s = u * u * (3 - 2 * u) * .35 + u * .65;
 const cr = (a, b, c, d) => {const dt1 = Math.max(1e-3, k2[0] - k1[0]), m1 = (c - a) / Math.max(1e-3, k2[0] - k0[0]) * dt1, m2 = (d - b) / Math.max(1e-3, k3[0] - k1[0]) * dt1, s2 = s * s, s3 = s2 * s; return (2 * s3 - 3 * s2 + 1) * b + (s3 - 2 * s2 + s) * m1 + (-2 * s3 + 3 * s2) * c + (s3 - s2) * m2;};
 const v = idx => [0, 1, 2].map(n => cr(k0[idx][n], k1[idx][n], k2[idx][n], k3[idx][n]));
 return {p: v(1), t: v(2), fov: k1[3] + (k2[3] - k1[3]) * s};
}
const fade = (t, a, b, f = .45) => t < a || t > b ? 0 : Math.min(1, (t - a) / f, (b - t) / f);

const browser = await chromium.launch({channel: 'msedge', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']});
const page = await browser.newPage({viewport: {width: W, height: H}, deviceScaleFactor: 1});
const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
await page.goto(pathToFileURL(path.resolve('DSS-Flex-Sanierungsanhaenger.html')).href + '?film');
await page.waitForFunction(() => window.__trailer && window.__film, null, {timeout: 60000});
await page.waitForTimeout(4500); // real DSS-Flex moulds are inserted after ~1 s
await page.evaluate(() => {const v = window.__trailer; v.filmStart(); v.setOption('roof', true); v.setOption('wall', true); v.setOption('routes', false); v.setOption('dims', false);});
// warm-up frames (shaders, shadow maps)
for (let i = 0; i < 20; i++) await page.evaluate(c => window.__trailer.filmFrame(1 / 30, c), sample(0));

const qa = arg('qa');
await mkdir(OUT_DIR, {recursive: true});
const silent = path.resolve('work/qa/video/anhaenger-rundgang-ohne-ton.mp4'), final = path.join(OUT_DIR, 'DSS-Flex-Sanierungsanhaenger-Rundgang.mp4');
let ff = null;
if (!qa) ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(FPS), '-i', 'pipe:0', '-an',
 '-vf', 'format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-maxrate', '4400k', '-bufsize', '8800k', '-profile:v', 'high', '-g', '60', '-movflags', '+faststart', silent], {windowsHide: true, stdio: ['pipe', 'ignore', 'inherit']});
const qaTimes = qa ? qa.split(',').map(Number) : null;
const total = Math.round(DUR * FPS), done = new Set(), t0 = Date.now();
for (let f = 0; f < total; f++) {
 const t = f / FPS;
 if (qaTimes && !qaTimes.some(q => Math.abs(q - t) < .5 / FPS) && !qaTimes.some(q => q > t)) break;
 const acts = actions.filter(([at], i) => at <= t && !done.has(i)).map(a => {done.add(actions.indexOf(a)); return a;});
 const cap = captions.find(([a, b]) => t >= a - .1 && t <= b + .1), card = cards.find(([a, b]) => t >= a - .1 && t <= b + .1);
 await page.evaluate(({dt, cam, acts, cap, card}) => {
  for (const [, id, on] of acts) window.__trailer.toggle(id, !!on);
  window.__film.caption(cap?.[0], cap?.[1], cap?.[2] || 0); window.__film.card(card?.[0], card?.[1], card?.[2] || 0);
  window.__trailer.filmFrame(dt, cam);
 }, {dt: 1 / FPS, cam: sample(t), acts, cap: cap && [cap[2], cap[3], fade(t, cap[0], cap[1])], card: card && [card[2], card[3], fade(t, card[0], card[1], .6)]});
 if (qaTimes) {if (qaTimes.some(q => Math.abs(q - t) < .5 / FPS)) {await page.screenshot({path: `work/qa/film-${t.toFixed(1)}.jpg`, type: 'jpeg', quality: 90}); console.log('still', t.toFixed(1));} continue;}
 const jpg = await page.screenshot({type: 'jpeg', quality: 92});
 if (!ff.stdin.write(jpg)) await new Promise(r => ff.stdin.once('drain', r));
 if (f % 150 === 0) console.log(`frame ${f}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
await browser.close();
if (errors.length) console.log('page errors:', errors.slice(0, 5));
if (ff) {
 ff.stdin.end(); await new Promise(r => ff.on('close', r));
 execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-i', silent, '-i', MUSIC, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k',
  '-af', `afade=t=in:st=0:d=0.8,afade=t=out:st=${DUR - 3}:d=3`, '-t', String(DUR), '-movflags', '+faststart', final], {stdio: 'inherit'});
 console.log('written', final, ((await stat(final)).size / 1048576).toFixed(1), 'MB');
}
