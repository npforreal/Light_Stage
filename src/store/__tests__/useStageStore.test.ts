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

  describe('editable rig (Đợt 10.2.3)', () => {
    it('adds, updates and removes screens', () => {
      const before = useStageStore.getState().config.screens.length;
      const id = useStageStore.getState().addScreen({ name: 'Side LED', widthMeters: 4 });
      expect(useStageStore.getState().config.screens).toHaveLength(before + 1);
      expect(useStageStore.getState().config.screens.at(-1)?.name).toBe('Side LED');

      useStageStore.getState().updateScreen(id, { xMeters: -8, enabled: false });
      const screen = useStageStore.getState().config.screens.find((s) => s.id === id);
      expect(screen?.xMeters).toBe(-8);
      expect(screen?.enabled).toBe(false);

      useStageStore.getState().removeScreen(id);
      expect(useStageStore.getState().config.screens).toHaveLength(before);
    });

    it('adds, updates and removes trusses with a rig position', () => {
      const before = useStageStore.getState().config.trusses.length;
      const id = useStageStore.getState().addTruss({ name: 'Mid Truss', position: 'Mid' });
      expect(useStageStore.getState().config.trusses).toHaveLength(before + 1);

      useStageStore.getState().updateTruss(id, { zMeters: 8, loadLimitWatts: 9000 });
      const truss = useStageStore.getState().config.trusses.find((t) => t.id === id);
      expect(truss?.position).toBe('Mid');
      expect(truss?.zMeters).toBe(8);
      expect(truss?.loadLimitWatts).toBe(9000);

      useStageStore.getState().removeTruss(id);
      expect(useStageStore.getState().config.trusses).toHaveLength(before);
    });

    it('adds, moves, updates and removes fixtures with sequential slots', () => {
      const before = useStageStore.getState().config.fixtures?.length ?? 0;
      const firstId = useStageStore.getState().addFixture({ type: 'Beam', x: -2, y: 4 });
      const secondId = useStageStore.getState().addFixture({ type: 'Wash', x: 3, y: 6 });
      const fixtures = useStageStore.getState().config.fixtures ?? [];
      expect(fixtures).toHaveLength(before + 2);

      const first = fixtures.find((f) => f.id === firstId)!;
      const second = fixtures.find((f) => f.id === secondId)!;
      expect(second.slot).toBe(first.slot + 1);

      useStageStore.getState().moveFixture(firstId, 1.5, 2.5, 6);
      const moved = useStageStore.getState().config.fixtures?.find((f) => f.id === firstId);
      expect(moved?.x).toBe(1.5);
      expect(moved?.y).toBe(2.5);
      expect(moved?.z).toBe(6);

      useStageStore.getState().updateFixture(firstId, { beamAngle: 36, position: 'FOH' });
      const updated = useStageStore.getState().config.fixtures?.find((f) => f.id === firstId);
      expect(updated?.beamAngle).toBe(36);
      expect(updated?.position).toBe('FOH');

      useStageStore.getState().removeFixture(secondId);
      expect(useStageStore.getState().config.fixtures?.some((f) => f.id === secondId)).toBe(false);
    });

    it('replaces the whole config via setConfig', () => {
      const config = JSON.parse(JSON.stringify(useStageStore.getState().config));
      config.widthMeters = 22;
      useStageStore.getState().setConfig(config);
      expect(useStageStore.getState().config.widthMeters).toBe(22);
    });
  });
});
