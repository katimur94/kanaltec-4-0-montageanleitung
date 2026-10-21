import esbuild from 'esbuild';
import {mkdir,writeFile,copyFile,readdir,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
// Commercial studio for void filling behind the liner (Reel). Footage: portrait clips
// rendered clean from film-liner-studio.js (work/qa/liner-werbung/footage.sh), extracted to JPG.
const dir='work/qa/liner-werbung/studio',src='work/qa/liner-werbung/src';await mkdir(dir+'/footage',{recursive:true});
await esbuild.build({absWorkingDir:process.cwd(),entryPoints:['work/film-liner-werbung-studio.js'],bundle:true,format:'esm',outfile:dir+'/film.js',target:'chrome120',tsconfigRaw:{}});
await copyFile('src/logo-film.png',dir+'/logo.png');
const ff=(await readdir('work/qa/video-runtime/imageio_ffmpeg/binaries')).find(f=>f.startsWith('ffmpeg'));
const counts={};
for(const f of (await readdir(src)).filter(f=>f.endsWith('.mp4.done'))){
 const name=(await readFile(`${src}/${f}`,'utf8')).trim(),out=`${dir}/footage/${name}`;await mkdir(out,{recursive:true});
 if(!existsSync(`${out}/0001.jpg`))execFileSync(`work/qa/video-runtime/imageio_ffmpeg/binaries/${ff}`,['-v','error','-y','-i',`${src}/${f.replace('.done','')}`,'-q:v','3',`${out}/%04d.jpg`]);
 counts[name]=(await readdir(out)).filter(x=>x.endsWith('.jpg')).length;
}
await writeFile(dir+'/index.html',`<!doctype html><html lang="de"><meta charset="utf-8"><title>DiTom · DVK-Flex Werbung</title><style>body{margin:0;background:#14232c}#scene{position:absolute;left:-12000px;top:0}canvas{display:block}#film{width:100vw;height:100vh;object-fit:contain}</style><script id="counts" type="application/json">${JSON.stringify(counts)}</script><img class="brand-logo" src="logo.png" hidden><div id="scene" style="width:1920px;height:1080px"></div><canvas id="film"></canvas><script type="module" src="film.js"></script></html>`);
console.log('Built',dir,counts);
