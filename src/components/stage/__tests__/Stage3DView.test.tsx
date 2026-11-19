import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Stage3DView } from '../Stage3DView';
import { setupWebGLMock, WebGLMockControls } from '../../../__tests__/helpers/mockWebGL';
import { useStageStore } from '../../../store/useStageStore';
import { useShowStore } from '../../../store/useShowStore';
import { STAGE_PRESETS } from '../../../types/virtualStage';

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
  });

  afterEach(() => {
    mockControls.restore();
    vi.restoreAllMocks();
  });

  it('renders 3D toolbar with 3 camera presets and footer', () => {
    render(<Stage3DView rendererFactory={mockControls.rendererFactory} />);

    expect(screen.getByTestId('preset-foh')).toBeTruthy();
    expect(screen.getByTestId('preset-topdown')).toBeTruthy();
    expect(screen.getByTestId('preset-backstage')).toBeTruthy();

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

  it('toggles haze and changes dimmer curve', () => {
    render(<Stage3DView rendererFactory={mockControls.rendererFactory} />);

    const hazeBtn = screen.getByTitle(/Công tắc khói sân khấu/i);
    expect(hazeBtn.textContent).toContain('Haze: ON');

    fireEvent.click(hazeBtn);
    expect(hazeBtn.textContent).toContain('Haze: OFF');

    const dimmerSelect = screen.getByTitle(/Đường cong dimmer quang học/i) as HTMLSelectElement;
    fireEvent.change(dimmerSelect, { target: { value: 'linear' } });
    expect(dimmerSelect.value).toBe('linear');
  });

  it('toggles beam threshold via pill', () => {
    render(<Stage3DView rendererFactory={mockControls.rendererFactory} initialBeamThreshold={150} />);

    const toggleBtn = screen.getByTestId('beam-threshold-toggle');
    expect(toggleBtn.textContent).toContain('150');

    fireEvent.click(toggleBtn);
    expect(toggleBtn.textContent).toContain('50');

    fireEvent.click(toggleBtn);
    expect(toggleBtn.textContent).toContain('150');
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
  });
});
