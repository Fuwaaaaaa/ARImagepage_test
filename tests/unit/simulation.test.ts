import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetSimWarnedForTests,
  DISABLED_SIM_MODE,
  parseSimMode,
  readSimModeFromLocation,
  warnSimActiveOnce,
} from '@/lib/ar/simulation';

describe('parseSimMode', () => {
  it('returns the disabled mode when sim is absent', () => {
    expect(parseSimMode('')).toEqual(DISABLED_SIM_MODE);
    expect(parseSimMode('?other=1')).toEqual(DISABLED_SIM_MODE);
  });

  it.each(['0', 'false', 'off', 'no', 'FALSE', 'Off'])(
    'returns the disabled mode for sim=%s',
    (val) => {
      expect(parseSimMode(`?sim=${val}`).enabled).toBe(false);
    },
  );

  it('enables and defaults to bypassing both permission and scripts', () => {
    const mode = parseSimMode('?sim=1');
    expect(mode.enabled).toBe(true);
    expect(mode.bypassPermission).toBe(true);
    expect(mode.bypassScripts).toBe(true);
    expect(mode.initiallyFound).toEqual([]);
    expect(mode.foundDelayMs).toBe(0);
  });

  it('accepts any truthy sim value (sim=true, sim=yes, sim=anything)', () => {
    expect(parseSimMode('?sim=true').enabled).toBe(true);
    expect(parseSimMode('?sim=yes').enabled).toBe(true);
    expect(parseSimMode('?sim=anything').enabled).toBe(true);
  });

  it('parses a single initiallyFound target id', () => {
    expect(parseSimMode('?sim=1&found=primary').initiallyFound).toEqual([
      'primary',
    ]);
  });

  it('parses multiple comma-separated target ids and trims whitespace', () => {
    expect(
      parseSimMode('?sim=1&found=primary, secondary , tertiary')
        .initiallyFound,
    ).toEqual(['primary', 'secondary', 'tertiary']);
  });

  it('drops empty segments in found', () => {
    expect(parseSimMode('?sim=1&found=,a,,b,').initiallyFound).toEqual([
      'a',
      'b',
    ]);
  });

  it('parses a non-negative integer delay', () => {
    expect(parseSimMode('?sim=1&delay=500').foundDelayMs).toBe(500);
    expect(parseSimMode('?sim=1&delay=0').foundDelayMs).toBe(0);
  });

  it('clamps delay to a 60s ceiling', () => {
    expect(parseSimMode('?sim=1&delay=999999').foundDelayMs).toBe(60_000);
  });

  it('falls back to 0 for invalid delay values', () => {
    expect(parseSimMode('?sim=1&delay=NaN').foundDelayMs).toBe(0);
    expect(parseSimMode('?sim=1&delay=-1').foundDelayMs).toBe(0);
    expect(parseSimMode('?sim=1&delay=abc').foundDelayMs).toBe(0);
  });

  it('respects bypass=permission only', () => {
    const mode = parseSimMode('?sim=1&bypass=permission');
    expect(mode.bypassPermission).toBe(true);
    expect(mode.bypassScripts).toBe(false);
  });

  it('respects bypass=scripts only', () => {
    const mode = parseSimMode('?sim=1&bypass=scripts');
    expect(mode.bypassPermission).toBe(false);
    expect(mode.bypassScripts).toBe(true);
  });

  it('respects bypass=permission,scripts (both)', () => {
    const mode = parseSimMode('?sim=1&bypass=permission,scripts');
    expect(mode.bypassPermission).toBe(true);
    expect(mode.bypassScripts).toBe(true);
  });

  it('disables both bypasses when bypass= is explicitly empty', () => {
    const mode = parseSimMode('?sim=1&bypass=');
    expect(mode.bypassPermission).toBe(false);
    expect(mode.bypassScripts).toBe(false);
  });

  it('ignores unknown bypass tokens', () => {
    const mode = parseSimMode('?sim=1&bypass=permission,unknownThing');
    expect(mode.bypassPermission).toBe(true);
    expect(mode.bypassScripts).toBe(false);
  });

  it('tolerates a leading question mark or none', () => {
    expect(parseSimMode('?sim=1').enabled).toBe(true);
    expect(parseSimMode('sim=1').enabled).toBe(true);
  });

  it('accepts a URLSearchParams instance directly', () => {
    const p = new URLSearchParams({ sim: '1', found: 'primary' });
    const mode = parseSimMode(p);
    expect(mode.enabled).toBe(true);
    expect(mode.initiallyFound).toEqual(['primary']);
  });
});

describe('readSimModeFromLocation', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it('reads from window.location.search in the browser', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...originalLocation, search: '?sim=1&found=primary' },
    });
    const mode = readSimModeFromLocation();
    expect(mode.enabled).toBe(true);
    expect(mode.initiallyFound).toEqual(['primary']);
  });
});

describe('warnSimActiveOnce', () => {
  beforeEach(() => {
    __resetSimWarnedForTests();
  });

  it('does not warn when sim is disabled', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnSimActiveOnce(DISABLED_SIM_MODE);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('warns exactly once across multiple calls', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mode = parseSimMode('?sim=1');
    warnSimActiveOnce(mode);
    warnSimActiveOnce(mode);
    warnSimActiveOnce(mode);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
