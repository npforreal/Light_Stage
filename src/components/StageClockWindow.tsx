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
  const [layoutMode, setLayoutMode] = useState<'standard' | 'mc'>('standard');

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
  let badgeBgClass = 'bg-surface-2 text-content-2 border-border-default';

  if (isOverrun) {
    timerColorClass = 'text-status-danger animate-pulse drop-shadow-[0_0_35px_rgba(241,77,76,0.6)]';
    badgeBgClass = 'bg-status-danger/20 text-status-danger border-status-danger animate-pulse';
  } else if (isGo) {
    timerColorClass = 'text-status-go drop-shadow-[0_0_35px_rgba(101,200,107,0.5)]';
    badgeBgClass = 'bg-status-go/20 text-status-go border-status-go';
  } else if (isHold) {
    timerColorClass = 'text-status-standby drop-shadow-[0_0_25px_rgba(233,171,43,0.4)]';
    badgeBgClass = 'bg-status-standby/20 text-status-standby border-status-standby';
  } else if (state.cueStatus === 'Standby') {
    timerColorClass = 'text-status-standby';
    badgeBgClass = 'bg-status-standby/20 text-status-standby border-status-standby';
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
      <header className="flex items-center justify-between px-6 py-4 border-b border-border-default/80 bg-surface-1/90 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-status-danger animate-ping" />
            <span className="text-xs font-bold tracking-widest uppercase text-content-3">
              STAGE CONFIDENCE MONITOR
            </span>
          </div>
          <span className="text-border-default">|</span>
          <span className="text-base font-semibold text-content-2 truncate max-w-[320px] sm:max-w-[480px]">
            {state.showTitle || 'Light Stage'}
          </span>
        </div>

        {/* Status Badge & Clocks */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div
            data-testid="stage-status-badge"
            className={`px-3 py-1 rounded-full border text-xs sm:text-sm font-black tracking-wider uppercase flex items-center gap-1.5 ${badgeBgClass}`}
          >
            {isOverrun && <AlertTriangle className="w-4 h-4 text-status-danger" />}
            {isGo && !isOverrun && <Play className="w-3.5 h-3.5 fill-current" />}
            {isHold && <Pause className="w-3.5 h-3.5" />}
            {!isGo && !isHold && !isOverrun && <Square className="w-3 h-3" />}
            <span>{isOverrun ? 'OVERRUN' : state.cueStatus.toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-2 text-content-3 font-mono text-sm sm:text-base border-l border-border-default pl-4 sm:pl-6">
            <Clock className="w-4 h-4 text-content-3" />
            <span data-testid="wall-clock" className="font-bold text-content-1">
              {wallClock || '--:--:--'}
            </span>
          </div>

          <div className="flex items-center rounded-lg bg-surface-2 border border-border-default p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLayoutMode('standard')}
              className={`px-2.5 py-1 rounded transition-colors ${
                layoutMode === 'standard' ? 'bg-surface-3 text-content-1 font-bold' : 'text-content-3 hover:text-content-1'
              }`}
              title="Chế độ đồng hồ đếm ngược tiêu chuẩn"
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('mc')}
              className={`px-2.5 py-1 rounded transition-colors ${
                layoutMode === 'mc' ? 'bg-accent text-surface-0 font-bold shadow' : 'text-content-3 hover:text-content-1'
              }`}
              title="Chế độ MC / Sân khấu: hiện cue hiện tại, kế tiếp, ghi chú và chỉ dẫn"
            >
              MC / Stage
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            title="Nhấn F để bật/tắt toàn màn hình"
            className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border-default/60 text-content-2 hover:text-content-1 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              aria-label="Đóng cửa sổ"
              className="px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-content-2 hover:text-content-1 text-sm font-medium transition-colors"
            >
              Đóng
            </button>
          )}
        </div>
      </header>

      {/* Main Focus Area: Giant Countdown & Active Cue */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-2 relative">
        {layoutMode === 'mc' ? (
          <div className="w-full max-w-6xl h-full flex flex-col justify-between py-4 space-y-4">
            {/* Top row: Current Cue + Next Cue side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-status-go/60 bg-status-go/10 p-5 shadow-lg">
                <span className="text-xs font-black uppercase tracking-widest text-status-go">
                  ĐANG DIỄN / NOW LIVE
                </span>
                <div className="text-xl sm:text-2xl font-mono text-status-go font-bold mt-1">
                  {state.activeCueNumber ? `CUE ${state.activeCueNumber}` : '—'}
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white mt-1 leading-tight line-clamp-2">
                  {state.activeCueTitle || 'Chưa bắt đầu'}
                </h2>
              </div>

              <div className="rounded-2xl border border-border-default bg-surface-2/60 p-5 shadow-lg">
                <span className="text-xs font-black uppercase tracking-widest text-status-standby">
                  TIẾP THEO / NEXT UP
                </span>
                <div className="text-xl sm:text-2xl font-mono text-status-standby font-bold mt-1">
                  {state.standbyCueNumber ? `CUE ${state.standbyCueNumber}` : '—'}
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-content-1 mt-1 leading-tight line-clamp-2">
                  {state.standbyCueTitle || 'Hết kịch bản'}
                </h3>
              </div>
            </div>

            {/* Giant Timer Center */}
            <div className="flex flex-col items-center justify-center my-auto">
              <div
                data-testid="giant-countdown"
                className={`font-mono font-black tabular-nums tracking-tighter text-[16vw] sm:text-[14vw] md:text-[12vw] leading-none transition-colors select-all ${timerColorClass}`}
              >
                {formattedCountdown}
              </div>
              {isOverrun && (
                <div className="mt-2 rounded-xl bg-status-danger text-surface-0 font-black tracking-widest text-base sm:text-2xl uppercase px-6 py-2 flex items-center gap-2 animate-bounce shadow-xl">
                  <AlertTriangle className="w-8 h-8" /> ĐÃ VƯỢT QUÁ GIỜ (OVERRUN)
                </div>
              )}
            </div>

            {/* Stage / Action Direction Notes for MC */}
            <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-1.5 mb-1">
                <span>CHỈ DẪN DIỄN XUẤT / STAGE DIRECTION:</span>
              </div>
              <p className="text-base sm:text-xl font-medium text-content-1 leading-snug">
                {state.activeCueDirectionNotes || 'Chưa có chỉ dẫn sân khấu cụ thể cho cue này.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Standard Layout */}
            {/* Active Cue Label */}
            <div className="text-center mb-2 max-w-5xl">
              <div className="text-sm sm:text-base md:text-lg font-bold tracking-wider uppercase text-content-3 mb-1">
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
                  className="mt-2 text-status-danger font-bold tracking-widest text-base sm:text-xl uppercase flex items-center gap-2"
                >
                  <AlertTriangle className="w-6 h-6" /> VƯỢT QUÁ THỜI LƯỢNG QUY ĐỊNH
                </div>
              )}
            </div>

            {/* Auxiliary Show Clocks (Delta & Elapsed) */}
            <div className="flex items-center gap-6 sm:gap-12 mt-2 px-6 py-2.5 rounded-2xl bg-surface-1/80 border border-border-default/80">
              <div className="text-center">
                <div className="text-xs font-semibold text-content-3 uppercase tracking-wider">Show Time</div>
                <div data-testid="master-elapsed-time" className="font-mono text-lg sm:text-2xl font-bold text-content-1">
                  {formatDuration(state.masterElapsedMs)}
                </div>
              </div>
              <div className="h-8 w-px bg-border-default" />
              <div className="text-center">
                <div className="text-xs font-semibold text-content-3 uppercase tracking-wider">Show Delta</div>
                <div
                  data-testid="show-delta-time"
                  className={`font-mono text-lg sm:text-2xl font-bold ${
                    state.deltaMs > 0
                      ? 'text-status-danger'
                      : state.deltaMs < 0
                      ? 'text-status-go'
                      : 'text-content-2'
                  }`}
                >
                  {formattedDelta}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer Banner: Standby / Next Upcoming Cue */}
      <footer className="shrink-0 px-8 py-4 bg-surface-1 border-t border-border-default/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-status-standby/20 text-status-standby border border-status-standby/40 font-black text-xs tracking-wider uppercase">
            STANDBY TIẾP THEO
          </span>
          <span
            data-testid="standby-cue-title"
            className="text-base sm:text-xl font-bold text-content-1 truncate max-w-2xl"
          >
            {state.standbyCueNumber ? `[${state.standbyCueNumber}] ` : ''}
            {state.standbyCueTitle || '— (Hết danh sách)'}
          </span>
        </div>
        <div className="hidden sm:block text-xs text-content-3 font-mono">
          Phím tắt: [F] Toàn màn hình
        </div>
      </footer>
    </div>
  );
};

export default StageClockWindow;
