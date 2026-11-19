import React, { useState, useEffect, useRef } from 'react';
import { useShowStore } from './store/useShowStore';
import { useClockStore } from './store/useClockStore';
import {
  saveAutoSave,
  loadAutoSaveProject,
  hasAutoSave,
  getAutoSaveMeta,
  clearAutoSave,
  parseLightStageFile,
  AutoSaveMeta,
} from './services/persistence';
import { useStageStore } from './store/useStageStore';
import { useVisualStore } from './store/useVisualStore';
import { broadcastStageClock } from './services/stageClockSync';
import { Header, ViewMode } from './components/Header';
import { RundownTable } from './components/rundown/RundownTable';
import { TimelineTracks } from './components/timeline/TimelineTracks';
import { Stage3DView } from './components/stage/Stage3DView';
import { ImportModal } from './components/importer/ImportModal';
import { ExportModal } from './components/export/ExportModal';
import { HelpModal } from './components/HelpModal';
import { WelcomeModal, WELCOME_STORAGE_KEY } from './components/WelcomeModal';
import { StageClockWindow } from './components/StageClockWindow';
import { VxControlBar } from './components/stage/VxControlBar';
import { Lock } from 'lucide-react';

export const App: React.FC = () => {
  // Check if this window was opened as a dedicated Stage Confidence Clock
  const isStageClockStandalone =
    typeof window !== 'undefined' && window.location.search.includes('view=stage-clock');

  if (isStageClockStandalone) {
    return <StageClockWindow />;
  }

  const show = useShowStore((s) => s.show);
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
  const stageConfig = useStageStore((s) => s.config);

  const isRunning = useClockStore((s) => s.isRunning);
  const masterElapsedMs = useClockStore((s) => s.masterElapsedMs);
  const cueRemainingMs = useClockStore((s) => s.cueRemainingMs);
  const cueElapsedMs = useClockStore((s) => s.cueElapsedMs);
  const isOverrun = useClockStore((s) => s.isOverrun);
  const tick = useClockStore((s) => s.tick);

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isOperatorLocked, setIsOperatorLocked] = useState(false);
  const [wallClock, setWallClock] = useState(() => new Date().toLocaleTimeString());
  const [recoveryMeta, setRecoveryMeta] = useState<AutoSaveMeta | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // First-run welcome guide discovery
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const seen = localStorage.getItem(WELCOME_STORAGE_KEY);
        if (!seen) {
          setIsWelcomeOpen(true);
        }
      } catch {
        // Ignore localStorage error
      }
    }
  }, []);

  // Startup check: discover existing autosave and prompt user to recover
  useEffect(() => {
    if (hasAutoSave()) {
      const meta = getAutoSaveMeta();
      if (meta) {
        setRecoveryMeta(meta);
      }
    }
  }, []);

  // Debounced Autosave: saves after 1 second of inactivity whenever show or rig changes
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => {
      saveAutoSave(show, stageConfig);
      markSaved();
    }, 1000);
    return () => clearTimeout(timer);
  }, [show, isDirty, markSaved, stageConfig]);

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

  // Broadcast state to Stage Confidence Monitors whenever clock or cue changes
  useEffect(() => {
    const allCues = getAllCues();
    let deltaMs = 0;
    if (activeCue && allCues.length > 0) {
      const activeIdx = allCues.findIndex((c) => c.id === activeCue.id);
      if (activeIdx !== -1) {
        let plannedStartMs = 0;
        for (let i = 0; i < activeIdx; i++) {
          plannedStartMs += allCues[i].durationMs;
        }
        const actualStartMs = masterElapsedMs - cueElapsedMs;
        const cueOverrunMs = Math.max(0, cueElapsedMs - activeCue.durationMs);
        deltaMs = plannedStartMs - actualStartMs - cueOverrunMs;
      }
    }

    broadcastStageClock({
      showTitle: show.metadata.title,
      activeCueNumber: activeCue?.cueNumber,
      activeCueTitle: activeCue?.title,
      activeCueDirectionNotes:
        activeCue?.departments?.st?.actionDescription ||
        activeCue?.departments?.st?.notes ||
        activeCue?.notes,
      standbyCueNumber: standbyCue?.cueNumber,
      standbyCueTitle: standbyCue?.title,
      cueStatus: activeCue?.status || (standbyCue ? 'Standby' : 'Pending'),
      cueRemainingMs,
      cueElapsedMs,
      cueDurationMs: activeCue?.durationMs ?? 60000,
      masterElapsedMs,
      deltaMs,
      isOverrun,
      isRunning,
      isPaused: !isRunning && masterElapsedMs > 0,
    });
  }, [
    show.metadata.title,
    activeCue,
    standbyCue,
    cueRemainingMs,
    cueElapsedMs,
    masterElapsedMs,
    isOverrun,
    isRunning,
    getAllCues,
  ]);

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
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsHelpOpen(true);
      } else if (e.key === 'F1') {
        e.preventDefault();
        useVisualStore.getState().clearLayer('background');
      } else if (e.key === 'F2') {
        e.preventDefault();
        useVisualStore.getState().clearLayer('slide');
      } else if (e.key === 'F3') {
        e.preventDefault();
        useVisualStore.getState().clearLayer('overlay');
      } else if (e.key === 'F4') {
        e.preventDefault();
        useVisualStore.getState().clearAllVx();
      } else if (e.altKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        useVisualStore.getState().toggleFreezeVx();
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
        if (result.stage) {
          useStageStore.getState().setConfig(result.stage);
        }
      } else {
        alert(`Lỗi mở file .lightstage:\n${result.error || 'Dữ liệu file không hợp lệ'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-surface-0 text-content-1 overflow-hidden font-sans">
      {/* 2-Tier Redesigned Header */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        isOperatorLocked={isOperatorLocked}
        setIsOperatorLocked={setIsOperatorLocked}
        onOpenProject={handleOpenProjectClick}
        onImportClick={() => setIsImportOpen(true)}
        onExportClick={() => setIsExportOpen(true)}
        onHelpClick={() => setIsHelpOpen(true)}
        wallClock={wallClock}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".lightstage,.json"
        className="hidden"
      />

      {/* Startup Recovery Notice Banner */}
      {recoveryMeta && (
        <div className="bg-cyan-950/95 border-b border-cyan-700 px-4 py-2 flex items-center justify-between text-xs text-cyan-100 z-40 flex-shrink-0">
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
                const recovered = loadAutoSaveProject();
                if (recovered) {
                  loadShow(recovered.show);
                  if (recovered.stage) {
                    useStageStore.getState().setConfig(recovered.stage);
                  }
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
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-1.5 flex items-center justify-between text-xs font-bold text-amber-300 z-30 flex-shrink-0">
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

      {/* Visual LED (VX) Live Panic & Output Control Bar */}
      <VxControlBar />

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
            <Stage3DView />
          </div>
        )}

        {viewMode === 'split' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Top: Rundown Table */}
            <div className="flex-[3] border-b border-border-default overflow-hidden">
              <RundownTable />
            </div>
            {/* Bottom: Timeline Tracks */}
            <div className="flex-[2] overflow-hidden">
              <TimelineTracks />
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
        onLoadSample={() => setIsImportOpen(true)}
      />
    </div>
  );
};

export default App;
