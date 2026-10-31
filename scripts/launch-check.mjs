import { readFile } from 'node:fs/promises';
const site=JSON.parse(await readFile('src/data/site.json','utf8'));
const errors=[];
if(site.draft)errors.push('Sett draft=false først når lanseringslisten er gjennomgått.');
for(const [name,value] of Object.entries(site))if(typeof value==='string' && (/\[TODO:/.test(value)||/example\.|\.invalid/.test(value)))errors.push(`Fyll inn ${name} i src/data/site.json.`);
if(!/^https:\/\//.test(site.url))errors.push('Nettsiden må bruke en HTTPS-adresse.');
if(/\[TODO:/.test(await readFile('src/data/legal.ts','utf8')))errors.push('Fyll ut og kvalitetssikre personvern- og cookie-tekst.');
const wrangler=await readFile('wrangler.jsonc','utf8');
if(/00000000-0000-0000-0000-000000000000|\.invalid/.test(wrangler))errors.push('Fyll ut D1-ID og e-post/origin i wrangler.jsonc.');
if((await readFile('maintenance/wrangler.jsonc','utf8')).includes('00000000-0000-0000-0000-000000000000'))errors.push('Fyll ut samme D1-ID for den planlagte oppryddingsjobben.');
if(errors.length){console.error('Ikke klar for offentlig lansering:\n'+errors.map(e=>`- ${e}`).join('\n'));process.exitCode=1;}
else console.log('Lokale plassholdere er utfylt. Verifiser eksterne hemmeligheter, faktisk e-postlevering, rettigheter og juridisk sjekkliste før publisering.');
