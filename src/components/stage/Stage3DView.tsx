import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useStageStore } from '../../store/useStageStore';
import { useShowStore } from '../../store/useShowStore';
import { useVisualStore } from '../../store/useVisualStore';
import { StagePreset } from '../../types/virtualStage';
import { resolveLightingColorToLinear, getLightingColorLabel } from '../../data/colors';
import { applyDimmer, linearToOklab, oklabToOklch, gamutMap, rgbToHex } from '../../services/color';
import { placeFixtures } from '../../services/stageAutoPatch';
import {
  FIXTURE_SYMBOLS,
  STAGE_WARNING_LABELS,
  analyzeStageWarnings,
  getLegendTypes,
} from '../../services/stageSymbols';
import { StageRigEditor } from './StageRigEditor';
import { VxControlBar } from './VxControlBar';
import { Stage3DScene, isWebGLAvailable, CameraPresetType, CameraMode } from './Stage3DScene';
import {
  Sliders,
  AlertTriangle,
  Info,
  Wind,
  Box,
  Layers,
} from 'lucide-react';

export interface Stage3DViewProps {
  rendererFactory?: (params?: THREE.WebGLRendererParameters) => THREE.WebGLRenderer;
  initialBeamThreshold?: number;
  /** Optional hook exposing the live engine instance (external controls & integration tests). */
  onSceneRef?: (scene: Stage3DScene | null) => void;
}

