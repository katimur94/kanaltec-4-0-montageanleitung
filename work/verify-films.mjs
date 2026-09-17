import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
const {chromium}=createRequire(process.env.KANALTEC_QA_RUNTIME+'/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const output='Videos/DSS-Flex-Verfahren-2026';
await page.goto(pathToFileURL(path.resolve(output,'Videos-ansehen.html')).href);
await page.waitForFunction(()=>[...document.querySelectorAll('video')].every(v=>v.readyState>=1),{},{timeout:60000});
const results=[];
for(const video of await page.locator('video').all()){
 const result=await video.evaluate(async v=>{
  v.muted=true;v.currentTime=10;await new Promise(resolve=>v.addEventListener('seeked',resolve,{once:true}));
  await v.play();await new Promise(resolve=>setTimeout(resolve,500));v.pause();
  return {file:v.getAttribute('src'),width:v.videoWidth,height:v.videoHeight,duration:v.duration,advanced:v.currentTime>10.1,error:v.error?.message||null};
 });results.push(result);
}
await page.screenshot({path:'work/qa/video/gallery.png',fullPage:true});await browser.close();
await writeFile(`${output}/browser-pruefung.json`,JSON.stringify({results,errors},null,2));
console.log(JSON.stringify({results,errors}));if(errors.length||results.length!==6||results.some(v=>v.error||!v.advanced||Math.abs(v.duration-78)>.1))process.exitCode=1;
