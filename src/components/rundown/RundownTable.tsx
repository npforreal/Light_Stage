import React, { useState } from 'react';
import { useShowStore } from '../../store/useShowStore';
import { useClockStore, formatDuration } from '../../store/useClockStore';
import { Cue, CueStatus } from '../../types/stage';
import { parseTimeString } from '../../services/importer';
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

  const getStatusBadgeStyle = (status: CueStatus, isActive: boolean, isStandby: boolean) => {
    if (isActive || status === 'Go') {
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/60 ring-2 ring-emerald-500/30';
    }
    if (isStandby || status === 'Standby') {
      return 'bg-amber-500/20 text-amber-300 border border-amber-500/60 ring-2 ring-amber-500/30';
    }
    if (status === 'Hold') {
      return 'bg-rose-500/20 text-rose-300 border border-rose-500/50';
    }
    if (status === 'Skip') {
      return 'bg-slate-800 text-slate-500 line-through border border-slate-700';
    }
    if (status === 'Completed') {
      return 'bg-slate-800/80 text-slate-400 border border-slate-700/60';
    }
    return 'bg-slate-800/50 text-slate-300 border border-slate-700/40';
  };

  const getRowHighlight = (isActive: boolean, isStandby: boolean) => {
    if (isActive) return 'bg-emerald-950/30 border-l-4 border-l-emerald-500';
    if (isStandby) return 'bg-amber-950/25 border-l-4 border-l-amber-500';
    return 'border-l-4 border-l-transparent hover:bg-slate-900/60';
  };

  return (
    <div className="flex h-full w-full flex-col bg-slate-950 text-slate-100">
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/60 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            View Role:
          </span>
          <div className="inline-flex rounded-lg bg-slate-800/80 p-0.5 text-xs">
            {(['ALL', 'LX', 'VX', 'SQ', 'ST'] as RoleFilter[]).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                  roleFilter === role
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Cue</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900 text-slate-400 uppercase font-mono tracking-wider">
            <tr>
              <th className="py-2.5 px-3 w-20">Status</th>
              <th className="py-2.5 px-3 w-16">Cue #</th>
              <th className="py-2.5 px-4 min-w-[200px]">Title & Description</th>
              <th className="py-2.5 px-3 w-24">Duration</th>

              {(roleFilter === 'ALL' || roleFilter === 'LX') && (
                <th className="py-2.5 px-3 min-w-[140px] text-amber-400">
                  <div className="flex items-center gap-1">
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>Lighting (LX)</span>
                  </div>
                </th>
              )}

              {(roleFilter === 'ALL' || roleFilter === 'VX') && (
                <th className="py-2.5 px-3 min-w-[140px] text-purple-400">
                  <div className="flex items-center gap-1">
                    <Tv className="h-3.5 w-3.5" />
                    <span>Visual LED (VX)</span>
                  </div>
                </th>
              )}

              {(roleFilter === 'ALL' || roleFilter === 'SQ') && (
                <th className="py-2.5 px-3 min-w-[130px] text-cyan-400">
                  <div className="flex items-center gap-1">
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Sound (SQ)</span>
                  </div>
                </th>
              )}

              {(roleFilter === 'ALL' || roleFilter === 'ST') && (
                <th className="py-2.5 px-3 min-w-[130px] text-emerald-400">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>Stage Action</span>
                  </div>
                </th>
              )}

              <th className="py-2.5 px-3 text-right w-44">Calling Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-sans">
            {show.acts.map((act) => (
              <React.Fragment key={act.id}>
                {/* Act Header Banner */}
                <tr className="bg-slate-900/90 font-semibold text-slate-300">
                  <td colSpan={10} className="py-2 px-4 text-xs tracking-wide">
                    <span className="text-cyan-400 mr-2 font-mono">{act.title}</span>
                    <span className="text-[11px] font-normal text-slate-500">
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
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
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
                              className="rounded border border-cyan-500 bg-slate-900 px-2 py-1 text-xs text-white focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEdit(cue.id)}
                              className="rounded bg-cyan-600 px-2 py-0.5 text-[11px] font-medium text-white"
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
                            <span className="font-medium text-slate-100 group-hover:text-cyan-300">
                              {cue.title}
                            </span>
                            {cue.notes && (
                              <span className="text-[11px] text-slate-400 italic">
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
                            className="w-16 rounded border border-cyan-500 bg-slate-900 px-1.5 py-1 text-xs text-white focus:outline-none"
                            placeholder="01:00"
                          />
                        ) : (
                          <div
                            onClick={() => handleStartEdit(cue)}
                            className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-cyan-300"
                          >
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span>{formatDuration(cue.durationMs)}</span>
                          </div>
                        )}
                      </td>

                      {/* Lighting (LX) */}
                      {(roleFilter === 'ALL' || roleFilter === 'LX') && (
                        <td className="py-2.5 px-3">
                          {cue.departments.lx ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-slate-200">
                                {cue.departments.lx.sceneName || 'Preset'}
                              </span>
                              <span className="inline-flex w-fit items-center rounded bg-amber-500/10 px-1.5 py-0.2 text-[10px] font-mono text-amber-400 border border-amber-500/30">
                                {cue.totalLightingFixtures} fixtures
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      )}

                      {/* Visual (VX) */}
                      {(roleFilter === 'ALL' || roleFilter === 'VX') && (
                        <td className="py-2.5 px-3">
                          {cue.departments.vx ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-slate-200">
                                {cue.departments.vx.contentName || 'Visual loop'}
                              </span>
                              <span className="inline-flex w-fit items-center rounded bg-purple-500/10 px-1.5 py-0.2 text-[10px] font-mono text-purple-400 border border-purple-500/30">
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
                            <span className="text-slate-200">
                              {cue.departments.sq.trackName || 'Audio active'}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      )}

                      {/* Stage Action */}
                      {(roleFilter === 'ALL' || roleFilter === 'ST') && (
                        <td className="py-2.5 px-3">
                          {cue.departments.st ? (
                            <span className="text-slate-300">
                              {cue.departments.st.actionDescription}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
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
                                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                                : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                            }`}
                          >
                            STBY
                          </button>

                          {/* Go Button */}
                          <button
                            onClick={() => handleFireGo(cue.id, cue.durationMs)}
                            className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-bold tracking-wide transition-colors ${
                              isActive
                                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400 animate-pulse'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                            }`}
                          >
                            <Play className="h-3 w-3 fill-current" />
                            <span>GO</span>
                          </button>

                          {/* Hold */}
                          <button
                            onClick={() => holdCue(cue.id)}
                            title="Hold Cue"
                            className="rounded p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                          >
                            <Pause className="h-3.5 w-3.5" />
                          </button>

                          {/* Skip */}
                          <button
                            onClick={() => skipCue(cue.id)}
                            title="Skip Cue"
                            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                          >
                            <FastForward className="h-3.5 w-3.5" />
                          </button>

                          {/* Reset */}
                          <button
                            onClick={() => resetCue(cue.id)}
                            title="Reset Cue"
                            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
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
