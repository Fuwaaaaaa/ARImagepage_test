# Architecture

This document describes the runtime composition of the AR demo and how to extend it (e.g. to support multiple markers).

## Component split

```
app/ar/page.tsx                 — Next.js route, dynamically imports ARScene with ssr:false
└── components/ARScene.tsx      — Outer guard + inner orchestrator
    ├── (outer) arConfigSchema.safeParse(config) — invalid configs short-circuit
    │     to <ErrorPanel kind="invalid-config" />, no AR hooks are called.
    └── (inner) ARSceneInner — runs only when the config is valid:
        ├── components/ar/useCameraPermission.ts
        │     └── Probes navigator.mediaDevices.getUserMedia and exposes a 6-state
        │       machine (pending / granted / denied / no-camera / no-https /
        │       unknown-error).
        ├── components/ar/useExternalScripts.ts
        │     └── Tracks A-Frame and MindAR load completion plus a 15s timeout.
        │       Renders nothing — the orchestrator owns the <Script> tags.
        ├── components/ar/ARSceneStage.tsx
        │     └── Pure JSX of <a-scene>, <a-assets>, <a-camera>, and per-target
        │       <a-entity> with image / video / audio overlays. Driven by ARConfig.
        ├── components/ar/useTargetMediaControl.ts
        │     └── Subscribes to targetFound / targetLost on each
        │       <a-entity data-target-id="…"> and drives the matching <video> /
        │       <audio> elements (play / pause / reset / mute sync). Caches
        │       element lookups in a Map<assetId, HTMLMediaElement> built once
        │       per setup effect.
        ├── components/ar/MuteToggle.tsx
        │     └── Floating bottom-right mute toggle + useMuteToggleState
        │       (localStorage-backed, lazy-init).
        └── components/ar/ARStatusOverlay.tsx
              └── Loading / ErrorPanel / ARCloseButton primitives. Accepts an
                optional `lang` prop and resolves labels via lib/ar/i18n.
```

`config/ar.schema.ts` is the source of truth — Zod schemas (discriminated
union over `kind`) drive both runtime validation and the `z.infer`-derived
types re-exported from `config/ar.ts`. `config/ar.example-multi.ts` is a
sample multi-marker config that mixes image, video, and audio overlays.

`lib/ar/cdn.ts` centralizes the A-Frame / MindAR CDN URLs and pinned versions.
`lib/ar/overlay.ts` provides `overlayAssetId`, `collectMediaAssets`, and
`hasMediaOverlay` — pure utilities shared by the scene stage, the media-control
hook, and the orchestrator.
`lib/ar/i18n.ts` provides ja/en label tables, `detectLang()`, and `resolveLabels()`.
`lib/ar/debug.ts` exposes `arLog(...)` — a no-op unless `NEXT_PUBLIC_AR_DEBUG=1`
is set at build time.

## Bootstrap order

The AR page only mounts components after each precondition is met:

1. **Config validation** — `arConfigSchema.safeParse(config)` runs in `<ARScene>` (outer). On failure the inner pipeline never mounts; the user sees an `'invalid-config'` `<ErrorPanel>` listing the Zod issues.
2. Camera permission probe runs in `useCameraPermission` (`pending → granted | denied | …`).
3. When `granted`, the orchestrator mounts the A-Frame `<Script>` (Next.js `next/script`).
4. After A-Frame's `onLoad` fires, the MindAR `<Script>` is mounted.
5. After both notify the hook (`ready === true`), `<ARSceneStage>` is rendered.

Loading the scripts in this strict order matters because **MindAR's A-Frame integration registers custom elements that depend on A-Frame already being defined.** Loading them in parallel can cause "customElements already registered" errors during HMR.

If either script fails to load within `DEFAULT_SCRIPT_LOAD_TIMEOUT_MS` (15 seconds), `useExternalScripts` flips `timedOut` and the orchestrator renders an `ErrorPanel` with `kind="timeout"`.

## Runtime config validation

