import { renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import { useTargetMediaControl } from '@/components/ar/useTargetMediaControl';
import type { ARConfig } from '@/config/ar';

type MediaSetup = {
  container: HTMLDivElement;
  containerRef: { current: HTMLElement | null };
  entity: Element;
  video: HTMLVideoElement;
  playSpy: MockInstance<typeof HTMLMediaElement.prototype.play>;
  pauseSpy: MockInstance<typeof HTMLMediaElement.prototype.pause>;
};

function setupDom(targetId: string, assetId: string): MediaSetup {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const entity = document.createElement('a-entity');
  entity.setAttribute('data-target-id', targetId);
  container.appendChild(entity);

  const video = document.createElement('video');
  video.id = assetId;
  document.body.appendChild(video);

  // Use vi.spyOn so vi.restoreAllMocks() in afterEach restores the original
  // HTMLMediaElement.prototype methods — preventing leakage to other tests.
  const playSpy = vi
    .spyOn(HTMLMediaElement.prototype, 'play')
    .mockImplementation(() => Promise.resolve());
  const pauseSpy = vi
    .spyOn(HTMLMediaElement.prototype, 'pause')
    .mockImplementation(() => undefined);

  return {
    container,
    containerRef: { current: container },
    entity,
    video,
    playSpy,
    pauseSpy,
  };
}

function videoConfig(targetId = 'primary', onLost: 'pause' | 'reset' | 'continue' = 'pause'): ARConfig {
  return {
    mindFile: '/targets.mind',
    targets: [
      {
        id: targetId,
        targetIndex: 0,
        overlays: [
          {
            kind: 'video',
            src: '/v.mp4',
            width: 1,
            height: 1,
            onLost,
          },
        ],
      },
    ],
  };
}

describe('useTargetMediaControl', () => {
  let setup: MediaSetup;

  beforeEach(() => {
    setup = setupDom('primary', 'ar-asset-primary-0');
  });

  afterEach(() => {
    setup.container.remove();
    setup.video.remove();
    document.body.querySelectorAll('video, audio').forEach((el) => el.remove());
    vi.restoreAllMocks();
  });

  it('does nothing when disabled', () => {
    renderHook(() =>
      useTargetMediaControl({
        containerRef: setup.containerRef,
        config: videoConfig(),
        enabled: false,
      }),
    );

    setup.entity.dispatchEvent(new Event('targetFound'));
    expect(setup.playSpy).not.toHaveBeenCalled();
  });

  it('plays the matching media on targetFound', () => {
    renderHook(() =>
      useTargetMediaControl({
        containerRef: setup.containerRef,
        config: videoConfig(),
        enabled: true,
      }),
    );

    setup.entity.dispatchEvent(new Event('targetFound'));
    expect(setup.playSpy).toHaveBeenCalledTimes(1);
  });

  it('pauses the media on targetLost (default behavior)', () => {
    renderHook(() =>
      useTargetMediaControl({
        containerRef: setup.containerRef,
        config: videoConfig('primary', 'pause'),
        enabled: true,
      }),
    );

    setup.entity.dispatchEvent(new Event('targetFound'));
    setup.entity.dispatchEvent(new Event('targetLost'));
    expect(setup.pauseSpy).toHaveBeenCalledTimes(1);
  });

  it('resets currentTime when onLost is "reset"', () => {
    renderHook(() =>
      useTargetMediaControl({
        containerRef: setup.containerRef,
        config: videoConfig('primary', 'reset'),
        enabled: true,
      }),
    );

    setup.video.currentTime = 10;
    setup.entity.dispatchEvent(new Event('targetFound'));
    setup.entity.dispatchEvent(new Event('targetLost'));
    expect(setup.pauseSpy).toHaveBeenCalled();
    expect(setup.video.currentTime).toBe(0);
  });

  it('keeps playing when onLost is "continue"', () => {
    renderHook(() =>
      useTargetMediaControl({
        containerRef: setup.containerRef,
        config: videoConfig('primary', 'continue'),
        enabled: true,
      }),
    );

    setup.entity.dispatchEvent(new Event('targetFound'));
    setup.entity.dispatchEvent(new Event('targetLost'));
    // Cleanup pauses on unmount, but no pause from onLost
    expect(setup.pauseSpy).not.toHaveBeenCalled();
  });

  it('applies the muted flag to media elements', () => {
    const stableConfig = videoConfig();
    const { rerender } = renderHook(
      ({ muted }: { muted: boolean }) =>
        useTargetMediaControl({
          containerRef: setup.containerRef,
          config: stableConfig,
          enabled: true,
          muted,
        }),
      { initialProps: { muted: true } },
    );

    expect(setup.video.muted).toBe(true);

    rerender({ muted: false });
    expect(setup.video.muted).toBe(false);
  });

  it('syncs el.muted with the latest mutedRef when targetFound fires', () => {
    const stableConfig = videoConfig();
    const { rerender } = renderHook(
      ({ muted }: { muted: boolean }) =>
        useTargetMediaControl({
          containerRef: setup.containerRef,
          config: stableConfig,
          enabled: true,
          muted,
        }),
      { initialProps: { muted: true } },
    );

    // Flip muted to false; mutedRef should pick this up immediately on render.
    rerender({ muted: false });
    setup.entity.dispatchEvent(new Event('targetFound'));
    expect(setup.video.muted).toBe(false);
  });

  it('replays media for currently-found targets when un-muting', () => {
    const stableConfig = videoConfig();
    const { rerender } = renderHook(
      ({ muted }: { muted: boolean }) =>
        useTargetMediaControl({
          containerRef: setup.containerRef,
          config: stableConfig,
          enabled: true,
          muted,
        }),
      { initialProps: { muted: true } },
    );

    setup.entity.dispatchEvent(new Event('targetFound'));
    expect(setup.playSpy).toHaveBeenCalledTimes(1);

    rerender({ muted: false });
    // Un-muting should re-issue play() because the target is still found
    expect(setup.playSpy).toHaveBeenCalledTimes(2);
  });

  it('catches play() rejections silently', () => {
    setup.playSpy.mockImplementation(() =>
      Promise.reject(new DOMException('blocked', 'NotAllowedError')),
    );

    expect(() => {
      renderHook(() =>
        useTargetMediaControl({
          containerRef: setup.containerRef,
          config: videoConfig(),
          enabled: true,
        }),
      );
      setup.entity.dispatchEvent(new Event('targetFound'));
    }).not.toThrow();
  });

  it('caches media-element lookups: getElementById is not called per event', () => {
    const getByIdSpy = vi.spyOn(document, 'getElementById');
    renderHook(() =>
      useTargetMediaControl({
        containerRef: setup.containerRef,
        config: videoConfig(),
        enabled: true,
      }),
    );

    const callsAfterSetup = getByIdSpy.mock.calls.length;
    expect(callsAfterSetup).toBeGreaterThan(0);

    setup.entity.dispatchEvent(new Event('targetFound'));
    setup.entity.dispatchEvent(new Event('targetLost'));
    setup.entity.dispatchEvent(new Event('targetFound'));
    setup.entity.dispatchEvent(new Event('targetLost'));

    // No new getElementById calls during event dispatch — the Map cache built
    // at setup time services every lookup.
    expect(getByIdSpy.mock.calls.length).toBe(callsAfterSetup);
  });

  it('applies the configured volume to audio overlays on mount', () => {
    const audio = document.createElement('audio');
    audio.id = 'ar-asset-primary-0';
    document.body.appendChild(audio);

    const config: ARConfig = {
      mindFile: '/targets.mind',
      targets: [
        {
          id: 'primary',
          targetIndex: 0,
          overlays: [{ kind: 'audio', src: '/a.mp3', volume: 0.42 }],
        },
      ],
    };

    // Replace the previous video so getElementById returns the audio element
    setup.video.remove();

    renderHook(() =>
      useTargetMediaControl({
        containerRef: setup.containerRef,
        config,
        enabled: true,
      }),
    );

    expect(audio.volume).toBeCloseTo(0.42, 5);
    audio.remove();
  });
});
