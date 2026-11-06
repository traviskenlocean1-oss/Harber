// Lists the human-readable strings of a reference page's RSC data (the things the text map must cover).
//   node tools/list-strings.js <slug> [--all]   (--all includes strings the shared text.json already handles)
const fs = require('fs'), path = require('path');
const [slug, flag] = process.argv.slice(2);
const pl = fs.readFileSync(path.join(__dirname, 'pl', slug + '.txt'), 'utf8');
const T = require('./text.json');
const seen = new Set(), out = [];
for (const m of pl.matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
  let s; try { s = JSON.parse('"' + m[1] + '"'); } catch (e) { continue; }
  const plain = s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  if (plain.length < 3 || !/[a-z]{2,}\s+\S/i.test(plain) && plain.split(' ').length < 2 && !/^[A-Z][a-z]+$/.test(plain)) continue;
  if (/^(\$|https?:|\/|#|[a-z]+(-[a-z0-9]+)+$|[a-z-]+:|bg-|text-|layout|flex|grid|w-|h-|px-|py-|mt-|mb-)/.test(plain)) continue;
  if (/^[a-z0-9_-]+$/.test(plain) || /className|[{}]/.test(plain) || /(^|\s)(md|lg|xl|sm):/.test(plain)) continue;
  if (seen.has(plain)) continue; seen.add(plain);
  if (flag !== '--all' && T.entries.some(e => (e.exact ? plain === e.prefix : plain.startsWith(e.prefix)))) continue;
  out.push((s.startsWith('<') ? 'H ' : '  ') + plain.slice(0, 160) + (plain.length > 160 ? ' …[' + plain.length + ']' : ''));
}
console.log(out.join('\n'));
