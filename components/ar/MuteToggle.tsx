'use client';

import { useCallback, useState } from 'react';
import { resolveLabels, type ARLang } from '@/lib/ar/i18n';

const STORAGE_KEY = 'ar-muted';

function readPersistedMuted(initial: boolean): boolean {
  if (typeof window === 'undefined') return initial;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'false') return false;
    if (stored === 'true') return true;
  } catch {
    /* noop — localStorage may be unavailable */
  }
  return initial;
}

export type MuteToggleProps = {
  muted: boolean;
  onChange: (next: boolean) => void;
  lang?: ARLang;
};

export function MuteToggle({ muted, onChange, lang }: MuteToggleProps) {
  const labels = resolveLabels(lang);
  return (
    <button
      type="button"
      aria-label={
        muted ? labels.mute.unmuteAriaLabel : labels.mute.muteAriaLabel
      }
      aria-pressed={!muted}
      onClick={() => onChange(!muted)}
      className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black/80 active:scale-95"
    >
      <SpeakerIcon muted={muted} />
    </button>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-7 w-7"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M3 10v4h4l5 4V6L7 10H3z"
      />
      {muted ? (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          d="M16 9l5 6M21 9l-5 6"
        />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          d="M16 8.5c1.5 1 1.5 6 0 7M19 6.5c2.5 1.5 2.5 9.5 0 11"
        />
      )}
    </svg>
  );
}

export function useMuteToggleState(
  initial = true,
): [boolean, (next: boolean) => void] {
  const [muted, setMuted] = useState<boolean>(() => readPersistedMuted(initial));

  const update = useCallback((next: boolean) => {
    setMuted(next);
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false');
    } catch {
      /* noop */
    }
  }, []);

  return [muted, update];
}

export const MUTE_TOGGLE_STORAGE_KEY = STORAGE_KEY;
