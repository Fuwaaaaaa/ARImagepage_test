'use client';

import { useCallback, useEffect, useState } from 'react';

export type UseExternalScriptsOptions = {
  timeoutMs?: number;
};

export type UseExternalScriptsResult = {
  aframeLoaded: boolean;
  mindarLoaded: boolean;
  ready: boolean;
  timedOut: boolean;
  notifyAframeLoaded: () => void;
  notifyMindarLoaded: () => void;
};

export const DEFAULT_SCRIPT_LOAD_TIMEOUT_MS = 15_000;

/**
 * A-Frame と MindAR を「順次」ロードするためのステートフルなフック。
 * `<Script>` の描画自体は呼び出し側に任せ、このフックは
 *   - 両方が読み込み終わったか (`ready`)
 *   - タイムアウトしたか (`timedOut`)
 * を管理し、テスト容易性を保つ。
 */
export function useExternalScripts(
  canLoad: boolean,
  options: UseExternalScriptsOptions = {},
): UseExternalScriptsResult {
  const timeoutMs = options.timeoutMs ?? DEFAULT_SCRIPT_LOAD_TIMEOUT_MS;
  const [aframeLoaded, setAframeLoaded] = useState(false);
  const [mindarLoaded, setMindarLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const ready = aframeLoaded && mindarLoaded;

  const notifyAframeLoaded = useCallback(() => setAframeLoaded(true), []);
  const notifyMindarLoaded = useCallback(() => setMindarLoaded(true), []);

  useEffect(() => {
    if (!canLoad || ready) return;
    const id = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(id);
  }, [canLoad, ready, timeoutMs]);

  return {
    aframeLoaded,
    mindarLoaded,
    ready,
    timedOut,
    notifyAframeLoaded,
    notifyMindarLoaded,
  };
}
