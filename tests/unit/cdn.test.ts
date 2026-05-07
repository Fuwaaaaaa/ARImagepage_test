import { describe, expect, it } from 'vitest';
import {
  AFRAME_SRC,
  AFRAME_VERSION,
  MINDAR_SRC,
  MINDAR_VERSION,
} from '@/lib/ar/cdn';

describe('lib/ar/cdn', () => {
  it('embeds the A-Frame version into the CDN URL', () => {
    expect(AFRAME_SRC).toContain(AFRAME_VERSION);
    expect(AFRAME_SRC.startsWith('https://')).toBe(true);
  });

  it('embeds the MindAR version into the CDN URL', () => {
    expect(MINDAR_SRC).toContain(MINDAR_VERSION);
    expect(MINDAR_SRC.startsWith('https://')).toBe(true);
  });
});
