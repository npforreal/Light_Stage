import React, { useState } from 'react';
import {
  X,
  Play,
  AlertCircle,
  Pause,
  FastForward,
  CheckCircle2,
  Clock,
  Lightbulb,
  Tv,
  Volume2,
  Users,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  Info,
  AlertTriangle,
  Repeat,
  Layers,
  Trash2,
} from 'lucide-react';
import { useShowStore } from '../store/useShowStore';
import {
  Cue,
  CueStatus,
  DepartmentCues,
  LightingColor,
  LightingFixtureType,
  DeviceSpecification,
} from '../types/stage';
import { kelvinToRgb, rgbToHex } from '../services/color';

export interface CueInspectorProps {
  isOpen?: boolean;
  onClose?: () => void;
  cueId?: string | null;
}

const COLOR_PRESETS: { label: string; color: LightingColor; hex: string }[] = [
  { label: '2700K', color: { mode: 'kelvin', kelvin: 2700 }, hex: '#ffb366' },
  { label: '3200K', color: { mode: 'kelvin', kelvin: 3200 }, hex: '#ffd199' },
  { label: '5600K', color: { mode: 'kelvin', kelvin: 5600 }, hex: '#fffaed' },
  { label: '6500K', color: { mode: 'kelvin', kelvin: 6500 }, hex: '#e6f0ff' },
  { label: 'Amber', color: { mode: 'rgb', hex: '#ff9900' }, hex: '#ff9900' },
  { label: 'Red', color: { mode: 'rgb', hex: '#ff2222' }, hex: '#ff2222' },
  { label: 'Green', color: { mode: 'rgb', hex: '#00dd44' }, hex: '#00dd44' },
  { label: 'Blue', color: { mode: 'rgb', hex: '#0055ff' }, hex: '#0055ff' },
  { label: 'Cyan', color: { mode: 'rgb', hex: '#00eeee' }, hex: '#00eeee' },
  { label: 'Magenta', color: { mode: 'rgb', hex: '#ee00ee' }, hex: '#ee00ee' },
];

const STANDARD_MIC_CHANNELS = [
  'MC 1 (Ch 1)',
  'MC 2 (Ch 2)',
  'Lead Vocal (Ch 3)',
  'Band L/R (Ch 4-5)',
  'Host Lapel (Ch 6)',
  'Spare Wireless (Ch 7)',
];

const STANDARD_FIXTURE_TYPES: LightingFixtureType[] = [
  'Beam',
  'Spot',
  'Wash',
  'ParLED',
  'Blinder',
  'Follow',
  'Laser',
  'Strobe',
];

