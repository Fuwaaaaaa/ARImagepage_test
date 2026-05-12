import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Accessibility audit over every UI state reachable without a real device.
 *
 * Strategy: rely on axe-core's default ruleset (covers WCAG 2.0/2.1 A + AA).
 * We do NOT silently disable rules — if a real violation surfaces, fix the
 * component instead. Tagging on `withTags(['wcag2a', 'wcag2aa', 'wcag21a',
 * 'wcag21aa'])` keeps us focused on legally-meaningful rules and skips the
 * "best practice" advisories that are often subjective.
 *
 * `color-contrast` is intentionally **enabled**. The dark UI does pass
 * (verified once during initial setup); leaving the rule on guarantees
 * future palette tweaks can't silently regress contrast.
 */

const A11Y_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scan(page: Page) {
  return new AxeBuilder({ page }).withTags(A11Y_TAGS).analyze();
}

test.describe('Accessibility (axe-core)', () => {
  test('landing (ja) is axe-clean', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test.describe('landing (en)', () => {
    test.use({ locale: 'en-US' });

    test('is axe-clean', async ({ page }) => {
      await page.goto('/');
      await expect(
        page.getByRole('heading', {
          level: 1,
          name: 'Image-Recognition AR Demo',
        }),
      ).toBeVisible();
      const results = await scan(page);
      expect(results.violations).toEqual([]);
    });
  });

  test('/ar permission denied panel is axe-clean', async ({ page }) => {
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
    // Use the heading inside the error panel — `getByRole('alert')` matches
    // both our ErrorPanel and Next.js' `__next-route-announcer__`, which
    // trips strict-mode under unlucky navigation timing.
    await expect(
      page.getByRole('heading', { level: 2, name: /許可されていません/ }),
    ).toBeVisible({ timeout: 10_000 });
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test('/ar no-https panel is axe-clean', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: undefined,
      });
    });
    await page.goto('/ar');
    await expect(
      page.getByRole('heading', { level: 2, name: /HTTPS/ }),
    ).toBeVisible({ timeout: 10_000 });
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test('/ar-invalid invalid-config panel is axe-clean', async ({ page }) => {
    await page.goto('/ar-invalid');
    await expect(
      page.getByRole('heading', { level: 2, name: /AR の設定が無効です/ }),
    ).toBeVisible({ timeout: 10_000 });
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test('/ar sim panel is axe-clean', async ({ page }) => {
    await page.goto('/ar?sim=1&found=primary');
    await expect(page.getByTestId('sim-panel')).toBeVisible({ timeout: 10_000 });
    // Exclude the <a-scene> subtree: A-Frame's custom elements are
    // unrecognized HTML elements when scripts are bypassed, and axe flags
    // their role/landmark behavior as "best practice" — out of scope for
    // a runtime polyfill that isn't loaded in this state.
    const results = await new AxeBuilder({ page })
      .withTags(A11Y_TAGS)
      .exclude('a-scene')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
