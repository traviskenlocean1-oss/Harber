// Dumps the joined RSC stream of each reference page to tools/pl/<slug>.txt (local only, for writing text maps)
//   node tools/dump-payload.js [slug ...]
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'src');
fs.mkdirSync(path.join(__dirname, 'pl'), { recursive: true });
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(dir).map(f => f.replace(/\.html$/, ''));
for (const s of slugs) {
  const h = fs.readFileSync(path.join(dir, s + '.html'), 'utf8'); let j = '';
  h.replace(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g, (m, l) => { j += JSON.parse('"' + l + '"'); return m; });
  fs.writeFileSync(path.join(__dirname, 'pl', s + '.txt'), j);
  console.log(s, j.length);
}
