import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SCRIPT_LOAD_TIMEOUT_MS,
  useExternalScripts,
} from '@/components/ar/useExternalScripts';

describe('useExternalScripts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing when canLoad is false', () => {
    const { result } = renderHook(() => useExternalScripts(false));

    expect(result.current.aframeLoaded).toBe(false);
    expect(result.current.mindarLoaded).toBe(false);
    expect(result.current.ready).toBe(false);
    expect(result.current.timedOut).toBe(false);
  });

  it('reflects loaded state when notifiers are called', () => {
    const { result } = renderHook(() => useExternalScripts(true));

    act(() => result.current.notifyAframeLoaded());
    expect(result.current.aframeLoaded).toBe(true);
    expect(result.current.mindarLoaded).toBe(false);
    expect(result.current.ready).toBe(false);

    act(() => result.current.notifyMindarLoaded());
    expect(result.current.mindarLoaded).toBe(true);
    expect(result.current.ready).toBe(true);
  });

  it('does not start the timeout when canLoad is false', () => {
    const { result } = renderHook(() => useExternalScripts(false, { timeoutMs: 1000 }));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.timedOut).toBe(false);
  });

  it('flips timedOut after the configured delay when not yet ready', () => {
    const { result } = renderHook(() => useExternalScripts(true, { timeoutMs: 1000 }));

    expect(result.current.timedOut).toBe(false);
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current.timedOut).toBe(false);

    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(result.current.timedOut).toBe(true);
  });

  it('does not flip timedOut once ready before the timeout fires', () => {
    const { result } = renderHook(() => useExternalScripts(true, { timeoutMs: 1000 }));

    act(() => {
      result.current.notifyAframeLoaded();
      result.current.notifyMindarLoaded();
    });
    expect(result.current.ready).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.timedOut).toBe(false);
  });

  it('exports the default 15s timeout constant', () => {
    expect(DEFAULT_SCRIPT_LOAD_TIMEOUT_MS).toBe(15000);
  });
});
