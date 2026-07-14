import { launch, BASE } from './e2e-lib.mjs';
const S = '/sessions/youthful-laughing-lovelace/mnt/outputs/shots';
const { browser, page } = await launch();

// CHAT
await page.goto(`${BASE}/chat`, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(2500);
const ta = page.locator('textarea[aria-label="Message Manas"]');
await ta.fill("I'm really stressed about my exams next week");
await page.locator('button[aria-label="Send message"]').click();
await page.waitForTimeout(9000);
await page.screenshot({ path: `${S}/chat-reply.png`, fullPage: true });
const msgs = await page.locator('[role="log"] > div').count();
console.log('chat bubbles:', msgs);

// crisis message
await ta.fill('sometimes I feel like I want to end my life');
await page.locator('button[aria-label="Send message"]').click();
await page.waitForTimeout(9000);
const crisis = await page.locator('[role="alert"]').count();
console.log('crisis banner:', crisis > 0);
await page.screenshot({ path: `${S}/chat-crisis.png`, fullPage: true });
await browser.close();
