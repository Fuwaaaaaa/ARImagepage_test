'use client';

import { useEffect, useState } from 'react';

export type PermissionState =
  | 'pending'
  | 'granted'
  | 'denied'
  | 'no-camera'
  | 'no-https'
  | 'unknown-error';

export type UseCameraPermissionResult = {
  permission: PermissionState;
  errorMessage: string;
  errorName?: string;
};

export function useCameraPermission(): UseCameraPermissionResult {
  const [permission, setPermission] = useState<PermissionState>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorName, setErrorName] = useState<string | undefined>(undefined);

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
        if (!cancelled) setPermission('granted');
      } catch (err) {
        if (cancelled) return;
        const error = err as DOMException;
        setErrorName(error.name);
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

    probe();
    return () => {
      cancelled = true;
    };
  }, []);

  return { permission, errorMessage, errorName };
}
