/**
 * Stage Confidence Clock Sync Service
 *
 * Facilitates real-time broadcast and subscription between the main Light Stage window
 * and secondary confidence monitors / backstage displays.
 *
 * Uses BroadcastChannel with localStorage event fallback.
 */

import { useEffect, useState } from 'react';

export const STAGE_CLOCK_CHANNEL_NAME = 'lightstage-clock';
export const STAGE_CLOCK_STORAGE_KEY = 'lightstage_stage_clock_state';

export interface StageClockState {
  showTitle: string;
  activeCueNumber?: string;
  activeCueTitle?: string;
  activeCueDirectionNotes?: string;
  targetTime?: string;
  standbyCueNumber?: string;
  standbyCueTitle?: string;
  cueStatus: string; // 'Pending' | 'Standby' | 'Go' | 'Hold' | 'Skip' | 'Completed'
  cueRemainingMs: number;
  cueElapsedMs: number;
  cueDurationMs: number;
  masterElapsedMs: number;
  deltaMs: number;
  isOverrun: boolean;
  isRunning: boolean;
  isPaused: boolean;
  timestamp: number;
}

export const DEFAULT_STAGE_CLOCK_STATE: StageClockState = {
  showTitle: 'Light Stage Show',
  activeCueNumber: undefined,
  activeCueTitle: 'Chưa có Cue kích hoạt',
  standbyCueNumber: undefined,
  standbyCueTitle: '—',
  cueStatus: 'Standby',
  cueRemainingMs: 0,
  cueElapsedMs: 0,
  cueDurationMs: 0,
  masterElapsedMs: 0,
  deltaMs: 0,
  isOverrun: false,
  isRunning: false,
  isPaused: false,
  timestamp: 0,
};

let activeBroadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof window.BroadcastChannel === 'undefined') {
    return null;
  }
  if (!activeBroadcastChannel) {
    try {
      activeBroadcastChannel = new BroadcastChannel(STAGE_CLOCK_CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return activeBroadcastChannel;
}

/**
 * Broadcasts the current stage clock and cue state to all connected confidence windows.
 */
export function broadcastStageClock(state: Partial<StageClockState>): void {
  const fullState: StageClockState = {
    ...DEFAULT_STAGE_CLOCK_STATE,
    ...state,
    timestamp: Date.now(),
  };

  // 1. BroadcastChannel
  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage({
        type: 'STAGE_CLOCK_UPDATE',
        payload: fullState,
      });
    } catch {
      // Ignore broadcast errors
    }
  }

  // 2. LocalStorage Fallback & initial state for newly opened windows
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STAGE_CLOCK_STORAGE_KEY, JSON.stringify(fullState));
    } catch {
      // Ignore quota or private browsing errors
    }
  }
}

/**
 * Reads the latest persisted StageClockState from localStorage.
 */
export function getLatestStageClockState(): StageClockState | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(STAGE_CLOCK_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StageClockState;
  } catch {
    return null;
  }
}

/**
 * Subscribes to real-time clock updates.
 * Returns an unsubscription function.
 */
export function subscribeStageClock(callback: (state: StageClockState) => void): () => void {
  // Immediately provide current state if available
  const initial = getLatestStageClockState();
  if (initial) {
    callback(initial);
  }

  let channel: BroadcastChannel | null = null;

  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'STAGE_CLOCK_UPDATE' && event.data.payload) {
      callback(event.data.payload as StageClockState);
    }
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STAGE_CLOCK_STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue) as StageClockState;
        callback(parsed);
      } catch {
        // ignore
      }
    }
  };

  if (typeof window !== 'undefined') {
    if (typeof window.BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel(STAGE_CLOCK_CHANNEL_NAME);
        channel.addEventListener('message', handleMessage);
      } catch {
        // fallback to storage only
      }
    }

    window.addEventListener('storage', handleStorage);
  }

  return () => {
    if (channel) {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

/**
 * React hook to listen to stage clock state in confidence display components.
 */
export function useStageClockSync(initialState?: StageClockState): StageClockState {
  const [state, setState] = useState<StageClockState>(
    initialState || getLatestStageClockState() || DEFAULT_STAGE_CLOCK_STATE
  );

  useEffect(() => {
    const unsubscribe = subscribeStageClock((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  return state;
}

/**
 * Opens a dedicated Stage Confidence Clock window.
 * Supports Tauri v2 WebviewWindow when available, falling back to window.open.
 */
export async function openStageClockWindow(): Promise<Window | null> {
  if (typeof window === 'undefined') return null;

  // Check if running inside Tauri environment
  if ('__TAURI_INTERNALS__' in window || '__TAURI__' in window) {
    try {
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      const winLabel = 'stage-clock';

      // Check if already opened
      const existing = await WebviewWindow.getByLabel(winLabel);
      if (existing) {
        await existing.setFocus();
        return null;
      }

      new WebviewWindow(winLabel, {
        url: `${window.location.origin}${window.location.pathname}?view=stage-clock`,
        title: 'Light Stage — Màn hình Sân khấu (Confidence Clock)',
        width: 1024,
        height: 768,
        minWidth: 640,
        minHeight: 480,
        center: true,
      });
      return null;
    } catch {
      // Fallback to window.open if Tauri WebviewWindow fails
    }
  }

  // Web Browser fallback
  const url = `${window.location.origin}${window.location.pathname}?view=stage-clock`;
  const win = window.open(
    url,
    'LightStageConfidenceClock',
    'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
  );

  if (win) {
    win.focus();
  }
  return win;
}
