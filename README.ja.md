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

## ファイル構成

```
.
├── app/
│   ├── layout.tsx       # ルートレイアウト
│   ├── globals.css      # Tailwind v4 + AR 用のグローバル CSS
│   ├── page.tsx         # ランディング(/)
│   └── ar/
│       └── page.tsx     # AR ページ(/ar)、ARScene を ssr:false で読み込む
├── components/
│   └── ARScene.tsx      # A-Frame + MindAR を扱うクライアントコンポーネント
├── global.d.ts          # A-Frame カスタム要素の JSX 型定義
├── public/
│   ├── README.md        # アセット差し替え手順
│   ├── marker.png       # マーカー画像(置き換える)
│   ├── overlay.png      # オーバーレイ画像(置き換える)
│   └── targets.mind     # ★ 自分で生成・配置(同梱なし)
└── README.md            # このファイル
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
