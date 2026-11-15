import React, { useState, useEffect } from 'react';
import { useShowStore } from './store/useShowStore';
import { useClockStore, formatDuration } from './store/useClockStore';
import { RundownTable } from './components/rundown/RundownTable';
import { TimelineTracks } from './components/timeline/TimelineTracks';
import { ImportModal } from './components/importer/ImportModal';
import { exportToLightStageBlob } from './services/persistence';
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
} from 'lucide-react';

export type ViewMode = 'rundown' | 'timeline' | 'split';

export const App: React.FC = () => {
  const show = useShowStore((s) => s.show);
  const getDeviceStats = useShowStore((s) => s.getDeviceStats);
  const activeCue = useShowStore((s) => s.getActiveCue());
  const standbyCue = useShowStore((s) => s.getStandbyCue());
  const goCue = useShowStore((s) => s.goCue);
  const nextCue = useShowStore((s) => s.nextCue);

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

  const stats = getDeviceStats();

  // Clock ticker engine: ticks smoothly every 100ms
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      tick(100);
    }, 100);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  // Keyboard Shortcuts: Space = GO, B = Standby / Next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return; // Don't intercept when user is typing in inputs
      }

      if (e.code === 'Space') {
        e.preventDefault();
        goCue();
        startClock();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        nextCue();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goCue, nextCue, startClock]);

  const handleExportProject = () => {
    const blob = exportToLightStageBlob(show);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${show.metadata.title.replace(/\s+/g, '_')}.lightstage`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur z-30 flex-shrink-0">
        {/* Brand & Show Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-sm shadow">
            LS
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide text-sm text-white">
                Light Stage
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400 font-mono">
                v0.1.0
              </span>
            </div>
            <span className="text-[11px] text-slate-400 truncate max-w-[200px]" title={show.metadata.title}>
              {show.metadata.title}
            </span>
          </div>
        </div>

        {/* Master Clock & Calling Readout */}
        <div className="flex items-center gap-6">
          {/* Active Cue Quick Card */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1 text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Standby
              </span>
              <span className="font-semibold text-amber-400 truncate max-w-[120px]">
                {standbyCue ? `${standbyCue.cueNumber} ${standbyCue.title}` : 'None'}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Active Go
              </span>
              <span className="font-semibold text-emerald-400 truncate max-w-[120px]">
                {activeCue ? `${activeCue.cueNumber} ${activeCue.title}` : 'None'}
              </span>
            </div>
          </div>

          {/* Master & Cue Clock Readout */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1 font-mono">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-500">Show Time</span>
              <span className="text-sm font-bold text-cyan-300">
                {formatDuration(masterElapsedMs, { includeHours: true })}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-500">Cue Remainder</span>
              <span
                className={`text-sm font-bold ${
                  isOverrun ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {formatDuration(cueRemainingMs)}
              </span>
            </div>
          </div>

          {/* Clock Transport Controls */}
          <div className="flex items-center gap-1 bg-slate-800/60 rounded-lg p-0.5">
            {isRunning ? (
              <button
                onClick={pauseClock}
                className="rounded p-1.5 text-amber-400 hover:bg-slate-700 transition-colors"
                title="Pause Clock"
              >
                <Pause className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={startClock}
                className="rounded p-1.5 text-emerald-400 hover:bg-slate-700 transition-colors"
                title="Start Clock"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
              </button>
            )}
            <button
              onClick={pauseClock}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-700 transition-colors"
              title="Stop Clock"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={resetClock}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-700 transition-colors"
              title="Reset Clock"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* View Mode Switcher & Stats */}
        <div className="flex items-center gap-4">
          {/* Hardware Stats Badges */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-amber-400" title="Total Lighting Fixtures">
              <Lightbulb className="h-3.5 w-3.5" />
              <span>LX: {stats.totalLightingFixtures}</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-400" title="Total Screens">
              <Tv className="h-3.5 w-3.5" />
              <span>VX: {stats.totalScreens}</span>
            </div>
          </div>

          {/* Dual View Modes */}
          <div className="inline-flex rounded-lg bg-slate-800/80 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('rundown')}
              className={`flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${
                viewMode === 'rundown'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
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
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
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
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Timeline Tracks"
            >
              <Columns className="h-3.5 w-3.5 rotate-90" />
              <span>Timeline</span>
            </button>
          </div>

          {/* Import / Export Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
              title="Import CSV/Excel"
            >
              <Upload className="h-3.5 w-3.5 text-cyan-400" />
              <span>Import</span>
            </button>
            <button
              onClick={handleExportProject}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
              title="Export .lightstage file"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </header>

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

        {viewMode === 'split' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Top: Rundown Table */}
            <div className="flex-[3] border-b border-slate-800 overflow-hidden">
              <RundownTable />
            </div>
            {/* Bottom: Timeline Tracks */}
            <div className="flex-[2] overflow-hidden">
              <TimelineTracks />
            </div>
          </div>
        )}
      </main>

      {/* Import Modal */}
      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  );
};

export default App;
