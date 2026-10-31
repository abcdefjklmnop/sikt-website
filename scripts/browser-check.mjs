import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:8788';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Run these form tests only on a local server.');
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const failures=[];const checks=[];
try{
for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:950},deviceScaleFactor:1});
 const page=await context.newPage();
 const external=[];const errors=[];
 page.on('request',r=>{if(new URL(r.url()).origin!==new URL(base).origin)external.push(r.url());});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&/Content Security Policy|Refused/.test(m.text()))errors.push(m.text());});
 for(const route of ['/','/personvern/','/informasjonskapsler/','/takk/','/kontakt-feil/','/404.html']){
  await page.goto(base+route);await page.waitForLoadState('networkidle');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  if(overflow)failures.push(`${width} ${route}: horizontal overflow`);
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  for(const v of result.violations)failures.push({width,route,id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))});
  checks.push({width,route,violations:result.violations.length,overflow});
  if(route==='/')await page.screenshot({path:`artifacts/home-${width}.png`,fullPage:true});
 }
 await page.goto(base+'/');
 if(width===390){await page.locator('.mobile-nav summary').click();await page.locator('.mobile-nav nav a').first().click();assert.equal(await page.locator('.mobile-nav').getAttribute('open'),null);}
 await page.keyboard.press('Tab');
 await page.locator('#name').fill('Test Person');await page.locator('#email').fill('test@kunde.test');await page.locator('#message').fill('Dette er en syntetisk testmelding.');
 // This endpoint is intercepted; these checks never send an email.
 await page.route('**/api/contact',route=>route.fulfill({status:422,contentType:'application/json',body:JSON.stringify({ok:false,message:'Kontroller de markerte feltene.',errors:{email:'Skriv en gyldig e-postadresse.'}})}));
 await page.locator('.form-submit').click();await page.waitForFunction(()=>document.querySelector('#email')?.getAttribute('aria-invalid')==='true');assert.ok(await page.locator('#message').inputValue());
 await page.unroute('**/api/contact');
 await page.route('**/api/contact',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,message:'Syntetisk svar'})}));
 await page.locator('.form-submit').click();await page.waitForFunction(()=>document.querySelector('#message')?.value==='');assert.match(await page.locator('#form-status').textContent(),/sendt/);
 assert.deepEqual(external,[],'external browser requests');assert.deepEqual(errors,[],'CSP or JavaScript errors');await context.close();
}
await writeFile('artifacts/browser-check.json',JSON.stringify({checks,failures,formResponses:'intercepted synthetic responses; no email sent'},null,2));
if(failures.length){console.error(JSON.stringify(failures,null,2));process.exitCode=1;}else console.log('PASS: 12 responsive page checks, axe WCAG A/AA, no overflow, no third-party requests or CSP/JS errors; form simulated success/errors.');
}finally{await browser.close();}
