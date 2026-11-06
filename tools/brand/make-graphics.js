// Harbor Mind graphics: line icons, ripple banners, organization name cards.
//   node tools/brand/make-graphics.js
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const MEDIA = path.join(__dirname, '../../media');
for (const d of ['icons', 'orgs']) fs.mkdirSync(path.join(MEDIA, d), { recursive: true });
const FONT = path.join(__dirname, 'geist-700.ttf').split(path.sep).join('/'); // magick wants forward slashes

/* ── icons: same canvas sizes and stroke weight as the reference line art ── */
const L = 'stroke="black" stroke-opacity="0.8" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"';
const S = 'stroke="#1d1d1b" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"';
const icons = {
  // "We move with purpose": four ripples widening out from a point
  'ripples.svg': [275, 139, `<g ${L}>${[18, 42, 70, 100, 132].map((r, i) => `<ellipse cx="137.5" cy="96" rx="${r}" ry="${r * 0.32}" stroke-opacity="${0.85 - i * 0.12}"/>`).join('')}<path d="M137.5 96V30"/><circle cx="137.5" cy="24" r="6"/></g>`],
  // "We're in this together": a lighthouse throwing light both ways
  'lighthouse.svg': [276, 139, `<g ${L}><path d="M126 132l6-86h12l6 86z"/><path d="M128 104h20M130 76h16"/><path d="M128 46h20v-10h-20zM132 36v-8h12v8"/><path d="M138 28v-6"/><path d="M128 40L40 18M128 42L40 66M148 40l88-22M148 42l88 24" stroke-opacity="0.5"/><path d="M20 132h236"/><path d="M60 126c10-4 20-4 30 0M186 126c10-4 20-4 30 0" stroke-opacity="0.6"/></g>`],
  // "We do things right": two linked rings
  'together.svg': [286, 125, `<g ${L}><circle cx="112" cy="62" r="46"/><circle cx="174" cy="62" r="46"/><path d="M143 28c-8 9-12 21-12 34s4 25 12 34" stroke-opacity="0.5"/></g>`],
  // "We always push forward": an anchor
  'anchor.svg': [239, 270, `<g ${L}><circle cx="119.5" cy="38" r="20"/><path d="M119.5 58v186"/><path d="M78 92h83"/><path d="M28 170c4 48 44 78 91.5 78S207 218 211 170"/><path d="M14 184l14-20 18 16M225 184l-14-20-18 16"/></g>`],
  'quote.svg': [140, 140, `<g ${L}><path d="M20 120V70c0-28 14-46 40-54v16c-12 6-18 16-18 30h18v58zM80 120V70c0-28 14-46 40-54v16c-12 6-18 16-18 30h18v58z"/><path d="M20 130h40M80 130h40"/></g>`],
  'lifebuoy.svg': [64, 64, `<g ${S} transform="scale(0.5)"><circle cx="64" cy="64" r="52"/><circle cx="64" cy="64" r="22"/><path d="M28 28l20 20M100 28L80 48M28 100l20-20M100 100L80 80"/></g>`],
  'heart.svg': [64, 64, `<g ${S} transform="scale(0.5)"><path d="M64 112S14 80 14 46c0-17 13-30 29-30 10 0 17 5 21 12 4-7 11-12 21-12 16 0 29 13 29 30 0 34-50 66-50 66z"/></g>`],
  'mind.svg': [64, 64, `<g ${S} transform="scale(0.5)"><path d="M44 116V92c-14-8-24-23-24-40C20 28 40 10 64 10c22 0 40 16 42 38l12 20h-12v18c0 6-5 10-10 10H84v20"/><path d="M60 34v28M46 48h28"/></g>`]
};
for (const [f, [w, h, body]] of Object.entries(icons))
  fs.writeFileSync(path.join(MEDIA, 'icons', f), `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">${body}</svg>`);

/* ── banners: flat palette color + soft ripple rings (their versions use half-circles) ── */
const BANNERS = { 1: '#c8a27c', 2: '#c4d2e6', 3: '#9dbdc0', 4: '#5f8fae', 5: '#c8a27c' };
const tmp = path.join(__dirname, '_tmp.svg');
for (const [n, c] of Object.entries(BANNERS)) {
  for (const [suffix, W, H] of [['', 1920, 533], ['-m', 1920, 1440]]) {
    const cx = W * (n % 2 ? 0.72 : 0.28), cy = H * 0.55, rings = [];
    for (let r = 60; r < W; r += 70 + r * 0.12) rings.push(`<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.55}" stroke="white" stroke-opacity="${Math.max(0.06, 0.32 - r / 3000)}" stroke-width="${3 + r / 160}" fill="none"/>`);
    fs.writeFileSync(tmp, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${c}"/>${rings.join('')}</svg>`);
    execFileSync('magick', ['-background', 'none', tmp, '-quality', '92', path.join(MEDIA, `banner-${n}${suffix}.png`)]);
  }
}
fs.unlinkSync(tmp);

/* ── organization cards: plain names (never their logos), sized like the reference logo slots ── */
const ORGS = {
  '988': ['988 Suicide & Crisis Lifeline', 320, 320], 'crisis-text': ['Crisis Text Line', 320, 320], 'trevor': ['The Trevor Project', 320, 320],
  'nami-miami': ['NAMI Miami-Dade', 320, 320], '211': ['211 Miami', 320, 320], 'mha': ['Mental Health America', 320, 320],
  'apa': ['American Psychological Association', 320, 320], 'dbsa': ['Depression and Bipolar Support Alliance', 320, 320], 'nami': ['National Alliance on Mental Illness', 320, 320]
};
for (const [f, [name, W, H]] of Object.entries(ORGS)) {
  const pad = H > 100 ? 40 : 6;
  execFileSync('magick', ['-size', `${W - pad * 2}x${H - pad * 2}`, '-background', 'white', '-fill', '#2F5D73', '-font', FONT, '-gravity', 'center', 'caption:' + name,
    '-bordercolor', 'white', '-border', String(pad), path.join(MEDIA, 'orgs', f + '.png')]);
}
console.log('icons', Object.keys(icons).length, 'banners', Object.keys(BANNERS).length * 2, 'orgs', Object.keys(ORGS).length);
