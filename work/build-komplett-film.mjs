import esbuild from 'esbuild';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
// Complete-process film studio: milling, manhole insertion, rehabilitation.
const dir='work/qa/komplett/studio';await mkdir(dir,{recursive:true});
await esbuild.build({absWorkingDir:process.cwd(),entryPoints:['work/film-komplett-studio.js'],bundle:true,format:'esm',outfile:dir+'/film.js',target:'chrome120',tsconfigRaw:{}});
await copyFile('src/logo-film.png',dir+'/logo.png');
await writeFile(dir+'/index.html','<!doctype html><html lang="de"><meta charset="utf-8"><title>DiTom · DSS-Flex · Gesamtablauf</title><style>body{margin:0;background:#14232c}#scene{position:absolute;left:-12000px;top:0}canvas{display:block}#film{width:100vw;height:100vh;object-fit:contain}</style><img class="brand-logo" src="logo.png" hidden><div id="scene" style="width:1920px;height:1080px"></div><canvas id="film"></canvas><script type="module" src="film.js"></script></html>');
console.log('Built',dir);