`config/ar.schema.ts` is the only place that defines the AR config shape.
Every type that consumers import from `config/ar.ts` is now derived via
`z.infer<typeof ...Schema>`, so the schema and the types cannot drift.

`<ARScene>` parses the incoming `config` prop with `arConfigSchema.safeParse()`
on every render. On failure it short-circuits to an `'invalid-config'`
`<ErrorPanel>` that renders each Zod issue's `path` + `message`. None of the
AR hooks (`useCameraPermission`, `useExternalScripts`, `useTargetMediaControl`)
are called on the invalid path — that is why the component is split into an
outer guard plus an `<ARSceneInner>` that owns the hooks. Calling hooks
conditionally would violate the Rules of Hooks; the outer/inner split is
the React-legal way to gate hook execution on validation success.

Constraints enforced by the schema:

- `mindFile`, `id`, `src` — non-empty strings
- `width`, `height` — positive numbers
- `volume` — `0..1`
- `targetIndex` — non-negative integer
- `targets` and each `target.overlays` — at least one entry
- `kind` — discriminated union of `'image' | 'video' | 'audio'`

The runtime checks live in `tests/unit/ar-config.test.ts` (both the
happy-path validation of `defaultARConfig` / `multiARConfig` and the
failure cases).

## ARConfig schema

```ts
type ARImageOverlay = {
  kind: 'image';
  src: string;          // public/ path or absolute URL
  width: number;        // A-Frame world units
  height: number;
  position?: string;    // e.g. '0 0 0'
  rotation?: string;
};

type ARVideoOverlay = {
  kind: 'video';
  src: string;
  width: number;
  height: number;
  position?: string;
  rotation?: string;
  loop?: boolean;       // default true
  muted?: boolean;      // default true (iOS autoplay)
  crossOrigin?: 'anonymous' | 'use-credentials';
  preload?: 'auto' | 'metadata' | 'none';
  onLost?: 'pause' | 'reset' | 'continue';   // default 'pause'
};

type ARAudioOverlay = {
  kind: 'audio';
  src: string;
  loop?: boolean;
  volume?: number;      // 0..1
  crossOrigin?: 'anonymous' | 'use-credentials';
  onLost?: 'pause' | 'reset' | 'continue';   // default 'pause'
};

type AROverlay = ARImageOverlay | ARVideoOverlay | ARAudioOverlay;

type ARTarget = {
  id: string;           // unique within the config; used as the React key
  targetIndex: number;  // index in the compiled .mind file (0, 1, …)
  overlays: AROverlay[];
};

type ARConfig = {
  mindFile: string;     // public/ path to the .mind file
  targets: ARTarget[];  // at least one
};
```

The validation rules are exercised in `tests/unit/ar-config.test.ts`.

## Media playback lifecycle

Video and audio overlays go through a small purpose-built pipeline:

1. `ARSceneStage` collects every `video` / `audio` overlay across all targets and renders the underlying HTML media elements inside `<a-assets>` with a deterministic id (`ar-asset-<targetId>-<index>`, see `lib/ar/overlay.ts`). For `kind: 'video'` it also renders an `<a-video src="#asset-id">` plane inside the relevant `<a-entity mindar-image-target>`. Audio is non-spatial and is only present in `<a-assets>`.
2. `useTargetMediaControl` (in `components/ar/`) attaches `targetFound` / `targetLost` listeners to each `<a-entity data-target-id="…">` once the scene container is mounted. On `targetFound` it calls `play()` on every related media element (catching the iOS-autoplay rejection through `arLog('ar:play-rejected', …)` rather than `try/catch`-swallowing it). On `targetLost` it pauses (or resets / continues) per the overlay's `onLost`. Element lookups are served from a `Map<assetId, HTMLMediaElement>` built once per setup-effect run, so per-event dispatch does not hit the DOM.
3. `MuteToggle` provides a fixed-bottom-right button whose state is persisted to `localStorage['ar-muted']`. Defaulting to muted is what lets iOS autoplay kick in. When the user taps the toggle, `useTargetMediaControl` syncs `el.muted` across all media; if the toggle is being un-muted while a target is currently in the "found" state, the hook re-issues `play()` so audio that was previously gesture-blocked starts immediately.

