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
  getDeviceStats: () => DeviceStats;
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

    loadShow: (show: Show) => {
      const allCues = show.acts.flatMap((a) => a.cues);
      const standby = allCues.find((c) => c.status === 'Standby')?.id || (allCues[0]?.id ?? null);
      const active = allCues.find((c) => c.status === 'Go')?.id ?? null;

      set({
        show,
        isDirty: false,
        activeCueId: active,
        standbyCueId: standby,
      });
    },

    appendActs: (newActs: Act[]) => {
      set((state) => {
        const existingCount = state.show.acts.length;
        const normalized = newActs.map((act, index) => ({
          ...act,
          order: existingCount + index + 1,
        }));
        return {
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
      });
    },

    updateMetadata: (patch: Partial<ShowMetadata>) => {
      set((state) => ({
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
      const cueToInsert: Cue = {
        ...created,
        ...cueData,
        cueNumber: computedNumber,
        id: created.id,
      };

      set((state) => {
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
        const updatedActs = state.show.acts.map((act) => ({
          ...act,
          cues: act.cues.map((cue) => {
            if (cue.id !== cueId) return cue;
            const updated = { ...cue, ...patch };
            if (patch.departments) {
              const counts = calculateCueDeviceCounts(patch.departments);
              updated.totalLightingFixtures = counts.lightingCount;
              updated.totalScreens = counts.screenCount;
            }
            return updated;
          }),
        }));

        return {
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
        const updatedActs = state.show.acts.map((act) => ({
          ...act,
          cues: act.cues.filter((c) => c.id !== cueId),
        }));
        const allRemaining = updatedActs.flatMap((a) => a.cues);

        return {
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
        };
      });
    },

    reorderCues: (actId: string, cueIds: string[]) => {
      set((state) => {
        const updatedActs = state.show.acts.map((act) => {
          if (act.id !== actId) return act;
          const cueMap = new Map(act.cues.map((c) => [c.id, c]));
          const reordered = cueIds
            .map((id) => cueMap.get(id))
            .filter((c): c is Cue => Boolean(c));
          return { ...act, cues: reordered };
        });

        return {
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

    holdCue: (cueId?: string) => {
      const state = get();
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

    getDeviceStats: () => {
      const cues = get().getAllCues();
      let totalLighting = 0;
      let totalScreens = 0;
      let peakLighting = 0;
      let peakScreens = 0;

      for (const cue of cues) {
        totalLighting += cue.totalLightingFixtures;
        totalScreens += cue.totalScreens;
        if (cue.totalLightingFixtures > peakLighting) {
          peakLighting = cue.totalLightingFixtures;
        }
        if (cue.totalScreens > peakScreens) {
          peakScreens = cue.totalScreens;
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
