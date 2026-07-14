import { launch, BASE } from './e2e-lib.mjs';
const S = '/sessions/youthful-laughing-lovelace/mnt/outputs/shots';
const { browser, page } = await launch();

// Dark mode dashboard
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(2500);
await page.evaluate(() => localStorage.setItem('theme', 'dark'));
await page.reload({ waitUntil: 'networkidle' }).catch(()=>{});
await page.waitForTimeout(2500);
await page.screenshot({ path: `${S}/dash-dark.png`, fullPage: true });

// Log a mood (dark)
const moodBtn = page.locator('button[aria-label^="Log mood"]').first();
if (await moodBtn.count()) { await moodBtn.click(); await page.waitForTimeout(2000); console.log('mood logged'); }
await page.screenshot({ path: `${S}/dash-dark-mood.png` });

// back to light for rest
await page.evaluate(() => localStorage.setItem('theme', 'light'));
console.log('walk1 done');
await browser.close();
