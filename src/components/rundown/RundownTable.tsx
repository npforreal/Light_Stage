import React, { useState } from 'react';
import { useShowStore } from '../../store/useShowStore';
import { useClockStore, formatDuration } from '../../store/useClockStore';
import { Cue, CueStatus, LightingColor } from '../../types/stage';
import { parseTimeString } from '../../services/importer';
import { resolveLightingColorToHex, getLightingColorLabel } from '../../data/colors';
import {
  Play,
  Clock,
  Lightbulb,
  Tv,
  Volume2,
  Users,
  Plus,
  Pause,
  RotateCcw,
  FastForward,
} from 'lucide-react';

export type RoleFilter = 'ALL' | 'LX' | 'VX' | 'SQ' | 'ST';

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

  const syncCueDuration = useClockStore((s) => s.syncCueDuration);
  const startClock = useClockStore((s) => s.startClock);

  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [editingCueId, setEditingCueId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDuration, setEditingDuration] = useState('');

  const handleStartEdit = (cue: Cue) => {
    setEditingCueId(cue.id);
    setEditingTitle(cue.title);
    setEditingDuration(formatDuration(cue.durationMs));
  };

  const handleSaveEdit = (cueId: string) => {
    if (editingCueId === cueId) {
      const parsedSec = parseTimeString(editingDuration);
      updateCue(cueId, {
        title: editingTitle.trim() || 'Untitled Cue',
        durationMs: parsedSec > 0 ? parsedSec * 1000 : 60000,
      });
      setEditingCueId(null);
    }
  };

  const handleFireGo = (cueId: string, durationMs: number) => {
    goCue(cueId);
    syncCueDuration(durationMs, true);
    startClock();
  };

  const handleCycleColor = (cue: Cue) => {
    if (!cue.departments.lx) return;
    const presets: LightingColor[] = [
      { mode: 'kelvin', kelvin: 3200 },
      { mode: 'kelvin', kelvin: 5600 },
      { mode: 'kelvin', kelvin: 2700 },
      { mode: 'name', name: 'Amber' },
      { mode: 'gel', code: 'L201' },
      { mode: 'gel', code: 'L204' },
      { mode: 'name', name: 'Đỏ Sân Khấu' },
      { mode: 'name', name: 'Xanh Lá' },
      { mode: 'name', name: 'Xanh Dương' },
      { mode: 'name', name: 'Cyan' },
    ];

    const currentLabel = getLightingColorLabel(cue.departments.lx.color || cue.departments.lx.colorPreset);
    const currentIndex = presets.findIndex((p) => getLightingColorLabel(p) === currentLabel);
    const nextColor = presets[(currentIndex + 1) % presets.length];

    updateCue(cue.id, {
      departments: {
        ...cue.departments,
        lx: {
          ...cue.departments.lx,
          color: nextColor,
          colorPreset: resolveLightingColorToHex(nextColor),
        },
      },
    });
  };

  const getStatusBadgeStyle = (status: CueStatus, isActive: boolean, isStandby: boolean) => {
    if (isActive || status === 'Go') {
      return 'bg-status-go/20 text-status-go border border-status-go/60 ring-2 ring-status-go/30';
    }
    if (isStandby || status === 'Standby') {
      return 'bg-status-standby/20 text-status-standby border border-status-standby/60 ring-2 ring-status-standby/30';
    }
    if (status === 'Hold') {
      return 'bg-status-hold/20 text-status-hold border border-status-hold/50';
    }
    if (status === 'Skip') {
      return 'bg-surface-2 text-content-3 line-through border border-border-default';
    }
    if (status === 'Completed') {
      return 'bg-surface-2/80 text-content-3 border border-border-default/60';
    }
    return 'bg-surface-2/50 text-content-2 border border-border-default/40';
  };

  const getRowHighlight = (isActive: boolean, isStandby: boolean) => {
    if (isActive) return 'bg-status-go/10 border-l-4 border-l-status-go';
    if (isStandby) return 'bg-status-standby/10 border-l-4 border-l-status-standby';
    return 'border-l-4 border-l-transparent hover:bg-surface-1/60';
  };

  return (
    <div className="flex h-full w-full flex-col bg-surface-0 text-content-1">
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default bg-surface-1/90 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-content-3">
            View Role:
          </span>
          <div className="inline-flex rounded-lg bg-surface-2 p-0.5 text-xs border border-border-default">
            {(['ALL', 'LX', 'VX', 'SQ', 'ST'] as RoleFilter[]).map((role) => (
              <button
                key={role}
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
              <th className="py-2.5 px-3 w-20">Status</th>
              <th className="py-2.5 px-3 w-16">Cue #</th>
              <th className="py-2.5 px-4 min-w-[200px]">Title & Description</th>
              <th className="py-2.5 px-3 w-24">Duration</th>

              {(roleFilter === 'ALL' || roleFilter === 'LX') && (
                <th className="py-2.5 px-3 min-w-[140px] text-dept-lx">
                  <div className="flex items-center gap-1">
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>Lighting (LX)</span>
                  </div>
                </th>
              )}

              {(roleFilter === 'ALL' || roleFilter === 'VX') && (
                <th className="py-2.5 px-3 min-w-[140px] text-dept-vx">
                  <div className="flex items-center gap-1">
                    <Tv className="h-3.5 w-3.5" />
                    <span>Visual LED (VX)</span>
                  </div>
                </th>
              )}

              {(roleFilter === 'ALL' || roleFilter === 'SQ') && (
                <th className="py-2.5 px-3 min-w-[130px] text-dept-sq">
                  <div className="flex items-center gap-1">
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Sound (SQ)</span>
                  </div>
                </th>
              )}

              {(roleFilter === 'ALL' || roleFilter === 'ST') && (
                <th className="py-2.5 px-3 min-w-[130px] text-dept-st">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>Stage Action</span>
                  </div>
                </th>
              )}

              <th className="py-2.5 px-3 text-right w-44">Calling Actions</th>
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
                  const isEditing = editingCueId === cue.id;

                  return (
                    <tr
                      key={cue.id}
                      className={`transition-colors ${getRowHighlight(isActive, isStandby)}`}
                    >
                      {/* Status Badge */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${getStatusBadgeStyle(
                            cue.status,
                            isActive,
                            isStandby
                          )}`}
                        >
                          {isActive ? 'GO' : isStandby ? 'STANDBY' : cue.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Cue Number */}
                      <td className="py-2.5 px-3 font-mono font-bold text-content-1">
                        {cue.cueNumber}
                      </td>

                      {/* Title / Inline Edit */}
                      <td className="py-2.5 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(cue.id);
                                if (e.key === 'Escape') setEditingCueId(null);
                              }}
                              className="rounded border border-accent bg-surface-2 px-2 py-1 text-xs text-content-1 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEdit(cue.id)}
                              className="rounded bg-accent/20 px-2 py-0.5 text-[11px] font-medium text-accent hover:bg-accent/30"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleStartEdit(cue)}
                            className="cursor-pointer group flex flex-col"
                            title="Click to edit title"
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

                      {/* Duration */}
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingDuration}
                            onChange={(e) => setEditingDuration(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(cue.id);
                            }}
                            className="w-16 rounded border border-accent bg-surface-2 px-1.5 py-1 text-xs text-content-1 focus:outline-none"
                            placeholder="01:00"
                          />
                        ) : (
                          <div
                            onClick={() => handleStartEdit(cue)}
                            className="flex items-center gap-1.5 cursor-pointer text-content-2 hover:text-accent"
                          >
                            <Clock className="h-3 w-3 text-content-3" />
                            <span>{formatDuration(cue.durationMs)}</span>
                          </div>
                        )}
                      </td>

                      {/* Lighting (LX) */}
                      {(roleFilter === 'ALL' || roleFilter === 'LX') && (
                        <td className="py-2.5 px-3">
                          {cue.departments.lx ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-content-1">
                                {cue.departments.lx.sceneName || 'Preset'}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center rounded bg-dept-lx/10 px-1.5 py-0.2 text-[10px] font-mono text-dept-lx border border-dept-lx/30">
                                  {cue.totalLightingFixtures} fix
                                </span>
                                {/* LX Color Swatch Badge */}
                                <div
                                  className="inline-flex items-center gap-1 rounded bg-surface-2 border border-border-default px-1.5 py-0.5 text-[10px] font-mono cursor-pointer hover:border-accent transition-colors"
                                  title="Màu đèn LX (Bấm để chuyển đổi preset)"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCycleColor(cue);
                                  }}
                                >
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
                              </div>
                            </div>
                          ) : (
                            <span className="text-content-3">—</span>
                          )}
                        </td>
                      )}

                      {/* Visual (VX) */}
                      {(roleFilter === 'ALL' || roleFilter === 'VX') && (
                        <td className="py-2.5 px-3">
                          {cue.departments.vx ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-content-1">
                                {cue.departments.vx.contentName || 'Visual loop'}
                              </span>
                              <span className="inline-flex w-fit items-center rounded bg-dept-vx/10 px-1.5 py-0.2 text-[10px] font-mono text-dept-vx border border-dept-vx/30">
                                {cue.totalScreens} screens
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      )}

                      {/* Sound (SQ) */}
                      {(roleFilter === 'ALL' || roleFilter === 'SQ') && (
                        <td className="py-2.5 px-3">
                          {cue.departments.sq ? (
                            <span className="text-content-1">
                              {cue.departments.sq.trackName || 'Audio active'}
                            </span>
                          ) : (
                            <span className="text-content-3">—</span>
                          )}
                        </td>
                      )}

                      {/* Stage Action */}
                      {(roleFilter === 'ALL' || roleFilter === 'ST') && (
                        <td className="py-2.5 px-3">
                          {cue.departments.st ? (
                            <span className="text-content-2">
                              {cue.departments.st.actionDescription}
                            </span>
                          ) : (
                            <span className="text-content-3">—</span>
                          )}
                        </td>
                      )}

                      {/* Calling Action Buttons */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Standby Button */}
                          <button
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
                            onClick={() => holdCue(cue.id)}
                            title="Hold Cue"
                            className="rounded p-1 text-content-3 hover:bg-status-hold/20 hover:text-status-hold transition-colors"
                          >
                            <Pause className="h-3.5 w-3.5" />
                          </button>

                          {/* Skip */}
                          <button
                            onClick={() => skipCue(cue.id)}
                            title="Skip Cue"
                            className="rounded p-1 text-content-3 hover:bg-surface-2 hover:text-content-1 transition-colors"
                          >
                            <FastForward className="h-3.5 w-3.5" />
                          </button>

                          {/* Reset */}
                          <button
                            onClick={() => resetCue(cue.id)}
                            title="Reset Cue"
                            className="rounded p-1 text-content-3 hover:bg-surface-2 hover:text-content-1 transition-colors"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
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