The toggle button is only mounted when the active config contains at least one media overlay (`hasMediaOverlay` in `lib/ar/overlay.ts`).

### iOS Safari caveats

Two browser-level rules drive the design above:

- **Video**: `play()` is allowed without a user gesture only when the element is `muted` *and* `playsinline`. `ARSceneStage` always emits both attributes, so videos start as soon as the marker is found — silently — and the user can lift the mute later via the toggle.
- **Audio**: there is no equivalent "muted autoplay" exception for `<audio>`. On iOS, the very first `play()` *must* originate from a user gesture or it returns a rejected `Promise` (`NotAllowedError`). Even with `localStorage['ar-muted'] === 'false'` from a previous session, the gesture is reset on reload. The expected user flow is therefore: see the marker → tap the mute toggle → audio starts. The hook silently catches the initial rejection and replays media for any currently-found target as soon as the toggle is tapped (because the tap *is* the gesture). On Android Chrome these constraints are looser and audio typically plays without the toggle being tapped.

## Internationalization

`lib/ar/i18n.ts` ships ja/en label tables for the AR shell UI (loading
labels, error titles, close button text, mute toggle aria-labels). It is
intentionally dependency-free — the surface is small enough that a full
i18n library would add bundle weight without payoff.

`<ARScene>` accepts an optional `lang` prop (`'ja' | 'en'`):

```tsx
<ARScene lang="en" />            {/* explicit */}
<ARScene />                       {/* auto-detect via navigator.language */}
```

When `lang` is omitted, the component starts with the SSR-safe default
(`'ja'`, since `navigator` is unavailable at render time on the server)
and switches to `detectLang()` in a post-mount effect. This avoids a
hydration mismatch on en-locale clients at the cost of a one-frame
ja → en flicker on first paint. If that flicker is unacceptable for a
given deployment, pass `lang` explicitly.

`detectLang()` is server-safe and falls back to `'ja'` whenever
`navigator` is unavailable or `navigator.language` is empty / non-`en*`.
Adding a third language means: extend the `ARLang` union, fill out the
`defaultARLabels[<newLang>]` table, and update `detectLang()`'s prefix
match.

`useCameraPermission` returns only structured state (`permission` plus
an optional `errorDetail` carrying the raw `DOMException.message` for
the `unknown-error` branch). `<ARSceneInner>` composes the final user-
facing message from `labels.errors.permission.{denied | noCamera |
noHttps | unknownError}`, appending `: ${errorDetail}` to the
`unknownError` prefix when one is present. Adding a third language
therefore requires no hook changes — only the label table.

## Debug logging

`lib/ar/debug.ts` exposes `arLog(...)`. The debug switch is read **once**
at module init from `process.env.NEXT_PUBLIC_AR_DEBUG`:

```sh
NEXT_PUBLIC_AR_DEBUG=1 pnpm dev:https
```

When the env var is set to `'1'`, every `arLog(...)` call forwards to
`console.debug('[ar]', ...args)`. When it is anything else (including
unset), `arLog` returns immediately — no message construction, no
console churn. Next.js inlines `process.env.NEXT_PUBLIC_*` at build time
in browser bundles, so production bundles built without the flag tree-shake
the implementation entirely.

Instrumentation points in `useTargetMediaControl`:

- `ar:targetFound` — `{ targetId, assetIds }`
- `ar:targetLost` — `{ targetId, onLost }`
- `ar:volume` — `{ assetId, volume }` (applied at setup time)
- `ar:play-rejected` — `{ assetId, name }` (replaces silent autoplay swallow)
- `ar:mute-toggle` — `{ muted }`

