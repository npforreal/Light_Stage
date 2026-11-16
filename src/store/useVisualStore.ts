import { create } from 'zustand';
import {
  VxOutput,
  VxOutputStyle,
  VxTemplate,
  DEFAULT_VX_OUTPUTS,
  DEFAULT_VX_STYLES,
  DEFAULT_VX_TEMPLATES,
} from '../types/visual';

export interface VisualState {
  outputs: VxOutput[];
  styles: VxOutputStyle[];
  templates: VxTemplate[];

  // Panic / Live State
  isFrozen: boolean;
  isBlackout: boolean;
  activeLayers: {
    background: boolean;
    slide: boolean;
    overlay: boolean;
  };

  // Actions
  toggleFreezeVx: () => void;
  toggleBlackoutVx: () => void;
  toggleLayer: (layer: 'background' | 'slide' | 'overlay') => void;
  clearAllVx: () => void;
  clearLayer: (layer: 'background' | 'slide' | 'overlay') => void;

  // Management
  setOutputEnabled: (id: string, enabled: boolean) => void;
  updateOutput: (id: string, patch: Partial<VxOutput>) => void;
  addOutput: (output: VxOutput) => void;
  removeOutput: (id: string) => void;
  addStyle: (style: VxOutputStyle) => void;
  updateStyle: (id: string, patch: Partial<VxOutputStyle>) => void;

  // Selectors
  isVisualLive: () => boolean;
}

export const useVisualStore = create<VisualState>((set, get) => ({
  outputs: DEFAULT_VX_OUTPUTS,
  styles: DEFAULT_VX_STYLES,
  templates: DEFAULT_VX_TEMPLATES,

  isFrozen: false,
  isBlackout: false,
  activeLayers: {
    background: true,
    slide: true,
    overlay: true,
  },

  toggleFreezeVx: () => {
    set((state) => {
      const nextFrozen = !state.isFrozen;
      return {
        isFrozen: nextFrozen,
        outputs: state.outputs.map((out) => ({
          ...out,
          status: nextFrozen ? 'frozen' : state.isBlackout ? 'blackout' : 'active',
        })),
      };
    });
  },

  toggleBlackoutVx: () => {
    set((state) => {
      const nextBlackout = !state.isBlackout;
      return {
        isBlackout: nextBlackout,
        outputs: state.outputs.map((out) => ({
          ...out,
          status: nextBlackout ? 'blackout' : state.isFrozen ? 'frozen' : 'active',
        })),
      };
    });
  },

  toggleLayer: (layer) => {
    set((state) => ({
      activeLayers: {
        ...state.activeLayers,
        [layer]: !state.activeLayers[layer],
      },
    }));
  },

  clearLayer: (layer) => {
    set((state) => ({
      activeLayers: {
        ...state.activeLayers,
        [layer]: false,
      },
    }));
  },

  clearAllVx: () => {
    set({
      activeLayers: {
        background: false,
        slide: false,
        overlay: false,
      },
    });
  },

  setOutputEnabled: (id, enabled) => {
    set((state) => ({
      outputs: state.outputs.map((out) => (out.id === id ? { ...out, enabled } : out)),
    }));
  },

  updateOutput: (id, patch) => {
    set((state) => ({
      outputs: state.outputs.map((out) => (out.id === id ? { ...out, ...patch } : out)),
    }));
  },

  addOutput: (output) => {
    set((state) => ({
      outputs: [...state.outputs, output],
    }));
  },

  removeOutput: (id) => {
    set((state) => ({
      outputs: state.outputs.filter((out) => out.id !== id),
    }));
  },

  addStyle: (style) => {
    set((state) => ({
      styles: [...state.styles, style],
    }));
  },

  updateStyle: (id, patch) => {
    set((state) => ({
      styles: state.styles.map((st) => (st.id === id ? { ...st, ...patch } : st)),
    }));
  },

  isVisualLive: () => {
    const s = get();
    if (s.isBlackout) return false;
    return (
      (s.activeLayers.background || s.activeLayers.slide || s.activeLayers.overlay) &&
      s.outputs.some((o) => o.enabled)
    );
  },
}));
