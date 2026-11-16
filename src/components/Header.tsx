import React, { useState, useRef, useEffect } from 'react';
import { useShowStore } from '../store/useShowStore';
import { useClockStore, formatDuration } from '../store/useClockStore';
import { isMuted, toggleMute } from '../services/audioAlerts';
import { openStageClockWindow } from '../services/stageClockSync';
import {
  Lightbulb,
  Tv,
  Play,
  Pause,
  Square,
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
} from 'lucide-react';

export type ViewMode = 'rundown' | 'timeline' | 'stage' | 'split';

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
}) => {
  const show = useShowStore((s) => s.show);
  const getDeviceStats = useShowStore((s) => s.getDeviceStats);
  const isDirty = useShowStore((s) => s.isDirty);
  const updateMetadata = useShowStore((s) => s.updateMetadata);
  const newShow = useShowStore((s) => s.newShow);
  const activeCue = useShowStore((s) => s.getActiveCue());
  const standbyCue = useShowStore((s) => s.getStandbyCue());
  const nextCue = useShowStore((s) => s.nextCue);
  const getAllCues = useShowStore((s) => s.getAllCues);

  const isRunning = useClockStore((s) => s.isRunning);
  const masterElapsedMs = useClockStore((s) => s.masterElapsedMs);
  const cueRemainingMs = useClockStore((s) => s.cueRemainingMs);
  const isOverrun = useClockStore((s) => s.isOverrun);
  const startClock = useClockStore((s) => s.startClock);
  const pauseClock = useClockStore((s) => s.pauseClock);
  const resetClock = useClockStore((s) => s.resetClock);

  const [isAudioMuted, setIsAudioMuted] = useState(() => isMuted());
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(show.metadata.title);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const stats = getDeviceStats();

  useEffect(() => {
    setTitleDraft(show.metadata.title);
  }, [show.metadata.title]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // Delta Time calculation
  const deltaTimeMs = React.useMemo(() => {
    const allCues = getAllCues();
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
  }, [getAllCues, activeCue, masterElapsedMs]);

  return (
    <header className="flex flex-col border-b border-border-default bg-surface-1 backdrop-blur z-50 flex-shrink-0">
      {/* ======================================================== */}
      {/* TIER 1: LIVE OPERATION & MASTER CLOCKS                  */}
      {/* ======================================================== */}
      <div className="flex h-12 items-center justify-between px-3 lg:px-4 border-b border-border-subtle/60 gap-2 overflow-x-auto select-none">
        {/* Brand & Show Title */}
        <div className="flex items-center gap-2.5 flex-shrink-0 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 border border-border-strong text-accent font-bold text-xs shadow-sm">
            LS
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wide text-xs sm:text-sm text-content-1 whitespace-nowrap">
              Light Stage
            </span>
            <span className="hidden sm:inline-block rounded bg-surface-2 px-1.5 py-0.2 text-[9px] text-content-3 font-mono">
              v0.1.0
            </span>
          </div>

          <span className="text-border-strong hidden sm:inline">•</span>

          {/* Editable Show Name */}
          <div className="flex items-center gap-1.5">
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
                  className="rounded border border-accent bg-surface-2 px-1.5 py-0.5 text-xs text-content-1 font-semibold focus:outline-none max-w-[140px] sm:max-w-[200px]"
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="rounded p-1 text-accent hover:bg-surface-2"
                  title="Lưu tên show"
                >
                  <Check className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-1.5 rounded px-1.5 py-0.5 hover:bg-surface-2 text-left transition-colors"
                title="Bấm để đổi tên show"
              >
                <span className="text-xs font-semibold text-content-2 group-hover:text-accent truncate max-w-[100px] sm:max-w-[180px]">
                  {show.metadata.title}
                </span>
                <Edit2 className="h-3 w-3 text-content-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}

            {isDirty ? (
              <span
                className="hidden sm:flex items-center gap-1 text-[10px] text-status-standby font-mono font-medium whitespace-nowrap"
                title="Có thay đổi chưa lưu"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-status-standby animate-pulse" />
                Chưa lưu
              </span>
            ) : (
              <span
                className="hidden sm:flex items-center gap-1 text-[10px] text-content-3 font-mono font-medium whitespace-nowrap"
                title="Đã lưu"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-status-go" />
                Đã lưu
              </span>
            )}
          </div>
        </div>

        {/* Transport Controls (Live Playback) */}
        <div className="flex items-center gap-1.5 bg-surface-2 border border-border-subtle rounded-lg p-1 flex-shrink-0">
          {isRunning ? (
            <button
              type="button"
              onClick={pauseClock}
              className="inline-flex items-center gap-1 rounded bg-status-standby/20 hover:bg-status-standby/30 text-status-standby px-2 py-1 text-xs font-bold transition-colors"
              title="Pause Clock"
            >
              <Pause className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pause</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startClock}
              className="inline-flex items-center gap-1 rounded bg-status-go/20 hover:bg-status-go/30 text-status-go px-2 py-1 text-xs font-bold transition-colors"
              title="Start Clock"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span className="hidden sm:inline">Play</span>
            </button>
          )}

          <button
            type="button"
            onClick={pauseClock}
            className="rounded p-1 text-content-3 hover:bg-surface-3 hover:text-content-1 transition-colors"
            title="Stop Clock"
          >
            <Square className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={resetClock}
            className="rounded p-1 text-content-3 hover:bg-surface-3 hover:text-content-1 transition-colors"
            title="Reset Clock"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-px bg-border-subtle mx-0.5" />

          {/* Go Next Cue */}
          <button
            type="button"
            onClick={nextCue}
            className="inline-flex items-center gap-1 rounded bg-accent/20 hover:bg-accent/30 text-accent px-2 py-1 text-xs font-bold transition-colors"
            title="Chuyển Standby tiếp theo (Go Next Cue - B)"
          >
            <FastForward className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Go Next</span>
          </button>
        </div>

        {/* Standby & Active Banner */}
        <div className="hidden lg:flex items-center gap-2 bg-surface-2 border border-border-default rounded-lg px-2.5 py-1 text-xs flex-shrink-0">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-content-3 font-bold">
              Standby
            </span>
            <span className="font-semibold text-status-standby truncate max-w-[100px] xl:max-w-[130px]">
              {standbyCue ? `${standbyCue.cueNumber} ${standbyCue.title}` : 'None'}
            </span>
          </div>
          <div className="h-6 w-px bg-border-subtle" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase tracking-wider text-content-3 font-bold">
                Active Go
              </span>
              {(isRunning || activeCue?.status === 'Go') && (
                <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-wider animate-pulse border border-rose-500/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  LIVE
                </span>
              )}
            </div>
            <span className="font-semibold text-status-go truncate max-w-[100px] xl:max-w-[130px]">
              {activeCue ? `${activeCue.cueNumber} ${activeCue.title}` : 'None'}
            </span>
          </div>
        </div>

        {/* Big Clocks: Tabular-Nums, Vietnamese Labels, No line-wrap */}
        <div className="flex items-center gap-2 lg:gap-3 bg-surface-2 border border-border-default rounded-lg px-2.5 py-1 font-mono flex-shrink-0 tabular-nums whitespace-nowrap">
          {/* Wall Clock */}
          <div className="hidden 2xl:flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-wider text-content-3 whitespace-nowrap">
              Giờ thực tế / Wall
            </span>
            <span className="text-xs font-semibold text-content-2 tabular-nums">
              {wallClock}
            </span>
          </div>
          <div className="hidden 2xl:block h-6 w-px bg-border-subtle" />

          {/* Master Show Time */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-wider text-content-3 whitespace-nowrap">
              Show Time
            </span>
            <span className="text-xs sm:text-sm font-bold text-content-1 tabular-nums">
              {formatDuration(masterElapsedMs, { includeHours: true })}
            </span>
          </div>

          <div className="h-6 w-px bg-border-subtle" />

          {/* Cue Remainder */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-wider text-content-3 whitespace-nowrap">
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

          <div className="h-6 w-px bg-border-subtle" />

          {/* Delta */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-wider text-content-3 whitespace-nowrap">
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
        </div>
      </div>

      {/* ======================================================== */}
      {/* TIER 2: TOOLS, VIEWS, HARDWARE STATS & SECONDARY ACTIONS */}
      {/* ======================================================== */}
      <div className="flex h-10 items-center justify-between px-3 lg:px-4 bg-surface-1/90 gap-2 overflow-visible select-none text-xs">
        {/* Left: View Mode Tabs */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="inline-flex rounded-lg bg-surface-2 border border-border-subtle p-0.5 text-xs">
            <button
              type="button"
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
              type="button"
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
              type="button"
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
              type="button"
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

          {/* Hardware Stats Badges */}
          <div className="hidden lg:flex items-center gap-2.5 font-mono text-[11px] ml-2">
            <div className="flex items-center gap-1 text-dept-lx" title="Tổng số thiết bị đèn LX">
              <Lightbulb className="h-3.5 w-3.5" />
              <span>LX: {stats.totalLightingFixtures}</span>
            </div>
            <div className="flex items-center gap-1 text-dept-vx" title="Tổng số màn hình LED VX">
              <Tv className="h-3.5 w-3.5" />
              <span>VX: {stats.totalScreens}</span>
            </div>
          </div>
        </div>

        {/* Right: Tools & Actions (Responsive collapse to "..." dropdown below 1100px) */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Operator Lock Toggle (Always prominent) */}
          <button
            type="button"
            onClick={() => setIsOperatorLocked(!isOperatorLocked)}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
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

          {/* Primary Tool Buttons on Wide Screens (>= 1100px) */}
          <div className="hidden min-[1100px]:flex items-center gap-1.5">
            {/* Audio Mute Toggle */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold border transition-colors ${
                isAudioMuted
                  ? 'bg-status-danger/20 border-status-danger/40 text-status-danger'
                  : 'bg-surface-2 hover:bg-surface-3 text-content-2 hover:text-content-1 border-border-subtle'
              }`}
              title={isAudioMuted ? 'Unmute Audio Alerts' : 'Mute Audio Alerts'}
            >
              {isAudioMuted ? (
                <>
                  <VolumeX className="h-3.5 w-3.5" />
                  <span>Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-accent" />
                  <span>Sound</span>
                </>
              )}
            </button>

            {/* Stage Clock Display */}
            <button
              type="button"
              onClick={handleOpenStageClock}
              className="inline-flex items-center gap-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-content-2 hover:text-content-1 border border-border-subtle px-2 py-1 text-xs font-semibold transition-colors"
              title="Open Stage Confidence Clock"
            >
              <Clock className="h-3.5 w-3.5 text-status-go" />
              <span>Stage Clock</span>
            </button>

            {/* New Project */}
            <button
              type="button"
              onClick={handleNewShow}
              className="inline-flex items-center gap-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-content-2 hover:text-content-1 border border-border-subtle px-2 py-1 text-xs font-semibold transition-colors"
              title="New Project"
            >
              <FilePlus className="h-3.5 w-3.5 text-content-3" />
              <span>New</span>
            </button>

            {/* Open Project */}
            <button
              type="button"
              onClick={onOpenProject}
              className="inline-flex items-center gap-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-content-2 hover:text-content-1 border border-border-subtle px-2 py-1 text-xs font-semibold transition-colors"
              title="Open .lightstage Project"
            >
              <FolderOpen className="h-3.5 w-3.5 text-status-standby" />
              <span>Open</span>
            </button>

            {/* Import */}
            <button
              type="button"
              onClick={onImportClick}
              className="inline-flex items-center gap-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-content-2 hover:text-content-1 border border-border-subtle px-2 py-1 text-xs font-semibold transition-colors"
              title="Import CSV/TSV"
            >
              <Upload className="h-3.5 w-3.5 text-accent" />
              <span>Import</span>
            </button>

            {/* Export */}
            <button
              type="button"
              onClick={onExportClick}
              className="inline-flex items-center gap-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-content-2 hover:text-content-1 border border-border-subtle px-2 py-1 text-xs font-semibold transition-colors"
              title="Export Reports & Project"
            >
              <Download className="h-3.5 w-3.5 text-status-go" />
              <span>Export</span>
            </button>

            {/* Help "?" Button */}
            <button
              type="button"
              onClick={onHelpClick}
              className="inline-flex items-center justify-center rounded-lg bg-surface-2 hover:bg-surface-3 text-content-2 hover:text-accent border border-border-subtle h-7 w-7 text-xs font-bold transition-colors"
              title="Trợ giúp & Phím tắt (Help)"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>

          {/* Clean "..." Dropdown Menu for width < 1100px */}
          <div className="relative min-[1100px]:hidden" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg bg-surface-2 hover:bg-surface-3 text-content-2 hover:text-content-1 border border-border-subtle h-7 w-7 text-xs font-bold transition-colors"
              title="Công cụ bổ sung (More Tools)"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-border-default bg-surface-1 p-1.5 shadow-2xl z-50 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    handleToggleMute();
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-surface-2 text-content-1 transition-colors text-left"
                >
                  {isAudioMuted ? (
                    <VolumeX className="h-4 w-4 text-status-danger" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-accent" />
                  )}
                  <span>{isAudioMuted ? 'Bật âm thanh (Unmute)' : 'Tắt âm cảnh báo (Mute)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenStageClock();
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-surface-2 text-content-1 transition-colors text-left"
                >
                  <Clock className="h-4 w-4 text-status-go" />
                  <span>Stage Confidence Clock</span>
                </button>

                <div className="h-px bg-border-subtle my-0.5" />

                <button
                  type="button"
                  onClick={() => {
                    handleNewShow();
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-surface-2 text-content-1 transition-colors text-left"
                >
                  <FilePlus className="h-4 w-4 text-content-3" />
                  <span>Dự án mới (New Show)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenProject();
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-surface-2 text-content-1 transition-colors text-left"
                >
                  <FolderOpen className="h-4 w-4 text-status-standby" />
                  <span>Mở file (Open Project)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onImportClick();
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-surface-2 text-content-1 transition-colors text-left"
                >
                  <Upload className="h-4 w-4 text-accent" />
                  <span>Nhập file (Import CSV)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onExportClick();
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-surface-2 text-content-1 transition-colors text-left"
                >
                  <Download className="h-4 w-4 text-status-go" />
                  <span>Xuất file & In (Export)</span>
                </button>

                <div className="h-px bg-border-subtle my-0.5" />

                <button
                  type="button"
                  onClick={() => {
                    onHelpClick();
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-surface-2 text-content-1 transition-colors text-left font-semibold text-accent"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Hướng dẫn & Phím tắt (?)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
