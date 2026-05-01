/**
 * Historical overlay toggle changes active cycle correctly.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryOverlay } from '@/components/HistoryOverlay';

describe('HistoryOverlay', () => {
  it('renders all four cycle buttons', () => {
    const onChange = vi.fn();
    render(
      <HistoryOverlay
        activeCycle="live"
        onChange={onChange}
        deltaMode={false}
        onDeltaToggle={vi.fn()}
      />
    );
    expect(screen.getByText('2026 Live')).toBeInTheDocument();
    expect(screen.getByText('2024 LS')).toBeInTheDocument();
    expect(screen.getByText('2019 LS')).toBeInTheDocument();
    expect(screen.getByText('2021 Assembly')).toBeInTheDocument();
  });

  it('calls onChange with the selected cycle', () => {
    const onChange = vi.fn();
    render(
      <HistoryOverlay
        activeCycle="live"
        onChange={onChange}
        deltaMode={false}
        onDeltaToggle={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('2024 LS'));
    expect(onChange).toHaveBeenCalledWith('ls_2024');
  });

  it('shows delta button only when non-live cycle is active', () => {
    const { rerender } = render(
      <HistoryOverlay
        activeCycle="live"
        onChange={vi.fn()}
        deltaMode={false}
        onDeltaToggle={vi.fn()}
      />
    );
    expect(screen.queryByText(/Δ vs current/)).not.toBeInTheDocument();

    rerender(
      <HistoryOverlay
        activeCycle="ls_2024"
        onChange={vi.fn()}
        deltaMode={false}
        onDeltaToggle={vi.fn()}
      />
    );
    expect(screen.getByText(/Δ vs current/)).toBeInTheDocument();
  });

  it('marks active cycle button as aria-checked', () => {
    render(
      <HistoryOverlay
        activeCycle="ls_2019"
        onChange={vi.fn()}
        deltaMode={false}
        onDeltaToggle={vi.fn()}
      />
    );
    const btn = screen.getByText('2019 LS');
    expect(btn).toHaveAttribute('aria-checked', 'true');
  });
});
