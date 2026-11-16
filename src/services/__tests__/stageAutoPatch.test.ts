import { describe, it, expect } from 'vitest';
import {
  parseFixtureSyntax,
  extractCueRequirements,
  placeFixtures,
} from '../stageAutoPatch';
import { STAGE_PRESETS } from '../../types/virtualStage';
import { LightingCue } from '../../types/stage';

describe('stageAutoPatch service', () => {
  const baseRig = STAGE_PRESETS.EndStage;

  describe('parseFixtureSyntax', () => {
    it('parses standard count and type with @position override', () => {
      const res1 = parseFixtureSyntax('Spot x4 @FOH');
      expect(res1).toHaveLength(1);
      expect(res1[0].type).toBe('Spot');
      expect(res1[0].count).toBe(4);
      expect(res1[0].preferredPosition).toBe('FOH');

      const res2 = parseFixtureSyntax('8x Blinder @Floor');
      expect(res2[0].type).toBe('Blinder');
      expect(res2[0].count).toBe(8);
      expect(res2[0].preferredPosition).toBe('Floor');
    });

    it('parses combined expressions with + and commas', () => {
      const res = parseFixtureSyntax('4 Beam 350W @Back + 2 Follow @FOH');
      expect(res).toHaveLength(2);
      expect(res[0].type).toBe('Beam');
      expect(res[0].count).toBe(4);
      expect(res[0].preferredPosition).toBe('Truss');

      expect(res[1].type).toBe('Follow');
      expect(res[1].count).toBe(2);
      expect(res[1].preferredPosition).toBe('FOH');
    });

    it('gracefully handles empty or partial inputs', () => {
      expect(parseFixtureSyntax('')).toEqual([]);
      expect(parseFixtureSyntax('UnknownLight')).toHaveLength(1);
      expect(parseFixtureSyntax('UnknownLight')[0].count).toBe(1);
    });
  });

  describe('extractCueRequirements', () => {
    it('extracts from DeviceSpecification array', () => {
      const cue: LightingCue = {
        fixtureCount: 6,
        fixtures: [
          {
            id: 'dev-1',
            name: 'Sharpy Beam',
            category: 'Lighting',
            subType: 'Beam',
            count: 4,
          },
          {
            id: 'dev-2',
            name: 'Aura Wash',
            category: 'Lighting',
            subType: 'Wash',
            count: 2,
          },
        ],
      };
      const reqs = extractCueRequirements(cue);
      expect(reqs).toHaveLength(2);
      expect(reqs[0].type).toBe('Beam');
      expect(reqs[0].count).toBe(4);
      expect(reqs[1].type).toBe('Wash');
      expect(reqs[1].count).toBe(2);
    });

    it('extracts from fixtureSummary string', () => {
      const cue: LightingCue = {
        fixtureCount: 4,
        fixtureSummary: '4 Spot @FOH',
      };
      const reqs = extractCueRequirements(cue);
      expect(reqs).toHaveLength(1);
      expect(reqs[0].type).toBe('Spot');
      expect(reqs[0].count).toBe(4);
      expect(reqs[0].preferredPosition).toBe('FOH');
    });

    it('falls back to fixtureCount if no details provided', () => {
      const cue: LightingCue = {
        fixtureCount: 8,
      };
      const reqs = extractCueRequirements(cue);
      expect(reqs).toHaveLength(1);
      expect(reqs[0].count).toBe(8);
      expect(reqs[0].type).toBe('Spot');
    });
  });

  describe('placeFixtures deterministic assignment', () => {
    it('returns exact requested count of active fixtures', () => {
      const cue: LightingCue = {
        fixtureCount: 12,
        fixtureSummary: '6 Beam + 6 Wash',
      };
      const result = placeFixtures(baseRig, cue);
      expect(result.requestedCount).toBe(12);
      expect(result.activeCount).toBe(12);
      expect(result.byType.Beam.active).toBe(6);
      expect(result.byType.Wash.active).toBe(6);
      expect(result.isOverflown).toBe(false);
    });

    it('is completely deterministic across repeated calls', () => {
      const cue: LightingCue = {
        fixtureCount: 7,
        fixtureSummary: '5 Spot @FOH + 2 Follow @FOH',
      };
      const res1 = placeFixtures(baseRig, cue);
      const res2 = placeFixtures(baseRig, cue);

      expect(res1.activeCount).toBe(res2.activeCount);
      expect(res1.placements.map((p) => p.id)).toEqual(res2.placements.map((p) => p.id));
      expect(res1.placements.map((p) => p.x)).toEqual(res2.placements.map((p) => p.x));
    });

    it('distributes fixtures symmetrically across SL/SR', () => {
      const cue: LightingCue = {
        fixtureCount: 4,
        fixtureSummary: '4 Wash @FOH',
      };
      const result = placeFixtures(baseRig, cue);
      const activeFoh = result.placements.filter((p) => p.isActive && p.position === 'FOH');
      expect(activeFoh).toHaveLength(4);

      const slCount = activeFoh.filter((f) => f.x < 0).length;
      const srCount = activeFoh.filter((f) => f.x > 0).length;
      expect(slCount).toBe(srCount);
    });

    it('places 1 fixture at center when odd count is requested', () => {
      const cue: LightingCue = {
        fixtureCount: 1,
        fixtureSummary: '1 Follow @FOH',
      };
      const result = placeFixtures(baseRig, cue);
      const activeFollow = result.placements.filter((p) => p.isActive && p.type === 'Follow');
      expect(activeFollow).toHaveLength(1);
      // Center fixture is at or very near x=0
      expect(Math.abs(activeFollow[0].x)).toBeLessThanOrEqual(0.6);
    });

    it('assigns Follow spots to FOH by default rule', () => {
      const cue: LightingCue = {
        fixtureCount: 2,
        fixtureSummary: '2 Follow',
      };
      const result = placeFixtures(baseRig, cue);
      const activeFollows = result.placements.filter((p) => p.isActive && p.type === 'Follow');
      expect(activeFollows).toHaveLength(2);
      expect(activeFollows.every((f) => f.position === 'FOH')).toBe(true);
    });

    it('assigns Blinders to Floor by default rule', () => {
      const cue: LightingCue = {
        fixtureCount: 4,
        fixtureSummary: '4 Blinder',
      };
      const result = placeFixtures(baseRig, cue);
      const activeBlinders = result.placements.filter((p) => p.isActive && p.type === 'Blinder');
      expect(activeBlinders).toHaveLength(4);
      expect(activeBlinders.every((f) => f.position === 'Floor')).toBe(true);
    });
  });

  describe('capacity overflow handling', () => {
    it('auto-expands slots with warning when rig capacity is exceeded without dropping any fixture', () => {
      // Base rig has 12 beams, 8 spots on truss, 8 blinders on floor. Request 35 beams!
      const cue: LightingCue = {
        fixtureCount: 35,
        fixtureSummary: '35 Beam',
      };
      const result = placeFixtures(baseRig, cue);

      expect(result.requestedCount).toBe(35);
      expect(result.activeCount).toBe(35);
      expect(result.isOverflown).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Vượt sức chứa rig');

      // Check that virtual expanded fixtures are generated
      const virtualExpanded = result.placements.filter((p) => p.isVirtualExpanded);
      expect(virtualExpanded.length).toBeGreaterThan(0);
      expect(virtualExpanded.every((f) => f.isActive)).toBe(true);
    });

    it('calculates total wattage correctly for active fixtures', () => {
      const cue: LightingCue = {
        fixtureCount: 4,
        fixtureSummary: '2 Spot + 2 Beam',
      };
      const result = placeFixtures(baseRig, cue);
      expect(result.totalLoadWatts).toBeGreaterThan(0);
      // Spot: 1000W x 2 = 2000W, Beam: 350W x 2 = 700W -> 2700W
      expect(result.totalLoadWatts).toBe(2700);
    });
  });
});
