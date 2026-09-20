import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import path from 'node:path';
const {chromium}=createRequire(process.env.KANALTEC_QA_RUNTIME+'/package.json')('playwright');
const root=path.resolve('work/qa/closure-video/studio'),qa=process.argv.includes('--qa');
const kinds=process.argv.includes('--pipe')?['pipe']:process.argv.includes('--closure')?['closure']:['pipe','closure'];
const times=[1.5,5.5,11,14.5,18,22,25.5,29,35,40,44.5,49,52.5,55.5,58.5];
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),name=url.pathname==='/'?'index.html':url.pathname.slice(1);if(!['index.html','film.js','logo.png'].includes(name)){res.writeHead(404).end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.png')?'image/png':'text/html');res.end(await readFile(path.join(root,name)));}catch{res.writeHead(404).end();}});
server.listen(0,'127.0.0.1');await once(server,'listening');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const kind of kinds){
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?kind=${kind}`);await page.waitForFunction(()=>window.ready,{},{timeout:120000});
  const meta=await page.evaluate(()=>({duration:film.duration,width:film.width,height:film.height,branchTop:film.branchTop,shots:film.shots}));
  if(qa){for(const t of times){const data=await page.evaluate(t=>film.frame(t),t);await writeFile(`work/qa/closure-video/${kind}-${t}.jpg`,Buffer.from(data,'base64'));}console.log('Storyboard ready:',kind,meta.branchTop);}
  else{
   const fps=30,dest=path.resolve(`work/qa/closure-video/${kind}-silent.mp4`);
   const proc=spawn(process.env.KANALTEC_FFMPEG,['-y','-hide_banner','-loglevel','warning','-f','image2pipe','-vcodec','mjpeg','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',dest],{windowsHide:true,stdio:['pipe','ignore','pipe']});
   let stderr='';proc.stderr.on('data',d=>stderr+=d);const completed=once(proc,'close'),started=Date.now();
   for(let i=0;i<fps*meta.duration;i++){const data=await page.evaluate(t=>film.frame(t),i/fps);if(!proc.stdin.write(Buffer.from(data,'base64')))await once(proc.stdin,'drain');if(i%150===0)console.log(`${kind}: ${i}/${fps*meta.duration} frames, ${Math.round((Date.now()-started)/1000)}s`);}
   proc.stdin.end();const [code]=await completed;if(code!==0)throw Error(stderr);console.log('Rendered',kind);
  }
  await writeFile(`work/qa/closure-video/${kind}-${qa?'storyboard':'render'}-report.json`,JSON.stringify({...meta,errors,fps:30},null,2));
  await page.close();if(errors.length)throw Error(errors.join('\n'));
 }
}finally{await browser.close();server.close();}
