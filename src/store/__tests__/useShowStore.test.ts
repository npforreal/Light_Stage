import { describe, it, expect, beforeEach } from 'vitest';
import { useShowStore } from '../useShowStore';
import { createDefaultShow } from '../../types/stage';

describe('useShowStore', () => {
  beforeEach(() => {
    const show = createDefaultShow('Test Show');
    useShowStore.getState().loadShow(show);
  });

  describe('Act & Cue Management', () => {
    it('adds a new act and cues to the show', () => {
      const actId = useShowStore.getState().addAct('Act 2: The Climax');
      expect(useShowStore.getState().show.acts.length).toBe(2);

      const cueId = useShowStore.getState().addCue(actId, {
        cueNumber: '2.0',
        title: 'Opening Act 2',
        durationMs: 30000,
        departments: {
          lx: { fixtureCount: 20 },
          vx: { screenCount: 2 },
        },
      });

      const addedCue = useShowStore.getState().getCueById(cueId);
      expect(addedCue).toBeDefined();
      expect(addedCue?.title).toBe('Opening Act 2');
      expect(addedCue?.totalLightingFixtures).toBe(20);
      expect(addedCue?.totalScreens).toBe(2);
      expect(useShowStore.getState().isDirty).toBe(true);
    });

    it('updates an existing cue and recalculates counts', () => {
      const allCues = useShowStore.getState().getAllCues();
      const firstCueId = allCues[0].id;

      useShowStore.getState().updateCue(firstCueId, {
        title: 'Updated Title',
        departments: {
          lx: { fixtureCount: 50 },
          vx: { screenCount: 4 },
        },
      });

      const updated = useShowStore.getState().getCueById(firstCueId);
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.totalLightingFixtures).toBe(50);
      expect(updated?.totalScreens).toBe(4);
    });

    it('deletes a cue properly', () => {
      const allCues = useShowStore.getState().getAllCues();
      const firstCueId = allCues[0].id;

      useShowStore.getState().deleteCue(firstCueId);
      expect(useShowStore.getState().getCueById(firstCueId)).toBeUndefined();
    });

    it('reorders cues within an act', () => {
      const actId = useShowStore.getState().show.acts[0].id;
      const c1 = useShowStore.getState().addCue(actId, { cueNumber: '1.1', title: 'C1' });
      const c2 = useShowStore.getState().addCue(actId, { cueNumber: '1.2', title: 'C2' });

      useShowStore.getState().reorderCues(actId, [c2, c1]);
      const actCues = useShowStore.getState().show.acts[0].cues;
      expect(actCues[0].id).toBe(c2);
      expect(actCues[1].id).toBe(c1);
    });
  });

  describe('Playback & State Machine Transitions', () => {
    let actId: string;
    let cue1: string;
    let cue2: string;
    let cue3: string;

    beforeEach(() => {
      const store = useShowStore.getState();
      store.newShow('Playback Test');
      actId = useShowStore.getState().show.acts[0].id;
      cue1 = useShowStore.getState().show.acts[0].cues[0].id;
      cue2 = useShowStore.getState().addCue(actId, { cueNumber: '1.1', title: 'Second Cue' });
      cue3 = useShowStore.getState().addCue(actId, { cueNumber: '1.2', title: 'Third Cue' });
    });

    it('arms a cue for Standby', () => {
      useShowStore.getState().standbyCue(cue2);

      expect(useShowStore.getState().standbyCueId).toBe(cue2);
      expect(useShowStore.getState().getCueById(cue2)?.status).toBe('Standby');
      // Previous cue1 should be reverted to Pending
      expect(useShowStore.getState().getCueById(cue1)?.status).toBe('Pending');
    });

    it('executes Go transition and auto-advances standby', () => {
      // Cue1 is initial standby
      useShowStore.getState().standbyCue(cue1);
      expect(useShowStore.getState().standbyCueId).toBe(cue1);

      // Trigger GO
      useShowStore.getState().goCue();

      expect(useShowStore.getState().activeCueId).toBe(cue1);
      expect(useShowStore.getState().getCueById(cue1)?.status).toBe('Go');

      // Next cue should automatically be armed to Standby
      expect(useShowStore.getState().standbyCueId).toBe(cue2);
      expect(useShowStore.getState().getCueById(cue2)?.status).toBe('Standby');

      // Trigger second GO
      useShowStore.getState().goCue();

      // Cue1 should transition to Completed, Cue2 to Go, Cue3 to Standby
      expect(useShowStore.getState().getCueById(cue1)?.status).toBe('Completed');
      expect(useShowStore.getState().activeCueId).toBe(cue2);
      expect(useShowStore.getState().getCueById(cue2)?.status).toBe('Go');
      expect(useShowStore.getState().standbyCueId).toBe(cue3);
      expect(useShowStore.getState().getCueById(cue3)?.status).toBe('Standby');
    });

    it('handles Hold and Skip cue status', () => {
      useShowStore.getState().goCue(cue1);
      expect(useShowStore.getState().getCueById(cue1)?.status).toBe('Go');

      useShowStore.getState().holdCue(cue1);
      expect(useShowStore.getState().getCueById(cue1)?.status).toBe('Hold');

      useShowStore.getState().skipCue(cue2);
      expect(useShowStore.getState().getCueById(cue2)?.status).toBe('Skip');

      // Next standby cue should now skip cue2 and point to cue3
      expect(useShowStore.getState().standbyCueId).toBe(cue3);
    });

    it('resets a single cue and resets all cues', () => {
      useShowStore.getState().goCue(cue1);
      useShowStore.getState().resetCue(cue1);

      expect(useShowStore.getState().getCueById(cue1)?.status).toBe('Pending');
      expect(useShowStore.getState().activeCueId).toBeNull();

      // Fire a cue then reset all
      useShowStore.getState().goCue(cue2);
      useShowStore.getState().resetAllCues();

      const cues = useShowStore.getState().getAllCues();
      expect(cues.find((c) => c.status === 'Go')).toBeUndefined();
      expect(cues[0].status).toBe('Standby');
      expect(cues[1].status).toBe('Pending');
      expect(cues[2].status).toBe('Pending');
      expect(useShowStore.getState().activeCueId).toBeNull();
      expect(useShowStore.getState().standbyCueId).toBe(cues[0].id);
    });

    it('navigates next and previous cue standby', () => {
      useShowStore.getState().standbyCue(cue1);
      useShowStore.getState().nextCue();
      expect(useShowStore.getState().standbyCueId).toBe(cue2);

      useShowStore.getState().nextCue();
      expect(useShowStore.getState().standbyCueId).toBe(cue3);

      useShowStore.getState().prevCue();
      expect(useShowStore.getState().standbyCueId).toBe(cue2);
    });
  });

  describe('Device Stats Aggregation', () => {
    it('computes total fixtures and peak usage', () => {
      const actId = useShowStore.getState().show.acts[0].id;
      useShowStore.getState().addCue(actId, {
        cueNumber: '1.1',
        departments: {
          lx: { fixtureCount: 30 },
          vx: { screenCount: 5 },
        },
      });

      const stats = useShowStore.getState().getDeviceStats();
      // Default cue has 12 fixtures and 1 screen, second has 30 fixtures and 5 screens
      expect(stats.totalLightingFixtures).toBe(42);
      expect(stats.totalScreens).toBe(6);
      expect(stats.peakLighting).toBe(30);
      expect(stats.peakScreens).toBe(5);
    });
  });
});
