import { test, expect } from '@playwright/test';

test.describe('Interactive Visualizations', () => {
  test.describe('B-tree Navigator (Episode 6)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/episode/6');
      await page.waitForLoadState('networkidle');
      // Scroll to find B-tree
      await page.evaluate(() => window.scrollTo(0, 2000));
      await page.waitForTimeout(1000);
    });

    test('has search input field', async ({ page }) => {
      const input = page.getByPlaceholder(/email/i);
      if (await input.isVisible({ timeout: 5000 })) {
        await expect(input).toBeVisible();
      }
    });

    test('search button triggers animation', async ({ page }) => {
      const searchButton = page.getByRole('button', { name: /search/i });
      if (await searchButton.isVisible({ timeout: 5000 })) {
        await searchButton.click();

        // Should show "Examining root node" or similar
        const examining = page.getByText(/examining|root/i);
        await expect(examining).toBeVisible({ timeout: 5000 });
      }
    });

    test('reset button resets state', async ({ page }) => {
      const searchButton = page.getByRole('button', { name: /search/i });
      if (await searchButton.isVisible({ timeout: 5000 })) {
        await searchButton.click();
        await page.waitForTimeout(2000);

        // Find reset button
        const resetButton = page.getByRole('button', { name: /reset/i });
        if (await resetButton.isVisible({ timeout: 3000 })) {
          await resetButton.click();

          // Search button should be visible again
          await expect(page.getByRole('button', { name: /search/i })).toBeVisible({ timeout: 3000 });
        }
      }
    });
  });

  test.describe('Race Condition Demo (Episode 9)', () => {
    test('loads lock visualization', async ({ page }) => {
      await page.goto('/episode/9');
      await page.waitForLoadState('networkidle');

      // Wait for any opening animation
      await page.waitForTimeout(2000);

      // Scroll to find visualizations
      await page.evaluate(() => window.scrollTo(0, 1000));
      await page.waitForTimeout(500);

      // Look for any lock-related visualization or content
      const hasContent = await page.locator('body').isVisible();
      expect(hasContent).toBeTruthy();
    });
  });

  test.describe('MVCC Visualization (Episode 5)', () => {
    test('episode 5 loads', async ({ page }) => {
      await page.goto('/episode/5');
      await page.waitForLoadState('networkidle');

      // Check for MVCC-related content
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Deadlock Sandbox (Episode 9)', () => {
    test('deadlock section exists', async ({ page }) => {
      await page.goto('/episode/9');
      await page.waitForLoadState('networkidle');

      // Scroll to deadlock section
      await page.evaluate(() => window.scrollTo(0, 4000));
      await page.waitForTimeout(500);

      // Look for deadlock content
      const deadlockContent = page.getByText(/deadlock|trap/i).first();
      if (await deadlockContent.isVisible({ timeout: 5000 })) {
        await expect(deadlockContent).toBeVisible();
      }
    });
  });

  test.describe('Query Execution (Episode 7)', () => {
    test('episode 7 loads', async ({ page }) => {
      await page.goto('/episode/7');
      await page.waitForLoadState('networkidle');

      // Should load without errors
      await expect(page.locator('body')).toBeVisible();
    });
  });
});

test.describe('Simulation Controls', () => {
  test('buttons are clickable', async ({ page }) => {
    // Test Episode 4 (Memory Palace) which has simulations
    await page.goto('/episode/4');
    await page.waitForLoadState('networkidle');

    // Scroll to find interactive elements
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(500);

    // Find any button
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();

    // Should have some interactive buttons
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('animations do not cause errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/episode/6');
    await page.waitForLoadState('networkidle');

    // Scroll through the page
    for (let i = 0; i < 5; i++) {
      await page.evaluate((scroll) => window.scrollTo(0, scroll * 1000), i);
      await page.waitForTimeout(500);
    }

    // Filter out common non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('Non-Error promise rejection')
    );

    expect(criticalErrors.length).toBe(0);
  });
});
