/**
 * Capture dashboard screenshots for the presentation deck.
 * Run: npm run preview (in another terminal) then node scripts/capture-presentation-screenshots.mjs
 */
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../docs/presentation/screenshots');
const BASE = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173';
const USER = process.env.VITE_APP_USERNAME ?? 'admin';
const PASS = process.env.VITE_APP_PASSWORD ?? 'tamu-psv-2026';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/usr/local/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

async function shot(name) {
  const path = join(OUT, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log('saved', path);
}

async function login() {
  await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 60000 });
  const onLogin = await page.$('input[type="password"]');
  if (onLogin) {
    const inputs = await page.$$('input');
    if (inputs[0]) await inputs[0].type(USER);
    await onLogin.type(PASS);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
    await page.waitForSelector('h2', { timeout: 30000 });
  }
}

try {
  await login();

  await page.waitForSelector('text/Site Compliance Overview', { timeout: 20000 });
  await shot('01-dashboard');

  const kpiButtons = await page.$$('button.card');
  if (kpiButtons[0]) {
    await kpiButtons[0].click();
    await delay(600);
    await shot('02-kpi-modal');
    await page.keyboard.press('Escape');
    await delay(400);
  }

  await page.goto(`${BASE}/equipment/eq-blr2`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('text/Locations', { timeout: 15000 });
  await shot('03-equipment');

  await page.goto(`${BASE}/location/loc-blr2-drum`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('text/PSVs at this location', { timeout: 15000 });
  await shot('04-location');

  await page.goto(`${BASE}/psv/psv-2001`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('text/Datasheet', { timeout: 15000 });
  await shot('05-psv-detail');
} catch (err) {
  console.error('Screenshot capture failed:', err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
