# Testing strategy

The goal: a contributor can take any change from "edit" to "shippable" without
ever pointing a real camera at a real marker.

The pipeline has **four spec layers + two CI-only gates**. Each layer has a
specific failure mode it's meant to catch and a specific command you'd run by
hand when iterating.

| Layer | Tool | What it catches | Local command |
|---|---|---|---|
| Unit | Vitest + jsdom | Hook & utility regressions | `pnpm test:cov` |
| Functional E2E | Playwright | Route mounting, permission flows, event wiring | `pnpm e2e` |
| Visual regression | Playwright `toHaveScreenshot` | Layout / colour drift on stable UI states | `pnpm e2e:visual` |
| A11y | `@axe-core/playwright` | WCAG 2.0 / 2.1 A + AA violations | `pnpm e2e:a11y` |
| Bundle budget | Custom Node script | Surprise JS bloat per route | `pnpm build:check` |
| Production smoke | CI shell only | Build → `next start` → HTML markers | n/a (CI) |

## Unit tests (Vitest)

- `tests/setup.ts` pins `navigator.language` to `ja-JP` so the default label
  table matches the bulk of the suite. i18n-aware tests override it
  per-test via `vi.stubGlobal('navigator', { language: 'en-US' })`.
- `vitest.config.ts` enforces coverage thresholds: 80 % statements, 80 %
  lines, 80 % functions, 75 % branches. New code is expected to maintain
  these — current actuals sit around 93 % / 98 % / 99 % / 84 %.
- Hook tests use `renderHook` from `@testing-library/react`; DOM-coupled
  assertions live in component tests that follow the existing `describe →
  it` shape under `tests/unit/`.

## Functional E2E (Playwright)

- Chromium-only. The fake-camera flags
  (`--use-fake-ui-for-media-stream`, `--use-fake-device-for-media-stream`)
  let `getUserMedia` resolve without a real device.
- Default locale is `ja-JP`. Specs that exercise the English path opt in
  with `test.use({ locale: 'en-US' })`.
- Routes covered: `/`, `/`(en), `/ar` (permission granted/denied/no-https),
  mute toggle render gate.
- `webServer` runs `pnpm dev` and is reused across tests (CI gets a fresh
  start because `reuseExistingServer: !process.env.CI`).

## Visual regression

- Specs live in `e2e/visual.spec.ts`. Baselines are saved next to the spec
  under `e2e/visual.spec.ts-snapshots/<name>-<browser>-<platform>.png`, so
  Windows and Linux baselines coexist without conflict.
- The `toHaveScreenshot` defaults in `playwright.config.ts` set animations
  to `disabled`, hide the caret, and allow a 2 % pixel diff.
- The CI `e2e` job runs `pnpm e2e:no-visual` (skips the visual specs by
  `--grep-invert "Visual regression"`) because Linux baselines are not yet
  committed. Add them with:

  ```sh
  # On the matching platform (in a clean tree):
  pnpm e2e:visual:update
  git add e2e/visual.spec.ts-snapshots/
  ```

  Per-PR Linux baseline regeneration belongs in a future dedicated CI
  workflow.
- After any deliberate UI change (colour, spacing, copy), regenerate the
  affected baselines locally and commit them — the diff in the PR makes
  the change reviewable.

### `/ar-invalid` test harness

Visual + a11y specs need to capture the `'invalid-config'` error panel
deterministically. Rather than splicing query state into `<ARScene>` at
runtime, `app/ar-invalid/page.tsx` mounts the component with a deliberately
broken config. It's a permanent route but unreachable from the UI.

## Accessibility (axe-core)

- `e2e/a11y.spec.ts` runs `AxeBuilder` on every key UI state and asserts
  `violations === []`.
- Default rule set is left intact — including `color-contrast`. New palette
  decisions must clear AA contrast against their actual backdrop.
- For `/ar?sim=1` the `<a-scene>` subtree is excluded from the scan because
  A-Frame's custom elements are unrecognised when scripts are bypassed and
  axe flags their roles as "best practice" violations that are out of
  scope for runtime polyfills.

## Bundle-size budget

`scripts/check-bundle-size.mjs` parses the Next.js `Route (app)` table from
the build output and fails when any tracked route's First Load JS exceeds
its budget.

Current budgets (intentionally generous — drift catches genuine
regressions, not nickel-and-dime growth):

| Route | Budget | Current |
|---|---|---|
| `/` | 200 kB | ~108 kB |
| `/ar` | 180 kB | ~103 kB |

Headroom is large because A-Frame + MindAR load at runtime from CDN — they
never enter the app bundle. If you add a heavy dependency, expect this
gate to flag it.

To raise a budget, edit `ROUTE_BUDGETS` at the top of the script. The
diff in the PR is the point: budget bumps are reviewable, not invisible.

## Production smoke (CI only)

The `production-smoke` job in `.github/workflows/ci.yml`:

1. `pnpm install --frozen-lockfile`
2. `pnpm next build | node scripts/check-bundle-size.mjs` (bundle gate)
3. `pnpm start &` (background)
4. Polls `/`, `/ar`, `/ar?sim=1` until each returns 2xx (60 s ceiling)
5. `curl | grep -qF` for the page-specific HTML markers
6. Kills the server in an `if: always()` step

This catches dynamic-import wiring bugs, SSR locale-fallback regressions,
and runtime env failures that unit tests can't see — before a deploy
reaches Vercel.

## When something fails

- **Unit fails locally**: run `pnpm test:watch <pattern>` for fast feedback.
- **E2E fails locally only**: inspect `test-results/` — Playwright captures
  videos + traces for retried specs. Add a focused `test.only` to iterate.
- **Visual regression fails on a new colour/copy change**: regenerate the
  baseline (`pnpm e2e:visual:update`) and commit it alongside the change.
- **Visual regression fails unexpectedly**: don't auto-regenerate — open
  the `expected` vs `actual` PNG pair and diagnose first.
- **A11y fails**: fix the component. Whitelisting (`disableRules`) requires
  written justification in the PR description.
- **Bundle gate fails**: identify what landed (`next build --debug`,
  `@next/bundle-analyzer`, or just `git diff package.json`). Bump the
  budget only if the new weight is justified.
- **Smoke test fails**: usually a dynamic-import path bug or a locale
  default regression. The job log shows which `curl` failed.
