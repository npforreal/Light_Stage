import React, { useState, useMemo, useRef } from 'react';
import { useShowStore } from '../../store/useShowStore';
import { useClockStore, formatDuration } from '../../store/useClockStore';
import { Cue } from '../../types/stage';
import { getCueLightingCount } from '../../services/fixtureModel';
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
    <div className="flex h-full w-full flex-col bg-surface-0 text-content-1 select-none">
      {/* Timeline Controls Header */}
      <div className="flex items-center justify-between border-b border-border-default bg-surface-1/90 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-semibold text-content-1">Timeline Tracks</span>
          <span className="font-mono text-content-2">
            Total: {formatDuration(totalDurationMs, { includeHours: true })}
          </span>
          <span className="text-[11px] text-content-3">
            (Click block to Standby, Double click to GO)
          </span>
        </div>

        {/* Zoom Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-content-3 font-mono">{pixelsPerSecond} px/s</span>
          <button
            onClick={() => handleZoom(-3)}
            className="rounded bg-surface-2 p-1 text-content-2 hover:bg-surface-3 hover:text-content-1 transition-colors border border-border-default"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleZoom(3)}
            className="rounded bg-surface-2 p-1 text-content-2 hover:bg-surface-3 hover:text-content-1 transition-colors border border-border-default"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tracks Container with Synchronized Scroll */}
      <div className="flex flex-1 overflow-hidden">
        {/* Track Labels (Fixed Left Column) */}
        <div className="w-36 flex-shrink-0 border-r border-border-default bg-surface-1 z-20 flex flex-col font-mono text-xs">
          {/* Header spacer */}
          <div className="h-8 border-b border-border-default px-3 flex items-center text-content-3 font-bold uppercase text-[10px]">
            Lanes
          </div>
          {/* Master Lane */}
          <div className="h-16 border-b border-border-default px-3 flex items-center gap-2 text-content-1">
            <Flag className="h-3.5 w-3.5 text-accent" />
            <span className="font-semibold">Master Cue</span>
          </div>
          {/* LX Lane */}
          <div className="h-14 border-b border-border-default px-3 flex items-center gap-2 text-dept-lx">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>LX Lighting</span>
          </div>
          {/* VX Lane */}
          <div className="h-14 border-b border-border-default px-3 flex items-center gap-2 text-dept-vx">
            <Tv className="h-3.5 w-3.5" />
            <span>VX Visuals</span>
          </div>
          {/* SQ Lane */}
          <div className="h-14 border-b border-border-default px-3 flex items-center gap-2 text-dept-sq">
            <Volume2 className="h-3.5 w-3.5" />
            <span>SQ Sound</span>
          </div>
        </div>

        {/* Scrollable Tracks Area */}
        <div
          ref={timelineContainerRef}
          className="relative flex-1 overflow-x-auto overflow-y-hidden bg-surface-0"
        >
          <div style={{ width: `${totalWidthPx}px` }} className="relative h-full">
            {/* Time Ruler Bar */}
            <div
              onClick={handleRulerClick}
              className="sticky top-0 h-8 border-b border-border-default bg-surface-1 text-[10px] font-mono text-content-3 cursor-pointer z-10"
            >
              {Array.from({ length: numTicks }).map((_, i) => {
                const sec = i * tickIntervalSec;
                const leftPx = sec * pixelsPerSecond;
                return (
                  <div
                    key={i}
                    style={{ left: `${leftPx}px` }}
                    className="absolute top-0 bottom-0 border-l border-border-default pl-1 pt-1.5 flex items-start"
                  >
                    <span>{formatDuration(sec * 1000)}</span>
                  </div>
                );
              })}
            </div>

            {/* Red / Emerald Realtime Playhead */}
            <div
              style={{ left: `${playheadX}px` }}
              className="absolute top-0 bottom-0 w-0.5 bg-status-danger z-30 pointer-events-none transition-all duration-75 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
            >
              <div className="h-0 w-0 border-x-4 border-x-transparent border-t-6 border-t-status-danger -ml-[3.5px]" />
            </div>

            {/* Lane 1: Master Cue Blocks */}
            <div className="relative h-16 border-b border-border-default/80 bg-surface-1/40">
              {cueTimelineItems.map(({ cue, startMs, durationMs }) => {
                const left = (startMs / 1000) * pixelsPerSecond;
                const width = Math.max(30, (durationMs / 1000) * pixelsPerSecond - 2);
                const isActive = activeCueId === cue.id;
                const isStandby = standbyCueId === cue.id;

                let blockColor = 'bg-surface-2 border-border-default text-content-1';
                if (isActive) {
                  blockColor = 'bg-status-go text-surface-0 border-status-go shadow-lg ring-2 ring-status-go/50';
                } else if (isStandby) {
                  blockColor = 'bg-status-standby text-surface-0 border-status-standby shadow-md ring-2 ring-status-standby/50';
                } else if (cue.status === 'Completed') {
                  blockColor = 'bg-surface-1 border-border-default/60 text-content-3';
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
            <div className="relative h-14 border-b border-border-default/60 bg-dept-lx/5">
              {cueTimelineItems.map(({ cue, startMs, durationMs }) => {
                if (!cue.departments.lx) return null;
                const left = (startMs / 1000) * pixelsPerSecond;
                const width = Math.max(24, (durationMs / 1000) * pixelsPerSecond - 2);
                return (
                  <div
                    key={cue.id}
                    style={{ left: `${left}px`, width: `${width}px` }}
                    className="absolute top-1.5 bottom-1.5 rounded border border-dept-lx/40 bg-dept-lx/20 px-1.5 py-0.5 text-[10px] text-dept-lx overflow-hidden truncate flex flex-col justify-center"
                    title={`LX: ${cue.departments.lx.sceneName || 'Preset'} (${getCueLightingCount(cue)} fixtures)`}
                  >
                    <span className="font-semibold truncate">
                      {cue.departments.lx.sceneName || 'Preset'}
                    </span>
                    <span className="font-mono text-[9px] text-dept-lx">
                      {getCueLightingCount(cue)} fix
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Lane 3: Visual LED (VX) Blocks */}
            <div className="relative h-14 border-b border-border-default/60 bg-dept-vx/5">
              {cueTimelineItems.map(({ cue, startMs, durationMs }) => {
                if (!cue.departments.vx) return null;
                const left = (startMs / 1000) * pixelsPerSecond;
                const width = Math.max(24, (durationMs / 1000) * pixelsPerSecond - 2);
                return (
                  <div
                    key={cue.id}
                    style={{ left: `${left}px`, width: `${width}px` }}
                    className="absolute top-1.5 bottom-1.5 rounded border border-dept-vx/40 bg-dept-vx/20 px-1.5 py-0.5 text-[10px] text-dept-vx overflow-hidden truncate flex flex-col justify-center"
                    title={`VX: ${cue.departments.vx.contentName || 'Loop'} (${cue.totalScreens} screens)`}
                  >
                    <span className="font-semibold truncate">
                      {cue.departments.vx.contentName || 'Visual loop'}
                    </span>
                    <span className="font-mono text-[9px] text-dept-vx">
                      {cue.totalScreens} scr
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Lane 4: Sound (SQ) Blocks */}
            <div className="relative h-14 border-b border-border-default/60 bg-dept-sq/5">
              {cueTimelineItems.map(({ cue, startMs, durationMs }) => {
                if (!cue.departments.sq) return null;
                const left = (startMs / 1000) * pixelsPerSecond;
                const width = Math.max(24, (durationMs / 1000) * pixelsPerSecond - 2);
                return (
                  <div
                    key={cue.id}
                    style={{ left: `${left}px`, width: `${width}px` }}
                    className="absolute top-1.5 bottom-1.5 rounded border border-dept-sq/40 bg-dept-sq/20 px-1.5 py-0.5 text-[10px] text-dept-sq overflow-hidden truncate flex flex-col justify-center"
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
