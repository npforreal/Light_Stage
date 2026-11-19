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
import { isKeyboardProtected } from './services/shortcutRegistry';
import { Header, ViewMode } from './components/Header';
import { RundownTable } from './components/rundown/RundownTable';
import { TimelineTracks } from './components/timeline/TimelineTracks';
import { Stage3DView } from './components/stage/Stage3DView';
import { ImportModal } from './components/importer/ImportModal';
import { ExportModal } from './components/export/ExportModal';
import { HelpModal } from './components/HelpModal';
import { WelcomeModal, WELCOME_STORAGE_KEY } from './components/WelcomeModal';
import { StageClockWindow } from './components/StageClockWindow';
import { CueInspector } from './components/CueInspector';
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
  const isOperatorLocked = useShowStore((s) => s.isOperatorLocked);
  const setOperatorLocked = useShowStore((s) => s.setOperatorLocked);
  const isInspectorOpen = useShowStore((s) => s.isInspectorOpen);
  const toggleInspector = useShowStore((s) => s.toggleInspector);
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

      if (isKeyboardProtected(e)) {
        return; // Don't intercept when user is typing
      }

      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'button' && (e.code === 'Space' || e.code === 'Enter')) {
        (document.activeElement as HTMLElement)?.blur();
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        useShowStore.getState().goCue();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        useShowStore.getState().nextCue();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        useShowStore.getState().nextCue();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        useShowStore.getState().prevCue();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        useShowStore.getState().holdCue();
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsHelpOpen(true);
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        useShowStore.getState().toggleInspector();
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
      {/* Unified Command Header (Command Bar 52px + Workspace Strip 36px) */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        isOperatorLocked={isOperatorLocked}
        setIsOperatorLocked={setOperatorLocked}
        onOpenProject={handleOpenProjectClick}
        onImportClick={() => setIsImportOpen(true)}
        onExportClick={() => setIsExportOpen(true)}
        onHelpClick={() => setIsHelpOpen(true)}
        wallClock={wallClock}
        isInspectorOpen={isInspectorOpen}
        onToggleInspector={toggleInspector}
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
        <div className="bg-surface-1/95 border-b border-border-default px-4 py-2 flex items-center justify-between text-xs text-content-1 z-40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-accent">Phát hiện bản tự động lưu:</span>
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
              className="bg-accent hover:opacity-90 active:scale-[0.98] text-surface-0 font-bold px-3 py-1 rounded shadow transition-all"
            >
              Khôi phục
            </button>
            <button
              onClick={() => {
                clearAutoSave();
                setRecoveryMeta(null);
              }}
              className="bg-surface-2 hover:bg-surface-3 active:scale-[0.98] text-content-2 px-3 py-1 rounded transition-all"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      {/* Operator Lock Safety Banner */}
      {isOperatorLocked && (
        <div className="bg-status-standby/15 border-b border-status-standby/40 px-4 py-1.5 flex items-center justify-between text-xs font-bold text-status-standby z-30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-status-standby animate-pulse" />
            <span>CHẾ ĐỘ KHÓA VẬN HÀNH (OPERATOR LOCK): Toàn bộ phím tắt điều khiển đã được vô hiệu hóa để bảo đảm an toàn live show.</span>
          </div>
          <button
            onClick={() => setOperatorLocked(false)}
            className="rounded bg-status-standby text-surface-0 px-2.5 py-0.5 text-[11px] font-bold hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Mở khóa
          </button>
        </div>
      )}

      {/* Main Workspace Area with Right Inspector Drawer */}
      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex flex-1 flex-col overflow-hidden min-w-0">
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

        {/* Right Inspector Drawer */}
        <CueInspector />
      </div>

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
