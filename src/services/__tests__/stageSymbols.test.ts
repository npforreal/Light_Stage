import { describe, it, expect } from 'vitest';
import {
  FIXTURE_SYMBOLS,
  analyzeStageWarnings,
  assignFixtureNumbers,
  computeRulerTicks,
  formatMeters,
  getLegendTypes,
} from '../stageSymbols';
import { Fixture, StageConfig, STAGE_PRESETS } from '../../types/virtualStage';

function makeFixture(
  partial: Partial<Fixture> & { id: string; isActive?: boolean }
): Fixture {
  return {
    type: 'Wash',
    position: 'Truss',
    slot: 1,
    x: 0,
    y: 0,
    z: 7,
    beamAngle: 25,
    loadWatts: 500,
    role: 'wash',
    aim: {},
    ...partial,
  };
}

describe('stageSymbols — USITT-lite numbering', () => {
  it('numbers downstage → upstage, Stage Left first', () => {
    const numbers = assignFixtureNumbers([
      makeFixture({ id: 'upstage', x: -2, y: 6 }),
      makeFixture({ id: 'sr', x: 3, y: 0 }),
      makeFixture({ id: 'sl', x: -3, y: 0 }),
      makeFixture({ id: 'downstage', x: 0, y: -2 }),
    ]);

    expect(numbers.downstage).toBe(1);
    expect(numbers.sl).toBe(2);
    expect(numbers.sr).toBe(3);
    expect(numbers.upstage).toBe(4);
  });

  it('skips inactive fixtures and keeps ids stable', () => {
    const numbers = assignFixtureNumbers([
      makeFixture({ id: 'a', x: 0, y: 0, isActive: false }),
      makeFixture({ id: 'b', x: 0, y: 2, isActive: true }),
      makeFixture({ id: 'c', x: 0, y: 1, isActive: true }),
    ]);

    expect(numbers.a).toBeUndefined();
    expect(numbers.c).toBe(1);
    expect(numbers.b).toBe(2);
  });

  it('numbers side booms top-down by trim height', () => {
    const numbers = assignFixtureNumbers([
      makeFixture({ id: 'boom-low', x: -7, y: 0, z: 2, position: 'SideBoom' }),
      makeFixture({ id: 'boom-high', x: -7, y: 0, z: 7, position: 'SideBoom' }),
      makeFixture({ id: 'boom-mid', x: -7, y: 0, z: 4.5, position: 'SideBoom' }),
    ]);

    expect(numbers['boom-high']).toBe(1);
    expect(numbers['boom-mid']).toBe(2);
    expect(numbers['boom-low']).toBe(3);
  });

  it('provides a distinct symbol for every fixture type', () => {
    const shapes = Object.values(FIXTURE_SYMBOLS).map((spec) => spec.shape);
    expect(new Set(shapes).size).toBe(shapes.length);
  });
});

describe('stageSymbols — meter ruler', () => {
  it('computes labeled ticks across the stage width', () => {
    const ticks = computeRulerTicks(18);
    expect(ticks.length).toBeGreaterThan(5);
    expect(ticks.some((tick) => tick.meters === 0 && tick.label === '0m')).toBe(true);
    expect(ticks.some((tick) => tick.meters === -8 && tick.label === '-8m')).toBe(true);
    expect(ticks.some((tick) => tick.meters === 8 && tick.label === '+8m')).toBe(true);
  });

  it('uses a coarser step on wide stages', () => {
    const narrow = computeRulerTicks(10);
    const wide = computeRulerTicks(30);
    expect(wide.length).toBeLessThan(narrow.length * 2);
  });

  it('formats meters with one decimal', () => {
    expect(formatMeters(2.345)).toBe('2.3 m');
    expect(formatMeters(-1, 0)).toBe('-1 m');
  });
});

describe('stageSymbols — non-blocking warnings', () => {
  const baseConfig: StageConfig = JSON.parse(JSON.stringify(STAGE_PRESETS.EndStage));

  it('warns about left/right imbalance and missing front/back light', () => {
    const warnings = analyzeStageWarnings({
      config: baseConfig,
      placements: [
        makeFixture({ id: 'l1', x: -2, y: 2, isActive: true, role: 'wash', position: 'Truss' }),
        makeFixture({ id: 'l2', x: -3, y: 3, isActive: true, role: 'wash', position: 'Truss' }),
        makeFixture({ id: 'l3', x: -4, y: 4, isActive: true, role: 'wash', position: 'Truss' }),
      ],
    });

    const codes = warnings.map((warning) => warning.code);
    expect(codes).toContain('asymmetry');
    expect(codes).toContain('missing-front');
    expect(codes).toContain('missing-back');
  });

  it('does not warn when a balanced front/back rig is lit', () => {
    const warnings = analyzeStageWarnings({
      config: baseConfig,
      placements: [
        makeFixture({ id: 'f', x: -2, y: 1, isActive: true, role: 'front', position: 'FOH' }),
        makeFixture({ id: 'b', x: 2, y: 4, isActive: true, role: 'back', position: 'Back' }),
      ],
    });

    expect(warnings).toHaveLength(0);
  });

  it('warns when a cue asks for more fixtures than the rig declares', () => {
    const config: StageConfig = {
      ...baseConfig,
      fixtures: [makeFixture({ id: 'only', enabled: true })],
    };

    const warnings = analyzeStageWarnings({
      config,
      placements: [makeFixture({ id: 'only', x: 0, y: 1, isActive: true, role: 'front', position: 'FOH' })],
      requestedCount: 8,
    });

    expect(warnings.some((warning) => warning.code === 'cue-exceeds-rig')).toBe(true);
  });

  it('warns when a truss exceeds its load limit', () => {
    const config: StageConfig = {
      ...baseConfig,
      trusses: [
        {
          id: 't1',
          name: 'Back Truss',
          position: 'Back',
          fixtureType: 'Wash',
          fixtureCount: 4,
          x: 50,
          y: 20,
          width: 60,
          enabled: true,
          loadLimitWatts: 1000,
        },
      ],
      fixtures: [makeFixture({ id: 'f1', enabled: true })],
    };

    const warnings = analyzeStageWarnings({
      config,
      placements: [
        makeFixture({
          id: 'f1',
          x: 0,
          y: 3,
          isActive: true,
          role: 'back',
          position: 'Back',
          loadWatts: 2000,
        }),
      ],
    });

    expect(warnings.some((warning) => warning.code === 'truss-overload')).toBe(true);
  });

  it('returns no warnings when nothing is lit', () => {
    expect(analyzeStageWarnings({ config: baseConfig, placements: [] })).toEqual([]);
  });
});

describe('stageSymbols — legend', () => {
  it('collects present and requested types, sorted', () => {
    const legend = getLegendTypes(
      [
        { type: 'Wash' },
        { type: 'Beam' },
        { type: 'Wash' },
      ],
      ['Spot', 'NotAType']
    );

    expect(legend).toEqual(['Beam', 'Spot', 'Wash']);
  });
});
