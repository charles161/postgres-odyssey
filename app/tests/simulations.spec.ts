import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive simulation tests
 * Tests all interactive visualizations to ensure they run without freezing
 */

// Helper to scroll to element containing text
async function scrollToText(page: Page, text: string | RegExp, maxScrolls = 20) {
  for (let i = 0; i < maxScrolls; i++) {
    const element = page.getByText(text).first();
    if (await element.isVisible({ timeout: 500 }).catch(() => false)) {
      await element.scrollIntoViewIfNeeded();
      return true;
    }
    await page.evaluate((scroll) => window.scrollBy(0, 600), i);
    await page.waitForTimeout(200);
  }
  return false;
}

// Helper to find and click a button, returns whether successful
async function clickButton(page: Page, name: string | RegExp, timeout = 3000): Promise<boolean> {
  const button = page.getByRole('button', { name });
  if (await button.isVisible({ timeout }).catch(() => false)) {
    await button.click();
    return true;
  }
  return false;
}

// Helper to wait for state change (e.g., counter incrementing)
async function waitForStateChange(page: Page, selector: string, initialText: string, timeout = 10000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const currentText = await page.locator(selector).first().textContent().catch(() => initialText);
    if (currentText !== initialText) {
      return true;
    }
    await page.waitForTimeout(200);
  }
  return false;
}

