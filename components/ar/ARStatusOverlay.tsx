'use client';

import Link from 'next/link';
import { resolveLabels, type ARLabels, type ARLang } from '@/lib/ar/i18n';

export type ErrorKind =
  | 'denied'
  | 'no-camera'
  | 'no-https'
  | 'unknown-error'
  | 'timeout'
  | 'invalid-config';

export type InvalidConfigIssue = {
  path: string;
  message: string;
};

type WithLang = { lang?: ARLang };

export function ARCloseButton({ lang }: WithLang = {}) {
  const labels = resolveLabels(lang);
  return (
    <Link
      href="/"
      aria-label={labels.close.aria}
      className="fixed right-4 top-4 z-50 inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-black/80"
    >
      <span aria-hidden>×</span>
      <span>{labels.close.text}</span>
    </Link>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 text-white"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-slate-500 border-t-sky-400" />
        <p className="text-sm tracking-widest text-slate-300">{label}</p>
      </div>
    </div>
  );
}

export function ErrorPanel({
  kind,
  message,
  errorName,
  issues,
  lang,
}: {
  kind: ErrorKind;
  message: string;
  errorName?: string;
  issues?: InvalidConfigIssue[];
  lang?: ARLang;
}) {
  const labels = resolveLabels(lang);
  const titles = labels.errors.titles;
  const isInvalidConfig = kind === 'invalid-config';

  return (
    <div
      role="alert"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 px-6 text-white"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-rose-300">{titles[kind]}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{message}</p>

        {kind === 'no-https' && (
          <pre className="mt-4 overflow-x-auto rounded-md bg-slate-950 p-3 text-xs text-sky-200">
            <code>{labels.errors.noHttpsHint}</code>
          </pre>
        )}

        {kind === 'unknown-error' && errorName && (
          <details className="mt-4 rounded-md border border-slate-700 bg-slate-950 p-3 text-xs text-slate-300">
            <summary className="cursor-pointer text-slate-200">
              {labels.errors.detailsSummary}
            </summary>
            <p className="mt-2 break-all">
              <span className="text-slate-400">{labels.errors.nameLabel}</span>{' '}
              {errorName}
            </p>
          </details>
        )}

        {isInvalidConfig && issues && issues.length > 0 && (
          <ul className="mt-4 space-y-2 rounded-md border border-slate-700 bg-slate-950 p-3 text-xs text-slate-300">
            {issues.map((issue, i) => (
              <li key={`${issue.path}-${i}`} className="break-all">
                <code className="text-amber-300">{issue.path || '(root)'}</code>
                <span className="text-slate-500"> — </span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {!isInvalidConfig && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              {labels.buttons.reload}
            </button>
          )}
          <Link
            href="/"
            className="flex-1 rounded-md border border-slate-600 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            {labels.buttons.home}
          </Link>
        </div>
      </div>
    </div>
  );
}

export type { ARLabels };
