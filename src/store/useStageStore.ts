import { create } from 'zustand';
import {
  StageConfig,
  StagePreset,
  CameraView,
  STAGE_PRESETS,
} from '../types/virtualStage';

export interface StageState {
  cameraView: CameraView;
  config: StageConfig;

  // Actions
  setCameraView: (view: CameraView) => void;
  applyPreset: (preset: StagePreset) => void;
  toggleScreen: (screenId: string) => void;
  toggleTruss: (trussId: string) => void;
  updateDimensions: (widthMeters: number, depthMeters: number) => void;
}

export const useStageStore = create<StageState>((set) => ({
  cameraView: 'front',
  config: STAGE_PRESETS.EndStage,

  setCameraView: (view: CameraView) => set({ cameraView: view }),

  applyPreset: (preset: StagePreset) => {
    const template = STAGE_PRESETS[preset];
    if (template) {
      set({ config: JSON.parse(JSON.stringify(template)) });
    }
  },

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
}));
