import { create } from 'zustand';
import { useClockStore } from './useClockStore';
import {
  Show,
  Cue,
  Act,
  ShowMetadata,
  ShowSettings,
  createDefaultShow,
  createCue,
  calculateCueDeviceCounts,
} from '../types/stage';
import { normalizeCue, normalizeShow } from '../services/fixtureModel';
import { isKeyboardProtected } from '../services/shortcutRegistry';

export interface DeviceStats {
  totalLightingFixtures: number;
  totalScreens: number;
  peakLighting: number;
  peakScreens: number;
}

export interface ShowState {
  show: Show;
  isDirty: boolean;
  activeCueId: string | null;
  standbyCueId: string | null;
  selectedCueId: string | null;
  isInspectorOpen: boolean;
  isOperatorLocked: boolean;
  /** Human-readable reason the last autosave failed; null when saving works. */
  autosaveError: string | null;

  // History / Undo / Redo
  past: Show[];
  future: Show[];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // Operator Lock Action
  setOperatorLocked: (locked: boolean) => void;
  setAutosaveError: (message: string | null) => void;

  // Inspector & Selection Actions
  selectCue: (cueId: string | null) => void;
  toggleInspector: () => void;
  setInspectorOpen: (open: boolean) => void;

  // Show Actions
  loadShow: (show: Show) => void;
  appendActs: (acts: Act[]) => void;
  newShow: (title?: string) => void;
  updateMetadata: (patch: Partial<ShowMetadata>) => void;
  updateSettings: (patch: Partial<ShowSettings>) => void;
  markSaved: () => void;

  // Act Actions
  addAct: (title: string) => string;
  updateAct: (actId: string, patch: Partial<Omit<Act, 'id' | 'cues'>>) => void;
  deleteAct: (actId: string) => void;

  // Cue Actions
  addCue: (actId: string, cueData?: Partial<Cue>, afterCueId?: string) => string;
  updateCue: (cueId: string, patch: Partial<Cue>) => void;
  deleteCue: (cueId: string) => void;
  reorderCues: (actId: string, cueIds: string[]) => void;

  // State Machine / Playback Actions
  standbyCue: (cueId: string) => void;
  goCue: (cueId?: string) => void;
  goNextCue: () => void;
  holdCue: (cueId?: string) => void;
  skipCue: (cueId: string) => void;
  resetCue: (cueId: string) => void;
  resetAllCues: () => void;
  nextCue: () => void;
  prevCue: () => void;

  // Selectors
  getAllCues: () => Cue[];
  getCueById: (cueId: string) => Cue | undefined;
  getActiveCue: () => Cue | undefined;
  getStandbyCue: () => Cue | undefined;
  getSelectedCue: () => Cue | undefined;
  getDeviceStats: () => DeviceStats;
}

function cloneShow(show: Show): Show {
  return typeof structuredClone === 'function'
    ? structuredClone(show)
    : JSON.parse(JSON.stringify(show));
}

function pushHistory(state: { past: Show[]; future: Show[]; show: Show }): {
  past: Show[];
  future: Show[];
  canUndo: boolean;
  canRedo: boolean;
} {
  const nextPast = [...state.past, cloneShow(state.show)].slice(-30);
  return {
    past: nextPast,
    future: [],
    canUndo: true,
    canRedo: false,
  };
}

