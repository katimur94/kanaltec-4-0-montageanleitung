import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import path from 'node:path';
const {chromium}=createRequire(process.env.KANALTEC_QA_RUNTIME+'/package.json')('playwright');
const root=path.resolve('work/qa/video/studio');
const server=createServer(async(req,res)=>{try{const name=req.url==='/'?'index.html':req.url.slice(1);if(!['index.html','film.js','logo.png'].includes(name)){res.writeHead(404).end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.png')?'image/png':'text/html');res.end(await readFile(path.join(root,name)));}catch{res.writeHead(404).end();}});
server.listen(0,'127.0.0.1');await once(server,'listening');
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.ready,{},{timeout:120000});
const formats=[['YouTube',1920,1080],['Reels-Shorts',1080,1920],['Facebook-Feed',1080,1350]];
const output='Videos/DSS-Flex-Verfahren-2026';await mkdir(output,{recursive:true});
const qa=process.argv.includes('--qa'),fps=30,duration=78;
try{
 for(const [name,w,h]of formats){
  await page.evaluate(([w,h])=>film.configure(w,h),[w,h]);
  if(qa){for(const t of [1.5,5.5,11,17.5,24,27.5,34,38.5,45,55,58.8,61,65,69,71.5,75.5]){const data=await page.evaluate(t=>film.frame(t),t);await writeFile(`work/qa/video/${name}-${t}.jpg`,Buffer.from(data,'base64'));}console.log('Storyboard ready:',name);continue;}
  const dest=path.resolve(`work/qa/video/${name}-silent.mp4`);
  const proc=spawn(process.env.KANALTEC_FFMPEG,['-y','-hide_banner','-loglevel','warning','-f','image2pipe','-vcodec','mjpeg','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',dest],{windowsHide:true,stdio:['pipe','ignore','pipe']});
  let stderr='';proc.stderr.on('data',d=>stderr+=d);const completed=once(proc,'close');const started=Date.now();
  for(let i=0;i<fps*duration;i++){const data=await page.evaluate(t=>film.frame(t),i/fps);if(!proc.stdin.write(Buffer.from(data,'base64')))await once(proc.stdin,'drain');if(i%300===0)console.log(`${name}: ${i}/${fps*duration} frames, ${Math.round((Date.now()-started)/1000)}s`);}
  proc.stdin.end();const [code]=await completed;if(code!==0)throw Error(stderr);console.log('Rendered',name);
 }
 await writeFile(`${output}/render-report.json`,JSON.stringify({fps,duration,formats,errors,source:'Current src/model.js; process only; no explosion; no subtitles',mode:qa?'storyboard':'complete'},null,2));
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();server.close();}
