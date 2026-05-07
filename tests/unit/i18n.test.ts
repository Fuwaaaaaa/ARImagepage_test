import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  defaultARLabels,
  detectLang,
  resolveLabels,
  type ARLabels,
} from '@/lib/ar/i18n';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('detectLang', () => {
  it('falls back to ja when navigator is unavailable', () => {
    vi.stubGlobal('navigator', undefined);
    expect(detectLang()).toBe('ja');
  });

  it('returns en when navigator.language starts with en', () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(detectLang()).toBe('en');
  });

  it('returns ja for ja-JP', () => {
    vi.stubGlobal('navigator', { language: 'ja-JP' });
    expect(detectLang()).toBe('ja');
  });

  it('returns ja for non-en languages (fr-FR)', () => {
    vi.stubGlobal('navigator', { language: 'fr-FR' });
    expect(detectLang()).toBe('ja');
  });

  it('handles empty navigator.language by returning ja', () => {
    vi.stubGlobal('navigator', { language: '' });
    expect(detectLang()).toBe('ja');
  });
});

describe('resolveLabels', () => {
  it('returns the explicitly requested language', () => {
    expect(resolveLabels('en').close.text).toBe('Close');
    expect(resolveLabels('ja').close.text).toBe('閉じる');
  });

  it('auto-detects when lang is omitted', () => {
    vi.stubGlobal('navigator', { language: 'en-GB' });
    expect(resolveLabels().errors.titles['invalid-config']).toBe(
      'AR configuration is invalid',
    );
  });

  it('returns ja-default when lang is omitted and detection fails', () => {
    vi.stubGlobal('navigator', undefined);
    expect(resolveLabels().errors.titles['invalid-config']).toBe(
      'AR の設定が無効です',
    );
  });

  it('en label set differs from ja for invalid-config', () => {
    expect(resolveLabels('en').errors.titles['invalid-config']).not.toBe(
      resolveLabels('ja').errors.titles['invalid-config'],
    );
  });
});

describe('defaultARLabels structural completeness', () => {
  function structuralKeys(value: unknown, prefix = ''): string[] {
    if (typeof value !== 'object' || value === null) return [prefix];
    const keys: string[] = [];
    for (const [k, v] of Object.entries(value)) {
      keys.push(...structuralKeys(v, prefix ? `${prefix}.${k}` : k));
    }
    return keys.sort();
  }

  it('ja and en cover the same set of keys', () => {
    const ja = structuralKeys(defaultARLabels.ja);
    const en = structuralKeys(defaultARLabels.en);
    expect(en).toEqual(ja);
  });

  it('all error titles for every ErrorKind are populated', () => {
    const kinds: Array<keyof ARLabels['errors']['titles']> = [
      'denied',
      'no-camera',
      'no-https',
      'unknown-error',
      'timeout',
      'invalid-config',
    ];
    for (const lang of ['ja', 'en'] as const) {
      for (const kind of kinds) {
        expect(defaultARLabels[lang].errors.titles[kind].length).toBeGreaterThan(0);
      }
    }
  });
});
