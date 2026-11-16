import { describe, it, expect } from 'vitest';
import {
  UNCLASSIFIED_LABEL,
  countFixturesByType,
  createDeviceSpec,
  formatFixtureSummary,
  getCueLightingCount,
  hasUnclassifiedFixtures,
  normalizeCue,
  normalizeLightingCue,
  normalizeShow,
  parseFixtureText,
} from '../fixtureModel';
import { createCue, createDefaultShow } from '../../types/stage';

const THIRTY = 'Beam x8, Spot x4 @FOH, Wash x12, Follow x2, Blinder x4';

describe('fixtureModel — single source of truth', () => {
  it('parses the 30-fixture cue description into per-type rows', () => {
    const fixtures = parseFixtureText(THIRTY);
    expect(fixtures.reduce((sum, f) => sum + f.count, 0)).toBe(30);
    expect(countFixturesByType(fixtures)).toEqual({
      Beam: 8,
      Spot: 4,
      Wash: 12,
      Follow: 2,
      Blinder: 4,
    });
    expect(fixtures.find((f) => f.subType === 'Spot')?.position).toBe('FOH');
  });

  it('derives fixtureCount from the device list, never the other way around', () => {
    const lx = normalizeLightingCue({
      sceneName: 'Rock',
      fixtureCount: 999, // stale cache must be ignored
      fixtures: [
        createDeviceSpec({ name: 'Wash', subType: 'Wash', count: 12 }),
        createDeviceSpec({ name: 'Spot', subType: 'Spot', count: 4 }),
      ],
    });
    expect(lx?.fixtureCount).toBe(16);
    expect(lx?.fixtureSummary).toBe('Wash x12, Spot x4');
  });

  it('migrates a legacy cue that only has fixtureCount into one unclassified row', () => {
    const lx = normalizeLightingCue({ sceneName: 'Legacy', fixtureCount: 12 });
    expect(lx?.fixtureCount).toBe(12);
    expect(lx?.fixtures).toHaveLength(1);
    expect(lx?.fixtures?.[0].name).toBe(UNCLASSIFIED_LABEL);
    expect(lx?.fixtures?.[0].count).toBe(12);
    expect(hasUnclassifiedFixtures(lx?.fixtures ?? [])).toBe(true);
  });

  it('parses fixtureSummary before falling back to the legacy count', () => {
    const lx = normalizeLightingCue({
      fixtureCount: 99,
      fixtureSummary: '8 Spot + 4 Beam',
    });
    expect(lx?.fixtureCount).toBe(12);
    expect(lx?.fixtures).toHaveLength(2);
    expect(hasUnclassifiedFixtures(lx?.fixtures ?? [])).toBe(false);
  });

  it('normalizes a cue so cached totals match the device list', () => {
    const cue = createCue('act-1', '1.0', 'Test', 60000, {
      lx: {
        sceneName: 'Test',
        fixtureCount: 1,
        fixtures: [
          createDeviceSpec({ name: 'Beam', subType: 'Beam', count: 8 }),
          createDeviceSpec({ name: 'Wash', subType: 'Wash', count: 12 }),
        ],
      },
    });
    const normalized = normalizeCue({ ...cue, totalLightingFixtures: 1 });
    expect(normalized.totalLightingFixtures).toBe(20);
    expect(getCueLightingCount(normalized)).toBe(20);
  });

  it('migrates a whole legacy show without losing any count', () => {
    const show = createDefaultShow('Legacy Show');
    show.acts[0].cues[0].departments.lx = { sceneName: 'Legacy', fixtureCount: 12 };
    show.acts[0].cues[0].totalLightingFixtures = 12;

    const migrated = normalizeShow(show);
    const lx = migrated.acts[0].cues[0].departments.lx;
    expect(lx?.fixtures?.[0].name).toBe(UNCLASSIFIED_LABEL);
    expect(lx?.fixtureCount).toBe(12);
    expect(migrated.acts[0].cues[0].totalLightingFixtures).toBe(12);
  });

  it('round-trips formatFixtureSummary through the parser', () => {
    const fixtures = [
      createDeviceSpec({ name: 'Beam', subType: 'Beam', count: 8, position: 'Truss' }),
      createDeviceSpec({ name: 'Spot', subType: 'Spot', count: 4, position: 'FOH' }),
    ];
    const summary = formatFixtureSummary(fixtures);
    expect(summary).toBe('Beam x8 @Truss, Spot x4 @FOH');

    const reparsed = parseFixtureText(summary);
    expect(countFixturesByType(reparsed)).toEqual({ Beam: 8, Spot: 4 });
  });

  it('property: any generated list keeps the same total after format → parse', () => {
    const types = ['Beam', 'Spot', 'Wash', 'Follow', 'Blinder', 'Strobe', 'ParLED'];
    for (let run = 0; run < 60; run++) {
      const rowCount = 1 + (run % 5);
      const fixtures = Array.from({ length: rowCount }, (_, index) =>
        createDeviceSpec({
          name: types[(run + index) % types.length],
          subType: types[(run + index) % types.length],
          count: 1 + ((run * 7 + index * 13) % 40),
          position: index % 2 === 0 ? 'FOH' : 'Truss',
        })
      );
      const total = fixtures.reduce((sum, f) => sum + f.count, 0);
      const reparsed = parseFixtureText(formatFixtureSummary(fixtures));
      expect(reparsed.reduce((sum, f) => sum + f.count, 0)).toBe(total);
    }
  });
});
