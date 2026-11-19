import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Stage3DView } from '../components/stage/Stage3DView';
import { Stage3DScene } from '../components/stage/Stage3DScene';
import { setupWebGLMock, WebGLMockControls } from './helpers/mockWebGL';
import { useStageStore } from '../store/useStageStore';
import { STAGE_PRESETS } from '../types/virtualStage';
import { Cue } from '../types/stage';
import tauriConfig from '../../src-tauri/tauri.conf.json';

describe('Đợt 12: Stage 3D Verification Suite', () => {
  let mockControls: WebGLMockControls;

  beforeEach(() => {
    mockControls = setupWebGLMock();
    useStageStore.setState({
      config: JSON.parse(JSON.stringify(STAGE_PRESETS.EndStage)),
      selectedFixtureId: null,
      selectedScreenId: null,
      cameraView: 'foh',
    });
  });

  afterEach(() => {
    mockControls.restore();
    vi.restoreAllMocks();
  });

  describe('1. Responsive Layout across Viewports (960px, 1280px, 1920px)', () => {
    const viewports = [960, 1280, 1920];

    viewports.forEach((vp) => {
      it(`renders Stage 3D view and controls seamlessly at ${vp}px`, () => {
        window.innerWidth = vp;
        window.innerHeight = 800;

        render(<Stage3DView rendererFactory={mockControls.rendererFactory} />);

        expect(screen.getByTestId('stage-3d-view')).toBeInTheDocument();
        expect(screen.getByTestId('preset-foh')).toBeInTheDocument();
        expect(screen.getByTestId('preset-topdown')).toBeInTheDocument();
        expect(screen.getByTestId('preset-backstage')).toBeInTheDocument();
        expect(screen.getByTestId('stage-footer')).toBeInTheDocument();
      });
    });
  });

  describe('2. Camera Presets (FOH / Top-down / Backstage)', () => {
    it('switches camera positions and updates scene controls for all 3 presets', () => {
      const container = document.createElement('div');
      Object.defineProperty(container, 'clientWidth', { value: 800 });
      Object.defineProperty(container, 'clientHeight', { value: 600 });
      document.body.appendChild(container);

      const scene = new Stage3DScene(container, {
        rendererFactory: mockControls.rendererFactory,
      });

      // FOH Preset
      scene.setCameraPreset('foh');
      const fohPos = scene['camera'].position.clone();
      expect(fohPos.z).toBeGreaterThan(0);

      // Top-Down Preset
      scene.setCameraPreset('topDown');
      const topPos = scene['camera'].position.clone();
      expect(topPos.y).toBeGreaterThan(fohPos.y);

      // Backstage Preset
      scene.setCameraPreset('backstage');
      const backstagePos = scene['camera'].position.clone();
      expect(backstagePos.x).toBeLessThan(0);

      scene.dispose();
      document.body.removeChild(container);
    });
  });

  describe('3. Raycasting Selection Synchronization with Rig Editor', () => {
    it('synchronizes selection between 3D scene and StageRigEditor', () => {
      const { unmount } = render(<Stage3DView rendererFactory={mockControls.rendererFactory} />);

      // Open StageRigEditor
      const configBtn = screen.getByRole('button', { name: /Config/i });
      fireEvent.click(configBtn);

      const firstScreen = useStageStore.getState().config.screens[0];
      const firstFixture = useStageStore.getState().config.fixtures?.[0];
      expect(firstFixture).toBeDefined();
      if (!firstFixture) return;

      // Select screen
      act(() => {
        useStageStore.getState().selectScreen(firstScreen.id);
      });
      expect(useStageStore.getState().selectedScreenId).toBe(firstScreen.id);
      expect(useStageStore.getState().selectedFixtureId).toBeNull();

      // Select fixture
      act(() => {
        useStageStore.getState().selectFixture(firstFixture.id);
      });
      expect(useStageStore.getState().selectedFixtureId).toBe(firstFixture.id);
      expect(useStageStore.getState().selectedScreenId).toBeNull();

      unmount();
    });
  });

  describe('4. Beam Cutoff Threshold (>150 fixtures performance guard)', () => {
    it('turns off volumetric cone beams when fixture count exceeds threshold', () => {
      const container = document.createElement('div');
      Object.defineProperty(container, 'clientWidth', { value: 800 });
      Object.defineProperty(container, 'clientHeight', { value: 600 });
      document.body.appendChild(container);

      const scene = new Stage3DScene(container, {
        beamThreshold: 20,
        rendererFactory: mockControls.rendererFactory,
      });

      const activeCue: Cue = {
        id: 'cue-threshold',
        actId: 'act-1',
        cueNumber: '1',
        title: 'Threshold test',
        status: 'Go',
        durationMs: 60000,
        totalLightingFixtures: 30,
        totalScreens: 0,
        departments: {
          lx: {
            fixtures: [
              {
                id: 'f-a',
                name: 'Beam',
                category: 'Lighting',
                subType: 'Beam',
                count: 30,
              },
            ],
          },
        },
      };

      // 30 active cue fixtures > 20 threshold: beams are cutoff, bodies remain.
      scene.update({
        config: STAGE_PRESETS.EndStage,
        activeCue,
        beamMode: 'all',
      });

      expect(scene.getFixtureCount()).toBe(30);
      expect(scene['beamGroup'].children.length).toBe(0);
      expect(scene['fixtureGroup'].children.length).toBeGreaterThan(0);

      // Raising threshold to 150 enables beams
      scene.setBeamThreshold(150);
      expect(scene['beamGroup'].children.length).toBeGreaterThan(0);

      scene.dispose();
      document.body.removeChild(container);
    });
  });

  describe('5. Fallback WebGL Mode', () => {
    it('safely displays fallback information card when WebGL context cannot be created', () => {
      const origGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = () => null;

      render(<Stage3DView />);

      expect(screen.getByTestId('webgl-fallback')).toBeInTheDocument();
      expect(screen.getByText(/Chế độ Fallback Sân Khấu 3D/)).toBeInTheDocument();
      expect(screen.getByText(/Tổng đèn Rig:/)).toBeInTheDocument();

      HTMLCanvasElement.prototype.getContext = origGetContext;
    });
  });

  describe('6. Security & CSP Configuration Check in tauri.conf.json', () => {
    it('confirms CSP policy accommodates Three.js requirements safely', () => {
      const csp = tauriConfig.app.security.csp;
      expect(csp).toBeTruthy();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain('img-src');
      expect(csp).toContain('data:');
      expect(csp).toContain('blob:');
      expect(csp).toContain('script-src');
    });
  });
});
