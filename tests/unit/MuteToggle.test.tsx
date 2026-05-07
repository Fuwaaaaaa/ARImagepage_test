import { fireEvent, render, renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MuteToggle,
  MUTE_TOGGLE_STORAGE_KEY,
  useMuteToggleState,
} from '@/components/ar/MuteToggle';

describe('<MuteToggle />', () => {
  it('renders aria attributes that reflect the muted prop', () => {
    const { getByRole, rerender } = render(
      <MuteToggle muted={true} onChange={() => undefined} />,
    );
    const button = getByRole('button');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.getAttribute('aria-label')).toMatch(/解除/);

    rerender(<MuteToggle muted={false} onChange={() => undefined} />);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('aria-label')).toMatch(/ミュートにする/);
  });

  it('calls onChange with the inverted muted value when clicked', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <MuteToggle muted={true} onChange={onChange} />,
    );
    fireEvent.click(getByRole('button'));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});

describe('useMuteToggleState', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('defaults to muted=true when no value is stored', () => {
    const { result } = renderHook(() => useMuteToggleState(true));
    expect(result.current[0]).toBe(true);
  });

  it('reads the persisted value on mount', () => {
    window.localStorage.setItem(MUTE_TOGGLE_STORAGE_KEY, 'false');
    const { result } = renderHook(() => useMuteToggleState(true));
    expect(result.current[0]).toBe(false);
  });

  it('persists the new value to localStorage on update', () => {
    const { result } = renderHook(() => useMuteToggleState(true));
    act(() => {
      result.current[1](false);
    });
    expect(result.current[0]).toBe(false);
    expect(window.localStorage.getItem(MUTE_TOGGLE_STORAGE_KEY)).toBe('false');

    act(() => {
      result.current[1](true);
    });
    expect(window.localStorage.getItem(MUTE_TOGGLE_STORAGE_KEY)).toBe('true');
  });
});
