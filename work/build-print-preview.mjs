import {readFile,writeFile} from 'node:fs/promises';
import esbuild from 'esbuild';
const detail=process.argv.includes('--detail');
const root=detail?'Druckmodelle/DSS-Flex-Detail-2026':'Druckmodelle/DSS-Flex-2026';
const reports=JSON.parse(await readFile(root+'/Pruefbericht.json','utf8'));
const variants=[...new Set(reports.map(r=>r.variant))].sort().map(id=>({id,label:id.replaceAll('-',' ')}));
const description=detail?'Detailausgabe aus Originalflächen: glatte Rundungen, getrennte Mechanik und feine Bauteile. Kleine Größen erfordern eine Prüfung der Mindestwandstärken im Slicer.':'Die Ansicht zeigt die tatsächlich exportierten FDM-Druckkörper mit Standfläche und Verstärkungen.';
const models=[];
for(const kind of ['01-Roboter-und-Schalung','02-Nur-Schalung','03-Rohrsanierung-Schnitt']){
 try{models.push({kind,base64:(await readFile(`${root}/06-Standard-200-FDM/${kind}-farbig.3mf`)).toString('base64')});}
 catch(e){if(!process.argv.includes('--partial'))throw e;}
}
const js=(await esbuild.build({entryPoints:['src/print-preview.js'],bundle:true,format:'iife',write:false,minify:true})).outputFiles[0].text;
const render=payload=>`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>DSS-Flex · Druckmodelle</title><style>*{box-sizing:border-box}body{margin:0;background:#111b25;color:#e9f1f7;font:16px system-ui}header{padding:22px 30px;border-bottom:1px solid #354653}h1{margin:0 0 10px;font-size:28px}p{color:#b3c6d3;max-width:950px}nav{display:flex;gap:14px;align-items:center;flex-wrap:wrap}select,a,button{padding:10px 14px;background:#263a49;color:#edf6fc;border:1px solid #536776;border-radius:7px}a{text-decoration:none}#view{height:70vh;min-height:400px}footer{padding:15px 30px;color:#b3c6d3}</style><header><h1>DSS-Flex · ${detail?'Detail-Druckmodelle':'3D-Druckmodelle'}</h1><p>Drei feste Anschauungsmodelle, zehn Größen von 8 bis 60 cm. ${description}</p><nav><select id="model" aria-label="Modell"></select><select id="size" aria-label="Druckgröße"></select><label><input type="checkbox" id="mono"> Einfarbig ansehen</label><button id="perspective">3D</button><button id="side">Seite</button><strong id="dimensions"></strong><a id="stl" download>STL herunterladen</a><a id="color" download>3MF mit Farbbereichen</a></nav></header><main id="view"></main><footer>Ziehen: drehen · Rechte Maustaste: verschieben · Mausrad: zoomen. Große Ausgaben enthalten zusätzliche Segmente. <a href="DRUCKANLEITUNG.md">Druckanleitung</a></footer><script>window.PRINT_DATA=${JSON.stringify(payload)};</script><script>${js.replaceAll('</script','<\/script')}</script></html>`;
if(detail){
 for(let i=0;i<models.length;i++){
  const payload={variants,reports,initialModel:i,models:models.map((m,j)=>({kind:m.kind,href:j===0?'Druckmodelle-ansehen.html':m.kind+'.html',...(i===j?{base64:m.base64}:{})}))};
  await writeFile(root+'/'+(i===0?'Druckmodelle-ansehen.html':models[i].kind+'.html'),render(payload));
 }
}else await writeFile(root+'/Druckmodelle-ansehen.html',render({variants,models,reports}));
console.log('Standalone preview built from actual 3MF outputs.');
