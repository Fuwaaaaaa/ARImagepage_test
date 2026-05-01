# Asset replacement guide / アセット差し替え手順

[English](#english) | [日本語](#日本語)

---

## English

The images in this directory are **placeholders**. To run the AR demo with your own assets, replace them as follows.

### 1. `targets.mind` (required, not committed)

The MindAR feature-descriptor binary used to recognize the marker. Without this file, the AR scene will detect nothing.

**How to generate:**

1. Open the MindAR Image Target Compiler in your browser:
   <https://hiukim.github.io/mind-ar-js-doc/tools/compile/>
2. Upload the image you want recognized (the same image as `marker.png`)
3. Click "Start" to compile
4. Click "Download" to get `targets.mind`
5. Save it into this directory as `public/targets.mind`

> **Tip:** Images with high contrast and many feature points (corners, textures) are recognized more reliably. Solid backgrounds or highly symmetric images are difficult to track.

### 2. `marker.png` (recommended replacement)

The marker preview image shown on the landing page. Users print this or display it on another screen and point the camera at it.

Save the **same image** you used to generate `targets.mind` as `marker.png`.

### 3. `overlay.png` (recommended replacement)

The image rendered on top of the marker in AR.
A transparent PNG is recommended for natural compositing.

- Recommended size: 512×512 to 1024×1024
- Format: PNG (with transparency)
- Aspect ratio is controlled in `components/ARScene.tsx` via `<a-image width="1" height="0.552" />`

---

## 日本語

このディレクトリにある画像は **プレースホルダ** です。実際の AR デモを動作させるには、以下を差し替えてください。

### 1. `targets.mind`(必須・同梱なし)

MindAR が画像を認識するために使う **特徴量バイナリ**。これがないと AR シーンは何も検出できません。

### 生成手順

1. ブラウザで MindAR Image Target Compiler を開く:
   <https://hiukim.github.io/mind-ar-js-doc/tools/compile/>
2. 認識させたい画像(`marker.png` と同じ画像)をアップロード
3. "Start" をクリックしてコンパイル
4. "Download" で `targets.mind` をダウンロード
5. このディレクトリ(`public/`)に `targets.mind` として保存

> **注意:** 認識精度が高い画像は、コントラストが強く、特徴点(コーナー・テクスチャ)が多い画像です。
> 単色の背景や対称性が高すぎる画像は認識されにくくなります。

### 2. `marker.png`(置き換え推奨)

ランディングページに表示される **マーカープレビュー画像**。
ユーザーが印刷したり別画面に表示したりして、カメラに向ける対象です。

`targets.mind` の生成に使った画像と **同じもの** を `marker.png` として保存してください。

### 3. `overlay.png`(置き換え推奨)

マーカーが検出された時に **AR で重畳表示される** 画像。
透過 PNG を推奨します(背景透過にすると自然に見えます)。

- 推奨サイズ: 512×512 〜 1024×1024
- 形式: PNG(透過対応)
- アスペクト比は `components/ARScene.tsx` 内の `<a-image width="1" height="0.552" />` で調整可能
