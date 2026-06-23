import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'https://ceilf6.github.io/KnowledgeFlow-StudyAgent/';
const OUTPUT_DIR = 'assets/screenshots';

// macOS Chrome path
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
  });

  // Capture home page
  console.log('Capturing home from', BASE_URL);
  await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('#root', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: join(OUTPUT_DIR, 'home.png'), fullPage: false });
  console.log('Saved: home.png');

  // Try navigating to other pages via URL
  const routes = [
    { name: 'plans', path: '/plans' },
    { name: 'study', path: '/study' },
    { name: 'practice', path: '/practice' },
  ];

  for (const route of routes) {
    const url = `${BASE_URL}${route.path}`.replace(/\/+/g, '/').replace('https:/', 'https://');
    console.log(`Capturing ${route.name} from ${url}`);
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
      await page.waitForSelector('#root', { timeout: 5000 });
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: join(OUTPUT_DIR, `${route.name}.png`), fullPage: false });
      console.log(`Saved: ${route.name}.png`);
    } catch (err) {
      console.log(`Direct navigation failed for ${route.name}, trying hash route...`);
      const hashUrl = `${BASE_URL}#${route.path}`;
      await page.goto(hashUrl, { waitUntil: 'networkidle0', timeout: 15000 });
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: join(OUTPUT_DIR, `${route.name}.png`), fullPage: false });
      console.log(`Saved: ${route.name}.png (via hash)`);
    }
  }

  await browser.close();
  console.log('All screenshots captured.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
