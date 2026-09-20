import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
const require=createRequire(process.env.KANALTEC_QA_RUNTIME+'/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1550,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto(pathToFileURL(process.cwd()+'/index.html').href);
await page.locator('#loading').waitFor({state:'hidden'});
await page.locator('[data-mode="process"]').click();
await page.locator('#viewSettings').click();await page.locator('#cutPipe').check();await page.locator('#closeViewSettings').click();
await page.locator('#millingView').click();
await mkdir('work/qa',{recursive:true});
for(const [name,t] of [['rotary-left',.5475],['rotary-right',.7825]]){
 await page.locator('#timeline').evaluate((el,t)=>{el.value=t*1000;el.dispatchEvent(new Event('input',{bubbles:true}));},t);
 await page.locator('#toolView').click();await page.waitForTimeout(300);
 await page.locator('#viewport').screenshot({path:`work/qa/${name}.png`});
}
await page.locator('#millingView').click();
for(const [name,t] of [['intrusion',0],['trim',.25],['round',.95],['outer',.55],['withdraw',1.3],['exchange',1.8],['position',2.6],['bladder',5.99],['filling',6.78],['fill',6.95],['done',8.99],['rewind',.55]]){
 await page.locator('#timeline').evaluate((el,t)=>{el.value=t*1000;el.dispatchEvent(new Event('input',{bubbles:true}));},t);
 await page.waitForTimeout(350);
 await page.locator('#viewport').screenshot({path:`work/qa/${name}.png`});
 console.log(name,await page.locator('#viewport').evaluate(el=>({...el.dataset})));
}
await page.locator('#timeline').evaluate(el=>{el.value=8999;el.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForTimeout(300);
await page.locator('#channelView').click();await page.waitForTimeout(300);await page.locator('#viewport').screenshot({path:'work/qa/channel-done.png'});
await page.locator('#millingView').click();
await page.locator('#viewSettings').click();await page.locator('#cutShield').check();await page.locator('#hideBladder').check();await page.locator('#closeViewSettings').click();
for(const [name,t] of [['injection-early',6.52],['injection-ground',6.78],['injection-full',6.95]]){await page.locator('#timeline').evaluate((el,t)=>{el.value=t*1000;el.dispatchEvent(new Event('input',{bubbles:true}));},t);await page.waitForTimeout(300);await page.locator('#viewport').screenshot({path:`work/qa/${name}.png`});}
await page.locator('#damageView').click();await page.waitForTimeout(300);await page.locator('#viewport').screenshot({path:'work/qa/ground-full.png'});
await page.locator('#timeline').evaluate(el=>{el.value=6520;el.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForTimeout(300);await page.locator('#viewport').screenshot({path:'work/qa/ground-early.png'});
await page.locator('#millingView').click();
for(const dn of ['300','700']){await page.locator('#family').selectOption(dn);await page.locator('button[data-stage="5"]').click();await page.locator('#driveView').click();await page.waitForTimeout(350);await page.locator('#viewport').screenshot({path:`work/qa/bladder-${dn}.png`});}
await page.goto(pathToFileURL(process.cwd()+'/Fraeskopf-Vergleich.html').href);
await page.locator('#model canvas').waitFor();await page.waitForTimeout(500);
await page.screenshot({path:'work/qa/cutter-comparison.png',fullPage:true});
for(const view of ['side','front','top']){await page.locator(`button[data-view="${view}"]`).click();await page.waitForTimeout(250);await page.locator('#model').screenshot({path:`work/qa/cutter-${view}.png`});}
console.log('BROWSER ERRORS',errors);await browser.close();if(errors.length)process.exitCode=1;
