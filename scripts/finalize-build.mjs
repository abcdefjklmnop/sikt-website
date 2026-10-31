import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
const site = JSON.parse(await readFile('src/data/site.json', 'utf8'));
async function walk(dir) { const files=[]; for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);files.push(...(e.isDirectory()?await walk(p):[p]));}return files; }
const hashes = new Set();
for (const file of (await walk('dist')).filter(f=>f.endsWith('.html'))) {
  const html=await readFile(file,'utf8');
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (!/\bsrc=/.test(match[1]) && match[2]) hashes.add(`'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`);
  }
  if (/<style\b|\sstyle=/.test(html)) throw new Error(`Inline styles forbidden: ${file}`);
}
const csp = `default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' ${[...hashes].join(' ')}; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; frame-src 'none'; media-src 'none'; upgrade-insecure-requests`;
if (csp.length>1900) throw new Error('CSP exceeds Cloudflare line limit. Use page-specific rules.');
await writeFile('dist/_headers', `/*\n  Content-Security-Policy: ${csp}\n  Strict-Transport-Security: max-age=31536000\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: no-referrer\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()\n${site.draft ? '  X-Robots-Tag: noindex, nofollow\n' : ''}\n/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n\nhttps://:project.pages.dev/*\n  X-Robots-Tag: noindex, nofollow\n\nhttps://:version.:project.pages.dev/*\n  X-Robots-Tag: noindex, nofollow\n`);
const urls=['/','/personvern/','/informasjonskapsler/'];
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(p=>`<url><loc>${escape(new URL(p,site.url).href)}</loc></url>`).join('')}</urlset>\n`);
await writeFile('dist/robots.txt',`User-agent: *\n${site.draft?'Disallow: /':'Allow: /\nDisallow: /api/\nDisallow: /takk/\nDisallow: /kontakt-feil/'}\nSitemap: ${site.url}/sitemap.xml\n`);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#171d1b"/><path d="M760 0v630M0 520h1200" stroke="#3a463b"/><text x="80" y="120" fill="#f2eee6" font-family="Arial" font-size="70" font-weight="bold">sikt<tspan fill="#f0a17c">.</tspan></text><text x="80" y="290" fill="#f2eee6" font-family="Arial" font-size="68">Bedre oversikt.</text><text x="80" y="375" fill="#f0a17c" font-family="Arial" font-size="68">Tryggere drift.</text><text x="80" y="572" fill="#b7bdb4" font-family="Arial" font-size="24">Cybersikkerhet og webutvikling · Bergen</text><path d="m955 160 140 80-140 80-140-80 140-80Zm-140 80v130l140 80V320m140-80v130l-140 80" fill="none" stroke="#f0a17c" stroke-width="2"/></svg>`;
await sharp(Buffer.from(svg)).png().toFile('dist/og-image.png');
console.log(`Generated security headers (${hashes.size} inline script hashes), robots, sitemap and Open Graph image. Draft: ${site.draft}`);
