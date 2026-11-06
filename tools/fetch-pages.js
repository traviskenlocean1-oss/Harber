// Mirrors the reference sub-pages: server HTML -> tools/src/<slug>.html, every /_next asset they load
// -> tools/mirror, CMS media -> tools/ref-media/<slug>/ (measuring only), visible text -> tools/inv/<slug>.txt
const fs = require('fs'), path = require('path'), https = require('https');
const { chromium } = require('playwright');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const get = (u) => new Promise((res, rej) => https.get(u, { headers: { 'User-Agent': UA } }, r => {
  if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) return res(get(new URL(r.headers.location, u).href));
  const c = []; r.on('data', d => c.push(d)); r.on('end', () => res({ status: r.statusCode, buf: Buffer.concat(c), url: u }));
}).on('error', rej));
const PAGES = (process.argv[2] || '/who-we-are,/who-we-are/our-purpose,/who-we-are/join-us,/our-work,/our-work/publications,/who-we-serve,/who-we-serve/patients-and-caregivers,/who-we-serve/healthcare-professionals,/contact-us,/faq,/privacy-policy,/terms-of-service,/unsolicited-information,/expanded-access,/news').split(',');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  for (const pg of PAGES) {
    const slug = pg.replace(/^\//, '').replace(/\//g, '__');
    const r = await get('https://www.compasspathways.com' + pg);
    console.log(pg, r.status, r.buf.length);
    if (r.status !== 200) continue;
    fs.mkdirSync('tools/src', { recursive: true }); fs.writeFileSync('tools/src/' + slug + '.html', r.buf);
    const p = await b.newPage({ viewport: { width: 1512, height: 696 } }); const reqs = new Set();
    p.on('request', q => reqs.add(q.url()));
    await p.goto('https://www.compasspathways.com' + pg, { waitUntil: 'load', timeout: 90000 }); await p.waitForTimeout(3000);
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 400) { await p.mouse.wheel(0, 400); await p.waitForTimeout(60); }
    await p.waitForTimeout(2000);
    const inv = await p.evaluate(() => { const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while (n = w.nextNode()) { const t = n.textContent.replace(/\s+/g, ' ').trim(); if (t.length > 1 && !/^(script|style)$/i.test(n.parentElement.tagName)) out.push(n.parentElement.tagName + ' | ' + t); } return [...new Set(out)]; });
    fs.mkdirSync('tools/inv', { recursive: true }); fs.writeFileSync('tools/inv/' + slug + '.txt', 'HEIGHT ' + (await p.evaluate(() => document.documentElement.scrollHeight)) + '\n' + inv.join('\n'));
    await p.close();
    const html = r.buf.toString();
    for (const m of html.matchAll(/["'(](\/_next\/static\/[^"')\s\\]+)/g)) reqs.add('https://www.compasspathways.com' + m[1]);
    let n = 0;
    for (let u of reqs) {
      let U; try { U = new URL(u); } catch { continue; }
      const next = U.host === 'www.compasspathways.com' && U.pathname.startsWith('/_next/static/');
      const cms = /contentstack\.io$/.test(U.host);
      if (!next && !cms) continue;
      const out = cms ? path.join('tools/ref-media', slug, U.pathname.split('/').slice(-1)[0]) : path.join('tools/mirror', decodeURIComponent(U.pathname));
      if (fs.existsSync(out)) continue;
      try { const q = await get(next ? U.origin + U.pathname : u); if (q.status !== 200) continue; fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, q.buf); n++; } catch (e) {}
    }
    console.log('  new files', n);
  }
  await b.close();
})();
