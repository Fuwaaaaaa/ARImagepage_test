/**
 * Module-init-once debug switch for the AR pipeline.
 *
 * The flag is read **once** at module load and frozen into a top-level
 * `const`. This lets the JS engine inline the early-return in `arLog`
 * (and lets Next.js' build-time inlining of `process.env.NEXT_PUBLIC_*`
 * tree-shake the implementation entirely in production browser bundles
 * when the env var is unset).
 *
 * Enable via `NEXT_PUBLIC_AR_DEBUG=1` in `.env.local` or shell:
 *
 *     NEXT_PUBLIC_AR_DEBUG=1 pnpm dev:https
 *
 * In Vitest, mutate the module by combining `vi.stubEnv(...)` +
 * `vi.resetModules()` + a dynamic `await import(...)`.
 */

const AR_DEBUG_ENABLED: boolean = process.env.NEXT_PUBLIC_AR_DEBUG === '1';

export function arDebugEnabled(): boolean {
  return AR_DEBUG_ENABLED;
}

export function arLog(...args: unknown[]): void {
  if (!AR_DEBUG_ENABLED) return;
  console.debug('[ar]', ...args);
}
