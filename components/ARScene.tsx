'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

type PermissionState =
  | 'pending'
  | 'granted'
  | 'denied'
  | 'no-camera'
  | 'no-https'
  | 'unknown-error';

const AFRAME_SRC = 'https://aframe.io/releases/1.5.0/aframe.min.js';
const MINDAR_SRC =
  'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js';

export default function ARScene() {
  const [permission, setPermission] = useState<PermissionState>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [aframeLoaded, setAframeLoaded] = useState(false);
  const [mindarLoaded, setMindarLoaded] = useState(false);
  const sceneContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add('ar-page');
    return () => {
      document.body.classList.remove('ar-page');
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function probeCamera() {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        if (!cancelled) {
          setPermission('no-https');
          setErrorMessage(
            'カメラ API が利用できません。HTTPS 接続(または localhost)からアクセスしてください。',
          );
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        stream.getTracks().forEach((track) => track.stop());
        if (!cancelled) {
          setPermission('granted');
        }
      } catch (err) {
        if (cancelled) return;
        const error = err as DOMException;
        if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
          setPermission('denied');
          setErrorMessage(
            'カメラの利用が拒否されました。ブラウザの設定からカメラ許可を有効にして再読み込みしてください。',
          );
        } else if (
          error.name === 'NotFoundError' ||
          error.name === 'OverconstrainedError'
        ) {
          setPermission('no-camera');
          setErrorMessage(
            '利用可能なカメラが見つかりませんでした。デバイスにカメラが接続されているか確認してください。',
          );
        } else {
          setPermission('unknown-error');
          setErrorMessage(
            `カメラの起動に失敗しました: ${error.message ?? error.name}`,
          );
        }
      }
    }

    probeCamera();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      const container = sceneContainerRef.current;
      if (!container) return;
      const scene = container.querySelector('a-scene');
      if (scene && scene.parentNode) {
        scene.parentNode.removeChild(scene);
      }
    };
  }, []);

  const sceneReady =
    permission === 'granted' && aframeLoaded && mindarLoaded;

  return (
    <div className="fixed inset-0 bg-black text-white">
      {permission === 'granted' && (
        <Script
          src={AFRAME_SRC}
          strategy="afterInteractive"
          onLoad={() => setAframeLoaded(true)}
          onReady={() => setAframeLoaded(true)}
        />
      )}
      {permission === 'granted' && aframeLoaded && (
        <Script
          src={MINDAR_SRC}
          strategy="afterInteractive"
          onLoad={() => setMindarLoaded(true)}
          onReady={() => setMindarLoaded(true)}
        />
      )}

      <Link
        href="/"
        aria-label="AR を閉じてホームに戻る"
        className="fixed right-4 top-4 z-50 inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-black/80"
      >
        <span aria-hidden>×</span>
        <span>閉じる</span>
      </Link>

      {permission === 'pending' && <Loading label="カメラを準備中..." />}

      {permission === 'granted' && !sceneReady && (
        <Loading label="AR エンジンを読み込み中..." />
      )}

      {(permission === 'denied' ||
        permission === 'no-camera' ||
        permission === 'no-https' ||
        permission === 'unknown-error') && (
        <ErrorPanel kind={permission} message={errorMessage} />
      )}

      <div ref={sceneContainerRef}>
        {sceneReady && (
          <a-scene
            mindar-image="imageTargetSrc: /targets.mind; uiLoading: no; uiError: no; uiScanning: no;"
            color-space="sRGB"
            renderer="colorManagement: true, physicallyCorrectLights"
            vr-mode-ui="enabled: false"
            device-orientation-permission-ui="enabled: false"
            embedded
          >
            <a-camera
              position="0 0 0"
              look-controls="enabled: false"
              cursor="fuse: false; rayOrigin: mouse;"
            />
            <a-entity mindar-image-target="targetIndex: 0">
              <a-image
                src="/overlay.png"
                position="0 0 0"
                height="0.552"
                width="1"
                rotation="0 0 0"
              />
            </a-entity>
          </a-scene>
        )}
      </div>
    </div>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-slate-500 border-t-sky-400" />
        <p className="text-sm tracking-widest text-slate-300">{label}</p>
      </div>
    </div>
  );
}

function ErrorPanel({
  kind,
  message,
}: {
  kind: Exclude<PermissionState, 'pending' | 'granted'>;
  message: string;
}) {
  const titleMap: Record<typeof kind, string> = {
    denied: 'カメラの利用が許可されていません',
    'no-camera': 'カメラが見つかりません',
    'no-https': 'HTTPS 接続が必要です',
    'unknown-error': 'カメラの起動に失敗しました',
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-rose-300">{titleMap[kind]}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{message}</p>
        {kind === 'no-https' && (
          <pre className="mt-4 overflow-x-auto rounded-md bg-slate-950 p-3 text-xs text-sky-200">
            <code>pnpm dev:https</code>
          </pre>
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
