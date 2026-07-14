import { launch, BASE } from './e2e-lib.mjs';
const S = '/sessions/youthful-laughing-lovelace/mnt/outputs/shots';
const { browser, page } = await launch();
await page.goto(`${BASE}/community`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(()=>{});
await page.waitForTimeout(3000);
console.log('mentor cards:', await page.locator('text=Certified Peer Counselor').count() + (await page.locator('text=Trained Peer Mentor').count()));
await page.locator('button:has-text("Group Discussion")').click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${S}/community-groups.png`, fullPage: true });
await page.locator('button:has-text("Events")').click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${S}/community-events.png`, fullPage: true });
const reg = page.locator('button:has-text("Register")').first();
if (await reg.count()) { await reg.click(); await page.waitForTimeout(2000); console.log('registered for event'); }
await page.screenshot({ path: `${S}/community-events2.png` });
await browser.close();
