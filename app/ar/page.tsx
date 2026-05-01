'use client';

import dynamic from 'next/dynamic';

const ARScene = dynamic(() => import('@/components/ARScene'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-500 border-t-sky-400" />
        <p className="text-sm tracking-widest text-slate-300">Loading AR...</p>
      </div>
    </div>
  ),
});

export default function ARPage() {
  return <ARScene />;
}
