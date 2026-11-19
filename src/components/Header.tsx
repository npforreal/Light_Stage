import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useShowStore } from '../store/useShowStore';
import { useClockStore, formatDuration } from '../store/useClockStore';
import { getCueLightingCount, getCueScreenCount } from '../services/fixtureModel';
import { isMuted, toggleMute } from '../services/audioAlerts';
import { openStageClockWindow } from '../services/stageClockSync';
import {
  Lightbulb,
  Tv,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  LayoutList,
  Columns,
  SplitSquareVertical,
  Upload,
  Download,
  FolderOpen,
  FilePlus,
  Eye,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Clock,
  HelpCircle,
  MoreHorizontal,
  Edit2,
  Check,
  Plus,
  PanelRight,
  AlertTriangle,
} from 'lucide-react';

export type ViewMode = 'rundown' | 'timeline' | 'stage' | 'split';
export type RoleFilter = 'ALL' | 'LX' | 'VX' | 'SQ' | 'ST';

/** Shared tooltip for cue-firing controls while Operator Lock is engaged. */
const LOCKED_CUE_TOOLTIP = 'Đang khóa — mở khóa để gọi cue';

export interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isOperatorLocked: boolean;
  setIsOperatorLocked: (locked: boolean) => void;
  onOpenProject: () => void;
  onImportClick: () => void;
  onExportClick: () => void;
  onHelpClick: () => void;
  wallClock: string;
  // Optional extensions for contextual workspace controls & inspector drawer
  isInspectorOpen?: boolean;
  onToggleInspector?: () => void;
  roleFilter?: RoleFilter;
  onRoleFilterChange?: (role: RoleFilter) => void;
  onAddCue?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  isOperatorLocked,
  setIsOperatorLocked,
  onOpenProject,
  onImportClick,
  onExportClick,
  onHelpClick,
  wallClock,
  isInspectorOpen,
  onToggleInspector,
  roleFilter,
  onRoleFilterChange,
  onAddCue,
}) => {
  const show = useShowStore((s) => s.show);
  const isDirty = useShowStore((s) => s.isDirty);
  const autosaveError = useShowStore((s) => s.autosaveError);
  const updateMetadata = useShowStore((s) => s.updateMetadata);
  const newShow = useShowStore((s) => s.newShow);
  const activeCue = useShowStore((s) => s.getActiveCue());
  const standbyCue = useShowStore((s) => s.getStandbyCue());
  const goCue = useShowStore((s) => s.goCue);
  const nextCue = useShowStore((s) => s.nextCue);
  const holdCue = useShowStore((s) => s.holdCue);
  const addCue = useShowStore((s) => s.addCue);
  const getAllCues = useShowStore((s) => s.getAllCues);

  const isRunning = useClockStore((s) => s.isRunning);
  const masterElapsedMs = useClockStore((s) => s.masterElapsedMs);
  const cueRemainingMs = useClockStore((s) => s.cueRemainingMs);
  const isOverrun = useClockStore((s) => s.isOverrun);
  const pauseClock = useClockStore((s) => s.pauseClock);
  const resetClock = useClockStore((s) => s.resetClock);

  const [isAudioMuted, setIsAudioMuted] = useState(() => isMuted());
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(show.metadata.title);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [localRoleFilter, setLocalRoleFilter] = useState<RoleFilter>(roleFilter ?? 'ALL');
  const [localInspectorOpen, setLocalInspectorOpen] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Live fixture counts on stage
  const liveLxCount = activeCue ? getCueLightingCount(activeCue) : 0;
  const liveVxCount = activeCue ? getCueScreenCount(activeCue) : 0;

  // Workspace summary counts & runtime
  const allCues = getAllCues();
  const totalCues = allCues.length;
  const totalRuntimeMs = useMemo(() => {
    return allCues.reduce((sum, c) => sum + c.durationMs, 0);
  }, [allCues]);

  // Sync role filter and inspector states
  const currentFilter = roleFilter ?? localRoleFilter;
  const storeInspectorOpen = (useShowStore as unknown as { getState: () => { isInspectorOpen?: boolean } })
    .getState()
    ?.isInspectorOpen;
  const isInspectorActive = isInspectorOpen ?? storeInspectorOpen ?? localInspectorOpen;

  useEffect(() => {
    setTitleDraft(show.metadata.title);
  }, [show.metadata.title]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isMoreMenuOpen]);

  const handleSaveTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== show.metadata.title) {
      updateMetadata({ title: trimmed });
    } else {
      setTitleDraft(show.metadata.title);
    }
    setIsEditingTitle(false);
  };

  const handleToggleMute = () => {
    const updated = toggleMute();
    setIsAudioMuted(updated);
  };

  const handleNewShow = () => {
    if (isDirty && typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm(
        'Dự án hiện tại có thay đổi chưa lưu. Bạn có muốn tạo show mới?'
      );
      if (!confirmed) return;
    }
    newShow('Dự Án Show Mới');
  };

  const handleOpenStageClock = () => {
    openStageClockWindow();
  };

  const handleFilterSelect = (role: RoleFilter) => {
    setLocalRoleFilter(role);
    onRoleFilterChange?.(role);
  };

  const handleAddCue = () => {
    if (onAddCue) {
      onAddCue();
      return;
    }
    if (show.acts.length > 0) {
      const actId = show.acts[0].id;
      addCue(actId, { title: 'New Cue' });
    }
  };

  const handleToggleInspector = () => {
    if (onToggleInspector) {
      onToggleInspector();
      return;
    }
    const storeToggle = (
      useShowStore.getState() as unknown as { toggleInspector?: () => void }
    ).toggleInspector;
    if (typeof storeToggle === 'function') {
      storeToggle();
      return;
    }
    setLocalInspectorOpen((prev) => !prev);
  };

  const modeTabs = [
    { id: 'rundown', label: 'Rundown', icon: <LayoutList className="h-3 w-3" aria-hidden="true" />, title: 'Cue Rundown List' },
    { id: 'split', label: 'Dual', icon: <SplitSquareVertical className="h-3 w-3" aria-hidden="true" />, title: 'Split Dual View' },
    { id: 'timeline', label: 'Timeline', icon: <Columns className="h-3 w-3 rotate-90" aria-hidden="true" />, title: 'Timeline Tracks' },
    { id: 'stage', label: 'Stage 3D', icon: <Eye className="h-3 w-3" aria-hidden="true" />, title: 'Stage 3D Preview' },
  ] as { id: ViewMode; label: string; icon: React.ReactNode; title: string }[];

  const handleModeListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const ids = modeTabs.map((t) => t.id);
    const idx = ids.indexOf(viewMode);
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (idx + delta + ids.length) % ids.length;
    setViewMode(ids[nextIndex]);
    const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons[nextIndex]?.focus();
  };

  // Delta Time calculation
  const deltaTimeMs = useMemo(() => {
    if (!activeCue || allCues.length === 0) return 0;
    const activeIdx = allCues.findIndex((c) => c.id === activeCue.id);
    if (activeIdx === -1) return 0;

    let plannedStartMs = 0;
    for (let i = 0; i < activeIdx; i++) {
      plannedStartMs += allCues[i].durationMs;
    }
    const actualStartMs = masterElapsedMs - useClockStore.getState().cueElapsedMs;
    const cueOverrunMs = Math.max(0, useClockStore.getState().cueElapsedMs - activeCue.durationMs);
    return plannedStartMs - actualStartMs - cueOverrunMs;
  }, [allCues, activeCue, masterElapsedMs]);

  return (
    <header className="flex flex-col border-b border-border-default bg-surface-1 z-50 flex-shrink-0">
      {/* ======================================================== */}
      {/* STRIP 1: COMMAND BAR (Exact Height: 52px / h-[52px])      */}
      {/* ======================================================== */}
      <div
        className="flex h-[52px] items-center justify-between px-3 lg:px-4 border-b border-border-subtle/60 gap-2 select-none"
        data-testid="header-command-bar"
      >
        {/* Left Zone: Compact Brand, Editable Title, Status Dot, Hardware Badges (~260px at 960px) */}
        <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
          {/* Brand Logo */}
          <div className="flex h-7 w-7 items-center justify-center rounded bg-surface-2 border border-border-strong text-accent font-bold text-xs  flex-shrink-0">
            LS
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="font-bold text-xs sm:text-sm text-content-1 whitespace-nowrap">
              Light Stage
            </span>
            <span className="hidden xl:inline-block rounded bg-surface-2 px-1.5 py-0.2 text-xs text-content-3 font-mono">
              v0.1.0
            </span>
          </div>

          <span className="text-border-strong hidden sm:inline flex-shrink-0">•</span>

          {/* Editable Show Title */}
          <div className="flex items-center gap-1 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setTitleDraft(show.metadata.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  onBlur={handleSaveTitle}
                  className="rounded border border-accent bg-surface-2 px-1.5 py-0.5 text-xs text-content-1 font-semibold focus:outline-none max-w-[110px] sm:max-w-[150px]"
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="rounded p-1 text-accent hover:bg-surface-2 cursor-pointer"
                  title="Lưu tên show"
                  aria-label="Lưu tên show"
                >
                  <Check className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-surface-2 text-left transition-colors truncate max-w-[90px] sm:max-w-[130px] cursor-pointer"
                title="Bấm để đổi tên show"
              >
                <span className="text-xs font-semibold text-content-2 group-hover:text-accent truncate">
                  {show.metadata.title}
                </span>
                <Edit2 className="h-3 w-3 text-content-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Save Status: error wins over dirty/saved (icon + text, never colour alone) */}
          <div
            data-testid="header-save-status"
            data-state={autosaveError ? 'error' : isDirty ? 'dirty' : 'saved'}
            className="flex-shrink-0"
          >
            {autosaveError ? (
              <div
                className="flex items-center gap-1 text-xs text-status-danger font-mono font-medium whitespace-nowrap"
                title={`${autosaveError} Nhấn Ctrl/Cmd+S hoặc lưu file .lightstage để giữ dự án.`}
              >
                <AlertTriangle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                <span className="hidden lg:inline">Chưa lưu — lỗi lưu tự động</span>
                <span className="lg:hidden">Lỗi lưu</span>
              </div>
            ) : isDirty ? (
              <div
                className="flex items-center gap-1 text-xs text-status-standby font-mono font-medium whitespace-nowrap"
                title="Có thay đổi chưa lưu"
              >
                <span className="h-2 w-2 rounded-full bg-status-standby animate-pulse flex-shrink-0" />
                <span className="hidden lg:inline">Chưa lưu</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1 text-xs text-content-3 font-mono font-medium whitespace-nowrap"
                title="Đã lưu"
              >
                <span className="h-2 w-2 rounded-full bg-status-go flex-shrink-0" />
                <span className="hidden lg:inline">Đã lưu</span>
              </div>
            )}
          </div>

          {/* Live Hardware Badges */}
          <div className="hidden xl:flex items-center gap-2 font-mono text-xs flex-shrink-0">
            <div
              className="flex items-center gap-1 text-dept-lx"
              title={
                activeCue
                  ? `Đèn LX của cue đang chạy (${activeCue.cueNumber})`
                  : 'Chưa gọi cue (Go) — sân khấu trống'
              }
              data-testid="header-lx-count"
            >
              <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
              <span>LX: {liveLxCount}</span>
            </div>
            <div
              className="flex items-center gap-1 text-dept-vx"
              title={
                activeCue
                  ? `Màn LED của cue đang chạy (${activeCue.cueNumber})`
                  : 'Chưa gọi cue (Go) — chưa có màn LED live'
              }
              data-testid="header-vx-count"
            >
              <Tv className="h-3.5 w-3.5" aria-hidden="true" />
              <span>VX: {liveVxCount}</span>
            </div>
          </div>
        </div>

        {/* Center Zone: Standby Callout, Hero Central GO, Standby Next, Hold (~320px at 960px) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Standby Callout */}
          <div
            className="hidden 2xl:flex items-center gap-1 rounded bg-surface-2 border border-border-default px-2 py-1 text-xs text-status-standby max-w-[130px] truncate flex-shrink-0"
            title={standbyCue ? `Standby: ${standbyCue.cueNumber} ${standbyCue.title}` : 'No standby cue'}
          >
            <span className="text-xs font-bold text-content-3">STBY:</span>
            <span className="font-semibold truncate">
              {standbyCue ? `${standbyCue.cueNumber} ${standbyCue.title}` : 'None'}
            </span>
          </div>

          {/* Hero Central GO Button */}
          <button
            type="button"
            onClick={() => goCue()}
            disabled={isOperatorLocked}
            aria-disabled={isOperatorLocked || undefined}
            className="h-10 px-5 sm:px-6 rounded bg-status-go hover:bg-status-go/90 disabled:hover:bg-status-go text-surface-0 font-black active:scale-[0.97] transition-all flex items-center gap-2 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 flex-shrink-0"
            title={isOperatorLocked ? LOCKED_CUE_TOOLTIP : 'Start Clock'}
            data-testid="header-hero-go-button"
          >
            <Play className="h-4 w-4 fill-current flex-shrink-0" aria-hidden="true" />
            <span>GO</span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface-0/20 text-surface-0 font-mono text-xs font-bold border border-surface-0/30 select-none">
              Space
            </kbd>
            {(isRunning || activeCue?.status === 'Go') && (
              <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-status-danger/30 text-surface-0 text-xs font-black uppercase animate-pulse border border-status-danger/60">
                <span className="h-1.5 w-1.5 rounded-full bg-status-danger" />
                LIVE
              </span>
            )}
          </button>

          {/* Standby Next ("B") Button */}
          <button
            type="button"
            onClick={nextCue}
            disabled={isOperatorLocked}
            aria-disabled={isOperatorLocked || undefined}
            className="h-8 px-2 sm:px-2.5 rounded bg-surface-2 hover:bg-surface-3 text-status-standby border border-border-default font-bold text-xs flex items-center gap-1 transition-colors flex-shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            title={isOperatorLocked ? LOCKED_CUE_TOOLTIP : 'Chuyển Standby tiếp theo (Go Next Cue - B)'}
            data-testid="header-standby-button"
          >
            <FastForward className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">STBY</span>
            <kbd className="text-xs font-mono text-content-3 px-1 py-0.2 rounded bg-surface-3 border border-border-subtle">
              B
            </kbd>
          </button>

          {/* Hold / Pause ("Esc") Button */}
          <button
            type="button"
            onClick={() => {
              holdCue(activeCue?.id);
              pauseClock();
            }}
            className="h-8 px-2 rounded bg-surface-2 hover:bg-status-hold/20 text-content-2 hover:text-status-hold border border-border-default transition-colors text-xs flex items-center gap-1 flex-shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isOperatorLocked}
            aria-disabled={isOperatorLocked || undefined}
            title={isOperatorLocked ? LOCKED_CUE_TOOLTIP : 'Stop Clock'}
            data-testid="header-hold-button"
          >
            <Pause className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Hold</span>
            <kbd className="text-xs font-mono text-content-3 px-1 py-0.2 rounded bg-surface-3 border border-border-subtle">
              Esc
            </kbd>
          </button>
        </div>

        {/* Right Zone: Tabular Clocks, Operator Lock, Secondary Admin Menu (~260px at 960px) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Tabular Clocks Block */}
          <div className="flex items-center gap-1.5 bg-surface-2 border border-border-default rounded px-2 py-1 font-mono flex-shrink-0 tabular-nums whitespace-nowrap">
            {/* Wall Clock - hidden on viewports < 1536px to prevent 1280px overflow */}
            <div className="hidden 2xl:flex flex-col items-center leading-tight">
              <span className="text-xs font-medium text-content-3 whitespace-nowrap">
                Wall
              </span>
              <span className="text-xs font-semibold text-content-2 tabular-nums">
                {wallClock}
              </span>
            </div>
            <div className="hidden 2xl:block h-5 w-px bg-border-subtle" />

            {/* Master Show Time */}
            <div className="flex flex-col items-center leading-tight">
              <span className="text-xs font-medium text-content-3 whitespace-nowrap">
                Show Time
              </span>
              <span className="text-xs sm:text-sm font-bold text-content-1 tabular-nums">
                {formatDuration(masterElapsedMs, { includeHours: true })}
              </span>
            </div>

            <div className="h-5 w-px bg-border-subtle" />

            {/* Cue Remainder */}
            <div className="flex flex-col items-center leading-tight">
              <span className="text-xs font-medium text-content-3 whitespace-nowrap">
                Cue Remainder
              </span>
              <span
                className={`text-xs sm:text-sm font-bold tabular-nums ${
                  isOverrun ? 'text-status-danger animate-pulse' : 'text-status-go'
                }`}
              >
                {formatDuration(cueRemainingMs)}
              </span>
            </div>

            <div className="hidden xl:block h-5 w-px bg-border-subtle" />

            {/* Delta */}
            <div className="hidden xl:flex flex-col items-center leading-tight">
              <span className="text-xs font-medium text-content-3 whitespace-nowrap">
                Delta
              </span>
              <span
                className={`text-xs font-bold tabular-nums ${
                  deltaTimeMs < 0
                    ? 'text-status-danger'
                    : deltaTimeMs > 0
                    ? 'text-content-1'
                    : 'text-content-3'
                }`}
                title={deltaTimeMs < 0 ? 'Chậm tiến độ (Behind)' : 'Sớm hơn tiến độ (Ahead)'}
              >
                {deltaTimeMs > 0 ? `+${formatDuration(deltaTimeMs)}` : formatDuration(deltaTimeMs)}
              </span>
            </div>

            {/* Reset Clock quick button */}
            <button
              type="button"
              onClick={resetClock}
              className="rounded p-1 text-content-3 hover:bg-surface-3 hover:text-content-1 transition-colors ml-0.5 cursor-pointer"
              title="Reset Clock"
              aria-label="Reset Clock"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>

          {/* Operator Lock Toggle */}
          <button
            type="button"
            onClick={() => setIsOperatorLocked(!isOperatorLocked)}
            className={`inline-flex items-center gap-1 rounded px-2 sm:px-2.5 py-1 text-xs font-semibold transition-colors flex-shrink-0 cursor-pointer ${
              isOperatorLocked
                ? 'bg-status-standby text-surface-0 font-bold ring-2 ring-status-standby/50'
                : 'bg-surface-2 hover:bg-surface-3 text-content-2 hover:text-content-1 border border-border-subtle'
            }`}
            title={isOperatorLocked ? 'Operator Locked: Hotkeys disabled' : 'Unlocked: Hotkeys active'}
          >
            {isOperatorLocked ? (
              <>
                <Lock className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                <span className="hidden lg:inline">Đã khóa</span>
              </>
            ) : (
              <>
                <Unlock className="h-3.5 w-3.5 text-content-3 flex-shrink-0" aria-hidden="true" />
                <span className="hidden lg:inline">Khóa</span>
              </>
            )}
          </button>

          {/* Secondary Admin Menu Dropdown Button */}
          <div
            className="relative flex-shrink-0"
            ref={moreMenuRef}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                setIsMoreMenuOpen(false);
              }
            }}
          >
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="inline-flex items-center justify-center rounded bg-surface-2 hover:bg-surface-3 text-content-2 hover:text-content-1 border border-border-subtle h-8 w-8 text-xs font-bold transition-colors cursor-pointer"
              title="Công cụ bổ sung (More Tools)"
              aria-label="Công cụ bổ sung"
              data-testid="header-admin-menu-button"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Dropdown Menu Popup */}
            <div
              className={`absolute right-0 top-full mt-1.5 w-56 rounded border border-border-default bg-surface-1 p-1.5 shadow-lg z-50 flex flex-col gap-0.5 text-xs animate-in fade-in zoom-in-95 duration-150 select-none ${
                isMoreMenuOpen ? '' : 'hidden'
              }`}
              data-testid="header-admin-menu-dropdown"
            >
              <button
                type="button"
                onClick={() => {
                  handleToggleMute();
                  setIsMoreMenuOpen(false);
                }}
                className="flex items-center gap-2 rounded px-2.5 py-1.5 hover:bg-surface-2 text-content-1 transition-colors text-left w-full cursor-pointer"
                title={isAudioMuted ? 'Unmute Audio Alerts' : 'Mute Audio Alerts'}
              >
                {isAudioMuted ? (
                  <VolumeX className="h-4 w-4 text-status-danger flex-shrink-0" aria-hidden="true" />
                ) : (
                  <Volume2 className="h-4 w-4 text-accent flex-shrink-0" aria-hidden="true" />
                )}
                <span>{isAudioMuted ? 'Bật âm thanh (Unmute)' : 'Tắt âm cảnh báo (Mute)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleOpenStageClock();
                  setIsMoreMenuOpen(false);
                }}
                className="flex items-center gap-2 rounded px-2.5 py-1.5 hover:bg-surface-2 text-content-1 transition-colors text-left w-full cursor-pointer"
                title="Open Stage Confidence Clock"
              >
                <Clock className="h-4 w-4 text-status-go flex-shrink-0" aria-hidden="true" />
                <span>Stage Confidence Clock</span>
              </button>

              <div className="h-px bg-border-subtle my-0.5" />

              <button
                type="button"
                onClick={() => {
                  handleNewShow();
                  setIsMoreMenuOpen(false);
                }}
                className="flex items-center gap-2 rounded px-2.5 py-1.5 hover:bg-surface-2 text-content-1 transition-colors text-left w-full cursor-pointer"
                title="New Project"
              >
                <FilePlus className="h-4 w-4 text-content-3 flex-shrink-0" aria-hidden="true" />
                <span>Dự án mới (New Show)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenProject();
                  setIsMoreMenuOpen(false);
                }}
                className="flex items-center gap-2 rounded px-2.5 py-1.5 hover:bg-surface-2 text-content-1 transition-colors text-left w-full cursor-pointer"
                title="Open .lightstage Project"
              >
                <FolderOpen className="h-4 w-4 text-status-standby flex-shrink-0" aria-hidden="true" />
                <span>Mở file (Open Project)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onImportClick();
                  setIsMoreMenuOpen(false);
                }}
                className="flex items-center gap-2 rounded px-2.5 py-1.5 hover:bg-surface-2 text-content-1 transition-colors text-left w-full cursor-pointer"
                title="Import CSV/TSV"
              >
                <Upload className="h-4 w-4 text-accent flex-shrink-0" aria-hidden="true" />
                <span>Nhập file (Import CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onExportClick();
                  setIsMoreMenuOpen(false);
                }}
                className="flex items-center gap-2 rounded px-2.5 py-1.5 hover:bg-surface-2 text-content-1 transition-colors text-left w-full cursor-pointer"
                title="Export Reports & Project"
              >
                <Download className="h-4 w-4 text-status-go flex-shrink-0" aria-hidden="true" />
                <span>Xuất file & In (Export)</span>
              </button>

              <div className="h-px bg-border-subtle my-0.5" />

              <button
                type="button"
                onClick={() => {
                  onHelpClick();
                  setIsMoreMenuOpen(false);
                }}
                className="flex items-center gap-2 rounded px-2.5 py-1.5 hover:bg-surface-2 text-content-1 transition-colors text-left font-semibold text-accent w-full cursor-pointer"
                title="Trợ giúp & Phím tắt (Help)"
              >
                <HelpCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>Hướng dẫn & Phím tắt (?)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* STRIP 2: WORKSPACE STRIP (Exact Height: 36px / h-[36px])  */}
      {/* ======================================================== */}
      <div
        className="flex h-[36px] items-center justify-between px-3 lg:px-4 bg-surface-1/90 border-t border-border-subtle/40 gap-2 select-none text-xs"
        data-testid="header-workspace-strip"
      >
        {/* Left: View Mode Tabs (liền khối, role=tablist) */}
        <div
          role="tablist"
          aria-label="View mode"
          className="inline-flex h-7 rounded border border-border-default bg-surface-2 text-xs flex-shrink-0 overflow-hidden"
          onKeyDown={handleModeListKeyDown}
        >
          {modeTabs.map((tab) => {
            const selected = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => setViewMode(tab.id)}
                className={`flex h-full items-center gap-1 px-2 border-r border-border-default last:border-r-0 transition-colors cursor-pointer text-[12px] ${
                  selected
                    ? 'bg-accent text-surface-0 font-bold'
                    : 'text-content-2 hover:text-content-1 hover:bg-surface-3'
                }`}
                title={tab.title}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center: Contextual Role Filters & Add Cue */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            <span className="hidden md:inline text-xs font-semibold text-content-3">
              Filter:
            </span>
            <div className="inline-flex rounded bg-surface-2 border border-border-subtle p-0.5 text-xs">
              {(['ALL', 'LX', 'VX', 'SQ', 'ST'] as RoleFilter[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleFilterSelect(role)}
                  className={`rounded px-1.5 sm:px-2 py-0.2 font-medium transition-colors cursor-pointer ${
                    currentFilter === role
                      ? 'bg-accent text-surface-0 font-bold '
                      : 'text-content-3 hover:text-content-1'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddCue}
            className="inline-flex items-center gap-1 rounded bg-surface-2 hover:bg-surface-3 border border-border-subtle px-2 py-0.5 text-xs font-medium text-content-1 transition-colors cursor-pointer flex-shrink-0"
            title="Thêm Cue mới"
          >
            <Plus className="h-3 w-3 text-accent" aria-hidden="true" />
            <span className="hidden sm:inline">Add Cue</span>
          </button>
        </div>

        {/* Right: Summary Stats & Inspector Drawer Toggle Button */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <span className="text-content-3 font-mono text-xs whitespace-nowrap hidden sm:inline-flex items-center gap-2">
            <span>{totalCues} Cues</span>
            <span aria-hidden="true">|</span>
            <span>{formatDuration(totalRuntimeMs)}</span>
          </span>

          <button
            type="button"
            onClick={handleToggleInspector}
            className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium border transition-colors flex-shrink-0 cursor-pointer ${
              isInspectorActive
                ? 'bg-accent/20 border-accent/40 text-accent font-semibold'
                : 'bg-surface-2 hover:bg-surface-3 border-border-subtle text-content-2 hover:text-content-1'
            }`}
            title="Mở/Đóng Inspector (I)"
            data-testid="header-inspector-toggle"
          >
            <PanelRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden md:inline">Inspector</span>
            <kbd className="px-1 py-0.2 rounded bg-surface-3 text-xs font-mono text-content-2 border border-border-subtle">
              I
            </kbd>
          </button>
        </div>
      </div>
    </header>
  );
};
