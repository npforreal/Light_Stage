/**
 * Đợt 13 — Stage 3D review fixes verification.
 * Covers: single source of fixture quantity (13.1), declutter/type silhouettes
 * (13.2), readable Top-Down framing (13.3) and camera preset button sync incl.
 * free orbit (13.4).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import * as THREE from 'three';
import { Stage3DView } from '../components/stage/Stage3DView';
import { Stage3DScene, CameraMode } from '../components/stage/Stage3DScene';
import { Header } from '../components/Header';
import { setupWebGLMock, WebGLMockControls } from './helpers/mockWebGL';
import { useStageStore } from '../store/useStageStore';
import { useShowStore } from '../store/useShowStore';
import { STAGE_PRESETS, StageConfig } from '../types/virtualStage';
import { createDefaultShow, Cue } from '../types/stage';
import { parseFixtureText } from '../services/fixtureModel';

const THIRTY_FIXTURES = 'Beam x8, Spot x4, Wash x12, Follow x2, Blinder x4';

function buildCue30(actId = 'act-13'): Cue {
  return {
    id: 'cue-13',
    actId,
    cueNumber: '13.0',
    title: 'Thirty Fixture Cue',
    status: 'Pending',
    durationMs: 60000,
    totalLightingFixtures: 30,
    totalScreens: 0,
    departments: {
      lx: {
        sceneName: 'Thirty',
        intensity: 80,
        colorPreset: '#38bdf8',
        fixtures: parseFixtureText(THIRTY_FIXTURES),
      },
    },
  };
}

function loadShowWithCue(cue: Cue | null) {
  const base = createDefaultShow('Round 13 Test');
  const act = base.acts[0];
  const cues = cue ? [{ ...cue, actId: act.id }] : [];
  useShowStore.setState({
    show: { ...base, acts: [{ ...act, cues }] },
    activeCueId: cue ? cue.id : null,
    standbyCueId: null,
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,
  });
}

function makeContainer(): HTMLDivElement {
  const container = document.createElement('div');
  Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
  Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });
  document.body.appendChild(container);
  return container;
}

function expectStageFramed(scene: Stage3DScene) {
  const config = scene['currentConfig'] as StageConfig;
  scene.camera.updateMatrixWorld(true);
  const w = config.widthMeters;
  const d = config.depthMeters;
  const topTrim = Math.max(
    ...config.trusses.filter((t) => t.enabled !== false).map((t) => t.zMeters ?? 7),
    7
  );
  const points = [
    new THREE.Vector3(-w / 2, 0, 0),
    new THREE.Vector3(w / 2, 0, 0),
    new THREE.Vector3(-w / 2, 0, -d),
    new THREE.Vector3(w / 2, 0, -d),
    new THREE.Vector3(-w / 2, topTrim, -d / 2),
    new THREE.Vector3(w / 2, topTrim, -d / 2),
  ];

  for (const point of points) {
    const ndc = point.clone().project(scene.camera);
    expect(Number.isFinite(ndc.x)).toBe(true);
    expect(Math.abs(ndc.x)).toBeLessThanOrEqual(1.1);
    expect(Math.abs(ndc.y)).toBeLessThanOrEqual(1.1);
  }
}

describe('Đợt 13: Stage 3D after review', () => {
  let mockControls: WebGLMockControls;
  let container: HTMLDivElement;

  beforeEach(() => {
    mockControls = setupWebGLMock();
    container = makeContainer();
    useStageStore.setState({
      config: JSON.parse(JSON.stringify(STAGE_PRESETS.EndStage)),
      selectedFixtureId: null,
      selectedScreenId: null,
      cameraView: 'foh',
    });
    loadShowWithCue(null);
  });

  afterEach(() => {
    mockControls.restore();
    if (container.parentNode) container.parentNode.removeChild(container);
    vi.restoreAllMocks();
  });

  describe('13.1 One source of truth for fixture quantity', () => {
    it('draws zero fixtures on an empty stage (no active cue) even though a rig exists', () => {
      const scene = new Stage3DScene(container, {
        rendererFactory: mockControls.rendererFactory,
      });

      scene.update({ config: STAGE_PRESETS.EndStage });

      expect(scene.getFixtureCount()).toBe(0);
      expect(scene.getBeamCount()).toBe(0);
      expect(scene.getPoolRingCount()).toBe(0);
      expect(container.querySelector('canvas')).toBeTruthy();
      scene.dispose();
    });

    it('shows 0 everywhere in the UI when no cue is live, and labels the default rig separately', () => {
      render(<Stage3DView rendererFactory={mockControls.rendererFactory} />);

      expect(screen.getByTestId('cue-count-badge').textContent).toContain(
        'chưa gọi — 0 đèn'
      );
      expect(screen.getByTestId('rig-count-badge').textContent).toContain('Rig mặc định 44');
      expect(screen.getByTestId('no-cue-hint').textContent).toContain('rig mặc định 44');
      expect(screen.getByTestId('footer-fixture-counts').textContent).toContain(
        'Cue: 0/0 đèn'
      );
      expect(screen.getByTestId('footer-fixture-counts').textContent).toContain('Rig: 44');

      render(
        <Header
          viewMode="stage"
          setViewMode={vi.fn()}
          isOperatorLocked={false}
          setIsOperatorLocked={vi.fn()}
          onOpenProject={vi.fn()}
          onImportClick={vi.fn()}
          onExportClick={vi.fn()}
          onHelpClick={vi.fn()}
          wallClock="19:30:00"
        />
      );
      expect(screen.getByTestId('header-lx-count').textContent).toContain('LX: 0');
      expect(screen.getByTestId('header-vx-count').textContent).toContain('VX: 0');
    });

    it('reports 30 fixtures everywhere when the cue is entered from the quick fixture text', () => {
      const actId = useShowStore.getState().show.acts[0].id;
      let cueId = '';
      act(() => {
        cueId = useShowStore.getState().addCue(actId, {
          title: 'Imported 30',
          departments: { lx: { fixtureSummary: THIRTY_FIXTURES } },
        });
      });

      const cue = useShowStore.getState().getCueById(cueId);
      expect(cue?.totalLightingFixtures).toBe(30);
      expect(cue?.departments.lx?.fixtures?.length).toBe(5);
      act(() => {
        useShowStore.getState().goCue(cueId);
      });
      expect(useShowStore.getState().getActiveCue()?.id).toBe(cueId);

      render(<Stage3DView rendererFactory={mockControls.rendererFactory} />);
      const cueBadge = screen.getByTestId('cue-count-badge').textContent ?? '';
      expect(cueBadge).toContain('Nhập 30');
      expect(cueBadge).toContain('Hiển thị 30');
      expect(screen.getByTestId('footer-fixture-counts').textContent).toContain(
        'Cue: 30/30 đèn'
      );

      const scene = new Stage3DScene(container, {
        rendererFactory: mockControls.rendererFactory,
      });
      scene.update({
        config: STAGE_PRESETS.EndStage,
        activeCue: useShowStore.getState().getActiveCue(),
      });
      expect(scene.getFixtureCount()).toBe(30);
      scene.dispose();
    });

    it('reports 30 fixtures in header, cue counter, footer and 3D bodies for "Beam x8, Spot x4, Wash x12, Follow x2, Blinder x4"', () => {
      const cue = buildCue30();
      loadShowWithCue(cue);

      render(<Stage3DView rendererFactory={mockControls.rendererFactory} />);

      const badge = screen.getByTestId('cue-count-badge').textContent ?? '';
      expect(badge).toContain('Cue 13.0');
      expect(badge).toContain('Nhập 30');
      expect(badge).toContain('Hiển thị 30');
      const footer = screen.getByTestId('footer-fixture-counts').textContent ?? '';
      expect(footer).toContain('Cue: 30/30 đèn');
      expect(footer).toContain('Rig: 44');

      render(
        <Header
          viewMode="stage"
          setViewMode={vi.fn()}
          isOperatorLocked={false}
          setIsOperatorLocked={vi.fn()}
          onOpenProject={vi.fn()}
          onImportClick={vi.fn()}
          onExportClick={vi.fn()}
          onHelpClick={vi.fn()}
          wallClock="19:30:00"
        />
      );
      expect(screen.getByTestId('header-lx-count').textContent).toContain('LX: 30');

      const scene = new Stage3DScene(container, {
        rendererFactory: mockControls.rendererFactory,
      });
      scene.update({ config: STAGE_PRESETS.EndStage, activeCue: cue });
      expect(scene.getFixtureCount()).toBe(30);
      scene.dispose();
    });
  });

  describe('13.2 Declutter: thin beams, type silhouettes, opt-in show all', () => {
    it('draws no beams by default and exactly one beam for the selected fixture', () => {
      const cue = buildCue30();
      const scene = new Stage3DScene(container, {
        rendererFactory: mockControls.rendererFactory,
      });
      scene.update({ config: STAGE_PRESETS.EndStage, activeCue: cue });
      expect(scene.getBeamCount()).toBe(0);

      const selectedId = scene['fixturePlacements'][0].id;
      scene.update({
        config: STAGE_PRESETS.EndStage,
        activeCue: cue,
        selectedFixtureId: selectedId,
        beamMode: 'selected',
      });
      expect(scene.getBeamCount()).toBe(1);
      scene.dispose();
    });

    it('uses normal (non-additive) low-opacity beams when "show all" is enabled', () => {
      const cue = buildCue30();
      const scene = new Stage3DScene(container, {
        rendererFactory: mockControls.rendererFactory,
      });
      scene.update({
        config: STAGE_PRESETS.EndStage,
        activeCue: cue,
        beamMode: 'all',
      });

      expect(scene.getBeamCount()).toBe(30);
      const beamMaterials: THREE.Material[] = [];
      scene['beamGroup'].traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          beamMaterials.push(mesh.material as THREE.Material);
        }
      });
      expect(beamMaterials.length).toBeGreaterThan(0);
      for (const material of beamMaterials) {
        const basic = material as THREE.MeshBasicMaterial;
        expect(basic.blending).not.toBe(THREE.AdditiveBlending);
        expect(basic.opacity).toBeLessThanOrEqual(0.25);
      }
      scene.dispose();
    });

    it('gives each fixture type a distinct silhouette and body colour', () => {
      const cue = buildCue30();
      const scene = new Stage3DScene(container, {
        rendererFactory: mockControls.rendererFactory,
      });
      scene.update({ config: STAGE_PRESETS.EndStage, activeCue: cue });

      const instanced = scene['fixtureGroup'].children.filter(
        (child) => (child as THREE.InstancedMesh).isInstancedMesh
      ) as THREE.InstancedMesh[];
      // Beam, Spot, Wash, Follow, Blinder = 5 distinct type meshes
      expect(instanced.length).toBe(5);

      const colors = new Set(
        instanced.map((mesh) => {
          const material = mesh.material as THREE.MeshStandardMaterial;
          return material.color.getHexString();
        })
      );
      expect(colors.size).toBe(5);
      scene.dispose();
    });

    it('exposes a "All Beams / Selected" toggle in the view', () => {
      const cue = buildCue30();
      loadShowWithCue(cue);
      render(<Stage3DView rendererFactory={mockControls.rendererFactory} />);

      const toggle = screen.getByTestId('beam-show-all');
      expect(toggle.textContent).toContain('Selected');
      fireEvent.click(toggle);
      expect(toggle.textContent).toContain('All Beams');
    });
  });

  describe('13.3 Readable Top-Down / FOH / Backstage', () => {
    it('frames the whole stage for all three presets', () => {
      const scene = new Stage3DScene(container, {
        rendererFactory: mockControls.rendererFactory,
      });

      for (const stagePreset of ['EndStage', 'Festival', 'Thrust'] as const) {
        const config = JSON.parse(JSON.stringify(STAGE_PRESETS[stagePreset]));
        scene.update({ config });
        for (const preset of ['foh', 'topDown', 'backstage'] as const) {
          scene.setCameraPreset(preset);
          expectStageFramed(scene);
        }
      }
      scene.dispose();
    });

    it('hides beams and draws thin floor pools in Top-Down', () => {
      const cue = buildCue30();
      const scene = new Stage3DScene(container, {
        rendererFactory: mockControls.rendererFactory,
      });
      scene.update({
        config: STAGE_PRESETS.EndStage,
        activeCue: cue,
        beamMode: 'all',
      });
      expect(scene.getBeamCount()).toBe(30);

      scene.setCameraPreset('topDown');
      expect(scene.getBeamCount()).toBe(0);
      expect(scene.getPoolRingCount()).toBe(30);
      expect(scene['poolGroup'].children.length).toBe(30);

      scene.setCameraPreset('foh');
      expect(scene.getPoolRingCount()).toBe(0);
      expect(scene.getBeamCount()).toBe(30);
      scene.dispose();
    });
  });

  describe('13.4 Camera preset buttons follow the real camera', () => {
    it('reports "free" when the operator orbits manually', () => {
      const modes: CameraMode[] = [];
      const scene = new Stage3DScene(container, {
        rendererFactory: mockControls.rendererFactory,
        onCameraModeChange: (mode) => modes.push(mode),
      });
      scene.update({ config: STAGE_PRESETS.EndStage });

      scene.setCameraPreset('topDown');
      expect(scene.getCameraMode()).toBe('topDown');
      expect(modes[modes.length - 1]).toBe('topDown');

      scene.controls.dispatchEvent({ type: 'start' });
      expect(scene.getCameraMode()).toBe('free');
      expect(modes[modes.length - 1]).toBe('free');

      scene.setCameraPreset('backstage');
      expect(scene.getCameraMode()).toBe('backstage');
      scene.dispose();
    });

    it('clears preset button highlight and shows "Tự do" after a manual orbit, then restores on click', () => {
      let sceneRef: Stage3DScene | null = null;
      render(
        <Stage3DView
          rendererFactory={mockControls.rendererFactory}
          onSceneRef={(scene) => {
            sceneRef = scene;
          }}
        />
      );

      const topDown = screen.getByTestId('preset-topdown');
      fireEvent.click(topDown);
      expect(topDown.className).toContain('bg-accent');

      act(() => {
        (sceneRef as Stage3DScene).controls.dispatchEvent({ type: 'start' });
      });

      expect(screen.getByTestId('camera-free-indicator')).toBeTruthy();
      expect(screen.getByTestId('preset-topdown').className).not.toContain('bg-accent');
      expect(screen.getByTestId('preset-foh').className).not.toContain('bg-accent');

      fireEvent.click(screen.getByTestId('preset-foh'));
      expect(screen.queryByTestId('camera-free-indicator')).toBeNull();
      expect(screen.getByTestId('preset-foh').className).toContain('bg-accent');
      expect((sceneRef as unknown as Stage3DScene).getCameraMode()).toBe('foh');
    });
  });
});
