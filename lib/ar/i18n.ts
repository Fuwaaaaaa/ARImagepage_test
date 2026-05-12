/**
 * Lightweight in-house i18n for the AR shell UI (loading labels, error
 * panel titles, close button, mute toggle aria-labels).
 *
 * Intentionally dependency-free: shipping a full i18n library for ~20
 * strings would bloat the client bundle for negligible gain. If the label
 * surface grows substantially, swap this for `next-intl` — the
 * `resolveLabels(lang)` interface is the only consumer-facing seam.
 *
 * Server-safe: every helper guards `navigator` access. `<ARScene>` is a
 * client component, but importing this module from a Server Component
 * (intentionally or accidentally) must not throw.
 *
 * The Japanese label table is byte-identical to the previously-hardcoded
 * strings in `ARScene.tsx`, `ARStatusOverlay.tsx`, and `MuteToggle.tsx`.
 * Existing Vitest matchers that grep for `/許可されていません/` etc.
 * continue to pass when no `lang` prop is supplied.
 */

export type ARLang = 'ja' | 'en';

export type ARLabels = {
  loading: {
    permissionPending: string;
    aframe: string;
    mindar: string;
  };
  errors: {
    titles: {
      denied: string;
      'no-camera': string;
      'no-https': string;
      'unknown-error': string;
      timeout: string;
      'invalid-config': string;
    };
    timeoutMessage: string;
    invalidConfigMessage: string;
    noHttpsHint: string;
    detailsSummary: string;
    nameLabel: string;
    /**
     * Dynamic camera-permission messages composed by `<ARSceneInner>` from
     * the structured `permission` + `errorDetail` returned by
     * `useCameraPermission`. `unknownError` is the prefix only — the caller
     * appends `: ${errorDetail}` when a raw DOMException message is available.
     */
    permission: {
      denied: string;
      noCamera: string;
      noHttps: string;
      unknownError: string;
    };
  };
  close: {
    aria: string;
    text: string;
  };
  buttons: {
    reload: string;
    home: string;
  };
  mute: {
    muteAriaLabel: string;
    unmuteAriaLabel: string;
  };
  /**
   * Landing-page copy. Mirrors the AR shell i18n style so the home route can
   * follow the same SSR-ja → client-detect pattern documented for `<ARScene>`.
   *
   * `httpsNoteCode` is the inline code fragment (`pnpm dev:https`) injected
   * between the `httpsNoteBefore` and `httpsNoteAfter` prose so we never put
   * raw markup in the label table.
   */
  landing: {
    eyebrow: string;
    title: string;
    subtitle: string;
    markerHeading: string;
    markerBody: string;
    markerImageAlt: string;
    steps: {
      permission: { title: string; body: string };
      hold: { title: string; body: string };
      view: { title: string; body: string };
    };
    startCta: string;
    httpsNoteBefore: string;
    httpsNoteCode: string;
    httpsNoteAfter: string;
  };
};

