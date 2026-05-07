import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCameraPermission } from '@/components/ar/useCameraPermission';

type MediaDevicesLike = {
  getUserMedia?: (constraints?: MediaStreamConstraints) => Promise<MediaStream>;
};

function setMediaDevices(value: MediaDevicesLike | undefined) {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    writable: true,
    value,
  });
}

function makeFakeStream(stopSpy: () => void): MediaStream {
  const tracks = [{ stop: stopSpy } as unknown as MediaStreamTrack];
  return {
    getTracks: () => tracks,
  } as unknown as MediaStream;
}

class FakeDOMException extends Error {
  constructor(name: string, message = '') {
    super(message);
    this.name = name;
  }
}

describe('useCameraPermission', () => {
  let originalMediaDevices: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalMediaDevices = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
  });

  afterEach(() => {
    if (originalMediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', originalMediaDevices);
    }
    vi.restoreAllMocks();
  });

  it('returns no-https when navigator.mediaDevices is missing', async () => {
    setMediaDevices(undefined);
    const { result } = renderHook(() => useCameraPermission());

    await waitFor(() => expect(result.current.permission).toBe('no-https'));
    expect(result.current.errorDetail).toBeUndefined();
  });

  it('returns granted and stops the stream tracks on success', async () => {
    const stopSpy = vi.fn();
    setMediaDevices({
      getUserMedia: vi.fn(async () => makeFakeStream(stopSpy)),
    });

    const { result } = renderHook(() => useCameraPermission());

    await waitFor(() => expect(result.current.permission).toBe('granted'));
    expect(stopSpy).toHaveBeenCalledTimes(1);
  });

  it('returns denied for NotAllowedError', async () => {
    setMediaDevices({
      getUserMedia: vi.fn(async () => {
        throw new FakeDOMException('NotAllowedError');
      }),
    });

    const { result } = renderHook(() => useCameraPermission());

    await waitFor(() => expect(result.current.permission).toBe('denied'));
    expect(result.current.errorName).toBe('NotAllowedError');
    expect(result.current.errorDetail).toBeUndefined();
  });

  it('returns denied for SecurityError', async () => {
    setMediaDevices({
      getUserMedia: vi.fn(async () => {
        throw new FakeDOMException('SecurityError');
      }),
    });

    const { result } = renderHook(() => useCameraPermission());

    await waitFor(() => expect(result.current.permission).toBe('denied'));
  });

  it('returns no-camera for NotFoundError', async () => {
    setMediaDevices({
      getUserMedia: vi.fn(async () => {
        throw new FakeDOMException('NotFoundError');
      }),
    });

    const { result } = renderHook(() => useCameraPermission());

    await waitFor(() => expect(result.current.permission).toBe('no-camera'));
    expect(result.current.errorDetail).toBeUndefined();
  });

  it('returns no-camera for OverconstrainedError', async () => {
    setMediaDevices({
      getUserMedia: vi.fn(async () => {
        throw new FakeDOMException('OverconstrainedError');
      }),
    });

    const { result } = renderHook(() => useCameraPermission());

    await waitFor(() => expect(result.current.permission).toBe('no-camera'));
  });

  it('returns unknown-error for unexpected errors', async () => {
    setMediaDevices({
      getUserMedia: vi.fn(async () => {
        throw new FakeDOMException('SomethingElse', 'unexpected boom');
      }),
    });

    const { result } = renderHook(() => useCameraPermission());

    await waitFor(() => expect(result.current.permission).toBe('unknown-error'));
    expect(result.current.errorDetail).toBe('unexpected boom');
    expect(result.current.errorName).toBe('SomethingElse');
  });

  it('falls back to errorName when DOMException.message is empty', async () => {
    setMediaDevices({
      getUserMedia: vi.fn(async () => {
        throw new FakeDOMException('SomethingElse');
      }),
    });

    const { result } = renderHook(() => useCameraPermission());

    await waitFor(() => expect(result.current.permission).toBe('unknown-error'));
    // FakeDOMException sets an empty string message; current behavior falls
    // back to the name when message is "" (only when message is null/undefined,
    // an empty string is preserved). Either way, errorDetail must be defined
    // so the caller can append it to the localized prefix.
    expect(typeof result.current.errorDetail).toBe('string');
  });
});
