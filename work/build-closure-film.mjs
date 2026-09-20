import esbuild from 'esbuild';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
const out='work/qa/closure-video/studio';
await mkdir(out,{recursive:true});
await esbuild.build({absWorkingDir:process.cwd(),entryPoints:['work/closure-film-studio.js'],bundle:true,format:'esm',outfile:`${out}/film.js`,target:'chrome120',tsconfigRaw:{}});
await copyFile('src/logo-transparent.png',`${out}/logo.png`);
await writeFile(`${out}/index.html`,'<!doctype html><html lang="de"><meta charset="utf-8"><title>DSS-Flex Verschlussfilme</title><style>body{margin:0;background:#14232c}#scene{position:absolute;left:-12000px;top:0}canvas{display:block}#film{width:100vw;height:100vh;object-fit:contain}</style><div id="scene" style="width:1920px;height:1080px"></div><canvas id="film"></canvas><script type="module" src="film.js"></script></html>');
console.log('Closed mould film studio built from current sources.');
