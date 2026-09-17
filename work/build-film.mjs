import esbuild from 'esbuild';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
await mkdir('work/qa/video/studio',{recursive:true});
await esbuild.build({absWorkingDir:process.cwd(),entryPoints:['work/film-studio.js'],bundle:true,format:'esm',outfile:'work/qa/video/studio/film.js',target:'chrome120',tsconfigRaw:{}});
await copyFile('src/logo-transparent.png','work/qa/video/studio/logo.png');
await writeFile('work/qa/video/studio/index.html','<!doctype html><html lang="de"><meta charset="utf-8"><title>DiTom · DSS-Flex Verfahren · Filmstudio</title><style>body{margin:0;background:#14232c}#scene{position:absolute;left:-12000px;top:0}canvas{display:block}#film{width:100vw;height:100vh;object-fit:contain}</style><div id="scene" style="width:1920px;height:1080px"></div><canvas id="film"></canvas><script type="module" src="film.js"></script></html>');
console.log('Filmstudio uses current source model; no explosion shots.');
