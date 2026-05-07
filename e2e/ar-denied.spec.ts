import { expect, test } from '@playwright/test';

test.describe('/ar with camera permission denied', () => {
  test('shows the ErrorPanel when getUserMedia rejects with NotAllowedError', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: () => {
            const err = new Error('Permission denied');
            err.name = 'NotAllowedError';
            return Promise.reject(err);
          },
        },
      });
    });

    await page.goto('/ar');

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible({ timeout: 10_000 });
    await expect(alert.getByRole('heading', { level: 2 })).toHaveText(
      /許可されていません/,
    );
    await expect(alert.getByRole('link', { name: 'ホームに戻る' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  test('shows the no-https ErrorPanel when mediaDevices is missing', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: undefined,
      });
    });

    await page.goto('/ar');

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible({ timeout: 10_000 });
    await expect(alert.getByRole('heading', { level: 2 })).toHaveText(/HTTPS/);
    await expect(alert.getByText('pnpm dev:https')).toBeVisible();
  });
});
