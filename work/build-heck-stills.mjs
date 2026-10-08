import esbuild from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
const out='work/qa/heck/studio';await mkdir(out,{recursive:true});
await esbuild.build({absWorkingDir:process.cwd(),entryPoints:['work/heck-stills-studio.js'],bundle:true,format:'esm',outfile:`${out}/stills.js`,target:'chrome120',tsconfigRaw:{}});
await writeFile(`${out}/index.html`,'<!doctype html><html lang="de"><meta charset="utf-8"><title>Heckmodul Standbilder</title><style>body{margin:0}#scene{position:absolute;left:-12000px;top:0}</style><div id="scene" style="width:1600px;height:1000px"></div><script type="module" src="stills.js"></script></html>');
console.log('Heck stills studio built.');
