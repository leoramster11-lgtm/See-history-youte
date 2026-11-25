// Renders concept frames to PNG: node render.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  for (const s of [1, 2, 3]) {
    await page.goto('file://' + path.join(__dirname, 'frames.html') + '?scene=' + s);
    await page.waitForFunction(() => window.__done === true, null, { timeout: 60000 });
    await page.locator('canvas').screenshot({ path: path.join(__dirname, `frame-0${s}.png`) });
    console.log('rendered scene', s);
  }
  await browser.close();
})();
