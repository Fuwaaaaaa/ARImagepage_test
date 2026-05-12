'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { ARTarget } from '@/config/ar';
import { arLog } from '@/lib/ar/debug';
import type { ARSimMode } from '@/lib/ar/simulation';

export type UseSimulationOptions = {
  containerRef: RefObject<HTMLElement | null>;
  targets: ARTarget[];
  simMode: ARSimMode;
  /**
   * Whether the scene container has actually mounted `<a-entity>` nodes for
   * the configured targets — in `<ARScene>` this matches `sceneActive`.
   */
  sceneReady: boolean;
};

export type UseSimulationResult = {
  /**
   * Fire `targetFound` on a single target. Safe to call any number of times;
   * MindAR's real listeners would only react once per detection but our
   * media-control hook is idempotent under repeated dispatches (it just
   * re-plays).
   */
  fireFound: (targetId: string) => void;
  /**
   * Fire `targetLost` on a single target.
   */
  fireLost: (targetId: string) => void;
  /**
   * Fire `targetFound` on every configured target.
   */
  fireAllFound: () => void;
  /**
   * Fire `targetLost` on every configured target.
   */
  fireAllLost: () => void;
};

function dispatch(
  container: HTMLElement | null,
  targetId: string,
  eventName: 'targetFound' | 'targetLost',
): void {
  if (!container) return;
  const entity = container.querySelector(
    `a-entity[data-target-id="${cssEscape(targetId)}"]`,
  );
  if (!entity) {
    arLog('ar:sim-target-missing', { targetId, eventName });
    return;
  }
  arLog(`ar:sim-${eventName}`, { targetId });
  entity.dispatchEvent(new CustomEvent(eventName, { bubbles: true }));
}

/**
 * Drives `targetFound` / `targetLost` events on `<a-entity>` nodes by hand
 * so the rest of the AR pipeline (`useTargetMediaControl`, visual stage)
 * can be exercised without a real camera or marker detection.
 *
 * The auto-fire side effect (from `simMode.initiallyFound`) waits until
 * `sceneReady === true` so the entities exist in the DOM by the time we
 * dispatch. If `simMode.foundDelayMs > 0` the dispatch is queued via
 * `setTimeout`.
 */
export function useSimulation({
  containerRef,
  targets,
  simMode,
  sceneReady,
}: UseSimulationOptions): UseSimulationResult {
  const targetsRef = useRef(targets);
  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);

  const fireFound = useCallback(
    (targetId: string) => {
      dispatch(containerRef.current, targetId, 'targetFound');
    },
    [containerRef],
  );

  const fireLost = useCallback(
    (targetId: string) => {
      dispatch(containerRef.current, targetId, 'targetLost');
    },
    [containerRef],
  );

  const fireAllFound = useCallback(() => {
    const container = containerRef.current;
    for (const t of targetsRef.current) {
      dispatch(container, t.id, 'targetFound');
    }
  }, [containerRef]);

  const fireAllLost = useCallback(() => {
    const container = containerRef.current;
    for (const t of targetsRef.current) {
      dispatch(container, t.id, 'targetLost');
    }
  }, [containerRef]);

  useEffect(() => {
    if (!simMode.enabled) return;
    if (!sceneReady) return;
    if (simMode.initiallyFound.length === 0) return;

    const container = containerRef.current;
    const ids = simMode.initiallyFound;

    if (simMode.foundDelayMs > 0) {
      const id = window.setTimeout(() => {
        for (const targetId of ids) {
          dispatch(container, targetId, 'targetFound');
        }
      }, simMode.foundDelayMs);
      return () => window.clearTimeout(id);
    }

    for (const targetId of ids) {
      dispatch(container, targetId, 'targetFound');
    }
    return undefined;
  }, [
    containerRef,
    simMode.enabled,
    simMode.foundDelayMs,
    simMode.initiallyFound,
    sceneReady,
  ]);

  return { fireFound, fireLost, fireAllFound, fireAllLost };
}

/**
 * Mirror of the helper in `useTargetMediaControl` — kept private here so the
 * two hooks stay decoupled. Custom target ids may contain CSS-special
 * characters; `CSS.escape` is the only safe way to embed them in an attribute
 * selector.
 */
function cssEscape(value: string): string {
  if (typeof CSS === 'undefined' || typeof CSS.escape !== 'function') {
    throw new Error(
      'CSS.escape is required to resolve AR target ids. Update the runtime.',
    );
  }
  return CSS.escape(value);
}
