// Harbor Mind build: compasspathways.com pages (Next.js) -> static pages + /_next mirror, re-branded.
//   node tools/build.js            (ORIGIN=http://localhost:8850 for local tests)
// 1. copy their /_next assets to /_next, recolor + swap fonts in the CSS, patch the Vimeo origin check
// 2. per page: strip GTM / consent / CookieYes
// 3. swap copy in BOTH the server HTML and the RSC payload (self.__next_f), so hydration keeps our words
// 4. swap media, links, SEO head, JSON-LD
// Copy lives in tools/text.json (shared nav/footer + home) and tools/pages/<slug>.json (one per page).
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const T = require('./text.json');
const SITE = 'https://harber.traviskenlocean1.workers.dev';
// their components run new URL() on media addresses, so media must be absolute
const ORIGIN = process.env.ORIGIN || SITE;
const EMAIL = 'hello@harbormindtherapy.com';

const PAGES = [
  ['home', '/'], ['who-we-are', '/who-we-are'], ['who-we-are__our-purpose', '/who-we-are/our-purpose'],
  ['who-we-are__join-us', '/who-we-are/join-us'], ['our-work', '/our-work'], ['our-work__publications', '/our-work/publications'],
  ['who-we-serve', '/who-we-serve'], ['who-we-serve__patients-and-caregivers', '/who-we-serve/patients-and-caregivers'],
  ['who-we-serve__healthcare-professionals', '/who-we-serve/healthcare-professionals'], ['contact-us', '/contact-us'],
  ['faq', '/faq'], ['privacy-policy', '/privacy-policy'], ['terms-of-service', '/terms-of-service'],
  ['unsolicited-information', '/unsolicited-information'], ['expanded-access', '/expanded-access']
];

/* ── 1. assets (once) ────────────────────────────────────── */
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
for (const f of fs.readdirSync(path.join(ROOT, '_next/static/chunks')).filter(f => f.endsWith('.css'))) {
  const p = path.join(ROOT, '_next/static/chunks', f); let css = fs.readFileSync(p, 'utf8'), n0 = css;
  for (const [a, b] of Object.entries(PALETTE)) css = css.split(a).join(b).split(a.toUpperCase()).join(b);
  // NB International Pro -> Geist (variable), sized to match (size-adjust from the pixel comparison)
  css = css.replace(/src:url\(\.\.\/media\/NBInternationalPro_(\w+?)-s\.p\.[^)]+\.woff2\)( format\("woff2"\))?/g, (m, w) =>
    w === 'Mono' ? 'src:url(/media/fonts/azeret-mono-latin.woff2) format("woff2");size-adjust:104.2%' : 'src:url(/media/fonts/geist-latin.woff2) format("woff2");size-adjust:99.7%');
  if (css !== n0) fs.writeFileSync(p, css);
}
// words hard-coded in their components (not CMS data)
const JS_TEXT = { '"Select Category"': '"Select Topic"' };
for (const f of fs.readdirSync(path.join(ROOT, '_next/static/chunks')).filter(f => f.endsWith('.js'))) {
  const p = path.join(ROOT, '_next/static/chunks', f); let js = fs.readFileSync(p, 'utf8'), n0 = js;
  for (const [a, b] of Object.entries(JS_TEXT)) js = js.split(a).join(b);
  if (js !== n0) fs.writeFileSync(p, js);
}
// Vimeo SDK only accepts vimeo.com iframes/messages: also accept our own origin (local /media/player.html stands in)
{
  const vp = path.join(ROOT, '_next/static/chunks/005r2_mwz9yj6.js'); let js = fs.readFileSync(vp, 'utf8');
  const from = String.raw`function s(e){return/^(https?:)?\/\/((((player|www)\.)?vimeo\.com)`;
  if (!js.includes(from)) throw new Error('vimeo check not found');
  js = js.replace(from, String.raw`function s(e){return(typeof location<"u"&&String(e).indexOf(location.origin)===0)||/\/media\/player\.html/.test(e)||/^(https?:)?\/\/((((player|www)\.)?vimeo\.com)`);
  fs.writeFileSync(vp, js);
}

