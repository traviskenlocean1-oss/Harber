// Harbor Mind stills: frames from Mixkit (free license) clips, cropped to each reference image's shape.
//   node tools/media/make-stills.js [name ...]
// spec: [out, mixkitId, seconds, width, height, centerX 0-1, centerY 0-1, zoom, treatment]
//   treatment: '' | 'soft' (gentle blur, footers) | 'bokeh' (heavy blur, textures)
const fs = require('fs'), path = require('path'), https = require('https'), { execFileSync } = require('child_process');
const MEDIA = path.join(__dirname, '../../media'), CACHE = path.join(__dirname, 'clips');
fs.mkdirSync(CACHE, { recursive: true });
const S = [
  ['team-1', 28758, 5, 1200, 1200, .50, .42, 1.0, ''], ['team-2', 32845, 2, 1200, 1200, .62, .45, 1.0, ''],
  ['team-3', 33431, 2, 1200, 1200, .50, .5, 1.15, ''], ['team-4', 33210, 2, 1200, 1200, .47, .45, 1.15, ''],
  ['team-5', 21386, 2, 1200, 1200, .38, .42, 1.35, ''], ['team-6', 32161, 2, 1200, 1200, .53, .36, 1.6, ''],
  ['team-7', 52196, 2, 1200, 1200, .55, .5, 1.15, ''],
  ['talk-1', 2947, 3, 1600, 900, .5, .5, 1, ''], ['talk-2', 52193, 3, 1600, 900, .5, .5, 1, ''],
  ['talk-3', 52181, 3, 1600, 900, .5, .5, 1, ''], ['talk-4', 2951, 3, 1600, 900, .5, .5, 1, ''],
  ['talk-5', 44048, 3, 1600, 900, .5, .5, 1, ''],
  ['people-writing', 4957, 2, 1600, 893, .5, .5, 1, ''], ['people-session', 12900, 2, 1200, 669, .5, .5, 1, ''],
  ['people-couch', 6324, 2, 1600, 893, .5, .5, 1, ''], ['people-notes', 4811, 2, 1200, 669, .5, .5, 1, ''],
  ['people-beach', 44475, 2, 1200, 669, .5, .5, 1, ''], ['people-room', 28957, 2, 1600, 893, .5, .5, 1, ''],
  ['people-parent', 4790, 2, 1200, 669, .5, .5, 1, ''], ['people-window', 25145, 2, 1200, 669, .5, .5, 1, ''],
  ['landscape-shore', 7491, 2, 1600, 893, .5, .5, 1, ''], ['landscape-harbor', 40098, 2, 1600, 893, .5, .5, 1, ''],
  ['texture-light', 3977, 2, 1600, 893, .5, .5, 1, 'bokeh'], ['texture-rain', 20311, 2, 1600, 993, .5, .5, 1, 'bokeh'],
  ['texture-shore', 7509, 2, 1200, 1795, .5, .5, 1, 'bokeh'], ['texture-dock', 1197, 2, 1600, 1133, .5, .5, 1, 'bokeh'],
  ['footer-2', 7487, 2, 1920, 1433, .5, .5, 1, 'soft'], ['footer-3', 7502, 2, 1920, 1433, .5, .5, 1, 'soft'],
  ['footer-4', 7509, 4, 1920, 1071, .5, .5, 1, 'soft'], ['footer-5', 40097, 2, 1920, 1433, .5, .5, 1, 'soft'],
  ['footer-6', 1086, 2, 1920, 1433, .5, .5, 1, 'soft'], ['footer-7', 7501, 2, 1920, 1433, .5, .5, 1, 'soft'],
  ['footer-8', 30946, 2, 1920, 1433, .5, .5, 1, 'soft'], ['footer-9', 26716, 2, 1920, 1433, .5, .5, 1, 'soft']
];
const get = (u, f) => new Promise((res, rej) => https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
  if (r.statusCode !== 200) return rej(new Error(r.statusCode + ' ' + u));
  const w = fs.createWriteStream(f); r.pipe(w); w.on('finish', res);
}).on('error', rej));
(async () => {
  const only = process.argv.slice(2);
  for (const [name, id, t, W, H, cx, cy, zoom, fx] of S) {
    if (only.length && !only.includes(name)) continue;
    const clip = path.join(CACHE, id + '.mp4');
    if (!fs.existsSync(clip)) await get(`https://assets.mixkit.co/videos/${id}/${id}-720.mp4`, clip);
    const frame = path.join(CACHE, id + '-' + t + '.png');
    if (!fs.existsSync(frame)) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(t), '-i', clip, '-frames:v', '1', frame]);
    const [fw, fh] = execFileSync('magick', ['identify', '-format', '%w %h', frame]).toString().split(' ').map(Number);
    // largest box of the target shape that fits, shrunk by zoom, centered on (cx, cy) and kept inside the frame
    const ar = W / H; let cw = fw, ch = fw / ar; if (ch > fh) { ch = fh; cw = fh * ar; }
    cw /= zoom; ch /= zoom;
    const x = Math.max(0, Math.min(fw - cw, cx * fw - cw / 2)), y = Math.max(0, Math.min(fh - ch, cy * fh - ch / 2));
    const args = [frame, '-crop', `${Math.round(cw)}x${Math.round(ch)}+${Math.round(x)}+${Math.round(y)}`, '+repage',
      '-filter', 'Lanczos', '-resize', `${W}x${H}!`, '-unsharp', '0x0.8+0.6+0.02'];
    if (fx === 'soft') args.push('-blur', '0x6');
    if (fx === 'bokeh') args.push('-blur', '0x28', '-modulate', '104,90');
    // gentle shared grade: slightly warmer, softer contrast (matches the homepage stills)
    args.push('-modulate', '100,94', '-sigmoidal-contrast', '2,50%', '-quality', '80', '-strip', path.join(MEDIA, name + '.jpg'));
    execFileSync('magick', args);
    console.log(name, `${W}x${H}`, (fs.statSync(path.join(MEDIA, name + '.jpg')).size / 1024).toFixed(0) + 'KB');
  }
  process.exit(0);
})();
