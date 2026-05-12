# Image-Tracking AR Demo (Next.js + A-Frame + MindAR.js)

**English** | [日本語](./README.ja.md)

A demo app that **overlays an image in AR when you point your camera at a marker image** — built on the web, no native app required.

License: [MIT](./LICENSE)

## Stack

- **Next.js 15** (App Router)
- **React 19** / **TypeScript 5.7**
- **Tailwind CSS v4**
- **A-Frame 1.5.0** (loaded from CDN)
- **MindAR.js 1.2.5** (loaded from CDN, image-tracking flavor)

A-Frame and MindAR are strictly browser-only libraries that register custom elements at script-load time. This project loads them via `next/script` only after the camera permission has been granted, and gates `<a-scene>` rendering behind both scripts being ready. The AR scene component is brought in with `next/dynamic({ ssr: false })`.

## Setup

```sh
pnpm install
pnpm dev:https
```

Then open **`https://localhost:3000`**. You'll see a self-signed certificate warning — choose "advanced → continue" to proceed.

> **Why HTTPS?** The browser's `getUserMedia` API does not work on plain HTTP unless the host is `localhost` (and even then, some browsers require HTTPS). `pnpm dev:https` makes Next.js generate a local certificate automatically.

## Required step before first run

`public/targets.mind` is **not** included in this repo — you need to generate one yourself.

### Marker setup

1. **Pick a marker image** and overwrite `public/marker.png` with it.
   - High-contrast images with rich texture (corners, edges) track best.
   - Recommended size: 512×512 or larger.
2. **Compile `targets.mind`**
   - Open the official MindAR Image Target Compiler: <https://hiukim.github.io/mind-ar-js-doc/tools/compile/>
   - Upload the marker image
   - Click "Start" → "Download"
   - Save the downloaded file as `public/targets.mind`
3. **Pick an overlay image** and overwrite `public/overlay.png` with it.
   - This is the image displayed on top of the marker when detected.
   - Transparent PNG recommended.
4. Restart `pnpm dev:https`.

See [`public/README.md`](./public/README.md) for full asset replacement details.

## Try it without a real device — simulation mode

You can verify the entire overlay pipeline — image, video, and audio — without a
camera, a marker, or even a compiled `targets.mind` file by appending a URL
query to `/ar`.

| URL | What happens |
|---|---|
| `/ar?sim=1` | Bypass camera permission + A-Frame/MindAR script load. Mounts the scene immediately, exposes a floating debug panel with `found` / `lost` buttons per target. |
| `/ar?sim=1&found=primary` | Same as above, plus dispatches `targetFound` on the `primary` entity once it mounts. |
| `/ar?sim=1&found=primary,secondary&delay=500` | Multiple targets, fired 500 ms after mount. |
| `/ar?sim=1&bypass=permission` | Skip only the permission probe — A-Frame and MindAR still load normally (useful when `public/targets.mind` exists and you want to verify the real engine). |
| `/ar?sim=1&bypass=scripts` | Skip only the script load — the real permission probe still runs. |

Simulation mode is **always available**, including in production builds — a
one-shot `console.warn` is emitted whenever it's active so the state is
obvious from devtools. The query surface is parsed by
[`lib/ar/simulation.ts`](./lib/ar/simulation.ts) and the controls live in
[`components/ar/SimulationPanel.tsx`](./components/ar/SimulationPanel.tsx).

## Usage

1. Open `https://localhost:3000`
2. Click **"ARを開始"** (Start AR)
3. Allow camera access when prompted
4. Hold the marker image in front of the camera (printed on paper, displayed on another screen, etc.)
5. The overlay image is rendered on top of the marker in AR

### Trying it on a phone

`localhost` isn't reachable from a phone. Use one of these:

- **Vercel Preview deployment** (easiest)
- **ngrok** (`ngrok http https://localhost:3000`)
- **LAN IP + Next.js HTTPS** (requires trusting the certificate on the phone — advanced)

## QR code

