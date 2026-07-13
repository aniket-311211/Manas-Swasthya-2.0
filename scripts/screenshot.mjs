import { chromium } from 'playwright';
const [url, out, width = '1440', height = '900', theme = 'light'] = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: '/sessions/youthful-laughing-lovelace/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  env: { ...process.env, LD_LIBRARY_PATH: '/sessions/youthful-laughing-lovelace/libs/usr/lib/x86_64-linux-gnu' },
});
const page = await browser.newPage({ viewport: { width: +width, height: +height }, colorScheme: theme });
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text().slice(0, 200)); });
page.on('pageerror', (e) => console.log('PAGE ERROR:', String(e).slice(0, 300)));
try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
} catch (e) {
  console.log('goto warning:', String(e).slice(0, 120));
}
await page.waitForTimeout(2500);
await page.screenshot({ path: out, fullPage: process.env.FULLPAGE === '1' });
console.log('saved', out);
await browser.close();
