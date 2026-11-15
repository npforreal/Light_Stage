import { describe, it, expect } from 'vitest';
import {
  createDefaultShow,
  createCue,
  calculateCueDeviceCounts,
  DepartmentCues,
} from '../stage';

describe('Stage Domain Models', () => {
  it('creates default show with valid structure', () => {
    const show = createDefaultShow('Live Gala 2026');

    expect(show.id).toBeDefined();
    expect(show.schemaVersion).toBe(1);
    expect(show.metadata.title).toBe('Live Gala 2026');
    expect(show.acts.length).toBeGreaterThan(0);
    expect(show.settings.autoStandbyNext).toBe(true);
    expect(show.settings.countdownWarningSec).toBe(10);

    const firstCue = show.acts[0].cues[0];
    expect(firstCue).toBeDefined();
    expect(firstCue.status).toBe('Pending');
    expect(firstCue.departments.lx?.fixtureCount).toBe(12);
    expect(firstCue.totalLightingFixtures).toBe(12);
    expect(firstCue.totalScreens).toBe(1);
  });

  it('creates individual cue with custom parameters', () => {
    const departments: DepartmentCues = {
      lx: { sceneName: 'Chorus Blast', fixtureCount: 24, intensity: 100 },
      vx: { contentName: 'Chorus Visuals', screenCount: 3, loop: false },
      sq: { trackName: 'Main Mix Audio', volume: 85 },
      st: { actionDescription: 'Dancers enter stage left' },
    };

    const cue = createCue('act-1', '2.1', 'Chorus Drop', 45000, departments);

    expect(cue.actId).toBe('act-1');
    expect(cue.cueNumber).toBe('2.1');
    expect(cue.title).toBe('Chorus Drop');
    expect(cue.durationMs).toBe(45000);
    expect(cue.status).toBe('Pending');
    expect(cue.totalLightingFixtures).toBe(24);
    expect(cue.totalScreens).toBe(3);
  });

  it('calculates device counts correctly for missing or partial departments', () => {
    const zeroCounts = calculateCueDeviceCounts({});
    expect(zeroCounts.lightingCount).toBe(0);
    expect(zeroCounts.screenCount).toBe(0);

    const partialCounts = calculateCueDeviceCounts({
      lx: { fixtureCount: 16 },
    });
    expect(partialCounts.lightingCount).toBe(16);
    expect(partialCounts.screenCount).toBe(0);
  });
});
