// Mirrors the reference page: its HTML (tools/src/home.html) and every same-site
// /_next asset it loads, at the same paths under tools/mirror. CMS images and
// audio go to tools/ref-media for measuring only (never published).
const fs = require('fs'), path = require('path'), https = require('https');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const get = (u) => new Promise((res, rej) => https.get(u, { headers: { 'User-Agent': UA } }, r => {
  if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) return res(get(new URL(r.headers.location, u).href));
  const c = []; r.on('data', d => c.push(d)); r.on('end', () => res({ status: r.statusCode, buf: Buffer.concat(c) }));
}).on('error', rej));
(async () => {
  const home = await get('https://www.compasspathways.com/');
  fs.writeFileSync('tools/src/home.html', home.buf);
  const html = home.buf.toString();
  const urls = new Set();
  for (const m of html.matchAll(/["'(](\/_next\/static\/[^"')\s]+)/g)) urls.add('https://www.compasspathways.com' + m[1].replace(/\u0026/g, '&'));
  for (const l of fs.readFileSync('tools/requests.txt', 'utf8').split('\n')) {
    const u = (l.split(' | ')[3] || '').trim();
    if (/^https:\/\/www\.compasspathways\.com\/_next\/static\//.test(u)) urls.add(u.split('?')[0]);
    if (/contentstack\.io/.test(u)) urls.add(u);
  }
  let n = 0, bad = 0;
  for (const u of urls) {
    const U = new URL(u), cms = /contentstack/.test(U.host);
    const out = cms ? path.join('tools/ref-media', U.pathname.split('/').slice(-2).join('_')) : path.join('tools/mirror', decodeURIComponent(U.pathname));
    if (fs.existsSync(out)) continue;
    try { const r = await get(u); if (r.status !== 200) { bad++; console.log('ERR', r.status, u.slice(0, 100)); continue; } fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, r.buf); n++; } catch (e) { bad++; console.log('ERR', e.message, u.slice(0, 80)); }
  }
  console.log('home', html.length, 'bytes; saved', n, 'files,', bad, 'errors');
})();
