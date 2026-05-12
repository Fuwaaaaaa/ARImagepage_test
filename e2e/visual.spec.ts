import { expect, test } from '@playwright/test';

/**
 * Visual regression baselines for the major UI states reachable without a
 * real device. Playwright auto-suffixes snapshots by browser and OS, so the
 * same baseline file may need to be re-generated per platform via
 * `pnpm e2e --update-snapshots` when the host changes.
 *
 * Animations are disabled and the viewport is pinned in `playwright.config.ts`
 * so renders stay deterministic across runs.
 */

test.describe('Visual regression', () => {
  test('landing (ja) — full page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).toHaveScreenshot('landing-ja.png', { fullPage: true });
  });

  test.describe('landing (en) — full page', () => {
    test.use({ locale: 'en-US' });

    test('renders English copy', async ({ page }) => {
      await page.goto('/');
      await expect(
        page.getByRole('heading', { level: 1, name: 'Image-Recognition AR Demo' }),
      ).toBeVisible();
      await expect(page).toHaveScreenshot('landing-en.png', { fullPage: true });
    });
  });

  test('/ar — permission denied error panel', async ({ page }) => {
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
    // Match the per-assertion timeout used by ar-denied.spec.ts — the dev
    // server can be slow on cold start and the default 5s window flakes.
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveScreenshot('ar-denied.png');
  });

  test('/ar — no-https error panel', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: undefined,
      });
    });

    await page.goto('/ar');
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveScreenshot('ar-no-https.png');
  });

  test('/ar-invalid — invalid config error panel', async ({ page }) => {
    await page.goto('/ar-invalid');
    // The dynamic import has no loading fallback; wait until ARScene actually
    // mounts before snapshotting, otherwise we can race the React root and
    // capture a blank page.
    await expect(
      page.getByRole('heading', { level: 2, name: /AR の設定が無効です/ }),
    ).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('ar-invalid-config.png');
  });

  test('/ar — sim mode panel with primary found', async ({ page }) => {
    await page.goto('/ar?sim=1&found=primary');
    // Wait for SimulationPanel to be mounted (sceneActive === true).
    await expect(page.getByTestId('sim-panel')).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveScreenshot('ar-sim-found-primary.png');
  });
});
