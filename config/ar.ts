export type OnLostBehavior = 'pause' | 'reset' | 'continue';
export type ARMediaCrossOrigin = 'anonymous' | 'use-credentials';
export type ARVideoPreload = 'auto' | 'metadata' | 'none';

type SpatialProps = {
  position?: string;
  rotation?: string;
};

type SizedProps = SpatialProps & {
  width: number;
  height: number;
};

export type ARImageOverlay = SizedProps & {
  kind: 'image';
  src: string;
};

export type ARVideoOverlay = SizedProps & {
  kind: 'video';
  src: string;
  loop?: boolean;
  muted?: boolean;
  crossOrigin?: ARMediaCrossOrigin;
  preload?: ARVideoPreload;
  onLost?: OnLostBehavior;
};

export type ARAudioOverlay = {
  kind: 'audio';
  src: string;
  loop?: boolean;
  volume?: number;
  crossOrigin?: ARMediaCrossOrigin;
  onLost?: OnLostBehavior;
};

export type AROverlay = ARImageOverlay | ARVideoOverlay | ARAudioOverlay;

export type ARTarget = {
  id: string;
  targetIndex: number;
  overlays: AROverlay[];
};

export type ARConfig = {
  mindFile: string;
  targets: ARTarget[];
};

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
