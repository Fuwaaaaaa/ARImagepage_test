import { expect, test } from '@playwright/test';

test.describe('Landing page', () => {
  test('shows the heading, marker image, and start link', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('画像認識 AR デモ');

    const markerImg = page.getByRole('img', { name: 'AR マーカー画像' });
    await expect(markerImg).toBeVisible();
    await expect(markerImg).toHaveAttribute('src', /\/marker\.png/);

    const startLink = page.getByRole('link', { name: 'ARを開始' });
    await expect(startLink).toHaveAttribute('href', '/ar');
  });

  test('navigates to /ar when the start link is clicked', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'ARを開始' }).click();
    await expect(page).toHaveURL(/\/ar$/);
  });
});
