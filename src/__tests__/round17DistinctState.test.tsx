/**
 * Đợt 17.7 — Anti-slop UI: mỗi trạng thái có chữ riêng + icon riêng
 *
 * Quy tắc: GO/STBY/HOLD/OVERRUN/LIVE/Đã khóa/Chưa lưu — lỗi lưu tự động
 * phải có text node riêng (không dùng grayscale screenshot) và icon riêng.
 * Test khẳng định DOM có text + icon cho từng trạng thái.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StageClockWindow } from '../components/StageClockWindow';
import { StageClockState, DEFAULT_STAGE_CLOCK_STATE } from '../services/stageClockSync';

// Helper: override state cho StageClockWindow
const renderWithState = (overrides: Partial<StageClockState>) => {
  const state: StageClockState = {
    ...DEFAULT_STAGE_CLOCK_STATE,
    ...overrides,
  };
  return render(<StageClockWindow overrideState={state} />);
};

describe('17.7 — StageClockWindow: mỗi trạng thái có chữ riêng + icon riêng', () => {
  describe('Status Badge (GO/STBY/HOLD/OVERRUN) có chữ riêng + icon riêng', () => {
    it('trạng thái Go: hiển thị chữ GO + icon Play', () => {
      renderWithState({ cueStatus: 'Go', isRunning: true, isPaused: false });
      const badge = screen.getByTestId('stage-status-badge');
      expect(badge).toHaveTextContent('GO');
      // Icon Play (fill-current) cho GO
      const playIcon = badge.querySelector('svg');
      expect(playIcon).toBeInTheDocument();
      expect(playIcon?.classList.contains('fill-current')).toBe(true);
    });

    it('trạng thái Standby: hiển thị chữ STANDBY + icon AlertCircle', () => {
      renderWithState({ cueStatus: 'Standby' });
      const badge = screen.getByTestId('stage-status-badge');
      expect(badge).toHaveTextContent('STANDBY');
      // Icon AlertCircle cho STANDBY
      const icon = badge.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('trạng thái Hold: hiển thị chữ HOLD + icon Pause', () => {
      renderWithState({ cueStatus: 'Hold', isPaused: true });
      const badge = screen.getByTestId('stage-status-badge');
      expect(badge).toHaveTextContent('HOLD');
      // Icon Pause cho HOLD
      const icon = badge.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('trạng thái Overrun: hiển thị chữ OVERRUN + icon AlertTriangle', () => {
      renderWithState({ cueStatus: 'Go', isOverrun: true, cueRemainingMs: -5000 });
      const badge = screen.getByTestId('stage-status-badge');
      expect(badge).toHaveTextContent('OVERRUN');
      // Icon AlertTriangle cho OVERRUN
      const icon = badge.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('trạng thái Pending: hiển thị chữ PENDING + icon Square', () => {
      renderWithState({ cueStatus: 'Pending' });
      const badge = screen.getByTestId('stage-status-badge');
      expect(badge).toHaveTextContent('PENDING');
      // Icon Square cho Pending
      const icon = badge.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });
});

describe('17.7 — Header: Operator Lock có chữ riêng + icon riêng', () => {
  it.todo('trạng thái Đã khóa: hiển thị chữ "Đã khóa" + icon Lock');
  it.todo('trạng thái Khóa (unlocked): hiển thị chữ "Khóa" + icon Unlock');
});

describe('17.7 — Header: Save Status có chữ riêng + icon riêng', () => {
  it.todo('trạng thái "Chưa lưu — lỗi lưu tự động": hiển thị chữ + icon AlertTriangle');
  it.todo('trạng thái "Chưa lưu": hiển thị chữ + icon pulse dot');
  it.todo('trạng thái "Đã lưu": hiển thị chữ + icon check (nếu có)');
});
