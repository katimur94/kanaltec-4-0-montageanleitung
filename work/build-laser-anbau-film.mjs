import esbuild from 'esbuild';
import {mkdir,writeFile,copyFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
// Baut das Studio für „Laser-Positionierhilfe – Anbau und Einsatz“.
// Voraussetzung: python work/laser-anbau-audio.py --speak (Zeitplan) und CadQuery für die Druckteil-Netze.
const out='work/qa/laser-anbau/studio';
await mkdir(out,{recursive:true});
try{await access(`${out}/teile/parts.json`);if(process.argv.includes('--teile'))throw 0;}
catch{execFileSync('python3',['work/druckteile/druckteile.py','--no-export','--view',`${out}/teile`],{stdio:'inherit'});}
await esbuild.build({absWorkingDir:process.cwd(),entryPoints:['work/film-laser-anbau-studio.js'],bundle:true,format:'esm',outfile:`${out}/film.js`,target:'chrome120',tsconfigRaw:{},loader:{'.json':'json'}});
await copyFile('src/logo-transparent.png',`${out}/logo.png`);
await writeFile(`${out}/index.html`,'<!doctype html><html lang="de"><meta charset="utf-8"><title>Laser-Positionierhilfe – Anbau und Einsatz</title><style>body{margin:0;background:#14232c}#scene{position:absolute;left:-12000px;top:0}canvas{display:block}#film{width:100vw;height:100vh;object-fit:contain}</style><div id="scene" style="width:1920px;height:1080px"></div><canvas id="film"></canvas><script type="module" src="film.js"></script></html>');
console.log('Studio gebaut:',out);