export const useShowStore = create<ShowState>((set, get) => {
  const initialShow = createDefaultShow();
  const initialCues = initialShow.acts[0]?.cues ?? [];
  const initialStandby = initialCues.length > 0 ? initialCues[0].id : null;

  return {
    show: initialShow,
    isDirty: false,
    activeCueId: null,
    standbyCueId: initialStandby,
    selectedCueId: null,
    isInspectorOpen: false,
    isOperatorLocked: false,
    autosaveError: null,
    setOperatorLocked: (locked: boolean) => set({ isOperatorLocked: locked }),
    setAutosaveError: (message: string | null) => set({ autosaveError: message }),
    selectCue: (cueId: string | null) =>
      set({
        selectedCueId: cueId,
        ...(cueId !== null ? { isInspectorOpen: true } : {}),
      }),
    toggleInspector: () => set((state) => ({ isInspectorOpen: !state.isInspectorOpen })),
    setInspectorOpen: (open: boolean) => set({ isInspectorOpen: open }),
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,

    undo: () => {
      set((state) => {
        if (state.past.length === 0) return state;
        const previousShow = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, -1);
        const newFuture = [cloneShow(state.show), ...state.future].slice(0, 30);
        const allCues = previousShow.acts.flatMap((a) => a.cues);
        const activeValid = allCues.some((c) => c.id === state.activeCueId);
        const standbyValid = allCues.some((c) => c.id === state.standbyCueId);

        return {
          show: previousShow,
          past: newPast,
          future: newFuture,
          canUndo: newPast.length > 0,
          canRedo: true,
          isDirty: true,
          activeCueId: activeValid ? state.activeCueId : null,
          standbyCueId: standbyValid ? state.standbyCueId : (allCues[0]?.id ?? null),
        };
      });
    },

    redo: () => {
      set((state) => {
        if (state.future.length === 0) return state;
        const nextShow = state.future[0];
        const newFuture = state.future.slice(1);
        const newPast = [...state.past, cloneShow(state.show)].slice(-30);
        const allCues = nextShow.acts.flatMap((a) => a.cues);
        const activeValid = allCues.some((c) => c.id === state.activeCueId);
        const standbyValid = allCues.some((c) => c.id === state.standbyCueId);

        return {
          show: nextShow,
          past: newPast,
          future: newFuture,
          canUndo: true,
          canRedo: newFuture.length > 0,
          isDirty: true,
          activeCueId: activeValid ? state.activeCueId : null,
          standbyCueId: standbyValid ? state.standbyCueId : (allCues[0]?.id ?? null),
        };
      });
    },

    loadShow: (show: Show) => {
      const normalizedShow = normalizeShow(show);
      const allCues = normalizedShow.acts.flatMap((a) => a.cues);
      const standby = allCues.find((c) => c.status === 'Standby')?.id || (allCues[0]?.id ?? null);
      const active = allCues.find((c) => c.status === 'Go')?.id ?? null;

      set({
        show: normalizedShow,
        isDirty: false,
        activeCueId: active,
        standbyCueId: standby,
        selectedCueId: null,
        isInspectorOpen: false,
        isOperatorLocked: false,
        autosaveError: null,
        past: [],
        future: [],
        canUndo: false,
        canRedo: false,
      });
    },

    appendActs: (newActs: Act[]) => {
      set((state) => {
        const history = pushHistory(state);
        const existingCount = state.show.acts.length;
        const normalized = newActs.map((act, index) => ({
          ...act,
          order: existingCount + index + 1,
          cues: act.cues.map(normalizeCue),
        }));
        return {
          ...history,
          isDirty: true,
          show: {
            ...state.show,
            acts: [...state.show.acts, ...normalized],
            metadata: {
              ...state.show.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    },

    newShow: (title?: string) => {
      const show = createDefaultShow(title);
      const firstCueId = show.acts[0]?.cues[0]?.id ?? null;
      set({
        show,
        isDirty: true,
        activeCueId: null,
        standbyCueId: firstCueId,
        selectedCueId: null,
        isInspectorOpen: false,
        isOperatorLocked: false,
        autosaveError: null,
        past: [],
        future: [],
        canUndo: false,
        canRedo: false,
      });
    },

    updateMetadata: (patch: Partial<ShowMetadata>) => {
      set((state) => ({
        ...pushHistory(state),
        isDirty: true,
        show: {
          ...state.show,
          metadata: {
            ...state.show.metadata,
            ...patch,
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    },

    updateSettings: (patch: Partial<ShowSettings>) => {
      set((state) => ({
        ...pushHistory(state),
        isDirty: true,
        show: {
          ...state.show,
          settings: {
            ...state.show.settings,
            ...patch,
          },
        },
      }));
    },

    markSaved: () => set({ isDirty: false }),

    addAct: (title: string) => {
      const newActId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      set((state) => {
        const order = state.show.acts.length + 1;
        const newAct: Act = {
          id: newActId,
          title,
          order,
          cues: [],
        };
        return {
          ...pushHistory(state),
          isDirty: true,
          show: {
            ...state.show,
            acts: [...state.show.acts, newAct],
          },
        };
      });
      return newActId;
    },

    updateAct: (actId: string, patch: Partial<Omit<Act, 'id' | 'cues'>>) => {
      set((state) => ({
        ...pushHistory(state),
        isDirty: true,
        show: {
          ...state.show,
          acts: state.show.acts.map((act) =>
            act.id === actId ? { ...act, ...patch } : act
          ),
        },
      }));
    },

    deleteAct: (actId: string) => {
      set((state) => {
        const remainingActs = state.show.acts.filter((act) => act.id !== actId);
        const allRemainingCues = remainingActs.flatMap((a) => a.cues);
        const activeStillExists = allRemainingCues.some((c) => c.id === state.activeCueId);
        const standbyStillExists = allRemainingCues.some((c) => c.id === state.standbyCueId);

        return {
          ...pushHistory(state),
          isDirty: true,
          show: {
            ...state.show,
            acts: remainingActs,
          },
          activeCueId: activeStillExists ? state.activeCueId : null,
          standbyCueId: standbyStillExists ? state.standbyCueId : (allRemainingCues[0]?.id ?? null),
        };
      });
    },

    addCue: (actId: string, cueData?: Partial<Cue>, afterCueId?: string) => {
      const state = get();
      const allExistingCues = state.getAllCues();
      const targetAct = state.show.acts.find((a) => a.id === actId);
      const actOrder = targetAct ? targetAct.order : 1;
      const existingActCues = targetAct ? targetAct.cues : [];

      let computedNumber = cueData?.cueNumber;
      if (!computedNumber) {
        // Auto-increment cue number (1.0, 2.0...) ensuring no collisions
        let nextNum = existingActCues.reduce((max, c) => {
          const parsed = parseFloat(c.cueNumber);
          return !isNaN(parsed) && parsed > max ? parsed : max;
        }, 0);
        nextNum = nextNum > 0 ? nextNum + 1.0 : actOrder * 1.0;
        computedNumber = nextNum.toFixed(1);

        // Guard against any collisions across the entire show
        let counter = 1;
        while (allExistingCues.some((c) => c.cueNumber === computedNumber)) {
          computedNumber = (nextNum + counter * 0.1).toFixed(1);
          counter++;
        }
      } else {
        // Warn if user provides a duplicate cue number
        const isDuplicate = allExistingCues.some((c) => c.cueNumber === computedNumber);
        if (isDuplicate) {
          console.warn(`[LightStage] Duplicate cue number "${computedNumber}" detected in show.`);
        }
      }

      const newCueTitle = cueData?.title || 'New Cue';
      const created = createCue(
        actId,
        computedNumber,
        newCueTitle,
        cueData?.durationMs ?? 60000,
        cueData?.departments ?? {}
      );
      const cueToInsert: Cue = normalizeCue({
        ...created,
        ...cueData,
        cueNumber: computedNumber,
        id: created.id,
      });

      set((state) => {
        const history = pushHistory(state);
        const updatedActs = state.show.acts.map((act) => {
          if (act.id !== actId) return act;
          if (!afterCueId) {
            return { ...act, cues: [...act.cues, cueToInsert] };
          }
          const index = act.cues.findIndex((c) => c.id === afterCueId);
          if (index === -1) {
            return { ...act, cues: [...act.cues, cueToInsert] };
          }
          const nextCues = [...act.cues];
          nextCues.splice(index + 1, 0, cueToInsert);
          return { ...act, cues: nextCues };
        });

        return {
          ...history,
          isDirty: true,
          show: {
            ...state.show,
            acts: updatedActs,
          },
          standbyCueId: state.standbyCueId ? state.standbyCueId : cueToInsert.id,
        };
      });

      return cueToInsert.id;
    },

    updateCue: (cueId: string, patch: Partial<Cue>) => {
      set((state) => {
        const history = pushHistory(state);
        const updatedActs = state.show.acts.map((act) => ({
          ...act,
          cues: act.cues.map((cue) => {
            if (cue.id !== cueId) return cue;
            const updated = { ...cue, ...patch };
            if (patch.departments) {
              return normalizeCue(updated);
            }
            const counts = calculateCueDeviceCounts(updated.departments);
            updated.totalLightingFixtures = counts.lightingCount;
            updated.totalScreens = counts.screenCount;
            return updated;
          }),
        }));

        return {
          ...history,
          isDirty: true,
          show: {
            ...state.show,
            acts: updatedActs,
          },
        };
      });
    },

    deleteCue: (cueId: string) => {
      set((state) => {
        const history = pushHistory(state);
        const updatedActs = state.show.acts.map((act) => ({
          ...act,
          cues: act.cues.filter((c) => c.id !== cueId),
        }));
        const allRemaining = updatedActs.flatMap((a) => a.cues);

        return {
          ...history,
          isDirty: true,
          show: {
            ...state.show,
            acts: updatedActs,
          },
          activeCueId: state.activeCueId === cueId ? null : state.activeCueId,
          standbyCueId:
            state.standbyCueId === cueId
              ? (allRemaining[0]?.id ?? null)
              : state.standbyCueId,
          selectedCueId: state.selectedCueId === cueId ? null : state.selectedCueId,
        };
      });
    },

    reorderCues: (actId: string, cueIds: string[]) => {
      set((state) => {
        const history = pushHistory(state);
        const updatedActs = state.show.acts.map((act) => {
          if (act.id !== actId) return act;
          const cueMap = new Map(act.cues.map((c) => [c.id, c]));
          const reordered = cueIds
            .map((id) => cueMap.get(id))
            .filter((c): c is Cue => Boolean(c));
          return { ...act, cues: reordered };
        });

        return {
          ...history,
          isDirty: true,
          show: {
            ...state.show,
            acts: updatedActs,
          },
        };
      });
    },

    standbyCue: (cueId: string) => {
      const state = get();
      // Operator Lock: only blocks cue commands (see PLAN 16.1). Viewing/clock/save stay live.
      if (state.isOperatorLocked) return;
      const allCues = state.getAllCues();
      const targetCue = allCues.find((c) => c.id === cueId);
      if (!targetCue) return;

      const updatedActs = state.show.acts.map((act) => ({
        ...act,
        cues: act.cues.map((cue) => {
          if (cue.id === cueId) {
            return { ...cue, status: 'Standby' as const };
          }
          // Revert old standby cue if it was Standby and not active
          if (cue.id === state.standbyCueId && cue.status === 'Standby') {
            return { ...cue, status: 'Pending' as const };
          }
          return cue;
        }),
      }));

      set({
        show: { ...state.show, acts: updatedActs },
        standbyCueId: cueId,
      });
    },

    goCue: (cueId?: string) => {
      const state = get();
      if (state.isOperatorLocked) return;
      const allCues = state.getAllCues();
      if (allCues.length === 0) return;

      // Determine cue to fire
      let targetId = cueId || state.standbyCueId;
      if (!targetId) {
        const nextPending = allCues.find((c) => c.status === 'Pending' || c.status === 'Standby');
        targetId = nextPending?.id || allCues[0]?.id;
      }
      if (!targetId) return;

      const targetIndex = allCues.findIndex((c) => c.id === targetId);
      if (targetIndex === -1) return;

      const targetCue = allCues[targetIndex];

      // Centralized clock synchronization: set duration and start clock
      useClockStore.getState().syncCueDuration(targetCue.durationMs, true);
      useClockStore.getState().startClock();

      // Determine next standby cue if autoStandbyNext is enabled
      let nextStandbyId: string | null = null;
      if (state.show.settings.autoStandbyNext) {
        for (let i = targetIndex + 1; i < allCues.length; i++) {
          const candidate = allCues[i];
          if (candidate.status !== 'Skip') {
            nextStandbyId = candidate.id;
            break;
          }
        }
      }

      const updatedActs = state.show.acts.map((act) => ({
        ...act,
        cues: act.cues.map((cue) => {
          // If this was the previous active cue (running 'Go' or 'Hold'), complete it
          if (cue.id === state.activeCueId && cue.id !== targetId) {
            if (cue.status === 'Go' || cue.status === 'Hold') {
              return { ...cue, status: 'Completed' as const };
            }
          }

          // Target cue becomes Go
          if (cue.id === targetId) {
            return { ...cue, status: 'Go' as const };
          }

          // Next standby cue
          if (nextStandbyId && cue.id === nextStandbyId) {
            return { ...cue, status: 'Standby' as const };
          }

          // If a cue was marked standby previously but is not nextStandby, revert to pending
          if (cue.id === state.standbyCueId && cue.id !== nextStandbyId && cue.status === 'Standby') {
            return { ...cue, status: 'Pending' as const };
          }

          return cue;
        }),
      }));

      set({
        show: { ...state.show, acts: updatedActs },
        activeCueId: targetId,
        standbyCueId: nextStandbyId,
      });
    },

    goNextCue: () => {
      const state = get();
      const allCues = state.getAllCues();
      if (allCues.length === 0) return;

      if (state.standbyCueId) {
        state.goCue(state.standbyCueId);
        return;
      }

      if (state.activeCueId) {
        const currentIndex = allCues.findIndex((c) => c.id === state.activeCueId);
        if (currentIndex !== -1 && currentIndex < allCues.length - 1) {
          state.goCue(allCues[currentIndex + 1].id);
          return;
        }
      }

      state.goCue();
    },

    holdCue: (cueId?: string) => {
      const state = get();
      if (state.isOperatorLocked) return;
      const targetId = cueId || state.activeCueId;
      if (!targetId) return;

      const updatedActs = state.show.acts.map((act) => ({
        ...act,
        cues: act.cues.map((cue) =>
          cue.id === targetId ? { ...cue, status: 'Hold' as const } : cue
        ),
      }));

      useClockStore.getState().pauseClock();

      set({
        show: { ...state.show, acts: updatedActs },
      });
    },

    skipCue: (cueId: string) => {
      const state = get();
      const allCues = state.getAllCues();
      const currentIndex = allCues.findIndex((c) => c.id === cueId);
      if (currentIndex === -1) return;

      let nextStandby = state.standbyCueId;
      if (state.standbyCueId === cueId) {
        // Advance standby to next available cue
        const candidate = allCues.slice(currentIndex + 1).find((c) => c.status !== 'Skip' && c.id !== cueId);
        nextStandby = candidate ? candidate.id : null;
      }

      const updatedActs = state.show.acts.map((act) => ({
        ...act,
        cues: act.cues.map((cue) => {
          if (cue.id === cueId) {
            return { ...cue, status: 'Skip' as const };
          }
          if (nextStandby && cue.id === nextStandby) {
            return { ...cue, status: 'Standby' as const };
          }
          return cue;
        }),
      }));

      set({
        show: { ...state.show, acts: updatedActs },
        standbyCueId: nextStandby,
      });
    },

    resetCue: (cueId: string) => {
      const state = get();
      const updatedActs = state.show.acts.map((act) => ({
        ...act,
        cues: act.cues.map((cue) =>
          cue.id === cueId ? { ...cue, status: 'Pending' as const } : cue
        ),
      }));

      set({
        show: { ...state.show, acts: updatedActs },
        activeCueId: state.activeCueId === cueId ? null : state.activeCueId,
        standbyCueId: state.standbyCueId === cueId ? null : state.standbyCueId,
      });
    },

    resetAllCues: () => {
      const state = get();
      const allCues = state.getAllCues();
      const firstCueId = allCues[0]?.id ?? null;

      const updatedActs = state.show.acts.map((act) => ({
        ...act,
        cues: act.cues.map((cue, idx) => ({
          ...cue,
          // First cue set to Standby, rest to Pending
          status: idx === 0 && act === state.show.acts[0] ? ('Standby' as const) : ('Pending' as const),
        })),
      }));

      set({
        show: { ...state.show, acts: updatedActs },
        activeCueId: null,
        standbyCueId: firstCueId,
      });
    },

    nextCue: () => {
      const state = get();
      if (state.isOperatorLocked) return;
      const allCues = state.getAllCues();
      if (allCues.length === 0) return;

      const currentIndex = state.standbyCueId
        ? allCues.findIndex((c) => c.id === state.standbyCueId)
        : -1;

      if (currentIndex < allCues.length - 1) {
        state.standbyCue(allCues[currentIndex + 1].id);
      }
    },

    prevCue: () => {
      const state = get();
      if (state.isOperatorLocked) return;
      const allCues = state.getAllCues();
      if (allCues.length === 0) return;

      const currentIndex = state.standbyCueId
        ? allCues.findIndex((c) => c.id === state.standbyCueId)
        : allCues.length;

      if (currentIndex > 0) {
        state.standbyCue(allCues[currentIndex - 1].id);
      }
    },

    getAllCues: () => {
      return get().show.acts.flatMap((a) => a.cues);
    },

    getCueById: (cueId: string) => {
      return get().getAllCues().find((c) => c.id === cueId);
    },

    getActiveCue: () => {
      const { activeCueId } = get();
      return activeCueId ? get().getCueById(activeCueId) : undefined;
    },

    getStandbyCue: () => {
      const { standbyCueId } = get();
      return standbyCueId ? get().getCueById(standbyCueId) : undefined;
    },

    getSelectedCue: () => {
      const { selectedCueId } = get();
      return selectedCueId ? get().getCueById(selectedCueId) : undefined;
    },

    getDeviceStats: () => {
      const cues = get().getAllCues();
      let totalLighting = 0;
      let totalScreens = 0;
      let peakLighting = 0;
      let peakScreens = 0;

      for (const cue of cues) {
        const counts = calculateCueDeviceCounts(cue.departments);
        totalLighting += counts.lightingCount;
        totalScreens += counts.screenCount;
        if (counts.lightingCount > peakLighting) {
          peakLighting = counts.lightingCount;
        }
        if (counts.screenCount > peakScreens) {
          peakScreens = counts.screenCount;
        }
      }

      return {
        totalLightingFixtures: totalLighting,
        totalScreens,
        peakLighting,
        peakScreens,
      };
    },
  };
});

export interface GlobalShortcutOptions {
  onSave?: () => void;
}

/**
 * Global Keyboard Shortcut Handler
 * Supports:
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y / Cmd+Y: Redo
 * - Ctrl+S / Cmd+S: Save (delegates to options.onSave, no fake "saved" state)
 *
 * Operator Lock intentionally does NOT block this handler: it only manages
 * undo/redo/save, which are not cue commands (PLAN 16.1).
 */
export function handleGlobalKeyDown(e: KeyboardEvent, options?: GlobalShortcutOptions): boolean {
  const isCtrlOrCmd = e.ctrlKey || e.metaKey;
  if (!isCtrlOrCmd) return false;

  const key = e.key.toLowerCase();

  // Allow browser native undo/redo when typing inside an editable target (input/textarea)
  if (isKeyboardProtected(e) && key !== 's') {
    return false;
  }

  // Undo: Ctrl+Z / Cmd+Z (without Shift)
  if (key === 'z' && !e.shiftKey) {
    e.preventDefault();
    const store = useShowStore.getState();
    if (store.canUndo) {
      store.undo();
      return true;
    }
    return false;
  }

  // Redo: Ctrl+Shift+Z / Cmd+Shift+Z OR Ctrl+Y / Cmd+Y
  if ((key === 'z' && e.shiftKey) || (key === 'y' && !e.shiftKey)) {
    e.preventDefault();
    const store = useShowStore.getState();
    if (store.canRedo) {
      store.redo();
      return true;
    }
    return false;
  }

  // Save: Ctrl+S / Cmd+S
  if (key === 's') {
    e.preventDefault();
    if (options?.onSave) {
      options.onSave();
      return true;
    }
    // No saver wired: never pretend the project was saved.
    return false;
  }

  return false;
}

export function attachGlobalShortcuts(
  target: EventTarget = window,
  options?: GlobalShortcutOptions
): () => void {
  const listener = (event: Event) => {
    handleGlobalKeyDown(event as KeyboardEvent, options);
  };

  target.addEventListener('keydown', listener);
  return () => {
    target.removeEventListener('keydown', listener);
  };
}

// Note: the app wires the shortcut once, with a real save handler, in App.tsx.
// Auto-attaching here without `onSave` used to fake `markSaved()` on Ctrl+S
// (PLAN 16.2), so it is intentionally removed.
