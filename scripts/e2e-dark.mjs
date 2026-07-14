import { launch, BASE } from './e2e-lib.mjs';
const { browser, page } = await launch();
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await page.evaluate(() => localStorage.setItem('theme', 'dark'));
await page.reload({ waitUntil: 'networkidle' }).catch(()=>{});
await page.waitForTimeout(2500);
await page.screenshot({ path: '/sessions/youthful-laughing-lovelace/mnt/outputs/shots/dash-dark2.png' });
console.log('done');
await browser.close();
