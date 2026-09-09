// Baut Kanaltec_4_0_Montageanleitung_3D.html aus den Quelldateien:  node build.mjs
import fs from 'fs';
const three=fs.readFileSync('three.min.js','utf8');
const orbit=fs.readFileSync('OrbitControls.js','utf8');
const p1=fs.readFileSync('part1_head.html','utf8');   // Layout, CSS, Texte der Dokumentation
const p2=fs.readFileSync('part2_data.js','utf8');     // Stücklisten, Beschreibungen, Montageschritte
const p3=fs.readFileSync('part3_app.js','utf8');      // 3D-Geometrie und Bedienlogik
const cut=p1.indexOf('</style>')+'</style>'.length;
const head=p1.slice(0,cut), body=p1.slice(cut);
const scripts='\n<script>'+three+'\n</script>\n<script>'+orbit+'\n</script>\n<script>\n'+p2+'\n'+p3+'\n</script>\n';
const html='<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'+head+'\n</head>\n<body>'+body+scripts+'</body>\n</html>\n';
fs.writeFileSync('../Kanaltec_4_0_Montageanleitung_3D.html', html);
console.log('geschrieben: ../Kanaltec_4_0_Montageanleitung_3D.html', html.length, 'Bytes');