For Vitest, toggle the flag via `vi.stubEnv('NEXT_PUBLIC_AR_DEBUG', '1')`
+ `vi.resetModules()` + a dynamic `await import('@/lib/ar/debug')`.

## Recipe — adding a second marker

1. Pick a second marker image and place it next to the first one.
2. Open the [MindAR Image Target Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile/), upload **both** images at once. The order in which you upload them becomes the `targetIndex` in the generated `.mind` file.
3. Save the downloaded file to `public/targets-multi.mind` (or overwrite `public/targets.mind` if you want it to be the new default).
4. Add the second overlay PNG to `public/`, e.g. `public/overlay-2.png`.
5. Either:
   - copy the shape of `config/ar.example-multi.ts` into `config/ar.ts`, **or**
   - import `multiARConfig` and pass it to `<ARScene config={multiARConfig} />` in your route.
6. Run `pnpm dev:https` and verify both markers detect their respective overlays.

## Simulation mode

`<ARScene>` reads a `?sim=…` URL query at mount time and, when present,
short-circuits the parts of the bootstrap pipeline that require a real
device. The parser is server-safe and lives in
[`lib/ar/simulation.ts`](../lib/ar/simulation.ts); the dispatching hook is
[`components/ar/useSimulation.ts`](../components/ar/useSimulation.ts).

| Query | Effect |
|---|---|
| `?sim=1` | Activate simulation. Default bypass = both `permission` + `scripts`. |
| `?sim=1&found=a,b` | Once the scene is ready, dispatch `targetFound` on the listed entities. |
| `?sim=1&delay=ms` | Apply the auto-fire after `ms` milliseconds (clamped 0..60_000). |
| `?sim=1&bypass=permission\|scripts` | Bypass only the specified phase; defaults are otherwise still applied. |
| `?sim=1&bypass=` | Disable both bypasses — useful when you want simulation events only. |

When `bypassPermission` is true, the outer
`<ARSceneInner>` ignores `useCameraPermission()`'s return value and forces
`permission = 'granted'`. The hook is **still called** — the Rules of Hooks
require it — but its output is discarded on the sim path.

When `bypassScripts` is true, the `<Script>` tags for A-Frame and MindAR
are not rendered, and `useExternalScripts(...)` runs with `canLoad=false`
(returning `ready=false`). The sim wrapper then forces `ready=true` and
`timedOut=false`, so `sceneActive` flips immediately and `<ARSceneStage>`
mounts.

Because A-Frame may not be loaded in pure sim mode, `<a-scene>` and
`<a-entity>` render as unrecognised HTML elements (no 3D, no marker
detection). What you *do* get is a fully reactive DOM tree:
`useTargetMediaControl` still attaches `targetFound` / `targetLost`
listeners, the SimulationPanel can fire those events on demand, and
`<video>` / `<audio>` elements in `<a-assets>` still play. That's enough
to exercise the entire overlay pipeline without a real device.

The `<SimulationPanel>` is rendered only when `simMode.enabled &&
sceneActive`. It exposes per-target `found` / `lost` buttons with
deterministic `data-testid` attributes so Playwright specs can drive the
same events.

Production builds keep simulation mode wired — the API surface is the
URL, not a build flag — but a one-shot `console.warn` is emitted whenever
the mode is active so a `?sim=1` URL that escapes into a production
deployment is visible in devtools.

## Why HTTPS is required

`navigator.mediaDevices.getUserMedia` returns `undefined` on HTTP except for `localhost`. The dev server is started with `next dev --experimental-https` (`pnpm dev:https`) which automatically issues a self-signed certificate so the camera API is reachable from the same machine. For real devices on a LAN, you need either ngrok or a Vercel preview deployment — see the README troubleshooting section.

## Hot reload pitfalls

A-Frame and MindAR register browser custom elements at script load time. Once registered, they cannot be redefined without a full page reload. The orchestrator's unmount cleanup removes the `<a-scene>` DOM node to keep the next mount clean, but you should still expect the occasional **"customElements already registered" error after edits** — a hard refresh fixes it.
