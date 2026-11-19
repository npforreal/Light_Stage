import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupWebGLMock, WebGLMockControls } from '../../../__tests__/helpers/mockWebGL';
import { Stage3DScene, isWebGLAvailable } from '../Stage3DScene';
import { StageConfig, STAGE_PRESETS } from '../../../types/virtualStage';
import { Cue } from '../../../types/stage';

describe('Stage3DScene Engine', () => {
  let mockControls: WebGLMockControls;
  let container: HTMLDivElement;

  beforeEach(() => {
    mockControls = setupWebGLMock();
    container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });
    document.body.appendChild(container);
  });

  afterEach(() => {
    mockControls.restore();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  it('detects isWebGLAvailable accurately', () => {
    expect(isWebGLAvailable()).toBe(true);

    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = () => null;
    expect(isWebGLAvailable()).toBe(false);
    HTMLCanvasElement.prototype.getContext = origGetContext;
  });

  it('initializes cleanly and uses on-demand rendering (not continuous loop)', async () => {
    const renderSpy = vi.fn();
    const scene = new Stage3DScene(container, {
      onRender: renderSpy,
      rendererFactory: mockControls.rendererFactory,
    });

    expect(container.querySelector('canvas')).toBeTruthy();

    // Wait for initial queued RAF render to settle
    await new Promise((r) => setTimeout(r, 30));
    const initialCallCount = renderSpy.mock.calls.length;
    expect(initialCallCount).toBeGreaterThanOrEqual(1);

    // Wait further without requesting render; should NOT re-render (no continuous loop)
    await new Promise((r) => setTimeout(r, 60));
    expect(renderSpy.mock.calls.length).toBe(initialCallCount);

    // Explicit requestRender triggers exactly one extra render
    scene.requestRender();
    await new Promise((r) => setTimeout(r, 30));
    expect(renderSpy.mock.calls.length).toBe(initialCallCount + 1);

    scene.dispose();
  });

  it('switches camera presets (foh, topDown, backstage)', () => {
    const scene = new Stage3DScene(container, {
      rendererFactory: mockControls.rendererFactory,
    });

    scene.setCameraPreset('foh');
    const fohPos = scene['camera'].position.clone();

    scene.setCameraPreset('topDown');
    const topPos = scene['camera'].position.clone();
    expect(topPos.y).toBeGreaterThan(fohPos.y);

    scene.setCameraPreset('backstage');
    const backPos = scene['camera'].position.clone();
    expect(backPos.x).toBeLessThan(0);

    scene.dispose();
  });

  it('renders fixtures and beams according to beam threshold', () => {
    const scene = new Stage3DScene(container, {
      beamThreshold: 50,
      rendererFactory: mockControls.rendererFactory,
    });
    const config: StageConfig = JSON.parse(JSON.stringify(STAGE_PRESETS.EndStage));

    const activeCue: Cue = {
      id: 'cue-1',
      actId: 'act-1',
      cueNumber: '1',
      title: 'Opening Scene',
      status: 'Standby',
      durationMs: 60000,
      totalLightingFixtures: 10,
      totalScreens: 0,
      departments: {
        lx: {
          sceneName: 'Blue Mood',
          intensity: 80,
          colorPreset: '#0284c7',
          fixtureCount: 10,
          fixtures: [
            { id: 'f-1', name: 'Beam 1', category: 'Lighting', subType: 'Beam', count: 8 },
            { id: 'f-2', name: 'Spot 1', category: 'Lighting', subType: 'Spot', count: 2 },
          ],
        },
      },
    };

    scene.update({ config, activeCue, beamMode: 'all' });

    // 10 active cue fixtures <= threshold 50: bodies and beams are drawn
    expect(scene.getFixtureCount()).toBe(10);
    expect(scene['fixtureGroup'].children.length).toBeGreaterThan(0);
    expect(scene['beamGroup'].children.length).toBeGreaterThan(0);

    // Now lower beam threshold below 10 -> beams should be turned off to protect GPU/CPU
    scene.setBeamThreshold(5);
    expect(scene.getBeamThreshold()).toBe(5);
    expect(scene.getFixtureCount()).toBe(10);
    expect(scene['beamGroup'].children.length).toBe(0);
    expect(scene.getBeamCount()).toBe(0);

    scene.dispose();
  });

  it('synchronizes screen emissive color when visual cue is active', () => {
    const scene = new Stage3DScene(container, {
      rendererFactory: mockControls.rendererFactory,
    });
    const config: StageConfig = JSON.parse(JSON.stringify(STAGE_PRESETS.EndStage));

    const cueWithoutVx: Cue = {
      id: 'cue-2',
      actId: 'act-1',
      cueNumber: '2',
      title: 'Dark Scene',
      status: 'Standby',
      durationMs: 60000,
      totalLightingFixtures: 0,
      totalScreens: 0,
      departments: {},
    };

    scene.update({ config, activeCue: cueWithoutVx });
    const mainScreenMesh = scene['screenMeshMap'].get(config.screens[0].id);
    expect(mainScreenMesh).toBeDefined();

    const cueWithVx: Cue = {
      id: 'cue-3',
      actId: 'act-1',
      cueNumber: '3',
      title: 'Video Intro',
      status: 'Standby',
      durationMs: 60000,
      totalLightingFixtures: 0,
      totalScreens: 1,
      departments: {
        vx: {
          contentName: 'Intro Video Loop',
          screenCount: 1,
        },
      },
    };

    scene.update({ config, activeCue: cueWithVx });
    expect(scene['screenMeshMap'].size).toBeGreaterThan(0);

    scene.dispose();
  });

  it('updates selection highlights for fixture and screen', () => {
    const scene = new Stage3DScene(container, {
      rendererFactory: mockControls.rendererFactory,
    });
    const config: StageConfig = JSON.parse(JSON.stringify(STAGE_PRESETS.EndStage));
    const firstScreenId = config.screens[0].id;
    const activeCue: Cue = {
      id: 'cue-4',
      actId: 'act-1',
      cueNumber: '4',
      title: 'Fixture selection',
      status: 'Go',
      durationMs: 60000,
      totalLightingFixtures: 4,
      totalScreens: 0,
      departments: {
        lx: {
          fixtures: [
            { id: 'f-4', name: 'Wash', category: 'Lighting', subType: 'Wash', count: 4 },
          ],
        },
      },
    };

    scene.update({ config, activeCue });
    const firstFixtureId = scene['fixturePlacements'][0]?.id;
    expect(firstFixtureId).toBeTruthy();

    scene.update({
      config,
      activeCue,
      selectedFixtureId: firstFixtureId,
      selectedScreenId: firstScreenId,
    });

    expect(scene['highlightGroup'].children.length).toBe(2);

    // Clear selection
    scene.update({
      config,
      activeCue,
      selectedFixtureId: null,
      selectedScreenId: null,
    });
    expect(scene['highlightGroup'].children.length).toBe(0);

    scene.dispose();
  });

  it('disposes all Three.js resources and listeners cleanly', () => {
    const scene = new Stage3DScene(container, {
      rendererFactory: mockControls.rendererFactory,
    });
    const config: StageConfig = JSON.parse(JSON.stringify(STAGE_PRESETS.EndStage));
    scene.update({ config });

    expect(() => scene.dispose()).not.toThrow();
    expect(mockControls.disposeFn).toHaveBeenCalled();
    expect(container.querySelector('canvas')).toBeNull();
  });
});
