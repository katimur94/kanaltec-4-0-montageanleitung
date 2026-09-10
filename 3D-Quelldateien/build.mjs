// Baut aus den Quellteilen die fertige HTML-Seite.
// Aufruf im Ordner 3D-Quelldateien:  node build.mjs
// Ergebnis: ../Kanaltec_4_0_Montageanleitung_3D.html und ../index.html (identisch)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const rd = f => fs.readFileSync(path.join(here, f), 'utf8');
const three = rd('three.min.js');
const orbit = rd('OrbitControls.js');
const tut = fs.existsSync(path.join(here, 'tutorial.html')) ? rd('tutorial.html') : '';
const p1 = rd('part1_head.html').replace('<!--TUTORIAL-->', tut);
const p2 = rd('part2_data.js');
const p3 = rd('part3_app.js');
const cut = p1.indexOf('</style>') + '</style>'.length;
const head = p1.slice(0, cut), body = p1.slice(cut);
const scripts = '\n<script>' + three + '\n</script>\n<script>' + orbit + '\n</script>\n<script>\n' + p2 + '\n' + p3 + '\n</script>\n';
const html = '<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + head + '\n</head>\n<body>' + body + scripts + '</body>\n</html>\n';
const out1 = path.join(here, '..', 'Kanaltec_4_0_Montageanleitung_3D.html');
const out2 = path.join(here, '..', 'index.html');
fs.writeFileSync(out1, html);
fs.writeFileSync(out2, html);
console.log('geschrieben:', out1, 'und index.html,', Math.round(html.length / 1024), 'KB');
