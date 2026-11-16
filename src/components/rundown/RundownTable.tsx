import React, { useState, useRef, useEffect } from 'react';
import { useShowStore } from '../../store/useShowStore';
import { useClockStore, formatDuration } from '../../store/useClockStore';
import { Cue, CueStatus, DeviceSpecification, LightingColor, sumDeviceCounts } from '../../types/stage';
import { parseTimeString } from '../../services/importer';
import { ClampedPopover } from '../common/ClampedPopover';
import {
  LIGHTING_FIXTURE_TYPES,
  UNCLASSIFIED_LABEL,
  createDeviceSpec,
  formatFixtureSummary,
  getCueLightingCount,
  getEditableFixtures,
  hasUnclassifiedFixtures,
  parseFixtureText,
} from '../../services/fixtureModel';
import {
  resolveLightingColorToHex,
  getLightingColorLabel,
} from '../../data/colors';
import {
  kelvinToRgb,
  rgbToHex,
  hexToOklch,
  gamutMap,
} from '../../services/color';
import {
  Play,
  Clock,
  Lightbulb,
  Tv,
  Volume2,
  Users,
  Plus,
  Copy,
  Trash2,
  Pause,
  RotateCcw,
  FastForward,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Check,
  X,
  Palette,
} from 'lucide-react';

export type RoleFilter = 'ALL' | 'LX' | 'VX' | 'SQ' | 'ST';

export interface EditingCellState {
  cueId: string;
  field: 'title' | 'duration' | 'lx' | 'vx' | 'sq' | 'st';
}