export const defaultARLabels: Record<ARLang, ARLabels> = {
  ja: {
    loading: {
      permissionPending: 'カメラを準備中...',
      aframe: 'A-Frame を読み込み中...',
      mindar: 'MindAR を読み込み中...',
    },
    errors: {
      titles: {
        denied: 'カメラの利用が許可されていません',
        'no-camera': 'カメラが見つかりません',
        'no-https': 'HTTPS 接続が必要です',
        'unknown-error': 'カメラの起動に失敗しました',
        timeout: 'AR エンジンの読み込みに失敗しました',
        'invalid-config': 'AR の設定が無効です',
      },
      timeoutMessage:
        'ネットワーク接続を確認して再読み込みしてください。AR エンジンの読み込みに 15 秒以上かかりました。',
      invalidConfigMessage:
        'AR の設定にエラーがあるため起動できません。以下の項目を修正してください。',
      noHttpsHint: 'pnpm dev:https',
      detailsSummary: '詳細を表示',
      nameLabel: 'name:',
      permission: {
        denied:
          'カメラの利用が拒否されました。ブラウザの設定からカメラ許可を有効にして再読み込みしてください。',
        noCamera:
          '利用可能なカメラが見つかりませんでした。デバイスにカメラが接続されているか確認してください。',
        noHttps:
          'カメラ API が利用できません。HTTPS 接続(または localhost)からアクセスしてください。',
        unknownError: 'カメラの起動に失敗しました',
      },
    },
    close: {
      aria: 'AR を閉じてホームに戻る',
      text: '閉じる',
    },
    buttons: {
      reload: '再読み込み',
      home: 'ホームに戻る',
    },
    mute: {
      muteAriaLabel: 'ミュートにする',
      unmuteAriaLabel: 'ミュートを解除',
    },
    landing: {
      eyebrow: 'Image Tracking AR Demo',
      title: '画像認識 AR デモ',
      subtitle:
        'マーカー画像をかざすと、AR でオーバーレイ画像が表示されます',
      markerHeading: 'マーカー画像(これをかざしてください)',
      markerBody:
        '印刷するか、別の画面にこの画像を表示してカメラに向けてください。',
      markerImageAlt: 'AR マーカー画像',
      steps: {
        permission: { title: '許可', body: 'カメラの利用を許可します' },
        hold: { title: 'かざす', body: 'マーカー画像をカメラに向けます' },
        view: { title: '表示', body: 'AR オーバーレイが表示されます' },
      },
      startCta: 'ARを開始',
      httpsNoteBefore: '※ カメラ利用には HTTPS 接続が必要です。ローカル開発時は',
      httpsNoteCode: 'pnpm dev:https',
      httpsNoteAfter: 'を使ってください。',
    },
  },
  en: {
    loading: {
      permissionPending: 'Preparing camera...',
      aframe: 'Loading A-Frame...',
      mindar: 'Loading MindAR...',
    },
    errors: {
      titles: {
        denied: 'Camera access is not allowed',
        'no-camera': 'No camera found',
        'no-https': 'HTTPS connection required',
        'unknown-error': 'Failed to start the camera',
        timeout: 'Failed to load the AR engine',
        'invalid-config': 'AR configuration is invalid',
      },
      timeoutMessage:
        'Check your network connection and reload. Loading the AR engine took longer than 15 seconds.',
      invalidConfigMessage:
        'The AR configuration is invalid and cannot start. Please fix the items listed below.',
      noHttpsHint: 'pnpm dev:https',
      detailsSummary: 'Show details',
      nameLabel: 'name:',
      permission: {
        denied:
          'Camera access was denied. Enable camera permission in your browser settings and reload the page.',
        noCamera:
          'No camera is available. Make sure a camera is connected to this device.',
        noHttps:
          'The camera API is not available. Open this page over HTTPS (or via localhost).',
        unknownError: 'Failed to start the camera',
      },
    },
    close: {
      aria: 'Close AR and return home',
      text: 'Close',
    },
    buttons: {
      reload: 'Reload',
      home: 'Back to home',
    },
    mute: {
      muteAriaLabel: 'Mute',
      unmuteAriaLabel: 'Unmute',
    },
    landing: {
      eyebrow: 'Image Tracking AR Demo',
      title: 'Image-Recognition AR Demo',
      subtitle:
        'Hold up the marker image to see the AR overlay appear on top of it.',
      markerHeading: 'Marker image (hold this up)',
      markerBody:
        'Print this out or display it on another screen, then point your camera at it.',
      markerImageAlt: 'AR marker image',
      steps: {
        permission: {
          title: 'Allow',
          body: 'Grant camera access when prompted',
        },
        hold: { title: 'Hold up', body: 'Point your camera at the marker' },
        view: { title: 'View', body: 'The AR overlay appears on top of it' },
      },
      startCta: 'Start AR',
      httpsNoteBefore:
        'Camera access requires an HTTPS connection. For local development, use',
      httpsNoteCode: 'pnpm dev:https',
      httpsNoteAfter: '.',
    },
  },
};

/**
 * Server-safe `navigator.language` probe. Returns `'ja'` when navigator is
 * unavailable so SSR / Node / static prerender all settle on the existing
 * default behavior.
 */
export function detectLang(): ARLang {
  if (typeof navigator === 'undefined') return 'ja';
  const raw = navigator.language;
  if (typeof raw !== 'string' || raw.length === 0) return 'ja';
  return raw.toLowerCase().startsWith('en') ? 'en' : 'ja';
}

/**
 * Explicit `lang` arg wins; otherwise auto-detect via `detectLang()`.
 * Always returns a fully-populated `ARLabels` object — never undefined.
 */
export function resolveLabels(lang?: ARLang): ARLabels {
  const resolved = lang ?? detectLang();
  return defaultARLabels[resolved];
}
