import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../test-results');

async function analyzeScrollSnap() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();
  const results: string[] = [];
  const consoleErrors: string[] = [];

  // Capture console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(`Page Error: ${err.message}`);
  });

  const log = (msg: string) => {
    console.log(msg);
    results.push(msg);
  };

  log('=== Scroll Snap Analysis ===\n');

  try {
    // First test home page
    log('0. Testing home page first...');
    await page.goto('http://localhost:5174/');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '00-home.png') });

    // Check for errors
    if (consoleErrors.length > 0) {
      log('   Console errors on home:');
      consoleErrors.forEach(e => log(`   - ${e}`));
    }

    // Navigate to episode page (route is /episode/1)
    log('1. Navigating to episode page...');
    await page.goto('http://localhost:5174/episode/1');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-initial.png') });

    // Check for errors after navigation
    if (consoleErrors.length > 0) {
      log('   Console errors:');
      consoleErrors.forEach(e => log(`   - ${e}`));
      consoleErrors.length = 0;
    }

    // Wait for opening animation - take more frequent screenshots
    log('2. Waiting for opening animation...');
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, `02-opening-${i+1}s.png`) });
      log(`   Screenshot at ${i+1}s`);
    }

    // Check for intro - it may already be visible or we may need to skip opening
    log('3. Checking for intro section...');
    const introVisible = await page.$('#intro');
    if (!introVisible) {
      log('   Intro not visible yet, checking page content...');
      const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
      log(`   Body preview: ${bodyHTML.substring(0, 200)}...`);

      // Try clicking to skip or wait more
      await page.waitForTimeout(5000);
    }

    await page.waitForSelector('#intro', { timeout: 10000 });
    log('3. Content loaded, intro section visible');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03-intro-section.png') });

    // Test scroll down behavior
    log('\n--- Testing Scroll Down ---');

    // Scroll down a partial amount (simulate user scrolling)
    const scrollTests = [
      { delta: 300, description: 'Small scroll down (300px)' },
      { delta: 500, description: 'Medium scroll down (500px)' },
      { delta: 800, description: 'Large scroll down (800px)' },
    ];

    for (let i = 0; i < scrollTests.length; i++) {
      const test = scrollTests[i];
      log(`\n4.${i + 1}. ${test.description}`);

      const beforeScroll = await page.evaluate(() => window.scrollY);
      log(`   Before: scrollY = ${beforeScroll}`);

      // Perform scroll
      await page.mouse.wheel(0, test.delta);

      // Wait a moment for scroll to happen
      await page.waitForTimeout(200);
      const duringScroll = await page.evaluate(() => window.scrollY);
      log(`   During: scrollY = ${duringScroll}`);

      // Wait for snap to complete
      log('   Waiting for snap...');
      const snapStartTime = Date.now();
      await page.waitForTimeout(1500);
      const afterSnap = await page.evaluate(() => window.scrollY);
      const snapDuration = Date.now() - snapStartTime;

      log(`   After snap: scrollY = ${afterSnap}`);
      log(`   Snap happened: ${duringScroll !== afterSnap ? 'YES' : 'NO'}`);
      log(`   Wait time: ${snapDuration}ms`);

      await page.screenshot({
        path: path.join(OUTPUT_DIR, `04-${i + 1}-after-scroll-${test.delta}px.png`)
      });

      // Reset to top for next test
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
    }

    // Test scroll up behavior
    log('\n--- Testing Scroll Up ---');

    // First scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05-at-bottom.png') });

    const bottomScroll = await page.evaluate(() => window.scrollY);
    log(`\n5. At bottom: scrollY = ${bottomScroll}`);

    // Scroll up
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(200);
    const afterScrollUp = await page.evaluate(() => window.scrollY);
    log(`   After scroll up: scrollY = ${afterScrollUp}`);

    await page.waitForTimeout(1500);
    const afterSnapUp = await page.evaluate(() => window.scrollY);
    log(`   After snap: scrollY = ${afterSnapUp}`);
    log(`   Snap happened: ${afterScrollUp !== afterSnapUp ? 'YES' : 'NO'}`);

    await page.screenshot({ path: path.join(OUTPUT_DIR, '06-after-scroll-up.png') });

    // Analyze snap indicator
    log('\n--- Snap Indicator Analysis ---');
    const indicators = await page.$$('[aria-label^="Go to section"]');
    log(`6. Found ${indicators.length} snap indicators`);

    // Check which indicator is active
    for (let i = 0; i < indicators.length; i++) {
      const style = await indicators[i].evaluate((el) => {
        const computedStyle = window.getComputedStyle(el);
        return {
          background: computedStyle.background,
          boxShadow: computedStyle.boxShadow,
        };
      });
      log(`   Indicator ${i + 1}: ${style.boxShadow.includes('rgb') ? 'ACTIVE (has glow)' : 'inactive'}`);
    }

    // Test clicking indicators
    log('\n--- Testing Indicator Navigation ---');
    if (indicators.length >= 3) {
      log('7. Clicking indicator 3 (tuples section)...');
      await indicators[2].click();
      await page.waitForTimeout(1200);
      const afterClick = await page.evaluate(() => window.scrollY);
      log(`   ScrollY after click: ${afterClick}`);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '07-after-indicator-click.png') });
    }

    // Summary
    log('\n=== Analysis Summary ===');
    log('Screenshots saved to: ' + OUTPUT_DIR);
    log('\nKey observations:');
    log('- Check if snapping feels delayed (should be < 200ms after scroll stops)');
    log('- Check if direction is respected');
    log('- Check if indicator clicks work smoothly');

  } catch (error) {
    log(`\nERROR: ${error}`);
  } finally {
    await context.close();
    await browser.close();

    // Save results
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'analysis-results.txt'),
      results.join('\n')
    );
    log('\nResults saved to: ' + path.join(OUTPUT_DIR, 'analysis-results.txt'));
  }
}

analyzeScrollSnap();
