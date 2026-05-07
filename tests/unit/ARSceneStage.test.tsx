import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ARSceneStage } from '@/components/ar/ARSceneStage';
import { defaultARConfig, type ARConfig } from '@/config/ar';
import { multiARConfig } from '@/config/ar.example-multi';

describe('ARSceneStage', () => {
  it('renders an a-scene with the configured mind file', () => {
    const { container } = render(<ARSceneStage config={defaultARConfig} />);
    const scene = container.querySelector('a-scene');
    expect(scene).not.toBeNull();
    expect(scene?.getAttribute('mindar-image')).toContain('imageTargetSrc: /targets.mind');
  });

  it('renders one a-entity per target with the right targetIndex and an image overlay', () => {
    const { container } = render(<ARSceneStage config={defaultARConfig} />);
    const entities = container.querySelectorAll('a-entity[mindar-image-target]');
    expect(entities).toHaveLength(defaultARConfig.targets.length);

    const entity = entities[0];
    expect(entity.getAttribute('mindar-image-target')).toBe('targetIndex: 0');
    expect(entity.getAttribute('data-target-id')).toBe('primary');
    const image = entity.querySelector('a-image');
    expect(image?.getAttribute('src')).toBe('/overlay.png');
  });

  it('does not render a-assets when there are no media overlays', () => {
    const { container } = render(<ARSceneStage config={defaultARConfig} />);
    const assets = container.querySelector('a-assets');
    expect(assets).toBeNull();
  });

  it('renders a video overlay as <video> in <a-assets> + <a-video> referencing it', () => {
    const config: ARConfig = {
      mindFile: '/targets.mind',
      targets: [
        {
          id: 'primary',
          targetIndex: 0,
          overlays: [
            {
              kind: 'video',
              src: '/v.mp4',
              width: 1,
              height: 0.5,
              loop: true,
              muted: true,
              preload: 'auto',
            },
          ],
        },
      ],
    };
    const { container } = render(<ARSceneStage config={config} />);

    const assets = container.querySelector('a-assets');
    expect(assets).not.toBeNull();
    const video = assets?.querySelector('video');
    expect(video).not.toBeNull();
    expect(video?.getAttribute('id')).toBe('ar-asset-primary-0');
    expect(video?.getAttribute('src')).toBe('/v.mp4');
    expect(video?.hasAttribute('playsinline')).toBe(true);

    const aVideo = container.querySelector('a-video');
    expect(aVideo?.getAttribute('src')).toBe('#ar-asset-primary-0');
  });

  it('renders an audio overlay as <audio> in <a-assets> only (no <a-sound>)', () => {
    const config: ARConfig = {
      mindFile: '/targets.mind',
      targets: [
        {
          id: 'primary',
          targetIndex: 0,
          overlays: [
            {
              kind: 'audio',
              src: '/a.mp3',
              loop: true,
              volume: 0.5,
            },
          ],
        },
      ],
    };
    const { container } = render(<ARSceneStage config={config} />);

    const audio = container.querySelector('a-assets audio');
    expect(audio).not.toBeNull();
    expect(audio?.getAttribute('id')).toBe('ar-asset-primary-0');
    expect(audio?.getAttribute('src')).toBe('/a.mp3');

    const aSound = container.querySelector('a-sound');
    expect(aSound).toBeNull();
  });

  it('renders multiple targets with mixed kinds from the example config', () => {
    const { container } = render(<ARSceneStage config={multiARConfig} />);
    const entities = container.querySelectorAll('a-entity[mindar-image-target]');
    expect(entities).toHaveLength(2);

    expect(container.querySelector('a-video')).not.toBeNull();
    expect(container.querySelector('a-image')).not.toBeNull();
    expect(container.querySelector('a-assets audio')).not.toBeNull();
  });
});
