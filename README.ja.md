# 画像認識 AR デモ (Next.js + A-Frame + MindAR.js)

[English](./README.md) | **日本語**

スマホやウェブカメラに **マーカー画像をかざすと、AR でオーバーレイ画像が表示される** デモアプリです。

ライセンス: [MIT](./LICENSE)

## 技術スタック

- **Next.js 15** (App Router)
- **React 19** / **TypeScript 5.7**
- **Tailwind CSS v4**
- **A-Frame 1.5.0** (CDN ロード)
- **MindAR.js 1.2.5** (CDN ロード、画像トラッキング)

A-Frame と MindAR は ブラウザでのみ動作するため、`next/dynamic` の `ssr: false` と `next/script` を使って **クライアント側でのみ** 読み込んでいます。

## セットアップ

```sh
pnpm install
pnpm dev:https
```

ブラウザで **`https://localhost:3000`** を開きます。
自己署名証明書の警告が出ますが、「詳細設定 → アクセスを続行」で進んでください。

> **なぜ HTTPS?** ブラウザの `getUserMedia`(カメラ API)は `localhost` 以外の HTTP 接続では動作しません。`pnpm dev:https` で Next.js が自動的に証明書を生成します。

## 初回起動前に行う必須ステップ

このリポジトリには `public/targets.mind` が含まれていません。**自分で生成して配置する必要があります。**

### マーカーのセットアップ

1. **マーカーにする画像を用意する**(`public/marker.png` を上書き)
   - 推奨: コントラストが強く、特徴点の多い写真や図柄
   - 推奨サイズ: 512×512 以上
2. **`targets.mind` を生成する**
   - MindAR の公式 Web ツールを開く: <https://hiukim.github.io/mind-ar-js-doc/tools/compile/>
   - 用意したマーカー画像をアップロード
   - "Start" → "Download"
   - ダウンロードされた `targets.mind` を `public/targets.mind` として保存
3. **オーバーレイ画像を用意する**(`public/overlay.png` を上書き)
   - マーカー検出時に重畳表示する画像
   - 透過 PNG 推奨
4. `pnpm dev:https` を再起動

詳細は [`public/README.md`](./public/README.md) を参照してください。

## 動作確認の流れ

1. `https://localhost:3000` にアクセス
2. 「ARを開始」ボタンを押す
3. ブラウザがカメラ利用を聞いてくるので **許可**
4. PC のウェブカメラ、もしくはスマホのリアカメラに **マーカー画像をかざす**
5. マーカー上に **`overlay.png` が AR で重畳表示** されたら成功

### スマホで確認するには

`localhost` はスマホからアクセスできないため、以下のいずれかを使ってください:

- **Vercel プレビューデプロイ**(推奨・最も手軽)
- **ngrok**(`ngrok http https://localhost:3000` で公開 URL を発行)
- **同一 LAN 内の IP + Next.js HTTPS**(証明書の信頼設定が必要、上級者向け)

## QR コードでスマホ起動

デプロイ済み URL を QR コード化すると、スマホでスキャンしてすぐ開けます。

- 公開デプロイ URL を、任意の QR ジェネレータ(例: <https://www.qr-code-generator.com/>)で QR 化
- スマホのカメラで読み取る → 画像認識 AR ページが直接開く

## Vercel へのデプロイ

```sh
# 初回のみ
pnpm dlx vercel
# 以降は
pnpm dlx vercel --prod
```

リポジトリを Vercel にインポートすると **GitHub プッシュで自動デプロイ** されます。`public/` のアセットはそのままビルド成果物に含まれるため、特別な設定は不要です。

## スクリプト

| コマンド | 説明 |
|---|---|
| `pnpm dev` | 開発サーバ(HTTP) |
| `pnpm dev:https` | **開発サーバ(HTTPS、カメラを使うならこちら)** |
| `pnpm build` | 本番ビルド + 型チェック |
| `pnpm start` | 本番サーバ起動 |
| `pnpm lint` | ESLint 実行 |
| `pnpm lint:fix` | ESLint を `--fix` 付きで実行 |
| `pnpm test` | Vitest ユニットテストを 1 回実行 |
| `pnpm test:watch` | Vitest を watch モードで実行 |
| `pnpm test:cov` | カバレッジ付きで Vitest を実行 |
| `pnpm e2e` | Playwright E2E テスト(Chromium のみ) |
| `pnpm e2e:ui` | Playwright を UI モードで実行 |
| `pnpm e2e:install` | Playwright Chromium バイナリのダウンロード |

## テスト

このプロジェクトは 2 層の自動テストを備えています:

- **ユニットテスト** — Vitest + Testing Library + jsdom。`useCameraPermission`, `useExternalScripts` などの AR 用フックや、ステータスオーバーレイ UI、シーンの描画、`ARConfig` のスキーマ検証をカバー。`pnpm test:cov` で実行。
- **E2E テスト** — Playwright (Chromium)。トップページと `/ar` の権限フロー(許可・拒否・HTTPS 不在)を検証します。Chromium は `--use-fake-ui-for-media-stream` で起動するため、カメラ確認ダイアログは自動許可されます。`pnpm e2e:install && pnpm e2e` で実行。

GitHub Actions が push と PR ごとにすべて自動で走らせます ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml))。

## オーバーレイ — 画像・動画・音声

各マーカー (`ARTarget`) は `overlays[]` 配列で kind タグ付きユニオンの要素を持ちます。

