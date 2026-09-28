import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import path from 'node:path';
// Complete-process film (milling → manhole insertion → rehabilitation).
//   node work/render-komplett-film.mjs --formats=YouTube,Reel [--from=0 --to=88]
//   node work/render-komplett-film.mjs --qa --times=4,22,31 [--scale=.5 --ss=1]
// Runs with a GPU browser (KANALTEC_BROWSER_CHANNEL=msedge) or software GL (default Chromium).
const arg=(k,d)=>{const a=process.argv.find(a=>a.startsWith(`--${k}=`));return a?a.slice(k.length+3):d;};
const runtime=process.env.KANALTEC_QA_RUNTIME||path.resolve('work/qa/runtime');
const {chromium}=createRequire(runtime+'/package.json')('playwright');
const ffmpeg=process.env.KANALTEC_FFMPEG||'ffmpeg';
const root=path.resolve('work/qa/komplett/studio');
const server=createServer(async(req,res)=>{try{const name=req.url==='/'?'index.html':req.url.slice(1);if(!['index.html','film.js','logo.png'].includes(name)){res.writeHead(404).end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.png')?'image/png':'text/html');res.end(await readFile(path.join(root,name)));}catch{res.writeHead(404).end();}});
server.listen(0,'127.0.0.1');await once(server,'listening');
const channel=process.env.KANALTEC_BROWSER_CHANNEL;
const browser=await chromium.launch(channel?{channel,headless:true,args:['--ignore-gpu-blocklist']}:{headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('Failed to load resource'))errors.push(m.text());});
await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.ready,{},{timeout:600000});
// --lite: software rendering budget (no GTAO, no motion-blur sub-frames).
if(process.argv.includes('--lite'))await page.evaluate(()=>film.debug.lite());
const all=[['YouTube',1920,1080,1.5],['Reel',1080,1920,1.5]];
// Final size after upscaling (render may be smaller with --scale).
const finalSize={YouTube:'1920:1080',Reel:'1080:1920'};
const wanted=arg('formats',all.map(f=>f[0]).join(',')).split(',');
const formats=all.filter(f=>wanted.includes(f[0]));
const qa=process.argv.includes('--qa'),fps=+arg('fps',30),duration=await page.evaluate(()=>film.duration),scale=+arg('scale',1),ssOverride=arg('ss');
const output=path.resolve(arg('out','work/qa/komplett'));await mkdir(output,{recursive:true});
try{
 for(const [name,W,H,SS] of formats){
  const w=Math.round(W*scale/2)*2,h=Math.round(H*scale/2)*2,ss=ssOverride?+ssOverride:SS;
  await page.evaluate(([w,h,ss])=>film.configure(w,h,ss),[w,h,ss]);
  if(qa){
   const times=arg('times','1.5,4,9,15,19,21,26,31,35,39,42,45,55,65,79,81.5,85').split(',').map(Number);
   for(const t of times){const s=Date.now();const data=await page.evaluate(t=>film.frame(t),t);await writeFile(`${output}/qa-${name}-${t}.jpg`,Buffer.from(data,'base64'));console.log(`${name} ${t}s ${Date.now()-s}ms`);}
   continue;
  }
  const first=+arg('from',0),last=+arg('to',duration),dest=path.resolve(`${output}/${name}-${first}-${last}-silent.mp4`);
  const proc=spawn(ffmpeg,['-y','-hide_banner','-loglevel','warning','-f','image2pipe','-vcodec','mjpeg','-framerate',String(fps),'-i','pipe:0','-an',
   '-vf',`scale=${finalSize[name]}:flags=lanczos,format=yuv420p`,'-c:v','libx264','-preset','medium','-crf','18','-profile:v','high','-tune','film',
   '-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-color_range','tv','-g','60','-movflags','+faststart',dest],{stdio:['pipe','ignore','pipe']});
  let stderr='';proc.stderr.on('data',d=>stderr+=d);const completed=once(proc,'close');const started=Date.now();
  for(let i=Math.round(first*fps);i<Math.round(last*fps);i++){const data=await page.evaluate(t=>film.frame(t),i/fps);if(!proc.stdin.write(Buffer.from(data,'base64')))await once(proc.stdin,'drain');if(i%60===0)console.log(`${name}: frame ${i}, ${Math.round((Date.now()-started)/1000)}s`);}
  proc.stdin.end();const [code]=await completed;if(code!==0)throw Error(stderr);console.log('Rendered',name,dest,Math.round((Date.now()-started)/1000)+'s');
 }
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();server.close();}
