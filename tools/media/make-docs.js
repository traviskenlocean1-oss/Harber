// Harbor Mind downloadable guides -> media/docs/*.pdf (printed from HTML with Playwright)
//   NODE_PATH=<dir with playwright> node tools/media/make-docs.js
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const OUT = path.join(__dirname, '../../media/docs');
fs.mkdirSync(OUT, { recursive: true });
const font = 'file:///' + path.join(__dirname, '../../media/fonts/geist-latin.woff2').split(path.sep).join('/');
const page = (title, kicker, body) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Geist;src:url("${font}") format("woff2");font-weight:100 900}
@page{size:Letter;margin:0}
body{margin:0;font:400 11.5pt/1.55 Geist,sans-serif;color:#1d1d1b}
.top{background:#2F5D73;color:#fff;padding:46px 56px 40px}
.brand{font-weight:700;font-size:13pt;letter-spacing:-.01em;margin-bottom:34px}
.k{font-size:8.5pt;letter-spacing:.14em;text-transform:uppercase;opacity:.75;margin-bottom:8px}
h1{font-weight:400;font-size:30pt;line-height:1.05;margin:0;letter-spacing:-.02em}
main{padding:34px 56px 90px}
h2{font-weight:500;font-size:13.5pt;margin:22px 0 6px}
li{margin:4px 0}
.box{border:1px solid #d8e3e8;border-radius:8px;padding:14px 18px;margin-top:22px;background:#eef4f4}
.foot{position:fixed;bottom:28px;left:56px;right:56px;font-size:8.5pt;color:#6b6b66;border-top:1px solid #e4e2dc;padding-top:10px}
</style></head><body><div class="top"><div class="brand">harbor mind</div><div class="k">${kicker}</div><h1>${title}</h1></div><main>${body}</main>
<div class="foot">Harbor Mind · Therapy in Miami &amp; online · (305) 555-0142 · hello@harbormindtherapy.com · In crisis? Call or text 988.</div></body></html>`;
const DOCS = {
  'first-session-guide': page('Your first session', 'Guide', `
<p>Starting therapy can feel like a big step. Here’s what to expect, so you can walk in (or log on) feeling prepared.</p>
<h2>Before you arrive</h2><ul><li>Fill out the short intake form we email you. It takes about 10 minutes.</li><li>For online sessions, find a private, quiet spot and test your camera and sound.</li><li>Jot down a few notes on what’s been hard lately and what you’d like to change.</li></ul>
<h2>During the session</h2><ul><li>Your therapist will ask what brought you in and what you hope to get out of therapy.</li><li>You decide how much to share. There’s no pressure to tell everything at once.</li><li>You’ll talk about confidentiality and how sessions will work going forward.</li></ul>
<h2>After the session</h2><ul><li>Notice how you feel. Tiredness or relief are both normal.</li><li>Ask yourself: did I feel heard? Could I see myself talking to this person again?</li></ul>
<div class="box"><strong>Not the right fit?</strong> That’s okay. Tell us and we’ll match you with someone else on our team, no awkwardness.</div>`),
  'anxiety-toolkit': page('Anxiety toolkit', 'Free guide', `
<p>Practical exercises our therapists teach most often. None of them replace therapy, but they can make hard moments easier.</p>
<h2>1. Slow your breathing</h2><p>Breathe in through your nose for 4 counts, hold for 4, and breathe out slowly for 6. Repeat five times. A longer exhale helps signal your body that you’re safe.</p>
<h2>2. Name the worry</h2><p>Write the worry down in one sentence. Then ask: what’s the most likely outcome, and what would I do if it happened? Worries often shrink once they’re on paper.</p>
<h2>3. Schedule worry time</h2><p>Give yourself 15 minutes each afternoon to worry on purpose. When a worry shows up at other times, note it and save it for later.</p>
<h2>4. Protect your sleep</h2><ul><li>Keep the same wake-up time every day, even on weekends.</li><li>Put screens away 30 minutes before bed.</li><li>If you can’t sleep after 20 minutes, get up and do something calm until you feel drowsy.</li></ul>
<h2>5. Move a little</h2><p>A 10-minute walk can lower tension and clear your head. Small, regular movement helps more than occasional big workouts.</p>
<div class="box">If anxiety is getting in the way of work, sleep or relationships, it’s a good time to talk to someone. Book a free 15-minute consult at (305) 555-0142.</div>`),
  'grounding-card': page('Grounding card', 'Keep on your phone', `
<p>When feelings get overwhelming, try the 5-4-3-2-1 exercise to bring yourself back to the present moment.</p>
<h2>Notice</h2><ul><li><strong>5</strong> things you can see</li><li><strong>4</strong> things you can touch</li><li><strong>3</strong> things you can hear</li><li><strong>2</strong> things you can smell</li><li><strong>1</strong> thing you can taste</li></ul>
<h2>Then</h2><ul><li>Plant both feet on the floor and press down gently.</li><li>Breathe out slowly, longer than you breathe in.</li><li>Remind yourself: this feeling is strong, and it will pass.</li></ul>
<div class="box"><strong>If you are in crisis,</strong> call or text 988, the Suicide &amp; Crisis Lifeline, any time. If you’re in immediate danger, call 911.</div>`)
};
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage();
  for (const [name, html] of Object.entries(DOCS)) {
    const tmp = path.join(OUT, '_' + name + '.html'); fs.writeFileSync(tmp, html);
    await p.goto('file:///' + tmp.split(path.sep).join('/'), { waitUntil: 'load' }); await p.waitForTimeout(400); fs.unlinkSync(tmp);
    await p.pdf({ path: path.join(OUT, name + '.pdf'), format: 'Letter', printBackground: true });
    console.log(name + '.pdf', (fs.statSync(path.join(OUT, name + '.pdf')).size / 1024).toFixed(0) + 'KB');
  }
  await b.close();
})();
