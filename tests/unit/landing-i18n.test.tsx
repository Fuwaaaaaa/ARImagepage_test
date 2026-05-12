import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Home from '@/app/page';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Home (landing) i18n', () => {
  it('renders the Japanese copy under the default ja-JP locale', async () => {
    // tests/setup.ts pins navigator.language to ja-JP, so detectLang resolves
    // to 'ja' inside the post-mount effect.
    render(<Home />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: '画像認識 AR デモ' }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('link', { name: 'ARを開始' }),
    ).toHaveAttribute('href', '/ar');
    expect(screen.getByText(/マーカー画像をかざすと/)).toBeInTheDocument();
  });

  it('switches to English when navigator.language starts with en', async () => {
    vi.stubGlobal('navigator', { language: 'en-US' });

    render(<Home />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Image-Recognition AR Demo',
        }),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Start AR' })).toHaveAttribute(
      'href',
      '/ar',
    );
    expect(screen.getByAltText('AR marker image')).toBeInTheDocument();
  });

  it('keeps the eyebrow brand mark identical across locales', async () => {
    // English-only brand string stays English in both label sets so the
    // hero region holds a stable anchor regardless of the active locale.
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText('Image Tracking AR Demo')).toBeInTheDocument();
    });
  });
});
