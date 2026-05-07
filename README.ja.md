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

- **ユニットテスト** — Vitest + Testing Library + jsdom。`useCameraPermission`, `useExternalScripts`, `useTargetMediaControl` などの AR 用フック、ステータスオーバーレイ UI、シーンの描画、Zod スキーマ(成功・失敗ケース)、i18n のラベル解決 (`detectLang` / `resolveLabels`)、`NEXT_PUBLIC_AR_DEBUG` による `arLog` のゲーティングを検証します。`pnpm test:cov` で実行。
- **E2E テスト** — Playwright (Chromium、既定で `locale: 'ja-JP'` を固定)。トップページ、`/ar` の権限フロー(許可・拒否・HTTPS 不在)、ミュートトグルの描画ゲートを検証します。Chromium は `--use-fake-ui-for-media-stream` で起動するため、カメラ確認ダイアログは自動許可されます。`pnpm e2e:install && pnpm e2e` で実行。

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

## ランタイム設定検証

`<ARScene>` がレンダリングされた瞬間に、`ARConfig` が Zod (`config/ar.schema.ts`) で検証されます。`mindFile` の不在、`width` / `height` が非正値、`volume` が範囲外、未知の `kind`、空の `targets` / `overlays` などが見つかると、AR シーンは **起動せず**、各 issue を JSON path 付きで列挙する `'invalid-config'` エラーパネルが表示されます。これにより「設定の typo で何も表示されない」というサイレント失敗を防げます。

スキーマは TypeScript 型の単一情報源でもあります。`config/ar.ts` は `z.infer` で型を再エクスポートしているため、スキーマと型がずれることはありません。

## 国際化 (i18n)

`<ARScene>` は任意の `lang` props を受け取ります:

```tsx
import ARScene from '@/components/ARScene';

<ARScene lang="en" />            // 英語固定
<ARScene />                       // navigator.language で自動判定(既定 ja)
```

対応言語は `'ja'`(既定)と `'en'` の 2 つです。`lang` 未指定の場合、SSR では日本語でレンダリングされ、クライアントマウント後に `detectLang()` で切り替わります — ハイドレーションミスマッチを避ける代わりに、英語ロケールでは初回 1 フレームだけ ja → en のちらつきが発生します。これを許容できない場合は `lang` を明示してください。ラベル定義は [`lib/ar/i18n.ts`](./lib/ar/i18n.ts) にあります。

`useCameraPermission` が動的に組み立てるエラーメッセージ(例: 「カメラの利用が拒否されました…」)は今回のリリースでは日本語固定です。多言語化は今後の対応とします。

## デバッグログ

`NEXT_PUBLIC_AR_DEBUG=1` を設定すると、AR パイプラインの構造化ログが有効になります:

```sh
NEXT_PUBLIC_AR_DEBUG=1 pnpm dev:https
```

有効化すると、`useTargetMediaControl` が `targetFound` / `targetLost` / `play()` リジェクト / volume 適用 / mute トグルの 5 箇所で `console.debug('[ar]', ...)` を出力します。フラグはモジュール初期化時に 1 度だけ評価されるため、フラグを付けずにビルドした本番バンドルではロガー実装ごと tree-shake されます。詳細は [`lib/ar/debug.ts`](./lib/ar/debug.ts) を参照。

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
│   ├── ARScene.tsx                   # 外側ガード(Zod safeParse)+ ARSceneInner
│   └── ar/
│       ├── ARSceneStage.tsx          # ARConfig 駆動の <a-scene> JSX
│       ├── ARStatusOverlay.tsx       # Loading / ErrorPanel / 閉じるボタン(i18n 対応)
│       ├── MuteToggle.tsx            # ミュートトグル + localStorage 永続化
│       ├── useCameraPermission.ts    # getUserMedia ステートマシン
│       ├── useExternalScripts.ts    # A-Frame → MindAR 順次ロード + 15s タイムアウト
│       └── useTargetMediaControl.ts # targetFound/Lost ハンドラ(Map キャッシュ済み)
├── config/
│   ├── ar.schema.ts                  # Zod スキーマ — ランタイム検証の単一情報源
│   ├── ar.ts                         # z.infer 由来の型 + 既定の単一マーカー設定
│   └── ar.example-multi.ts           # 2 マーカーのサンプル設定
├── lib/ar/
│   ├── cdn.ts                        # CDN URL とバージョン定数
│   ├── overlay.ts                    # アセット ID ヘルパー + メディア収集ユーティリティ
│   ├── i18n.ts                       # ja/en ラベル + detectLang / resolveLabels
│   └── debug.ts                      # arLog() — NEXT_PUBLIC_AR_DEBUG=1 でゲート
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
