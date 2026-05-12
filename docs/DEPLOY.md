# Deployment

The app is a static-output Next.js 15 site (App Router, all routes
prerender as `(Static)`). No server runtime, no database, no environment
secrets. Anywhere that serves static files over HTTPS will work; the
recommended target is **Vercel** because the GitHub integration handles
preview URLs for free and matches the dev workflow exactly.

## Vercel — first deploy

1. Push the repository to GitHub.
2. <https://vercel.com/new> → "Import Git Repository" → pick the repo.
3. Accept the auto-detected framework (Next.js). No env variables, no
   build overrides — defaults work.
4. Click **Deploy**. The first build takes ~60 s.
5. Vercel returns a `https://<project>.vercel.app` URL. Open `/ar?sim=1`
   to confirm simulation mode boots end-to-end on the deploy host.

After the initial import, every push to `main` deploys to production and
every push to a non-default branch (and every PR) gets its own preview
URL automatically.

## Vercel — CLI (alternative)

```sh
# One-time link
pnpm dlx vercel
# Subsequent prod deploys
pnpm dlx vercel --prod
```

The CLI route is useful when you don't want to grant Vercel access to the
whole GitHub org. For the project's normal contributor workflow the
GitHub integration is strictly easier.

## Environment variables

Currently **none**. The only env knob recognised by the codebase is:

- `NEXT_PUBLIC_AR_DEBUG=1` — enables structured AR pipeline logs
  (`useTargetMediaControl`'s `targetFound` / `targetLost` / play-rejected
  / volume / mute-toggle events). Read once at module init; production
  bundles built without it tree-shake the logger entirely. See
  [`lib/ar/debug.ts`](../lib/ar/debug.ts).

If you set this on Vercel, use the "Preview" environment only — you do
not want production users' devtools spammed with debug logs.

## Cache headers

[`vercel.json`](../vercel.json) marks `/targets.mind` and the static
`marker.png` / `overlay.png` placeholders as immutable so Vercel's edge
serves them with year-long cache lifetimes. The `.mind` binary is
content-addressed (re-compiling the same marker produces the same bytes)
so the immutable cache is safe; if you generate a new descriptor for a
different marker, drop the file under a new path (e.g.
`/targets-v2.mind`) and bump `mindFile` in your `ARConfig` rather than
overwriting the cached resource.

## Testing on a real phone

`localhost` isn't reachable from a phone. Use the Vercel preview URL —
once the GitHub integration is connected, every PR gets one
automatically.

To save reviewers the copy-paste step,
[`.github/workflows/preview-qr.yml`](../.github/workflows/preview-qr.yml)
listens for Vercel's `deployment_status` events and posts (or updates) a
single PR comment containing:

- the preview URL as a markdown link
- an inline QR image rendered by `api.qrserver.com`
- a one-click `/ar?sim=1` shortcut for verifying the overlay pipeline
  without a marker

The workflow uses the default `GITHUB_TOKEN` — no Vercel secret needed.
Because the comment is marked with `<!-- preview-qr -->`, the workflow
edits the existing comment in place on every redeploy instead of stacking
new ones.

### Disabling the QR comment

If you don't want the comment (e.g. a private fork), delete or rename
`.github/workflows/preview-qr.yml`. The functional CI workflow
(`.github/workflows/ci.yml`) is independent.

### When the workflow stays silent

- Vercel is not connected to the repository → no `deployment_status`
  events fire.
- The deployment is not from `*.vercel.app` (custom domain on the
  default branch) → filtered out by the `if:` guard. Production deploys
  on the default branch typically don't need a QR comment because they
  don't land on a PR.
- The deployment SHA isn't associated with any PR (e.g. a direct push to
  `main`) → the workflow logs `No PR is associated with <sha>` and
  exits without commenting.

## Custom domain

Vercel → Settings → Domains → "Add". DNS instructions are surfaced in
the UI. The app makes no domain-specific assumptions (no auth callbacks,
no CORS allowlists), so a custom domain works without code changes.

## Production smoke before deploying

The `production-smoke` CI job (defined in
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) reproduces what
Vercel will do — `pnpm build` + `pnpm start` + curl key routes — and
gates merges. A green CI is the practical pre-deploy check; you don't
need to also run it locally unless you're debugging a production-only
regression.

## Rollback

Vercel keeps every deployment forever. Settings → Deployments → pick a
known-good build → "Promote to Production". DNS propagation is instant.

There are no irreversible side effects in this app (no database writes,
no third-party state), so rollback is purely a one-click revert of the
served HTML/JS bundle.
