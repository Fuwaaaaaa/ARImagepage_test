import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-10 px-6 py-16">
        <header className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
            Image Tracking AR Demo
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
            画像認識 AR デモ
          </h1>
          <p className="mt-4 text-base text-slate-300 sm:text-lg">
            マーカー画像をかざすと、AR でオーバーレイ画像が表示されます
          </p>
        </header>

        <section className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
          <h2 className="text-lg font-semibold text-sky-200">
            マーカー画像(これをかざしてください)
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            印刷するか、別の画面にこの画像を表示してカメラに向けてください。
          </p>
          <div className="mt-4 flex justify-center rounded-lg bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marker.png"
              alt="AR マーカー画像"
              className="h-auto max-h-80 w-auto max-w-full object-contain"
            />
          </div>
        </section>

        <section className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          <Step number={1} title="許可" body="カメラの利用を許可します" />
          <Step number={2} title="かざす" body="マーカー画像をカメラに向けます" />
          <Step number={3} title="表示" body="AR オーバーレイが表示されます" />
        </section>

        <Link
          href="/ar"
          className="inline-flex items-center justify-center rounded-full bg-sky-500 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 active:scale-95"
        >
          ARを開始
        </Link>

        <p className="text-center text-xs text-slate-500">
          ※ カメラ利用には HTTPS 接続が必要です。ローカル開発時は
          <code className="mx-1 rounded bg-slate-800 px-1 py-0.5">pnpm dev:https</code>
          を使ってください。
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
