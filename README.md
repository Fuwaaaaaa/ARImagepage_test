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

## Project layout

```
.
├── app/
│   ├── layout.tsx       # Root layout
│   ├── globals.css      # Tailwind v4 entry + AR-specific globals
│   ├── page.tsx         # Landing page (/)
│   └── ar/
│       └── page.tsx     # AR page (/ar) — dynamically imports ARScene with ssr:false
├── components/
│   └── ARScene.tsx      # A-Frame + MindAR client component
├── global.d.ts          # JSX type augmentation for A-Frame custom elements
├── public/
│   ├── README.md        # Asset replacement guide
│   ├── marker.png       # Marker image (replace it)
│   ├── overlay.png      # Overlay image (replace it)
│   └── targets.mind     # ★ Generate yourself — not committed
├── LICENSE              # MIT
└── README.md            # This file
```

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| "HTTPS connection required" UI | You're on HTTP. Use `pnpm dev:https` and visit `https://localhost:3000`. |
| Camera prompt never appears | Camera is blocked in browser site settings — clear and reload. |
| `/ar` stays black | `public/targets.mind` is missing or corrupt. Re-compile via the MindAR tool. |
| Marker shown but no overlay appears | The image used to compile `targets.mind` doesn't match `marker.png`, or the marker has too few features. Use a high-contrast image. |
| `customElements` already-registered error after hot reload | A-Frame double-registration. A full page reload fixes it. |
| Doesn't work on iOS Safari | iOS requires HTTPS and a direct user gesture before `getUserMedia`. The "Start AR" button click is the gesture — make sure it's the first thing the user does. |

## References

- A-Frame: <https://aframe.io/>
- MindAR: <https://hiukim.github.io/mind-ar-js-doc/>
- MindAR Image Target Compiler: <https://hiukim.github.io/mind-ar-js-doc/tools/compile/>

## License

Released under the [MIT License](./LICENSE).
