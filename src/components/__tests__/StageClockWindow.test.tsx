import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StageClockWindow } from '../StageClockWindow';
import {
  broadcastStageClock,
  subscribeStageClock,
  openStageClockWindow,
  DEFAULT_STAGE_CLOCK_STATE,
  StageClockState,
  STAGE_CLOCK_STORAGE_KEY,
} from '../../services/stageClockSync';

describe('Stage Confidence Clock Component & Sync Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('StageClockWindow Component Rendering', () => {
    it('renders giant countdown timer, active cue, and standby cue', () => {
      const customState: StageClockState = {
        ...DEFAULT_STAGE_CLOCK_STATE,
        showTitle: 'Gala Night 2026',
        activeCueNumber: '02',
        activeCueTitle: 'Mở màn — Vũ khúc Ánh Sáng',
        standbyCueNumber: '03',
        standbyCueTitle: 'MC Giới thiệu Đại biểu',
        cueStatus: 'Go',
        cueRemainingMs: 185000, // 03:05
        cueElapsedMs: 15000,
        cueDurationMs: 200000,
        masterElapsedMs: 345000, // 05:45
        deltaMs: -15000, // -00:15
        isOverrun: false,
        isRunning: true,
        isPaused: false,
        timestamp: Date.now(),
      };

      render(<StageClockWindow overrideState={customState} />);

      expect(screen.getByText('Gala Night 2026')).toBeInTheDocument();
      expect(screen.getByTestId('active-cue-title')).toHaveTextContent('Mở màn — Vũ khúc Ánh Sáng');
      expect(screen.getByText('CUE 02')).toBeInTheDocument();
      expect(screen.getByTestId('giant-countdown')).toHaveTextContent('03:05');
      expect(screen.getByTestId('standby-cue-title')).toHaveTextContent('[03] MC Giới thiệu Đại biểu');
      expect(screen.getByTestId('master-elapsed-time')).toHaveTextContent('05:45');
      expect(screen.getByTestId('show-delta-time')).toHaveTextContent('-00:15');
      expect(screen.getByTestId('stage-status-badge')).toHaveTextContent('GO');
    });

    it('renders overrun visual alert when cue exceeds scheduled duration', () => {
      const overrunState: StageClockState = {
        ...DEFAULT_STAGE_CLOCK_STATE,
        activeCueTitle: 'Tiết mục Kéo dài',
        cueStatus: 'Go',
        cueRemainingMs: -45000, // -00:45
        cueElapsedMs: 165000,
        cueDurationMs: 120000,
        isOverrun: true,
        isRunning: true,
        isPaused: false,
        timestamp: Date.now(),
      };

      render(<StageClockWindow overrideState={overrunState} />);

      expect(screen.getByTestId('giant-countdown')).toHaveTextContent('-00:45');
      expect(screen.getByTestId('stage-status-badge')).toHaveTextContent('OVERRUN');
      expect(screen.getByTestId('overrun-alert-label')).toBeInTheDocument();
      expect(screen.getByTestId('giant-countdown')).toHaveClass('text-status-danger');
    });

    it('handles fullscreen toggle button and keyboard F shortcut', async () => {
      const requestFullscreenMock = vi.fn().mockResolvedValue(undefined);
      const exitFullscreenMock = vi.fn().mockResolvedValue(undefined);

      document.documentElement.requestFullscreen = requestFullscreenMock;
      document.exitFullscreen = exitFullscreenMock;

      render(<StageClockWindow />);

      const fullscreenBtn = screen.getByRole('button', { name: /toàn màn hình/i });
      fireEvent.click(fullscreenBtn);
      expect(requestFullscreenMock).toHaveBeenCalled();

      // Trigger 'f' keydown event
      fireEvent.keyDown(window, { key: 'f' });
      expect(requestFullscreenMock).toHaveBeenCalledTimes(2);
    });

    it('renders and invokes onClose callback when provided', () => {
      const onClose = vi.fn();
      render(<StageClockWindow onClose={onClose} />);

      const closeBtn = screen.getByRole('button', { name: /đóng cửa sổ/i });
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Stage Clock Sync Service', () => {
    it('broadcasts state to localStorage and invokes subscriber callback', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeStageClock(callback);

      act(() => {
        broadcastStageClock({
          showTitle: 'Broadcasted Show',
          cueRemainingMs: 75000,
          cueStatus: 'Standby',
        });
      });

      // Stored in localStorage
      const stored = localStorage.getItem(STAGE_CLOCK_STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.showTitle).toBe('Broadcasted Show');
      expect(parsed.cueRemainingMs).toBe(75000);

      unsubscribe();
    });

    it('opens stage clock window using window.open in browser mode', async () => {
      const originalOpen = window.open;
      const mockFocus = vi.fn();
      const mockWindow = { focus: mockFocus } as unknown as Window;
      window.open = vi.fn(() => mockWindow);

      const win = await openStageClockWindow();
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('?view=stage-clock'),
        'LightStageConfidenceClock',
        expect.stringContaining('width=1024')
      );
      expect(win).toBe(mockWindow);
      expect(mockFocus).toHaveBeenCalled();

      window.open = originalOpen;
    });
  });
});
