import { describe, it, expect, beforeEach } from 'vitest';
import { useClockStore, formatDuration } from '../useClockStore';

describe('useClockStore', () => {
  beforeEach(() => {
    useClockStore.getState().resetClock();
    useClockStore.getState().syncCueDuration(60000);
  });

  it('initializes with default values', () => {
    const state = useClockStore.getState();
    expect(state.isRunning).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.masterElapsedMs).toBe(0);
    expect(state.cueElapsedMs).toBe(0);
    expect(state.cueDurationMs).toBe(60000);
    expect(state.cueRemainingMs).toBe(60000);
    expect(state.isOverrun).toBe(false);
  });

  it('starts, pauses, resumes and stops the clock', () => {
    useClockStore.getState().startClock();
    expect(useClockStore.getState().isRunning).toBe(true);

    useClockStore.getState().pauseClock();
    expect(useClockStore.getState().isRunning).toBe(false);
    expect(useClockStore.getState().isPaused).toBe(true);

    useClockStore.getState().resumeClock();
    expect(useClockStore.getState().isRunning).toBe(true);
    expect(useClockStore.getState().isPaused).toBe(false);

    useClockStore.getState().stopClock();
    expect(useClockStore.getState().isRunning).toBe(false);
  });

  it('advances elapsed time on tick only when running', () => {
    useClockStore.getState().tick(1000);
    expect(useClockStore.getState().masterElapsedMs).toBe(0);

    useClockStore.getState().startClock();
    useClockStore.getState().tick(5000);

    expect(useClockStore.getState().masterElapsedMs).toBe(5000);
    expect(useClockStore.getState().cueElapsedMs).toBe(5000);
    expect(useClockStore.getState().cueRemainingMs).toBe(55000);
    expect(useClockStore.getState().isOverrun).toBe(false);
  });

  it('flags overrun when cue exceeds target duration', () => {
    useClockStore.getState().syncCueDuration(10000);
    useClockStore.getState().startClock();

    useClockStore.getState().tick(12000);

    expect(useClockStore.getState().cueElapsedMs).toBe(12000);
    expect(useClockStore.getState().cueRemainingMs).toBe(-2000);
    expect(useClockStore.getState().isOverrun).toBe(true);
  });

  it('syncs cue duration and resets cue clock', () => {
    useClockStore.getState().startClock();
    useClockStore.getState().tick(5000);

    useClockStore.getState().syncCueDuration(45000, true);
    expect(useClockStore.getState().cueDurationMs).toBe(45000);
    expect(useClockStore.getState().cueElapsedMs).toBe(0);
    expect(useClockStore.getState().cueRemainingMs).toBe(45000);
    expect(useClockStore.getState().masterElapsedMs).toBe(5000); // master clock unaffected
  });

  describe('formatDuration helper', () => {
    it('formats seconds and minutes correctly', () => {
      expect(formatDuration(0)).toBe('00:00');
      expect(formatDuration(65000)).toBe('01:05');
      expect(formatDuration(3665000)).toBe('01:01:05');
    });

    it('formats overrun / negative durations', () => {
      expect(formatDuration(-15000)).toBe('-00:15');
    });

    it('formats with tenths of seconds when requested', () => {
      expect(formatDuration(15500, { includeMs: true })).toBe('00:15.5');
    });
  });
});
