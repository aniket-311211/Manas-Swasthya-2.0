import { chromium } from 'playwright';
import fs from 'fs';

const STATE = '/sessions/youthful-laughing-lovelace/e2e-state.json';
const EXEC = '/sessions/youthful-laughing-lovelace/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome';

export async function launch({ dark = false } = {}) {
  const browser = await chromium.launch({
    executablePath: EXEC,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    env: { ...process.env, LD_LIBRARY_PATH: '/sessions/youthful-laughing-lovelace/libs/usr/lib/x86_64-linux-gnu' },
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: dark ? 'dark' : 'light',
    storageState: fs.existsSync(STATE) ? STATE : undefined,
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => console.log('PAGE ERROR:', String(e).slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text().slice(0, 250)); });
  return { browser, context, page, saveState: () => context.storageState({ path: STATE }) };
}

export const BASE = 'http://localhost:4173';
