/**
 * Stage Audio Synthesizer & Alert Service (Web Audio API)
 *
 * Provides synthesized audio cues without requiring any external audio files:
 * - Countdown beeps (880Hz at 5..1s, 1760Hz at 0s / GO)
 * - Cue Overrun warning beeps (440Hz double beep)
 * - Safe initialization handling browser autoplay restrictions
 * - Audio mute state management and graceful degradation
 */

let audioCtx: AudioContext | null = null;
let isAudioMuted = false;
let unlockListenersAttached = false;

// Audio parameters
export const AUDIO_FREQUENCIES = {
  COUNTDOWN_TICK: 880, // Hz for seconds 5..1
  COUNTDOWN_GO: 1760,  // Hz for GO (0s)
  OVERRUN_WARN: 440,   // Hz for overrun
} as const;

export const AUDIO_DURATIONS = {
  COUNTDOWN_TICK_MS: 80,
  COUNTDOWN_GO_MS: 200,
  OVERRUN_BEEP_MS: 80,
  OVERRUN_GAP_MS: 60,
} as const;

/**
 * Gets or initializes the singleton AudioContext instance safely.
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }
    try {
      audioCtx = new AudioContextClass();
    } catch {
      return null;
    }
  }

  // Auto-attach unlock listeners once if context starts in suspended state
  if (audioCtx && audioCtx.state === 'suspended' && !unlockListenersAttached) {
    attachUnlockListeners();
  }

  return audioCtx;
}

/**
 * Attempts to resume a suspended AudioContext (unlocking browser autoplay policies).
 */
export async function unlockAudio(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx.state === 'running';
  } catch {
    return false;
  }
}

/**
 * Attaches user gesture event listeners to unlock AudioContext on first interaction.
 */
function attachUnlockListeners() {
  if (typeof window === 'undefined' || unlockListenersAttached) return;

  const unlockHandler = async () => {
    await unlockAudio();
    if (audioCtx && audioCtx.state === 'running') {
      window.removeEventListener('click', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
      window.removeEventListener('pointerdown', unlockHandler);
      unlockListenersAttached = false;
    }
  };

  window.addEventListener('click', unlockHandler, { passive: true });
  window.addEventListener('keydown', unlockHandler, { passive: true });
  window.addEventListener('pointerdown', unlockHandler, { passive: true });
  unlockListenersAttached = true;
}

/**
 * Checks whether audio alerts are currently muted.
 */
export function isMuted(): boolean {
  return isAudioMuted;
}

/**
 * Sets the audio mute state.
 */
export function setMuted(muted: boolean): void {
  isAudioMuted = muted;
}

/**
 * Toggles the audio mute state.
 */
export function toggleMute(): boolean {
  isAudioMuted = !isAudioMuted;
  return isAudioMuted;
}

/**
 * Synthesizes and plays a single tone with an attack/decay envelope to prevent audio clicks/pops.
 */
export function playTone(
  frequency: number,
  durationMs: number,
  options?: {
    type?: OscillatorType;
    delayMs?: number;
    volume?: number;
  }
): boolean {
  if (isAudioMuted) return false;

  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'closed') return false;

  // If context is suspended, try to resume asynchronously
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const oscType = options?.type || 'sine';
    const delaySec = (options?.delayMs || 0) / 1000;
    const durationSec = durationMs / 1000;
    const peakVolume = Math.min(1, Math.max(0, options?.volume ?? 0.25));

    const startTime = ctx.currentTime + delaySec;
    const endTime = startTime + durationSec;

    osc.type = oscType;
    osc.frequency.setValueAtTime(frequency, startTime);

    // Smooth envelope: fast ramp up (5ms) and exponential-like ramp down
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakVolume, startTime + 0.005);
    gain.gain.linearRampToValueAtTime(0.0001, endTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(endTime);
    return true;
  } catch {
    return false;
  }
}

/**
 * Plays a countdown alert beep:
 * - 880Hz, 80ms for seconds 5, 4, 3, 2, 1
 * - 1760Hz, 200ms for GO (0s)
 */
export function playCountdownBeep(secondsLeft: number): boolean {
  if (isAudioMuted) return false;

  const sec = Math.round(secondsLeft);
  if (sec >= 1 && sec <= 5) {
    return playTone(AUDIO_FREQUENCIES.COUNTDOWN_TICK, AUDIO_DURATIONS.COUNTDOWN_TICK_MS, {
      type: 'sine',
      volume: 0.3,
    });
  } else if (sec === 0) {
    return playTone(AUDIO_FREQUENCIES.COUNTDOWN_GO, AUDIO_DURATIONS.COUNTDOWN_GO_MS, {
      type: 'sine',
      volume: 0.45,
    });
  }

  return false;
}

/**
 * Plays an overrun alert beep:
 * - Two 440Hz short beeps (double beep) warning the team that the cue has exceeded scheduled duration.
 */
export function playOverrunBeep(): boolean {
  if (isAudioMuted) return false;

  // First beep
  const beep1 = playTone(AUDIO_FREQUENCIES.OVERRUN_WARN, AUDIO_DURATIONS.OVERRUN_BEEP_MS, {
    type: 'triangle',
    volume: 0.35,
    delayMs: 0,
  });

  // Second beep
  const beep2 = playTone(AUDIO_FREQUENCIES.OVERRUN_WARN, AUDIO_DURATIONS.OVERRUN_BEEP_MS, {
    type: 'triangle',
    volume: 0.35,
    delayMs: AUDIO_DURATIONS.OVERRUN_BEEP_MS + AUDIO_DURATIONS.OVERRUN_GAP_MS,
  });

  return beep1 || beep2;
}

/**
 * Helper for testing or cleanup: closes and resets the active audio context.
 */
export async function closeAudioContextForTesting(): Promise<void> {
  if (audioCtx) {
    try {
      await audioCtx.close();
    } catch {
      // ignore
    }
    audioCtx = null;
  }
  isAudioMuted = false;
  unlockListenersAttached = false;
}
