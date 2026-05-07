import type { ARConfig } from './ar';

/**
 * 複数マーカー設定のサンプル。
 *
 * 使い方:
 *   1. 2 つの画像をマーカーとして用意し、MindAR Image Target Compiler
 *      (https://hiukim.github.io/mind-ar-js-doc/tools/compile/) で
 *      まとめて 1 つの `.mind` ファイルへコンパイルする。
 *      コンパイル時の登録順がそのまま `targetIndex` (0, 1, ...) に対応する。
 *   2. 出力された `targets.mind` を `public/targets-multi.mind` に保存する。
 *   3. `components/ARScene.tsx` で
 *        import { multiARConfig as defaultARConfig } from '@/config/ar.example-multi';
 *      に差し替える、または props で渡す。
 *   4. それぞれのオーバーレイ画像 / 動画 / 音声を `public/` 以下に配置する
 *      (外部 CDN URL を指定することも可能)。
 *
 * 1 つのターゲットに `image + video + audio` を同時に重ねたり、ターゲット毎に
 * 異なる kind を指定したりできる。
 */
export const multiARConfig: ARConfig = {
  mindFile: '/targets-multi.mind',
  targets: [
    {
      id: 'primary',
      targetIndex: 0,
      overlays: [
        {
          kind: 'video',
          src: '/overlays/primary.mp4',
          width: 1,
          height: 0.552,
          position: '0 0 0',
          rotation: '0 0 0',
          loop: true,
          muted: true,
          preload: 'auto',
          onLost: 'pause',
        },
      ],
    },
    {
      id: 'secondary',
      targetIndex: 1,
      overlays: [
        {
          kind: 'image',
          src: '/overlays/secondary.png',
          width: 1,
          height: 0.552,
          position: '0 0 0',
          rotation: '0 0 0',
        },
        {
          kind: 'audio',
          src: '/overlays/secondary.mp3',
          loop: true,
          volume: 0.8,
          onLost: 'pause',
        },
      ],
    },
  ],
};
