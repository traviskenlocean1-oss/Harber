// Harbor Mind wordmarks (no logo mark, just the name), drawn as real outlines from Geist Bold:
//   media/logo-solid.svg  - nav (white, solid), same cap/x-height feel as the reference wordmark
//   media/logo-lines.svg  - footer: the same wordmark cut through by thin water-ripple lines
//   media/favicon.svg     - "hm" monogram on harbor blue
// node tools/brand/make-logo.js
const fontkit = require('fontkit');
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '../../media');
const font = fontkit.openSync(path.join(__dirname, 'geist-700.ttf'));

function word(text, track) {
  const run = font.layout(text); let x = 0; const parts = [];
  run.glyphs.forEach((g, i) => { parts.push(g.path.translate(x, 0)); x += run.positions[i].xAdvance + font.unitsPerEm * track; });
  const bb = parts.reduce((b, p) => { const q = p.bbox; return { x0: Math.min(b.x0, q.minX), y0: Math.min(b.y0, q.minY), x1: Math.max(b.x1, q.maxX), y1: Math.max(b.y1, q.maxY) }; }, { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
  return { d: parts.map(p => p.toSVG()).join(''), bb };
}
// reference viewBox height is 138 for a descender-to-ascender lowercase word: keep that height
const H = 138;
const w = word('harbor mind', -0.035);
const s = H / (w.bb.y1 - w.bb.y0), W = Math.ceil((w.bb.x1 - w.bb.x0) * s);
const tf = `translate(${(-w.bb.x0 * s).toFixed(2)} ${(w.bb.y1 * s).toFixed(2)}) scale(${s.toFixed(5)} ${(-s).toFixed(5)})`;
const solid = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg"><path transform="${tf}" d="${w.d}" fill="#FFFFFF"/></svg>\n`;

// water ripples: gentle sine lines across the whole word, cut out of the letters (mask)
let ripples = '';
for (let i = 0; i < 9; i++) {
  const y0 = 10 + i * 15.5, amp = 3 + (i % 3), len = 150 + (i % 4) * 25, ph = i * 37;
  let d = `M -20 ${y0}`;
  for (let x = -20; x <= W + 20; x += 10) d += ` L ${x} ${(y0 + amp * Math.sin((x + ph) / len * Math.PI * 2)).toFixed(2)}`;
  ripples += `<path d="${d}" stroke="#000" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
}
const lines = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs><mask id="hm-rip" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>${ripples}</mask></defs>
<g mask="url(#hm-rip)"><path transform="${tf}" d="${w.d}" fill="#FFFFFF"/></g></svg>\n`;

const m = word('hm', -0.03), ms = 21 / (m.bb.y1 - m.bb.y0), mw = (m.bb.x1 - m.bb.x0) * ms, mh = (m.bb.y1 - m.bb.y0) * ms;
const mtf = `translate(${(24 - mw / 2 - m.bb.x0 * ms).toFixed(2)} ${(24 + 13 + m.bb.y0 * ms * 0 - 0).toFixed(2)}) scale(${ms.toFixed(5)} ${(-ms).toFixed(5)})`;
const fav = `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="#2F5D73"/><path transform="translate(${(24 - mw / 2 - m.bb.x0 * ms).toFixed(2)} ${(24 - mh / 2 + m.bb.y1 * ms).toFixed(2)}) scale(${ms.toFixed(5)} ${(-ms).toFixed(5)})" d="${m.d}" fill="#EAF4F4"/></svg>\n`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'logo-solid.svg'), solid);
fs.writeFileSync(path.join(OUT, 'logo-lines.svg'), lines);
fs.writeFileSync(path.join(OUT, 'favicon.svg'), fav);
console.log('wordmark', W + 'x' + H, 'aspect', (W / H).toFixed(2));
