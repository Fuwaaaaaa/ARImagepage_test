import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  ARCloseButton,
  ErrorPanel,
  Loading,
  type ErrorKind,
} from '@/components/ar/ARStatusOverlay';

describe('Loading', () => {
  it('renders the provided label and an aria-live region', () => {
    render(<Loading label="読み込み中..." />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });
});

describe('ARCloseButton', () => {
  it('renders a link to the home page', () => {
    render(<ARCloseButton />);
    const link = screen.getByRole('link', { name: /AR を閉じてホームに戻る/ });
    expect(link).toHaveAttribute('href', '/');
  });
});

describe('ErrorPanel', () => {
  const cases: Array<{ kind: ErrorKind; titleMatcher: RegExp }> = [
    { kind: 'denied', titleMatcher: /許可されていません/ },
    { kind: 'no-camera', titleMatcher: /見つかりません/ },
    { kind: 'no-https', titleMatcher: /HTTPS/ },
    { kind: 'unknown-error', titleMatcher: /失敗しました/ },
    { kind: 'timeout', titleMatcher: /読み込みに失敗/ },
  ];

  for (const { kind, titleMatcher } of cases) {
    it(`renders the correct title for kind=${kind}`, () => {
      render(<ErrorPanel kind={kind} message="msg" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(titleMatcher);
    });
  }

  it('shows the pnpm dev:https code block only for kind=no-https', () => {
    const { rerender } = render(<ErrorPanel kind="no-https" message="msg" />);
    expect(screen.getByText('pnpm dev:https')).toBeInTheDocument();

    rerender(<ErrorPanel kind="denied" message="msg" />);
    expect(screen.queryByText('pnpm dev:https')).not.toBeInTheDocument();
  });

  it('shows the error name details only when kind=unknown-error and errorName is provided', () => {
    const { rerender } = render(
      <ErrorPanel kind="unknown-error" message="boom" errorName="TypeError" />,
    );
    expect(screen.getByText('詳細を表示')).toBeInTheDocument();
    expect(screen.getByText(/TypeError/)).toBeInTheDocument();

    rerender(<ErrorPanel kind="unknown-error" message="boom" />);
    expect(screen.queryByText('詳細を表示')).not.toBeInTheDocument();

    rerender(<ErrorPanel kind="denied" message="boom" errorName="TypeError" />);
    expect(screen.queryByText('詳細を表示')).not.toBeInTheDocument();
  });

  it('renders a back-to-home link', () => {
    render(<ErrorPanel kind="denied" message="msg" />);
    const back = screen.getByRole('link', { name: /ホームに戻る/ });
    expect(back).toHaveAttribute('href', '/');
  });
});
