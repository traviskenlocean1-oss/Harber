// Harbor Mind audio clips: Windows text-to-speech (placeholder voices) -> mp3, from the clip text in the copy files.
//   node tools/media/make-voices.js [--force]
// home clips -> voice-1..10, Careers -> voice-11..20, Individuals & Couples -> story-1..10
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const MEDIA = path.join(__dirname, '../../media'), WAV = path.join(__dirname, 'wav');
fs.mkdirSync(WAV, { recursive: true });
const force = process.argv.includes('--force');
const sets = [
  [require('../text.json').clips, i => 'voice-' + (i + 1)],
  [require('../pages/who-we-are__join-us.json').clips, i => 'voice-' + (i + 11)],
  [require('../pages/who-we-serve__patients-and-caregivers.json').clips, i => 'story-' + (i + 1)]
];
const jobs = [];
for (const [clips, name] of sets) clips.forEach((c, i) => {
  const n = name(i);
  if (force || !fs.existsSync(path.join(MEDIA, n + '.mp3'))) jobs.push({ n, voice: c.voice, text: c.body.replace(/’/g, "'").replace(/[“”]/g, '"') });
});
if (!jobs.length) { console.log('all clips exist (use --force to remake)'); process.exit(0); }
const ps = ['Add-Type -AssemblyName System.Speech', '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer', '$s.Rate = -1'];
for (const j of jobs) ps.push(`$s.SelectVoice('${j.voice}')`, `$s.SetOutputToWaveFile('${path.join(WAV, j.n + '.wav')}')`, `$s.Speak('${j.text.replace(/'/g, "''")}')`);
ps.push('$s.SetOutputToNull()', '$s.Dispose()');
const script = path.join(__dirname, '_voices.ps1');
fs.writeFileSync(script, '﻿' + ps.join('\r\n'));
execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script], { stdio: 'inherit' });
fs.unlinkSync(script);
for (const j of jobs) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(WAV, j.n + '.wav'), '-ac', '1', '-b:a', '64k', path.join(MEDIA, j.n + '.mp3')]);
  console.log(j.n + '.mp3', (fs.statSync(path.join(MEDIA, j.n + '.mp3')).size / 1024).toFixed(0) + 'KB');
}
