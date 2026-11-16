import React, { useState, useMemo } from 'react';
import { useStageStore } from '../../store/useStageStore';
import { useShowStore } from '../../store/useShowStore';
import { StagePreset } from '../../types/virtualStage';
import { resolveLightingColorToLinear, getLightingColorLabel } from '../../data/colors';
import { applyDimmer, linearToOklab, oklabToOklch, gamutMap, rgbToHex } from '../../services/color';
import {
  Eye,
  Sliders,
  Tv,
  Lightbulb,
  CheckSquare,
  Square as SquareIcon,
  AlertTriangle,
  Info,
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

  // Lighting & Visual state from active cue
  const lxCue = activeCue?.departments?.lx;
  const vxCue = activeCue?.departments?.vx;

  const hasLx = Boolean(
    activeCue &&
      lxCue &&
      (Boolean(lxCue.sceneName) ||
        (lxCue.fixtureCount ?? 0) > 0 ||
        (lxCue.fixtures && lxCue.fixtures.length > 0))
  );
  const hasVx = Boolean(
    activeCue &&
      vxCue &&
      (Boolean(vxCue.contentName) ||
        (vxCue.screenCount ?? 0) > 0 ||
        (vxCue.screens && vxCue.screens.length > 0))
  );

  // Optical color pipeline: target color -> linear -> dimmer curve -> gamut map -> sRGB
  const { fixtureColor, isOutOfGamut, colorLabel, beamIntensity } = useMemo(() => {
    if (!lxCue) {
      return {
        fixtureColor: '#38bdf8',
        isOutOfGamut: false,
        colorLabel: 'Default Sky',
        beamIntensity: 0.8,
      };
    }

    const lightingColor =
      lxCue.color ||
      (lxCue.colorPreset ? { mode: 'rgb' as const, hex: lxCue.colorPreset } : undefined);

    const baseLinear = resolveLightingColorToLinear(lightingColor);
    const rawIntensity = lxCue.intensity ?? 80;
    const dimmer = applyDimmer(rawIntensity, 'square');

    // Scale linear light with physical dimmer
    const dimmedLinear = {
      r: baseLinear.r * dimmer,
      g: baseLinear.g * dimmer,
      b: baseLinear.b * dimmer,
    };

    const lab = linearToOklab(dimmedLinear);
    const lch = oklabToOklch(lab);
    const mapped = gamutMap(lch);
    const hex = rgbToHex(mapped.color);
    const label = getLightingColorLabel(lightingColor);

    return {
      fixtureColor: hex,
      isOutOfGamut: mapped.outOfGamut,
      colorLabel: label,
      beamIntensity: Math.min(1.0, Math.max(0.05, dimmer)),
    };
  }, [lxCue]);

  return (
    <div className="flex h-full w-full flex-col bg-surface-0 text-content-1 select-none overflow-hidden">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default bg-surface-1/90 px-4 py-2 backdrop-blur z-20">
        {/* Camera Views & Presets */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Eye className="h-3.5 w-3.5 text-accent" />
            <span className="font-semibold text-content-2">Camera:</span>
          </div>
          <div className="inline-flex rounded-lg bg-surface-2 p-0.5 text-xs border border-border-default">
            <button
              onClick={() => setCameraView('front')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                cameraView === 'front'
                  ? 'bg-accent text-surface-0 font-bold shadow'
                  : 'text-content-3 hover:text-content-1'
              }`}
            >
              Front View
            </button>
            <button
              onClick={() => setCameraView('topDown')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                cameraView === 'topDown'
                  ? 'bg-accent text-surface-0 font-bold shadow'
                  : 'text-content-3 hover:text-content-1'
              }`}
            >
              Top-Down Plan
            </button>
          </div>

          <div className="h-4 w-px bg-border-default" />

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-content-3 font-semibold">Preset:</span>
            {(['EndStage', 'Festival', 'Thrust'] as StagePreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => applyPreset(preset)}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  config.preset === preset
                    ? 'bg-surface-3 text-content-1 border border-border-default'
                    : 'bg-surface-2 text-content-3 hover:text-content-1'
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
            <div className="flex items-center gap-2 rounded-lg bg-status-go/20 border border-status-go/50 px-2.5 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-status-go animate-ping" />
              <span className="font-bold text-status-go font-mono">
                {activeCue.cueNumber}
              </span>
              <span className="text-content-1 truncate max-w-[140px]">
                {activeCue.title}
              </span>
            </div>
          ) : standbyCue ? (
            <div className="flex items-center gap-2 rounded-lg bg-status-standby/20 border border-status-standby/50 px-2.5 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-status-standby" />
              <span className="font-bold text-status-standby font-mono">
                STBY {standbyCue.cueNumber}
              </span>
            </div>
          ) : (
            <span className="text-xs text-content-3 italic">No Cue Active</span>
          )}

          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors border border-border-default ${
              isConfigOpen
                ? 'bg-accent text-surface-0'
                : 'bg-surface-2 text-content-2 hover:bg-surface-3 hover:text-content-1'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Config</span>
          </button>
        </div>
      </div>

      {/* Main 2D Stage SVG Canvas */}
      <div className="relative flex-1 bg-gradient-to-b from-surface-0 via-surface-1 to-black overflow-hidden flex items-center justify-center p-4">
        {/* Grid pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

        <svg
          viewBox="0 0 1000 600"
          className="w-full h-full max-h-[750px] object-contain drop-shadow-2xl"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Beam Cone Gradients */}
            <linearGradient id="beamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={fixtureColor} stopOpacity={0.85 * beamIntensity} />
              <stop offset="60%" stopColor={fixtureColor} stopOpacity={0.35 * beamIntensity} />
              <stop offset="100%" stopColor={fixtureColor} stopOpacity={0} />
            </linearGradient>

            {/* Beam Soft Bloom Filter */}
            <filter id="beamBloom" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

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
                stroke="#334155"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <polygon
                points="80,480 920,480 880,540 120,540"
                fill="#070b12"
                stroke="#171d26"
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
                  const activeScreenContent = hasVx ? (vxCue?.contentName || 'Visual Active') : `${screen.name} (Standby / Off)`;

                  return (
                    <g key={screen.id} filter={hasVx ? 'url(#screenGlow)' : undefined}>
                      {/* Screen Frame */}
                      <rect
                        x={svgX}
                        y={svgY}
                        width={svgW}
                        height={svgH}
                        rx="4"
                        fill={hasVx ? '#1e1b4b' : '#070b12'}
                        stroke={hasVx ? '#818cf8' : '#222d3d'}
                        strokeWidth="2.5"
                      />

                      {/* Screen Video Surface */}
                      <rect
                        x={svgX + 4}
                        y={svgY + 4}
                        width={svgW - 8}
                        height={svgH - 8}
                        rx="2"
                        fill={hasVx ? '#312e81' : '#04070d'}
                        opacity={hasVx ? 0.9 : 0.4}
                      />

                      {/* Screen Label & Active Content */}
                      <text
                        x={svgX + svgW / 2}
                        y={svgY + svgH / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={hasVx ? '#e0e7ff' : '#475569'}
                        fontSize={isMain ? 14 : 11}
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {activeScreenContent}
                      </text>

                      {hasVx && (
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

              {/* Lighting Beams Layer (Screen / Additive Blend Mode) */}
              {hasLx && (
                <g id="lightingBeamsLayer" style={{ mixBlendMode: 'screen' }} filter="url(#beamBloom)">
                  {config.trusses
                    .filter((t) => t.enabled)
                    .map((truss) => {
                      const trussY = 60 + (truss.y / 100) * 400;
                      const trussX = 80 + (truss.x / 100) * 840;
                      const trussW = (truss.width / 100) * 840;
                      const fixtureSpacing = trussW / (truss.fixtureCount + 1);

                      return Array.from({ length: truss.fixtureCount }).map((_, fIdx) => {
                        const fixX = trussX + (fIdx + 1) * fixtureSpacing;
                        return (
                          <polygon
                            key={`beam-${truss.id}-${fIdx}`}
                            points={`${fixX - 4},${trussY + 6} ${fixX + 4},${trussY + 6} ${fixX + 45},${trussY + 280} ${fixX - 45},${trussY + 280}`}
                            fill="url(#beamGradient)"
                            opacity={0.75 * beamIntensity}
                          />
                        );
                      });
                    })}
                </g>
              )}

              {/* Lighting Trusses & Fixtures Front View */}
              {config.trusses
                .filter((t) => t.enabled)
                .map((truss) => {
                  const trussY = 60 + (truss.y / 100) * 400;
                  const trussX = 80 + (truss.x / 100) * 840;
                  const trussW = (truss.width / 100) * 840;
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
                            {/* Fixture Body */}
                            <rect
                              x={fixX - 5}
                              y={trussY}
                              width="10"
                              height="9"
                              rx="2"
                              fill={hasLx ? fixtureColor : '#334155'}
                              stroke="#070b12"
                              strokeWidth="1"
                            />
                            {/* Fixture Lens */}
                            <circle
                              cx={fixX}
                              cy={trussY + 6}
                              r="3"
                              fill={hasLx ? '#ffffff' : '#1e293b'}
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
                fill="#070b12"
                stroke="#222d3d"
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
                        fill={hasVx ? '#4338ca' : '#171d26'}
                        stroke={hasVx ? '#a5b4fc' : '#334155'}
                        strokeWidth="2"
                      />
                      <text
                        x={svgX + svgW / 2}
                        y={svgY - 5}
                        textAnchor="middle"
                        fill={hasVx ? '#c7d2fe' : '#64748b'}
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
                            {hasLx && (
                              <circle
                                cx={fixX}
                                cy={trussY}
                                r="12"
                                fill={fixtureColor}
                                opacity="0.3"
                              />
                            )}
                            <circle
                              cx={fixX}
                              cy={trussY}
                              r="4"
                              fill={hasLx ? fixtureColor : '#334155'}
                              stroke="#070b12"
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

        {/* Optical Simulation Legend (Bottom Left) */}
        <div className="absolute left-4 bottom-4 z-20 flex flex-col gap-1 rounded-lg border border-border-default bg-surface-1/90 px-3 py-2 backdrop-blur shadow-lg text-[11px] max-w-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-content-2">LX Color:</span>
            <span
              className="h-3.5 w-3.5 rounded-full border border-black/50 shadow-sm flex-shrink-0"
              style={{ backgroundColor: fixtureColor }}
            />
            <span className="font-mono text-content-1 font-bold">{colorLabel}</span>
            <span className="font-mono text-content-3">({fixtureColor})</span>
          </div>

          {isOutOfGamut && (
            <div className="flex items-center gap-1.5 text-status-standby font-medium text-[10px]">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              <span>Màu vượt gam sRGB (thực tế rực rỡ hơn trên sân khấu)</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-[9px] text-content-3 italic pt-0.5 border-t border-border-default/60">
            <Info className="h-2.5 w-2.5 flex-shrink-0" />
            <span>Mô phỏng xấp xỉ quang học, không thay thế đo đạc thực tế.</span>
          </div>
        </div>

        {/* Floating Configuration Sidebar / Drawer */}
        {isConfigOpen && (
          <div className="absolute right-4 top-4 bottom-4 w-72 rounded-xl border border-border-default bg-surface-1/95 p-4 shadow-2xl backdrop-blur text-xs z-30 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-border-default pb-2">
              <span className="font-bold text-content-1 uppercase tracking-wider text-[11px]">
                Stage Rig Configuration
              </span>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="text-content-3 hover:text-content-1"
              >
                ✕
              </button>
            </div>

            {/* LED Screens Toggle */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-dept-vx">
                <Tv className="h-3.5 w-3.5" />
                <span>LED Screens</span>
              </div>
              <div className="space-y-1.5 pl-1">
                {config.screens.map((scr) => (
                  <div
                    key={scr.id}
                    onClick={() => toggleScreen(scr.id)}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-surface-2 cursor-pointer transition-colors"
                  >
                    <span className="text-content-2">{scr.name}</span>
                    {scr.enabled ? (
                      <CheckSquare className="h-4 w-4 text-accent" />
                    ) : (
                      <SquareIcon className="h-4 w-4 text-content-3" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Trusses Toggle */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-dept-lx">
                <Lightbulb className="h-3.5 w-3.5" />
                <span>Lighting Trusses</span>
              </div>
              <div className="space-y-1.5 pl-1">
                {config.trusses.map((truss) => (
                  <div
                    key={truss.id}
                    onClick={() => toggleTruss(truss.id)}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-surface-2 cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-content-2">{truss.name}</span>
                      <span className="text-[10px] text-content-3">
                        {truss.fixtureCount}x {truss.fixtureType}
                      </span>
                    </div>
                    {truss.enabled ? (
                      <CheckSquare className="h-4 w-4 text-accent" />
                    ) : (
                      <SquareIcon className="h-4 w-4 text-content-3" />
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
