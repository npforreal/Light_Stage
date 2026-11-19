import { create } from 'zustand';
import {
  StageConfig,
  StagePreset,
  CameraView,
  VirtualScreen,
  VirtualTruss,
  Fixture,
  RigPosition,
  FixtureType,
  STAGE_PRESETS,
} from '../types/virtualStage';

let idSequence = 0;
function nextId(prefix: string): string {
  idSequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSequence}`;
}

const DEFAULT_POSITION: RigPosition = 'Truss';

export interface StageState {
  cameraView: CameraView;
  config: StageConfig;
  selectedFixtureId: string | null;
  selectedScreenId: string | null;

  // Actions
  setCameraView: (view: CameraView) => void;
  applyPreset: (preset: StagePreset) => void;
  setConfig: (config: StageConfig) => void;
  toggleScreen: (screenId: string) => void;
  toggleTruss: (trussId: string) => void;
  updateDimensions: (widthMeters: number, depthMeters: number) => void;
  selectFixture: (fixtureId: string | null) => void;
  selectScreen: (screenId: string | null) => void;

  // Editable rig (Đợt 10.2.3)
  addScreen: (partial?: Partial<VirtualScreen>) => string;
  updateScreen: (screenId: string, patch: Partial<VirtualScreen>) => void;
  removeScreen: (screenId: string) => void;

  addTruss: (partial?: Partial<VirtualTruss>) => string;
  updateTruss: (trussId: string, patch: Partial<VirtualTruss>) => void;
  removeTruss: (trussId: string) => void;

  addFixture: (partial?: Partial<Fixture>) => string;
  updateFixture: (fixtureId: string, patch: Partial<Fixture>) => void;
  removeFixture: (fixtureId: string) => void;
  moveFixture: (fixtureId: string, x: number, y: number, z?: number) => void;
}

function withFixtures(config: StageConfig, fixtures: Fixture[]): StageConfig {
  return { ...config, fixtures };
}

export const useStageStore = create<StageState>((set) => ({
  cameraView: 'front',
  config: STAGE_PRESETS.EndStage,
  selectedFixtureId: null,
  selectedScreenId: null,

  setCameraView: (view: CameraView) => set({ cameraView: view }),
  selectFixture: (id: string | null) => set({ selectedFixtureId: id, selectedScreenId: null }),
  selectScreen: (id: string | null) => set({ selectedScreenId: id, selectedFixtureId: null }),

  applyPreset: (preset: StagePreset) => {
    const template = STAGE_PRESETS[preset];
    if (template) {
      set({ config: JSON.parse(JSON.stringify(template)) });
    }
  },

  setConfig: (config: StageConfig) => set({ config }),

  toggleScreen: (screenId: string) => {
    set((state) => ({
      config: {
        ...state.config,
        screens: state.config.screens.map((scr) =>
          scr.id === screenId ? { ...scr, enabled: !scr.enabled } : scr
        ),
      },
    }));
  },

  toggleTruss: (trussId: string) => {
    set((state) => ({
      config: {
        ...state.config,
        trusses: state.config.trusses.map((truss) =>
          truss.id === trussId ? { ...truss, enabled: !truss.enabled } : truss
        ),
      },
    }));
  },

  updateDimensions: (widthMeters: number, depthMeters: number) => {
    set((state) => ({
      config: {
        ...state.config,
        widthMeters: Math.max(5, widthMeters),
        depthMeters: Math.max(5, depthMeters),
      },
    }));
  },

  addScreen: (partial: Partial<VirtualScreen> = {}) => {
    const id = nextId('screen');
    set((state) => ({
      config: {
        ...state.config,
        screens: [
          ...state.config.screens,
          {
            id,
            name: partial.name || `LED ${state.config.screens.length + 1}`,
            type: partial.type || 'Main',
            x: partial.x ?? 50,
            y: partial.y ?? 30,
            width: partial.width ?? 30,
            height: partial.height ?? 20,
            enabled: partial.enabled ?? true,
            xMeters: partial.xMeters ?? 0,
            yMeters: partial.yMeters ?? 6,
            zMeters: partial.zMeters ?? 1,
            widthMeters: partial.widthMeters ?? 6,
            heightMeters: partial.heightMeters ?? 3,
          },
        ],
      },
    }));
    return id;
  },

  updateScreen: (screenId: string, patch: Partial<VirtualScreen>) => {
    set((state) => ({
      config: {
        ...state.config,
        screens: state.config.screens.map((scr) =>
          scr.id === screenId ? { ...scr, ...patch } : scr
        ),
      },
    }));
  },

  removeScreen: (screenId: string) => {
    set((state) => ({
      config: {
        ...state.config,
        screens: state.config.screens.filter((scr) => scr.id !== screenId),
      },
    }));
  },

  addTruss: (partial: Partial<VirtualTruss> = {}) => {
    const id = nextId('truss');
    set((state) => ({
      config: {
        ...state.config,
        trusses: [
          ...state.config.trusses,
          {
            id,
            name: partial.name || `Truss ${state.config.trusses.length + 1}`,
            position: partial.position || DEFAULT_POSITION,
            fixtureType: partial.fixtureType || 'Wash',
            fixtureCount: partial.fixtureCount ?? 6,
            x: partial.x ?? 50,
            y: partial.y ?? 20,
            width: partial.width ?? 60,
            enabled: partial.enabled ?? true,
            xMeters: partial.xMeters ?? 0,
            yMeters: partial.yMeters ?? 5,
            zMeters: partial.zMeters ?? 7,
            widthMeters: partial.widthMeters ?? 12,
            loadLimitWatts: partial.loadLimitWatts ?? 12000,
          },
        ],
      },
    }));
    return id;
  },

  updateTruss: (trussId: string, patch: Partial<VirtualTruss>) => {
    set((state) => ({
      config: {
        ...state.config,
        trusses: state.config.trusses.map((truss) =>
          truss.id === trussId ? { ...truss, ...patch } : truss
        ),
      },
    }));
  },

  removeTruss: (trussId: string) => {
    set((state) => ({
      config: {
        ...state.config,
        trusses: state.config.trusses.filter((truss) => truss.id !== trussId),
      },
    }));
  },

  addFixture: (partial: Partial<Fixture> = {}) => {
    const id = nextId('fixture');
    set((state) => {
      const fixtures = state.config.fixtures ?? [];
      const nextSlot =
        fixtures.reduce((max, fixture) => Math.max(max, fixture.slot || 0), 0) + 1;
      const type: FixtureType = (partial.type as FixtureType) || 'Wash';
      const fixture: Fixture = {
        id,
        type,
        position: partial.position || DEFAULT_POSITION,
        slot: partial.slot ?? nextSlot,
        x: partial.x ?? 0,
        y: partial.y ?? 5,
        z: partial.z ?? 7,
        beamAngle: partial.beamAngle ?? 25,
        loadWatts: partial.loadWatts ?? 500,
        role: partial.role || 'wash',
        aim: partial.aim || { elevation: -60, azimuth: 0, targetZone: 'C' },
        enabled: partial.enabled ?? true,
      };
      return { config: withFixtures(state.config, [...fixtures, fixture]) };
    });
    return id;
  },

  updateFixture: (fixtureId: string, patch: Partial<Fixture>) => {
    set((state) => ({
      config: withFixtures(
        state.config,
        (state.config.fixtures ?? []).map((fixture) =>
          fixture.id === fixtureId ? { ...fixture, ...patch } : fixture
        )
      ),
    }));
  },

  removeFixture: (fixtureId: string) => {
    set((state) => ({
      config: withFixtures(
        state.config,
        (state.config.fixtures ?? []).filter((fixture) => fixture.id !== fixtureId)
      ),
    }));
  },

  moveFixture: (fixtureId: string, x: number, y: number, z?: number) => {
    set((state) => ({
      config: withFixtures(
        state.config,
        (state.config.fixtures ?? []).map((fixture) =>
          fixture.id === fixtureId
            ? { ...fixture, x, y, z: z ?? fixture.z }
            : fixture
        )
      ),
    }));
  },
}));