Generate a QR code from the deployed URL using any service (e.g. <https://www.qr-code-generator.com/>) and scan it with your phone's camera to jump straight into the AR page.

## Deploying to Vercel

```sh
# first time
pnpm dlx vercel
# subsequently
pnpm dlx vercel --prod
```

Or import the GitHub repository in the Vercel dashboard — every push to `main` will auto-deploy. The `public/` directory is bundled as-is, so no extra configuration is needed.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server (HTTP) |
| `pnpm dev:https` | **Dev server with HTTPS — required for camera access** |
| `pnpm build` | Production build + type check |
| `pnpm start` | Run the production build |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Run ESLint with `--fix` |
| `pnpm test` | Run Vitest unit tests once |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm test:cov` | Run Vitest with v8 coverage report |
| `pnpm e2e` | Run Playwright E2E tests (Chromium only) |
| `pnpm e2e:ui` | Run Playwright in UI mode |
| `pnpm e2e:install` | Download Playwright Chromium binary |
| `pnpm e2e:no-visual` | Run E2E except the visual regression specs (used in CI) |
| `pnpm e2e:visual` | Run only the visual regression specs (single worker) |
| `pnpm e2e:visual:update` | Re-generate the visual regression baselines |
| `pnpm e2e:a11y` | Run only the axe-core accessibility audit |
| `pnpm build:check` | Build and assert per-route First Load JS budgets |

## Tests

This project ships with four layers of automated tests, plus a build-time
bundle-size budget and a production smoke test in CI.

- **Unit** — Vitest + Testing Library + jsdom. Covers the AR hooks
  (`useCameraPermission`, `useExternalScripts`, `useTargetMediaControl`,
  `useSimulation`), the status overlay UI, the scene stage rendering, the
  Zod schema (happy-path and failure cases), the i18n label resolver
  (`detectLang` / `resolveLabels`), simulation URL parsing, the landing
  page's locale switch, and the `NEXT_PUBLIC_AR_DEBUG` gating in `arLog`.
  Run with `pnpm test:cov`.
- **Functional E2E** — Playwright (Chromium, `locale: 'ja-JP'` by default).
  Verifies the landing page (ja/en), `/ar` permission flows (granted,
  denied, no-https), and the mute-toggle render gate. Chromium is launched
  with `--use-fake-ui-for-media-stream` so camera prompts auto-resolve.
  Run with `pnpm e2e:install && pnpm e2e`.
- **Visual regression** — Playwright `toHaveScreenshot` baselines for
  landing (ja, en), denied, no-https, invalid-config, and the sim-mode
  panel. Animations disabled, viewport pinned, 2 % diff tolerance. Baselines
  are platform-suffixed (`-chromium-win32.png` etc.) so multiple platforms
  can coexist — re-generate with `pnpm e2e:visual:update` after intentional
  UI changes.
- **Accessibility** — `@axe-core/playwright` sweeps WCAG 2.0 / 2.1 A + AA
  over every UI state reachable without a real device. Run alone with
  `pnpm e2e:a11y`.

In CI the `production-smoke` job builds the app, asserts per-route First
Load JS budgets (`/`: 200 kB, `/ar`: 180 kB), boots `next start`, and curls
`/`, `/ar`, and `/ar?sim=1` for their content markers — catching dynamic-
import wiring bugs and locale-fallback regressions before deploy.

See [`docs/TESTING.md`](./docs/TESTING.md) for the full strategy and
[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) for the CI wiring.

## Overlays — image, video, audio

Each marker (`ARTarget`) holds an `overlays[]` array of tagged-union entries:

| `kind`   | Renders as | Required fields                         | Notes |
|----------|-----------|-----------------------------------------|-------|
| `image`  | `<a-image>` plane on the marker | `src`, `width`, `height` | Static texture. |
| `video`  | `<video>` in `<a-assets>` + `<a-video>` plane | `src`, `width`, `height` | Plays when the marker is found, pauses when lost (`onLost`). iOS auto-mutes; the on-screen mute toggle un-mutes after a tap. |
| `audio`  | `<audio>` in `<a-assets>` (non-spatial) | `src` | Plays alongside the marker; iOS requires the user to tap the mute toggle once before audio is audible. |

Per-overlay options (all optional unless marked required above):

- `position` / `rotation`: A-Frame transform strings (e.g. `'0 0 0'`).
- `loop`: defaults to `true` for both video and audio.
- `muted` (video only): defaults to `true` so iOS allows autoplay.
- `volume` (audio only): `0..1`, applied to `HTMLAudioElement.volume`.
- `crossOrigin`: `'anonymous' | 'use-credentials'` for external-host assets.
- `preload` (video only): `'auto' | 'metadata' | 'none'`.
- `onLost`: `'pause'` (default) | `'reset'` (rewinds to 0) | `'continue'`.

`src` accepts both `public/`-relative paths (e.g. `/overlays/intro.mp4`) and absolute URLs. For external URLs, set `crossOrigin: 'anonymous'` and make sure the host returns CORS headers — otherwise the browser will fail texture upload for video.

A floating mute / un-mute button is rendered automatically at the bottom-right whenever the active config contains at least one `video` or `audio` overlay. The state is persisted to `localStorage` under the key `ar-muted` (defaulting to muted) so reloads keep the user's preference.

See [`config/ar.example-multi.ts`](./config/ar.example-multi.ts) for a config that mixes image, video and audio across two markers.

## Runtime config validation

Every `ARConfig` is validated at runtime via Zod (`config/ar.schema.ts`) the moment `<ARScene>` renders. If the config is invalid (missing `mindFile`, non-positive `width`/`height`, out-of-range `volume`, unknown `kind`, etc.) the scene is **not** mounted: instead the user sees an `'invalid-config'` error panel listing every issue with its JSON path. This replaces the previous failure mode where a typo in the config would silently produce an empty scene.

The schema is also the source of truth for the TypeScript types — `config/ar.ts` re-exports them via `z.infer`, so the schema and the types cannot drift.

## Internationalization

`<ARScene>` accepts an optional `lang` prop:

```tsx
import ARScene from '@/components/ARScene';

<ARScene lang="en" />            // explicit English
<ARScene />                       // auto-detect via navigator.language (ja default)
```

The supported languages are `'ja'` (default) and `'en'`. When `lang` is omitted, the component renders Japanese on the server and switches to the detected client language post-mount — accepting a one-frame flicker in exchange for hydration safety. To skip the flicker, pass `lang` explicitly. The label tables live in [`lib/ar/i18n.ts`](./lib/ar/i18n.ts).

The **landing page** (`app/page.tsx`) follows the same pattern: it renders
Japanese on the server and switches to the detected client language after
mount. All hero copy, step labels, and the HTTPS note resolve through the
same `landing` section of `defaultARLabels`, so adding a third language
means filling out one table — no component edits.

All error messages — including the dynamic ones for camera permission failures — are sourced from the same label table. `useCameraPermission` returns structured state only, and `<ARSceneInner>` composes the final user-facing message from the active locale.

## Debug logging

Set `NEXT_PUBLIC_AR_DEBUG=1` to enable structured AR pipeline logs:

```sh
NEXT_PUBLIC_AR_DEBUG=1 pnpm dev:https
```

When enabled, `useTargetMediaControl` emits `console.debug('[ar]', ...)` at every `targetFound` / `targetLost` event, `play()` rejection, volume application, and mute toggle. The flag is read once at module load, so production bundles built without it tree-shake the logging implementation entirely. See [`lib/ar/debug.ts`](./lib/ar/debug.ts).

## Architecture

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the component split, bootstrap order, the `ARConfig` schema, and a recipe for **adding a second marker** without touching component code.

## Project layout

```
.
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── globals.css                   # Tailwind v4 entry + AR-specific globals
│   ├── page.tsx                      # Landing page (/) — i18n (ja/en)
│   ├── ar/page.tsx                   # AR page (/ar) — dynamically imports ARScene with ssr:false
│   └── ar-invalid/page.tsx           # Test harness route mounting <ARScene> with a broken config
├── components/
│   ├── ARScene.tsx                   # Outer guard (Zod safeParse) + ARSceneInner
│   └── ar/
│       ├── ARSceneStage.tsx          # Pure JSX of <a-scene> driven by ARConfig
│       ├── ARStatusOverlay.tsx       # Loading / ErrorPanel / close button (i18n-aware)
│       ├── MuteToggle.tsx            # Floating mute toggle + localStorage persistence
│       ├── SimulationPanel.tsx       # Dev-only debug panel rendered when ?sim=1
│       ├── useCameraPermission.ts    # getUserMedia state machine
│       ├── useExternalScripts.ts    # A-Frame → MindAR sequential loader + 15s timeout
│       ├── useSimulation.ts          # Dispatches targetFound/Lost for sim mode
│       └── useTargetMediaControl.ts # targetFound/Lost handler with Map-cached lookups
├── config/
│   ├── ar.schema.ts                  # Zod schemas — runtime validation source of truth
│   ├── ar.ts                         # z.infer-derived types + defaultARConfig
│   └── ar.example-multi.ts           # Two-marker sample config
├── lib/ar/
│   ├── cdn.ts                        # A-Frame / MindAR CDN URLs and pinned versions
│   ├── overlay.ts                    # Asset id helpers + media collection utilities
│   ├── i18n.ts                       # ja/en label tables, detectLang, resolveLabels
│   ├── simulation.ts                 # URL query parser for ?sim=1 et al.
│   └── debug.ts                      # arLog() — gated by NEXT_PUBLIC_AR_DEBUG=1
├── tests/
│   ├── setup.ts                      # Vitest setup (jest-dom matchers, cleanup)
│   └── unit/                         # Vitest unit tests
├── e2e/                              # Playwright E2E specs (functional + visual + a11y)
├── scripts/
│   └── check-bundle-size.mjs         # CI bundle-budget gate
├── docs/
│   ├── ARCHITECTURE.md               # Architecture deep-dive
│   ├── TESTING.md                    # Test strategy across all four layers
│   └── DEPLOY.md                     # Vercel deployment guide
├── eslint.config.mjs                 # Flat ESLint config (eslint-config-next)
├── playwright.config.ts
├── vitest.config.ts
├── global.d.ts                       # JSX type augmentation for A-Frame custom elements
├── public/
│   ├── README.md                     # Asset replacement guide
│   ├── marker.png                    # Marker image (replace it)
│   ├── overlay.png                   # Overlay image (replace it)
│   └── targets.mind                  # ★ Generate yourself — not committed
├── LICENSE                           # MIT
└── README.md
```

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| "HTTPS connection required" UI | You're on HTTP. Use `pnpm dev:https` and visit `https://localhost:3000`. |
| Camera prompt never appears | Camera is blocked in browser site settings — clear and reload. |
| `/ar` stays black | `public/targets.mind` is missing or corrupt. Re-compile via the MindAR tool — or use `?sim=1` to verify the overlay pipeline without a marker. |
| Marker shown but no overlay appears | The image used to compile `targets.mind` doesn't match `marker.png`, or the marker has too few features. Use a high-contrast image. |
| `customElements` already-registered error after hot reload | A-Frame double-registration. A full page reload fixes it. |
| Doesn't work on iOS Safari | iOS requires HTTPS and a direct user gesture before `getUserMedia`. The "Start AR" button click is the gesture — make sure it's the first thing the user does. |

## References

- A-Frame: <https://aframe.io/>
- MindAR: <https://hiukim.github.io/mind-ar-js-doc/>
- MindAR Image Target Compiler: <https://hiukim.github.io/mind-ar-js-doc/tools/compile/>

## License

Released under the [MIT License](./LICENSE).
