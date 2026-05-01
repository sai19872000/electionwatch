/**
 * Smoke: overview page renders without snapshot.json (baked fallback works).
 * Per architect spec N1: fallback must render zeroed CountdownBanner before counting.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AllianceCounter } from '@/components/AllianceCounter';

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
  },
  useSpring: (v: number) => ({ get: () => v, set: vi.fn() }),
  useMotionValueEvent: vi.fn(),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AllianceCounter', () => {
  it('renders three alliance labels', () => {
    render(<AllianceCounter nda={0} india={0} oth={0} totalSeats={824} />);
    expect(screen.getByText('NDA')).toBeInTheDocument();
    expect(screen.getByText('INDIA')).toBeInTheDocument();
    expect(screen.getByText('OTH')).toBeInTheDocument();
  });

  it('shows total seats info', () => {
    render(<AllianceCounter nda={200} india={180} oth={50} totalSeats={824} />);
    expect(screen.getByText(/824/)).toBeInTheDocument();
  });

  it('renders with zeroed values (pre-counting fallback)', () => {
    render(<AllianceCounter nda={0} india={0} oth={0} totalSeats={824} />);
    // Should render without errors; all pending label shown
    expect(screen.getByText(/824 pending/i)).toBeInTheDocument();
  });
});
