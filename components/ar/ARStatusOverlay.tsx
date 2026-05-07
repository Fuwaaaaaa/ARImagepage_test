'use client';

import Link from 'next/link';

export type ErrorKind =
  | 'denied'
  | 'no-camera'
  | 'no-https'
  | 'unknown-error'
  | 'timeout';

export function ARCloseButton() {
  return (
    <Link
      href="/"
      aria-label="AR を閉じてホームに戻る"
      className="fixed right-4 top-4 z-50 inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-black/80"
    >
      <span aria-hidden>×</span>
      <span>閉じる</span>
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

const TITLE_MAP: Record<ErrorKind, string> = {
  denied: 'カメラの利用が許可されていません',
  'no-camera': 'カメラが見つかりません',
  'no-https': 'HTTPS 接続が必要です',
  'unknown-error': 'カメラの起動に失敗しました',
  timeout: 'AR エンジンの読み込みに失敗しました',
};

export function ErrorPanel({
  kind,
  message,
  errorName,
}: {
  kind: ErrorKind;
  message: string;
  errorName?: string;
}) {
  return (
    <div
      role="alert"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 px-6 text-white"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-rose-300">{TITLE_MAP[kind]}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{message}</p>

        {kind === 'no-https' && (
          <pre className="mt-4 overflow-x-auto rounded-md bg-slate-950 p-3 text-xs text-sky-200">
            <code>pnpm dev:https</code>
          </pre>
        )}

        {kind === 'unknown-error' && errorName && (
          <details className="mt-4 rounded-md border border-slate-700 bg-slate-950 p-3 text-xs text-slate-300">
            <summary className="cursor-pointer text-slate-200">詳細を表示</summary>
            <p className="mt-2 break-all">
              <span className="text-slate-400">name:</span> {errorName}
            </p>
          </details>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            再読み込み
          </button>
          <Link
            href="/"
            className="flex-1 rounded-md border border-slate-600 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
