import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 1080,
    height: 1920,
    deviceScaleFactor: 2,
  });

  const coverPath = join(__dirname, '..', 'cover.html');
  await page.goto(`file://${coverPath}`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('.cover', { timeout: 10000 });
  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 2000));

  await page.screenshot({
    path: join(__dirname, '..', 'assets', 'cover.png'),
    fullPage: false,
    clip: { x: 0, y: 0, width: 1080, height: 1920 },
  });

  console.log('Cover saved: assets/cover.png');
  await browser.close();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
