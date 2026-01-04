import { chromium } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function screenshot() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto('http://localhost:5174/episode/1');

  // Wait for opening, then navigate to tuples section
  await page.waitForTimeout(9000);
  await page.waitForSelector('#intro', { timeout: 5000 });

  // Click the 3rd indicator to go to tuples
  const indicators = await page.$$('[aria-label^="Go to section"]');
  if (indicators.length >= 3) {
    await indicators[2].click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: path.join(__dirname, '../test-results/tuples-section.png') });
  console.log('Screenshot saved to test-results/tuples-section.png');

  await browser.close();
}

screenshot();
