import { launch, BASE } from './e2e-lib.mjs';
import 'dotenv/config';

const resp = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: 'user_3GTWK6pB1N5MMp2mvv6PNWTpNr9', expires_in_seconds: 600 }),
});
const { token } = await resp.json();

const { browser, page, saveState } = await launch();
await page.goto(`${BASE}/sign-in#/?__clerk_ticket=${token}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(8000);
console.log('URL after ticket:', page.url());
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
await page.waitForTimeout(3000);
const signedIn = await page.evaluate(() => !!window.Clerk?.user);
console.log('signedIn:', signedIn, '| URL:', page.url());
await page.screenshot({ path: '/sessions/youthful-laughing-lovelace/mnt/outputs/shots/dash-light.png', fullPage: true });
await saveState();
await browser.close();
