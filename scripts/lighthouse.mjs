import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { mkdir,writeFile } from 'node:fs/promises';
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:8788';
const chrome=await launch({chromePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',chromeFlags:['--headless','--no-first-run','--disable-gpu']});
await mkdir('artifacts',{recursive:true});
try{const result=await lighthouse(base,{port:chrome.port,output:['html','json'],onlyCategories:['performance','accessibility','best-practices','seo'],logLevel:'error'});await writeFile('artifacts/lighthouse-mobile.html',result.report[0]);await writeFile('artifacts/lighthouse-mobile.json',result.report[1]);const scores=Object.fromEntries(Object.entries(result.lhr.categories).map(([key,value])=>[key,Math.round(value.score*100)]));console.log(JSON.stringify(scores));console.log('Local mobile simulation. Draft noindex intentionally affects SEO. Recheck real deployed domain.');}finally{await chrome.kill();}
