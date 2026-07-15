/**
 * Capture dashboard screenshots for the presentation deck.
 *
 * Production (recommended — uses your live data):
 *   PRESENTATION_EMAIL=you@tamu.edu PRESENTATION_PASSWORD=secret npm run presentation:screenshots
 *
 * Local preview fallback:
 *   npm run build && npm run preview
 *   PREVIEW_URL=http://127.0.0.1:4173 npm run presentation:screenshots
 */
import { mkdirSync, readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../docs/presentation/screenshots');
const PRODUCTION = 'https://reliability-and-compliance-dashboar.vercel.app';

// Optional .env.presentation (gitignored) for live dashboard login
function loadDotenv() {
  const path = join(__dirname, '../.env.presentation');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
loadDotenv();

const BASE = process.env.PREVIEW_URL ?? PRODUCTION;
const EMAIL = process.env.PRESENTATION_EMAIL ?? '';
const PASS = process.env.PRESENTATION_PASSWORD ?? '';
const LOCAL = BASE.includes('127.0.0.1') || BASE.includes('localhost');

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

  const onLogin = await page.evaluate(() => document.body.innerText.includes('Sign in'));
  if (!onLogin) return;

  const emailInput = await page.$('input[type="email"]');
  const identifier = emailInput ?? (await page.$$('input:not([type="password"]):not([type="hidden"])'))[0];

  const user = EMAIL || (LOCAL ? 'admin' : '');
  const pass = PASS || (LOCAL ? 'tamu-psv-2026' : '');

  if (!user || !pass) {
    throw new Error(
      'Live dashboard requires login. Set PRESENTATION_EMAIL and PRESENTATION_PASSWORD, ' +
        'or create .env.presentation (see .env.presentation.example).',
    );
  }

  if (identifier) {
    await identifier.click({ clickCount: 3 });
    await identifier.type(user, { delay: 20 });
  }
  await passwordInput.click({ clickCount: 3 });
  await passwordInput.type(pass, { delay: 20 });
  await page.click('button[type="submit"]');
  await delay(3000);

  const stillLogin = await page.evaluate(() => document.body.innerText.includes('Sign in') && !!document.querySelector('input[type="password"]'));
  if (stillLogin) throw new Error('Login failed — check PRESENTATION_EMAIL / PRESENTATION_PASSWORD');
}

async function waitForDashboard() {
  await page.waitForFunction(
    () => document.body.innerText.includes('Site Compliance Overview'),
    { timeout: 30000 },
  );
}

async function clickKpi(label) {
  await page.evaluate((text) => {
    const btn = [...document.querySelectorAll('button.card')].find((b) => b.innerText.includes(text));
    if (btn) btn.click();
  }, label);
}

async function firstHref(prefix) {
  return page.evaluate((p) => {
    const link = document.querySelector(`a[href*="${p}"]`);
    return link ? link.getAttribute('href') : null;
  }, prefix);
}

async function clickSectionCard(sectionHeading) {
  return page.evaluate((heading) => {
    const h3 = [...document.querySelectorAll('h3')].find((h) =>
      h.innerText.trim().startsWith(heading),
    );
    const container = h3?.closest('section') ?? h3?.parentElement;
    const card = container?.querySelector('.card.cursor-pointer');
    if (card) {
      card.click();
      return true;
    }
    return false;
  }, sectionHeading);
}

async function clickFirstFaceplate() {
  return page.evaluate(() => {
    const h3 = [...document.querySelectorAll('h3')].find((h) =>
      h.innerText.includes('PSVs at this location'),
    );
    const grid = h3?.nextElementSibling;
    const btn = grid?.querySelector('button.group');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
}

async function gotoPath(path, fallback) {
  const target = path ?? (LOCAL ? fallback : null);
  if (target) await page.goto(`${BASE.replace(/\/$/, '')}${target}`, { waitUntil: 'networkidle0' });
}

try {
  console.log('Capturing from:', BASE);
  await login();
  await waitForDashboard();
  await delay(1000);
  await shot('01-dashboard');

  await clickKpi('Compliant %');
  await delay(800);
  await shot('02-kpi-modal');
  await page.keyboard.press('Escape');
  await delay(500);

  if (!(await clickSectionCard('Equipment'))) {
    await gotoPath(await firstHref('/equipment/'), '/equipment/eq-blr2');
  }
  await delay(1500);
  await page.waitForFunction(() => document.body.innerText.includes('Locations'), { timeout: 20000 });
  await delay(800);
  await shot('03-equipment');

  if (!(await clickSectionCard('Locations'))) {
    await gotoPath(await firstHref('/location/'), '/location/loc-blr2-drum');
  }
  await delay(1500);
  await page.waitForFunction(() => document.body.innerText.includes('PSVs at this location'), {
    timeout: 20000,
  });
  await delay(800);
  await shot('04-location');

  if (!(await clickFirstFaceplate())) {
    await gotoPath(await firstHref('/psv/'), '/psv/psv-2001');
  }
  await delay(1500);
  await page.waitForFunction(() => document.body.innerText.includes('Datasheet'), { timeout: 20000 });
  await delay(800);
  await shot('05-psv-detail');

  console.log('Done — screenshots saved to docs/presentation/screenshots/');
} catch (err) {
  console.error('Screenshot capture failed:', err.message || err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
