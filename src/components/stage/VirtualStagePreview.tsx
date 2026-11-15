import React, { useState } from 'react';
import { useStageStore } from '../../store/useStageStore';
import { useShowStore } from '../../store/useShowStore';
import { StagePreset } from '../../types/virtualStage';
import {
  Eye,
  Sliders,
  Tv,
  Lightbulb,
  CheckSquare,
  Square as SquareIcon,
} from 'lucide-react';

export const VirtualStagePreview: React.FC = () => {
  const cameraView = useStageStore((s) => s.cameraView);
  const config = useStageStore((s) => s.config);
  const setCameraView = useStageStore((s) => s.setCameraView);
  const applyPreset = useStageStore((s) => s.applyPreset);
  const toggleScreen = useStageStore((s) => s.toggleScreen);
  const toggleTruss = useStageStore((s) => s.toggleTruss);

  const activeCue = useShowStore((s) => s.getActiveCue());
  const standbyCue = useShowStore((s) => s.getStandbyCue());

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Lighting state from active cue
  const lxCue = activeCue?.departments?.lx;
  const vxCue = activeCue?.departments?.vx;

  const isShowActive = Boolean(activeCue);
  const fixtureColor = lxCue?.colorPreset || '#38bdf8'; // Default cyan-sky
  const beamIntensity = (lxCue?.intensity ?? 80) / 100;

  return (
    <div className="flex h-full w-full flex-col bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/80 px-4 py-2 backdrop-blur z-20">
        {/* Camera Views & Presets */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Eye className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-300">Camera:</span>
          </div>
          <div className="inline-flex rounded-lg bg-slate-800/80 p-0.5 text-xs">
            <button
              onClick={() => setCameraView('front')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                cameraView === 'front'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Front View
            </button>
            <button
              onClick={() => setCameraView('topDown')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                cameraView === 'topDown'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Top-Down Plan
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold">Preset:</span>
            {(['EndStage', 'Festival', 'Thrust'] as StagePreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => applyPreset(preset)}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  config.preset === preset
                    ? 'bg-slate-700 text-cyan-300 border border-cyan-500/50'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset === 'EndStage' ? 'Standard' : preset}
              </button>
            ))}
          </div>
        </div>

        {/* Active Cue Status & Config Toggle */}
        <div className="flex items-center gap-3">
          {activeCue ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 px-2.5 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-emerald-400 font-mono">
                {activeCue.cueNumber}
              </span>
              <span className="text-slate-200 truncate max-w-[140px]">
                {activeCue.title}
              </span>
            </div>
          ) : standbyCue ? (
            <div className="flex items-center gap-2 rounded-lg bg-amber-950/40 border border-amber-500/40 px-2.5 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="font-bold text-amber-400 font-mono">
                STBY {standbyCue.cueNumber}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">No Cue Active</span>
          )}

          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              isConfigOpen
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Config</span>
          </button>
        </div>
      </div>

      {/* Main 2D Stage SVG Canvas */}
      <div className="relative flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-black overflow-hidden flex items-center justify-center p-4">
        {/* Grid pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <svg
          viewBox="0 0 1000 600"
          className="w-full h-full max-h-[750px] object-contain drop-shadow-2xl"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Beam Cone Gradients */}
            <linearGradient id="beamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={fixtureColor} stopOpacity={0.8 * beamIntensity} />
              <stop offset="60%" stopColor={fixtureColor} stopOpacity={0.3 * beamIntensity} />
              <stop offset="100%" stopColor={fixtureColor} stopOpacity={0} />
            </linearGradient>

            {/* Screen Glow Filter */}
            <filter id="screenGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* FRONT VIEW */}
          {cameraView === 'front' && (
            <g id="frontView">
              {/* Stage Deck Floor Line */}
              <line
                x1="80"
                y1="480"
                x2="920"
                y2="480"
                stroke="#475569"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <polygon
                points="80,480 920,480 880,540 120,540"
                fill="#0f172a"
                stroke="#1e293b"
                strokeWidth="2"
                opacity="0.8"
              />

              {/* Screens Front View */}
              {config.screens
                .filter((s) => s.enabled)
                .map((screen) => {
                  const svgX = 80 + (screen.x / 100) * 840;
                  const svgY = 80 + (screen.y / 100) * 380;
                  const svgW = (screen.width / 100) * 840;
                  const svgH = (screen.height / 100) * 380;

                  const isMain = screen.type === 'Main';
                  const activeScreenContent = vxCue?.contentName || (isShowActive ? 'Visual Loop' : 'Standby');

                  return (
                    <g key={screen.id} filter={isShowActive ? 'url(#screenGlow)' : undefined}>
                      {/* Screen Frame */}
                      <rect
                        x={svgX}
                        y={svgY}
                        width={svgW}
                        height={svgH}
                        rx="4"
                        fill={isShowActive ? '#1e1b4b' : '#090d16'}
                        stroke={isShowActive ? '#818cf8' : '#334155'}
                        strokeWidth="2.5"
                      />

                      {/* Screen Video Surface */}
                      <rect
                        x={svgX + 4}
                        y={svgY + 4}
                        width={svgW - 8}
                        height={svgH - 8}
                        rx="2"
                        fill={isShowActive ? '#312e81' : '#030712'}
                        opacity={isShowActive ? 0.9 : 0.6}
                      />

                      {/* Screen Label & Active Content */}
                      <text
                        x={svgX + svgW / 2}
                        y={svgY + svgH / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={isShowActive ? '#e0e7ff' : '#64748b'}
                        fontSize={isMain ? 14 : 11}
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {isShowActive ? activeScreenContent : screen.name}
                      </text>

                      {isShowActive && (
                        <text
                          x={svgX + svgW / 2}
                          y={svgY + svgH / 2 + 18}
                          textAnchor="middle"
                          fill="#a5b4fc"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          LIVE FEED ACTIVE
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* Lighting Trusses & Fixtures Front View */}
              {config.trusses
                .filter((t) => t.enabled)
                .map((truss) => {
                  const trussY = 60 + (truss.y / 100) * 400;
                  const trussX = 80 + (truss.x / 100) * 840;
                  const trussW = (truss.width / 100) * 840;

                  // Fixture spacing
                  const fixtureSpacing = trussW / (truss.fixtureCount + 1);

                  return (
                    <g key={truss.id}>
                      {/* Metal Truss Tube */}
                      <line
                        x1={trussX}
                        y1={trussY}
                        x2={trussX + trussW}
                        y2={trussY}
                        stroke="#64748b"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                      <line
                        x1={trussX}
                        y1={trussY - 6}
                        x2={trussX + trussW}
                        y2={trussY - 6}
                        stroke="#475569"
                        strokeWidth="2"
                      />

                      {/* Fixtures on this Truss */}
                      {Array.from({ length: truss.fixtureCount }).map((_, fIdx) => {
                        const fixX = trussX + (fIdx + 1) * fixtureSpacing;

                        return (
                          <g key={fIdx}>
                            {/* Beam Cone when show is active */}
                            {isShowActive && (
                              <polygon
                                points={`${fixX - 4},${trussY + 6} ${fixX + 4},${trussY + 6} ${fixX + 45},${trussY + 280} ${fixX - 45},${trussY + 280}`}
                                fill="url(#beamGradient)"
                                opacity={0.7}
                              />
                            )}

                            {/* Fixture Body */}
                            <rect
                              x={fixX - 5}
                              y={trussY}
                              width="10"
                              height="9"
                              rx="2"
                              fill={isShowActive ? fixtureColor : '#334155'}
                              stroke="#0f172a"
                              strokeWidth="1"
                            />
                            {/* Fixture Lens */}
                            <circle
                              cx={fixX}
                              cy={trussY + 6}
                              r="3"
                              fill={isShowActive ? '#ffffff' : '#1e293b'}
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
            </g>
          )}

          {/* TOP-DOWN VIEW */}
          {cameraView === 'topDown' && (
            <g id="topDownView">
              {/* Stage Perimeter Floor Boundary */}
              <rect
                x="150"
                y="100"
                width="700"
                height="420"
                rx="8"
                fill="#0b0f19"
                stroke="#334155"
                strokeWidth="3"
              />
              <text
                x="500"
                y="500"
                textAnchor="middle"
                fill="#475569"
                fontSize="12"
                fontFamily="monospace"
              >
                STAGE FRONT / AUDIENCE DIRECTION ▼
              </text>

              {/* Screens Top-down Layout */}
              {config.screens
                .filter((s) => s.enabled)
                .map((screen) => {
                  const svgX = 150 + (screen.x / 100) * 700;
                  const svgY = 100 + (screen.y / 100) * 400;
                  const svgW = (screen.width / 100) * 700;

                  return (
                    <g key={screen.id}>
                      <rect
                        x={svgX}
                        y={svgY}
                        width={svgW}
                        height="14"
                        rx="2"
                        fill={isShowActive ? '#4338ca' : '#1e293b'}
                        stroke={isShowActive ? '#a5b4fc' : '#475569'}
                        strokeWidth="2"
                      />
                      <text
                        x={svgX + svgW / 2}
                        y={svgY - 5}
                        textAnchor="middle"
                        fill={isShowActive ? '#c7d2fe' : '#64748b'}
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {screen.name}
                      </text>
                    </g>
                  );
                })}

              {/* Trusses Top-down Lines */}
              {config.trusses
                .filter((t) => t.enabled)
                .map((truss) => {
                  const trussY = 100 + (truss.y / 100) * 400;
                  const trussX = 150 + (truss.x / 100) * 700;
                  const trussW = (truss.width / 100) * 700;
                  const fixtureSpacing = trussW / (truss.fixtureCount + 1);

                  return (
                    <g key={truss.id}>
                      {/* Truss line */}
                      <line
                        x1={trussX}
                        y1={trussY}
                        x2={trussX + trussW}
                        y2={trussY}
                        stroke="#64748b"
                        strokeWidth="3"
                        strokeDasharray="4 2"
                      />
                      <text
                        x={trussX - 8}
                        y={trussY + 4}
                        textAnchor="end"
                        fill="#94a3b8"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {truss.name}
                      </text>

                      {/* Top-down Fixture Dots */}
                      {Array.from({ length: truss.fixtureCount }).map((_, fIdx) => {
                        const fixX = trussX + (fIdx + 1) * fixtureSpacing;

                        return (
                          <g key={fIdx}>
                            {isShowActive && (
                              <circle
                                cx={fixX}
                                cy={trussY}
                                r="12"
                                fill={fixtureColor}
                                opacity="0.2"
                              />
                            )}
                            <circle
                              cx={fixX}
                              cy={trussY}
                              r="4"
                              fill={isShowActive ? fixtureColor : '#475569'}
                              stroke="#0f172a"
                              strokeWidth="1"
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
            </g>
          )}
        </svg>

        {/* Floating Configuration Sidebar / Drawer */}
        {isConfigOpen && (
          <div className="absolute right-4 top-4 bottom-4 w-72 rounded-xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl backdrop-blur text-xs z-30 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Stage Rig Configuration
              </span>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* LED Screens Toggle */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-purple-400">
                <Tv className="h-3.5 w-3.5" />
                <span>LED Screens</span>
              </div>
              <div className="space-y-1.5 pl-1">
                {config.screens.map((scr) => (
                  <div
                    key={scr.id}
                    onClick={() => toggleScreen(scr.id)}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800 cursor-pointer"
                  >
                    <span className="text-slate-300">{scr.name}</span>
                    {scr.enabled ? (
                      <CheckSquare className="h-4 w-4 text-cyan-400" />
                    ) : (
                      <SquareIcon className="h-4 w-4 text-slate-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Trusses Toggle */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                <Lightbulb className="h-3.5 w-3.5" />
                <span>Lighting Trusses</span>
              </div>
              <div className="space-y-1.5 pl-1">
                {config.trusses.map((truss) => (
                  <div
                    key={truss.id}
                    onClick={() => toggleTruss(truss.id)}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800 cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="text-slate-300">{truss.name}</span>
                      <span className="text-[10px] text-slate-500">
                        {truss.fixtureCount}x {truss.fixtureType}
                      </span>
                    </div>
                    {truss.enabled ? (
                      <CheckSquare className="h-4 w-4 text-cyan-400" />
                    ) : (
                      <SquareIcon className="h-4 w-4 text-slate-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
