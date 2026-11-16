import React, { useState, useEffect, useRef } from 'react';
import { useShowStore } from './store/useShowStore';
import { useClockStore, formatDuration } from './store/useClockStore';
import {
  saveAutoSave,
  loadAutoSave,
  hasAutoSave,
  getAutoSaveMeta,
  clearAutoSave,
  parseLightStageFile,
  AutoSaveMeta,
} from './services/persistence';
import { RundownTable } from './components/rundown/RundownTable';
import { TimelineTracks } from './components/timeline/TimelineTracks';
import { VirtualStagePreview } from './components/stage/VirtualStagePreview';
import { ImportModal } from './components/importer/ImportModal';
import { ExportModal } from './components/export/ExportModal';
import {
  Lightbulb,
  Tv,
  Play,
  Pause,
  Square,
  RotateCcw,
  LayoutList,
  Columns,
  SplitSquareVertical,
  Upload,
  Download,
  FolderOpen,
  Eye,
  Lock,
  Unlock,
} from 'lucide-react';

export type ViewMode = 'rundown' | 'timeline' | 'stage' | 'split';

export const App: React.FC = () => {
  const show = useShowStore((s) => s.show);
  const getDeviceStats = useShowStore((s) => s.getDeviceStats);
  const isDirty = useShowStore((s) => s.isDirty);
  const markSaved = useShowStore((s) => s.markSaved);
  const loadShow = useShowStore((s) => s.loadShow);
  const activeCue = useShowStore((s) => s.getActiveCue());
  const standbyCue = useShowStore((s) => s.getStandbyCue());
  const goCue = useShowStore((s) => s.goCue);
  const nextCue = useShowStore((s) => s.nextCue);
  const prevCue = useShowStore((s) => s.prevCue);
  const holdCue = useShowStore((s) => s.holdCue);
  const getAllCues = useShowStore((s) => s.getAllCues);

  const isRunning = useClockStore((s) => s.isRunning);
  const masterElapsedMs = useClockStore((s) => s.masterElapsedMs);
  const cueRemainingMs = useClockStore((s) => s.cueRemainingMs);
  const isOverrun = useClockStore((s) => s.isOverrun);
  const startClock = useClockStore((s) => s.startClock);
  const pauseClock = useClockStore((s) => s.pauseClock);
  const resetClock = useClockStore((s) => s.resetClock);
  const tick = useClockStore((s) => s.tick);

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isOperatorLocked, setIsOperatorLocked] = useState(false);
  const [wallClock, setWallClock] = useState(() => new Date().toLocaleTimeString());
  const [recoveryMeta, setRecoveryMeta] = useState<AutoSaveMeta | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stats = getDeviceStats();

  // Startup check: discover existing autosave and prompt user to recover
  useEffect(() => {
    if (hasAutoSave()) {
      const meta = getAutoSaveMeta();
      if (meta) {
        setRecoveryMeta(meta);
      }
    }
  }, []);

  // Debounced Autosave: saves after 1 second of inactivity whenever show changes
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => {
      saveAutoSave(show);
      markSaved();
    }, 1000);
    return () => clearTimeout(timer);
  }, [show, isDirty, markSaved]);

  // Window exit protection: warn if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Wall clock ticker: updates every second
  useEffect(() => {
    const timer = setInterval(() => {
      setWallClock(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Show clock ticker engine: uses performance.now() to prevent drift when tab is backgrounded
  useEffect(() => {
    if (!isRunning) return;
    let lastTime = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;
      tick(delta);
    }, 100);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  // Delta Time calculation (Target cumulative duration vs actual elapsed)
  const deltaTimeMs = React.useMemo(() => {
    const allCues = getAllCues();
    if (!activeCue || allCues.length === 0) return 0;
    const activeIdx = allCues.findIndex((c) => c.id === activeCue.id);
    if (activeIdx === -1) return 0;

    // Delta relative to planned start time of the active cue plus any overrun
    let plannedStartMs = 0;
    for (let i = 0; i < activeIdx; i++) {
      plannedStartMs += allCues[i].durationMs;
    }
    const actualStartMs = masterElapsedMs - useClockStore.getState().cueElapsedMs;
    const cueOverrunMs = Math.max(0, useClockStore.getState().cueElapsedMs - activeCue.durationMs);
    return plannedStartMs - actualStartMs - cueOverrunMs;
  }, [getAllCues, activeCue, masterElapsedMs]);

  // Keyboard Shortcuts: Space/Enter = GO, B = Standby / Next, Arrows = Next/Prev, Esc = Hold/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOperatorLocked) return; // Prevent triggering hotkeys when locked

      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isContentEditable =
        document.activeElement?.getAttribute('contenteditable') === 'true' ||
        document.activeElement?.getAttribute('contenteditable') === '';

      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || isContentEditable) {
        return; // Don't intercept when user is typing
      }

      if (activeTag === 'button' && (e.code === 'Space' || e.code === 'Enter')) {
        (document.activeElement as HTMLElement)?.blur();
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        goCue();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        nextCue();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nextCue();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        prevCue();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        holdCue();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goCue, nextCue, prevCue, holdCue, isOperatorLocked]);

  const handleOpenProjectClick = () => {
    if (isDirty && typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm(
        'Dự án hiện tại có thay đổi chưa lưu. Bạn có chắc chắn muốn mở file dự án khác không?'
      );
      if (!confirmed) return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      const result = parseLightStageFile(content);
      if (result.success && result.data) {
        loadShow(result.data);
      } else {
        alert(`Lỗi mở file .lightstage:\n${result.error || 'Dữ liệu file không hợp lệ'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-surface-0 text-content-1 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="flex h-14 items-center justify-between border-b border-border-default bg-surface-1 px-4 backdrop-blur z-30 flex-shrink-0">
        {/* Brand & Show Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 border border-border-strong text-accent font-bold text-sm shadow">
            LS
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide text-sm text-content-1">
                Light Stage
              </span>
              <span className="rounded bg-surface-2 px-1.5 py-0.2 text-[10px] text-content-3 font-mono">
                v0.1.0
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-content-2 truncate max-w-[140px] sm:max-w-[200px]" title={show.metadata.title}>
                {show.metadata.title}
              </span>
              <span className="text-border-strong">•</span>
              {isDirty ? (
                <span className="flex items-center gap-1 text-[10px] text-status-standby font-mono font-medium" title="Có thay đổi chưa lưu">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-standby animate-pulse" />
                  Chưa lưu
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-content-3 font-mono font-medium" title="Đã lưu">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-go" />
                  Đã lưu
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Master Clock & Calling Readout */}
        <div className="flex items-center gap-2 lg:gap-4 xl:gap-6 min-w-0">
          {/* Active Cue Quick Card */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 bg-surface-2 border border-border-default rounded-lg px-2.5 py-1 text-xs flex-shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-content-3 font-bold">
                Standby
              </span>
              <span className="font-semibold text-status-standby truncate max-w-[90px] lg:max-w-[120px]">
                {standbyCue ? `${standbyCue.cueNumber} ${standbyCue.title}` : 'None'}
              </span>
            </div>
            <div className="h-6 w-px bg-border-subtle" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-content-3 font-bold">
                Active Go
              </span>
              <span className="font-semibold text-status-go truncate max-w-[90px] lg:max-w-[120px]">
                {activeCue ? `${activeCue.cueNumber} ${activeCue.title}` : 'None'}
              </span>
            </div>
          </div>

          {/* Master & Cue Clock Readout (Neutral Monospace) */}
          <div className="flex items-center gap-2 lg:gap-3 bg-surface-2 border border-border-default rounded-lg px-2.5 py-1 font-mono flex-shrink-0">
            {/* Wall Clock (hidden below xl) */}
            <div className="hidden xl:flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-content-3">Wall Clock</span>
              <span className="text-xs font-semibold text-content-2">
                {wallClock}
              </span>
            </div>
            <div className="hidden xl:block h-6 w-px bg-border-subtle" />
            {/* Show Elapsed (Neutral white/cyan) */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-content-3">Show Time</span>
              <span className="text-sm font-bold text-content-1">
                {formatDuration(masterElapsedMs, { includeHours: true })}
              </span>
            </div>
            <div className="h-6 w-px bg-border-subtle" />
            {/* Cue Remainder */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-content-3">Cue Remainder</span>
              <span
                className={`text-sm font-bold ${
                  isOverrun ? 'text-status-danger animate-pulse' : 'text-status-go'
                }`}
              >
                {formatDuration(cueRemainingMs)}
              </span>
            </div>
            <div className="h-6 w-px bg-border-subtle" />
            {/* Delta Schedule */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-content-3">Delta</span>
              <span
                className={`text-xs font-bold ${
                  deltaTimeMs < 0 ? 'text-status-danger' : deltaTimeMs > 0 ? 'text-content-1' : 'text-content-3'
                }`}
                title={deltaTimeMs < 0 ? 'Behind schedule' : 'Ahead of schedule'}
              >
                {deltaTimeMs > 0 ? `+${formatDuration(deltaTimeMs)}` : formatDuration(deltaTimeMs)}
              </span>
            </div>
          </div>

          {/* Clock Transport Controls */}
          <div className="flex items-center gap-1 bg-surface-2 border border-border-subtle rounded-lg p-0.5 flex-shrink-0">
            {isRunning ? (
              <button
                onClick={pauseClock}
                className="rounded p-1.5 text-status-standby hover:bg-surface-3 transition-colors"
                title="Pause Clock"
              >
                <Pause className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={startClock}
                className="rounded p-1.5 text-status-go hover:bg-surface-3 transition-colors"
                title="Start Clock"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
              </button>
            )}
            <button
              onClick={pauseClock}
              className="rounded p-1.5 text-content-3 hover:bg-surface-3 hover:text-content-1 transition-colors"
              title="Stop Clock"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={resetClock}
              className="rounded p-1.5 text-content-3 hover:bg-surface-3 hover:text-content-1 transition-colors"
              title="Reset Clock"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* View Mode Switcher & Stats */}
        <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
          {/* Hardware Stats Badges (visible on xl screens) */}
          <div className="hidden xl:flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-dept-lx" title="Total Lighting Fixtures">
              <Lightbulb className="h-3.5 w-3.5" />
              <span>LX: {stats.totalLightingFixtures}</span>
            </div>
            <div className="flex items-center gap-1.5 text-dept-vx" title="Total Screens">
              <Tv className="h-3.5 w-3.5" />
              <span>VX: {stats.totalScreens}</span>
            </div>
          </div>

          {/* Dual View Modes */}
          <div className="inline-flex rounded-lg bg-surface-2 border border-border-subtle p-0.5 text-xs">
            <button
              onClick={() => setViewMode('rundown')}
              className={`flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${
                viewMode === 'rundown'
                  ? 'bg-accent text-surface-0 font-bold shadow'
                  : 'text-content-2 hover:text-content-1'
              }`}
              title="Cue Rundown List"
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>Rundown</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${
                viewMode === 'split'
                  ? 'bg-accent text-surface-0 font-bold shadow'
                  : 'text-content-2 hover:text-content-1'
              }`}
              title="Split Dual View"
            >
              <SplitSquareVertical className="h-3.5 w-3.5" />
              <span>Dual</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-accent text-surface-0 font-bold shadow'
                  : 'text-content-2 hover:text-content-1'
              }`}
              title="Timeline Tracks"
            >
              <Columns className="h-3.5 w-3.5 rotate-90" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setViewMode('stage')}
              className={`flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${
                viewMode === 'stage'
                  ? 'bg-accent text-surface-0 font-bold shadow'
                  : 'text-content-2 hover:text-content-1'
              }`}
              title="Stage 2D Preview"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Stage 2D</span>
            </button>
          </div>

          {/* Operator Lock & Import / Export Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Operator Lock Toggle */}
            <button
              onClick={() => setIsOperatorLocked(!isOperatorLocked)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                isOperatorLocked
                  ? 'bg-status-standby text-surface-0 font-bold ring-2 ring-status-standby/50'
                  : 'bg-surface-2 hover:bg-surface-3 text-content-2 hover:text-content-1 border border-border-subtle'
              }`}
              title={isOperatorLocked ? 'Operator Locked: Hotkeys disabled' : 'Unlocked: Hotkeys active'}
            >
              {isOperatorLocked ? (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Locked</span>
                </>
              ) : (
                <>
                  <Unlock className="h-3.5 w-3.5 text-content-3" />
                  <span>Lock</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenProjectClick}
              className="inline-flex items-center gap-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-content-2 hover:text-content-1 border border-border-subtle px-2.5 py-1.5 text-xs font-semibold transition-colors"
              title="Open .lightstage Project"
            >
              <FolderOpen className="h-3.5 w-3.5 text-status-standby" />
              <span>Open</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              accept=".lightstage,.json"
              className="hidden"
            />
            <button
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-content-2 hover:text-content-1 border border-border-subtle px-2.5 py-1.5 text-xs font-semibold transition-colors"
              title="Import CSV/Excel"
            >
              <Upload className="h-3.5 w-3.5 text-accent" />
              <span>Import</span>
            </button>
            <button
              onClick={() => setIsExportOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-content-2 hover:text-content-1 border border-border-subtle px-2.5 py-1.5 text-xs font-semibold transition-colors"
              title="Export Reports & Project"
            >
              <Download className="h-3.5 w-3.5 text-status-go" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* Startup Recovery Notice Banner */}
      {recoveryMeta && (
        <div className="bg-cyan-950/95 border-b border-cyan-700 px-4 py-2 flex items-center justify-between text-xs text-cyan-100 z-40">
          <div className="flex items-center gap-2">
            <span className="font-bold text-cyan-300">Phát hiện bản tự động lưu:</span>
            <span>
              "{recoveryMeta.showTitle}" ({recoveryMeta.cueCount} cues) lưu lúc{' '}
              {new Date(recoveryMeta.savedAt).toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const recovered = loadAutoSave();
                if (recovered) {
                  loadShow(recovered);
                }
                setRecoveryMeta(null);
              }}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-1 rounded shadow transition-colors"
            >
              Khôi phục
            </button>
            <button
              onClick={() => {
                clearAutoSave();
                setRecoveryMeta(null);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded transition-colors"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      {/* Operator Lock Safety Banner */}
      {isOperatorLocked && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-1.5 flex items-center justify-between text-xs font-bold text-amber-300 z-30">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>CHẾ ĐỘ KHÓA VẬN HÀNH (OPERATOR LOCK): Toàn bộ phím tắt điều khiển đã được vô hiệu hóa để bảo đảm an toàn live show.</span>
          </div>
          <button
            onClick={() => setIsOperatorLocked(false)}
            className="rounded bg-amber-500 text-slate-950 px-2.5 py-0.5 text-[11px] font-bold hover:bg-amber-400 transition-colors"
          >
            Mở khóa
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {viewMode === 'rundown' && (
          <div className="flex-1 overflow-hidden">
            <RundownTable />
          </div>
        )}

        {viewMode === 'timeline' && (
          <div className="flex-1 overflow-hidden">
            <TimelineTracks />
          </div>
        )}

        {viewMode === 'stage' && (
          <div className="flex-1 overflow-hidden">
            <VirtualStagePreview />
          </div>
        )}

        {viewMode === 'split' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Top: Rundown Table */}
            <div className="flex-[3] border-b border-slate-800 overflow-hidden">
              <RundownTable />
            </div>
            {/* Bottom: Timeline Tracks or Stage */}
            <div className="flex-[2] overflow-hidden">
              <TimelineTracks />
            </div>
          </div>
        )}
      </main>

      {/* Import & Export Modals */}
      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
};

export default App;
