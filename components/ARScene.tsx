'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { defaultARConfig, type ARConfig } from '@/config/ar';
import { arConfigSchema } from '@/config/ar.schema';
import { AFRAME_SRC, MINDAR_SRC } from '@/lib/ar/cdn';
import { detectLang, resolveLabels, type ARLang } from '@/lib/ar/i18n';
import { hasMediaOverlay } from '@/lib/ar/overlay';
import { ARSceneStage } from './ar/ARSceneStage';
import {
  ARCloseButton,
  ErrorPanel,
  Loading,
  type ErrorKind,
  type InvalidConfigIssue,
} from './ar/ARStatusOverlay';
import { MuteToggle, useMuteToggleState } from './ar/MuteToggle';
import { useCameraPermission } from './ar/useCameraPermission';
import { useExternalScripts } from './ar/useExternalScripts';
import { useTargetMediaControl } from './ar/useTargetMediaControl';

export type ARSceneProps = {
  config?: ARConfig;
  lang?: ARLang;
};

/**
 * Outer guard: validates the incoming config at runtime via Zod and either
 * delegates to `<ARSceneInner>` or short-circuits to an `'invalid-config'`
 * error panel.
 *
 * The outer/inner split is deliberate: when the config is invalid we must
 * not call any of the AR hooks (`useCameraPermission`, `useExternalScripts`,
 * `useTargetMediaControl`, etc.). Doing the safeParse in the outer
 * component keeps Rules of Hooks intact across both render paths.
 */
export default function ARScene({
  config = defaultARConfig,
  lang,
}: ARSceneProps = {}) {
  const parsed = arConfigSchema.safeParse(config);

  if (!parsed.success) {
    // SSR-safe: resolveLabels(undefined) returns ja under SSR. The outer
    // component never rehydrates `<ARSceneInner>`, so the lang flicker
    // workaround used inside the inner is unnecessary here.
    const labels = resolveLabels(lang);
    const issues: InvalidConfigIssue[] = parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return (
      <div className="fixed inset-0 bg-black text-white">
        <ARCloseButton lang={lang} />
        <ErrorPanel
          kind="invalid-config"
          message={labels.errors.invalidConfigMessage}
          issues={issues}
          lang={lang}
        />
      </div>
    );
  }

  return <ARSceneInner config={parsed.data} lang={lang} />;
}

function ARSceneInner({ config, lang }: { config: ARConfig; lang?: ARLang }) {
  // When `lang` is omitted, start with the SSR-safe default ('ja' from
  // `resolveLabels(undefined)`) and switch to the client-detected language
  // after mount. This avoids a hydration mismatch on en-locale clients —
  // a one-frame post-mount state update is the correct pattern here, even
  // though it trips React's default "no setState in effect" guideline.
  const [resolvedLang, setResolvedLang] = useState<ARLang | undefined>(lang);
  useEffect(() => {
    if (lang) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResolvedLang(detectLang());
  }, [lang]);

  const labels = resolveLabels(resolvedLang);

  const { permission, errorName, errorDetail } = useCameraPermission();
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

  const permissionMessage = (() => {
    const m = labels.errors.permission;
    if (permission === 'denied') return m.denied;
    if (permission === 'no-camera') return m.noCamera;
    if (permission === 'no-https') return m.noHttps;
    if (permission === 'unknown-error') {
      return errorDetail ? `${m.unknownError}: ${errorDetail}` : m.unknownError;
    }
    return '';
  })();

  const loadingLabel = (() => {
    if (permission === 'pending') return labels.loading.permissionPending;
    if (canLoadScripts && !aframeLoaded) return labels.loading.aframe;
    if (canLoadScripts && aframeLoaded && !mindarLoaded)
      return labels.loading.mindar;
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

      <ARCloseButton lang={resolvedLang} />

      {!isPermissionError && !timedOut && loadingLabel && (
        <Loading label={loadingLabel} />
      )}

      {isPermissionError && (
        <ErrorPanel
          kind={permission as ErrorKind}
          message={permissionMessage}
          errorName={errorName}
          lang={resolvedLang}
        />
      )}

      {timedOut && !isPermissionError && (
        <ErrorPanel
          kind="timeout"
          message={labels.errors.timeoutMessage}
          lang={resolvedLang}
        />
      )}

      <div ref={sceneContainerRef}>
        {sceneActive && <ARSceneStage config={config} />}
      </div>

      {showMuteToggle && (
        <MuteToggle muted={muted} onChange={setMuted} lang={resolvedLang} />
      )}
    </div>
  );
}
