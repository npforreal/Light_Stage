import React, { useState, useMemo, useRef } from 'react';
import { useShowStore } from '../../store/useShowStore';
import { useClockStore, formatDuration } from '../../store/useClockStore';
import { Cue } from '../../types/stage';
import { ZoomIn, ZoomOut, Lightbulb, Tv, Volume2, Flag } from 'lucide-react';

export const TimelineTracks: React.FC = () => {
  const show = useShowStore((s) => s.show);
  const activeCueId = useShowStore((s) => s.activeCueId);
  const standbyCueId = useShowStore((s) => s.standbyCueId);
  const standbyCue = useShowStore((s) => s.standbyCue);
  const goCue = useShowStore((s) => s.goCue);

  const masterElapsedMs = useClockStore((s) => s.masterElapsedMs);
  const syncCueDuration = useClockStore((s) => s.syncCueDuration);
  const startClock = useClockStore((s) => s.startClock);
  const setMasterElapsedMs = useClockStore((s) => s.setMasterElapsedMs);

  // Zoom scale: pixels per second (e.g., 4px/s to 30px/s)
  const [pixelsPerSecond, setPixelsPerSecond] = useState<number>(8);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Calculate cumulative start time for each cue
  const { cueTimelineItems, totalDurationMs } = useMemo(() => {
    let currentOffsetMs = 0;
    const allCues = show.acts.flatMap((a) => a.cues);
    const items = allCues.map((cue) => {
      const startMs = currentOffsetMs;
      const durationMs = cue.durationMs || 60000;
      currentOffsetMs += durationMs;
      return {
        cue,
        startMs,
        durationMs,
        endMs: currentOffsetMs,
      };
    });

    return {
      cueTimelineItems: items,
      totalDurationMs: Math.max(currentOffsetMs, 300000), // at least 5 mins
    };
  }, [show]);

  const totalWidthPx = Math.ceil((totalDurationMs / 1000) * pixelsPerSecond);
  const playheadX = (masterElapsedMs / 1000) * pixelsPerSecond;

  const handleZoom = (delta: number) => {
    setPixelsPerSecond((prev) => Math.min(40, Math.max(3, prev + delta)));
  };

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const targetMs = (clickX / pixelsPerSecond) * 1000;
    setMasterElapsedMs(targetMs);
  };

  const handleBlockClick = (cue: Cue) => {
    standbyCue(cue.id);
  };

  const handleBlockDoubleClick = (cue: Cue) => {
    goCue(cue.id);
    syncCueDuration(cue.durationMs, true);
    startClock();
  };

  // Generate tick markers every 30s or 60s depending on zoom
  const tickIntervalSec = pixelsPerSecond > 15 ? 15 : pixelsPerSecond > 8 ? 30 : 60;
  const numTicks = Math.ceil(totalDurationMs / 1000 / tickIntervalSec);

  return (
    <div className="flex h-full w-full flex-col bg-slate-950 text-slate-100 select-none">
      {/* Timeline Controls Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-semibold text-slate-300">Timeline Tracks</span>
          <span className="font-mono text-slate-400">
            Total: {formatDuration(totalDurationMs, { includeHours: true })}
          </span>
          <span className="text-[11px] text-slate-500">
            (Click block to Standby, Double click to GO)
          </span>
        </div>

        {/* Zoom Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">{pixelsPerSecond} px/s</span>
          <button
            onClick={() => handleZoom(-3)}
            className="rounded bg-slate-800 p-1 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleZoom(3)}
            className="rounded bg-slate-800 p-1 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tracks Container with Synchronized Scroll */}
      <div className="flex flex-1 overflow-hidden">
        {/* Track Labels (Fixed Left Column) */}
        <div className="w-36 flex-shrink-0 border-r border-slate-800 bg-slate-900/90 z-20 flex flex-col font-mono text-xs">
          {/* Header spacer */}
          <div className="h-8 border-b border-slate-800 px-3 flex items-center text-slate-400 font-bold uppercase text-[10px]">
            Lanes
          </div>
          {/* Master Lane */}
          <div className="h-16 border-b border-slate-800 px-3 flex items-center gap-2 text-slate-200">
            <Flag className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-semibold">Master Cue</span>
          </div>
          {/* LX Lane */}
          <div className="h-14 border-b border-slate-800 px-3 flex items-center gap-2 text-amber-400">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>LX Lighting</span>
          </div>
          {/* VX Lane */}
          <div className="h-14 border-b border-slate-800 px-3 flex items-center gap-2 text-purple-400">
            <Tv className="h-3.5 w-3.5" />
            <span>VX Visuals</span>
          </div>
          {/* SQ Lane */}
          <div className="h-14 border-b border-slate-800 px-3 flex items-center gap-2 text-cyan-400">
            <Volume2 className="h-3.5 w-3.5" />
            <span>SQ Sound</span>
          </div>
        </div>

        {/* Scrollable Tracks Area */}
        <div
          ref={timelineContainerRef}
          className="relative flex-1 overflow-x-auto overflow-y-hidden bg-slate-950"
        >
          <div style={{ width: `${totalWidthPx}px` }} className="relative h-full">
            {/* Time Ruler Bar */}
            <div
              onClick={handleRulerClick}
              className="sticky top-0 h-8 border-b border-slate-800 bg-slate-900 text-[10px] font-mono text-slate-400 cursor-pointer z-10"
            >
              {Array.from({ length: numTicks }).map((_, i) => {
                const sec = i * tickIntervalSec;
                const leftPx = sec * pixelsPerSecond;
                return (
                  <div
                    key={i}
                    style={{ left: `${leftPx}px` }}
                    className="absolute top-0 bottom-0 border-l border-slate-800 pl-1 pt-1.5 flex items-start"
                  >
                    <span>{formatDuration(sec * 1000)}</span>
                  </div>
                );
              })}
            </div>

            {/* Red / Emerald Realtime Playhead */}
            <div
              style={{ left: `${playheadX}px` }}
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none transition-all duration-75 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
            >
              <div className="h-0 w-0 border-x-4 border-x-transparent border-t-6 border-t-red-500 -ml-[3.5px]" />
            </div>

            {/* Lane 1: Master Cue Blocks */}
            <div className="relative h-16 border-b border-slate-800/80 bg-slate-900/30">
              {cueTimelineItems.map(({ cue, startMs, durationMs }) => {
                const left = (startMs / 1000) * pixelsPerSecond;
                const width = Math.max(30, (durationMs / 1000) * pixelsPerSecond - 2);
                const isActive = activeCueId === cue.id;
                const isStandby = standbyCueId === cue.id;

                let blockColor = 'bg-slate-800/80 border-slate-700 text-slate-300';
                if (isActive) {
                  blockColor = 'bg-emerald-600/90 border-emerald-400 text-white shadow-lg ring-2 ring-emerald-500/50';
                } else if (isStandby) {
                  blockColor = 'bg-amber-600/90 border-amber-400 text-white shadow-md ring-2 ring-amber-500/50';
                } else if (cue.status === 'Completed') {
                  blockColor = 'bg-slate-800/40 border-slate-700/50 text-slate-500';
                }

                return (
                  <div
                    key={cue.id}
                    onClick={() => handleBlockClick(cue)}
                    onDoubleClick={() => handleBlockDoubleClick(cue)}
                    style={{ left: `${left}px`, width: `${width}px` }}
                    className={`absolute top-2 bottom-2 rounded-md border p-1.5 text-xs cursor-pointer overflow-hidden transition-all flex flex-col justify-between ${blockColor}`}
                    title={`${cue.cueNumber}: ${cue.title} (${formatDuration(durationMs)})`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-[10px]">
                      <span>{cue.cueNumber}</span>
                      <span>{formatDuration(durationMs)}</span>
                    </div>
                    <div className="truncate font-medium text-[11px] leading-tight">
                      {cue.title}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Lane 2: Lighting (LX) Blocks */}
            <div className="relative h-14 border-b border-slate-800/60 bg-amber-950/10">
              {cueTimelineItems.map(({ cue, startMs, durationMs }) => {
                if (!cue.departments.lx) return null;
                const left = (startMs / 1000) * pixelsPerSecond;
                const width = Math.max(24, (durationMs / 1000) * pixelsPerSecond - 2);
                return (
                  <div
                    key={cue.id}
                    style={{ left: `${left}px`, width: `${width}px` }}
                    className="absolute top-1.5 bottom-1.5 rounded border border-amber-500/40 bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300 overflow-hidden truncate flex flex-col justify-center"
                    title={`LX: ${cue.departments.lx.sceneName || 'Preset'} (${cue.totalLightingFixtures} fixtures)`}
                  >
                    <span className="font-semibold truncate">
                      {cue.departments.lx.sceneName || 'Preset'}
                    </span>
                    <span className="font-mono text-[9px] text-amber-400">
                      {cue.totalLightingFixtures} fix
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Lane 3: Visual LED (VX) Blocks */}
            <div className="relative h-14 border-b border-slate-800/60 bg-purple-950/10">
              {cueTimelineItems.map(({ cue, startMs, durationMs }) => {
                if (!cue.departments.vx) return null;
                const left = (startMs / 1000) * pixelsPerSecond;
                const width = Math.max(24, (durationMs / 1000) * pixelsPerSecond - 2);
                return (
                  <div
                    key={cue.id}
                    style={{ left: `${left}px`, width: `${width}px` }}
                    className="absolute top-1.5 bottom-1.5 rounded border border-purple-500/40 bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-300 overflow-hidden truncate flex flex-col justify-center"
                    title={`VX: ${cue.departments.vx.contentName || 'Loop'} (${cue.totalScreens} screens)`}
                  >
                    <span className="font-semibold truncate">
                      {cue.departments.vx.contentName || 'Visual loop'}
                    </span>
                    <span className="font-mono text-[9px] text-purple-400">
                      {cue.totalScreens} scr
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Lane 4: Sound (SQ) Blocks */}
            <div className="relative h-14 border-b border-slate-800/60 bg-cyan-950/10">
              {cueTimelineItems.map(({ cue, startMs, durationMs }) => {
                if (!cue.departments.sq) return null;
                const left = (startMs / 1000) * pixelsPerSecond;
                const width = Math.max(24, (durationMs / 1000) * pixelsPerSecond - 2);
                return (
                  <div
                    key={cue.id}
                    style={{ left: `${left}px`, width: `${width}px` }}
                    className="absolute top-1.5 bottom-1.5 rounded border border-cyan-500/40 bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-300 overflow-hidden truncate flex flex-col justify-center"
                    title={`SQ: ${cue.departments.sq.trackName || 'Audio'}`}
                  >
                    <span className="font-semibold truncate">
                      {cue.departments.sq.trackName || 'Audio Track'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
