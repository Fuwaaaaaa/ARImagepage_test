import type {
  ARAudioOverlay,
  ARTarget,
  ARVideoOverlay,
  AROverlay,
} from '@/config/ar';

export function overlayAssetId(targetId: string, index: number): string {
  return `ar-asset-${targetId}-${index}`;
}

export type VideoAsset = { assetId: string; targetId: string; overlay: ARVideoOverlay };
export type AudioAsset = { assetId: string; targetId: string; overlay: ARAudioOverlay };

export type CollectedMedia = {
  videos: VideoAsset[];
  audios: AudioAsset[];
};

export function collectMediaAssets(targets: ARTarget[]): CollectedMedia {
  const videos: VideoAsset[] = [];
  const audios: AudioAsset[] = [];
  for (const target of targets) {
    target.overlays.forEach((overlay, index) => {
      const assetId = overlayAssetId(target.id, index);
      if (overlay.kind === 'video') {
        videos.push({ assetId, targetId: target.id, overlay });
      } else if (overlay.kind === 'audio') {
        audios.push({ assetId, targetId: target.id, overlay });
      }
    });
  }
  return { videos, audios };
}

export function hasMediaOverlay(targets: ARTarget[]): boolean {
  return targets.some((t) =>
    t.overlays.some((o: AROverlay) => o.kind === 'video' || o.kind === 'audio'),
  );
}
