import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SimulationPanel } from '@/components/ar/SimulationPanel';
import type { ARTarget } from '@/config/ar';

function imageTarget(id: string, idx: number): ARTarget {
  return {
    id,
    targetIndex: idx,
    overlays: [{ kind: 'image', src: '/x.png', width: 1, height: 1 }],
  };
}

function renderPanel(targets: ARTarget[]) {
  const onFireFound = vi.fn();
  const onFireLost = vi.fn();
  const onFireAllFound = vi.fn();
  const onFireAllLost = vi.fn();
  render(
    <SimulationPanel
      targets={targets}
      onFireFound={onFireFound}
      onFireLost={onFireLost}
      onFireAllFound={onFireAllFound}
      onFireAllLost={onFireAllLost}
    />,
  );
  return { onFireFound, onFireLost, onFireAllFound, onFireAllLost };
}

describe('SimulationPanel', () => {
  it('renders per-target found/lost buttons', () => {
    renderPanel([imageTarget('primary', 0), imageTarget('secondary', 1)]);

    expect(screen.getByTestId('sim-found-primary')).toBeInTheDocument();
    expect(screen.getByTestId('sim-lost-primary')).toBeInTheDocument();
    expect(screen.getByTestId('sim-found-secondary')).toBeInTheDocument();
    expect(screen.getByTestId('sim-lost-secondary')).toBeInTheDocument();
  });

  it('shows "all" controls only when there is more than one target', () => {
    renderPanel([imageTarget('only', 0)]);
    expect(screen.queryByTestId('sim-found-all')).not.toBeInTheDocument();
  });

  it('renders "all" controls when there are 2+ targets', () => {
    renderPanel([imageTarget('a', 0), imageTarget('b', 1)]);
    expect(screen.getByTestId('sim-found-all')).toBeInTheDocument();
    expect(screen.getByTestId('sim-lost-all')).toBeInTheDocument();
  });

  it('fires per-target callbacks with the right target id', () => {
    const handlers = renderPanel([
      imageTarget('primary', 0),
      imageTarget('secondary', 1),
    ]);

    fireEvent.click(screen.getByTestId('sim-found-primary'));
    fireEvent.click(screen.getByTestId('sim-lost-secondary'));

    expect(handlers.onFireFound).toHaveBeenCalledTimes(1);
    expect(handlers.onFireFound).toHaveBeenCalledWith('primary');
    expect(handlers.onFireLost).toHaveBeenCalledTimes(1);
    expect(handlers.onFireLost).toHaveBeenCalledWith('secondary');
  });

  it('fires the all-targets callbacks when "all" buttons are clicked', () => {
    const handlers = renderPanel([imageTarget('a', 0), imageTarget('b', 1)]);

    fireEvent.click(screen.getByTestId('sim-found-all'));
    fireEvent.click(screen.getByTestId('sim-lost-all'));

    expect(handlers.onFireAllFound).toHaveBeenCalledTimes(1);
    expect(handlers.onFireAllLost).toHaveBeenCalledTimes(1);
  });
});
