import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom defaults `navigator.language` to `en-US`, which would flip every
// existing label-default test to English. Pin to ja-JP so the legacy
// ja-default behavior is exercised by the bulk of the suite. i18n-aware
// tests stub `navigator` per-test via `vi.stubGlobal`.
Object.defineProperty(navigator, 'language', {
  configurable: true,
  get: () => 'ja-JP',
});

afterEach(() => {
  cleanup();
});
