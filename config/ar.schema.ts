import { z } from 'zod';

/**
 * Single source of truth for the AR overlay configuration shape.
 *
 * Types are derived from these schemas via `z.infer` and re-exported from
 * `./ar.ts` so existing imports keep working unchanged.
 *
 * `<ARScene>` runs `arConfigSchema.safeParse(config)` at mount and refuses to
 * boot the AR pipeline (camera permission, A-Frame / MindAR scripts, media
 * controllers) when validation fails — surfacing a structured error panel
 * instead of the silent "marker is found but nothing renders" failure mode
 * that hand-written types could not catch at runtime.
 */

export const onLostBehaviorSchema = z.enum(['pause', 'reset', 'continue']);
export const arMediaCrossOriginSchema = z.enum(['anonymous', 'use-credentials']);
export const arVideoPreloadSchema = z.enum(['auto', 'metadata', 'none']);

const spatialFields = {
  position: z.string().optional(),
  rotation: z.string().optional(),
};

const sizedFields = {
  ...spatialFields,
  width: z.number().positive(),
  height: z.number().positive(),
};

export const arImageOverlaySchema = z.object({
  kind: z.literal('image'),
  src: z.string().min(1),
  ...sizedFields,
});

export const arVideoOverlaySchema = z.object({
  kind: z.literal('video'),
  src: z.string().min(1),
  ...sizedFields,
  loop: z.boolean().optional(),
  muted: z.boolean().optional(),
  crossOrigin: arMediaCrossOriginSchema.optional(),
  preload: arVideoPreloadSchema.optional(),
  onLost: onLostBehaviorSchema.optional(),
});

export const arAudioOverlaySchema = z.object({
  kind: z.literal('audio'),
  src: z.string().min(1),
  loop: z.boolean().optional(),
  volume: z.number().min(0).max(1).optional(),
  crossOrigin: arMediaCrossOriginSchema.optional(),
  onLost: onLostBehaviorSchema.optional(),
});

export const arOverlaySchema = z.discriminatedUnion('kind', [
  arImageOverlaySchema,
  arVideoOverlaySchema,
  arAudioOverlaySchema,
]);

export const arTargetSchema = z.object({
  id: z.string().min(1),
  targetIndex: z.number().int().nonnegative(),
  overlays: z.array(arOverlaySchema).min(1),
});

export const arConfigSchema = z.object({
  mindFile: z.string().min(1),
  targets: z.array(arTargetSchema).min(1),
});
