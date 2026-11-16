import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, Clock, AlertTriangle, Play, Pause, Square } from 'lucide-react';
import {
  StageClockState,
  DEFAULT_STAGE_CLOCK_STATE,
  useStageClockSync,
} from '../services/stageClockSync';
import { formatDuration } from '../store/useClockStore';

export interface StageClockWindowProps {
  initialState?: StageClockState;
  overrideState?: StageClockState;
  onClose?: () => void;
}

export const StageClockWindow: React.FC<StageClockWindowProps> = ({
  initialState,
  overrideState,
  onClose,
}) => {
  const syncedState = useStageClockSync(initialState);
  const state = overrideState || syncedState || DEFAULT_STAGE_CLOCK_STATE;

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [wallClock, setWallClock] = useState<string>('');

  // Update wall clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setWallClock(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Track Fullscreen state and handle 'F' keyboard shortcut
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle fullscreen on 'F' key if not typing in input
      if ((e.key === 'f' || e.key === 'F') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch {
      // Handle browser permission restrictions
    }
  };

  // Format main countdown timer
  const formattedCountdown = formatDuration(state.cueRemainingMs);

  // Status visual cues
  const isOverrun = state.isOverrun || state.cueRemainingMs < 0;
  const isGo = state.cueStatus === 'Go' || (state.isRunning && !state.isPaused);
  const isHold = state.cueStatus === 'Hold' || state.isPaused;

  // Color theme for giant timer
  let timerColorClass = 'text-white';
  let badgeBgClass = 'bg-zinc-800 text-zinc-300 border-zinc-700';

  if (isOverrun) {
    timerColorClass = 'text-rose-500 animate-pulse drop-shadow-[0_0_35px_rgba(244,63,94,0.6)]';
    badgeBgClass = 'bg-rose-950/80 text-rose-300 border-rose-600 animate-pulse';
  } else if (isGo) {
    timerColorClass = 'text-emerald-400 drop-shadow-[0_0_35px_rgba(16,185,129,0.5)]';
    badgeBgClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-600';
  } else if (isHold) {
    timerColorClass = 'text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.4)]';
    badgeBgClass = 'bg-amber-950/80 text-amber-300 border-amber-600';
  } else if (state.cueStatus === 'Standby') {
    timerColorClass = 'text-amber-300';
    badgeBgClass = 'bg-yellow-950/80 text-yellow-300 border-yellow-600';
  }

  // Format delta
  const deltaSign = state.deltaMs > 0 ? '+' : '';
  const formattedDelta = `${deltaSign}${formatDuration(state.deltaMs)}`;

  return (
    <div
      data-testid="stage-confidence-clock"
      className="flex flex-col h-screen w-screen bg-black text-white select-none overflow-hidden font-sans"
    >
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/90 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-400">
              STAGE CONFIDENCE MONITOR
            </span>
          </div>
          <span className="text-zinc-700">|</span>
          <span className="text-base font-semibold text-zinc-300 truncate max-w-[320px] sm:max-w-[480px]">
            {state.showTitle || 'Light Stage'}
          </span>
        </div>

        {/* Status Badge & Clocks */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div
            data-testid="stage-status-badge"
            className={`px-3 py-1 rounded-full border text-xs sm:text-sm font-black tracking-wider uppercase flex items-center gap-1.5 ${badgeBgClass}`}
          >
            {isOverrun && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {isGo && !isOverrun && <Play className="w-3.5 h-3.5 fill-current" />}
            {isHold && <Pause className="w-3.5 h-3.5" />}
            {!isGo && !isHold && !isOverrun && <Square className="w-3 h-3" />}
            <span>{isOverrun ? 'OVERRUN' : state.cueStatus.toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-2 text-zinc-400 font-mono text-sm sm:text-base border-l border-zinc-800 pl-4 sm:pl-6">
            <Clock className="w-4 h-4 text-zinc-500" />
            <span data-testid="wall-clock" className="font-bold text-zinc-200">
              {wallClock || '--:--:--'}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            title="Nhấn F để bật/tắt toàn màn hình"
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              aria-label="Đóng cửa sổ"
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
            >
              Đóng
            </button>
          )}
        </div>
      </header>

      {/* Main Focus Area: Giant Countdown & Active Cue */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-2 relative">
        {/* Active Cue Label */}
        <div className="text-center mb-2 max-w-5xl">
          <div className="text-sm sm:text-base md:text-lg font-bold tracking-wider uppercase text-zinc-400 mb-1">
            {state.activeCueNumber ? `CUE ${state.activeCueNumber}` : 'TIẾT MỤC ĐANG DIỄN'}
          </div>
          <h1
            data-testid="active-cue-title"
            className="text-2xl sm:text-4xl md:text-6xl font-black text-white tracking-tight leading-tight line-clamp-2"
          >
            {state.activeCueTitle || 'Chưa bắt đầu'}
          </h1>
        </div>

        {/* Giant Countdown Clock */}
        <div className="my-auto py-2 flex flex-col items-center justify-center">
          <div
            data-testid="giant-countdown"
            className={`font-mono font-black tabular-nums tracking-tighter text-[20vw] sm:text-[18vw] md:text-[15vw] leading-none transition-colors select-all ${timerColorClass}`}
          >
            {formattedCountdown}
          </div>
          {isOverrun && (
            <div
              data-testid="overrun-alert-label"
              className="mt-2 text-rose-400 font-bold tracking-widest text-base sm:text-xl uppercase flex items-center gap-2"
            >
              <AlertTriangle className="w-6 h-6" /> VƯỢT QUÁ THỜI LƯỢNG QUY ĐỊNH
            </div>
          )}
        </div>

        {/* Auxiliary Show Clocks (Delta & Elapsed) */}
        <div className="flex items-center gap-6 sm:gap-12 mt-2 px-6 py-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
          <div className="text-center">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Show Time</div>
            <div data-testid="master-elapsed-time" className="font-mono text-lg sm:text-2xl font-bold text-zinc-200">
              {formatDuration(state.masterElapsedMs)}
            </div>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="text-center">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Show Delta</div>
            <div
              data-testid="show-delta-time"
              className={`font-mono text-lg sm:text-2xl font-bold ${
                state.deltaMs > 0
                  ? 'text-rose-400'
                  : state.deltaMs < 0
                  ? 'text-emerald-400'
                  : 'text-zinc-300'
              }`}
            >
              {formattedDelta}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Banner: Standby / Next Upcoming Cue */}
      <footer className="shrink-0 px-8 py-4 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60 font-black text-xs tracking-wider uppercase">
            STANDBY TIẾP THEO
          </span>
          <span
            data-testid="standby-cue-title"
            className="text-base sm:text-xl font-bold text-zinc-200 truncate max-w-2xl"
          >
            {state.standbyCueNumber ? `[${state.standbyCueNumber}] ` : ''}
            {state.standbyCueTitle || '— (Hết danh sách)'}
          </span>
        </div>
        <div className="hidden sm:block text-xs text-zinc-500 font-mono">
          Phím tắt: [F] Toàn màn hình
        </div>
      </footer>
    </div>
  );
};

export default StageClockWindow;