export const CueInspector: React.FC<CueInspectorProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  cueId: propCueId,
}) => {
  const storeIsOpen = useShowStore((s) => s.isInspectorOpen);
  const setStoreInspectorOpen = useShowStore((s) => s.setInspectorOpen);
  const storeSelectedCueId = useShowStore((s) => s.selectedCueId);
  const updateCue = useShowStore((s) => s.updateCue);
  const standbyCue = useShowStore((s) => s.standbyCue);
  const holdCue = useShowStore((s) => s.holdCue);
  const skipCue = useShowStore((s) => s.skipCue);
  const selectCue = useShowStore((s) => s.selectCue);
  const activeCueId = useShowStore((s) => s.activeCueId);
  const standbyCueId = useShowStore((s) => s.standbyCueId);
  const show = useShowStore((s) => s.show);
  const allCues = React.useMemo(() => show.acts.flatMap((a) => a.cues), [show.acts]);

  const isVisible = propIsOpen !== undefined ? propIsOpen : storeIsOpen;
  const targetCueId = propCueId !== undefined ? propCueId : storeSelectedCueId;
  const cue = allCues.find((c) => c.id === targetCueId);

  // Accordion collapsed/expanded states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    lx: true,
    vx: true,
    sq: true,
    st: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      setStoreInspectorOpen(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  const renderStatusBadge = (status: CueStatus, isActive: boolean, isStandby: boolean) => {
    if (isActive || status === 'Go') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold bg-status-go/20 text-status-go border border-status-go/60 ring-1 ring-status-go/40">
          <Play className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
          <span>GO</span>
        </span>
      );
    }
    if (isStandby || status === 'Standby') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold bg-status-standby/20 text-status-standby border border-status-standby/60">
          <AlertCircle className="h-2.5 w-2.5" aria-hidden="true" />
          <span>STANDBY</span>
        </span>
      );
    }
    if (status === 'Hold') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold bg-status-hold/20 text-status-hold border border-status-hold/60">
          <Pause className="h-2.5 w-2.5" aria-hidden="true" />
          <span>HOLD</span>
        </span>
      );
    }
    if (status === 'Skip') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium bg-surface-2 text-content-3 border border-border-default line-through">
          <FastForward className="h-2.5 w-2.5" aria-hidden="true" />
          <span>SKIP</span>
        </span>
      );
    }
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium bg-surface-2 text-content-3 border border-border-default/60">
          <CheckCircle2 className="h-2.5 w-2.5 text-status-go/70" aria-hidden="true" />
          <span>COMPLETED</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium bg-surface-2 text-content-3 border border-border-subtle">
        <span>PENDING</span>
      </span>
    );
  };

  // If drawer is open but no cue is selected
  if (!cue) {
    return (
      <>
        {/* Overlay backdrop for screens < 1200px */}
        <div
          className="fixed inset-0 bg-surface-0/60 backdrop-blur-sm z-30 min-[1200px]:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />

        <aside
          data-testid="cue-inspector-drawer"
          aria-label="Cue Inspector"
          className="fixed top-0 right-0 bottom-0 z-40 w-88 sm:w-96 min-[1200px]:relative min-[1200px]:z-10 flex flex-col flex-shrink-0 border-l border-border-default bg-surface-1 text-content-1 shadow-lg min-[1200px]:shadow-none select-none h-full overflow-hidden"
        >
          {/* Header */}
          <div className="flex h-12 items-center justify-between px-4 border-b border-border-default bg-surface-1/95 flex-shrink-0">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-accent" aria-hidden="true" />
              <span className="font-bold text-sm text-content-1">Inspector</span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              title="Đóng Inspector (I)"
              aria-label="Đóng Inspector"
              className="rounded p-1 text-content-3 hover:text-content-1 hover:bg-surface-2 transition-colors"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Empty Placeholder */}
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-content-3 gap-3">
            <div className="rounded bg-surface-2 p-3 text-content-2">
              <Info className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="font-semibold text-content-1 text-sm">Chưa chọn Cue nào</div>
            <p className="text-xs max-w-[240px] leading-relaxed">
              Nhấp vào bất kỳ hàng nào trong bảng Rundown để xem và chỉnh sửa thông số chi tiết của Cue.
            </p>
            <div className="flex flex-col gap-2 mt-2 w-full max-w-[200px]">
              {standbyCueId && (
                <button
                  type="button"
                  onClick={() => selectCue(standbyCueId)}
                  className="rounded bg-status-standby/15 hover:bg-status-standby/25 text-status-standby border border-status-standby/40 px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  Chọn Cue Standby
                </button>
              )}
              {activeCueId && (
                <button
                  type="button"
                  onClick={() => selectCue(activeCueId)}
                  className="rounded bg-status-go/15 hover:bg-status-go/25 text-status-go border border-status-go/40 px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  Chọn Cue Đang Chạy (GO)
                </button>
              )}
            </div>
          </div>
        </aside>
      </>
    );
  }

  const isActive = activeCueId === cue.id;
  const isStandby = standbyCueId === cue.id;
  const lx = cue.departments.lx;
  const vx = cue.departments.vx;
  const sq = cue.departments.sq;
  const st = cue.departments.st;

  // Active Kelvin calculation
  const currentKelvin =
    lx?.color?.mode === 'kelvin'
      ? lx.color.kelvin
      : 3200;

  // Color preview swatch
  const previewHex =
    lx?.color?.mode === 'rgb' && lx.color.hex
      ? lx.color.hex
      : rgbToHex(kelvinToRgb(currentKelvin));

  // Gamut check
  const isGamutWarning =
    lx?.color?.mode === 'rgb' &&
    lx.color.hex &&
    (lx.color.hex.toLowerCase() === '#ff2222' ||
      lx.color.hex.toLowerCase() === '#0055ff' ||
      lx.color.hex.toLowerCase() === '#ee00ee');

  // Handlers for Cue property mutations
  const handleUpdate = (patch: Partial<Cue>) => {
    updateCue(cue.id, patch);
  };

  const handleUpdateDepartment = (patch: Partial<DepartmentCues>) => {
    updateCue(cue.id, {
      departments: {
        ...cue.departments,
        ...patch,
      },
    });
  };

  const handleUpdateLx = (patch: Partial<NonNullable<Cue['departments']['lx']>>) => {
    handleUpdateDepartment({
      lx: {
        ...cue.departments.lx,
        ...patch,
      },
    });
  };

  const handleUpdateVx = (patch: Partial<NonNullable<Cue['departments']['vx']>>) => {
    handleUpdateDepartment({
      vx: {
        screenCount: 1,
        ...cue.departments.vx,
        ...patch,
      },
    });
  };

  const handleUpdateSq = (patch: Partial<NonNullable<Cue['departments']['sq']>>) => {
    handleUpdateDepartment({
      sq: {
        ...cue.departments.sq,
        ...patch,
      },
    });
  };

  const handleUpdateSt = (patch: Partial<NonNullable<Cue['departments']['st']>>) => {
    handleUpdateDepartment({
      st: {
        ...cue.departments.st,
        ...patch,
      },
    });
  };

  const handleDurationSecondsChange = (seconds: number) => {
    const s = Math.max(0, isNaN(seconds) ? 0 : seconds);
    handleUpdate({ durationMs: s * 1000 });
  };

  const formatDurationDisplay = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleMicChannel = (channel: string) => {
    const currentMics = sq?.micChannels || [];
    const updated = currentMics.includes(channel)
      ? currentMics.filter((c) => c !== channel)
      : [...currentMics, channel];
    handleUpdateSq({ micChannels: updated });
  };

  const handleFixtureCountChange = (fixtureId: string, count: number) => {
    const fixtures = lx?.fixtures || [];
    const updated = fixtures.map((f) => (f.id === fixtureId ? { ...f, count: Math.max(0, count) } : f));
    handleUpdateLx({ fixtures: updated });
  };

  const handleAddFixtureType = (subType: LightingFixtureType) => {
    const fixtures = lx?.fixtures || [];
    const existing = fixtures.find((f) => f.subType === subType);
    if (existing) {
      handleFixtureCountChange(existing.id, existing.count + 2);
    } else {
      const newFixture: DeviceSpecification = {
        id: `fix-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `${subType} Unit`,
        category: 'Lighting',
        subType,
        count: 4,
      };
      handleUpdateLx({ fixtures: [...fixtures, newFixture] });
    }
  };

  const handleRemoveFixture = (fixtureId: string) => {
    const fixtures = lx?.fixtures || [];
    handleUpdateLx({ fixtures: fixtures.filter((f) => f.id !== fixtureId) });
  };

  return (
    <>
      {/* Overlay backdrop for screens < 1200px */}
      <div
        className="fixed inset-0 bg-surface-0/60 backdrop-blur-sm z-30 min-[1200px]:hidden"
        onClick={handleClose}
        aria-hidden="true"
      />

      <aside
        data-testid="cue-inspector-drawer"
        aria-label="Cue Inspector"
        className="fixed top-0 right-0 bottom-0 z-40 w-88 sm:w-96 min-[1200px]:relative min-[1200px]:z-10 flex flex-col flex-shrink-0 border-l border-border-default bg-surface-1 text-content-1 shadow-lg min-[1200px]:shadow-none select-none h-full overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="flex h-12 items-center justify-between px-3 border-b border-border-default bg-surface-1/95 flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-mono font-bold text-accent px-2 py-0.5 rounded bg-accent/15 border border-accent/30 text-xs flex-shrink-0">
              {cue.cueNumber}
            </span>
            <div className="flex-shrink-0">
              {renderStatusBadge(cue.status, isActive, isStandby)}
            </div>
            <span className="text-xs font-bold text-content-1 truncate" title={cue.title}>
              {cue.title}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            title="Đóng Inspector (I)"
            aria-label="Đóng Inspector"
            className="rounded p-1 text-content-3 hover:text-content-1 hover:bg-surface-2 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Fast Calling Actions Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-default/80 bg-surface-0/50 gap-1.5 flex-shrink-0 text-xs">
          <button
            type="button"
            onClick={() => standbyCue(cue.id)}
            className={`flex-1 flex items-center justify-center gap-1 rounded py-1 px-2 font-bold transition-all ${
              isStandby
                ? 'bg-status-standby text-surface-0 ring-1 ring-status-standby'
                : 'bg-status-standby/15 hover:bg-status-standby/25 text-status-standby border border-status-standby/40'
            }`}
          >
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            <span>Set Standby</span>
          </button>

          <button
            type="button"
            onClick={() => holdCue(cue.id)}
            className="flex-1 flex items-center justify-center gap-1 rounded py-1 px-2 font-bold bg-status-hold/15 hover:bg-status-hold/25 text-status-hold border border-status-hold/40 transition-all"
          >
            <Pause className="h-3 w-3" aria-hidden="true" />
            <span>Hold</span>
          </button>

          <button
            type="button"
            onClick={() => skipCue(cue.id)}
            className="flex items-center justify-center gap-1 rounded py-1 px-2 font-medium bg-surface-2 hover:bg-surface-3 text-content-2 border border-border-default transition-all"
          >
            <FastForward className="h-3 w-3" aria-hidden="true" />
            <span>Skip</span>
          </button>
        </div>

        {/* Scrollable Accordions Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* ============================================================== */}
          {/* ACCORDION 1: GENERAL & TIMING */}
          {/* ============================================================== */}
          <div className="rounded border border-border-default bg-surface-0 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('general')}
              className="flex w-full items-center justify-between px-3 py-2 bg-surface-1/70 hover:bg-surface-2/60 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                <span className="text-xs font-bold text-content-1">General & Timing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-content-3">
                  {formatDurationDisplay(cue.durationMs)}
                </span>
                {openSections.general ? (
                  <ChevronDown className="h-3.5 w-3.5 text-content-3" aria-hidden="true" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-content-3" aria-hidden="true" />
                )}
              </div>
            </button>

            {openSections.general && (
              <div className="p-3 space-y-2.5 text-xs">
                {/* Title */}
                <div>
                  <label htmlFor="inspector-cue-title" className="block text-[11px] font-semibold text-content-3 mb-1">
                    Tiêu đề Cue (Title)
                  </label>
                  <input
                    id="inspector-cue-title"
                    type="text"
                    value={cue.title}
                    onChange={(e) => handleUpdate({ title: e.target.value })}
                    className="w-full rounded border border-border-default bg-surface-1 px-2.5 py-1.5 text-xs text-content-1 focus:border-accent focus:outline-none"
                    placeholder="Tên cue..."
                  />
                </div>

                {/* Duration */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="inspector-cue-duration-sec" className="block text-[11px] font-semibold text-content-3 mb-1">
                      Thời lượng (Giây)
                    </label>
                    <input
                      id="inspector-cue-duration-sec"
                      type="number"
                      min={0}
                      value={Math.round(cue.durationMs / 1000)}
                      onChange={(e) => handleDurationSecondsChange(parseInt(e.target.value, 10))}
                      className="w-full rounded border border-border-default bg-surface-1 px-2.5 py-1.5 text-xs text-content-1 font-mono focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="inspector-cue-duration-formatted" className="block text-[11px] font-semibold text-content-3 mb-1">
                      Định dạng MM:SS
                    </label>
                    <div
                      id="inspector-cue-duration-formatted"
                      className="w-full rounded border border-border-default/60 bg-surface-2 px-2.5 py-1.5 text-xs text-content-2 font-mono flex items-center justify-center font-bold"
                    >
                      {formatDurationDisplay(cue.durationMs)}
                    </div>
                  </div>
                </div>

                {/* Scheduled Time */}
                <div>
                  <label htmlFor="inspector-cue-scheduled-time" className="block text-[11px] font-semibold text-content-3 mb-1">
                    Thời gian thực (Scheduled Wall Time)
                  </label>
                  <input
                    id="inspector-cue-scheduled-time"
                    type="text"
                    value={cue.scheduledTime || ''}
                    onChange={(e) => handleUpdate({ scheduledTime: e.target.value })}
                    placeholder="19:30:00"
                    className="w-full rounded border border-border-default bg-surface-1 px-2.5 py-1.5 text-xs text-content-1 font-mono focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Notes & Description */}
                <div>
                  <label htmlFor="inspector-cue-notes" className="block text-[11px] font-semibold text-content-3 mb-1">
                    Mô tả / Ghi chú (Notes)
                  </label>
                  <textarea
                    id="inspector-cue-notes"
                    rows={2}
                    value={cue.notes || ''}
                    onChange={(e) => handleUpdate({ notes: e.target.value })}
                    placeholder="Chỉ dẫn tổng quát cho cue..."
                    className="w-full rounded border border-border-default bg-surface-1 px-2.5 py-1.5 text-xs text-content-1 focus:border-accent focus:outline-none resize-none"
                  />
                </div>

                {/* Auto-advance Toggle */}
                <div className="pt-1">
                  <label htmlFor="inspector-cue-auto-advance" className="flex items-center gap-2 cursor-pointer text-xs text-content-2 hover:text-content-1">
                    <input
                      id="inspector-cue-auto-advance"
                      type="checkbox"
                      checked={Boolean(cue.notes?.includes('[Auto-Advance]'))}
                      onChange={(e) => {
                        const isAuto = e.target.checked;
                        const baseNotes = (cue.notes || '').replace('[Auto-Advance]', '').trim();
                        handleUpdate({
                          notes: isAuto ? `${baseNotes} [Auto-Advance]`.trim() : baseNotes,
                        });
                      }}
                      className="rounded border-border-default text-accent focus:ring-accent"
                    />
                    <span>Tự động chuyển tiếp khi hết thời lượng (Auto-advance)</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* ACCORDION 2: LIGHTING (LX) */}
          {/* ============================================================== */}
          <div className="rounded border border-border-default bg-surface-0 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('lx')}
              className="flex w-full items-center justify-between px-3 py-2 bg-surface-1/70 hover:bg-surface-2/60 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-dept-lx" aria-hidden="true" />
                <span className="text-xs font-bold text-dept-lx">Lighting (LX)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-content-3">
                  {cue.totalLightingFixtures} fixtures
                </span>
                {openSections.lx ? (
                  <ChevronDown className="h-3.5 w-3.5 text-content-3" aria-hidden="true" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-content-3" aria-hidden="true" />
                )}
              </div>
            </button>

            {openSections.lx && (
              <div className="p-3 space-y-3 text-xs">
                {/* Scene Name */}
                <div>
                  <label htmlFor="inspector-lx-scene-name" className="block text-[11px] font-semibold text-content-3 mb-1">
                    Tên Cảnh Sáng (Scene Name)
                  </label>
                  <input
                    id="inspector-lx-scene-name"
                    type="text"
                    value={lx?.sceneName || ''}
                    onChange={(e) => handleUpdateLx({ sceneName: e.target.value })}
                    placeholder="Walk-in Ambience, Chorus Wash..."
                    className="w-full rounded border border-border-default bg-surface-1 px-2.5 py-1.5 text-xs text-content-1 focus:border-dept-lx focus:outline-none"
                  />
                </div>

                {/* Master Intensity Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="inspector-lx-intensity-slider" className="text-[11px] font-semibold text-content-3">
                      Master Intensity
                    </label>
                    <span className="font-mono font-bold text-dept-lx text-xs">
                      {lx?.intensity ?? 100}%
                    </span>
                  </div>
                  <input
                    id="inspector-lx-intensity-slider"
                    type="range"
                    min={0}
                    max={100}
                    value={lx?.intensity ?? 100}
                    onChange={(e) => handleUpdateLx({ intensity: parseInt(e.target.value, 10) })}
                    className="w-full accent-dept-lx cursor-pointer"
                  />
                </div>

                {/* Kelvin Temperature Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="inspector-lx-kelvin-slider" className="text-[11px] font-semibold text-content-3">
                      Nhiệt Độ Màu (Kelvin)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-3 w-3 rounded-full border border-border-subtle"
                        style={{ backgroundColor: previewHex }}
                      />
                      <span className="font-mono font-bold text-dept-lx text-xs">
                        {currentKelvin}K
                      </span>
                    </div>
                  </div>
                  <input
                    id="inspector-lx-kelvin-slider"
                    type="range"
                    min={2700}
                    max={6500}
                    step={50}
                    value={currentKelvin}
                    onChange={(e) => {
                      const k = parseInt(e.target.value, 10);
                      const rgb = kelvinToRgb(k);
                      handleUpdateLx({
                        color: { mode: 'kelvin', kelvin: k },
                        colorPreset: rgbToHex(rgb),
                      });
                    }}
                    className="w-full accent-dept-lx cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-content-3 mt-0.5">
                    <span>2700K (Warm)</span>
                    <span>4000K</span>
                    <span>6500K (Daylight)</span>
                  </div>
                </div>

                {/* Optical Presets Palette */}
                <div>
                  <span className="block text-[11px] font-semibold text-content-3 mb-1">
                    Color Presets
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {COLOR_PRESETS.map((p) => {
                      const isSelected =
                        (p.color.mode === 'kelvin' &&
                          lx?.color?.mode === 'kelvin' &&
                          lx.color.kelvin === p.color.kelvin) ||
                        (p.color.mode === 'rgb' &&
                          lx?.color?.mode === 'rgb' &&
                          lx.color.hex?.toLowerCase() === p.hex.toLowerCase());

                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            handleUpdateLx({
                              color: p.color,
                              colorPreset: p.hex,
                            });
                          }}
                          className={`flex flex-col items-center gap-1 rounded p-1 text-[10px] border transition-all ${
                            isSelected
                              ? 'border-dept-lx bg-dept-lx/15 font-bold text-dept-lx ring-1 ring-dept-lx'
                              : 'border-border-default/60 hover:border-dept-lx/60 bg-surface-1 text-content-2'
                          }`}
                        >
                          <div
                            className="h-3.5 w-full rounded-sm border border-border-subtle/50"
                            style={{ backgroundColor: p.hex }}
                          />
                          <span className="truncate w-full text-center">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Gamut Warning Banner */}
                {isGamutWarning && (
                  <div className="flex items-center gap-1.5 rounded bg-status-standby/15 border border-status-standby/40 p-2 text-[11px] text-status-standby">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                    <span>Màu bão hòa cao: Có thể vượt dải hiển thị chuẩn của fixture.</span>
                  </div>
                )}

                {/* Fixture Types & Counts Management */}
                <div className="pt-2 border-t border-border-subtle/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-content-2">
                      Danh sách Đèn ({cue.totalLightingFixtures} chiếc)
                    </span>
                  </div>

                  {/* Active Fixtures List */}
                  <div className="space-y-1.5 mb-2.5">
                    {lx?.fixtures && lx.fixtures.length > 0 ? (
                      lx.fixtures.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between gap-2 rounded bg-surface-1 px-2.5 py-1 text-xs border border-border-subtle"
                        >
                          <span className="font-medium text-content-1">{f.subType}</span>
                          <div className="flex items-center gap-1.5">
                            <label htmlFor={`inspector-fixture-count-${f.id}`} className="sr-only">
                              Số lượng {f.subType}
                            </label>
                            <input
                              id={`inspector-fixture-count-${f.id}`}
                              type="number"
                              min={0}
                              value={f.count}
                              onChange={(e) =>
                                handleFixtureCountChange(f.id, parseInt(e.target.value, 10))
                              }
                              className="w-12 rounded border border-border-default bg-surface-2 px-1.5 py-0.5 text-center text-xs font-mono font-bold text-dept-lx focus:border-dept-lx focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveFixture(f.id)}
                              className="p-1 text-content-3 hover:text-status-danger transition-colors"
                              title="Xóa loại đèn"
                              aria-label={`Xóa loại đèn ${f.subType}`}
                            >
                              <Trash2 className="h-3 w-3" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-content-3 italic text-center py-1">
                        Chưa có danh sách fixture chi tiết.
                      </div>
                    )}
                  </div>

                  {/* Quick Add Fixture Pills */}
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-content-3 mr-1">+ Thêm:</span>
                    {STANDARD_FIXTURE_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleAddFixtureType(type)}
                        className="rounded bg-surface-2 hover:bg-surface-3 border border-border-default px-1.5 py-0.5 text-[10px] text-content-2 hover:text-dept-lx transition-colors"
                      >
                        +{type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* ACCORDION 3: VISUAL LED (VX) */}
          {/* ============================================================== */}
          <div className="rounded border border-border-default bg-surface-0 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('vx')}
              className="flex w-full items-center justify-between px-3 py-2 bg-surface-1/70 hover:bg-surface-2/60 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Tv className="h-3.5 w-3.5 text-dept-vx" aria-hidden="true" />
                <span className="text-xs font-bold text-dept-vx">Visual LED (VX)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-content-3">
                  {cue.totalScreens} màn hình
                </span>
                {openSections.vx ? (
                  <ChevronDown className="h-3.5 w-3.5 text-content-3" aria-hidden="true" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-content-3" aria-hidden="true" />
                )}
              </div>
            </button>

            {openSections.vx && (
              <div className="p-3 space-y-2.5 text-xs">
                {/* Content / Media Title */}
                <div>
                  <label htmlFor="inspector-vx-content-name" className="block text-[11px] font-semibold text-content-3 mb-1">
                    Tên Nội Dung / Media (Content Name)
                  </label>
                  <input
                    id="inspector-vx-content-name"
                    type="text"
                    value={vx?.contentName || ''}
                    onChange={(e) => handleUpdateVx({ contentName: e.target.value })}
                    placeholder="Logo Loop.mp4, Slide Keynote, Particles..."
                    className="w-full rounded border border-border-default bg-surface-1 px-2.5 py-1.5 text-xs text-content-1 focus:border-dept-vx focus:outline-none"
                  />
                </div>

                {/* Screen Target & Screen Count */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="inspector-vx-screen-target" className="block text-[11px] font-semibold text-content-3 mb-1">
                      Mục Tiêu Màn Hình
                    </label>
                    <select
                      id="inspector-vx-screen-target"
                      value={vx?.screenTarget || 'All Screens'}
                      onChange={(e) => handleUpdateVx({ screenTarget: e.target.value })}
                      className="w-full rounded border border-border-default bg-surface-1 px-2 py-1.5 text-xs text-content-1 focus:border-dept-vx focus:outline-none"
                    >
                      <option value="All Screens">Tất Cả Màn Hình</option>
                      <option value="Main LED">Màn Hình Chính</option>
                      <option value="Left Wing">Cánh Trái</option>
                      <option value="Right Wing">Cánh Phải</option>
                      <option value="FloorScreen">Màn Sàn LED</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="inspector-vx-screen-count" className="block text-[11px] font-semibold text-content-3 mb-1">
                      Số Lượng Màn Hình
                    </label>
                    <input
                      id="inspector-vx-screen-count"
                      type="number"
                      min={0}
                      value={vx?.screenCount ?? 1}
                      onChange={(e) =>
                        handleUpdateVx({ screenCount: Math.max(0, parseInt(e.target.value, 10)) })
                      }
                      className="w-full rounded border border-border-default bg-surface-1 px-2.5 py-1.5 text-xs text-content-1 font-mono font-bold text-dept-vx focus:border-dept-vx focus:outline-none"
                    />
                  </div>
                </div>

                {/* Loop Video Toggle */}
                <div className="pt-1">
                  <label htmlFor="inspector-vx-loop-toggle" className="flex items-center gap-2 cursor-pointer text-xs text-content-2 hover:text-content-1">
                    <input
                      id="inspector-vx-loop-toggle"
                      type="checkbox"
                      checked={vx?.loop ?? true}
                      onChange={(e) => handleUpdateVx({ loop: e.target.checked })}
                      className="rounded border-border-default text-dept-vx focus:ring-dept-vx"
                    />
                    <Repeat className="h-3.5 w-3.5 text-dept-vx" aria-hidden="true" />
                    <span>Lặp lại video liên tục (Loop Video)</span>
                  </label>
                </div>

                {/* Active Layer Mapping */}
                <div className="pt-1">
                  <span className="block text-[11px] font-semibold text-content-3 mb-1.5 flex items-center gap-1">
                    <Layers className="h-3 w-3 text-dept-vx" aria-hidden="true" />
                    <span>Lớp Phát (Layer Mapping)</span>
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Background', 'Slide', 'Overlay'] as const).map((layer) => {
                      const isCurrentLayer = (vx?.notes || '').includes(`Layer: ${layer}`);
                      return (
                        <button
                          key={layer}
                          type="button"
                          onClick={() => {
                            const newNotes = `Layer: ${layer}`;
                            handleUpdateVx({ notes: newNotes });
                          }}
                          className={`rounded py-1 px-1.5 text-center text-xs font-semibold border transition-all ${
                            isCurrentLayer
                              ? 'bg-dept-vx text-surface-0 border-dept-vx'
                              : 'bg-surface-1 hover:bg-surface-2 text-content-2 border-border-default'
                          }`}
                        >
                          {layer}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* ACCORDION 4: SOUND (SQ) */}
          {/* ============================================================== */}
          <div className="rounded border border-border-default bg-surface-0 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('sq')}
              className="flex w-full items-center justify-between px-3 py-2 bg-surface-1/70 hover:bg-surface-2/60 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5 text-dept-sq" aria-hidden="true" />
                <span className="text-xs font-bold text-dept-sq">Sound (SQ)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-content-3">
                  {sq?.volume ?? 80}%
                </span>
                {openSections.sq ? (
                  <ChevronDown className="h-3.5 w-3.5 text-content-3" aria-hidden="true" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-content-3" aria-hidden="true" />
                )}
              </div>
            </button>

            {openSections.sq && (
              <div className="p-3 space-y-3 text-xs">
                {/* Track Name */}
                <div>
                  <label htmlFor="inspector-sq-track-name" className="block text-[11px] font-semibold text-content-3 mb-1">
                    Tên Bản Nhạc / Âm Thanh (Track Name)
                  </label>
                  <input
                    id="inspector-sq-track-name"
                    type="text"
                    value={sq?.trackName || ''}
                    onChange={(e) => handleUpdateSq({ trackName: e.target.value })}
                    placeholder="BGM Lounge Playlist, Stinger Intro..."
                    className="w-full rounded border border-border-default bg-surface-1 px-2.5 py-1.5 text-xs text-content-1 focus:border-dept-sq focus:outline-none"
                  />
                </div>

                {/* Volume Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="inspector-sq-volume-slider" className="text-[11px] font-semibold text-content-3">
                      Âm Lượng (Volume)
                    </label>
                    <span className="font-mono font-bold text-dept-sq text-xs">
                      {sq?.volume ?? 80}%
                    </span>
                  </div>
                  <input
                    id="inspector-sq-volume-slider"
                    type="range"
                    min={0}
                    max={100}
                    value={sq?.volume ?? 80}
                    onChange={(e) => handleUpdateSq({ volume: parseInt(e.target.value, 10) })}
                    className="w-full accent-dept-sq cursor-pointer"
                  />
                </div>

                {/* Fade Duration */}
                <div>
                  <label htmlFor="inspector-sq-fade-duration" className="block text-[11px] font-semibold text-content-3 mb-1">
                    Thời gian Fade In / Fade Out (Giây)
                  </label>
                  <input
                    id="inspector-sq-fade-duration"
                    type="number"
                    min={0}
                    step={0.5}
                    value={sq?.fadeDurationSec ?? 2}
                    onChange={(e) =>
                      handleUpdateSq({ fadeDurationSec: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded border border-border-default bg-surface-1 px-2.5 py-1.5 text-xs text-content-1 font-mono focus:border-dept-sq focus:outline-none"
                  />
                </div>

                {/* Microphone Channels Checklist */}
                <div>
                  <span className="block text-[11px] font-semibold text-content-3 mb-1.5">
                    Kênh Micro Hoạt Động (Mic Channels)
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {STANDARD_MIC_CHANNELS.map((ch) => {
                      const isChecked = (sq?.micChannels || []).includes(ch);
                      return (
                        <label
                          key={ch}
                          className={`flex items-center gap-1.5 rounded p-1.5 border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-dept-sq/15 border-dept-sq text-dept-sq font-semibold'
                              : 'bg-surface-1 border-border-default/60 text-content-2 hover:bg-surface-2'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleMicChannel(ch)}
                            className="rounded border-border-default text-dept-sq focus:ring-dept-sq"
                          />
                          <span className="text-[10px] truncate">{ch}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* ACCORDION 5: STAGE ACTION (ST) */}
          {/* ============================================================== */}
          <div className="rounded border border-border-default bg-surface-0 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('st')}
              className="flex w-full items-center justify-between px-3 py-2 bg-surface-1/70 hover:bg-surface-2/60 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-dept-st" aria-hidden="true" />
                <span className="text-xs font-bold text-dept-st">Stage Action (ST)</span>
              </div>
              <div className="flex items-center gap-1.5">
                {openSections.st ? (
                  <ChevronDown className="h-3.5 w-3.5 text-content-3" aria-hidden="true" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-content-3" aria-hidden="true" />
                )}
              </div>
            </button>

            {openSections.st && (
              <div className="p-3 space-y-2.5 text-xs">
                {/* Action / Blocking Description */}
                <div>
                  <label htmlFor="inspector-st-action-desc" className="block text-[11px] font-semibold text-content-3 mb-1">
                    Hoạt cảnh / Di chuyển Sân Khấu (Blocking)
                  </label>
                  <textarea
                    id="inspector-st-action-desc"
                    rows={2}
                    value={st?.actionDescription || ''}
                    onChange={(e) => handleUpdateSt({ actionDescription: e.target.value })}
                    placeholder="MC bước ra Center Stage, diễn viên múa vào vị trí 2 cánh..."
                    className="w-full rounded border border-border-default bg-surface-1 px-2.5 py-1.5 text-xs text-content-1 focus:border-dept-st focus:outline-none resize-none"
                  />
                </div>

                {/* Cast Members */}
                <div>
                  <label htmlFor="inspector-st-cast-members" className="block text-[11px] font-semibold text-content-3 mb-1">
                    Diễn viên / Nhân sự (Cast Members)
                  </label>
                  <input
                    id="inspector-st-cast-members"
                    type="text"
                    value={(st?.castMembers || []).join(', ')}
                    onChange={(e) => {
                      const members = e.target.value
                        .split(',')
                        .map((m) => m.trim())
                        .filter(Boolean);
                      handleUpdateSt({ castMembers: members });
                    }}
                    placeholder="MC Trấn Thành, Ca sĩ Mỹ Tâm, Vũ đoàn..."
                    className="w-full rounded border border-border-default bg-surface-1 px-2.5 py-1.5 text-xs text-content-1 focus:border-dept-st focus:outline-none"
                  />
                </div>

                {/* Props */}
                <div>
                  <label htmlFor="inspector-st-props" className="block text-[11px] font-semibold text-content-3 mb-1">
                    Đạo Cụ (Props)
                  </label>
                  <input
                    id="inspector-st-props"
                    type="text"
                    value={(st?.props || []).join(', ')}
                    onChange={(e) => {
                      const propsList = e.target.value
                        .split(',')
                        .map((p) => p.trim())
                        .filter(Boolean);
                      handleUpdateSt({ props: propsList });
                    }}
                    placeholder="Micro không dây, Bục phát biểu, Hoa..."
                    className="w-full rounded border border-border-default bg-surface-1 px-2.5 py-1.5 text-xs text-content-1 focus:border-dept-st focus:outline-none"
                  />
                </div>

                {/* Director Notes */}
                <div>
                  <label htmlFor="inspector-st-director-notes" className="block text-[11px] font-semibold text-content-3 mb-1">
                    Chỉ Đạo Sân Khấu (Director Notes)
                  </label>
                  <textarea
                    id="inspector-st-director-notes"
                    rows={2}
                    value={st?.notes || ''}
                    onChange={(e) => handleUpdateSt({ notes: e.target.value })}
                    placeholder="Lưu ý an toàn, tín hiệu đèn follow..."
                    className="w-full rounded border border-border-default bg-surface-1 px-2.5 py-1.5 text-xs text-content-1 focus:border-dept-st focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
