// Renders 3D concept frames: node render.js [scene ...]   (scenes: scale battle hero)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const f = path.join(__dirname, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(__dirname) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const scenes = process.argv.slice(2).length ? process.argv.slice(2) : ['scale', 'battle', 'hero'];
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => m.type() === 'error' && console.error('console:', m.text()));
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  for (const s of scenes) {
    const t = Date.now();
    await page.goto(`http://localhost:${port}/scene.html?scene=${s}`);
    await page.waitForFunction(() => window.__done === true, null, { timeout: 180000 });
    await page.screenshot({ path: path.join(__dirname, 'out', `3d-${s}.png`) });
    console.log('rendered', s, ((Date.now() - t) / 1000).toFixed(1) + 's');
  }
  await browser.close(); server.close();
})();
