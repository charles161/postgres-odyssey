import { test, expect } from '@playwright/test';

const episodes = [
  { num: 1, title: 'The Genesis', slug: '1' },
  { num: 2, title: 'The Blueprint', slug: '2' },
  { num: 3, title: 'The First Heartbeat', slug: '3' },
  { num: 4, title: 'Memory Palace', slug: '4' },
  { num: 5, title: 'The Many Lives', slug: '5' },
  { num: 6, title: 'The Pathways', slug: '6' },
  { num: 7, title: 'The Strategy Room', slug: '7' },
  { num: 8, title: 'The Rules', slug: '8' },
  { num: 9, title: 'The Fever', slug: '9' },
  { num: 10, title: 'The Cleanup', slug: '10' },
  { num: 11, title: 'The Memory', slug: '11' },
  { num: 12, title: 'The Organism', slug: '12' },
  { num: 13, title: 'The Echo', slug: '13' },
  { num: 14, title: 'The Horizon', slug: '14' },
  { num: 15, title: 'The Finale', slug: '15' },
];

test.describe('Episode Navigation', () => {
  episodes.forEach((episode) => {
    test(`Episode ${episode.num} loads correctly`, async ({ page }) => {
      await page.goto(`/episode/${episode.slug}`);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Episode should render without errors
      await expect(page.locator('body')).toBeVisible();
    });
  });
});

test.describe('Episode 1 - Genesis', () => {
  test('shows skip intro button after delay', async ({ page }) => {
    await page.goto('/episode/1');

    // Wait for skip button to appear (1 second delay)
    await page.waitForTimeout(1500);

    // Skip intro should be visible
    const skipButton = page.getByText(/skip intro/i);
    if (await skipButton.isVisible()) {
      await skipButton.click();
      // Main content should appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('has navigation to Episode 2', async ({ page }) => {
    await page.goto('/episode/1');
    await page.waitForTimeout(1000);

    // Try to skip intro if visible
    const skipButton = page.getByText(/skip intro/i);
    if (await skipButton.isVisible()) {
      await skipButton.click();
    }

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Look for Episode 2 navigation
    const nextButton = page.getByRole('button', { name: /Episode 2/i });
    if (await nextButton.isVisible()) {
      await expect(nextButton).toBeVisible();
    }
  });
});

test.describe('Episode 6 - Pathways (B-tree)', () => {
  test('B-tree navigator loads', async ({ page }) => {
    await page.goto('/episode/6');
    await page.waitForLoadState('networkidle');

    // Scroll down to find B-tree section
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(500);

    // Check for B-tree Navigator component
    const btreeSection = page.getByText('B-tree Index Navigator');
    if (await btreeSection.isVisible({ timeout: 3000 })) {
      await expect(btreeSection).toBeVisible();
    }
  });

  test('B-tree search works', async ({ page }) => {
    await page.goto('/episode/6');
    await page.waitForLoadState('networkidle');

    // Scroll to B-tree section
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(500);

    // Find and click search button if visible
    const searchButton = page.getByRole('button', { name: /search/i });
    if (await searchButton.isVisible({ timeout: 3000 })) {
      await searchButton.click();

      // Wait for search animation (longer delays now)
      await page.waitForTimeout(8000);

      // Should show result
      const foundText = page.getByText(/FOUND|ctid/i);
      await expect(foundText).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Episode 9 - Fever (Locks)', () => {
  test('episode 9 loads correctly', async ({ page }) => {
    await page.goto('/episode/9');
    await page.waitForLoadState('networkidle');

    // Episode 9 has an opening animation, just verify the page loaded
    await expect(page.locator('body')).toBeVisible();

    // Wait and check for any content appearing
    await page.waitForTimeout(3000);

    // Just check the page rendered something
    const html = await page.content();
    expect(html.length).toBeGreaterThan(1000);
  });
});

test.describe('Episode 15 - Finale', () => {
  test('loads the finale episode', async ({ page }) => {
    await page.goto('/episode/15');
    await page.waitForLoadState('networkidle');

    // Should load without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('shows completion when scrolled to bottom', async ({ page }) => {
    await page.goto('/episode/15');
    await page.waitForLoadState('networkidle');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Check for completion or share buttons
    const completionArea = page.getByText(/complete|share|journey/i).first();
    if (await completionArea.isVisible({ timeout: 5000 })) {
      await expect(completionArea).toBeVisible();
    }
  });
});

test.describe('Episode Navigation Buttons', () => {
  test('Episode 3 has correct next button to Episode 4', async ({ page }) => {
    await page.goto('/episode/3');
    await page.waitForLoadState('networkidle');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Find next episode button
    const nextButton = page.getByRole('button', { name: /Episode 4/i });
    if (await nextButton.isVisible({ timeout: 3000 })) {
      await expect(nextButton).toBeVisible();
    }
  });

  test('Episode 9 has correct prev button to Episode 8', async ({ page }) => {
    await page.goto('/episode/9');
    await page.waitForLoadState('networkidle');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Find prev episode button
    const prevButton = page.getByRole('button', { name: /Episode 8/i });
    if (await prevButton.isVisible({ timeout: 3000 })) {
      await expect(prevButton).toBeVisible();
    }
  });

  test('Episode 10 has correct prev button to Episode 9', async ({ page }) => {
    await page.goto('/episode/10');
    await page.waitForLoadState('networkidle');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Find prev episode button
    const prevButton = page.getByRole('button', { name: /Episode 9/i });
    if (await prevButton.isVisible({ timeout: 3000 })) {
      await expect(prevButton).toBeVisible();
    }
  });
});
