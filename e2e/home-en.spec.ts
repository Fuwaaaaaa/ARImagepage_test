import { expect, test } from '@playwright/test';

test.describe('Landing page (en)', () => {
  // Override the project-wide ja-JP default so detectLang() resolves to 'en'.
  test.use({ locale: 'en-US' });

  test('renders the English copy and CTA', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Image-Recognition AR Demo',
    );

    const markerImg = page.getByRole('img', { name: 'AR marker image' });
    await expect(markerImg).toBeVisible();

    const startLink = page.getByRole('link', { name: 'Start AR' });
    await expect(startLink).toHaveAttribute('href', '/ar');
  });
});
