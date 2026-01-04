import { chromium } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function captureInteraction() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:5174/episode/1');

  // Wait for opening
  await page.waitForTimeout(9000);
  await page.waitForSelector('#intro', { timeout: 5000 });

  // Go to tuples section
  const indicators = await page.$$('[aria-label^="Go to section"]');
  if (indicators.length >= 3) {
    await indicators[2].click();
    await page.waitForTimeout(1000);
  }

  // Screenshot initial state
  await page.screenshot({ path: path.join(__dirname, '../test-results/tuple-1-initial.png') });
  console.log('1. Initial state captured');

  // Click t_xmin field
  const txminButton = await page.$('button:has-text("t_xmin")');
  if (txminButton) {
    await txminButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(__dirname, '../test-results/tuple-2-txmin-clicked.png') });
    console.log('2. t_xmin detail panel captured');
  }

  // Click t_xmax field
  const txmaxButton = await page.$('button:has-text("t_xmax")');
  if (txmaxButton) {
    await txmaxButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(__dirname, '../test-results/tuple-3-txmax-clicked.png') });
    console.log('3. t_xmax detail panel captured');
  }

  // Click t_ctid field
  const ctidButton = await page.$('button:has-text("t_ctid")');
  if (ctidButton) {
    await ctidButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(__dirname, '../test-results/tuple-4-ctid-clicked.png') });
    console.log('4. t_ctid detail panel captured');
  }

  // Close and click Your Data
  await ctidButton?.click(); // close ctid
  await page.waitForTimeout(300);

  const yourDataSection = await page.$('text=YOUR DATA');
  if (yourDataSection) {
    await yourDataSection.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(__dirname, '../test-results/tuple-5-data-expanded.png') });
    console.log('5. Your Data expanded');
  }

  await browser.close();
  console.log('\nAll screenshots saved to test-results/');
}

captureInteraction();
