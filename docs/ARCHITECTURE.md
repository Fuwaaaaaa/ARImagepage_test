# Architecture

This document describes the runtime composition of the AR demo and how to extend it (e.g. to support multiple markers).

## Component split

```
app/ar/page.tsx                 — Next.js route, dynamically imports ARScene with ssr:false
└── components/ARScene.tsx      — Orchestrator
    ├── components/ar/useCameraPermission.ts
    │     └── Probes navigator.mediaDevices.getUserMedia and exposes a 6-state machine
    │       (pending / granted / denied / no-camera / no-https / unknown-error).
    ├── components/ar/useExternalScripts.ts
    │     └── Tracks A-Frame and MindAR load completion plus a 15s timeout.
    │       Renders nothing — the orchestrator owns the <Script> tags.
    ├── components/ar/ARSceneStage.tsx
    │     └── Pure JSX of <a-scene>, <a-assets>, <a-camera>, and per-target
    │       <a-entity> with image / video / audio overlays. Driven by ARConfig.
    ├── components/ar/useTargetMediaControl.ts
    │     └── Subscribes to targetFound / targetLost on each
    │       <a-entity data-target-id="…"> and drives the matching <video> /
    │       <audio> elements (play / pause / reset / mute sync).
    ├── components/ar/MuteToggle.tsx
    │     └── Floating bottom-right mute toggle + useMuteToggleState
    │       (localStorage-backed, lazy-init).
    └── components/ar/ARStatusOverlay.tsx
          └── Loading / ErrorPanel / ARCloseButton primitives.
```

`config/ar.ts` contains the schema + the default single-marker config.
`config/ar.example-multi.ts` is a sample multi-marker config that mixes image,
video, and audio overlays.
`lib/ar/cdn.ts` centralizes the A-Frame / MindAR CDN URLs and pinned versions.
`lib/ar/overlay.ts` provides `overlayAssetId`, `collectMediaAssets`, and
`hasMediaOverlay` — pure utilities shared by the scene stage, the media-control
hook, and the orchestrator.

## Bootstrap order

The AR page only mounts components after each precondition is met:

1. Camera permission probe runs in `useCameraPermission` (`pending → granted | denied | …`).
2. When `granted`, the orchestrator mounts the A-Frame `<Script>` (Next.js `next/script`).
3. After A-Frame's `onLoad` fires, the MindAR `<Script>` is mounted.
4. After both notify the hook (`ready === true`), `<ARSceneStage>` is rendered.

Loading the scripts in this strict order matters because **MindAR's A-Frame integration registers custom elements that depend on A-Frame already being defined.** Loading them in parallel can cause "customElements already registered" errors during HMR.

If either script fails to load within `DEFAULT_SCRIPT_LOAD_TIMEOUT_MS` (15 seconds), `useExternalScripts` flips `timedOut` and the orchestrator renders an `ErrorPanel` with `kind="timeout"`.

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
2. `useTargetMediaControl` (in `components/ar/`) attaches `targetFound` / `targetLost` listeners to each `<a-entity data-target-id="…">` once the scene container is mounted. On `targetFound` it calls `play()` on every related media element (silently catching the rejection that iOS produces when there is no user gesture). On `targetLost` it pauses (or resets / continues) per the overlay's `onLost`.
3. `MuteToggle` provides a fixed-bottom-right button whose state is persisted to `localStorage['ar-muted']`. Defaulting to muted is what lets iOS autoplay kick in. When the user taps the toggle, `useTargetMediaControl` syncs `el.muted` across all media; if the toggle is being un-muted while a target is currently in the "found" state, the hook re-issues `play()` so audio that was previously gesture-blocked starts immediately.

The toggle button is only mounted when the active config contains at least one media overlay (`hasMediaOverlay` in `lib/ar/overlay.ts`).

### iOS Safari caveats

Two browser-level rules drive the design above:

- **Video**: `play()` is allowed without a user gesture only when the element is `muted` *and* `playsinline`. `ARSceneStage` always emits both attributes, so videos start as soon as the marker is found — silently — and the user can lift the mute later via the toggle.
- **Audio**: there is no equivalent "muted autoplay" exception for `<audio>`. On iOS, the very first `play()` *must* originate from a user gesture or it returns a rejected `Promise` (`NotAllowedError`). Even with `localStorage['ar-muted'] === 'false'` from a previous session, the gesture is reset on reload. The expected user flow is therefore: see the marker → tap the mute toggle → audio starts. The hook silently catches the initial rejection and replays media for any currently-found target as soon as the toggle is tapped (because the tap *is* the gesture). On Android Chrome these constraints are looser and audio typically plays without the toggle being tapped.

## Recipe — adding a second marker

1. Pick a second marker image and place it next to the first one.
2. Open the [MindAR Image Target Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile/), upload **both** images at once. The order in which you upload them becomes the `targetIndex` in the generated `.mind` file.
3. Save the downloaded file to `public/targets-multi.mind` (or overwrite `public/targets.mind` if you want it to be the new default).
4. Add the second overlay PNG to `public/`, e.g. `public/overlay-2.png`.
5. Either:
   - copy the shape of `config/ar.example-multi.ts` into `config/ar.ts`, **or**
   - import `multiARConfig` and pass it to `<ARScene config={multiARConfig} />` in your route.
6. Run `pnpm dev:https` and verify both markers detect their respective overlays.

## Why HTTPS is required

`navigator.mediaDevices.getUserMedia` returns `undefined` on HTTP except for `localhost`. The dev server is started with `next dev --experimental-https` (`pnpm dev:https`) which automatically issues a self-signed certificate so the camera API is reachable from the same machine. For real devices on a LAN, you need either ngrok or a Vercel preview deployment — see the README troubleshooting section.

## Hot reload pitfalls

A-Frame and MindAR register browser custom elements at script load time. Once registered, they cannot be redefined without a full page reload. The orchestrator's unmount cleanup removes the `<a-scene>` DOM node to keep the next mount clean, but you should still expect the occasional **"customElements already registered" error after edits** — a hard refresh fixes it.
