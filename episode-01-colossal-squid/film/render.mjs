// Usage:
//   node render.mjs stills [beatFrom] [beatTo]     -> out/stills/beat-XXX.jpg (mid-frame of each beat)
//   node render.mjs video <fromSec> <toSec> <file> [fps]  -> mp4 segment (no audio)
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
import http from 'http'; import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  let real; try { real = fs.realpathSync(f); } catch { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(real).pipe(res);
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto(`http://localhost:${port}/film/index.html`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
const mode = process.argv[2];
const OUT = path.join(ROOT, 'film', 'out'); fs.mkdirSync(OUT, { recursive: true });

if (mode === 'stills') {
  const beats = await page.evaluate(() => window.BEATS);
  const from = +(process.argv[3] ?? 0), to = +(process.argv[4] ?? beats.length - 1);
  fs.mkdirSync(path.join(OUT, 'stills'), { recursive: true });
  for (let i = from; i <= to; i++) {
    const T = beats[i].start + beats[i].dur * 0.6;
    const b64 = await page.evaluate(t => window.frameJPEG(t, 0.85), T);
    fs.writeFileSync(path.join(OUT, 'stills', `beat-${String(i).padStart(3, '0')}.jpg`), Buffer.from(b64, 'base64'));
  }
  console.log('stills done', from, to);
} else if (mode === 'video') {
  const from = +process.argv[3], to = +process.argv[4], file = process.argv[5], fps = +(process.argv[6] || 24);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((to - from) * fps), t0 = Date.now();
  for (let f = 0; f < n; f++) {
    const T = from + f / fps;
    const b64 = await page.evaluate(t => window.frameJPEG(t, 0.92), T);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 240 === 0) console.log(`${file}: ${f}/${n} frames, ${((Date.now() - t0) / 1000 / Math.max(1, f)).toFixed(2)} s/frame`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log('video done', file, ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
await browser.close(); server.close();
