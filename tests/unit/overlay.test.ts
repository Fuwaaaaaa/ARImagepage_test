import { describe, expect, it } from 'vitest';
import {
  collectMediaAssets,
  hasMediaOverlay,
  overlayAssetId,
} from '@/lib/ar/overlay';
import type { ARTarget } from '@/config/ar';

describe('overlayAssetId', () => {
  it('produces stable ids from target id and overlay index', () => {
    expect(overlayAssetId('primary', 0)).toBe('ar-asset-primary-0');
    expect(overlayAssetId('primary', 1)).toBe('ar-asset-primary-1');
    expect(overlayAssetId('secondary', 2)).toBe('ar-asset-secondary-2');
  });
});

describe('collectMediaAssets', () => {
  it('returns empty arrays when only image overlays are present', () => {
    const targets: ARTarget[] = [
      {
        id: 'primary',
        targetIndex: 0,
        overlays: [
          { kind: 'image', src: '/a.png', width: 1, height: 1 },
        ],
      },
    ];
    const { videos, audios } = collectMediaAssets(targets);
    expect(videos).toHaveLength(0);
    expect(audios).toHaveLength(0);
  });

  it('separates video and audio overlays and assigns deterministic ids', () => {
    const targets: ARTarget[] = [
      {
        id: 'a',
        targetIndex: 0,
        overlays: [
          { kind: 'image', src: '/img.png', width: 1, height: 1 },
          { kind: 'video', src: '/v.mp4', width: 1, height: 1 },
          { kind: 'audio', src: '/a.mp3' },
        ],
      },
      {
        id: 'b',
        targetIndex: 1,
        overlays: [{ kind: 'audio', src: '/b.mp3' }],
      },
    ];
    const { videos, audios } = collectMediaAssets(targets);

    expect(videos).toHaveLength(1);
    expect(videos[0].assetId).toBe('ar-asset-a-1');
    expect(videos[0].targetId).toBe('a');

    expect(audios).toHaveLength(2);
    expect(audios[0].assetId).toBe('ar-asset-a-2');
    expect(audios[1].assetId).toBe('ar-asset-b-0');
  });
});

describe('hasMediaOverlay', () => {
  it('returns false for image-only configs', () => {
    expect(
      hasMediaOverlay([
        {
          id: 'primary',
          targetIndex: 0,
          overlays: [{ kind: 'image', src: '/a.png', width: 1, height: 1 }],
        },
      ]),
    ).toBe(false);
  });

  it('returns true when at least one video overlay exists', () => {
    expect(
      hasMediaOverlay([
        {
          id: 'p',
          targetIndex: 0,
          overlays: [
            { kind: 'image', src: '/i.png', width: 1, height: 1 },
            { kind: 'video', src: '/v.mp4', width: 1, height: 1 },
          ],
        },
      ]),
    ).toBe(true);
  });

  it('returns true when at least one audio overlay exists', () => {
    expect(
      hasMediaOverlay([
        {
          id: 'p',
          targetIndex: 0,
          overlays: [{ kind: 'audio', src: '/a.mp3' }],
        },
      ]),
    ).toBe(true);
  });
});
