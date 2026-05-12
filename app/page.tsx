'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { detectLang, resolveLabels, type ARLang } from '@/lib/ar/i18n';

export default function Home() {
  // Mirror `<ARSceneInner>`: start with the SSR-safe default (ja, since
  // `resolveLabels(undefined)` falls back to ja under SSR) and switch to the
  // detected client language post-mount. Accepts a one-frame ja → en flicker
  // on en-locale clients in exchange for hydration safety.
  const [resolvedLang, setResolvedLang] = useState<ARLang | undefined>(
    undefined,
  );
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResolvedLang(detectLang());
  }, []);

  const labels = resolveLabels(resolvedLang).landing;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-10 px-6 py-16">
        <header className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
            {labels.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
            {labels.title}
          </h1>
          <p className="mt-4 text-base text-slate-300 sm:text-lg">
            {labels.subtitle}
          </p>
        </header>

        <section className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
          <h2 className="text-lg font-semibold text-sky-200">
            {labels.markerHeading}
          </h2>
          <p className="mt-2 text-sm text-slate-400">{labels.markerBody}</p>
          <div className="mt-4 flex justify-center rounded-lg bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marker.png"
              alt={labels.markerImageAlt}
              className="h-auto max-h-80 w-auto max-w-full object-contain"
            />
          </div>
        </section>

        <section className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          <Step
            number={1}
            title={labels.steps.permission.title}
            body={labels.steps.permission.body}
          />
          <Step
            number={2}
            title={labels.steps.hold.title}
            body={labels.steps.hold.body}
          />
          <Step
            number={3}
            title={labels.steps.view.title}
            body={labels.steps.view.body}
          />
        </section>

        <Link
          href="/ar"
          className="inline-flex items-center justify-center rounded-full bg-sky-700 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-sky-700/40 transition hover:bg-sky-600 active:scale-95"
        >
          {labels.startCta}
        </Link>

        <p className="text-center text-xs text-slate-400">
          {labels.httpsNoteBefore}
          <code className="mx-1 rounded bg-slate-800 px-1 py-0.5 text-sky-200">
            {labels.httpsNoteCode}
          </code>
          {labels.httpsNoteAfter}
        </p>
      </div>
    </main>
  );
}

function Step({
  number,
  title,
  body,
}: {
  number: number;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-white">
          {number}
        </span>
        <h3 className="font-semibold text-slate-100">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-slate-400">{body}</p>
    </div>
  );
}
