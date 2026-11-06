// Mixkit (free license) search -> labeled contact sheet of video thumbnails, for picking stills.
//   node tools/media/mk-search.js <outdir> "query one" "query two" ...
const fs = require('fs'), path = require('path'), https = require('https'), { execFileSync } = require('child_process');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const get = (u) => new Promise((res, rej) => https.get(u, { headers: { 'User-Agent': UA } }, r => {
  if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) return res(get(new URL(r.headers.location, u).href));
  const c = []; r.on('data', d => c.push(d)); r.on('end', () => res({ status: r.statusCode, buf: Buffer.concat(c) }));
}).on('error', rej));
const [out, ...qs] = process.argv.slice(2);
(async () => {
  for (const q of qs) {
    const slug = q.replace(/\W+/g, '-');
    const r = await get('https://mixkit.co/free-stock-video/' + q.replace(/\s+/g, '-') + '/');
    const html = r.buf.toString();
    const ids = [...new Set([...html.matchAll(/assets\.mixkit\.co\/videos\/(\d+)\/\1-thumb-360-0\.jpg/g)].map(m => m[1]))].slice(0, 30);
    const dir = path.join(out, slug); fs.mkdirSync(dir, { recursive: true });
    for (const id of ids) {
      const f = path.join(dir, id + '.jpg'); if (fs.existsSync(f)) continue;
      const t = await get(`https://assets.mixkit.co/videos/${id}/${id}-thumb-360-0.jpg`); if (t.status === 200) fs.writeFileSync(f, t.buf);
    }
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).map(f => path.join(dir, f));
    if (!files.length) { console.log(q, 'no results'); continue; }
    execFileSync('magick', ['montage', ...files.map(f => f), '-resize', '240x135', '-geometry', '+3+3', '-tile', '6x', '-pointsize', '12', '-set', 'label', '%t', path.join(out, 'sheet-' + slug + '.jpg')]);
    console.log(q, ids.length, '->', path.join(out, 'sheet-' + slug + '.jpg'));
  }
  process.exit(0); // keep-alive sockets would otherwise hold the process open
})();
