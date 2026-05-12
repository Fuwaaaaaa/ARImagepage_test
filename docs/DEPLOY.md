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

The `.mind` feature-descriptor file is content-addressed (re-compiling
the same marker produces the same bytes), so it's safe to cache hard.
When a `vercel.json` lands, it should set:

```json
{
  "headers": [
    {
      "source": "/targets.mind",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

Until then the file is served with Next.js's default static-asset headers
(`public, max-age=0`), which is correct but suboptimal for the few
hundred KB binary.

## Testing on a real phone

`localhost` isn't reachable from a phone — use the deployed URL instead:

1. Take the Vercel preview / production URL.
2. Generate a QR code from it (e.g. <https://www.qr-code-generator.com/>).
3. Scan with the phone's camera.

A future iteration of CI (workstream W6 in the project plan) will post a
QR image directly to each PR so reviewers can scan-to-test without
copy-pasting the URL.

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
