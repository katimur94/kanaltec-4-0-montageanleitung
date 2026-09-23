// Builds the self-contained trailer concept page:
//   DSS-Flex-Sanierungsanhaenger.html  (complete document, works offline)
//   work/qa/anhaenger-artifact.html     (page body for the Artifact viewer)
import esbuild from 'esbuild';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
await mkdir('work/qa', {recursive: true});
// Small copy of the cleaned film logo for the header.
execFileSync('python', ['-c', "from PIL import Image;im=Image.open('src/logo-film.png');w=480;im.resize((w,round(w*im.height/im.width)),Image.LANCZOS).save('work/qa/logo-anhaenger.png',optimize=True)"]);
// Larger copy for the decals on the trailer sides.
execFileSync('python', ['-c', "from PIL import Image;im=Image.open('src/logo-film.png');w=1400;im.resize((w,round(w*im.height/im.width)),Image.LANCZOS).save('work/qa/logo-decal.png',optimize=True)"]);
// Photos of the existing system, downscaled and embedded as data URLs (EXIF orientation applied).
execFileSync('python', ['-c', `
import base64, io, json, os
from PIL import Image, ImageOps
d = 'anhaenger/Bilder von alte Anlage'; out = {}
for f in sorted(os.listdir(d)):
    if not f.lower().endswith('.jpg'): continue
    im = ImageOps.exif_transpose(Image.open(os.path.join(d, f))).convert('RGB'); im.thumbnail((1000, 1000), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=72, optimize=True, progressive=True)
    out[f] = 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
open('work/qa/anhaenger-photos.js', 'w').write('export const photos = ' + json.dumps(out) + ';\\n')
`]);
const result = await esbuild.build({
 entryPoints: ['anhaenger/app.js'], bundle: true, minify: true, format: 'iife', target: 'es2020', write: false,
 loader: {'.png': 'dataurl'}, legalComments: 'none',
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = await readFile('anhaenger/style.css', 'utf8');
const logo = 'data:image/png;base64,' + (await readFile('work/qa/logo-anhaenger.png')).toString('base64');
const body = (await readFile('anhaenger/page.html', 'utf8')).replace('/*CSS*/', () => css).replace('/*LOGO*/', () => logo).replace('/*JS*/', () => js);
await writeFile('work/qa/anhaenger-artifact.html', body);
const doc = `<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${body.slice(0, body.indexOf('<div class="page">'))}</head>\n<body>\n${body.slice(body.indexOf('<div class="page">'))}</body>\n</html>\n`;
await writeFile('DSS-Flex-Sanierungsanhaenger.html', doc);
console.log('Built DSS-Flex-Sanierungsanhaenger.html', (doc.length / 1048576).toFixed(2), 'MB');
