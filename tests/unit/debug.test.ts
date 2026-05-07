import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('lib/ar/debug', () => {
  it('arDebugEnabled() === true and arLog calls console.debug when NEXT_PUBLIC_AR_DEBUG=1', async () => {
    vi.stubEnv('NEXT_PUBLIC_AR_DEBUG', '1');
    vi.resetModules();
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);

    const mod = await import('@/lib/ar/debug');
    expect(mod.arDebugEnabled()).toBe(true);
    mod.arLog('targetFound', { id: 'primary' });
    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(debugSpy.mock.calls[0][0]).toBe('[ar]');
    expect(debugSpy.mock.calls[0][1]).toBe('targetFound');
  });

  it('arDebugEnabled() === false and arLog is a no-op when NEXT_PUBLIC_AR_DEBUG is empty', async () => {
    vi.stubEnv('NEXT_PUBLIC_AR_DEBUG', '');
    vi.resetModules();
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);

    const mod = await import('@/lib/ar/debug');
    expect(mod.arDebugEnabled()).toBe(false);
    mod.arLog('should not appear');
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('arLog is a no-op for any non-"1" string', async () => {
    vi.stubEnv('NEXT_PUBLIC_AR_DEBUG', 'true'); // "true" !== "1"
    vi.resetModules();
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);

    const mod = await import('@/lib/ar/debug');
    expect(mod.arDebugEnabled()).toBe(false);
    mod.arLog('still off');
    expect(debugSpy).not.toHaveBeenCalled();
  });
});
