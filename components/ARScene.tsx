'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';
import { defaultARConfig, type ARConfig } from '@/config/ar';
import { AFRAME_SRC, MINDAR_SRC } from '@/lib/ar/cdn';
import { hasMediaOverlay } from '@/lib/ar/overlay';
import { ARSceneStage } from './ar/ARSceneStage';
import {
  ARCloseButton,
  ErrorPanel,
  Loading,
  type ErrorKind,
} from './ar/ARStatusOverlay';
import { MuteToggle, useMuteToggleState } from './ar/MuteToggle';
import { useCameraPermission } from './ar/useCameraPermission';
import { useExternalScripts } from './ar/useExternalScripts';
import { useTargetMediaControl } from './ar/useTargetMediaControl';

export type ARSceneProps = {
  config?: ARConfig;
};

export default function ARScene({ config = defaultARConfig }: ARSceneProps = {}) {
  const { permission, errorMessage, errorName } = useCameraPermission();
  const canLoadScripts = permission === 'granted';

  const {
    aframeLoaded,
    mindarLoaded,
    ready,
    timedOut,
    notifyAframeLoaded,
    notifyMindarLoaded,
  } = useExternalScripts(canLoadScripts);

  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useMuteToggleState(true);

  const sceneActive = canLoadScripts && ready && !timedOut;
  const showMuteToggle = sceneActive && hasMediaOverlay(config.targets);

  useTargetMediaControl({
    containerRef: sceneContainerRef,
    config,
    enabled: sceneActive,
    muted,
  });

  useEffect(() => {
    document.body.classList.add('ar-page');
    return () => {
      document.body.classList.remove('ar-page');
    };
  }, []);

  useEffect(() => {
    const container = sceneContainerRef.current;
    return () => {
      if (!container) return;
      const scene = container.querySelector('a-scene');
      if (scene && scene.parentNode) {
        scene.parentNode.removeChild(scene);
      }
    };
  }, []);

  const isPermissionError =
    permission === 'denied' ||
    permission === 'no-camera' ||
    permission === 'no-https' ||
    permission === 'unknown-error';

  const loadingLabel = (() => {
    if (permission === 'pending') return 'カメラを準備中...';
    if (canLoadScripts && !aframeLoaded) return 'A-Frame を読み込み中...';
    if (canLoadScripts && aframeLoaded && !mindarLoaded)
      return 'MindAR を読み込み中...';
    return null;
  })();

  return (
    <div className="fixed inset-0 bg-black text-white">
      {canLoadScripts && (
        <Script
          src={AFRAME_SRC}
          strategy="afterInteractive"
          onLoad={notifyAframeLoaded}
          onReady={notifyAframeLoaded}
        />
      )}
      {canLoadScripts && aframeLoaded && (
        <Script
          src={MINDAR_SRC}
          strategy="afterInteractive"
          onLoad={notifyMindarLoaded}
          onReady={notifyMindarLoaded}
        />
      )}

      <ARCloseButton />

      {!isPermissionError && !timedOut && loadingLabel && (
        <Loading label={loadingLabel} />
      )}

      {isPermissionError && (
        <ErrorPanel
          kind={permission as ErrorKind}
          message={errorMessage}
          errorName={errorName}
        />
      )}

      {timedOut && !isPermissionError && (
        <ErrorPanel
          kind="timeout"
          message="ネットワーク接続を確認して再読み込みしてください。AR エンジンの読み込みに 15 秒以上かかりました。"
        />
      )}

      <div ref={sceneContainerRef}>
        {sceneActive && <ARSceneStage config={config} />}
      </div>

      {showMuteToggle && <MuteToggle muted={muted} onChange={setMuted} />}
    </div>
  );
}
