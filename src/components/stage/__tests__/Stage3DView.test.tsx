import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Stage3DView } from '../Stage3DView';
import { setupWebGLMock, WebGLMockControls } from '../../../__tests__/helpers/mockWebGL';
import { useStageStore } from '../../../store/useStageStore';
import { useShowStore } from '../../../store/useShowStore';
import { useVisualStore } from '../../../store/useVisualStore';
import { STAGE_PRESETS } from '../../../types/virtualStage';
import { Stage3DScene } from '../Stage3DScene';

describe('Stage3DView Component', () => {
  let mockControls: WebGLMockControls;

  beforeEach(() => {
    mockControls = setupWebGLMock();
    useStageStore.setState({
      config: JSON.parse(JSON.stringify(STAGE_PRESETS.EndStage)),
      selectedFixtureId: null,
      selectedScreenId: null,
      cameraView: 'foh',
    });
    useShowStore.setState({
      activeCueId: null,
      standbyCueId: null,
      selectedCueId: null,
      isInspectorOpen: false,
    });
    useVisualStore.setState({
      isFrozen: false,
      isBlackout: false,
      activeLayers: { background: true, slide: true, overlay: false },
    });
  });

  afterEach(() => {
    mockControls.restore();
    vi.restoreAllMocks();
  });

  it('renders floating pill and floating VX dock over 3D canvas', () => {
    render(<Stage3DView rendererFactory={mockControls.rendererFactory} />);

    // Floating pill
    const floatingPill = screen.getByTestId('stage-3d-floating-pill');
    expect(floatingPill).toBeTruthy();
    expect(floatingPill.className).toContain('absolute top-3 right-3');

    // Camera presets inside pill
    expect(screen.getByTestId('preset-foh')).toBeTruthy();
    expect(screen.getByTestId('preset-topdown')).toBeTruthy();
    expect(screen.getByTestId('preset-backstage')).toBeTruthy();

    // Floating VX dock
    const floatingDock = screen.getByTestId('vx-floating-dock');
    expect(floatingDock).toBeTruthy();
    expect(floatingDock.className).toContain('absolute bottom-3 left-1/2 -translate-x-1/2');

    expect(screen.getByTestId('stage-footer')).toBeTruthy();
    expect(screen.getByText(/LX Color:/i)).toBeTruthy();
  });

  it('switches camera preset buttons on click', () => {
    render(<Stage3DView rendererFactory={mockControls.rendererFactory} />);

    const topDownBtn = screen.getByTestId('preset-topdown');
    fireEvent.click(topDownBtn);
    expect(topDownBtn.className).toContain('bg-accent');

    const backstageBtn = screen.getByTestId('preset-backstage');
    fireEvent.click(backstageBtn);
    expect(backstageBtn.className).toContain('bg-accent');
  });

  it('switches stage presets via floating pill buttons', () => {
    render(<Stage3DView rendererFactory={mockControls.rendererFactory} />);

    const festivalBtn = screen.getByRole('button', { name: 'Festival' });
    fireEvent.click(festivalBtn);
    expect(useStageStore.getState().config.preset).toBe('Festival');

    const thrustBtn = screen.getByRole('button', { name: 'Thrust' });
    fireEvent.click(thrustBtn);
    expect(useStageStore.getState().config.preset).toBe('Thrust');

    const standardBtn = screen.getByRole('button', { name: 'Standard' });
    fireEvent.click(standardBtn);
    expect(useStageStore.getState().config.preset).toBe('EndStage');
  });

  it('toggles haze and changes dimmer curve', () => {
    render(<Stage3DView rendererFactory={mockControls.rendererFactory} />);

    const hazeBtn = screen.getByTestId('haze-toggle');
    expect(hazeBtn.textContent).toContain('Haze: ON');

    fireEvent.click(hazeBtn);
    expect(hazeBtn.textContent).toContain('Haze: OFF');

    const dimmerSelect = screen.getByTitle(/Đường cong dimmer quang học/i) as HTMLSelectElement;
    fireEvent.change(dimmerSelect, { target: { value: 'linear' } });
    expect(dimmerSelect.value).toBe('linear');
  });

  it('toggles beams mode between Selected and All Beams and toggles threshold', () => {
    render(<Stage3DView rendererFactory={mockControls.rendererFactory} initialBeamThreshold={150} />);

    const beamToggle = screen.getByTestId('beam-show-all');
    expect(beamToggle.textContent).toContain('Selected');

    fireEvent.click(beamToggle);
    expect(beamToggle.textContent).toContain('All Beams');

    const thresholdBtn = screen.getByTestId('beam-threshold-toggle');
    expect(thresholdBtn.textContent).toContain('150');

    fireEvent.click(thresholdBtn);
    expect(thresholdBtn.textContent).toContain('50');

    fireEvent.click(thresholdBtn);
    expect(thresholdBtn.textContent).toContain('150');
  });

  it('toggles Stage Rig Configuration sidebar', () => {
    render(<Stage3DView rendererFactory={mockControls.rendererFactory} />);

    expect(screen.queryByText(/Stage Rig Configuration/i)).toBeNull();

    const configBtn = screen.getByRole('button', { name: /Config/i });
    fireEvent.click(configBtn);

    expect(screen.getByText(/Stage Rig Configuration/i)).toBeTruthy();
    expect(screen.getByText(/LED Screens/i)).toBeTruthy();

    // Close config
    const closeBtn = screen.getByTitle(/Đóng bảng cấu hình/i);
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Stage Rig Configuration/i)).toBeNull();
  });

  it('wires 3D canvas fixture/screen selection callbacks to inspector when cue is active', () => {
    useShowStore.setState({
      show: {
        ...useShowStore.getState().show,
        acts: [
          {
            id: 'act-1',
            title: 'Act 1',
            order: 1,
            cues: [
              {
                id: 'cue-active-1',
                actId: 'act-1',
                cueNumber: '101',
                title: 'Grand Entrance',
                status: 'Go',
                durationMs: 30000,
                totalLightingFixtures: 8,
                totalScreens: 1,
                departments: {
                  lx: {
                    sceneName: 'Amber Glow',
                    intensity: 90,
                    colorPreset: '#f59e0b',
                    fixtureCount: 8,
                  },
                },
              },
            ],
          },
        ],
      },
      activeCueId: 'cue-active-1',
      standbyCueId: null,
      selectedCueId: null,
      isInspectorOpen: false,
    });

    let liveScene: Stage3DScene | null = null;
    render(
      <Stage3DView
        rendererFactory={mockControls.rendererFactory}
        onSceneRef={(scene) => {
          liveScene = scene;
        }}
      />
    );

    expect(liveScene).toBeTruthy();
    const sceneOptions = (liveScene as any).options;

    // Simulate clicking a fixture on 3D canvas
    act(() => {
      sceneOptions.onSelectFixture('fixture-spot-1');
    });

    expect(useStageStore.getState().selectedFixtureId).toBe('fixture-spot-1');
    expect(useShowStore.getState().selectedCueId).toBe('cue-active-1');
    expect(useShowStore.getState().isInspectorOpen).toBe(true);

    // Simulate clicking a screen on 3D canvas
    act(() => {
      sceneOptions.onSelectScreen('screen-main-led');
    });

    expect(useStageStore.getState().selectedScreenId).toBe('screen-main-led');
    expect(useShowStore.getState().selectedCueId).toBe('cue-active-1');
    expect(useShowStore.getState().isInspectorOpen).toBe(true);
  });

  it('sets stage store selection without opening inspector when no cue is active', () => {
    useShowStore.setState({
      activeCueId: null,
      selectedCueId: null,
      isInspectorOpen: false,
    });

    let liveScene: Stage3DScene | null = null;
    render(
      <Stage3DView
        rendererFactory={mockControls.rendererFactory}
        onSceneRef={(scene) => {
          liveScene = scene;
        }}
      />
    );

    const sceneOptions = (liveScene as any).options;

    act(() => {
      sceneOptions.onSelectFixture('fixture-wash-2');
    });

    expect(useStageStore.getState().selectedFixtureId).toBe('fixture-wash-2');
    expect(useShowStore.getState().selectedCueId).toBeNull();
    expect(useShowStore.getState().isInspectorOpen).toBe(false);
  });

  it('interacts with embedded floating VX dock panic actions and layer toggles', () => {
    render(<Stage3DView rendererFactory={mockControls.rendererFactory} />);

    // Outputs display
    expect(screen.getByText('Outputs:')).toBeInTheDocument();

    // Freeze VX toggle
    const freezeBtn = screen.getByTestId('vx-panic-freeze');
    fireEvent.click(freezeBtn);
    expect(useVisualStore.getState().isFrozen).toBe(true);
    expect(screen.getByText('ĐÃ KHÓA VX')).toBeInTheDocument();

    // Blackout toggle
    const blackoutBtn = screen.getByTestId('vx-panic-blackout');
    fireEvent.click(blackoutBtn);
    expect(useVisualStore.getState().isBlackout).toBe(true);

    // Clear VX
    const clearBtn = screen.getByTestId('vx-panic-clear');
    fireEvent.click(clearBtn);
    expect(useVisualStore.getState().activeLayers.slide).toBe(false);
    expect(useVisualStore.getState().activeLayers.background).toBe(false);
  });

  it('displays active cue HUD information when cue is active', () => {
    useShowStore.setState({
      show: {
        ...useShowStore.getState().show,
        acts: [
          {
            id: 'act-1',
            title: 'Act 1',
            order: 1,
            cues: [
              {
                id: 'cue-1',
                actId: 'act-1',
                cueNumber: '101',
                title: 'Grand Entrance',
                status: 'Go',
                durationMs: 30000,
                totalLightingFixtures: 8,
                totalScreens: 1,
                departments: {
                  lx: {
                    sceneName: 'Amber Glow',
                    intensity: 90,
                    colorPreset: '#f59e0b',
                    fixtureCount: 8,
                  },
                },
              },
            ],
          },
        ],
      },
      activeCueId: 'cue-1',
      standbyCueId: null,
    });

    render(<Stage3DView rendererFactory={mockControls.rendererFactory} />);

    expect(screen.getByText('Cue #101')).toBeTruthy();
    expect(screen.getAllByText('Grand Entrance').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/LX: Amber Glow/i)).toBeTruthy();
  });

  it('renders fallback UI when WebGL is unavailable', () => {
    // Override getContext to return null
    HTMLCanvasElement.prototype.getContext = () => null;

    render(<Stage3DView />);

    expect(screen.getByTestId('webgl-fallback')).toBeTruthy();
    expect(screen.getByText(/Chế độ Fallback Sân Khấu 3D/i)).toBeTruthy();
    expect(screen.getByTestId('stage-footer')).toBeTruthy();
    expect(screen.getByTestId('stage-3d-floating-pill')).toBeTruthy();
    expect(screen.getByTestId('vx-floating-dock')).toBeTruthy();
  });
});
