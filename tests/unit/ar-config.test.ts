import { describe, expect, it } from 'vitest';
import {
  defaultARConfig,
  type ARConfig,
  type AROverlay,
} from '@/config/ar';
import { multiARConfig } from '@/config/ar.example-multi';

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function assertValidOverlay(overlay: AROverlay) {
  expect(overlay.kind).toMatch(/^(image|video|audio)$/);
  expect(typeof overlay.src).toBe('string');
  expect(overlay.src.length).toBeGreaterThan(0);
  // src must be a public/-relative path or an absolute URL
  expect(overlay.src.startsWith('/') || isHttpUrl(overlay.src)).toBe(true);

  if (overlay.kind === 'image' || overlay.kind === 'video') {
    expect(overlay.width).toBeGreaterThan(0);
    expect(overlay.height).toBeGreaterThan(0);
  }
  if (overlay.kind === 'audio' && typeof overlay.volume === 'number') {
    expect(overlay.volume).toBeGreaterThanOrEqual(0);
    expect(overlay.volume).toBeLessThanOrEqual(1);
  }
  if ('onLost' in overlay && overlay.onLost !== undefined) {
    expect(['pause', 'reset', 'continue']).toContain(overlay.onLost);
  }
}

function assertValidARConfig(config: ARConfig) {
  expect(typeof config.mindFile).toBe('string');
  expect(config.mindFile.startsWith('/')).toBe(true);
  expect(Array.isArray(config.targets)).toBe(true);
  expect(config.targets.length).toBeGreaterThan(0);

  const seenIds = new Set<string>();
  const seenIndices = new Set<number>();
  for (const t of config.targets) {
    expect(typeof t.id).toBe('string');
    expect(t.id.length).toBeGreaterThan(0);
    expect(seenIds.has(t.id)).toBe(false);
    seenIds.add(t.id);

    expect(Number.isInteger(t.targetIndex)).toBe(true);
    expect(t.targetIndex).toBeGreaterThanOrEqual(0);
    // Two targets sharing the same .mind index would cause both entities to
    // light up simultaneously when one marker is found.
    expect(seenIndices.has(t.targetIndex)).toBe(false);
    seenIndices.add(t.targetIndex);

    expect(Array.isArray(t.overlays)).toBe(true);
    expect(t.overlays.length).toBeGreaterThan(0);
    for (const overlay of t.overlays) {
      assertValidOverlay(overlay);
    }
  }
}

describe('defaultARConfig', () => {
  it('points at /targets.mind', () => {
    expect(defaultARConfig.mindFile).toBe('/targets.mind');
  });

  it('has exactly one default target with an image overlay', () => {
    expect(defaultARConfig.targets).toHaveLength(1);
    const target = defaultARConfig.targets[0];
    expect(target.targetIndex).toBe(0);
    expect(target.overlays).toHaveLength(1);
    expect(target.overlays[0].kind).toBe('image');
    expect(target.overlays[0].src).toBe('/overlay.png');
  });

  it('passes the schema validation', () => {
    assertValidARConfig(defaultARConfig);
  });
});

describe('multiARConfig (example)', () => {
  it('declares two targets with distinct ids and indices', () => {
    expect(multiARConfig.targets).toHaveLength(2);
    expect(multiARConfig.targets[0].id).not.toBe(multiARConfig.targets[1].id);
    expect(multiARConfig.targets[0].targetIndex).toBe(0);
    expect(multiARConfig.targets[1].targetIndex).toBe(1);
  });

  it('mixes image, video and audio overlays', () => {
    const kinds = multiARConfig.targets.flatMap((t) =>
      t.overlays.map((o) => o.kind),
    );
    expect(kinds).toContain('video');
    expect(kinds).toContain('image');
    expect(kinds).toContain('audio');
  });

  it('passes the schema validation', () => {
    assertValidARConfig(multiARConfig);
  });
});
