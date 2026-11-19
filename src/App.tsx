import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useShowStore, attachGlobalShortcuts } from './store/useShowStore';
import { useClockStore } from './store/useClockStore';
import {
  saveAutoSave,
  loadAutoSaveProject,
  hasAutoSave,
  getAutoSaveMeta,
  clearAutoSave,
  readLightStageFile,
  downloadLightStageFile,
  AUTOSAVE_FAILURE_MESSAGE as AUTOSAVE_ERROR_MESSAGE,
  AutoSaveMeta,
} from './services/persistence';
import { useStageStore } from './store/useStageStore';
import { useVisualStore } from './store/useVisualStore';
import { broadcastStageClock } from './services/stageClockSync';
import { isKeyboardProtected } from './services/shortcutRegistry';
import { Header, ViewMode } from './components/Header';
import { RundownTable } from './components/rundown/RundownTable';
import { TimelineTracks } from './components/timeline/TimelineTracks';
import { ImportModal } from './components/importer/ImportModal';
import { ExportModal } from './components/export/ExportModal';
import { HelpModal } from './components/HelpModal';
import { WelcomeModal, WELCOME_STORAGE_KEY } from './components/WelcomeModal';
import { StageClockWindow } from './components/StageClockWindow';
import { CueInspector } from './components/CueInspector';
import { Lock, AlertTriangle } from 'lucide-react';

// Stage 3D pulls in three.js (~550 kB). Keep it out of the startup chunk so
// GO / hotkeys stay responsive while the preview loads on demand (PLAN 16.5).
const Stage3DView = lazy(() =>
  import('./components/stage/Stage3DView').then((m) => ({ default: m.Stage3DView }))
);

