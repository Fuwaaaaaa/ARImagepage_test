import { describe, expect, it } from 'vitest';
import {
  defaultARConfig,
  type ARConfig,
  type AROverlay,
} from '@/config/ar';
import { arConfigSchema } from '@/config/ar.schema';
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

describe('arConfigSchema runtime validation', () => {
  it('accepts the bundled defaultARConfig', () => {
    expect(arConfigSchema.safeParse(defaultARConfig).success).toBe(true);
  });

  it('accepts the bundled multiARConfig', () => {
    expect(arConfigSchema.safeParse(multiARConfig).success).toBe(true);
  });

  it('rejects an empty object with mindFile + targets issues', () => {
    const result = arConfigSchema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = result.error.issues.map((i) => i.path.join('.'));
    expect(paths).toContain('mindFile');
    expect(paths).toContain('targets');
  });

  it('rejects targets: []', () => {
    const result = arConfigSchema.safeParse({
      mindFile: '/x.mind',
      targets: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects overlays: []', () => {
    const result = arConfigSchema.safeParse({
      mindFile: '/x.mind',
      targets: [{ id: 'p', targetIndex: 0, overlays: [] }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects targetIndex: -1', () => {
    const result = arConfigSchema.safeParse({
      mindFile: '/x.mind',
      targets: [
        {
          id: 'p',
          targetIndex: -1,
          overlays: [{ kind: 'image', src: '/o.png', width: 1, height: 1 }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects width: 0 on an image overlay', () => {
    const result = arConfigSchema.safeParse({
      mindFile: '/x.mind',
      targets: [
        {
          id: 'p',
          targetIndex: 0,
          overlays: [{ kind: 'image', src: '/o.png', width: 0, height: 1 }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects height: -1 on a video overlay', () => {
    const result = arConfigSchema.safeParse({
      mindFile: '/x.mind',
      targets: [
        {
          id: 'p',
          targetIndex: 0,
          overlays: [{ kind: 'video', src: '/v.mp4', width: 1, height: -1 }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects volume: 1.5 on an audio overlay', () => {
    const result = arConfigSchema.safeParse({
      mindFile: '/x.mind',
      targets: [
        {
          id: 'p',
          targetIndex: 0,
          overlays: [{ kind: 'audio', src: '/a.mp3', volume: 1.5 }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown overlay kind via the discriminated union', () => {
    const result = arConfigSchema.safeParse({
      mindFile: '/x.mind',
      targets: [
        {
          id: 'p',
          targetIndex: 0,
          overlays: [{ kind: 'mesh', src: '/m.glb' }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty mindFile string', () => {
    const result = arConfigSchema.safeParse({
      mindFile: '',
      targets: [
        {
          id: 'p',
          targetIndex: 0,
          overlays: [{ kind: 'image', src: '/o.png', width: 1, height: 1 }],
        },
      ],
    });
    expect(result.success).toBe(false);
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