| `kind`   | 描画される要素 | 必須フィールド | 補足 |
|----------|------------|------------|------|
| `image`  | マーカー上の `<a-image>` 板 | `src`, `width`, `height` | 静止画 |
| `video`  | `<a-assets>` 配下の `<video>` + `<a-video>` 板 | `src`, `width`, `height` | マーカー認識で再生・喪失で停止 (`onLost`)。iOS は muted で自動再生し、画面右下のミュート解除トグルをタップすると音が出ます |
| `audio`  | `<a-assets>` 配下の `<audio>`(非空間) | `src` | マーカー認識中に独立再生。iOS は最初にミュート解除トグルをタップしないと音が鳴りません |

オーバーレイ毎の任意フィールド:

- `position` / `rotation`: A-Frame の transform 文字列(例: `'0 0 0'`)
- `loop`: 動画・音声ともデフォルト `true`
- `muted` (動画のみ): デフォルト `true`(iOS 自動再生のため)
- `volume` (音声のみ): `0..1`、`HTMLAudioElement.volume` に適用
- `crossOrigin`: 外部ホストの素材を使う場合 `'anonymous' | 'use-credentials'`
- `preload` (動画のみ): `'auto' | 'metadata' | 'none'`
- `onLost`: `'pause'`(既定)| `'reset'`(0 秒へ巻き戻し)| `'continue'`

`src` には `public/` 直下の相対パス(例: `/overlays/intro.mp4`)も外部 URL も指定できます。外部 URL の場合は `crossOrigin: 'anonymous'` を付け、配信元が CORS ヘッダを返すか確認してください(動画のテクスチャアップロードに失敗するため)。

設定中に 1 つでも `video` / `audio` オーバーレイが含まれる場合、画面右下に **ミュート解除トグル** が自動で表示されます。状態は `localStorage` のキー `ar-muted` に保存され、リロード後も維持されます(初期状態は muted)。

混在例は [`config/ar.example-multi.ts`](./config/ar.example-multi.ts) を参照してください。

## アーキテクチャ

コンポーネント分割、起動順序、`ARConfig` スキーマ、**マーカー追加レシピ** は [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) を参照してください(英語)。

## ファイル構成

```
.
├── app/
│   ├── layout.tsx                    # ルートレイアウト
│   ├── globals.css                   # Tailwind v4 + AR 用のグローバル CSS
│   ├── page.tsx                      # ランディング(/)
│   └── ar/page.tsx                   # AR ページ(/ar)、ARScene を ssr:false で読み込む
├── components/
│   ├── ARScene.tsx                   # オーケストレータ(カメラ・スクリプト・オーバーレイ)
│   └── ar/
│       ├── ARSceneStage.tsx          # ARConfig 駆動の <a-scene> JSX
│       ├── ARStatusOverlay.tsx       # Loading / ErrorPanel / 閉じるボタン
│       ├── useCameraPermission.ts    # getUserMedia ステートマシン
│       └── useExternalScripts.ts     # A-Frame → MindAR 順次ロード + 15s タイムアウト
├── config/
│   ├── ar.ts                         # 型 + 既定の単一マーカー設定
│   └── ar.example-multi.ts           # 2 マーカーのサンプル設定
├── lib/ar/cdn.ts                     # CDN URL とバージョン定数
├── tests/
│   ├── setup.ts                      # Vitest 用セットアップ
│   └── unit/                         # Vitest ユニットテスト
├── e2e/                              # Playwright E2E テスト
├── docs/ARCHITECTURE.md              # アーキテクチャ詳細
├── eslint.config.mjs                 # ESLint Flat config
├── playwright.config.ts
├── vitest.config.ts
├── global.d.ts                       # A-Frame カスタム要素の JSX 型定義
├── public/
│   ├── README.md                     # アセット差し替え手順
│   ├── marker.png                    # マーカー画像(置き換える)
│   ├── overlay.png                   # オーバーレイ画像(置き換える)
│   └── targets.mind                  # ★ 自分で生成・配置(同梱なし)
└── README.md
```

## トラブルシューティング

| 症状 | 原因と対処 |
|---|---|
| 「HTTPS 接続が必要です」と表示される | HTTP でアクセスしている。`pnpm dev:https` で起動して HTTPS で開く |
| カメラ許可ダイアログが出ない | ブラウザのサイト設定でカメラがブロックされている。設定を解除して再読み込み |
| `/ar` が黒画面のまま | `public/targets.mind` が無い、または破損。MindAR Compiler で再生成 |
| マーカーをかざしても overlay が出ない | マーカー画像と `targets.mind` の元画像が違う、または特徴点不足。コントラストが強い画像で再コンパイル |
| 開発中にリロードすると `customElements` エラー | A-Frame の二重登録。ページ全体をリロードすれば解消 |
| iOS Safari で動かない | iOS は HTTPS 必須かつ "リアカメラ" 利用にユーザー操作が必要。「ARを開始」ボタンを押した直後でないと許可されない |

## 参考リンク

- A-Frame: <https://aframe.io/>
- MindAR: <https://hiukim.github.io/mind-ar-js-doc/>
- MindAR Image Target Compiler: <https://hiukim.github.io/mind-ar-js-doc/tools/compile/>

## ライセンス

このプロジェクトは [MIT License](./LICENSE) の下で公開されています。
