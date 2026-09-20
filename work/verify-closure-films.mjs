import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
const {chromium}=createRequire(process.env.KANALTEC_QA_RUNTIME+'/package.json')('playwright');
const live=process.argv.includes('--live');
const url=live?'https://katimur94.github.io/kanaltec-4-0-montageanleitung/Videos/DSS-Flex-Verfahren-2026/Videos-ansehen.html':pathToFileURL(path.resolve('Videos/DSS-Flex-Verfahren-2026/Videos-ansehen.html')).href;
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);const videos=page.locator('video[src*="verschliessen"]');
 const results=[];
 for(const video of await videos.all()){
  const result=await video.evaluate(async v=>{
   const wait=event=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(event+' timed out')),45000);v.addEventListener(event,()=>{clearTimeout(timer);resolve();},{once:true});});
   if(v.readyState<1)await wait('loadedmetadata');v.muted=true;
   const seek=wait('seeked');v.currentTime=52.5;await seek;
   await v.play();await new Promise(resolve=>setTimeout(resolve,700));v.pause();
   return {file:v.getAttribute('src'),width:v.videoWidth,height:v.videoHeight,duration:v.duration,advanced:v.currentTime>52.6,error:v.error?.message||null};
  });results.push(result);
 }
 await page.screenshot({path:`work/qa/closure-video/gallery-${live?'live':'local'}.png`,fullPage:true});
 await writeFile(`work/qa/closure-video/browser-${live?'live':'local'}.json`,JSON.stringify({results,errors},null,2));
 console.log(JSON.stringify({results,errors}));
 if(errors.length||results.length!==2||results.some(v=>v.error||!v.advanced||v.width!==1920||v.height!==1080||Math.abs(v.duration-60)>.1))throw Error('Closure video browser check failed');
}finally{await browser.close();}
