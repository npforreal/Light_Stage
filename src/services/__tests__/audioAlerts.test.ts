import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  playCountdownBeep,
  playOverrunBeep,
  isMuted,
  setMuted,
  toggleMute,
  unlockAudio,
  getAudioContext,
  closeAudioContextForTesting,
  AUDIO_FREQUENCIES,
  AUDIO_DURATIONS,
} from '../audioAlerts';

describe('Audio Alerts Service (Web Audio API)', () => {
  let mockOscillator: any;
  let mockGain: any;
  let mockAudioContext: any;
  let originalAudioContext: any;

  beforeEach(() => {
    mockOscillator = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockAudioContext = {
      state: 'running',
      currentTime: 10,
      destination: {},
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGain),
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    originalAudioContext = window.AudioContext;
    (window as any).AudioContext = vi.fn(() => mockAudioContext);
    setMuted(false);
  });

  afterEach(async () => {
    await closeAudioContextForTesting();
    window.AudioContext = originalAudioContext;
    vi.restoreAllMocks();
  });

  describe('AudioContext initialization and unlock', () => {
    it('creates an AudioContext singleton when requested', () => {
      const ctx = getAudioContext();
      expect(ctx).toBe(mockAudioContext);
      expect(window.AudioContext).toHaveBeenCalledTimes(1);

      // Calling again should return cached instance
      const ctx2 = getAudioContext();
      expect(ctx2).toBe(mockAudioContext);
      expect(window.AudioContext).toHaveBeenCalledTimes(1);
    });

    it('gracefully handles missing AudioContext in unsupported environments', async () => {
      await closeAudioContextForTesting();
      (window as any).AudioContext = undefined;
      (window as any).webkitAudioContext = undefined;

      const ctx = getAudioContext();
      expect(ctx).toBeNull();

      // Calling play functions should not throw and return false
      expect(playCountdownBeep(5)).toBe(false);
      expect(playOverrunBeep()).toBe(false);
    });

    it('unlocks suspended audio context on user gesture', async () => {
      mockAudioContext.state = 'suspended';
      await unlockAudio();
      expect(mockAudioContext.resume).toHaveBeenCalled();
      // After resume, state can be updated to running
      mockAudioContext.state = 'running';
      expect(await unlockAudio()).toBe(true);
    });
  });

  describe('Mute / Unmute State', () => {
    it('initializes unmuted by default', () => {
      expect(isMuted()).toBe(false);
    });

    it('updates mute state via setMuted and toggleMute', () => {
      setMuted(true);
      expect(isMuted()).toBe(true);

      const toggled = toggleMute();
      expect(toggled).toBe(false);
      expect(isMuted()).toBe(false);

      toggleMute();
      expect(isMuted()).toBe(true);
    });

    it('does not play tones when muted', () => {
      setMuted(true);

      const resCountdown = playCountdownBeep(3);
      expect(resCountdown).toBe(false);
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();

      const resOverrun = playOverrunBeep();
      expect(resOverrun).toBe(false);
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe('Countdown Beeps', () => {
    it.each([5, 4, 3, 2, 1])('plays 880Hz tone for %i seconds remaining', (sec) => {
      const res = playCountdownBeep(sec);
      expect(res).toBe(true);
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
        AUDIO_FREQUENCIES.COUNTDOWN_TICK,
        expect.any(Number)
      );
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalledWith(
        mockAudioContext.currentTime + AUDIO_DURATIONS.COUNTDOWN_TICK_MS / 1000
      );
    });

    it('plays 1760Hz tone for 0 seconds remaining (GO)', () => {
      const res = playCountdownBeep(0);
      expect(res).toBe(true);
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
        AUDIO_FREQUENCIES.COUNTDOWN_GO,
        expect.any(Number)
      );
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalledWith(
        mockAudioContext.currentTime + AUDIO_DURATIONS.COUNTDOWN_GO_MS / 1000
      );
    });

    it('does not play countdown beep for seconds outside 0..5', () => {
      expect(playCountdownBeep(6)).toBe(false);
      expect(playCountdownBeep(10)).toBe(false);
      expect(playCountdownBeep(-1)).toBe(false);
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe('Overrun Warning Beeps', () => {
    it('plays double 440Hz beep when cue overruns', () => {
      const res = playOverrunBeep();
      expect(res).toBe(true);

      // Should create two oscillators for double beep
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
        AUDIO_FREQUENCIES.OVERRUN_WARN,
        expect.any(Number)
      );
    });
  });

  describe('Error Resilience', () => {
    it('catches and handles exceptions thrown during tone creation safely', () => {
      mockAudioContext.createOscillator.mockImplementation(() => {
        throw new Error('Web Audio hardware fault');
      });

      expect(() => playCountdownBeep(3)).not.toThrow();
      expect(playCountdownBeep(3)).toBe(false);
    });
  });
});