export const Stage3DView: React.FC<Stage3DViewProps> = ({
  rendererFactory,
  initialBeamThreshold = 150,
  onSceneRef,
}) => {
  const config = useStageStore((s) => s.config);
  const applyPreset = useStageStore((s) => s.applyPreset);
  const selectedFixtureId = useStageStore((s) => s.selectedFixtureId);
  const selectedScreenId = useStageStore((s) => s.selectedScreenId);
  const selectFixture = useStageStore((s) => s.selectFixture);
  const selectScreen = useStageStore((s) => s.selectScreen);

  const activeCue = useShowStore((s) => s.getActiveCue());
  const vxOutputs = useVisualStore((s) => s.outputs);

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Stage3DScene | null>(null);
  const onSceneRefRef = useRef(onSceneRef);
  onSceneRefRef.current = onSceneRef;

  const [cameraPreset, setCameraPresetState] = useState<CameraMode>('foh');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [haze, setHaze] = useState<boolean>(true);
  const [dimmerCurve, setDimmerCurve] = useState<'square' | 'linear' | 's-curve'>('square');
  const [beamThreshold, setBeamThresholdState] = useState<number>(initialBeamThreshold);
  const [showAllBeams, setShowAllBeams] = useState<boolean>(false);
  const [webglAvailable] = useState<boolean>(() => isWebGLAvailable());

  // Lighting & Visual state from active cue
  const lxCue = activeCue?.departments?.lx;

  const hasLx = Boolean(
    activeCue &&
      lxCue &&
      (Boolean(lxCue.sceneName) ||
        (lxCue.fixtureCount ?? 0) > 0 ||
        (lxCue.fixtures && lxCue.fixtures.length > 0))
  );

  // Optical color pipeline for HUD & footer
  const { fixtureColor, isOutOfGamut, colorLabel } = useMemo(() => {
    if (!lxCue) {
      return {
        fixtureColor: '#38bdf8',
        isOutOfGamut: false,
        colorLabel: 'Default Sky',
      };
    }

    const lightingColor =
      lxCue.color ||
      (lxCue.colorPreset ? { mode: 'rgb' as const, hex: lxCue.colorPreset } : undefined);

    const baseLinear = resolveLightingColorToLinear(lightingColor);
    const rawIntensity = lxCue.intensity ?? 80;
    const dimmer = applyDimmer(rawIntensity, dimmerCurve === 's-curve' ? 'cube' : dimmerCurve);

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
    };
  }, [lxCue, dimmerCurve]);

  // Deterministic Auto-Patch fixture placement
  const placementResult = useMemo(() => {
    return placeFixtures(config, lxCue);
  }, [config, lxCue]);

  const requestedCount = hasLx ? placementResult.requestedCount : 0;
  const activeCount = hasLx ? placementResult.activeCount : 0;
  const rigCount = config.fixtures?.length ?? 0;
  const isCountMismatch = hasLx && requestedCount > 0 && requestedCount !== activeCount;

  const totalLoadWatts = hasLx ? placementResult.totalLoadWatts : 0;
  const powerKw = (totalLoadWatts / 1000).toFixed(1);

  // USITT warnings and legend
  const stageWarnings = useMemo(
    () =>
      analyzeStageWarnings({
        config,
        placements: placementResult.placements,
        requestedCount,
      }),
    [config, placementResult.placements, requestedCount]
  );

  const legendTypes = useMemo(
    () => getLegendTypes(placementResult.placements, Object.keys(placementResult.byType)),
    [placementResult.placements, placementResult.byType]
  );

  // Initialize Stage3DScene
  useEffect(() => {
    if (!containerRef.current || !webglAvailable) return;

    const scene = new Stage3DScene(containerRef.current, {
      beamThreshold,
      rendererFactory,
      onSelectFixture: (id) => {
        selectFixture(id);
        const activeCue = useShowStore.getState().getActiveCue();
        if (activeCue) {
          useShowStore.getState().selectCue(activeCue.id);
          useShowStore.getState().setInspectorOpen(true);
        }
      },
      onSelectScreen: (id) => {
        selectScreen(id);
        const activeCue = useShowStore.getState().getActiveCue();
        if (activeCue) {
          useShowStore.getState().selectCue(activeCue.id);
          useShowStore.getState().setInspectorOpen(true);
        }
      },
      onCameraModeChange: (mode) => setCameraPresetState(mode),
    });

    sceneRef.current = scene;
    onSceneRefRef.current?.(scene);

    return () => {
      onSceneRefRef.current?.(null);
      scene.dispose();
      sceneRef.current = null;
    };
  }, [webglAvailable, rendererFactory]);

  // Update scene when props or stores change
  useEffect(() => {
    if (!sceneRef.current) return;

    sceneRef.current.setBeamThreshold(beamThreshold);
    sceneRef.current.update({
      config,
      activeCue,
      selectedFixtureId,
      selectedScreenId,
      haze,
      vxOutputs,
      beamMode: showAllBeams ? 'all' : 'selected',
    });
  }, [config, activeCue, selectedFixtureId, selectedScreenId, haze, vxOutputs, beamThreshold, showAllBeams]);

  const handleCameraPreset = (preset: CameraPresetType) => {
    setCameraPresetState(preset);
    sceneRef.current?.setCameraPreset(preset);
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-surface-0 text-content-1 select-none overflow-hidden" data-testid="stage-3d-view">
      {/* Main 3D Canvas / Fallback Area */}
      <div className="relative flex-1 bg-gradient-to-b from-[#0a0c10] via-surface-0 to-black overflow-hidden flex flex-col gap-2 p-2">
        {/* Floating Pill: Glassmorphism Technical Pill centered over 3D Canvas */}
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-2xl bg-[#0d121a]/80 border border-white/10 px-4 py-2 shadow-2xl backdrop-blur-md select-none text-xs"
          data-testid="stage-3d-floating-pill"
        >
          {/* Camera Presets Segmented Control */}
          <div className="inline-flex rounded-lg bg-surface-2/80 p-0.5 border border-border-subtle text-xs">
            <button
              onClick={() => handleCameraPreset('foh')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                cameraPreset === 'foh'
                  ? 'bg-accent text-surface-0 font-bold shadow'
                  : 'text-content-3 hover:text-content-1'
              }`}
              title="Góc nhìn khán giả FOH (Front of House)"
              data-testid="preset-foh"
            >
              FOH
            </button>
            <button
              onClick={() => handleCameraPreset('topDown')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                cameraPreset === 'topDown'
                  ? 'bg-accent text-surface-0 font-bold shadow'
                  : 'text-content-3 hover:text-content-1'
              }`}
              title="Góc nhìn từ trên xuống (Top-down Plan)"
              data-testid="preset-topdown"
            >
              Top-Down
            </button>
            <button
              onClick={() => handleCameraPreset('backstage')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                cameraPreset === 'backstage'
                  ? 'bg-accent text-surface-0 font-bold shadow'
                  : 'text-content-3 hover:text-content-1'
              }`}
              title="Góc nhìn cánh gà / hậu trường (Backstage Wing)"
              data-testid="preset-backstage"
            >
              Backstage
            </button>
          </div>

          {cameraPreset === 'free' && (
            <span
              className="rounded border border-status-standby/60 bg-status-standby/15 px-2 py-0.5 text-[11px] font-semibold text-status-standby"
              title="Camera đã xoay tay khỏi preset. Bấm FOH / Top-Down / Backstage để trở lại."
              data-testid="camera-free-indicator"
            >
              Tự do
            </span>
          )}

          <div className="h-4 w-px bg-white/10" />

          {/* Stage Presets */}
          <div className="flex items-center gap-1">
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

          <div className="h-4 w-px bg-white/10" />

          {/* Optical Environment Controls: Haze & Dimmer */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHaze(!haze)}
              className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold border transition-colors ${
                haze
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'bg-surface-2 border-border-default text-content-3 hover:text-content-1'
              }`}
              title="Công tắc khói sân khấu (Haze/Fog) tăng giảm độ rõ chùm sáng"
              data-testid="haze-toggle"
            >
              <Wind className="h-3.5 w-3.5" />
              <span>Haze: {haze ? 'ON' : 'OFF'}</span>
            </button>

            <select
              value={dimmerCurve}
              onChange={(e) => setDimmerCurve(e.target.value as any)}
              className="rounded bg-surface-2 border border-border-default px-2 py-0.5 text-[11px] text-content-2 font-mono"
              title="Đường cong dimmer quang học"
            >
              <option value="square">Curve: I² (Square)</option>
              <option value="linear">Curve: Linear</option>
              <option value="s-curve">Curve: S-Curve</option>
            </select>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Beams toggle: All Beams / Selected */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAllBeams((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold border transition-colors ${
                showAllBeams
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'bg-surface-2 border-border-default text-content-3 hover:text-content-1'
              }`}
              title="Chế độ hiển thị chùm sáng: Tất cả đèn trong cue hoặc chỉ đèn đang chọn"
              data-testid="beam-show-all"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{showAllBeams ? 'All Beams' : 'Selected'}</span>
            </button>

            <button
              onClick={() => setBeamThresholdState((prev) => (prev > 50 ? 50 : 150))}
              className="font-mono text-[11px] font-bold text-accent hover:underline rounded bg-surface-2 px-1.5 py-0.5 border border-border-subtle"
              title="Ngưỡng tự động ngắt chùm tia để tiết kiệm GPU/CPU khi số lượng đèn vượt ngưỡng"
              data-testid="beam-threshold-toggle"
            >
              {beamThreshold > 50 ? '≤ 150' : '≤ 50'}
            </button>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Rig Config Toggle */}
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors border border-border-default ${
              isConfigOpen
                ? 'bg-accent text-surface-0 font-bold'
                : 'bg-surface-2 text-content-2 hover:bg-surface-3 hover:text-content-1'
            }`}
            title="Mở bảng cấu hình Rig sân khấu (Stage Rig Config)"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Config</span>
          </button>
        </div>

        {!webglAvailable ? (
          <div className="relative flex h-full w-full flex-col items-center justify-center p-8 text-center" data-testid="webgl-fallback">
            <div className="rounded-2xl border border-border-default bg-surface-1/90 p-8 max-w-md shadow-2xl backdrop-blur">
              <Box className="mx-auto h-12 w-12 text-status-standby mb-3 opacity-80" />
              <h3 className="text-sm font-bold text-content-1">Chế độ Fallback Sân Khấu 3D</h3>
              <p className="mt-2 text-xs text-content-3 leading-relaxed">
                Thiết bị hoặc môi trường hiện tại không hỗ trợ tăng tốc phần cứng WebGL.
                Các chức năng kiểm toán dữ liệu và kịch bản đèn vẫn hoạt động bình thường bên dưới.
              </p>
              <div className="mt-4 rounded border border-border-default bg-surface-2 p-2.5 text-left text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-content-3">Preset:</span>
                  <span className="text-content-1 font-semibold">{config.preset}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-3">Kích thước:</span>
                  <span className="text-content-1">{config.widthMeters}m × {config.depthMeters}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-3">Màn LED:</span>
                  <span className="text-dept-vx font-semibold">{config.screens.filter((s) => s.enabled).length} màn</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-3">Đèn cue active:</span>
                  <span className="text-content-1 font-semibold">{activeCount} đèn</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-3">Tổng đèn Rig:</span>
                  <span className="text-dept-lx font-semibold">{config.fixtures?.length ?? 0} đèn</span>
                </div>
              </div>
            </div>

            {/* Integrated VX Control Dock in fallback mode */}
            <VxControlBar />
          </div>
        ) : (
          <div className="relative flex min-h-0 w-full flex-1 items-center justify-center rounded-lg overflow-hidden border border-border-default/40">
            {/* 3D Canvas Mount Point */}
            <div ref={containerRef} className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing" data-testid="stage-3d-canvas" />

            {/* 2D HUD Overlays */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
              {/* Top HUD: Active Cue Card & Cue Counter Badges */}
              <div className="pointer-events-auto flex items-start gap-2">
                {activeCue ? (
                  <div className="rounded-lg border border-border-default/70 bg-surface-1/80 p-2 text-xs backdrop-blur shadow-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-accent font-mono">Cue #{activeCue.cueNumber}</span>
                      <span className="text-content-1 font-medium">{activeCue.title}</span>
                    </div>
                    {lxCue && (
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-content-3 font-mono">
                        <span>LX: {lxCue.sceneName || 'Standard'}</span>
                        <span>·</span>
                        <span>{lxCue.intensity ?? 80}%</span>
                        <span>·</span>
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full border border-black/40 shadow-sm"
                          style={{ backgroundColor: fixtureColor }}
                        />
                        <span className="text-content-2">{colorLabel}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="rounded-lg border border-border-default/70 bg-surface-1/80 p-2 text-[11px] text-content-3 backdrop-blur shadow-lg"
                    data-testid="no-cue-hint"
                  >
                    <span className="font-semibold text-content-2">Chưa gọi cue</span>
                    <span className="mx-1">·</span>
                    <span>sân khấu trống</span>
                    <span className="mx-1">·</span>
                    <span className="font-mono">rig mặc định {rigCount} đèn</span>
                  </div>
                )}

                {/* Cue fixture counter badge */}
                <div
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono font-medium ${
                    isCountMismatch
                      ? 'bg-status-danger/20 text-status-danger border-status-danger/60 animate-pulse'
                      : 'bg-surface-1/80 text-content-2 border-border-default/70 backdrop-blur shadow-lg'
                  }`}
                  title={
                    isCountMismatch
                      ? 'Cảnh báo: Số lượng đèn hiển thị trên sân khấu không khớp số lượng nhập trong Cue!'
                      : 'Đèn của cue đang chạy (Go). Chưa gọi cue thì sân khấu trống.'
                  }
                  data-testid="cue-count-badge"
                >
                  <span>
                    {activeCue
                      ? `Cue ${activeCue.cueNumber}: Nhập ${requestedCount} · Hiển thị ${activeCount}`
                      : 'Cue: chưa gọi · 0 đèn'}
                  </span>
                  {isCountMismatch && <AlertTriangle className="h-3.5 w-3.5 text-status-danger" />}
                </div>

                {/* Base rig counter */}
                <div
                  className="flex items-center gap-1 rounded-lg bg-surface-1/80 border border-border-default/70 px-2.5 py-1 text-xs text-content-3 font-mono backdrop-blur shadow-lg"
                  title="Số đèn trong rig mặc định của sân khấu (cấu hình). Đây không phải số đèn đang chiếu."
                  data-testid="rig-count-badge"
                >
                  <Box className="h-3.5 w-3.5 text-content-3" />
                  <span>Rig mặc định {rigCount}</span>
                </div>
              </div>

              {/* Bottom Instructions Prompt (spaced above VxControlBar) */}
              <div className="pointer-events-none flex justify-center mb-14">
                <span className="rounded-full bg-surface-1/60 px-3 py-0.5 text-[10px] text-content-3 backdrop-blur border border-border-default/40">
                  Kéo chuột xoay · Cuộn phóng to · Click vào đèn hoặc màn hình để chọn · Chọn đèn để xem chùm sáng
                </span>
              </div>
            </div>

            {/* Integrated VX Control Dock inside 3D Canvas */}
            <VxControlBar />
          </div>
        )}

        {/* Footer: colour, legend, warnings and specs */}
        <div
          className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-border-default bg-surface-1/90 px-3 py-1.5 text-[11px] backdrop-blur"
          data-testid="stage-footer"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-content-2">LX Color:</span>
            <span
              className="h-3.5 w-3.5 flex-shrink-0 rounded-full border border-black/50 shadow-sm"
              style={{ backgroundColor: fixtureColor }}
            />
            <span className="font-mono font-bold text-content-1">{colorLabel}</span>
            <span className="font-mono text-content-3">({fixtureColor})</span>
          </div>

          {legendTypes.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-l border-border-default/60 pl-4">
              {legendTypes.map((type) => (
                <span key={type} className="inline-flex items-center gap-1 text-content-3">
                  <span className="text-[12px] leading-none text-content-2">
                    {FIXTURE_SYMBOLS[type].glyph}
                  </span>
                  <span>{FIXTURE_SYMBOLS[type].label}</span>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 border-l border-border-default/60 pl-4 font-mono text-[10px] text-content-3">
            <span data-testid="footer-fixture-counts">
              Cue: {activeCount}/{requestedCount} đèn · Rig: {rigCount}
            </span>
            <span>Dimmer: {dimmerCurve}</span>
            <span>Haze: {haze ? 'Enabled' : 'Off'}</span>
            <span>Power: {powerKw} kW</span>
          </div>

          {stageWarnings.length > 0 && (
            <div className="flex w-full flex-wrap items-center gap-1.5 border-t border-border-default/60 pt-1.5" data-testid="stage-warning-chips">
              <Info className="h-3 w-3 flex-shrink-0 text-content-3" />
              {stageWarnings.map((warning) => (
                <span
                  key={warning.code}
                  title={warning.message}
                  className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] ${
                    warning.severity === 'warn'
                      ? 'border-status-standby/50 bg-status-standby/10 text-status-standby'
                      : 'border-border-default bg-surface-2 text-content-3'
                  }`}
                >
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {STAGE_WARNING_LABELS[warning.code]}
                </span>
              ))}
            </div>
          )}

          {isOutOfGamut && (
            <div className="flex w-full items-center gap-1.5 border-t border-border-default/60 pt-1.5 text-[10px] font-medium text-status-standby">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              <span>Màu vượt gam sRGB (thực tế rực rỡ hơn trên sân khấu)</span>
            </div>
          )}

          <div className="flex w-full items-center gap-1 border-t border-border-default/60 pt-1 text-[9px] italic text-content-3">
            <Info className="h-2.5 w-2.5 flex-shrink-0" />
            <span>Mô hình khối 3D low-poly on-demand cho live show. Click chọn fixture/màn để chỉnh trên Rig Editor.</span>
          </div>
        </div>

        {/* Floating Configuration Sidebar / Drawer */}
        {isConfigOpen && (
          <div className="absolute right-4 top-4 bottom-4 z-30 w-80 space-y-3 overflow-y-auto rounded-xl border border-border-default bg-surface-1/95 p-4 text-xs shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between border-b border-border-default pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-content-1">
                Stage Rig Configuration
              </span>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="text-content-3 hover:text-content-1"
                title="Đóng bảng cấu hình"
              >
                ✕
              </button>
            </div>

            <StageRigEditor />
          </div>
        )}
      </div>
    </div>
  );
};
