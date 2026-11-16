import { describe, it, expect } from 'vitest';
import {
  parseHardwareFromText,
  classifyDevice,
  calculateShowHardwareInventory,
} from '../hardwareParser';
import { Act, Cue } from '../../types/stage';

describe('Hardware Parser Engine', () => {
  describe('classifyDevice', () => {
    it('classifies lighting fixtures correctly', () => {
      expect(classifyDevice('Beam 350W').subType).toBe('Beam');
      expect(classifyDevice('Spot 1000W Profile').subType).toBe('Spot');
      expect(classifyDevice('Wash 19x40W').subType).toBe('Wash');
      expect(classifyDevice('Par LED 54x3W').subType).toBe('ParLED');
      expect(classifyDevice('Blinder 4 mắt').subType).toBe('Blinder');
      expect(classifyDevice('Đèn Follow 2500W').subType).toBe('Follow');
      expect(classifyDevice('Laser 10W RGB').subType).toBe('Laser');
      expect(classifyDevice('Atomic Strobe').subType).toBe('Strobe');
      expect(classifyDevice('Máy khói lạnh').subType).toBe('Smoke');
    });

    it('classifies visual LED screens correctly', () => {
      expect(classifyDevice('Màn LED Main P3').subType).toBe('MainScreen');
      expect(classifyDevice('Màn LED cánh trái').subType).toBe('WingScreen');
      expect(classifyDevice('Màn LED sàn tương tác').subType).toBe('FloorScreen');
      expect(classifyDevice('LED Banner viền').subType).toBe('Banner');
    });
  });

  describe('parseHardwareFromText', () => {
    it('extracts compound clauses with prefix multipliers', () => {
      const text = '4 Beam 350W + 2 Follow';
      const result = parseHardwareFromText(text, 'Lighting');

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Beam 350W');
      expect(result[0].count).toBe(4);
      expect(result[0].subType).toBe('Beam');

      expect(result[1].name).toBe('Follow');
      expect(result[1].count).toBe(2);
      expect(result[1].subType).toBe('Follow');
    });

    it('extracts suffix multipliers with x or *', () => {
      const text = 'Màn LED cánh x 2, Spot 1000W x 4';
      const result = parseHardwareFromText(text);

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Màn LED cánh');
      expect(result[0].count).toBe(2);
      expect(result[0].category).toBe('Visual');

      expect(result[1].name).toBe('Spot 1000W');
      expect(result[1].count).toBe(4);
      expect(result[1].category).toBe('Lighting');
    });

    it('extracts Vietnamese phrasing with classifier words', () => {
      const text = '4 cây Beam, 2 chiếc Follow, 12 bộ Par LED, 2 màn LED cánh';
      const result = parseHardwareFromText(text);

      expect(result.length).toBe(4);
      expect(result[0].count).toBe(4);
      expect(result[0].name).toBe('Beam');

      expect(result[1].count).toBe(2);
      expect(result[1].name).toBe('Follow');

      expect(result[2].count).toBe(12);
      expect(result[2].name).toBe('Par LED');

      expect(result[3].count).toBe(2);
      expect(result[3].name).toBe('LED cánh');
    });

    it('defaults count to 1 for standalone mentions of equipment', () => {
      const text = 'Chớp Strobe & Máy khói';
      const result = parseHardwareFromText(text);

      expect(result.length).toBe(2);
      expect(result[0].count).toBe(1);
      expect(result[1].count).toBe(1);
    });

    it('handles empty or non-hardware text cleanly', () => {
      expect(parseHardwareFromText('')).toEqual([]);
      expect(parseHardwareFromText('Diễn viên đứng giữa sân khấu')).toEqual([]);
    });

    it('rejects false positives like "Spare cable 3" or "Party mode"', () => {
      expect(parseHardwareFromText('Spare cable 3')).toEqual([]);
      expect(parseHardwareFromText('Party mode setup')).toEqual([]);
      expect(parseHardwareFromText('Ghế MC + Bàn tròn')).toEqual([]);
    });

    it('rejects out-of-range counts exceeding 9999', () => {
      expect(parseHardwareFromText('Beam x 4000000000')).toEqual([]);
    });

    it('handles notes in parentheses like "Beam x 4 (FOH)"', () => {
      const result = parseHardwareFromText('Beam x 4 (FOH)');
      expect(result.length).toBe(1);
      expect(result[0].count).toBe(4);
      expect(result[0].name).toContain('Beam');
      expect(result[0].name).toContain('(FOH)');
      expect(result[0].subType).toBe('Beam');
    });

    it('handles cue transitions like "Blinder 2 -> 0"', () => {
      const result = parseHardwareFromText('Blinder 2 -> 0');
      expect(result.length).toBe(1);
      expect(result[0].count).toBe(2);
      expect(result[0].subType).toBe('Blinder');
    });

    it('separates color/temp from fixture counts ("Wash 12 cây 3200K")', () => {
      const result = parseHardwareFromText('Wash 12 cây 3200K');
      expect(result.length).toBe(1);
      expect(result[0].count).toBe(12);
      expect(result[0].subType).toBe('Wash');
      expect(result[0].color).toEqual({ mode: 'kelvin', kelvin: 3200 });

      const ctoResult = parseHardwareFromText('Spot 8 cây CTO');
      expect(ctoResult.length).toBe(1);
      expect(ctoResult[0].count).toBe(8);
      expect(ctoResult[0].subType).toBe('Spot');
      expect(ctoResult[0].color?.mode).toBe('name');
      expect(ctoResult[0].color && 'name' in ctoResult[0].color && ctoResult[0].color.name).toContain('CTO');
    });

    it('detects screen count from "Logo Loop" and visual loops', () => {
      const logoResult = parseHardwareFromText('Logo Loop', 'Visual');
      expect(logoResult.length).toBe(1);
      expect(logoResult[0].count).toBe(1);
      expect(logoResult[0].category).toBe('Visual');
      expect(logoResult[0].subType).toBe('MainScreen');

      const videoLoopResult = parseHardwareFromText('Video Loop x 2', 'Visual');
      expect(videoLoopResult.length).toBe(1);
      expect(videoLoopResult[0].count).toBe(2);
      expect(videoLoopResult[0].category).toBe('Visual');
    });

    it('maps Vietnamese color names properly in parseLightingColorFromText', async () => {
      const { parseLightingColorFromText } = await import('../hardwareParser');
      expect(parseLightingColorFromText('3200K')).toEqual({ mode: 'kelvin', kelvin: 3200 });
      expect(parseLightingColorFromText('Đỏ')).toEqual({ mode: 'name', name: 'Đỏ Sân Khấu' });
      expect(parseLightingColorFromText('Xanh')).toEqual({ mode: 'name', name: 'Xanh Dương' });
      expect(parseLightingColorFromText('Vàng')).toEqual({ mode: 'name', name: 'Vàng Sân Khấu' });
      expect(parseLightingColorFromText('Cam')).toEqual({ mode: 'name', name: 'Cam' });
      expect(parseLightingColorFromText('Tím')).toEqual({ mode: 'name', name: 'Tím Sân Khấu' });
      expect(parseLightingColorFromText('Hổ phách')).toEqual({ mode: 'name', name: 'Amber' });
    });
  });

  describe('calculateShowHardwareInventory', () => {
    it('aggregates total instances and peak concurrent equipment across acts and cues', () => {
      const mockAct: Act = {
        id: 'act-1',
        title: 'Opening Act',
        order: 1,
        cues: [
          {
            id: 'cue-1',
            actId: 'act-1',
            cueNumber: '1.1',
            title: 'Intro',
            status: 'Pending',
            durationMs: 30000,
            departments: {
              lx: {
                fixtureCount: 6,
                fixtures: [
                  { id: '1', name: 'Beam 350W', category: 'Lighting', subType: 'Beam', count: 4 },
                  { id: '2', name: 'Follow', category: 'Lighting', subType: 'Follow', count: 2 },
                ],
              },
              vx: {
                screenCount: 1,
                screens: [
                  { id: '3', name: 'Màn LED Main', category: 'Visual', subType: 'MainScreen', count: 1 },
                ],
              },
            },
            totalLightingFixtures: 6,
            totalScreens: 1,
          },
          {
            id: 'cue-2',
            actId: 'act-1',
            cueNumber: '1.2',
            title: 'Chorus Drop',
            status: 'Pending',
            durationMs: 45000,
            departments: {
              lx: {
                fixtureCount: 12,
                fixtures: [
                  { id: '4', name: 'Beam 350W', category: 'Lighting', subType: 'Beam', count: 12 },
                ],
              },
              vx: {
                screenCount: 3,
                screens: [
                  { id: '5', name: 'Màn LED Main', category: 'Visual', subType: 'MainScreen', count: 1 },
                  { id: '6', name: 'Màn LED cánh', category: 'Visual', subType: 'WingScreen', count: 2 },
                ],
              },
            },
            totalLightingFixtures: 12,
            totalScreens: 3,
          },
        ] as Cue[],
      };

      const stats = calculateShowHardwareInventory([mockAct]);

      expect(stats.totalLighting).toBe(18); // 6 + 12
      expect(stats.totalScreens).toBe(4); // 1 + 3
      expect(stats.peakLighting).toBe(12);
      expect(stats.peakScreens).toBe(3);

      // Inventory check for Beam 350W
      const beamStat = stats.inventory['beam 350w'];
      expect(beamStat).toBeDefined();
      expect(beamStat.totalInstances).toBe(16); // 4 + 12
      expect(beamStat.peakConcurrent).toBe(12); // peak was in cue 2
    });
  });
});
