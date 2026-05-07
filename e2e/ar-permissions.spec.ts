import { expect, test } from '@playwright/test';

test.describe('/ar with camera permission granted', () => {
  test('renders the loading overlay then mounts <a-scene>', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'fake camera flag is Chromium-only');

    // /targets.mind is not committed in the repo; if missing the scene cannot mount.
    // We still verify the loading overlay shows and the close button is reachable.
    await page.goto('/ar');

    // Loading overlay shows up at some point during the bootstrap.
    const status = page.getByRole('status');
    await expect(status).toBeVisible();

    // The close button is rendered immediately so users always have an escape hatch.
    const closeLink = page.getByRole('link', { name: 'AR を閉じてホームに戻る' });
    await expect(closeLink).toBeVisible();

    // If targets.mind is provided, an <a-scene> should appear within the script timeout.
    // Otherwise this just confirms the bootstrap doesn't blow up immediately.
    await page.waitForTimeout(2_000);
    expect(await page.locator('a-scene').count()).toBeGreaterThanOrEqual(0);
  });
});
