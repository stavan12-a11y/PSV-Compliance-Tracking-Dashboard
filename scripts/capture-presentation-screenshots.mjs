/**
 * Capture dashboard screenshots for the presentation deck.
 *
 * Local preview (default):
 *   npm run build && npm run preview
 *   npm run presentation:screenshots
 *
 * Live production (Supabase login):
 *   PRESENTATION_EMAIL=you@tamu.edu PRESENTATION_PASSWORD=secret \
 *   PREVIEW_URL=https://reliability-and-compliance-dashboar.vercel.app \
 *   npm run presentation:screenshots
 */
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../docs/presentation/screenshots');
const BASE = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173';
const EMAIL = process.env.PRESENTATION_EMAIL ?? process.env.VITE_APP_USERNAME ?? 'admin';
const PASS = process.env.PRESENTATION_PASSWORD ?? process.env.VITE_APP_PASSWORD ?? 'tamu-psv-2026';

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
  const passwordInput = await page.$('input[type="password"]');
  if (!passwordInput) return;

  const emailInput = await page.$('input[type="email"]');
  const textInputs = await page.$$('input:not([type="password"]):not([type="hidden"])');
  const identifierInput = emailInput ?? textInputs[0];
  if (identifierInput) {
    await identifierInput.click({ clickCount: 3 });
    await identifierInput.type(EMAIL);
  }
  await passwordInput.type(PASS);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
  await delay(1500);
}

async function waitForDashboard() {
  await page.waitForFunction(
    () => document.body.innerText.includes('Site Compliance Overview'),
    { timeout: 30000 },
  );
}

async function clickKpi(label) {
  const clicked = await page.evaluate((text) => {
    const buttons = [...document.querySelectorAll('button.card')];
    const match = buttons.find((b) => b.innerText.includes(text));
    if (!match) return false;
    match.click();
    return true;
  }, label);
  if (!clicked) {
    const fallback = await page.$('button.card');
    if (fallback) await fallback.click();
  }
}

try {
  await login();
  await waitForDashboard();
  await delay(800);
  await shot('01-dashboard');

  await clickKpi('Compliant %');
  await delay(700);
  await shot('02-kpi-modal');
  await page.keyboard.press('Escape');
  await delay(400);

  await page.goto(`${BASE}/equipment/eq-blr2`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.body.innerText.includes('Locations'), { timeout: 15000 });
  await delay(600);
  await shot('03-equipment');

  await page.goto(`${BASE}/location/loc-blr2-drum`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.body.innerText.includes('PSVs at this location'), {
    timeout: 15000,
  });
  await delay(600);
  await shot('04-location');

  await page.goto(`${BASE}/psv/psv-2001`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.body.innerText.includes('Datasheet'), { timeout: 15000 });
  await delay(600);
  await shot('05-psv-detail');
} catch (err) {
  console.error('Screenshot capture failed:', err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
