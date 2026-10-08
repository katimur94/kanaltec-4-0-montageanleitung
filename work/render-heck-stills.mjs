import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {once} from 'node:events';
import path from 'node:path';
// node work/render-heck-stills.mjs work/heck-shots.json [name,name]  → work/qa/heck/<name>.jpg
const runtime=process.env.KANALTEC_QA_RUNTIME||path.resolve('work/qa/runtime');
const {chromium}=createRequire(runtime+'/package.json')('playwright');
const shots=JSON.parse(await readFile(process.argv[2]||'work/heck-shots.json','utf8')),only=process.argv[3]?.split(',');
const root=path.resolve('work/qa/heck/studio'),outDir=path.resolve('work/qa/heck');await mkdir(outDir,{recursive:true});
const server=createServer(async(req,res)=>{try{const n=new URL(req.url,'http://x').pathname.slice(1)||'index.html';if(!['index.html','stills.js'].includes(n)){res.writeHead(404).end();return;}res.setHeader('Content-Type',n.endsWith('.js')?'text/javascript':'text/html');res.end(await readFile(path.join(root,n)));}catch{res.writeHead(404).end();}});
server.listen(0,'127.0.0.1');await once(server,'listening');
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{const page=await browser.newPage({viewport:{width:800,height:500}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/?w=1600&h=1000`);await page.waitForFunction(()=>window.ready,{},{timeout:300000});
 for(const s of shots){if(only&&!only.includes(s.name))continue;const t=Date.now();const r=await page.evaluate(s=>stills.shot(s),s);await writeFile(path.join(outDir,s.name+'.jpg'),Buffer.from(r.img,'base64'));await writeFile(path.join(outDir,s.name+'.json'),JSON.stringify(r.anchors));console.log(s.name,Date.now()-t,'ms');}
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();server.close();}
