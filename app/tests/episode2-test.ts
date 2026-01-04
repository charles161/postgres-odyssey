import { chromium } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function captureEpisode2() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log('Loading Episode 2...');
  await page.goto('http://localhost:5174/episode/2');

  // Wait for opening animation
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(__dirname, '../test-results/ep2-1-opening.png') });
  console.log('1. Opening captured');

  // Wait for main content to appear
  await page.waitForSelector('#intro', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(__dirname, '../test-results/ep2-2-intro.png') });
  console.log('2. Intro section captured');

  // Navigate to problem section
  const indicators = await page.$$('[aria-label^="Go to section"]');
  if (indicators.length >= 2) {
    await indicators[1].click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(__dirname, '../test-results/ep2-3-problem.png') });
    console.log('3. Problem section captured');
  }

  // Navigate to solution section
  if (indicators.length >= 3) {
    await indicators[2].click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(__dirname, '../test-results/ep2-4-solution.png') });
    console.log('4. Solution section captured');
  }

  // Navigate to WAL action section
  if (indicators.length >= 4) {
    await indicators[3].click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(__dirname, '../test-results/ep2-5-wal-initial.png') });
    console.log('5. WAL section initial state captured');

    // Click INSERT record
    const insertBtn = await page.$('button:has-text("INSERT")');
    if (insertBtn) {
      await insertBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(__dirname, '../test-results/ep2-6-wal-insert.png') });
      console.log('6. WAL INSERT record captured');
    }

    // Click UPDATE record
    const updateBtn = await page.$('button:has-text("UPDATE")');
    if (updateBtn) {
      await updateBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(__dirname, '../test-results/ep2-7-wal-update.png') });
      console.log('7. WAL UPDATE record captured');
    }

    // Click COMMIT record
    const commitBtn = await page.$('button:has-text("COMMIT")');
    if (commitBtn) {
      await commitBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(__dirname, '../test-results/ep2-8-wal-commit.png') });
      console.log('8. WAL COMMIT record captured');
    }

    // Click CHECKPOINT record
    const checkpointBtn = await page.$('button:has-text("CHECKPOINT")');
    if (checkpointBtn) {
      await checkpointBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(__dirname, '../test-results/ep2-9-wal-checkpoint.png') });
      console.log('9. WAL CHECKPOINT record captured');
    }
  }

  // Navigate to checkpoint section
  if (indicators.length >= 5) {
    await indicators[4].click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(__dirname, '../test-results/ep2-10-checkpoint-section.png') });
    console.log('10. Checkpoint section captured');
  }

  // Navigate to conclusion
  if (indicators.length >= 6) {
    await indicators[5].click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(__dirname, '../test-results/ep2-11-conclusion.png') });
    console.log('11. Conclusion captured');
  }

  await browser.close();
  console.log('\nAll Episode 2 screenshots saved to test-results/');
}

captureEpisode2();
