import { expect, test } from '@playwright/test';

test.describe('/ar mute toggle', () => {
  test('does not render the mute toggle when the active config has no media overlays', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'fake camera flag is Chromium-only');

    // The default config (defaultARConfig) only ships with an image overlay,
    // so the floating mute toggle should never appear on /ar.
    await page.goto('/ar');

    // Give the bootstrap a moment to settle (loading overlay → scene attempt).
    await page.waitForTimeout(2_500);

    const muteButton = page.getByRole('button', { name: /ミュート/ });
    await expect(muteButton).toHaveCount(0);
  });
});
