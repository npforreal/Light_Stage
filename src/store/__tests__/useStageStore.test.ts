import { describe, it, expect, beforeEach } from 'vitest';
import { useStageStore } from '../useStageStore';

describe('useStageStore', () => {
  beforeEach(() => {
    useStageStore.getState().applyPreset('EndStage');
    useStageStore.getState().setCameraView('front');
  });

  it('initializes with EndStage preset and front view', () => {
    const state = useStageStore.getState();
    expect(state.config.preset).toBe('EndStage');
    expect(state.cameraView).toBe('front');
    expect(state.config.screens.length).toBeGreaterThan(0);
    expect(state.config.trusses.length).toBeGreaterThan(0);
  });

  it('switches camera view', () => {
    useStageStore.getState().setCameraView('topDown');
    expect(useStageStore.getState().cameraView).toBe('topDown');

    useStageStore.getState().setCameraView('front');
    expect(useStageStore.getState().cameraView).toBe('front');
  });

  it('applies Festival and Thrust presets', () => {
    useStageStore.getState().applyPreset('Festival');
    expect(useStageStore.getState().config.preset).toBe('Festival');
    expect(useStageStore.getState().config.widthMeters).toBe(24);

    useStageStore.getState().applyPreset('Thrust');
    expect(useStageStore.getState().config.preset).toBe('Thrust');
    expect(useStageStore.getState().config.widthMeters).toBe(18);
  });

  it('toggles screen and truss enabled states', () => {
    const mainScreen = useStageStore.getState().config.screens[0];
    const initialEnabled = mainScreen.enabled;

    useStageStore.getState().toggleScreen(mainScreen.id);
    expect(useStageStore.getState().config.screens[0].enabled).toBe(!initialEnabled);

    const firstTruss = useStageStore.getState().config.trusses[0];
    const initialTruss = firstTruss.enabled;

    useStageStore.getState().toggleTruss(firstTruss.id);
    expect(useStageStore.getState().config.trusses[0].enabled).toBe(!initialTruss);
  });

  it('updates stage dimensions safely', () => {
    useStageStore.getState().updateDimensions(30, 20);
    expect(useStageStore.getState().config.widthMeters).toBe(30);
    expect(useStageStore.getState().config.depthMeters).toBe(20);
  });
});
