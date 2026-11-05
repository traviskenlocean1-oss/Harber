// Harbor Mind build: compasspathways.com homepage (Next.js) -> index.html + /_next mirror, re-branded.
//   node tools/build.js
// 1. copy their /_next assets to /_next, recolor + swap fonts in the CSS
// 2. strip GTM / consent / CookieYes; point Vimeo at /media/player.html
// 3. swap copy in BOTH the server HTML and the RSC payload (self.__next_f), so hydration keeps our words
// 4. swap media, SEO head, JSON-LD
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const T = require('./text.json');
const SITE = 'https://harber.traviskenlocean1.workers.dev';
// their components run new URL() on media addresses, so media must be absolute (ORIGIN=http://localhost:8850 for local tests)
const ORIGIN = process.env.ORIGIN || SITE;
let html = fs.readFileSync(path.join(__dirname, 'src/home.html'), 'utf8');

/* ── 1. assets ───────────────────────────────────────────── */
const cpDir = (a, b) => { fs.mkdirSync(b, { recursive: true }); for (const f of fs.readdirSync(a)) { const s = path.join(a, f), d = path.join(b, f); fs.statSync(s).isDirectory() ? cpDir(s, d) : fs.copyFileSync(s, d); } };
fs.rmSync(path.join(ROOT, '_next'), { recursive: true, force: true });
cpDir(path.join(__dirname, 'mirror/_next'), path.join(ROOT, '_next'));
// their paid fonts are not shipped: delete them from the published copy
const mediaDir = path.join(ROOT, '_next/static/media');
for (const f of fs.readdirSync(mediaDir)) if (/^NBInternationalPro/.test(f)) fs.unlinkSync(path.join(mediaDir, f));
const PALETTE = {
  '#dff5dc': '#dcecec',   // sage-light (mint)  -> sea glass
  '#edf2ed': '#eef4f4',   // sage-lighter       -> sea mist
  '#a8c2a5': '#9dbdc0',   // sage               -> harbor teal-grey
  '#ff8686': '#5f8fae',   // rose (coral)       -> harbor blue
  '#fdddd4': '#dbe7f0',   // rose-lighter       -> pale harbor blue
  '#a3d0f1': '#c4d2e6',   // sky                -> dusk mist
  '#e4f4ff': '#edf1f8',   // sky-lighter        -> morning mist
  '#d5ad65': '#c8a27c',   // harvest (gold)     -> warm sand
  '#ffefd2': '#f5ebdf'    // harvest-lighter    -> pale sand
};
const FONT = { 'Bold': 700, 'BoldItalic': 700, 'Book': 350, 'BookItalic': 350, 'Italic': 400, 'Light': 300, 'LightItalic': 300, 'Medium': 500, 'MediumItalic': 500, 'Regular': 400 };
for (const f of fs.readdirSync(path.join(ROOT, '_next/static/chunks')).filter(f => f.endsWith('.css'))) {
  const p = path.join(ROOT, '_next/static/chunks', f); let css = fs.readFileSync(p, 'utf8'), n0 = css;
  for (const [a, b] of Object.entries(PALETTE)) css = css.split(a).join(b).split(a.toUpperCase()).join(b);
  // NB International Pro -> Geist (variable), sized to match (size-adjust from the pixel comparison)
  css = css.replace(/src:url\(\.\.\/media\/NBInternationalPro_(\w+?)-s\.p\.[^)]+\.woff2\)( format\("woff2"\))?/g, (m, w) =>
    w === 'Mono' ? 'src:url(/media/fonts/azeret-mono-latin.woff2) format("woff2");size-adjust:104.2%' : 'src:url(/media/fonts/geist-latin.woff2) format("woff2");size-adjust:99.7%');
  if (css !== n0) fs.writeFileSync(p, css);
}

