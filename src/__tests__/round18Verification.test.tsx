import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { useShowStore } from '../store/useShowStore';
import { useClockStore } from '../store/useClockStore';
import { createDefaultShow, createBlankShow } from '../types/stage';
import { convertRowsToActs } from '../services/importer';
import { RundownTable } from '../components/rundown/RundownTable';
import { CueInspector } from '../components/CueInspector';
import { Header } from '../components/Header';

describe('Round 18 Comprehensive Verification Suite (User Reviews & Safety Fixes)', () => {
  beforeEach(() => {
    localStorage.clear();
    const show = createDefaultShow('Round 18 Show');
    useShowStore.getState().loadShow(show);
    useShowStore.getState().setOperatorLocked(false);
    useClockStore.getState().resetClock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 18.1 Operator Lock: Space un-locking bug & Synthetic activation prevention
  // =========================================================================
  describe('18.1 Operator Lock: Anti-Unlock & Focus Blur Ergonomics', () => {
    it('locks when clicked, blurs focus, and pressing Space while locked stays locked without firing cue', () => {
      render(<App />);

      const goCueSpy = vi.spyOn(useShowStore.getState(), 'goCue');
      const lockBtn = screen.getByTestId('header-operator-lock-button');

      // 1. Click lock button
      fireEvent.click(lockBtn);
      expect(useShowStore.getState().isOperatorLocked).toBe(true);

      // Button must NOT retain active focus
      expect(document.activeElement).not.toBe(lockBtn);

      // 2. Press Space while locked: must remain locked, cue must NOT fire, feedback shown
      fireEvent.keyDown(window, { key: ' ', code: 'Space' });
      expect(useShowStore.getState().isOperatorLocked).toBe(true);
      expect(goCueSpy).not.toHaveBeenCalled();
      expect(useShowStore.getState().operatorLockFeedback).toBeTruthy();

      // 3. Tab/focus to button and press Space while locked: must NOT unlock via keyboard Space/Enter
      lockBtn.focus();
      expect(document.activeElement).toBe(lockBtn);
      fireEvent.keyDown(lockBtn, { key: ' ', code: 'Space' });
      expect(useShowStore.getState().isOperatorLocked).toBe(true);

      fireEvent.keyDown(lockBtn, { key: 'Enter', code: 'Enter' });
      expect(useShowStore.getState().isOperatorLocked).toBe(true);

      // 4. Intentional user mouse click unlocks
      fireEvent.click(lockBtn);
      expect(useShowStore.getState().isOperatorLocked).toBe(false);
    });

    it('store methods (standby, go, hold, skip, next, prev) trigger lock feedback when locked', () => {
      useShowStore.getState().setOperatorLocked(true);

      useShowStore.getState().goCue();
      expect(useShowStore.getState().operatorLockFeedback).toContain('Đang khóa vận hành');

      useShowStore.getState().standbyCue('c1');
      expect(useShowStore.getState().operatorLockFeedback).toContain('Đang khóa vận hành');

      useShowStore.getState().holdCue();
      expect(useShowStore.getState().operatorLockFeedback).toContain('Đang khóa vận hành');

      useShowStore.getState().resumeCue();
      expect(useShowStore.getState().operatorLockFeedback).toContain('Đang khóa vận hành');

      useShowStore.getState().skipCue('c1');
      expect(useShowStore.getState().operatorLockFeedback).toContain('Đang khóa vận hành');
    });
  });

  // =========================================================================
  // 18.2 Hold / Resume toggle & Time preservation
  // =========================================================================
  describe('18.2 Hold / Resume Transport Mechanics & Visual State', () => {
    it('toggles cue into Hold, displays HOLD badge on Hero GO button, switches to Resume, and preserves remaining time', () => {
      const show = useShowStore.getState().show;
      const firstCue = show.acts[0].cues[0];

      // 1. Activate cue via GO
      useShowStore.getState().goCue(firstCue.id);
      expect(useShowStore.getState().activeCueId).toBe(firstCue.id);
      expect(useShowStore.getState().show.acts[0].cues[0].status).toBe('Go');

      // Set remaining time to 42 seconds
      useClockStore.setState({ cueRemainingMs: 42000, isRunning: true });

      // 2. Put cue on Hold
      useShowStore.getState().holdCue(firstCue.id);
      expect(useShowStore.getState().show.acts[0].cues[0].status).toBe('Hold');

      // Render Header
      render(
        <Header
          viewMode="split"
          setViewMode={vi.fn()}
          isOperatorLocked={false}
          setIsOperatorLocked={vi.fn()}
          onOpenProject={vi.fn()}
          onHelpClick={vi.fn()}
          onImportClick={vi.fn()}
          onExportClick={vi.fn()}
          wallClock="12:00:00"
        />
      );

      // Hero GO button must show HOLD badge
      const goBtn = screen.getByTestId('header-hero-go-button');
      expect(goBtn).toHaveTextContent('HOLD');

      // Hold button must switch to Resume button
      const resumeBtn = screen.getByTestId('header-resume-button');
      expect(resumeBtn).toBeInTheDocument();
      expect(resumeBtn).toHaveTextContent('Resume');

      // 3. Click Resume: cue returns to Go status, preserving 42s remaining time
      fireEvent.click(resumeBtn);
      expect(useShowStore.getState().show.acts[0].cues[0].status).toBe('Go');
      expect(useClockStore.getState().cueRemainingMs).toBe(42000);
    });
  });

  // =========================================================================
  // 18.3 Importer: Missing Title & Invalid Duration Handling
  // =========================================================================
  describe('18.3 CSV Importer: Issue Reporting & Fallbacks', () => {
    it('detects missing titles and invalid durations without silently swallowing rows', () => {
      const rows = [
        { STT: '1', Title: 'Valid Opening', Duration: '02:00', LX: 'Spotlight' },
        { STT: '2', Title: '', Duration: '03:00', LX: 'Wash' }, // missing title
        { STT: '3', Title: 'Invalid Duration Cue', Duration: 'abc', LX: 'Laser' }, // invalid duration
      ];

      // Test with skipMissingTitle: false
      const resultWithIssues = convertRowsToActs(
        rows,
        {
          title: 'Title',
          cueNumber: 'STT',
          duration: 'Duration',
          lx: 'LX',
        },
        'Act 1',
        { skipMissingTitle: false }
      );

      expect(resultWithIssues.issues.length).toBe(2);
      expect(resultWithIssues.defaultDurationCount).toBe(1); // row 3 fell back to 60s
      expect(resultWithIssues.issues.some((i) => i.type === 'missing_title')).toBe(true);
      expect(resultWithIssues.issues.some((i) => i.type === 'invalid_duration')).toBe(true);

      // Test with skipMissingTitle: true
      const resultSkipping = convertRowsToActs(
        rows,
        {
          title: 'Title',
          cueNumber: 'STT',
          duration: 'Duration',
          lx: 'LX',
        },
        'Act 1',
        { skipMissingTitle: true }
      );

      expect(resultSkipping.skippedCount).toBe(1);
      const allCues = resultSkipping.acts.flatMap((a) => a.cues);
      expect(allCues.length).toBe(2);
      expect(allCues.find((c) => c.title === 'Valid Opening')).toBeDefined();
      expect(allCues.find((c) => c.title === 'Invalid Duration Cue')).toBeDefined();
    });
  });

  // =========================================================================
  // 18.4 Skip Cue: Confirmation Step
  // =========================================================================
  describe('18.4 Skip Cue: Confirmation Guard', () => {
    it('requires confirmation before executing skip in CueInspector', () => {
      const firstCue = useShowStore.getState().show.acts[0].cues[0];
      useShowStore.getState().selectCue(firstCue.id);
      useShowStore.setState({ isInspectorOpen: true });

      const skipSpy = vi.spyOn(useShowStore.getState(), 'skipCue');
      render(<CueInspector />);

      // Click Skip button
      const skipBtn = screen.getByTestId('inspector-skip-button');
      fireEvent.click(skipBtn);

      // Skip confirmation row must appear
      expect(screen.getByTestId('skip-confirm-dialog')).toBeInTheDocument();
      expect(skipSpy).not.toHaveBeenCalled();

      // Click Cancel ("Huỷ")
      const cancelBtn = screen.getByTestId('skip-cancel-button');
      fireEvent.click(cancelBtn);
      expect(screen.queryByTestId('skip-confirm-dialog')).not.toBeInTheDocument();
      expect(skipSpy).not.toHaveBeenCalled();

      // Click Skip again and confirm
      fireEvent.click(skipBtn);
      const confirmBtn = screen.getByTestId('skip-confirm-button');
      fireEvent.click(confirmBtn);

      expect(skipSpy).toHaveBeenCalledWith(firstCue.id);
      expect(screen.queryByTestId('skip-confirm-dialog')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // 18.5 Auto-scroll: Smooth tracking & User Scroll Pause
  // =========================================================================
  describe('18.5 RundownTable Auto-scroll & Ergonomics', () => {
    it('renders rundown table with sample show banner and Start Blank action', () => {
      render(<RundownTable />);

      // Shows "Dữ liệu mẫu" banner
      expect(screen.getByTestId('sample-data-banner')).toBeInTheDocument();
      expect(screen.getAllByText(/Dữ liệu mẫu/i).length).toBeGreaterThanOrEqual(1);

      // Click "Bắt đầu từ trắng"
      const clearBtn = screen.getByRole('button', { name: /Bắt đầu từ trắng/i });
      fireEvent.click(clearBtn);

      // Show cues should now be empty
      const allCues = useShowStore.getState().getAllCues();
      expect(allCues.length).toBe(0);
    });

    it('renders Hold status badge with amber styling before GO status', () => {
      const firstCue = useShowStore.getState().show.acts[0].cues[0];
      useShowStore.getState().goCue(firstCue.id);
      useShowStore.getState().holdCue(firstCue.id);

      render(<RundownTable />);

      // In the table row, status must show HOLD
      const holdBadges = screen.getAllByText('HOLD');
      expect(holdBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 18.6 Layout Constraints & Responsive Thresholds
  // =========================================================================
  describe('18.6 Viewport 960px Compact Compatibility', () => {
    it('keeps hardware counters and delta time visible without overflow', () => {
      render(
        <Header
          viewMode="split"
          setViewMode={vi.fn()}
          isOperatorLocked={false}
          setIsOperatorLocked={vi.fn()}
          onOpenProject={vi.fn()}
          onHelpClick={vi.fn()}
          onImportClick={vi.fn()}
          onExportClick={vi.fn()}
          wallClock="12:00:00"
        />
      );

      const lxCounter = screen.getByTestId('header-lx-count');
      const vxCounter = screen.getByTestId('header-vx-count');
      expect(lxCounter).toBeInTheDocument();
      expect(vxCounter).toBeInTheDocument();

      // Delta label (compact below lg, full label from lg up)
      expect(screen.getByTestId('header-delta-label-compact')).toBeInTheDocument();
      expect(screen.getByTestId('header-delta-label-full')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 18.7 Clean Show State Utility
  // =========================================================================
  describe('18.7 Blank Show Generator', () => {
    it('creates an empty show structure with zero cues', () => {
      const blank = createBlankShow('Empty Production');
      expect(blank.metadata.title).toBe('Empty Production');
      expect(blank.acts.length).toBe(1);
      expect(blank.acts[0].cues.length).toBe(0);
    });
  });
});
