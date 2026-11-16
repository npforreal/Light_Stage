import { create } from 'zustand';
import { useShowStore } from './useShowStore';

export interface ClockState {
  isRunning: boolean;
  isPaused: boolean;
  masterElapsedMs: number;
  cueElapsedMs: number;
  cueDurationMs: number;
  cueRemainingMs: number;
  isOverrun: boolean;

  // Actions
  startClock: () => void;
  pauseClock: () => void;
  resumeClock: () => void;
  stopClock: () => void;
  resetClock: () => void;
  tick: (deltaMs: number) => void;
  syncCueDuration: (durationMs: number, resetCueClock?: boolean) => void;
  resetCueClock: () => void;
  setMasterElapsedMs: (ms: number) => void;
}

export function formatDuration(ms: number, options: { includeHours?: boolean; includeMs?: boolean } = {}): string {
  const isNegative = ms < 0;
  const absMs = Math.abs(ms);

  const totalSeconds = Math.floor(absMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((absMs % 1000) / 100);

  const pad = (n: number) => String(n).padStart(2, '0');

  let result = '';
  if (options.includeHours || hours > 0) {
    result = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    result = `${pad(minutes)}:${pad(seconds)}`;
  }

  if (options.includeMs) {
    result += `.${tenths}`;
  }

  return isNegative ? `-${result}` : result;
}

export const useClockStore = create<ClockState>((set) => ({
  isRunning: false,
  isPaused: false,
  masterElapsedMs: 0,
  cueElapsedMs: 0,
  cueDurationMs: 60000,
  cueRemainingMs: 60000,
  isOverrun: false,

  startClock: () => {
    set({
      isRunning: true,
      isPaused: false,
    });
  },

  pauseClock: () => {
    set({
      isRunning: false,
      isPaused: true,
    });
    try {
      const showStore = useShowStore.getState();
      if (showStore && showStore.activeCueId) {
        const activeCue = showStore.getCueById(showStore.activeCueId);
        if (activeCue && activeCue.status === 'Go') {
          const updatedActs = showStore.show.acts.map((act) => ({
            ...act,
            cues: act.cues.map((cue) =>
              cue.id === showStore.activeCueId ? { ...cue, status: 'Hold' as const } : cue
            ),
          }));
          useShowStore.setState({
            show: { ...showStore.show, acts: updatedActs },
          });
        }
      }
    } catch {
      // Ignore in unmounted / isolated test context
    }
  },

  resumeClock: () => {
    set({
      isRunning: true,
      isPaused: false,
    });
  },

  stopClock: () => {
    set({
      isRunning: false,
      isPaused: false,
    });
    try {
      const showStore = useShowStore.getState();
      if (showStore && showStore.activeCueId) {
        const activeCue = showStore.getCueById(showStore.activeCueId);
        if (activeCue && activeCue.status === 'Go') {
          const updatedActs = showStore.show.acts.map((act) => ({
            ...act,
            cues: act.cues.map((cue) =>
              cue.id === showStore.activeCueId ? { ...cue, status: 'Hold' as const } : cue
            ),
          }));
          useShowStore.setState({
            show: { ...showStore.show, acts: updatedActs },
          });
        }
      }
    } catch {
      // Ignore in unmounted / isolated test context
    }
  },

  resetClock: () => {
    set((state) => ({
      isRunning: false,
      isPaused: false,
      masterElapsedMs: 0,
      cueElapsedMs: 0,
      cueRemainingMs: state.cueDurationMs,
      isOverrun: false,
    }));
    try {
      const showStore = useShowStore.getState();
      if (showStore && showStore.resetAllCues) {
        showStore.resetAllCues();
      }
    } catch {
      // Ignore in unmounted / isolated test context
    }
  },

  tick: (deltaMs: number) => {
    set((state) => {
      if (!state.isRunning) return state;

      const nextMaster = state.masterElapsedMs + deltaMs;
      const nextCueElapsed = state.cueElapsedMs + deltaMs;
      const remaining = state.cueDurationMs - nextCueElapsed;
      const isOverrun = remaining < 0;

      return {
        masterElapsedMs: nextMaster,
        cueElapsedMs: nextCueElapsed,
        cueRemainingMs: isOverrun ? remaining : Math.max(0, remaining),
        isOverrun,
      };
    });
  },

  syncCueDuration: (durationMs: number, resetCueClock = true) => {
    set((state) => {
      const cueElapsed = resetCueClock ? 0 : state.cueElapsedMs;
      const remaining = durationMs - cueElapsed;
      const isOverrun = remaining < 0;

      return {
        cueDurationMs: durationMs,
        cueElapsedMs: cueElapsed,
        cueRemainingMs: isOverrun ? remaining : Math.max(0, remaining),
        isOverrun,
      };
    });
  },

  resetCueClock: () => {
    set((state) => ({
      cueElapsedMs: 0,
      cueRemainingMs: state.cueDurationMs,
      isOverrun: false,
    }));
  },

  setMasterElapsedMs: (ms: number) => {
    set({ masterElapsedMs: Math.max(0, ms) });
  },
}));
