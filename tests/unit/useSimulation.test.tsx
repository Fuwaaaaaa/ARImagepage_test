import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSimulation } from '@/components/ar/useSimulation';
import { DISABLED_SIM_MODE, parseSimMode } from '@/lib/ar/simulation';
import type { ARTarget } from '@/config/ar';

type SimSetup = {
  container: HTMLDivElement;
  containerRef: { current: HTMLElement | null };
  entity: Element;
  events: { type: string; targetId: string }[];
};

function setupDom(targetIds: string[]): SimSetup {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const events: { type: string; targetId: string }[] = [];
  let firstEntity: Element | null = null;

  for (const id of targetIds) {
    const entity = document.createElement('a-entity');
    entity.setAttribute('data-target-id', id);
    container.appendChild(entity);
    if (!firstEntity) firstEntity = entity;
    entity.addEventListener('targetFound', () =>
      events.push({ type: 'targetFound', targetId: id }),
    );
    entity.addEventListener('targetLost', () =>
      events.push({ type: 'targetLost', targetId: id }),
    );
  }

  return {
    container,
    containerRef: { current: container },
    entity: firstEntity!,
    events,
  };
}

function makeTargets(ids: string[]): ARTarget[] {
  return ids.map((id, index) => ({
    id,
    targetIndex: index,
    overlays: [{ kind: 'image' as const, src: '/x.png', width: 1, height: 1 }],
  }));
}

describe('useSimulation', () => {
  let setup: SimSetup;

  beforeEach(() => {
    setup = setupDom(['primary', 'secondary']);
  });

  afterEach(() => {
    setup.container.remove();
    vi.restoreAllMocks();
  });

  it('does nothing when sim is disabled', () => {
    renderHook(() =>
      useSimulation({
        containerRef: setup.containerRef,
        targets: makeTargets(['primary']),
        simMode: DISABLED_SIM_MODE,
        sceneReady: true,
      }),
    );

    expect(setup.events).toEqual([]);
  });

  it('fires targetFound on initiallyFound targets once the scene is ready', () => {
    renderHook(() =>
      useSimulation({
        containerRef: setup.containerRef,
        targets: makeTargets(['primary', 'secondary']),
        simMode: parseSimMode('?sim=1&found=primary'),
        sceneReady: true,
      }),
    );

    expect(setup.events).toEqual([
      { type: 'targetFound', targetId: 'primary' },
    ]);
  });

  it('waits for sceneReady before auto-firing', () => {
    const { rerender } = renderHook(
      ({ ready }: { ready: boolean }) =>
        useSimulation({
          containerRef: setup.containerRef,
          targets: makeTargets(['primary']),
          simMode: parseSimMode('?sim=1&found=primary'),
          sceneReady: ready,
        }),
      { initialProps: { ready: false } },
    );

    expect(setup.events).toEqual([]);

    rerender({ ready: true });

    expect(setup.events).toEqual([
      { type: 'targetFound', targetId: 'primary' },
    ]);
  });

  it('fires multiple comma-separated initiallyFound targets in order', () => {
    renderHook(() =>
      useSimulation({
        containerRef: setup.containerRef,
        targets: makeTargets(['primary', 'secondary']),
        simMode: parseSimMode('?sim=1&found=primary,secondary'),
        sceneReady: true,
      }),
    );

    expect(setup.events).toEqual([
      { type: 'targetFound', targetId: 'primary' },
      { type: 'targetFound', targetId: 'secondary' },
    ]);
  });

  it('respects foundDelayMs and only fires after the delay', () => {
    vi.useFakeTimers();
    renderHook(() =>
      useSimulation({
        containerRef: setup.containerRef,
        targets: makeTargets(['primary']),
        simMode: parseSimMode('?sim=1&found=primary&delay=500'),
        sceneReady: true,
      }),
    );

    expect(setup.events).toEqual([]);
    vi.advanceTimersByTime(499);
    expect(setup.events).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(setup.events).toEqual([
      { type: 'targetFound', targetId: 'primary' },
    ]);
    vi.useRealTimers();
  });

  it('exposes fireFound/fireLost manual triggers', () => {
    const { result } = renderHook(() =>
      useSimulation({
        containerRef: setup.containerRef,
        targets: makeTargets(['primary', 'secondary']),
        simMode: parseSimMode('?sim=1'),
        sceneReady: true,
      }),
    );

    act(() => result.current.fireFound('secondary'));
    act(() => result.current.fireLost('secondary'));

    expect(setup.events).toEqual([
      { type: 'targetFound', targetId: 'secondary' },
      { type: 'targetLost', targetId: 'secondary' },
    ]);
  });

  it('fires all targets via fireAllFound and fireAllLost', () => {
    const { result } = renderHook(() =>
      useSimulation({
        containerRef: setup.containerRef,
        targets: makeTargets(['primary', 'secondary']),
        simMode: parseSimMode('?sim=1'),
        sceneReady: true,
      }),
    );

    act(() => result.current.fireAllFound());
    act(() => result.current.fireAllLost());

    expect(setup.events.map((e) => `${e.type}:${e.targetId}`)).toEqual([
      'targetFound:primary',
      'targetFound:secondary',
      'targetLost:primary',
      'targetLost:secondary',
    ]);
  });

  it('silently ignores fires for unknown target ids', () => {
    const { result } = renderHook(() =>
      useSimulation({
        containerRef: setup.containerRef,
        targets: makeTargets(['primary']),
        simMode: parseSimMode('?sim=1'),
        sceneReady: true,
      }),
    );

    act(() => result.current.fireFound('does-not-exist'));
    expect(setup.events).toEqual([]);
  });

  it('escapes CSS-special target ids when querying entities', () => {
    const local = setupDom(['weird.id:1']);

    const { result } = renderHook(() =>
      useSimulation({
        containerRef: local.containerRef,
        targets: makeTargets(['weird.id:1']),
        simMode: parseSimMode('?sim=1'),
        sceneReady: true,
      }),
    );

    act(() => result.current.fireFound('weird.id:1'));

    expect(local.events).toEqual([
      { type: 'targetFound', targetId: 'weird.id:1' },
    ]);

    local.container.remove();
  });
});
