import type { z } from 'zod';
import {
  arAudioOverlaySchema,
  arConfigSchema,
  arImageOverlaySchema,
  arMediaCrossOriginSchema,
  arOverlaySchema,
  arTargetSchema,
  arVideoOverlaySchema,
  arVideoPreloadSchema,
  onLostBehaviorSchema,
} from './ar.schema';

export type OnLostBehavior = z.infer<typeof onLostBehaviorSchema>;
export type ARMediaCrossOrigin = z.infer<typeof arMediaCrossOriginSchema>;
export type ARVideoPreload = z.infer<typeof arVideoPreloadSchema>;

export type ARImageOverlay = z.infer<typeof arImageOverlaySchema>;
export type ARVideoOverlay = z.infer<typeof arVideoOverlaySchema>;
export type ARAudioOverlay = z.infer<typeof arAudioOverlaySchema>;

export type AROverlay = z.infer<typeof arOverlaySchema>;
export type ARTarget = z.infer<typeof arTargetSchema>;
export type ARConfig = z.infer<typeof arConfigSchema>;

export const defaultARConfig: ARConfig = {
  mindFile: '/targets.mind',
  targets: [
    {
      id: 'primary',
      targetIndex: 0,
      overlays: [
        {
          kind: 'image',
          src: '/overlay.png',
          width: 1,
          height: 0.552,
          position: '0 0 0',
          rotation: '0 0 0',
        },
      ],
    },
  ],
};
