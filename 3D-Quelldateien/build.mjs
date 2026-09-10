import fs from 'fs';
const R='../render/node_modules/three/';
const three=fs.readFileSync(R+'build/three.min.js','utf8');
const orbit=fs.readFileSync(R+'examples/js/controls/OrbitControls.js','utf8');
const p1raw=fs.readFileSync('part1_head.html','utf8');
const tut=fs.existsSync('tutorial.html')?fs.readFileSync('tutorial.html','utf8'):'';
const p1=p1raw.replace('<!--TUTORIAL-->',tut);
const p2=fs.readFileSync('part2_data.js','utf8');
const p3=fs.readFileSync('part3_app.js','utf8');
const cut=p1.indexOf('</style>')+'</style>'.length;
const head=p1.slice(0,cut), body=p1.slice(cut);
const scripts='\n<script>'+three+'\n</script>\n<script>'+orbit+'\n</script>\n<script>\n'+p2+'\n'+p3+'\n</script>\n';
const standalone='<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'+head+'\n</head>\n<body>'+body+scripts+'</body>\n</html>\n';
fs.writeFileSync('C:/Users/ditom/Desktop/Montage Anleitung/Kanaltec_4_0_Montageanleitung_3D.html', standalone);
// Artifact-Version: ohne doctype/html/head/body
const artifact=head+body+scripts;
fs.writeFileSync('kanaltec40_artifact.html', artifact);
fs.writeFileSync('check.js', p2+'\n'+p3);
console.log('standalone bytes', standalone.length, 'artifact bytes', artifact.length);