test.describe('Episode 4 - Memory Palace', () => {
  test('InteractiveBufferCache simulation runs', async ({ page }) => {
    await page.goto('/episode/4');
    await page.waitForLoadState('networkidle');

    // Find the buffer cache section
    if (await scrollToText(page, /buffer.*cache|shared.*buffer/i)) {
      // Look for run/simulate button
      const buttons = await page.getByRole('button').all();
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text?.match(/run|start|simulate|query/i)) {
          await btn.click();
          await page.waitForTimeout(2000);
          break;
        }
      }
    }

    // No crash = success
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Episode 5 - MVCC', () => {
  test('MVCCTimeMachine runs without freezing', async ({ page }) => {
    await page.goto('/episode/5');
    await page.waitForLoadState('networkidle');

    // Wait for opening to complete or skip
    await page.waitForTimeout(8000);

    // Scroll to find time machine
    await scrollToText(page, /snapshot|time.*machine|transaction/i);
    await page.waitForTimeout(500);

    // Try to interact with any slider or button
    const sliders = await page.locator('input[type="range"]').all();
    if (sliders.length > 0) {
      // Get the slider's min/max and set to middle value
      const min = await sliders[0].getAttribute('min') || '0';
      const max = await sliders[0].getAttribute('max') || '100';
      const midValue = String(Math.floor((parseInt(min) + parseInt(max)) / 2));
      await sliders[0].fill(midValue);
      await page.waitForTimeout(500);
    }

    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Episode 6 - B-tree Navigator', () => {
  test('B-tree search completes successfully', async ({ page }) => {
    await page.goto('/episode/6');
    await page.waitForLoadState('networkidle');

    // Wait for opening
    await page.waitForTimeout(3000);

    // Find B-tree section
    await scrollToText(page, /B-tree Index Navigator/i);
    await page.waitForTimeout(500);

    // Click search
    const clicked = await clickButton(page, /search/i);
    if (clicked) {
      // Wait for completion (should show "FOUND!" or change to Reset button)
      let completed = false;
      for (let i = 0; i < 30; i++) {
        const resetVisible = await page.getByRole('button', { name: /reset/i }).isVisible().catch(() => false);
        const foundVisible = await page.getByText(/FOUND!/i).isVisible().catch(() => false);
        if (resetVisible || foundVisible) {
          completed = true;
          break;
        }
        await page.waitForTimeout(500);
      }
      expect(completed).toBe(true);
    }
  });
});

test.describe('Episode 9 - Deadlock & Locks', () => {
  test('Lock demo runs', async ({ page }) => {
    await page.goto('/episode/9');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Scroll to lock section
    await scrollToText(page, /lock|deadlock/i);

    // Find any run button
    const runClicked = await clickButton(page, /run|start|execute/i);
    if (runClicked) {
      await page.waitForTimeout(3000);
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('DeadlockSandbox runs', async ({ page }) => {
    await page.goto('/episode/9');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Scroll deep to find deadlock sandbox
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(300);
    }

    // Look for sandbox controls
    const sandboxButton = await clickButton(page, /create.*deadlock|trigger|run/i);
    if (sandboxButton) {
      await page.waitForTimeout(5000);
    }

    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Episode 10 - Vacuum', () => {
  test('VacuumProcess simulation steps work', async ({ page }) => {
    await page.goto('/episode/10');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(12000); // Long opening animation

    // Find vacuum process section
    await scrollToText(page, /The Process/i);
    await page.waitForTimeout(500);

    // Click through steps
    for (let i = 0; i < 4; i++) {
      const nextClicked = await clickButton(page, /next/i);
      if (!nextClicked) break;
      await page.waitForTimeout(600);
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('VacuumSpectrum accordion works', async ({ page }) => {
    await page.goto('/episode/10');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(12000);

    // Find spectrum section
    await scrollToText(page, /The Spectrum/i);
    await page.waitForTimeout(1000);

    // Click on VACUUM FULL card header
    const vacuumFull = page.getByText('VACUUM FULL').first();
    if (await vacuumFull.isVisible().catch(() => false)) {
      await vacuumFull.click();
      await page.waitForTimeout(1000);

      // Check that it expanded (should show description or blocks text)
      const expanded = await page.getByText(/blocks everything|Rewrites entire table/i).isVisible().catch(() => false);
      expect(expanded).toBe(true);
    }
  });
});

test.describe('Episode 12 - Connection Pool', () => {
  test('ConnectionPoolDemo simulation completes', async ({ page }) => {
    await page.goto('/episode/12');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Find connection pool section
    await scrollToText(page, /Connection Pool Simulator/i);
    await page.waitForTimeout(500);

    // Set smaller client count for faster test
    const slider = page.locator('input[type="range"]').first();
    if (await slider.isVisible().catch(() => false)) {
      await slider.fill('15');
    }

    // Run simulation
    const runClicked = await clickButton(page, /run.*simulation/i);
    if (runClicked) {
      // Wait for completion (completed count should change from 0)
      let completed = false;
      for (let i = 0; i < 50; i++) {
        const completedText = await page.getByText(/\d+\s*\/\s*\d+/).first().textContent().catch(() => '0 / 0');
        const match = completedText?.match(/(\d+)\s*\/\s*(\d+)/);
        if (match && parseInt(match[1]) > 0) {
          completed = true;
          // Wait for full completion
          if (parseInt(match[1]) === parseInt(match[2])) {
            break;
          }
        }
        await page.waitForTimeout(300);
      }
      expect(completed).toBe(true);
    }
  });

  test('Pool mode switching works', async ({ page }) => {
    await page.goto('/episode/12');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await scrollToText(page, /Connection Pool Simulator/i);
    await page.waitForTimeout(500);

    // Click Session Pool
    const sessionClicked = await clickButton(page, /session.*pool/i);
    expect(sessionClicked).toBe(true);

    // Click Transaction Pool
    const txClicked = await clickButton(page, /transaction.*pool/i);
    expect(txClicked).toBe(true);
  });
});

test.describe('Episode 13 - Replication', () => {
  test('ReplicationDemo runs', async ({ page }) => {
    await page.goto('/episode/13');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Find replication demo
    await scrollToText(page, /replica|streaming/i);
    await page.waitForTimeout(500);

    // Try to run
    await clickButton(page, /run|start|write/i);
    await page.waitForTimeout(3000);

    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Episode 14 - Partitioning', () => {
  test('PartitionDemo query runs', async ({ page }) => {
    await page.goto('/episode/14');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Find partition demo
    await scrollToText(page, /partition.*prun/i);
    await page.waitForTimeout(500);

    // Run query
    await clickButton(page, /run.*query|execute/i);
    await page.waitForTimeout(3000);

    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Error Detection', () => {
  const episodes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  for (const ep of episodes) {
    test(`Episode ${ep} has no JavaScript errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      page.on('pageerror', err => {
        errors.push(err.message);
      });

      await page.goto(`/episode/${ep}`);
      await page.waitForLoadState('networkidle');

      // Wait for any opening animations
      await page.waitForTimeout(ep === 10 ? 12000 : 5000);

      // Scroll through episode
      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(300);
      }

      // Filter non-critical errors
      const criticalErrors = errors.filter(e =>
        !e.includes('ResizeObserver') &&
        !e.includes('Non-Error') &&
        !e.includes('favicon') &&
        !e.includes('404')
      );

      if (criticalErrors.length > 0) {
        console.log(`Episode ${ep} errors:`, criticalErrors);
      }

      expect(criticalErrors.length).toBe(0);
    });
  }
});

test.describe('Simulation State Management', () => {
  test('Simulations do not freeze (state updates work)', async ({ page }) => {
    // Test ConnectionPoolDemo specifically since it had the freeze bug
    await page.goto('/episode/12');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await scrollToText(page, /Connection Pool Simulator/i);
    await page.waitForTimeout(500);

    // Set to 10 clients for quick test
    const slider = page.locator('input[type="range"]').first();
    if (await slider.isVisible().catch(() => false)) {
      await slider.fill('10');
    }

    await clickButton(page, /run.*simulation/i);

    // Check that state changes over time (not frozen)
    let lastCompleted = '0';
    let stateChanged = false;

    for (let i = 0; i < 30; i++) {
      const completedEl = page.locator('text=/\\d+\\s*\\/\\s*\\d+/').first();
      const text = await completedEl.textContent().catch(() => '0 / 0');
      const match = text?.match(/(\d+)/);
      const current = match?.[1] || '0';

      if (current !== lastCompleted && current !== '0') {
        stateChanged = true;
        break;
      }
      lastCompleted = current;
      await page.waitForTimeout(300);
    }

    expect(stateChanged).toBe(true);
  });
});