export const RundownTable: React.FC = () => {
  const show = useShowStore((s) => s.show);
  const activeCueId = useShowStore((s) => s.activeCueId);
  const standbyCueId = useShowStore((s) => s.standbyCueId);
  const standbyCue = useShowStore((s) => s.standbyCue);
  const goCue = useShowStore((s) => s.goCue);
  const holdCue = useShowStore((s) => s.holdCue);
  const skipCue = useShowStore((s) => s.skipCue);
  const resetCue = useShowStore((s) => s.resetCue);
  const updateCue = useShowStore((s) => s.updateCue);
  const addCue = useShowStore((s) => s.addCue);
  const deleteCue = useShowStore((s) => s.deleteCue);

  const syncCueDuration = useClockStore((s) => s.syncCueDuration);
  const startClock = useClockStore((s) => s.startClock);

  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [editingCell, setEditingCell] = useState<EditingCellState | null>(null);

  // Edit draft states
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDuration, setDraftDuration] = useState('');
  const [draftLx, setDraftLx] = useState<{
    sceneName: string;
    fixtureSummary: string;
    fixtures: DeviceSpecification[];
    intensity: number;
    color: LightingColor;
    hex: string;
  }>({
    sceneName: '',
    fixtureSummary: '',
    fixtures: [],
    intensity: 100,
    color: { mode: 'kelvin', kelvin: 3200 },
    hex: '#ffd199',
  });
  const [draftVx, setDraftVx] = useState<{
    contentName: string;
    screenCount: number;
    screenTarget: string;
  }>({ contentName: '', screenCount: 1, screenTarget: 'All' });
  const [draftSq, setDraftSq] = useState<{
    trackName: string;
    volume: number;
  }>({ trackName: '', volume: 80 });
  const [draftSt, setDraftSt] = useState<{
    actionDescription: string;
  }>({ actionDescription: '' });

  // Color picker popover state for LX editing
  const [showColorPopover, setShowColorPopover] = useState(false);
  const [kelvinSliderVal, setKelvinSliderVal] = useState(3200);

  const editContainerRef = useRef<HTMLDivElement>(null);
  const [editAnchor, setEditAnchor] = useState<HTMLElement | null>(null);

  // Close editing on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (editContainerRef.current && !editContainerRef.current.contains(e.target as Node)) {
        // Commit edit when clicking outside
        if (editingCell) {
          commitCurrentEdit();
        }
      }
    };
    if (editingCell) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [editingCell, draftTitle, draftDuration, draftLx, draftVx, draftSq, draftSt]);

  const startEdit = (
    cue: Cue,
    field: EditingCellState['field'],
    anchor?: HTMLElement | null
  ) => {
    if (anchor) setEditAnchor(anchor);
    setEditingCell({ cueId: cue.id, field });
    setShowColorPopover(false);

    if (field === 'title') {
      setDraftTitle(cue.title);
    } else if (field === 'duration') {
      setDraftDuration(formatDuration(cue.durationMs));
    } else if (field === 'lx') {
      const lx = cue.departments.lx;
      const initialColor: LightingColor = lx?.color || (lx?.colorPreset ? { mode: 'rgb', hex: lx.colorPreset } : { mode: 'kelvin', kelvin: 3200 });
      const currentHex = resolveLightingColorToHex(initialColor);
      const initialKelvin = initialColor.mode === 'kelvin' ? initialColor.kelvin : 3200;

      const fixtures = getEditableFixtures(lx);
      setDraftLx({
        sceneName: lx?.sceneName || cue.title,
        fixtureSummary: lx?.fixtureSummary || (fixtures.length ? formatFixtureSummary(fixtures) : ''),
        fixtures,
        intensity: lx?.intensity ?? 100,
        color: initialColor,
        hex: currentHex,
      });
      setKelvinSliderVal(initialKelvin);
    } else if (field === 'vx') {
      const vx = cue.departments.vx;
      setDraftVx({
        contentName: vx?.contentName || 'Visual loop',
        screenCount: vx?.screenCount ?? cue.totalScreens ?? 1,
        screenTarget: vx?.screenTarget || 'All',
      });
    } else if (field === 'sq') {
      const sq = cue.departments.sq;
      setDraftSq({
        trackName: sq?.trackName || 'Audio active',
        volume: sq?.volume ?? 80,
      });
    } else if (field === 'st') {
      const st = cue.departments.st;
      setDraftSt({
        actionDescription: st?.actionDescription || '',
      });
    }
  };

  const commitCurrentEdit = () => {
    if (!editingCell) return;
    const { cueId, field } = editingCell;
    const cue = useShowStore.getState().getCueById(cueId);
    if (!cue) {
      setEditingCell(null);
      return;
    }

    if (field === 'title') {
      updateCue(cueId, { title: draftTitle.trim() || 'Untitled Cue' });
    } else if (field === 'duration') {
      const parsedSec = parseTimeString(draftDuration);
      updateCue(cueId, { durationMs: parsedSec > 0 ? parsedSec * 1000 : 60000 });
    } else if (field === 'lx') {
      const validFixtures = draftLx.fixtures.filter((f) => Number(f.count) > 0);
      updateCue(cueId, {
        departments: {
          ...cue.departments,
          lx: {
            ...cue.departments.lx,
            sceneName: draftLx.sceneName.trim(),
            fixtures: validFixtures.length > 0 ? validFixtures : undefined,
            fixtureCount: sumDeviceCounts(validFixtures),
            fixtureSummary:
              draftLx.fixtureSummary.trim() ||
              (validFixtures.length > 0 ? formatFixtureSummary(validFixtures) : undefined),
            intensity: Math.max(0, Math.min(100, Number(draftLx.intensity))),
            color: draftLx.color,
            colorPreset: draftLx.hex,
          },
        },
      });
    } else if (field === 'vx') {
      updateCue(cueId, {
        departments: {
          ...cue.departments,
          vx: {
            ...cue.departments.vx,
            contentName: draftVx.contentName.trim(),
            screenCount: Math.max(0, Number(draftVx.screenCount) || 0),
            screenTarget: draftVx.screenTarget.trim() || 'All',
          },
        },
      });
    } else if (field === 'sq') {
      updateCue(cueId, {
        departments: {
          ...cue.departments,
          sq: {
            ...cue.departments.sq,
            trackName: draftSq.trackName.trim(),
            volume: Math.max(0, Math.min(100, Number(draftSq.volume))),
          },
        },
      });
    } else if (field === 'st') {
      updateCue(cueId, {
        departments: {
          ...cue.departments,
          st: {
            ...cue.departments.st,
            actionDescription: draftSt.actionDescription.trim(),
          },
        },
      });
    }

    setEditingCell(null);
    setShowColorPopover(false);
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setShowColorPopover(false);
  };

  const handleFireGo = (cueId: string, durationMs: number) => {
    goCue(cueId);
    syncCueDuration(durationMs, true);
    startClock();
  };

  const handleDuplicateCue = (cue: Cue) => {
    addCue(
      cue.actId,
      {
        title: `${cue.title} (Copy)`,
        durationMs: cue.durationMs,
        notes: cue.notes,
        departments: JSON.parse(JSON.stringify(cue.departments)),
      },
      cue.id
    );
  };

  const handleDeleteCue = (cueId: string) => {
    deleteCue(cueId);
  };

  const handleAddCueBelow = (cue: Cue) => {
    addCue(cue.actId, { title: 'New Cue', durationMs: 60000 }, cue.id);
  };

  // Keyboard navigation for inline inputs
  const handleInputKeyDown = (
    e: React.KeyboardEvent,
    nextField?: EditingCellState['field']
  ) => {
    // Crucial: Stop space key from triggering GO when inside an input or textarea
    if (e.code === 'Space') {
      e.stopPropagation();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      commitCurrentEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cancelEdit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commitCurrentEdit();
      if (editingCell && nextField) {
        const cue = useShowStore.getState().getCueById(editingCell.cueId);
        if (cue) {
          startEdit(cue, nextField);
        }
      }
    }
  };

  // Gamut check helper
  const isOutOfGamut = (hex: string): boolean => {
    try {
      const lch = hexToOklch(hex);
      return gamutMap(lch).outOfGamut;
    } catch {
      return false;
    }
  };

  // Unified cue status badges with 1 consistent icon + color
  const renderStatusBadge = (status: CueStatus, isActive: boolean, isStandby: boolean) => {
    if (isActive || status === 'Go') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold bg-status-go/20 text-status-go border border-status-go/60 ring-2 ring-status-go/40 shadow-sm animate-pulse">
          <Play className="h-3 w-3 fill-current" />
          <span>GO</span>
        </span>
      );
    }
    if (isStandby || status === 'Standby') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold bg-status-standby/20 text-status-standby border border-status-standby/60 ring-1 ring-status-standby/40">
          <AlertCircle className="h-3 w-3" />
          <span>STANDBY</span>
        </span>
      );
    }
    if (status === 'Hold') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold bg-status-hold/20 text-status-hold border border-status-hold/60">
          <Pause className="h-3 w-3" />
          <span>HOLD</span>
        </span>
      );
    }
    if (status === 'Skip') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium bg-surface-2 text-content-3 border border-border-default line-through">
          <FastForward className="h-3 w-3" />
          <span>SKIP</span>
        </span>
      );
    }
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium bg-surface-2 text-content-3 border border-border-default/60">
          <CheckCircle2 className="h-3 w-3 text-status-go/70" />
          <span>DONE</span>
        </span>
      );
    }
    // Pending
    return (
      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium bg-surface-2/60 text-content-3 border border-border-default/40">
        <Clock className="h-3 w-3 text-content-3" />
        <span>PENDING</span>
      </span>
    );
  };

  // Distinct highlight for the active GO row, calm neutral style for other rows
  const getRowHighlight = (isActive: boolean, isStandby: boolean) => {
    if (isActive) {
      return 'bg-status-go/10 border-l-4 border-l-status-go ring-1 ring-status-go/20 shadow-sm';
    }
    if (isStandby) {
      return 'bg-status-standby/10 border-l-4 border-l-status-standby';
    }
    return 'border-l-4 border-l-transparent hover:bg-surface-1/50 transition-colors';
  };

  return (
    <div className="flex h-full w-full flex-col bg-surface-0 text-content-1 select-none">
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default bg-surface-1/90 px-4 py-2.5 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-content-3">
            View Role:
          </span>
          <div className="inline-flex rounded-lg bg-surface-2 p-0.5 text-xs border border-border-default">
            {(['ALL', 'LX', 'VX', 'SQ', 'ST'] as RoleFilter[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                  roleFilter === role
                    ? 'bg-accent text-surface-0 font-bold shadow-sm'
                    : 'text-content-3 hover:text-content-1'
                }`}
              >
                {role === 'ALL' ? 'Master View' : role}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (show.acts.length > 0) {
                const actId = show.acts[0].id;
                addCue(actId, { title: 'New Cue' });
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface-3 hover:bg-surface-2 border border-border-default px-3 py-1.5 text-xs font-semibold text-content-1 shadow transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-accent" />
            <span>Add Cue</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-border-default bg-surface-1 text-content-3 uppercase font-mono tracking-wider">
            <tr>
              <th className="py-2.5 px-3 w-24">Status</th>
              <th className="py-2.5 px-3 w-16">Cue #</th>
              <th className="py-2.5 px-4 min-w-[200px]">Title & Description</th>
              <th className="py-2.5 px-3 w-24">Duration</th>

              {(roleFilter === 'ALL' || roleFilter === 'LX') && (
                <th className="py-2.5 px-3 min-w-[170px] text-dept-lx">
                  <div className="flex items-center gap-1">
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>Lighting (LX)</span>
                  </div>
                </th>
              )}

              {(roleFilter === 'ALL' || roleFilter === 'VX') && (
                <th className="py-2.5 px-3 min-w-[150px] text-dept-vx">
                  <div className="flex items-center gap-1">
                    <Tv className="h-3.5 w-3.5" />
                    <span>Visual LED (VX)</span>
                  </div>
                </th>
              )}

              {(roleFilter === 'ALL' || roleFilter === 'SQ') && (
                <th className="py-2.5 px-3 min-w-[140px] text-dept-sq">
                  <div className="flex items-center gap-1">
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Sound (SQ)</span>
                  </div>
                </th>
              )}

              {(roleFilter === 'ALL' || roleFilter === 'ST') && (
                <th className="py-2.5 px-3 min-w-[140px] text-dept-st">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>Stage Action</span>
                  </div>
                </th>
              )}

              <th className="py-2.5 px-3 text-right w-56">Calling Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border-default/60 font-sans">
            {show.acts.map((act) => (
              <React.Fragment key={act.id}>
                {/* Act Header Banner */}
                <tr className="bg-surface-1 font-semibold text-content-2">
                  <td colSpan={10} className="py-2 px-4 text-xs tracking-wide">
                    <span className="text-content-1 mr-2 font-mono">{act.title}</span>
                    <span className="text-[11px] font-normal text-content-3">
                      ({act.cues.length} cues)
                    </span>
                  </td>
                </tr>

                {/* Cue Rows */}
                {act.cues.map((cue) => {
                  const isActive = activeCueId === cue.id;
                  const isStandby = standbyCueId === cue.id;
                  const isEditingThisCue = editingCell?.cueId === cue.id;

                  return (
                    <tr
                      key={cue.id}
                      className={`transition-colors group/row ${getRowHighlight(isActive, isStandby)}`}
                    >
                      {/* Status Badge */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {renderStatusBadge(cue.status, isActive, isStandby)}
                      </td>

                      {/* Cue Number */}
                      <td className="py-2.5 px-3 font-mono font-bold text-content-1">
                        {cue.cueNumber}
                      </td>

                      {/* Title & Description Cell */}
                      <td
                        className="py-2.5 px-4 cursor-pointer"
                        onDoubleClick={(e) => startEdit(cue, 'title', e.currentTarget)}
                      >
                        {isEditingThisCue && editingCell.field === 'title' ? (
                          <div ref={editContainerRef} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={draftTitle}
                              onChange={(e) => setDraftTitle(e.target.value)}
                              onKeyDown={(e) => handleInputKeyDown(e, 'duration')}
                              className="rounded border border-accent bg-surface-2 px-2 py-1 text-xs text-content-1 focus:outline-none w-full"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={commitCurrentEdit}
                              className="rounded bg-accent/20 px-2 py-1 text-[11px] font-medium text-accent hover:bg-accent/30"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={(e) => startEdit(cue, 'title', e.currentTarget)}
                            className="group flex flex-col"
                            title="Nhấp đúp hoặc bấm để sửa Tiêu đề (Enter để lưu)"
                          >
                            <span className="font-medium text-content-1 group-hover:text-accent">
                              {cue.title}
                            </span>
                            {cue.notes && (
                              <span className="text-[11px] text-content-3 italic">
                                {cue.notes}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Duration Cell */}
                      <td
                        className="py-2.5 px-3 font-mono whitespace-nowrap cursor-pointer"
                        onDoubleClick={(e) => startEdit(cue, 'duration', e.currentTarget)}
                      >
                        {isEditingThisCue && editingCell.field === 'duration' ? (
                          <div ref={editContainerRef} className="flex items-center gap-1">
                            <input
                              type="text"
                              value={draftDuration}
                              onChange={(e) => setDraftDuration(e.target.value)}
                              onKeyDown={(e) => handleInputKeyDown(e, 'lx')}
                              className="w-16 rounded border border-accent bg-surface-2 px-1.5 py-1 text-xs text-content-1 focus:outline-none"
                              placeholder="01:00"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={commitCurrentEdit}
                              className="rounded bg-accent/20 p-1 text-accent"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={(e) => startEdit(cue, 'duration', e.currentTarget)}
                            className="flex items-center gap-1.5 text-content-2 hover:text-accent"
                            title="Bấm để chỉnh sửa Thời lượng"
                          >
                            <Clock className="h-3 w-3 text-content-3" />
                            <span>{formatDuration(cue.durationMs)}</span>
                          </div>
                        )}
                      </td>

                      {/* Lighting (LX) Cell & Popover Editor */}
                      {(roleFilter === 'ALL' || roleFilter === 'LX') && (
                        <td
                          className="py-2.5 px-3 relative"
                          onDoubleClick={(e) => startEdit(cue, 'lx', e.currentTarget)}
                        >
                          {isEditingThisCue && editingCell.field === 'lx' ? (
                            <ClampedPopover
                              anchor={editAnchor}
                              width={288}
                              popoverRef={editContainerRef}
                              className="rounded-xl border border-border-default bg-surface-1 p-3 shadow-2xl space-y-2.5 text-xs text-content-1 animate-in fade-in zoom-in-95"
                            >
                              <div className="flex items-center justify-between border-b border-border-default pb-1.5">
                                <span className="font-bold text-dept-lx flex items-center gap-1.5">
                                  <Lightbulb className="h-3.5 w-3.5" />
                                  <span>Chỉnh sửa Ánh sáng (LX)</span>
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={commitCurrentEdit}
                                    className="rounded p-1 text-status-go hover:bg-surface-2"
                                    title="Lưu (Enter)"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="rounded p-1 text-content-3 hover:bg-surface-2"
                                    title="Hủy (Esc)"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Title / Scene Name */}
                              <div>
                                <label className="text-[10px] font-semibold text-content-3 block mb-0.5">
                                  Tên Cảnh Sáng (Scene Name)
                                </label>
                                <input
                                  type="text"
                                  value={draftLx.sceneName}
                                  onChange={(e) => setDraftLx({ ...draftLx, sceneName: e.target.value })}
                                  onKeyDown={(e) => handleInputKeyDown(e, 'vx')}
                                  className="w-full rounded border border-border-default bg-surface-0 px-2 py-1 text-xs text-content-1 focus:border-dept-lx focus:outline-none"
                                  placeholder="Spot 4 @FOH / Wash 12 3200K"
                                  autoFocus
                                />
                              </div>

                              {/* Fixtures: quick entry + structured rows (single source of truth) */}
                              <div className="space-y-1.5">
                                <div>
                                  <label className="text-[10px] font-semibold text-content-3 block mb-0.5">
                                    Nhập nhanh (loại × số lượng @vị trí)
                                  </label>
                                  <input
                                    type="text"
                                    value={draftLx.fixtureSummary}
                                    onChange={(e) => {
                                      const text = e.target.value;
                                      const parsed = parseFixtureText(text);
                                      setDraftLx((prev) => ({
                                        ...prev,
                                        fixtureSummary: text,
                                        fixtures:
                                          text.trim() === ''
                                            ? []
                                            : parsed.length > 0
                                              ? parsed
                                              : prev.fixtures,
                                      }));
                                    }}
                                    onKeyDown={(e) => handleInputKeyDown(e, 'vx')}
                                    className="w-full rounded border border-border-default bg-surface-0 px-2 py-1 text-xs text-content-1 focus:border-dept-lx focus:outline-none"
                                    placeholder="Beam x8, Spot x4 @FOH, Wash x12"
                                  />
                                </div>

                                <div className="rounded border border-border-default bg-surface-0/60">
                                  <div className="flex items-center justify-between border-b border-border-subtle px-2 py-1">
                                    <span className="text-[10px] font-semibold text-content-3">
                                      Danh sách đèn
                                    </span>
                                    <span className="font-mono text-[10px] font-bold text-dept-lx">
                                      Tổng: {sumDeviceCounts(draftLx.fixtures)} đèn
                                    </span>
                                  </div>

                                  <div className="max-h-40 divide-y divide-border-subtle overflow-y-auto">
                                    {draftLx.fixtures.length === 0 && (
                                      <p className="px-2 py-2 text-[10px] text-content-3">
                                        Chưa có đèn. Gõ nhanh ở trên hoặc thêm dòng.
                                      </p>
                                    )}
                                    {draftLx.fixtures.map((fixture) => {
                                      const knownType = LIGHTING_FIXTURE_TYPES.includes(
                                        fixture.subType as never
                                      )
                                        ? fixture.subType
                                        : 'Other';
                                      return (
                                        <div
                                          key={fixture.id}
                                          className="grid grid-cols-[1fr_48px_1fr_22px] items-center gap-1 px-1.5 py-1"
                                        >
                                          <select
                                            value={knownType}
                                            onChange={(e) => {
                                              const subType = e.target.value;
                                              setDraftLx((prev) => {
                                                const fixtures = prev.fixtures.map((f) =>
                                                  f.id === fixture.id
                                                    ? {
                                                        ...f,
                                                        subType,
                                                        name:
                                                          subType === 'Other'
                                                            ? UNCLASSIFIED_LABEL
                                                            : subType,
                                                      }
                                                    : f
                                                );
                                                return {
                                                  ...prev,
                                                  fixtures,
                                                  fixtureSummary: formatFixtureSummary(fixtures),
                                                };
                                              });
                                            }}
                                            className="w-full rounded border border-border-default bg-surface-0 px-1 py-0.5 text-[11px] text-content-1 focus:border-dept-lx focus:outline-none"
                                            title="Loại đèn"
                                          >
                                            {LIGHTING_FIXTURE_TYPES.map((type) => (
                                              <option key={type} value={type}>
                                                {type === 'Other' ? UNCLASSIFIED_LABEL : type}
                                              </option>
                                            ))}
                                          </select>
                                          <input
                                            type="number"
                                            min="1"
                                            value={fixture.count}
                                            onChange={(e) => {
                                              const count = Number(e.target.value);
                                              setDraftLx((prev) => {
                                                const fixtures = prev.fixtures.map((f) =>
                                                  f.id === fixture.id ? { ...f, count } : f
                                                );
                                                return {
                                                  ...prev,
                                                  fixtures,
                                                  fixtureSummary: formatFixtureSummary(fixtures),
                                                };
                                              });
                                            }}
                                            onKeyDown={(e) => handleInputKeyDown(e, 'vx')}
                                            className="w-full rounded border border-border-default bg-surface-0 px-1 py-0.5 text-center font-mono text-[11px] text-content-1 focus:border-dept-lx focus:outline-none"
                                            title="Số lượng"
                                          />
                                          <input
                                            type="text"
                                            list="lx-position-options"
                                            value={fixture.position || ''}
                                            onChange={(e) => {
                                              const position = e.target.value.trim() || undefined;
                                              setDraftLx((prev) => {
                                                const fixtures = prev.fixtures.map((f) =>
                                                  f.id === fixture.id ? { ...f, position } : f
                                                );
                                                return {
                                                  ...prev,
                                                  fixtures,
                                                  fixtureSummary: formatFixtureSummary(fixtures),
                                                };
                                              });
                                            }}
                                            onKeyDown={(e) => handleInputKeyDown(e, 'vx')}
                                            className="w-full rounded border border-border-default bg-surface-0 px-1 py-0.5 text-[11px] text-content-1 focus:border-dept-lx focus:outline-none"
                                            placeholder="Vị trí"
                                            title="Vị trí (FOH, Back, Mid, Floor…)"
                                          />
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setDraftLx((prev) => {
                                                const fixtures = prev.fixtures.filter(
                                                  (f) => f.id !== fixture.id
                                                );
                                                return {
                                                  ...prev,
                                                  fixtures,
                                                  fixtureSummary: formatFixtureSummary(fixtures),
                                                };
                                              })
                                            }
                                            className="rounded p-0.5 text-content-3 hover:bg-surface-2 hover:text-status-hold"
                                            title="Xoá đèn"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div className="flex items-center justify-between border-t border-border-subtle px-1.5 py-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDraftLx((prev) => {
                                          const fixtures = [
                                            ...prev.fixtures,
                                            createDeviceSpec({
                                              name: 'Wash',
                                              subType: 'Wash',
                                              count: 1,
                                            }),
                                          ];
                                          return {
                                            ...prev,
                                            fixtures,
                                            fixtureSummary: formatFixtureSummary(fixtures),
                                          };
                                        })
                                      }
                                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-dept-lx hover:bg-surface-2"
                                    >
                                      <Plus className="h-3 w-3" />
                                      <span>Thêm đèn</span>
                                    </button>
                                    {hasUnclassifiedFixtures(draftLx.fixtures) && (
                                      <span
                                        className="inline-flex items-center gap-1 text-[10px] text-amber-400"
                                        title="Loại đèn chưa nhận diện — sẽ được vẽ ở vị trí mặc định"
                                      >
                                        <AlertTriangle className="h-3 w-3" />
                                        <span>{UNCLASSIFIED_LABEL}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <datalist id="lx-position-options">
                                {[
                                  'FOH',
                                  'Truss',
                                  'Back',
                                  'Back-L',
                                  'Back-R',
                                  'Mid',
                                  'Floor',
                                  'SideBoom',
                                  'Ladder',
                                  'BoxBoom',
                                ].map((position) => (
                                  <option key={position} value={position} />
                                ))}
                              </datalist>

                              {/* Intensity Slider */}
                              <div>
                                <div className="flex justify-between items-center mb-0.5">
                                  <label className="text-[10px] font-semibold text-content-3">
                                    Cường độ Sáng (Intensity)
                                  </label>
                                  <span className="font-mono text-[11px] text-dept-lx font-bold">
                                    {draftLx.intensity}%
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={draftLx.intensity}
                                  onChange={(e) => setDraftLx({ ...draftLx, intensity: Number(e.target.value) })}
                                  className="w-full h-1.5 rounded-lg appearance-none bg-surface-2 accent-dept-lx cursor-pointer"
                                />
                              </div>

                              {/* Color Picker & Gamut */}
                              <div className="border-t border-border-subtle pt-2">
                                <div className="flex justify-between items-center mb-1.5">
                                  <label className="text-[10px] font-semibold text-content-3 flex items-center gap-1">
                                    <Palette className="h-3 w-3" />
                                    <span>Màu Đèn / Kelvin / Gel</span>
                                  </label>
                                  <div
                                    className="flex items-center gap-1.5 rounded px-1.5 py-0.5 bg-surface-0 border border-border-default cursor-pointer"
                                    onClick={() => setShowColorPopover(!showColorPopover)}
                                  >
                                    <span
                                      className="h-3 w-3 rounded-full border border-black/50"
                                      style={{ backgroundColor: draftLx.hex }}
                                    />
                                    <span className="font-mono text-[10px] text-content-2">
                                      {getLightingColorLabel(draftLx.color)}
                                    </span>
                                  </div>
                                </div>

                                {/* Preset Swatches */}
                                <div className="grid grid-cols-5 gap-1 mb-2">
                                  {[
                                    { label: '2700K', color: { mode: 'kelvin', kelvin: 2700 } as LightingColor, hex: '#ffb366' },
                                    { label: '3200K', color: { mode: 'kelvin', kelvin: 3200 } as LightingColor, hex: '#ffd199' },
                                    { label: '5600K', color: { mode: 'kelvin', kelvin: 5600 } as LightingColor, hex: '#fffaed' },
                                    { label: 'L201', color: { mode: 'gel', code: 'L201' } as LightingColor, hex: '#38bdf8' },
                                    { label: 'L204', color: { mode: 'gel', code: 'L204' } as LightingColor, hex: '#fb923c' },
                                    { label: 'Đỏ', color: { mode: 'name', name: 'Đỏ Sân Khấu' } as LightingColor, hex: '#ef4444' },
                                    { label: 'Xanh Lá', color: { mode: 'name', name: 'Xanh Lá' } as LightingColor, hex: '#22c55e' },
                                    { label: 'Xanh Dương', color: { mode: 'name', name: 'Xanh Dương' } as LightingColor, hex: '#3b82f6' },
                                    { label: 'Amber', color: { mode: 'name', name: 'Amber' } as LightingColor, hex: '#f59e0b' },
                                    { label: 'Cyan', color: { mode: 'name', name: 'Cyan' } as LightingColor, hex: '#06b6d4' },
                                  ].map((p, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setDraftLx({
                                          ...draftLx,
                                          color: p.color,
                                          hex: p.hex,
                                        });
                                        if (p.color.mode === 'kelvin') {
                                          setKelvinSliderVal(p.color.kelvin);
                                        }
                                      }}
                                      className="flex flex-col items-center gap-0.5 rounded p-1 hover:bg-surface-2 transition-colors border border-border-subtle"
                                      title={p.label}
                                    >
                                      <span
                                        className="h-3 w-3 rounded-full border border-black/40"
                                        style={{ backgroundColor: p.hex }}
                                      />
                                      <span className="text-[8px] font-mono truncate w-full text-center">
                                        {p.label}
                                      </span>
                                    </button>
                                  ))}
                                </div>

                                {/* Kelvin Slider */}
                                <div>
                                  <div className="flex justify-between items-center text-[10px] text-content-3 mb-0.5">
                                    <span>Kelvin Slider (1800K - 8000K):</span>
                                    <span className="font-mono font-bold text-dept-lx">{kelvinSliderVal}K</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1800"
                                    max="8000"
                                    step="100"
                                    value={kelvinSliderVal}
                                    onChange={(e) => {
                                      const k = Number(e.target.value);
                                      setKelvinSliderVal(k);
                                      const rgb = kelvinToRgb(k);
                                      const hex = rgbToHex(rgb);
                                      setDraftLx({
                                        ...draftLx,
                                        color: { mode: 'kelvin', kelvin: k },
                                        hex,
                                      });
                                    }}
                                    className="w-full h-1.5 rounded-lg appearance-none bg-surface-2 accent-dept-lx cursor-pointer"
                                  />
                                </div>

                                {/* Hex Input & Gamut Warning */}
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="flex items-center gap-1 w-full">
                                    <span className="text-[10px] text-content-3">Hex:</span>
                                    <input
                                      type="text"
                                      value={draftLx.hex}
                                      onChange={(e) => {
                                        const h = e.target.value;
                                        setDraftLx({
                                          ...draftLx,
                                          hex: h,
                                          color: { mode: 'rgb', hex: h },
                                        });
                                      }}
                                      className="w-24 rounded border border-border-default bg-surface-0 px-1.5 py-0.5 font-mono text-xs text-content-1 focus:border-dept-lx focus:outline-none"
                                    />
                                  </div>
                                  {isOutOfGamut(draftLx.hex) && (
                                    <div
                                      className="flex items-center gap-1 text-[9px] text-amber-400 bg-amber-950/40 border border-amber-800/60 rounded px-1.5 py-0.5 whitespace-nowrap"
                                      title="Màu này nằm ngoài không gian màu tiêu chuẩn sRGB"
                                    >
                                      <AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0" />
                                      <span>Gamut warning</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </ClampedPopover>
                          ) : (
                            <div
                              onClick={(e) => startEdit(cue, 'lx', e.currentTarget)}
                              className="flex flex-col gap-1 cursor-pointer group"
                              title="Bấm hoặc nhấp đúp để chỉnh sửa Ánh sáng (LX)"
                            >
                              <span className="text-content-1 group-hover:text-dept-lx">
                                {cue.departments.lx?.sceneName || 'Preset'}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center rounded bg-dept-lx/10 px-1.5 py-0.2 text-[10px] font-mono text-dept-lx border border-dept-lx/30">
                                  {getCueLightingCount(cue)} fix
                                </span>
                                {cue.departments.lx && (
                                  <div className="inline-flex items-center gap-1 rounded bg-surface-2 border border-border-default px-1.5 py-0.5 text-[10px] font-mono group-hover:border-dept-lx transition-colors">
                                    <span
                                      className="h-2 w-2 rounded-full border border-black/40 flex-shrink-0"
                                      style={{
                                        backgroundColor: resolveLightingColorToHex(
                                          cue.departments.lx.color || cue.departments.lx.colorPreset
                                        ),
                                      }}
                                    />
                                    <span className="text-content-2">
                                      {getLightingColorLabel(
                                        cue.departments.lx.color || cue.departments.lx.colorPreset
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Visual (VX) Cell & Inline Editor */}
                      {(roleFilter === 'ALL' || roleFilter === 'VX') && (
                        <td
                          className="py-2.5 px-3 relative"
                          onDoubleClick={(e) => startEdit(cue, 'vx', e.currentTarget)}
                        >
                          {isEditingThisCue && editingCell.field === 'vx' ? (
                            <ClampedPopover
                              anchor={editAnchor}
                              width={256}
                              popoverRef={editContainerRef}
                              className="rounded-xl border border-border-default bg-surface-1 p-3 shadow-2xl space-y-2 text-xs text-content-1 animate-in fade-in zoom-in-95"
                            >
                              <div className="flex items-center justify-between border-b border-border-default pb-1">
                                <span className="font-bold text-dept-vx flex items-center gap-1">
                                  <Tv className="h-3.5 w-3.5" />
                                  <span>Visual LED (VX)</span>
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={commitCurrentEdit}
                                    className="rounded p-1 text-status-go hover:bg-surface-2"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="rounded p-1 text-content-3 hover:bg-surface-2"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-semibold text-content-3 block mb-0.5">
                                  Nội dung Visual (Content)
                                </label>
                                <input
                                  type="text"
                                  value={draftVx.contentName}
                                  onChange={(e) => setDraftVx({ ...draftVx, contentName: e.target.value })}
                                  onKeyDown={(e) => handleInputKeyDown(e, 'sq')}
                                  className="w-full rounded border border-border-default bg-surface-0 px-2 py-1 text-xs text-content-1 focus:border-dept-vx focus:outline-none"
                                  placeholder="Logo Loop / Opening Video"
                                  autoFocus
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-semibold text-content-3 block mb-0.5">
                                    Số màn hình
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={draftVx.screenCount}
                                    onChange={(e) => setDraftVx({ ...draftVx, screenCount: Number(e.target.value) })}
                                    onKeyDown={(e) => handleInputKeyDown(e, 'sq')}
                                    className="w-full rounded border border-border-default bg-surface-0 px-2 py-1 text-xs text-content-1 focus:border-dept-vx focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-content-3 block mb-0.5">
                                    Mục tiêu màn hình
                                  </label>
                                  <input
                                    type="text"
                                    value={draftVx.screenTarget}
                                    onChange={(e) => setDraftVx({ ...draftVx, screenTarget: e.target.value })}
                                    onKeyDown={(e) => handleInputKeyDown(e, 'sq')}
                                    className="w-full rounded border border-border-default bg-surface-0 px-2 py-1 text-xs text-content-1 focus:border-dept-vx focus:outline-none"
                                    placeholder="Main LED / All"
                                  />
                                </div>
                              </div>
                            </ClampedPopover>
                          ) : (
                            <div
                              onClick={(e) => startEdit(cue, 'vx', e.currentTarget)}
                              className="flex flex-col gap-0.5 cursor-pointer group"
                              title="Bấm hoặc nhấp đúp để chỉnh sửa Visual LED (VX)"
                            >
                              <span className="text-content-1 group-hover:text-dept-vx">
                                {cue.departments.vx?.contentName || 'Visual loop'}
                              </span>
                              <span className="inline-flex w-fit items-center rounded bg-dept-vx/10 px-1.5 py-0.2 text-[10px] font-mono text-dept-vx border border-dept-vx/30">
                                {cue.totalScreens} screens
                              </span>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Sound (SQ) Cell & Inline Editor */}
                      {(roleFilter === 'ALL' || roleFilter === 'SQ') && (
                        <td
                          className="py-2.5 px-3 relative"
                          onDoubleClick={(e) => startEdit(cue, 'sq', e.currentTarget)}
                        >
                          {isEditingThisCue && editingCell.field === 'sq' ? (
                            <ClampedPopover
                              anchor={editAnchor}
                              width={256}
                              popoverRef={editContainerRef}
                              className="rounded-xl border border-border-default bg-surface-1 p-3 shadow-2xl space-y-2 text-xs text-content-1 animate-in fade-in zoom-in-95"
                            >
                              <div className="flex items-center justify-between border-b border-border-default pb-1">
                                <span className="font-bold text-dept-sq flex items-center gap-1">
                                  <Volume2 className="h-3.5 w-3.5" />
                                  <span>Âm thanh (SQ)</span>
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={commitCurrentEdit}
                                    className="rounded p-1 text-status-go hover:bg-surface-2"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="rounded p-1 text-content-3 hover:bg-surface-2"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-semibold text-content-3 block mb-0.5">
                                  Tên bài nhạc / Track Name
                                </label>
                                <input
                                  type="text"
                                  value={draftSq.trackName}
                                  onChange={(e) => setDraftSq({ ...draftSq, trackName: e.target.value })}
                                  onKeyDown={(e) => handleInputKeyDown(e, 'st')}
                                  className="w-full rounded border border-border-default bg-surface-0 px-2 py-1 text-xs text-content-1 focus:border-dept-sq focus:outline-none"
                                  placeholder="BGM Intro / Mic 1"
                                  autoFocus
                                />
                              </div>

                              <div>
                                <div className="flex justify-between items-center mb-0.5">
                                  <label className="text-[10px] font-semibold text-content-3">
                                    Âm lượng (Volume)
                                  </label>
                                  <span className="font-mono text-[10px] text-dept-sq font-bold">
                                    {draftSq.volume}%
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={draftSq.volume}
                                  onChange={(e) => setDraftSq({ ...draftSq, volume: Number(e.target.value) })}
                                  className="w-full h-1.5 rounded-lg appearance-none bg-surface-2 accent-dept-sq cursor-pointer"
                                />
                              </div>
                            </ClampedPopover>
                          ) : (
                            <div
                              onClick={(e) => startEdit(cue, 'sq', e.currentTarget)}
                              className="cursor-pointer group"
                              title="Bấm hoặc nhấp đúp để chỉnh sửa Âm thanh (SQ)"
                            >
                              <span className="text-content-1 group-hover:text-dept-sq">
                                {cue.departments.sq?.trackName || 'Audio active'}
                              </span>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Stage Action (ST) Cell & Inline Editor */}
                      {(roleFilter === 'ALL' || roleFilter === 'ST') && (
                        <td
                          className="py-2.5 px-3 relative"
                          onDoubleClick={(e) => startEdit(cue, 'st', e.currentTarget)}
                        >
                          {isEditingThisCue && editingCell.field === 'st' ? (
                            <ClampedPopover
                              anchor={editAnchor}
                              width={288}
                              popoverRef={editContainerRef}
                              className="rounded-xl border border-border-default bg-surface-1 p-3 shadow-2xl space-y-2 text-xs text-content-1 animate-in fade-in zoom-in-95"
                            >
                              <div className="flex items-center justify-between border-b border-border-default pb-1">
                                <span className="font-bold text-dept-st flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  <span>Hoạt cảnh Sân khấu (ST)</span>
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={commitCurrentEdit}
                                    className="rounded p-1 text-status-go hover:bg-surface-2"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="rounded p-1 text-content-3 hover:bg-surface-2"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-semibold text-content-3 block mb-0.5">
                                  Chỉ dẫn Diễn viên / Đạo cụ
                                </label>
                                <textarea
                                  rows={2}
                                  value={draftSt.actionDescription}
                                  onChange={(e) => setDraftSt({ ...draftSt, actionDescription: e.target.value })}
                                  onKeyDown={(e) => handleInputKeyDown(e)}
                                  className="w-full rounded border border-border-default bg-surface-0 px-2 py-1 text-xs text-content-1 focus:border-dept-st focus:outline-none"
                                  placeholder="MC bước ra Center, vũ đoàn vào vị trí"
                                  autoFocus
                                />
                              </div>
                            </ClampedPopover>
                          ) : (
                            <div
                              onClick={(e) => startEdit(cue, 'st', e.currentTarget)}
                              className="cursor-pointer group"
                              title="Bấm hoặc nhấp đúp để chỉnh sửa Hoạt cảnh (ST)"
                            >
                              <span className="text-content-2 group-hover:text-dept-st">
                                {cue.departments.st?.actionDescription || '—'}
                              </span>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Calling Actions & Row Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Standby Button */}
                          <button
                            type="button"
                            onClick={() => standbyCue(cue.id)}
                            className={`rounded px-2 py-1 text-[11px] font-bold tracking-wide transition-colors ${
                              isStandby
                                ? 'bg-status-standby text-surface-0 ring-2 ring-status-standby'
                                : 'bg-status-standby/20 text-status-standby hover:bg-status-standby/30 border border-status-standby/40'
                            }`}
                          >
                            STBY
                          </button>

                          {/* Go Button */}
                          <button
                            type="button"
                            onClick={() => handleFireGo(cue.id, cue.durationMs)}
                            className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-bold tracking-wide transition-colors ${
                              isActive
                                ? 'bg-status-go text-surface-0 ring-2 ring-status-go animate-pulse'
                                : 'bg-status-go/80 hover:bg-status-go text-surface-0 shadow'
                            }`}
                          >
                            <Play className="h-3 w-3 fill-current" />
                            <span>GO</span>
                          </button>

                          {/* Hold */}
                          <button
                            type="button"
                            onClick={() => holdCue(cue.id)}
                            title="Hold Cue"
                            className="rounded p-1 text-content-3 hover:bg-status-hold/20 hover:text-status-hold transition-colors"
                          >
                            <Pause className="h-3.5 w-3.5" />
                          </button>

                          {/* Skip */}
                          <button
                            type="button"
                            onClick={() => skipCue(cue.id)}
                            title="Skip Cue"
                            className="rounded p-1 text-content-3 hover:bg-surface-2 hover:text-content-1 transition-colors"
                          >
                            <FastForward className="h-3.5 w-3.5" />
                          </button>

                          {/* Reset */}
                          <button
                            type="button"
                            onClick={() => resetCue(cue.id)}
                            title="Reset Cue"
                            className="rounded p-1 text-content-3 hover:bg-surface-2 hover:text-content-1 transition-colors"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>

                          <div className="h-4 w-px bg-border-subtle mx-0.5" />

                          {/* Add Below (+) */}
                          <button
                            type="button"
                            onClick={() => handleAddCueBelow(cue)}
                            title="Thêm Cue bên dưới"
                            className="rounded p-1 text-content-3 hover:text-accent hover:bg-surface-2 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => handleDuplicateCue(cue)}
                            title="Nhân đôi Cue"
                            className="rounded p-1 text-content-3 hover:text-content-1 hover:bg-surface-2 transition-colors"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCue(cue.id)}
                            title="Xóa Cue"
                            className="rounded p-1 text-content-3 hover:text-status-danger hover:bg-status-danger/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