// Vimeo SDK only accepts vimeo.com iframes/messages: also accept our own origin (local /media/player.html stands in)
{
  const vp = path.join(ROOT, '_next/static/chunks/005r2_mwz9yj6.js'); let js = fs.readFileSync(vp, 'utf8');
  const from = String.raw`function s(e){return/^(https?:)?\/\/((((player|www)\.)?vimeo\.com)`;
  if (!js.includes(from)) throw new Error('vimeo check not found');
  js = js.replace(from, String.raw`function s(e){return(typeof location<"u"&&String(e).indexOf(location.origin)===0)||/\/media\/player\.html/.test(e)||/^(https?:)?\/\/((((player|www)\.)?vimeo\.com)`);
  fs.writeFileSync(vp, js);
}
/* ── 2. strip trackers / consent / cookie banner ─────────── */
html = html.replace(/<script[^>]*id="cookieyes"[^>]*><\/script>/g, '');
// only stand-alone tracker scripts; never the RSC data scripts (self.__next_f), which mention gtag too
html = html.replace(/<script>((?:(?!<\/script>)[\s\S])*?)<\/script>/g, (m, body) => (/__next_f/.test(body) || !/googletagmanager|gtag\(|dataLayer/.test(body)) ? m : '');
html = html.replace(/<noscript>(?:(?!<\/noscript>)[\s\S])*?googletagmanager(?:(?!<\/noscript>)[\s\S])*?<\/noscript>/g, '');
html = html.replace(/<link rel="preconnect"[^>]*(cookieyes|vimeo|googletagmanager)[^>]*>/g, '');

/* ── media map (base URLs, query strings ride along) ─────── */
const CS = 'https://images.contentstack.io/v3/assets/blta4f6f6922537743c/';
const AS = 'https://assets.contentstack.io/v3/assets/blta4f6f6922537743c/';
const MEDIA = [
  [/https:\/\/player\.vimeo\.com\/video\/1195984214\?h=a08779a764/g, ORIGIN + '/media/player.html?v=hero'],
  [/https:\/\/images\.contentstack\.io\/v3\/assets\/blta4f6f6922537743c\/[a-z0-9]+\/[a-f0-9]+\/hp-hero-thumbnail\.jpg/g, ORIGIN + '/media/hero-thumb.jpg'],
  [/https:\/\/images\.contentstack\.io\/v3\/assets\/blta4f6f6922537743c\/[a-z0-9]+\/[a-f0-9]+\/Compass_logo_white_solid\.svg/g, ORIGIN + '/media/logo-solid.svg'],
  [/https:\/\/images\.contentstack\.io\/v3\/assets\/blta4f6f6922537743c\/[a-z0-9]+\/[a-f0-9]+\/Compass_logo_white_lines\.svg/g, ORIGIN + '/media/logo-lines.svg'],
  [/https:\/\/images\.contentstack\.io\/v3\/assets\/blta4f6f6922537743c\/[a-z0-9]+\/[a-f0-9]+\/topography\.svg/g, ORIGIN + '/media/topography.svg'],
  [/https:\/\/images\.contentstack\.io\/v3\/assets\/blta4f6f6922537743c\/[a-z0-9]+\/[a-f0-9]+\/audio-bg-home\.png/g, ORIGIN + '/media/why-bg.jpg'],
  [/https:\/\/images\.contentstack\.io\/v3\/assets\/blta4f6f6922537743c\/[a-z0-9]+\/[a-f0-9]+\/Landscape_22\.jpg/g, ORIGIN + '/media/card-approach.jpg'],
  [/https:\/\/images\.contentstack\.io\/v3\/assets\/blta4f6f6922537743c\/[a-z0-9]+\/[a-f0-9]+\/People_18_Desktop_Wide_16_9\.jpg/g, ORIGIN + '/media/card-couples.jpg'],
  [/https:\/\/images\.contentstack\.io\/v3\/assets\/blta4f6f6922537743c\/[a-z0-9]+\/[a-f0-9]+\/People_01\.png/g, ORIGIN + '/media/card-families.jpg'],
  [/https:\/\/images\.contentstack\.io\/v3\/assets\/blta4f6f6922537743c\/[a-z0-9]+\/[a-f0-9]+\/Footer_01\.png/g, ORIGIN + '/media/footer.jpg'],
  [/https:\/\/images\.contentstack\.io\/v3\/assets\/blta4f6f6922537743c\/[a-z0-9]+\/[a-f0-9]+\/Open_Graph\.jpg/g, ORIGIN + '/media/og.jpg']
];
for (let i = 1; i <= 10; i++) MEDIA.push([new RegExp('https://assets\\.contentstack\\.io/v3/assets/blta4f6f6922537743c/[a-z0-9]+/[a-f0-9]+/Compass_Voices_audio_' + i + '_-_[A-Za-z_]+\\.mp3', 'g'), ORIGIN + '/media/voice-' + i + '.mp3']);

const LD = { '@context': 'https://schema.org', '@type': 'MedicalBusiness', name: 'Harbor Mind', description: 'Therapy and counseling for individuals, couples and families in Miami, FL and online.', url: SITE + '/', image: SITE + '/media/og.jpg', logo: SITE + '/media/favicon.svg', medicalSpecialty: 'Psychiatric', areaServed: 'Miami, FL', address: { '@type': 'PostalAddress', addressLocality: 'Miami', addressRegion: 'FL', addressCountry: 'US' } };
/* ── 3. copy swaps ───────────────────────────────────────── */
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const jsonIn = s => JSON.stringify(s).slice(1, -1);
const htmlEsc = s => s.replace(/&(?!amp;|#x27;|quot;|lt;|gt;|nbsp;)/g, '&amp;').replace(/'/g, '&#x27;').replace(/"/g, '&quot;');
const entries = T.entries.map(e => Object.assign({}, e, { to: e.to.replace(/\{YEAR\}/g, '{YEAR}') }));
const sitePlain = (s, inJson) => s; // placeholder for symmetry
// (a) payload: decode every push, replace whole JSON string values that start with the prefix, re-encode
function swapJsonStrings(text) {
  let out = text;
  for (const e of entries) {
    const pre = jsonIn(e.prefix);
    // a JSON string value: "<p>"? + prefix + rest-of-string
    const re = new RegExp('"(\\\\u003cp\\\\u003e|<p>)?' + escRe(pre) + (e.exact ? '' : '(?:[^"\\\\]|\\\\.)*?') + '(\\s|&nbsp;|\\\\u00a0)*"', 'g');
    out = out.replace(re, (m, p) => {
      if (e.html === 'raw') return JSON.stringify(e.to);
      if (e.html || p) return JSON.stringify('<p>' + e.to + '</p>');
      return JSON.stringify(e.to);
    });
  }
  return out;
}
function swapPayload(dec) {
  for (const [re, to] of MEDIA) dec = dec.replace(re, to);
  // their Organization JSON-LD (an "__html" string in the RSC data) -> ours
  const ldKey = '"__html":"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Organization\\"';
  const li = dec.indexOf(ldKey);
  if (li >= 0) {
    let j = li + '"__html":'.length + 1; while (j < dec.length && dec[j] !== '"') j += dec[j] === '\\' ? 2 : 1;
    dec = dec.slice(0, li) + '"__html":' + JSON.stringify(JSON.stringify(LD)) + dec.slice(j + 1);
  }
  dec = swapJsonStrings(dec);
  // hero headline + mission icon positions
  dec = dec.replace(/"headline":\{"top":"[^"]*","mid":"[^"]*","bottom":"[^"]*"\}/, '"headline":' + JSON.stringify(T.hero));
  let k = 0; dec = dec.replace(/"afterWord":\d+/g, m => (k < T.mission.afterWords.length ? '"afterWord":' + T.mission.afterWords[k++] : m));
  // the mission sentence is also stored as event/section-header copies
  // leftovers: brand name + domain
  dec = dec.replace(/compasspathways\.com/g, 'harber.traviskenlocean1.workers.dev').replace(/Compass Pathways/g, 'Harbor Mind').replace(/\bCompass\b/g, 'Harbor Mind');
  return dec;
}
/* The RSC stream is split across many push() calls and rows can straddle them. Join it, walk it
   row by row ("id:" + JSON line, or "id:T<hexlen>," + that many UTF-8 bytes), swap each row, recompute
   T lengths, and emit the whole thing as ONE push (the other pushes become empty). */
function transformStream(all) {
  const buf = Buffer.from(all, 'utf8'); let pos = 0, out = [];
  while (pos < buf.length) {
    const colon = buf.indexOf(0x3a, pos); if (colon < 0) { out.push(swapPayload(buf.slice(pos).toString('utf8'))); break; }
    const id = buf.slice(pos, colon).toString('utf8');
    if (!/^[0-9a-f]*$/.test(id)) { const nl = buf.indexOf(0x0a, pos); const end = nl < 0 ? buf.length : nl + 1; out.push(swapPayload(buf.slice(pos, end).toString('utf8'))); pos = end; continue; }
    if (buf[colon + 1] === 0x54) {                                   // 'T' text row
      const comma = buf.indexOf(0x2c, colon); const len = parseInt(buf.slice(colon + 2, comma).toString('utf8'), 16);
      const body = swapPayload(buf.slice(comma + 1, comma + 1 + len).toString('utf8'));
      out.push(id + ':T' + Buffer.byteLength(body, 'utf8').toString(16) + ',' + body); pos = comma + 1 + len; continue;
    }
    const nl = buf.indexOf(0x0a, colon); const end = nl < 0 ? buf.length : nl + 1;
    out.push(id + ':' + swapPayload(buf.slice(colon + 1, end).toString('utf8'))); pos = end;
  }
  return out.join('');
}
let pushes = 0, joined = '', firstPush = true;
html.replace(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g, (m, lit) => { joined += JSON.parse('"' + lit + '"'); return m; });
const swapped = transformStream(joined); console.log("stream joined", joined.length, "swapped", swapped.length);
html = html.replace(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g, (m, lit) => {
  pushes++;
  if (!firstPush) return 'self.__next_f.push([1,""])';
  firstPush = false;
  const enc = JSON.stringify(swapped).replace(/</g, '\\u003c').split(String.fromCharCode(0x2028)).join('\\u2028').split(String.fromCharCode(0x2029)).join('\\u2029');
  return 'self.__next_f.push([1,' + enc + '])';
});
if (false) html.replace(/x/, (m, lit) => {
  const dec = JSON.parse('"' + lit + '"');
  const enc = JSON.stringify(swapPayload(dec)).replace(/</g, '\\u003c').split(String.fromCharCode(0x2028)).join('\\u2028').split(String.fromCharCode(0x2029)).join('\\u2029');
  pushes++; return 'self.__next_f.push([1,' + enc + '])';
});
// (b) server HTML outside the payload: text nodes + attribute values
const scripts = []; html = html.replace(/<script[\s\S]*?<\/script>/g, s => { scripts.push(s); return '\u0000S' + (scripts.length - 1) + '\u0000'; });
for (const [re, to] of MEDIA) html = html.replace(re, to);
for (const e of entries) {
  if (e.html === 'raw') continue;
  const pre = htmlEsc(e.prefix), to = htmlEsc(e.to.replace(/<sup>\d<\/sup>/g, '')).replace(/&lt;/g, '<');
  // text node
  html = html.replace(new RegExp('>(\\s*)' + escRe(pre) + (e.exact ? '' : '[^<]*') + '<', 'g'), (m, ws) => '>' + ws + to + '<');
  // attribute value (also inside labels like aria-label="Play <title>")
  html = html.replace(new RegExp('="([^"]{0,12}?)' + escRe(pre) + (e.exact ? '' : '[^"]*') + '"', 'g'), (m, lead) => '="' + lead + to + '"');
}
// their own Organization JSON-LD lives in a plain script tag: drop it (ours is added below)
scripts.forEach((s, i) => { if (/^<script[^>]*type="application\/ld\+json"/.test(s) && !/__next_f/.test(s) && /Compass/.test(s)) scripts[i] = ''; });
html = html.replace(/Every journey needs a Compass/g, 'Every mind needs a Harbor').replace(/needs a Compass/g, 'needs a Harbor')
  .replace(/alt="Compass logo white solid\.svg"/g, 'alt="Harbor Mind"');
html = html.replace(/compasspathways\.com/g, 'harber.traviskenlocean1.workers.dev').replace(/Compass Pathways/g, 'Harbor Mind').replace(/>\s*Compass\s*</g, '>Harbor<').replace(/="Compass"/g, '="Harbor Mind"').replace(/\bCompass\b/g, 'Harbor Mind');
html = html.replace(/\u0000S(\d+)\u0000/g, (m, i) => scripts[+i]);
html = html.replace(/<html lang="[^"]*"/, '<html lang="en"');

/* ── 4. SEO + favicon + site styles ──────────────────────── */
const ld = { '@context': 'https://schema.org', '@type': 'MedicalBusiness', name: 'Harbor Mind', description: 'Therapy and counseling for individuals, couples and families in Miami, FL and online.', url: SITE + '/', image: SITE + '/media/og.jpg', logo: SITE + '/media/favicon.svg', medicalSpecialty: 'Psychiatric', areaServed: 'Miami, FL', address: { '@type': 'PostalAddress', addressLocality: 'Miami', addressRegion: 'FL', addressCountry: 'US' } };
html = html.replace(/<link rel="icon"[^>]*>/g, '').replace(/<link rel="apple-touch-icon"[^>]*>/g, '');
html = html.replace('</head>', `<link rel="icon" href="/media/favicon.svg" type="image/svg+xml"/>
<meta name="theme-color" content="#2F5D73"/>
<meta property="og:title" content="Harbor Mind | Therapy &amp; Counseling in Miami"/>
<meta name="twitter:card" content="summary_large_image"/>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style id="hm-site">
  /* nav wordmark: theirs is sized by width (103px); ours is longer, so pin their 17.33px height instead */
  img[src^="/media/logo-solid.svg"]{width:auto!important;height:17.33px!important;max-width:none!important}
</style>
</head>`);
html = html.replace(/<link rel="canonical" href="[^"]*"\/?>/, `<link rel="canonical" href="${SITE}/"/>`);

html = html.split('https://twitter.com/CompassPathway').join('https://www.instagram.com/').split('https://www.linkedin.com/company/compass-pathways/').join('https://www.linkedin.com/');
fs.writeFileSync(path.join(ROOT, 'index.html'), html);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE}/</loc></url></urlset>\n`);
const left = (html.match(/[Cc]ompass/g) || []).length;
console.log('built index.html', (html.length / 1024).toFixed(0) + 'KB,', pushes, 'payload chunks; "compass" left:', left);
