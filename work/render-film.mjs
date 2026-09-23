import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import path from 'node:path';
// Usage:
//   node work/render-film.mjs                      all three formats, final quality
//   node work/render-film.mjs --formats=YouTube    selected formats
//   node work/render-film.mjs --qa --times=4,6.5   stills (optionally --scale=.5 --ss=1)
const arg=(k,d)=>{const a=process.argv.find(a=>a.startsWith(`--${k}=`));return a?a.slice(k.length+3):d;};
const runtime=process.env.KANALTEC_QA_RUNTIME||path.resolve('work/qa/runtime');
const {chromium}=createRequire(runtime+'/package.json')('playwright');
const ffmpeg=process.env.KANALTEC_FFMPEG||'ffmpeg';
const root=path.resolve('work/qa/video/studio');
const server=createServer(async(req,res)=>{try{const name=req.url==='/'?'index.html':req.url.slice(1);if(!['index.html','film.js','logo.png'].includes(name)){res.writeHead(404).end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.png')?'image/png':'text/html');res.end(await readFile(path.join(root,name)));}catch{res.writeHead(404).end();}});
server.listen(0,'127.0.0.1');await once(server,'listening');
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--ignore-gpu-blocklist','--enable-gpu-rasterization']});
const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('Failed to load resource'))errors.push(m.text());});
await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.ready,{},{timeout:180000});
// YouTube master in 4K (YouTube assigns its higher-bitrate encodes to 4K uploads);
// vertical and 4:5 at the native social-media resolutions, both supersampled.
const all=[['YouTube',3840,2160,1.5],['Reels-Shorts',1080,1920,2],['Facebook-Feed',1080,1350,2]];
const wanted=arg('formats',all.map(f=>f[0]).join(',')).split(',');
const formats=all.filter(f=>wanted.includes(f[0]));
const qa=process.argv.includes('--qa'),fps=30,duration=78,scale=+arg('scale',1),ssOverride=arg('ss');
const output='work/qa/video';await mkdir(output,{recursive:true});
try{
 for(const [name,W,H,SS] of formats){
  const w=Math.round(W*scale/2)*2,h=Math.round(H*scale/2)*2,ss=ssOverride?+ssOverride:SS;
  await page.evaluate(([w,h,ss])=>film.configure(w,h,ss),[w,h,ss]);
  if(qa){
   const times=arg('times','1.5,4,6.5,9,12,17.5,20.5,23,27.5,31,35,41,47,55,61,65,69,71.5,75.5').split(',').map(Number);
   for(const t of times){const s=Date.now();const data=await page.evaluate(t=>film.frame(t),t);await writeFile(`${output}/qa-${name}-${t}.jpg`,Buffer.from(data,'base64'));console.log(`${name} ${t}s ${Date.now()-s}ms`);}
   continue;
  }
  const dest=path.resolve(`${output}/${name}-silent.mp4`);
  const proc=spawn(ffmpeg,['-y','-hide_banner','-loglevel','warning','-f','image2pipe','-vcodec','mjpeg','-framerate',String(fps),'-i','pipe:0','-an',
   '-vf','format=yuv420p','-c:v','libx264','-preset','slow','-crf',name==='YouTube'?'15':'16','-profile:v','high','-tune','film',
   '-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-color_range','tv','-g','60','-movflags','+faststart',dest],{windowsHide:true,stdio:['pipe','ignore','pipe']});
  let stderr='';proc.stderr.on('data',d=>stderr+=d);const completed=once(proc,'close');const started=Date.now();
  const first=+arg('from',0),last=+arg('to',duration);
  for(let i=Math.round(first*fps);i<Math.round(last*fps);i++){const data=await page.evaluate(t=>film.frame(t),i/fps);if(!proc.stdin.write(Buffer.from(data,'base64')))await once(proc.stdin,'drain');if(i%150===0)console.log(`${name}: ${i}/${fps*duration} frames, ${Math.round((Date.now()-started)/1000)}s`);}
  proc.stdin.end();const [code]=await completed;if(code!==0)throw Error(stderr);console.log('Rendered',name,Math.round((Date.now()-started)/1000)+'s');
 }
 await writeFile(`${output}/render-report.json`,JSON.stringify({fps,duration,formats,errors,source:'Current src/model.js; cinematic film studio; process only; no subtitles',mode:qa?'stills':'complete'},null,2));
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();server.close();}
