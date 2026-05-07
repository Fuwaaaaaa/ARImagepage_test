'use client';

import type { ReactNode } from 'react';
import type { ARConfig, AROverlay } from '@/config/ar';
import { collectMediaAssets, overlayAssetId } from '@/lib/ar/overlay';

export function ARSceneStage({ config }: { config: ARConfig }) {
  const { videos, audios } = collectMediaAssets(config.targets);
  const hasMedia = videos.length > 0 || audios.length > 0;

  return (
    <a-scene
      mindar-image={`imageTargetSrc: ${config.mindFile}; uiLoading: no; uiError: no; uiScanning: no;`}
      color-space="sRGB"
      renderer="colorManagement: true, physicallyCorrectLights"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
      embedded
    >
      {hasMedia && (
        <a-assets>
          {videos.map((v) => (
            <video
              key={v.assetId}
              id={v.assetId}
              src={v.overlay.src}
              crossOrigin={v.overlay.crossOrigin}
              preload={v.overlay.preload ?? 'auto'}
              playsInline
              muted={v.overlay.muted ?? true}
              loop={v.overlay.loop ?? true}
            />
          ))}
          {audios.map((a) => (
            <audio
              key={a.assetId}
              id={a.assetId}
              src={a.overlay.src}
              crossOrigin={a.overlay.crossOrigin}
              preload="auto"
              loop={a.overlay.loop ?? true}
            />
          ))}
        </a-assets>
      )}

      <a-camera
        position="0 0 0"
        look-controls="enabled: false"
        cursor="fuse: false; rayOrigin: mouse;"
      />

      {config.targets.map((t) => (
        <a-entity
          key={t.id}
          mindar-image-target={`targetIndex: ${t.targetIndex}`}
          data-target-id={t.id}
        >
          {t.overlays.map((overlay, index) => renderOverlay(overlay, t.id, index))}
        </a-entity>
      ))}
    </a-scene>
  );
}

function renderOverlay(
  overlay: AROverlay,
  targetId: string,
  index: number,
): ReactNode {
  const key = overlayAssetId(targetId, index);

  switch (overlay.kind) {
    case 'image':
      return (
        <a-image
          key={key}
          src={overlay.src}
          position={overlay.position ?? '0 0 0'}
          rotation={overlay.rotation ?? '0 0 0'}
          height={overlay.height}
          width={overlay.width}
        />
      );
    case 'video':
      return (
        <a-video
          key={key}
          src={`#${key}`}
          position={overlay.position ?? '0 0 0'}
          rotation={overlay.rotation ?? '0 0 0'}
          height={overlay.height}
          width={overlay.width}
        />
      );
    case 'audio':
      // Audio is non-spatial — rendered only inside <a-assets>.
      return null;
    default: {
      const _exhaustive: never = overlay;
      void _exhaustive;
      return null;
    }
  }
}
