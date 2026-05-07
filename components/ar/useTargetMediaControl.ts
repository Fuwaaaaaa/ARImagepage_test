'use client';

import { useEffect, useRef, type RefObject } from 'react';
import type { ARConfig, ARTarget, OnLostBehavior } from '@/config/ar';
import { collectMediaAssets } from '@/lib/ar/overlay';

type MediaSpec = {
  assetId: string;
  targetId: string;
  kind: 'video' | 'audio';
  onLost: OnLostBehavior;
  volume?: number;
};

/**
 * Derive flat play-control specs from the same overlay traversal that
 * `<ARSceneStage>` uses for `<a-assets>` — single source of truth lives in
 * `lib/ar/overlay.ts` so adding a new media kind only requires one edit.
 */
function collectMediaSpecs(targets: ARTarget[]): MediaSpec[] {
  const { videos, audios } = collectMediaAssets(targets);
  const specs: MediaSpec[] = [];
  for (const v of videos) {
    specs.push({
      assetId: v.assetId,
      targetId: v.targetId,
      kind: 'video',
      onLost: v.overlay.onLost ?? 'pause',
    });
  }
  for (const a of audios) {
    specs.push({
      assetId: a.assetId,
      targetId: a.targetId,
      kind: 'audio',
      onLost: a.overlay.onLost ?? 'pause',
      volume: a.overlay.volume,
    });
  }
  return specs;
}

function getMediaElement(assetId: string): HTMLMediaElement | null {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById(assetId);
  return el instanceof HTMLMediaElement ? el : null;
}

function safePlay(el: HTMLMediaElement) {
  try {
    const p = el.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => undefined);
    }
  } catch {
    /* noop — non-Promise play() in old browsers */
  }
}

export type UseTargetMediaControlOptions = {
  containerRef: RefObject<HTMLElement | null>;
  config: ARConfig;
  enabled: boolean;
  muted?: boolean;
};

/**
 * Subscribes to per-target `targetFound`/`targetLost` events emitted by
 * MindAR-image entities and drives the matching `<video>` / `<audio>` media
 * elements (declared inside `<a-assets>`) accordingly.
 *
 * - `targetFound`: play() the media (errors silently caught — autoplay block).
 * - `targetLost`:  honors `onLost` (pause / reset / continue).
 * - `muted` toggle: synchronizes `el.muted` and resumes media for any target
 *    that is currently in the "found" state when un-muting.
 */
export function useTargetMediaControl({
  containerRef,
  config,
  enabled,
  muted = true,
}: UseTargetMediaControlOptions) {
  const foundTargetIdsRef = useRef<Set<string>>(new Set());
  const mutedRef = useRef<boolean>(muted);

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    const specs = collectMediaSpecs(config.targets);
    if (specs.length === 0) return;

    for (const spec of specs) {
      const el = getMediaElement(spec.assetId);
      if (!el) continue;
      if (typeof spec.volume === 'number') {
        el.volume = Math.max(0, Math.min(1, spec.volume));
      }
    }

    const byTargetId = new Map<string, MediaSpec[]>();
    for (const spec of specs) {
      const arr = byTargetId.get(spec.targetId) ?? [];
      arr.push(spec);
      byTargetId.set(spec.targetId, arr);
    }

    const cleanups: Array<() => void> = [];

    for (const [targetId, targetSpecs] of byTargetId.entries()) {
      const entity = container.querySelector(
        `a-entity[data-target-id="${cssEscape(targetId)}"]`,
      );
      if (!entity) continue;

      const onFound = () => {
        foundTargetIdsRef.current.add(targetId);
        for (const spec of targetSpecs) {
          const el = getMediaElement(spec.assetId);
          if (!el) continue;
          el.muted = mutedRef.current;
          safePlay(el);
        }
      };

      const onLost = () => {
        foundTargetIdsRef.current.delete(targetId);
        for (const spec of targetSpecs) {
          const el = getMediaElement(spec.assetId);
          if (!el) continue;
          if (spec.onLost === 'continue') continue;
          el.pause();
          if (spec.onLost === 'reset') {
            try {
              el.currentTime = 0;
            } catch {
              /* noop */
            }
          }
        }
      };

      entity.addEventListener('targetFound', onFound);
      entity.addEventListener('targetLost', onLost);
      cleanups.push(() => {
        entity.removeEventListener('targetFound', onFound);
        entity.removeEventListener('targetLost', onLost);
      });
    }

    const foundTargetIds = foundTargetIdsRef.current;
    return () => {
      for (const fn of cleanups) fn();
      for (const spec of specs) {
        const el = getMediaElement(spec.assetId);
        if (el) el.pause();
      }
      foundTargetIds.clear();
    };
  }, [containerRef, config, enabled]);

  useEffect(() => {
    // Keep the latest muted value reachable from event handlers without
    // re-attaching listeners every time the toggle flips.
    mutedRef.current = muted;

    if (!enabled) return;
    const specs = collectMediaSpecs(config.targets);
    if (specs.length === 0) return;

    for (const spec of specs) {
      const el = getMediaElement(spec.assetId);
      if (!el) continue;
      el.muted = muted;
    }

    if (!muted) {
      for (const spec of specs) {
        if (!foundTargetIdsRef.current.has(spec.targetId)) continue;
        const el = getMediaElement(spec.assetId);
        if (!el) continue;
        safePlay(el);
      }
    }
  }, [muted, enabled, config]);
}

/**
 * `targetId` is interpolated into a `[data-target-id="…"]` attribute selector.
 * `CSS.escape` is the only safe way to handle ids that may contain CSS-special
 * characters (`.`, `#`, `[`, `]`, `:`, parentheses, quotes, …). Modern browsers
 * and jsdom ≥ 20 ship it; the project targets those, so we treat it as a hard
 * requirement instead of carrying a half-correct fallback that would silently
 * break for ids like `"target.v2"`.
 */
function cssEscape(value: string): string {
  if (typeof CSS === 'undefined' || typeof CSS.escape !== 'function') {
    throw new Error(
      'CSS.escape is required to resolve AR target ids. Update the runtime.',
    );
  }
  return CSS.escape(value);
}
