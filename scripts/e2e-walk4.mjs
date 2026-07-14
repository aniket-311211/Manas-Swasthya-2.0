import { launch, BASE } from './e2e-lib.mjs';
const S = '/sessions/youthful-laughing-lovelace/mnt/outputs/shots';
const { browser, page } = await launch();
await page.goto(`${BASE}/assessment`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(()=>{});
await page.waitForTimeout(2000);
await page.locator('button:has-text("Begin")').click();
// wait for either options or error
await page.waitForSelector('.glass-card h2', { timeout: 25000 }).catch(() => console.log('q1 never appeared'));
const q = await page.locator('.glass-card h2').textContent().catch(() => null);
console.log('Q1:', q?.slice(0, 80));
await page.screenshot({ path: `${S}/assess-q1.png` });
const optBtns = page.locator('.glass-card .grid button');
console.log('options:', await optBtns.count());
await browser.close();
