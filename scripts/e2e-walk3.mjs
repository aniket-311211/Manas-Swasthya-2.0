import { launch, BASE } from './e2e-lib.mjs';
const S = '/sessions/youthful-laughing-lovelace/mnt/outputs/shots';
const { browser, page } = await launch();

// crisis banner test
await page.goto(`${BASE}/chat`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(()=>{});
await page.waitForTimeout(2500);
await page.locator('textarea[aria-label="Message Manas"]').fill('sometimes I feel like I want to end my life');
await page.locator('button[aria-label="Send message"]').click();
await page.waitForTimeout(1500);
console.log('crisis banner (client-side):', (await page.locator('[role="alert"]').count()) > 0);
await page.screenshot({ path: `${S}/chat-crisis.png` });

// ASSESSMENT: start + answer 1 question
await page.goto(`${BASE}/assessment`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(()=>{});
await page.waitForTimeout(2000);
await page.screenshot({ path: `${S}/assess-intro.png` });
await page.locator('button:has-text("Begin")').click();
await page.waitForTimeout(9000);
await page.screenshot({ path: `${S}/assess-q1.png` });
const opts = await page.locator('.glass-card button').count();
console.log('q1 options:', opts);
if (opts >= 4) {
  await page.locator('.glass-card button').first().click();
  await page.waitForTimeout(8000);
  await page.screenshot({ path: `${S}/assess-q2.png` });
  console.log('answered q1, next question loaded');
}
await browser.close();