/** Fixed-size placeholder so switching to Stage 3D never shifts the layout. */
const Stage3DLoadingSkeleton: React.FC = () => (
  <div
    className="flex h-full w-full flex-col bg-surface-0"
    data-testid="stage-3d-skeleton"
    aria-busy="true"
    aria-label="Đang tải sân khấu 3D"
  >
    <div className="h-9 flex-shrink-0 border-b border-border-default bg-surface-1 px-3 flex items-center gap-2">
      <div className="h-3 w-3 rounded-sm bg-surface-3 animate-pulse" />
      <div className="h-2.5 w-32 rounded bg-surface-3 animate-pulse" />
    </div>
    <div className="relative flex-1 overflow-hidden bg-gradient-to-b from-surface-1 to-surface-0">
      <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-content-3">
        Đang tải Sân khấu 3D…
      </div>
    </div>
  </div>
);

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
  const autosaveError = useShowStore((s) => s.autosaveError);
  const setAutosaveError = useShowStore((s) => s.setAutosaveError);
  const [wallClock, setWallClock] = useState(() => new Date().toLocaleTimeString());
  const [recoveryMeta, setRecoveryMeta] = useState<AutoSaveMeta | null>(null);
  const [isAutosaveBannerOpen, setIsAutosaveBannerOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const previousAutosaveError = useRef<string | null>(null);

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

  // Persist the show for Ctrl/Cmd+S. Returns true only when bytes were written.
  // Never calls markSaved() on a failed write: a lost project must stay "dirty".
  const persistNow = useCallback(() => {
    const ok = saveAutoSave(show, stageConfig);
    if (ok) {
      markSaved();
      setAutosaveError(null);
    } else {
      setAutosaveError(AUTOSAVE_ERROR_MESSAGE);
    }
    return ok;
  }, [show, stageConfig, markSaved, setAutosaveError]);

  // Debounced Autosave: saves after 1 second of inactivity whenever show or rig changes
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => {
      persistNow();
    }, 1000);
    return () => clearTimeout(timer);
  }, [isDirty, persistNow]);

  // Autosave failure banner: appears once per new error, disappears on recovery.
  useEffect(() => {
    if (autosaveError && previousAutosaveError.current !== autosaveError) {
      setIsAutosaveBannerOpen(true);
    }
    if (!autosaveError) {
      setIsAutosaveBannerOpen(false);
    }
    previousAutosaveError.current = autosaveError;
  }, [autosaveError]);

  const handleSaveProjectFile = () => {
    downloadLightStageFile(show, stageConfig);
    markSaved();
    setAutosaveError(null);
    setIsAutosaveBannerOpen(false);
  };

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

  // Global undo/redo/save shortcuts (no lock guard: they are not cue commands)
  useEffect(() => {
    return attachGlobalShortcuts(window, { onSave: persistNow });
  }, [persistNow]);

  // Keyboard Shortcuts: Space/Enter = GO, B = Standby / Next, Arrows = Next/Prev, Esc = Hold/Pause
  // Operator Lock only blocks the cue group below; Help / Inspector / VX panic stay live.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isKeyboardProtected(e)) {
        return; // Don't intercept when user is typing
      }

      // --- Group 1: always available, even when the operator is locked ---
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsHelpOpen(true);
        return;
      }
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        useShowStore.getState().toggleInspector();
        return;
      }
      // VX panic is the live-show escape hatch: never lock it out.
      if (e.key === 'F1') {
        e.preventDefault();
        useVisualStore.getState().clearLayer('background');
        return;
      }
      if (e.key === 'F2') {
        e.preventDefault();
        useVisualStore.getState().clearLayer('slide');
        return;
      }
      if (e.key === 'F3') {
        e.preventDefault();
        useVisualStore.getState().clearLayer('overlay');
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        useVisualStore.getState().clearAllVx();
        return;
      }
      if (e.altKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        useVisualStore.getState().toggleFreezeVx();
        return;
      }

      // --- Group 2: Operator Lock blocks cue commands below this line ---
      if (isOperatorLocked) return;

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

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Always clear the input so picking the same file again re-triggers change.
    e.target.value = '';

    const result = await readLightStageFile(file);
    if (result.success && result.data) {
      loadShow(result.data);
      if (result.stage) {
        useStageStore.getState().setConfig(result.stage);
      }
      setImportError(null);
    } else {
      // Reading never throws; surface the exact path to the operator and keep
      // the currently open project untouched.
      setImportError(result.error || 'Dữ liệu file không hợp lệ');
    }
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

      {/* Autosave Failure Banner — one-shot, actionable, keeps the dirty warning */}
      {autosaveError && isAutosaveBannerOpen && (
        <div
          role="alert"
          data-testid="autosave-error-banner"
          className="bg-status-danger/15 border-b border-status-danger/40 px-4 py-1.5 flex items-center justify-between gap-3 text-xs text-status-danger z-40 flex-shrink-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span className="font-bold truncate">{AUTOSAVE_ERROR_MESSAGE}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleSaveProjectFile}
              className="rounded bg-status-danger text-surface-0 px-2.5 py-0.5 text-[11px] font-bold hover:opacity-90"
            >
              Lưu file .lightstage
            </button>
            <button
              type="button"
              onClick={() => setIsAutosaveBannerOpen(false)}
              aria-label="Đóng cảnh báo lỗi lưu"
              className="rounded px-2 py-0.5 text-[11px] font-semibold text-content-2 hover:bg-surface-2"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Operator Lock Safety Banner */}
      {isOperatorLocked && (
        <div className="bg-status-standby/15 border-b border-status-standby/40 px-4 py-1.5 flex items-center justify-between text-xs font-bold text-status-standby z-30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-status-standby animate-pulse" />
            <span>CHẾ ĐỘ KHÓA VẬN HÀNH (OPERATOR LOCK): Các lệnh gọi cue đã bị vô hiệu hóa. Phím tắt xem/trợ giúp, lưu và VX panic vẫn hoạt động.</span>
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
              <Suspense fallback={<Stage3DLoadingSkeleton />}>
                <Stage3DView />
              </Suspense>
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

      {/* Import Failure Modal — exact reason + recovery path, project untouched */}
      {importError && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-surface-0/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-error-title"
          data-testid="import-error-modal"
        >
          <div className="w-full max-w-md rounded border border-status-danger/40 bg-surface-1 p-5 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-status-danger" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h2 id="import-error-title" className="text-sm font-bold text-content-1">
                  Không mở được dự án
                </h2>
                <p className="mt-1 break-words text-xs text-content-2">{importError}</p>
                <p className="mt-2 text-xs text-content-3">
                  Chọn lại file hoặc mở bản autosave. Dự án đang mở vẫn giữ nguyên.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setImportError(null);
                  fileInputRef.current?.click();
                }}
                className="rounded bg-accent px-3 py-1.5 text-xs font-bold text-surface-0 hover:opacity-90"
              >
                Chọn file khác
              </button>
              <button
                type="button"
                onClick={() => setImportError(null)}
                className="rounded bg-surface-2 px-3 py-1.5 text-xs font-bold text-content-2 hover:bg-surface-3"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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
