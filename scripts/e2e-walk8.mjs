import { launch, BASE } from './e2e-lib.mjs';
const S = '/sessions/youthful-laughing-lovelace/mnt/outputs/shots';
const { browser, page } = await launch();
await page.goto(`${BASE}/community`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(()=>{});
await page.waitForTimeout(3000);
console.log('seeded mentors visible:', await page.locator('text=Priya Sharma').count() > 0, await page.locator('text=Sneha Iyer').count() > 0);
await page.screenshot({ path: `${S}/community-mentors.png`, fullPage: true });
// start a mentor chat
await page.locator('button:has-text("Start Chat")').first().click();
await page.waitForTimeout(3000);
await page.screenshot({ path: `${S}/mentor-chat.png` });
console.log('mentor chat opened');
await browser.close();
