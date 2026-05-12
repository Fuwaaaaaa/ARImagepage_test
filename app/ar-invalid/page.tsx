'use client';

import dynamic from 'next/dynamic';
import type { ARConfig } from '@/config/ar';

const ARScene = dynamic(() => import('@/components/ARScene'), {
  ssr: false,
});

/**
 * Test-only route that mounts `<ARScene>` with a deliberately invalid
 * config so the runtime Zod safeParse fires and renders the
 * `'invalid-config'` `<ErrorPanel>`. Used by `e2e/visual.spec.ts` and the
 * a11y harness to capture that branch without runtime trickery.
 *
 * The config has multiple distinct violations (empty mindFile, zero
 * dimensions, unknown overlay kind) so the snapshot exercises the full
 * issue-list rendering path in `<ErrorPanel>`.
 */
const brokenConfig = {
  mindFile: '',
  targets: [
    {
      id: 'broken-target',
      targetIndex: 0,
      overlays: [
        {
          kind: 'image',
          src: '/overlay.png',
          width: 0,
          height: 0,
        },
      ],
    },
  ],
} as unknown as ARConfig;

export default function ARInvalidPage() {
  return <ARScene config={brokenConfig} />;
}
