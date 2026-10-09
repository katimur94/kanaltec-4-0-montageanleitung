import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import path from 'node:path';
// node work/render-laser-film.mjs [--qa --times=4,10] [--w=1920 --h=1080 --fps=25] [--from=0 --to=39 --out=name]
// Ohne GPU: Chromium mit SwiftShader. KANALTEC_QA_RUNTIME (Playwright), KANALTEC_FFMPEG optional.
const runtime=process.env.KANALTEC_QA_RUNTIME||path.resolve('work/qa/runtime');
const {chromium}=createRequire(runtime+'/package.json')('playwright');
const arg=(k,d)=>{const a=process.argv.find(x=>x.startsWith(`--${k}=`));return a?a.slice(k.length+3):d;};
const qa=process.argv.includes('--qa'),w=+arg('w',1920),h=+arg('h',1080),fps=+arg('fps',25);
const root=path.resolve('work/qa/laser-anbau/studio'),outDir=path.resolve('work/qa/laser-anbau');await mkdir(outDir,{recursive:true});
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),name=url.pathname==='/'?'index.html':url.pathname.slice(1);if(!(['index.html','film.js','logo.png'].includes(name)||/^teile\/[\w.-]+$/.test(name))){res.writeHead(404).end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.png')?'image/png':name.endsWith('.json')?'application/json':name.endsWith('.stl')?'application/octet-stream':'text/html');res.end(await readFile(path.join(root,name)));}catch{res.writeHead(404).end();}});
server.listen(0,'127.0.0.1');await once(server,'listening');
const browser=await chromium.launch({channel:process.env.KANALTEC_BROWSER_CHANNEL,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(`http://127.0.0.1:${server.address().port}/?w=${w}&h=${h}&r=${arg('r','1')}&shadows=${arg('shadows','1')}&aa=${arg('aa','0')}${process.argv.includes('--debug')?'&debug=1':''}`);await page.waitForFunction(()=>window.ready,{},{timeout:300000});
 const meta=await page.evaluate(()=>({duration:film.duration,L:film.L,shots:film.shots.map(s=>s.chapter)}));
 if(qa){for(const t of arg('times','3,12,22,30,40,50,53,62,72,77,90,100,114,122,128,135,145,154,162,172,180').split(',').map(Number)){const s=Date.now();const data=await page.evaluate(t=>film.frame(t),t);await writeFile(path.join(outDir,`qa-${t}.jpg`),Buffer.from(data,'base64'));console.log('frame',t,`${Date.now()-s} ms`);}}
 else{
  const from=+arg('from',0),to=+arg('to',meta.duration),name=arg('out','anbau-silent'),dest=path.join(outDir,`${name}.mp4`);
  const proc=spawn(process.env.KANALTEC_FFMPEG||'ffmpeg',['-y','-hide_banner','-loglevel','warning','-f','image2pipe','-vcodec','mjpeg','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',dest],{stdio:['pipe','ignore','pipe']});
  let stderr='';proc.stderr.on('data',d=>stderr+=d);const done=once(proc,'close'),started=Date.now();
  const first=Math.round(from*fps),last=Math.round(to*fps);
  for(let i=first;i<last;i++){const data=await page.evaluate(t=>film.frame(t),i/fps);if(!proc.stdin.write(Buffer.from(data,'base64')))await once(proc.stdin,'drain');if((i-first)%50===0)console.log(`${name}: ${i-first}/${last-first} frames, ${Math.round((Date.now()-started)/1000)}s`);}
  proc.stdin.end();const [code]=await done;if(code!==0)throw Error(stderr);console.log('Rendered',dest);
 }
 await writeFile(path.join(outDir,`${qa?'storyboard':'render'}-report.json`),JSON.stringify({...meta,errors,fps,w,h},null,2));
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();server.close();}
