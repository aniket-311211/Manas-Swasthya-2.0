import { launch, BASE } from './e2e-lib.mjs';
const S = '/sessions/youthful-laughing-lovelace/mnt/outputs/shots';
const { browser, page } = await launch();
for (const [path, name] of [['/journal','journal'],['/community','community'],['/booking','booking'],['/resources','resources'],['/medicine','medicine']]) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(()=>{});
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${S}/pg-${name}.png`, fullPage: true });
  console.log('shot', name);
}
await browser.close();
