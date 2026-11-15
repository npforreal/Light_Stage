import { describe, it, expect } from 'vitest';
import { Show, Act, Cue, createCue } from '../../types/stage';
import { calculateShowHardwareInventory } from '../hardwareParser';
import { serializeShow, parseLightStageFile } from '../persistence';
import { generateCueSheetCsv } from '../exporter';

describe('Performance & Scale Stress Testing (1,000+ Cues)', () => {
  it('handles 1,000 cues rapidly across parsing, calculation, and export', () => {
    const totalActsCount = 10;
    const cuesPerAct = 100; // 1,000 cues total
    const acts: Act[] = [];

    const startTime = performance.now();

    for (let a = 1; a <= totalActsCount; a++) {
      const actId = `act-${a}`;
      const cues: Cue[] = [];

      for (let c = 1; c <= cuesPerAct; c++) {
        const cue = createCue(
          actId,
          `${a}.${c}`,
          `Performance Item ${a}-${c}`,
          45000,
          {
            lx: {
              sceneName: `Preset ${c}`,
              fixtureCount: (c % 20) + 1,
              fixtures: [
                {
                  id: `f-${a}-${c}-1`,
                  name: 'Beam 350W',
                  category: 'Lighting',
                  subType: 'Beam',
                  count: 4,
                },
                {
                  id: `f-${a}-${c}-2`,
                  name: 'Spot 1000W',
                  category: 'Lighting',
                  subType: 'Spot',
                  count: 2,
                },
              ],
            },
            vx: {
              contentName: `Visual Loop ${c}`,
              screenCount: (c % 4) + 1,
              screens: [
                {
                  id: `v-${a}-${c}-1`,
                  name: 'Main LED',
                  category: 'Visual',
                  subType: 'MainScreen',
                  count: 1,
                },
              ],
            },
            sq: { trackName: `Audio Track ${c}` },
            st: { actionDescription: `Stage motion ${c}` },
          }
        );
        cues.push(cue);
      }

      acts.push({
        id: actId,
        title: `Act ${a}`,
        order: a,
        cues,
      });
    }

    const generationTime = performance.now() - startTime;
    expect(acts.flatMap((a) => a.cues).length).toBe(1000);
    expect(generationTime).toBeLessThan(500); // 1,000 items created in < 500ms

    // 1. Hardware inventory calculation stress check
    const hwStart = performance.now();
    const inventory = calculateShowHardwareInventory(acts);
    const hwDuration = performance.now() - hwStart;

    expect(inventory.totalLighting).toBeGreaterThan(0);
    expect(inventory.totalScreens).toBeGreaterThan(0);
    expect(hwDuration).toBeLessThan(100); // Aggregation over 1000 cues takes < 100ms

    // 2. Serialization stress check
    const show: Show = {
      id: 'stress-show-1000',
      schemaVersion: 1,
      metadata: {
        title: 'Massive Stadium Show',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      settings: {
        autoStandbyNext: true,
        countdownWarningSec: 10,
        defaultCueDurationMs: 60000,
      },
      acts,
    };

    const serStart = performance.now();
    const json = serializeShow(show, false);
    const serDuration = performance.now() - serStart;

    expect(json.length).toBeGreaterThan(100000);
    expect(serDuration).toBeLessThan(150); // Serializing 1000 cues takes < 150ms

    // 3. Deserialization & validation stress check
    const parseStart = performance.now();
    const parseResult = parseLightStageFile(json);
    const parseDuration = performance.now() - parseStart;

    expect(parseResult.success).toBe(true);
    expect(parseResult.data?.acts.flatMap((a) => a.cues).length).toBe(1000);
    expect(parseDuration).toBeLessThan(200); // Deserializing 1000 cues takes < 200ms

    // 4. CSV export generation stress check
    const csvStart = performance.now();
    const csv = generateCueSheetCsv(show, 'ALL');
    const csvDuration = performance.now() - csvStart;

    expect(csv.split('\r\n').length).toBeGreaterThan(1000);
    expect(csvDuration).toBeLessThan(100); // Exporting 1000 cues takes < 100ms
  });
});
