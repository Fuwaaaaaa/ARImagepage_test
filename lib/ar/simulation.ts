/**
 * Simulation mode lets developers and reviewers verify the full overlay
 * pipeline without a real camera, marker, or `targets.mind` file.
 *
 * Activated via URL query params on `/ar`:
 *
 *   ?sim=1                              — bypass camera + script load. Mounts
 *                                         the scene immediately; no targets
 *                                         are auto-found (use the debug
 *                                         panel buttons to fire events).
 *   ?sim=1&found=primary                — also dispatch `targetFound` on the
 *                                         `primary` entity once it mounts.
 *   ?sim=1&found=primary,secondary      — multiple targets.
 *   ?sim=1&found=primary&delay=500      — fire after 500 ms (clamped to
 *                                         [0, 60000]).
 *   ?sim=1&bypass=permission            — only bypass the permission probe;
 *                                         A-Frame + MindAR scripts still
 *                                         load normally.
 *   ?sim=1&bypass=scripts               — only bypass script load; the real
 *                                         permission probe still runs.
 *   ?sim=1&bypass=permission,scripts    — same as `?sim=1` (default both).
 *   ?sim=1&bypass=                      — empty list bypasses nothing.
 *
 * Production-safe: always available, since the only "secret" surface is the
 * debug panel buttons. Production landings without `?sim=1` are unaffected.
 * A one-shot `console.warn` is emitted whenever sim mode is active so it is
 * obvious in deployed environments.
 */

export type ARSimBypass = 'permission' | 'scripts';

export type ARSimMode = {
  enabled: boolean;
  initiallyFound: string[];
  foundDelayMs: number;
  bypassPermission: boolean;
  bypassScripts: boolean;
};

export const DISABLED_SIM_MODE: ARSimMode = Object.freeze({
  enabled: false,
  initiallyFound: [],
  foundDelayMs: 0,
  bypassPermission: false,
  bypassScripts: false,
});

const MAX_DELAY_MS = 60_000;

function toParams(input: string | URLSearchParams): URLSearchParams {
  if (typeof input === 'string') {
    // Tolerate `?foo=bar` and `foo=bar` alike.
    const stripped = input.startsWith('?') ? input.slice(1) : input;
    return new URLSearchParams(stripped);
  }
  return input;
}

function splitCsv(value: string | null): string[] {
  if (value == null) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseNonNegativeInt(value: string | null, fallback: number): number {
  if (value == null) return fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, MAX_DELAY_MS);
}

/**
 * Parse simulation mode from a query string or URLSearchParams.
 *
 * - Returns a frozen-equivalent disabled mode when `sim` is absent or set
 *   to a falsy literal (`0`, `false`, `off`, `no`, empty string).
 * - When enabled, defaults `bypass` to both (`permission` + `scripts`) so the
 *   common case `?sim=1` works without further opt-in.
 * - When `bypass=` (empty) is passed, **no** bypass is applied — the caller
 *   can therefore opt into partial sim explicitly.
 */
export function parseSimMode(input: string | URLSearchParams): ARSimMode {
  const params = toParams(input);
  const simRaw = params.get('sim');
  if (simRaw === null) return { ...DISABLED_SIM_MODE };
  const simNormalized = simRaw.toLowerCase();
  if (
    simNormalized === '0' ||
    simNormalized === 'false' ||
    simNormalized === 'off' ||
    simNormalized === 'no'
  ) {
    return { ...DISABLED_SIM_MODE };
  }

  const initiallyFound = splitCsv(params.get('found'));
  const foundDelayMs = parseNonNegativeInt(params.get('delay'), 0);

  let bypassPermission: boolean;
  let bypassScripts: boolean;
  if (params.has('bypass')) {
    const items = new Set(splitCsv(params.get('bypass')));
    bypassPermission = items.has('permission');
    bypassScripts = items.has('scripts');
  } else {
    bypassPermission = true;
    bypassScripts = true;
  }

  return {
    enabled: true,
    initiallyFound,
    foundDelayMs,
    bypassPermission,
    bypassScripts,
  };
}

/**
 * Read sim mode from the current browser URL. Returns disabled mode when
 * running on the server (no `window`).
 */
export function readSimModeFromLocation(): ARSimMode {
  if (typeof window === 'undefined') return { ...DISABLED_SIM_MODE };
  return parseSimMode(window.location.search);
}

let warnedActive = false;

/**
 * One-shot console warning so that an `?sim=1` URL deployed to production is
 * visible in the dev-tools console. Safe to call on every render — it only
 * emits once per page load.
 */
export function warnSimActiveOnce(mode: ARSimMode): void {
  if (!mode.enabled) return;
  if (warnedActive) return;
  warnedActive = true;
  if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn(
      '[ar] simulation mode active — camera and AR scripts may be bypassed',
      mode,
    );
  }
}

/**
 * Test-only: reset the one-shot warn latch. Not exported via the package
 * boundary in production builds; kept here because tree-shaking handles it.
 */
export function __resetSimWarnedForTests(): void {
  warnedActive = false;
}
