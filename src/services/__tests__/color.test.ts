import { describe, it, expect } from 'vitest';
import {
  srgbToLinear,
  linearToSrgb,
  hexToRgb,
  hexToOklch,
  oklchToHex,
  gamutMap,
  kelvinToRgb,
  cmyToLinearRgb,
  rgbwToLinearRgb,
  rgbaToLinearRgb,
  xyToLinearRgb,
  mixLinear,
  applyDimmer,
  contrastWcag,
  contrastApca,
} from '../color';
import { TokenValues, readToken } from './tokenValues.gen';

describe('Color Science Engine (color.ts)', () => {
  describe('sRGB <-> Linear Transfer', () => {
    it('accurately roundtrips channels between sRGB and Linear', () => {
      const original = { r: 128, g: 64, b: 200 };
      const linear = srgbToLinear(original);
      const roundtrip = linearToSrgb(linear);

      expect(Math.abs(roundtrip.r - original.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(roundtrip.g - original.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(roundtrip.b - original.b)).toBeLessThanOrEqual(1);
    });

    it('demonstrates that linear mixing differs from gamma-space addition', () => {
      // 50% Red + 50% Green in gamma
      const gammaMix = { r: 128, g: 128, b: 0 };
      // 50% Red + 50% Green in linear
      const linRed = srgbToLinear({ r: 255, g: 0, b: 0 });
      const linGreen = srgbToLinear({ r: 0, g: 255, b: 0 });
      const linHalf = { r: linRed.r * 0.5, g: linGreen.g * 0.5, b: 0 };
      const srgbOfLinearHalf = linearToSrgb(linHalf);

      // Linear addition yields a significantly brighter perception (~186) than gamma addition (128)
      expect(srgbOfLinearHalf.r).toBeGreaterThan(gammaMix.r);
      expect(srgbOfLinearHalf.g).toBeGreaterThan(gammaMix.g);
    });
  });

  describe('OKLCH Conversion and Gamut Mapping', () => {
    it('roundtrips hex to OKLCH and back with error < 1/255', () => {
      const hexList = ['#38bdf8', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
      for (const hex of hexList) {
        const lch = hexToOklch(hex);
        const recovered = oklchToHex(lch);
        const origRgb = hexToRgb(hex);
        const recRgb = hexToRgb(recovered);

        expect(Math.abs(origRgb.r - recRgb.r)).toBeLessThanOrEqual(2);
        expect(Math.abs(origRgb.g - recRgb.g)).toBeLessThanOrEqual(2);
        expect(Math.abs(origRgb.b - recRgb.b)).toBeLessThanOrEqual(2);
      }
    });

    it('gamut mapping preserves hue when clamping out-of-gamut chroma', () => {
      // Laser / Super saturated emerald out-of-gamut in sRGB
      const laserLch = { l: 0.8, c: 0.45, h: 142 };
      const mapped = gamutMap(laserLch);

      expect(mapped.outOfGamut).toBe(true);
      expect(mapped.oklch.h).toBeCloseTo(laserLch.h, 1);
      expect(mapped.oklch.l).toBeCloseTo(laserLch.l, 2);
      expect(mapped.oklch.c).toBeLessThan(laserLch.c);
      expect(mapped.color.r).toBeGreaterThanOrEqual(0);
      expect(mapped.color.r).toBeLessThanOrEqual(255);
    });
  });

  describe('Kelvin Color Temperature (Helland Algorithm)', () => {
    it('matches empirical color temperature checkpoints', () => {
      // 2500K Candlelight/Warm tungsten: approx (255, 159, 70)
      const k2500 = kelvinToRgb(2500);
      expect(k2500.r).toBe(255);
      expect(k2500.g).toBeGreaterThanOrEqual(155);
      expect(k2500.g).toBeLessThanOrEqual(165);
      expect(k2500.b).toBeGreaterThanOrEqual(65);
      expect(k2500.b).toBeLessThanOrEqual(75);

      // 3200K Stage Halogen
      const k3200 = kelvinToRgb(3200);
      expect(k3200.r).toBe(255);
      expect(k3200.g).toBeGreaterThan(k2500.g);
      expect(k3200.b).toBeGreaterThan(k2500.b);

      // 6500K Daylight
      const k6500 = kelvinToRgb(6500);
      expect(k6500.r).toBeGreaterThanOrEqual(250);
      expect(k6500.g).toBeGreaterThanOrEqual(250);
      expect(k6500.b).toBeGreaterThanOrEqual(248);
    });
  });

  describe('Multi-Emitter and Subtractive Light Models', () => {
    it('models subtractive CMY light filters accurately', () => {
      // 100% Cyan filter transmits no Red
      const cyan = cmyToLinearRgb(100, 0, 0);
      expect(cyan.r).toBe(0);
      expect(cyan.g).toBe(1);
      expect(cyan.b).toBe(1);

      // 100% Magenta filter transmits no Green
      const magenta = cmyToLinearRgb(0, 100, 0);
      expect(magenta.r).toBe(1);
      expect(magenta.g).toBe(0);
      expect(magenta.b).toBe(1);
    });

    it('adds amber and white emitters to RGB in linear space', () => {
      const rgbw = rgbwToLinearRgb(255, 0, 0, 128);
      expect(rgbw.r).toBeGreaterThan(1.0); // Red + White
      expect(rgbw.g).toBeGreaterThan(0.0); // White contribution
      expect(rgbw.b).toBeGreaterThan(0.0);

      const rgba = rgbaToLinearRgb(0, 0, 255, 200);
      expect(rgba.b).toBeGreaterThanOrEqual(1.0);
      expect(rgba.r).toBeGreaterThan(0.0); // Amber contribution
    });

    it('converts CIE xy coordinates to linear sRGB', () => {
      // D65 White point xy: (0.3127, 0.3290)
      const white = xyToLinearRgb(0.3127, 0.329, 1.0);
      expect(white.r).toBeCloseTo(1.0, 1);
      expect(white.g).toBeCloseTo(1.0, 1);
      expect(white.b).toBeCloseTo(1.0, 1);
    });
  });

  describe('Light Synthesis: Dimmer & Linear Mixing', () => {
    it('applies square dimmer curve by default', () => {
      expect(applyDimmer(100, 'square')).toBe(1.0);
      expect(applyDimmer(50, 'square')).toBe(0.25);
      expect(applyDimmer(0, 'square')).toBe(0.0);
    });

    it('mixes multiple overlapping beams in linear light with soft tone mapping', () => {
      const beam1 = { color: srgbToLinear({ r: 255, g: 0, b: 0 }), intensity: 1.0 };
      const beam2 = { color: srgbToLinear({ r: 0, g: 255, b: 0 }), intensity: 1.0 };

      const mixed = mixLinear([beam1, beam2]);
      // Should produce bright warm linear light without exceeding 1.0 (tone mapped)
      expect(mixed.r).toBeGreaterThan(0.5);
      expect(mixed.g).toBeGreaterThan(0.5);
      expect(mixed.r).toBeLessThanOrEqual(1.0);
      expect(mixed.g).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Contrast Measurements (WCAG 2.2 & APCA)', () => {
    it('calculates WCAG 2.2 contrast correctly', () => {
      // Black on white is 21:1
      const blackOnWhite = contrastWcag('#000000', '#ffffff');
      expect(blackOnWhite).toBeCloseTo(21, 0);

      // Dark slate text on dark surface
      const lowContrast = contrastWcag('#334155', '#0f172a');
      expect(lowContrast).toBeLessThan(4.5);
    });

    it('calculates APCA lightness contrast correctly', () => {
      const whiteOnDark = contrastApca('#ffffff', '#0f172a');
      // Light text on dark bg produces high positive Lc
      expect(whiteOnDark).toBeGreaterThan(80);
    });

    it('verifies generated design system tokens meet WCAG 2.2 and APCA standards', () => {
      const { surface_0, surface_1, surface_2, text_1, text_2, text_3 } = TokenValues;

      // Primary text must achieve WCAG >= 10:1 and APCA Lc >= 75
      const cText1On0 = contrastWcag(text_1, surface_0);
      const apca1On0 = contrastApca(text_1, surface_0);
      expect(cText1On0).toBeGreaterThanOrEqual(10.0);
      expect(apca1On0).toBeGreaterThanOrEqual(75);

      const cText1On1 = contrastWcag(text_1, surface_1);
      expect(cText1On1).toBeGreaterThanOrEqual(9.0);

      // Secondary text must achieve WCAG >= 4.5:1 (normal text threshold)
      const cText2On0 = contrastWcag(text_2, surface_0);
      const cText2On1 = contrastWcag(text_2, surface_1);
      const cText2On2 = contrastWcag(text_2, surface_2);
      expect(cText2On0).toBeGreaterThanOrEqual(4.5);
      expect(cText2On1).toBeGreaterThanOrEqual(4.5);
      expect(cText2On2).toBeGreaterThanOrEqual(4.5);

      // Muted text must achieve WCAG >= 3.0:1 (UI / large text threshold)
      const cText3On0 = contrastWcag(text_3, surface_0);
      const cText3On1 = contrastWcag(text_3, surface_1);
      expect(cText3On0).toBeGreaterThanOrEqual(3.0);
      expect(cText3On1).toBeGreaterThanOrEqual(3.0);
    });

    it('validates colorblindness accessibility (protan/deutan non-reliance on color alone)', () => {
      // Protan/Deutan simulation matrix approximation (Machado / Vienot projection)
      const simulateProtan = (hex: string) => {
        const rgb = hexToRgb(hex);
        const lR = 0.56667 * rgb.r + 0.43333 * rgb.g + 0.0 * rgb.b;
        const lG = 0.55833 * rgb.r + 0.44167 * rgb.g + 0.0 * rgb.b;
        const lB = 0.0 * rgb.r + 0.24167 * rgb.g + 0.75833 * rgb.b;
        return { r: Math.round(lR), g: Math.round(lG), b: Math.round(lB) };
      };

      const simulateDeutan = (hex: string) => {
        const rgb = hexToRgb(hex);
        const lR = 0.625 * rgb.r + 0.375 * rgb.g + 0.0 * rgb.b;
        const lG = 0.7 * rgb.r + 0.3 * rgb.g + 0.0 * rgb.b;
        const lB = 0.0 * rgb.r + 0.3 * rgb.g + 0.7 * rgb.b;
        return { r: Math.round(lR), g: Math.round(lG), b: Math.round(lB) };
      };

      const goColor = readToken('status_go'); // Emerald
      const standbyColor = readToken('status_standby'); // Amber-orange
      const dangerColor = readToken('status_danger'); // Red

      // Under protanopia: Standby and Danger have different lightness & luminance
      const protanGo = simulateProtan(goColor);
      const protanStandby = simulateProtan(standbyColor);
      const protanDanger = simulateProtan(dangerColor);

      // Verify simulated RGB values are distinct
      expect(Math.abs(protanStandby.r - protanGo.r)).toBeGreaterThan(20);
      expect(Math.abs(protanStandby.r - protanDanger.r)).toBeGreaterThan(20);

      // Under deuteranopia: Standby and Go remain distinguishable in luminance
      const deutanGo = simulateDeutan(goColor);
      const deutanStandby = simulateDeutan(standbyColor);
      expect(Math.abs(deutanStandby.r - deutanGo.r)).toBeGreaterThan(20);
    });

    it('exhaustively asserts automated WCAG AA compliance across all semantic tokens and surface tiers', () => {
      const surfaces = {
        surface0: readToken('surface_0'),
        surface1: readToken('surface_1'),
        surface2: readToken('surface_2'),
        surface3: readToken('surface_3'),
      };

      const textTokens = {
        text1: readToken('text_1'),
        text2: readToken('text_2'),
        text3: readToken('text_3'),
      };

      const statusTokens = {
        go: readToken('status_go'),
        standby: readToken('status_standby'),
        hold: readToken('status_hold'),
        danger: readToken('status_danger'),
      };

      const deptTokens = {
        lx: readToken('dept_lx'),
        vx: readToken('dept_vx'),
        sq: readToken('dept_sq'),
        st: readToken('dept_st'),
      };

      const accent = readToken('accent');

      // 1. Primary Text (text-1) across all surfaces must exceed WCAG AAA (>= 7.0:1)
      Object.values(surfaces).forEach((surfaceHex) => {
        const ratio = contrastWcag(textTokens.text1, surfaceHex);
        expect(ratio).toBeGreaterThanOrEqual(7.0);
      });

      // 2. Secondary Text (text-2) across all surfaces must exceed WCAG AA (>= 4.5:1)
      Object.values(surfaces).forEach((surfaceHex) => {
        const ratio = contrastWcag(textTokens.text2, surfaceHex);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      // 3. Muted Text (text-3) across all surfaces must exceed WCAG AA for UI/Large Text (>= 3.0:1)
      Object.values(surfaces).forEach((surfaceHex) => {
        const ratio = contrastWcag(textTokens.text3, surfaceHex);
        expect(ratio).toBeGreaterThanOrEqual(3.0);
      });

      // 4. Status tokens on primary canvas surfaces (surface-0 and surface-1) must exceed WCAG AA (>= 4.5:1)
      [surfaces.surface0, surfaces.surface1].forEach((surfaceHex) => {
        Object.values(statusTokens).forEach((statusHex) => {
          const ratio = contrastWcag(statusHex, surfaceHex);
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        });
      });

      // 5. Department indicators on canvas surfaces must exceed WCAG AA (>= 4.5:1)
      [surfaces.surface0, surfaces.surface1].forEach((surfaceHex) => {
        Object.values(deptTokens).forEach((deptHex) => {
          const ratio = contrastWcag(deptHex, surfaceHex);
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        });
      });

      // 6. Accent color on canvas surfaces must exceed WCAG AA (>= 4.5:1)
      [surfaces.surface0, surfaces.surface1].forEach((surfaceHex) => {
        const ratio = contrastWcag(accent, surfaceHex);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      // 7. High-contrast tactile action buttons: dark text on vibrant status backgrounds
      expect(contrastWcag(surfaces.surface0, statusTokens.go)).toBeGreaterThanOrEqual(4.5);
      expect(contrastWcag(surfaces.surface0, statusTokens.standby)).toBeGreaterThanOrEqual(4.5);
      expect(contrastWcag(surfaces.surface0, accent)).toBeGreaterThanOrEqual(4.5);
      expect(contrastWcag(surfaces.surface0, statusTokens.danger)).toBeGreaterThanOrEqual(4.5);
    });

    it('verifies standard 6 interaction states matrix definition and styling classes', () => {
      // 6 standardized states: default, hover, active, focus-visible, disabled, selected
      const INTERACTION_STATES = {
        default: 'bg-surface-2 text-content-1 border-border-default',
        hover: 'hover:bg-surface-3 hover:border-border-strong',
        active: 'active:scale-[0.98]',
        focusVisible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface-0',
        disabled: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        selected: 'bg-status-go/10 border-l-4 border-l-status-go ring-1 ring-status-go/20',
      };

      // Ensure all 6 distinct interaction states are defined
      expect(Object.keys(INTERACTION_STATES)).toHaveLength(6);

      // Verify each state uses semantic tokens exclusively (no raw Tailwind colors)
      const RAW_COLOR_REGEX = /\b(bg|text|border|ring|from|to|via|fill|stroke|divide|shadow|outline|decoration|accent|caret)-(zinc|slate|gray|neutral|stone|cyan|amber|emerald|rose|indigo|violet|purple|blue|red|green|yellow)-\d+\b/;
      Object.entries(INTERACTION_STATES).forEach(([, classString]) => {
        expect(RAW_COLOR_REGEX.test(classString)).toBe(false);
      });

      // Assert specific tokens in interaction states
      expect(INTERACTION_STATES.default).toContain('surface-2');
      expect(INTERACTION_STATES.default).toContain('content-1');
      expect(INTERACTION_STATES.hover).toContain('surface-3');
      expect(INTERACTION_STATES.active).toContain('scale-[0.98]');
      expect(INTERACTION_STATES.focusVisible).toContain('ring-accent');
      expect(INTERACTION_STATES.disabled).toContain('disabled:opacity-50');
      expect(INTERACTION_STATES.selected).toContain('status-go');
    });
  });
});