/* ── media: every CMS file maps by its file name (tools/media-map.json) ── */
const MEDIA_BY_NAME = require('./media-map.json');
const missingMedia = new Set();
const CMS_RE = /https:\/\/(?:images|assets)\.contentstack\.io\/v3\/assets\/blta4f6f6922537743c\/[a-z0-9]+\/[a-f0-9]+\/([^"?\\\s]+)/g;
const swapMedia = s => s
  .replace(/https:\/\/player\.vimeo\.com\/video\/1195984214\?h=a08779a764/g, ORIGIN + '/media/player.html?v=hero')
  .replace(/https:\/\/player\.vimeo\.com\/video\/1210195904\?h=f4a1057a5a/g, ORIGIN + '/media/player.html?v=feature')
  // their Greenhouse job board embed -> our own openings list (same mount point, same iframe behavior)
  .replace(/https:\/\/boards(?:\.eu)?\.greenhouse\.io\/embed\/job_board\/js\?for=compasspathways/g, ORIGIN + '/media/jobs.js')
  .replace(CMS_RE, (m, name) => {
    let n = name; try { n = decodeURIComponent(name); } catch (e) {}
    const to = MEDIA_BY_NAME[n] || MEDIA_BY_NAME[name];
    if (!to) { missingMedia.add(n); return m; }
    return /^https?:/.test(to) ? to : ORIGIN + to;
  });

/* ── links: investor site + emails + socials ─────────────── */
const IR = { 'News--Events-/news/default.aspx': '/our-work/publications', '': 'https://www.instagram.com/', 'stock-info/default.aspx#stock-quote': '/contact-us', 'financials/sec-filings/default.aspx': '/faq', 'governance/documents-charters/default.aspx': '/faq', 'resources/email-alerts/default.aspx': '/contact-us' };
const swapLinks = s => s
  .replace(/https:\/\/ir\.compasspathways\.com\/?([^"\\\s<]*)/g, (m, p) => (p in IR ? IR[p] : '/contact-us'))
  .replace(/(?:mailto:)?[A-Za-z]+@compasspathways\.com/g, m => (m.startsWith('mailto:') ? 'mailto:' : '') + EMAIL)
  .replace(/https:\/\/(?:www\.)?redefineptsdstudy\.com\/?/g, '/contact-us')
  .replace(/https:\/\/(?:www\.youtube\.com|youtu\.be|kinara\.co|www\.nasdaq\.com|en\.wikipedia\.org)\/[^"\\\s<]*/g, 'https://www.instagram.com/')
  .split('https://twitter.com/CompassPathway').join('https://www.instagram.com/')
  .split('https://www.linkedin.com/company/compass-pathways/').join('https://www.linkedin.com/');

/* ── helpers ─────────────────────────────────────────────── */
const escRe0 = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// prefixes are written with plain spaces and either apostrophe; the CMS text mixes in non-breaking spaces and ’
const escRe = s => escRe0(s).replace(/ /g, '(?: | |&nbsp;|\\\\u00a0)').replace(/&#x27;|'|’/g, "(?:'|’|&#x27;|&#39;)");
// server-HTML text: rich text keeps literal quotes, React-rendered text escapes them
const escReH = s => escRe(s).replace(/&quot;/g, '(?:"|&quot;)');
const jsonIn = s => JSON.stringify(s).slice(1, -1);
const htmlEsc = s => s.replace(/&(?!amp;|#x27;|quot;|lt;|gt;|nbsp;)/g, '&amp;').replace(/'/g, '&#x27;').replace(/"/g, '&quot;');
const brand = s => s.replace(/compasspathways\.com/g, 'harber.traviskenlocean1.workers.dev').replace(/Compass Pathways(?: plc)?/g, 'Harbor Mind').replace(/\bCOMPASS\b/g, 'HARBOR MIND').replace(/\bCompass\b/g, 'Harbor Mind');

function buildPage(slug, urlPath) {
  const P = slug === 'home' ? { entries: [], clips: T.clips } : require('./pages/' + slug + '.json');
  const clips = P.clips || [];
  // page copy first (titles start with shared words like "Who We Are"), shared nav/footer second;
  // the shared clip entries belong to the home page's clips only
  const entries = [...(P.entries || []), ...T.entries.map(e => slug === 'home' ? e : Object.assign({}, e, { clip: undefined }))];
  // "faq": [[question, answer], ...] -> the accordion items array + both FAQPage JSON-LD rows
  if (P.faq) {
    const cslp = (i, k) => ({ 'data-cslp': P.faqCslp + '.rows.' + i + '.' + k });
    P.arrays = (P.arrays || []).concat({ key: 'items', startsWith: '{"id":"row-0"',
      value: P.faq.map(([q, a], i) => ({ id: 'row-' + i, headline: q, body: '<p>' + a + '</p>', headlineEditable: cslp(i, 'headline'), bodyEditable: cslp(i, 'body') })) });
    const qa = P.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } }));
    P.blocks = (P.blocks || []).concat(
      { start: '{"@context":"https://schema.org","@type":"FAQPage","name"', html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', name: 'Frequently Asked Questions — Harbor Mind', url: SITE + urlPath, mainEntity: qa }) },
      { start: '{"@context":"https://schema.org","@type":"FAQPage","mainEntity"', html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa }) });
  }
  const blocks = (P.blocks || []).map(b => Object.assign({ hits: [] }, b));
  let html = fs.readFileSync(path.join(__dirname, 'src', slug + '.html'), 'utf8');

  /* 2. strip trackers / consent / cookie banner */
  html = html.replace(/<script[^>]*id="cookieyes"[^>]*><\/script>/g, '');
  // only stand-alone tracker scripts; never the RSC data scripts (self.__next_f), which mention gtag too
  html = html.replace(/<script>((?:(?!<\/script>)[\s\S])*?)<\/script>/g, (m, body) => (/__next_f/.test(body) || !/googletagmanager|gtag\(|dataLayer/.test(body)) ? m : '');
  html = html.replace(/<noscript>(?:(?!<\/noscript>)[\s\S])*?googletagmanager(?:(?!<\/noscript>)[\s\S])*?<\/noscript>/g, '');
  html = html.replace(/<link rel="preconnect"[^>]*(cookieyes|vimeo|googletagmanager)[^>]*>/g, '');

  const LD = { '@context': 'https://schema.org', '@type': 'MedicalBusiness', name: 'Harbor Mind', description: 'Therapy and counseling for individuals, couples and families in Miami, FL and online.', url: SITE + '/', image: SITE + '/media/og.jpg', logo: SITE + '/media/favicon.svg', email: EMAIL, medicalSpecialty: 'Psychiatric', areaServed: 'Miami, FL', address: { '@type': 'PostalAddress', addressLocality: 'Miami', addressRegion: 'FL', addressCountry: 'US' } };

  /* 3a. payload: replace whole JSON string values that start with a prefix */
  function swapJsonStrings(text) {
    let out = text;
    for (const e of entries) {
      const pre = jsonIn(e.prefix);
      // optional leading tags: "<p>" for paragraph values, "<ul><li>" etc. only for raw HTML entries
      const re = new RegExp('"((?:<[a-z]+>)*)' + escRe(pre) + (e.exact ? '' : '(?:[^"\\\\]|\\\\.)*?') + '(\\s|&nbsp;|\\\\u00a0)*"', 'g');
      out = out.replace(re, (m, lead) => {
        if (e.html === 'raw') return JSON.stringify(e.to);
        if (lead && lead !== '<p>') return m;
        const p = lead === '<p>';
        // an audio clip's transcript body starts with its title: give it the full spoken text
        const clip = e.clip != null ? clips[e.clip] : null;
        if (p && clip) return JSON.stringify('<p>' + clip.body + '</p>');
        if (e.html || p) return JSON.stringify('<p>' + e.to + '</p>');
        return JSON.stringify(e.to);
      });
    }
    return out;
  }
  // whole JSON arrays (e.g. a list of cards) replaced by ours: "arrays": [{ key, startsWith, value }]
  function findArray(text, a) {
    const i = text.indexOf('"' + a.key + '":[' + a.startsWith); if (i < 0) return null;
    const s = i + a.key.length + 3; let d = 0, j = s, inStr = false;
    for (; j < text.length; j++) {
      const c = text[j];
      if (inStr) { if (c === '\\') j++; else if (c === '"') inStr = false; continue; }
      if (c === '"') inStr = true; else if (c === '[' || c === '{') d++; else if (c === ']' || c === '}') { d--; if (d === 0) break; }
    }
    return { i, s, end: j + 1 };
  }
  function swapPayload(dec) {
    for (const a of P.arrays || []) {
      const f = findArray(dec, a);
      if (f) { dec = dec.slice(0, f.s) + JSON.stringify(a.value) + dec.slice(f.end); a.hit = true; }
    }
    dec = swapMedia(dec);
    // their Organization JSON-LD (an "__html" string in the RSC data) -> ours
    const ldKey = '"__html":"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Organization\\"';
    const li = dec.indexOf(ldKey);
    if (li >= 0) {
      let j = li + '"__html":'.length + 1; while (j < dec.length && dec[j] !== '"') j += dec[j] === '\\' ? 2 : 1;
      dec = dec.slice(0, li) + '"__html":' + JSON.stringify(JSON.stringify(LD)) + dec.slice(j + 1);
    }
    dec = swapJsonStrings(dec);
    if (slug === 'home') {
      dec = dec.replace(/"headline":\{"top":"[^"]*","mid":"[^"]*","bottom":"[^"]*"\}/, '"headline":' + JSON.stringify(T.hero));
    }
    // icon positions inside a statement (word index each icon follows; matches the double spaces in statementHtml)
    const AW = slug === 'home' ? T.mission.afterWords : P.afterWords;
    if (AW) { let k = 0; dec = dec.replace(/"afterWord":\d+/g, m => (k < AW.length ? '"afterWord":' + AW[k++] : m)); }
    for (const [a, b] of Object.entries(P.links || {})) dec = dec.split(a).join(b);
    return brand(swapLinks(dec));
  }
  /* The RSC stream is split across many push() calls and rows can straddle them. Join it, walk it
     row by row ("id:" + JSON line, or "id:T<hexlen>," + that many UTF-8 bytes), swap each row, recompute
     T lengths, and emit the whole thing as ONE push (the other pushes become empty). */
  function transformStream(all) {
    const buf = Buffer.from(all, 'utf8'); let pos = 0; const out = [];
    while (pos < buf.length) {
      const colon = buf.indexOf(0x3a, pos); if (colon < 0) { out.push(swapPayload(buf.slice(pos).toString('utf8'))); break; }
      const id = buf.slice(pos, colon).toString('utf8');
      if (!/^[0-9a-f]*$/.test(id)) { const nl = buf.indexOf(0x0a, pos); const end = nl < 0 ? buf.length : nl + 1; out.push(swapPayload(buf.slice(pos, end).toString('utf8'))); pos = end; continue; }
      if (buf[colon + 1] === 0x54) {                                   // 'T' text row (rich text HTML)
        const comma = buf.indexOf(0x2c, colon); const len = parseInt(buf.slice(colon + 2, comma).toString('utf8'), 16);
        const orig = buf.slice(comma + 1, comma + 1 + len).toString('utf8');
        // whole rich-text blocks (legal pages, long bodies) are replaced outright
        const blk = blocks.find(b => orig.startsWith(b.start));
        let body;
        if (blk) { body = blk.html; blk.hits.push(orig); } else body = swapPayload(orig);
        out.push(id + ':T' + Buffer.byteLength(body, 'utf8').toString(16) + ',' + body); pos = comma + 1 + len; continue;
      }
      const nl = buf.indexOf(0x0a, colon); const end = nl < 0 ? buf.length : nl + 1;
      out.push(id + ':' + swapPayload(buf.slice(colon + 1, end).toString('utf8'))); pos = end;
    }
    return out.join('');
  }
  const PUSH_RE = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
  let joined = '', first = true;
  html.replace(PUSH_RE, (m, lit) => { joined += JSON.parse('"' + lit + '"'); return m; });
  // the server HTML shows the first few array items: map each old field to the new one (exact text swaps)
  for (const a of P.arrays || []) {
    const f = findArray(joined, a); if (!f) { console.log('  ! array not found:', a.key, a.startsWith.slice(0, 40)); continue; }
    const old = JSON.parse(joined.slice(f.s, f.end));
    old.forEach((o, k) => {
      const n = a.value[k]; if (!n) return;
      for (const field of Object.keys(o)) if (typeof o[field] === 'string' && typeof n[field] === 'string' && o[field] !== n[field]) {
        // HTML fields are rendered verbatim in the server HTML: swap them whole
        if (o[field].startsWith('<')) { P.links = P.links || {}; P.links[o[field]] = n[field]; }
        else entries.push({ prefix: o[field], exact: true, to: n[field], serverOnly: true });
      }
      if (o.cta && n.cta && o.cta.label !== n.cta.label) entries.push({ prefix: o.cta.label, exact: true, to: n.cta.label, serverOnly: true });
      if (o.cta && n.cta && o.cta.href !== n.cta.href) { P.links = P.links || {}; P.links['href="' + o.cta.href + '"'] = 'href="' + n.cta.href + '"'; }
    });
  }
  const swapped = transformStream(joined);
  html = html.replace(PUSH_RE, () => {
    if (!first) return 'self.__next_f.push([1,""])';
    first = false;
    const enc = JSON.stringify(swapped).replace(/</g, '\\u003c').split(String.fromCharCode(0x2028)).join('\\u2028').split(String.fromCharCode(0x2029)).join('\\u2029');
    return 'self.__next_f.push([1,' + enc + '])';
  });

  /* 3b. server HTML outside the payload: rich-text blocks, text nodes, attribute values */
  // blocks first and over everything (a JSON-LD block also sits in a plain <script> tag; the RSC push already holds ours)
  for (const b of blocks) {
    if (!b.hits.length) console.log('  ! block not found in payload:', b.start.slice(0, 50));
    for (const orig of b.hits) {
      if (html.includes(orig)) { html = html.split(orig).join(b.html); continue; }
      // their Cloudflare rewrote e-mail links in the server HTML, so match from the block's first to last words
      // (entities can differ too, so fall back to the end of the wrapping element)
      const s = html.indexOf(b.start), tail = orig.slice(-30);
      let e = s < 0 ? -1 : html.indexOf(tail, s), len = tail.length;
      if (s >= 0 && (e < 0 || e - s > orig.length * 1.5)) { e = html.indexOf('</div>', s); len = 0; }
      if (s >= 0 && e >= 0) html = html.slice(0, s) + b.html + html.slice(e + len);
      else if (!b.payloadOnly) console.log('  ! block not found in server html:', b.start.slice(0, 50));
    }
  }
  // any other Cloudflare-obfuscated address -> ours, and drop their decoder script
  html = html.replace(/<script data-cfasync="false" src="\/cdn-cgi\/[^"]*email-decode[^"]*"><\/script>/g, '')
    .replace(/<span class="__cf_email__" data-cfemail="[0-9a-f]+">\[email(?:&#160;|&nbsp;| )protected\]<\/span>/g, EMAIL)
    .replace(/\/cdn-cgi\/l\/email-protection#[0-9a-f]+/g, 'mailto:' + EMAIL);
  for (const [a, b] of Object.entries(P.links || {})) html = html.split(a).join(b);
  const scripts = []; html = html.replace(/<script[\s\S]*?<\/script>/g, s => { scripts.push(s); return '\u0000S' + (scripts.length - 1) + '\u0000'; });
  html = swapMedia(html);
  for (const e of entries) {
    if (e.html === 'raw') {
      // multi-paragraph HTML value: replace from its first words to the end of the wrapping element
      const m = new RegExp('(?:<(?:p|ul|ol|li)[^>]*>)*' + escReH(htmlEsc(e.prefix))).exec(html);
      if (m) { const end = html.indexOf('</div>', m.index); if (end > 0) html = html.slice(0, m.index) + e.to + html.slice(end); }
      continue;
    }
    const pre = htmlEsc(e.prefix), to = htmlEsc(e.to.replace(/<sup>\d<\/sup>/g, '')).replace(/&lt;/g, '<');
    const clip = e.clip != null ? clips[e.clip] : null;
    // text node; a <p> transcript body gets the full clip text
    html = html.replace(new RegExp('(<p)?>(\\s*)' + escReH(pre) + (e.exact ? '' : '[^<]*') + '<', 'g'), (m, p, ws) =>
      (p && clip) ? '<p>' + ws + htmlEsc(clip.body) + '<' : (p ? '<p>' : '>') + ws + to + '<');
    html = html.replace(new RegExp('="([^"]{0,12}?)' + escRe(pre) + (e.exact ? '' : '[^"]*') + '"', 'g'), (m, lead) => '="' + lead + to + '"');
  }
  // their own Organization JSON-LD lives in a plain script tag: drop it (ours is added below)
  scripts.forEach((s, i) => { if (/^<script[^>]*type="application\/ld\+json"/.test(s) && !/__next_f/.test(s) && /Compass/.test(s)) scripts[i] = ''; });
  html = html.replace(/Every journey needs a Compass/g, 'Every mind needs a Harbor').replace(/needs a Compass/g, 'needs a Harbor')
    .replace(/alt="Compass logo white solid\.svg"/g, 'alt="Harbor Mind"');
  html = swapLinks(html);
  html = html.replace(/>\s*Compass\s*</g, '>Harbor<').replace(/="Compass"/g, '="Harbor Mind"');
  html = brand(html);
  html = html.replace(/\u0000S(\d+)\u0000/g, (m, i) => scripts[+i]);
  html = html.replace(/<html lang="[^"]*"/, '<html lang="en"');

  /* 4. SEO + favicon + site styles */
  const url = SITE + urlPath;
  html = html.replace(/<link rel="icon"[^>]*>/g, '').replace(/<link rel="apple-touch-icon"[^>]*>/g, '');
  // their Tag Manager also ships inside the RSC data (inline loader + noscript iframe): neutralize everywhere
  html = html.split('https://www.googletagmanager.com/gtm.js?id=').join('data:text/javascript,//')
    .split('https://www.googletagmanager.com/ns.html?id=').join('about:blank#').split('GTM-NMHGR8KX').join('');
  html = html.replace(/<meta property="og:url" content="[^"]*"\/?>/g, '');
  html = html.replace('</head>', `<link rel="icon" href="/media/favicon.svg" type="image/svg+xml"/>
<meta name="theme-color" content="#2F5D73"/>
<meta property="og:url" content="${url}"/>
<meta name="twitter:card" content="summary_large_image"/>
<script type="application/ld+json">${JSON.stringify(LD)}</script>
<style id="hm-site">
  /* nav wordmark: theirs is sized by width (103px); ours is longer, so pin their 17.33px height instead */
  img[src^="/media/logo-solid.svg"]{width:auto!important;height:17.33px!important;max-width:none!important}
</style>
</head>`);
  html = html.replace(/<link rel="canonical" href="[^"]*"\/?>/, `<link rel="canonical" href="${url}"/>`);

  // /who-we-are -> who-we-are.html (Cloudflare serves it at the extensionless path, no redirect)
  const out = urlPath === '/' ? 'index.html' : urlPath.slice(1) + '.html';
  fs.mkdirSync(path.dirname(path.join(ROOT, out)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, out), html);
  const left = (html.match(/[Cc]ompass/g) || []).length;
  console.log(out.padEnd(44), (html.length / 1024).toFixed(0) + 'KB', '"compass" left:', left);
}

for (const [slug, p] of PAGES) {
  if (slug !== 'home' && !fs.existsSync(path.join(__dirname, 'pages', slug + '.json'))) { console.log('skip', slug, '(no copy yet)'); continue; }
  buildPage(slug, p);
}
if (missingMedia.size) console.log('UNMAPPED MEDIA:', [...missingMedia].join(', '));
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${PAGES.map(([, p]) => `<url><loc>${SITE}${p}</loc></url>`).join('')}</urlset>\n`);
