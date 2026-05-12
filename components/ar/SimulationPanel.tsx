'use client';

import type { ARTarget } from '@/config/ar';

export type SimulationPanelProps = {
  targets: ARTarget[];
  onFireFound: (targetId: string) => void;
  onFireLost: (targetId: string) => void;
  onFireAllFound: () => void;
  onFireAllLost: () => void;
};

/**
 * Floating debug panel rendered on the left side of the AR view while sim
 * mode is active. Each configured target gets a Found / Lost button so the
 * reviewer can drive the overlay pipeline manually without a camera or
 * marker. The "All" row fires every target at once.
 *
 * Intentionally minimal styling: this is a developer tool, not part of the
 * production design system. `data-testid` attributes are wired so Playwright
 * specs can drive the same buttons.
 */
export function SimulationPanel({
  targets,
  onFireFound,
  onFireLost,
  onFireAllFound,
  onFireAllLost,
}: SimulationPanelProps) {
  return (
    <aside
      data-testid="sim-panel"
      aria-label="AR simulation controls"
      className="fixed left-4 top-20 z-50 max-w-xs space-y-2 rounded-xl border border-amber-500/60 bg-black/70 p-3 text-xs text-amber-100 shadow-xl backdrop-blur"
    >
      <header className="flex items-center justify-between gap-2 text-amber-300">
        <span className="font-semibold tracking-wide">SIM MODE</span>
        <span className="text-[10px] uppercase tracking-widest text-amber-300/70">
          dev only
        </span>
      </header>

      <div className="space-y-1.5">
        {targets.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 rounded-md bg-black/40 px-2 py-1.5"
          >
            <code className="flex-1 truncate text-amber-200">{t.id}</code>
            <button
              type="button"
              data-testid={`sim-found-${t.id}`}
              onClick={() => onFireFound(t.id)}
              className="rounded bg-emerald-500/80 px-2 py-1 font-medium text-white transition hover:bg-emerald-400"
            >
              found
            </button>
            <button
              type="button"
              data-testid={`sim-lost-${t.id}`}
              onClick={() => onFireLost(t.id)}
              className="rounded bg-rose-500/80 px-2 py-1 font-medium text-white transition hover:bg-rose-400"
            >
              lost
            </button>
          </div>
        ))}
      </div>

      {targets.length > 1 && (
        <div className="flex items-center gap-2 border-t border-amber-500/30 pt-2">
          <span className="flex-1 text-amber-300/70">all</span>
          <button
            type="button"
            data-testid="sim-found-all"
            onClick={onFireAllFound}
            className="rounded bg-emerald-500/80 px-2 py-1 font-medium text-white transition hover:bg-emerald-400"
          >
            found
          </button>
          <button
            type="button"
            data-testid="sim-lost-all"
            onClick={onFireAllLost}
            className="rounded bg-rose-500/80 px-2 py-1 font-medium text-white transition hover:bg-rose-400"
          >
            lost
          </button>
        </div>
      )}
    </aside>
  );
}
