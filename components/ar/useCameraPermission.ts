'use client';

import { useEffect, useState } from 'react';

export type PermissionState =
  | 'pending'
  | 'granted'
  | 'denied'
  | 'no-camera'
  | 'no-https'
  | 'unknown-error';

/**
 * Hook returns only the structured permission outcome — message text is
 * composed by the caller from `lib/ar/i18n` so that error UI is localized
 * via the same `lang` prop that drives the rest of `<ARScene>`.
 *
 * `errorDetail` carries the raw `DOMException.message` (or `name` fallback)
 * for the `unknown-error` branch only; other states leave it `undefined`
 * because their messages are fully fixed strings.
 */
export type UseCameraPermissionResult = {
  permission: PermissionState;
  errorName?: string;
  errorDetail?: string;
};

export function useCameraPermission(): UseCameraPermissionResult {
  const [permission, setPermission] = useState<PermissionState>('pending');
  const [errorName, setErrorName] = useState<string | undefined>(undefined);
  const [errorDetail, setErrorDetail] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function probe() {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        if (!cancelled) {
          setPermission('no-https');
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        stream.getTracks().forEach((track) => track.stop());
        if (!cancelled) setPermission('granted');
      } catch (err) {
        if (cancelled) return;
        const error = err as DOMException;
        setErrorName(error.name);
        if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
          setPermission('denied');
        } else if (
          error.name === 'NotFoundError' ||
          error.name === 'OverconstrainedError'
        ) {
          setPermission('no-camera');
        } else {
          setPermission('unknown-error');
          setErrorDetail(error.message ?? error.name);
        }
      }
    }

    probe();
    return () => {
      cancelled = true;
    };
  }, []);

  return { permission, errorName, errorDetail };
}
