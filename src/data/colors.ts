/**
 * Stage Lighting Color Presets & Gel Database
 * Standard Lee, Rosco, Kelvin temperatures and named stage colors.
 * Refer to docs/COLOR_COURSE.md
 */

import { LightingColor } from '../types/stage';
import {
  LinearRgbColor,
  srgbToLinear,
  linearToSrgb,
  rgbToHex,
  hexToRgb,
  kelvinToRgb,
  cmyToLinearRgb,
  rgbwToLinearRgb,
  rgbaToLinearRgb,
  xyToLinearRgb,
} from '../services/color';

export interface GelEntry {
  code: string;
  name: string;
  brand: 'Lee' | 'Rosco' | 'GamColor';
  xy: { x: number; y: number; Y?: number };
  approx?: boolean;
}

export interface NamedColorEntry {
  name: string;
  aliases: string[];
  hex: string;
  kelvin?: number;
  description: string;
}

export const GEL_DATABASE: Record<string, GelEntry> = {
  // Verified CIE 1931 xy coordinates under Source A / D65
  L201: {
    code: 'L201',
    name: 'Full C.T. Blue',
    brand: 'Lee',
    xy: { x: 0.211, y: 0.231, Y: 0.34 },
    approx: false,
  },
  L204: {
    code: 'L204',
    name: 'Full C.T. Orange',
    brand: 'Lee',
    xy: { x: 0.548, y: 0.413, Y: 0.58 },
    approx: false,
  },
  R02: {
    code: 'R02',
    name: 'Bastard Amber',
    brand: 'Rosco',
    xy: { x: 0.472, y: 0.415, Y: 0.78 },
    approx: false,
  },
  R26: {
    code: 'R26',
    name: 'Light Red',
    brand: 'Rosco',
    xy: { x: 0.69, y: 0.308, Y: 0.12 },
    approx: false,
  },
  R80: {
    code: 'R80',
    name: 'Primary Blue',
    brand: 'Rosco',
    xy: { x: 0.16, y: 0.135, Y: 0.08 },
    approx: false,
  },
  R3114: {
    code: 'R3114',
    name: 'Tough UV Filter',
    brand: 'Rosco',
    xy: { x: 0.313, y: 0.329, Y: 0.9 },
    approx: false,
  },
};

export const NAMED_STAGE_COLORS: NamedColorEntry[] = [
  {
    name: 'Warm Tungsten (2700K)',
    aliases: ['tungsten', '2700k', 'vàng ấm', 'bóng sợi đốt'],
    hex: '#ffb366',
    kelvin: 2700,
    description: 'Ấm cúng, tự nhiên, bóng đèn sợi đốt',
  },
  {
    name: 'Studio Halogen (3200K)',
    aliases: ['halogen', '3200k', 'studio', 'vàng nhạt'],
    hex: '#ffd199',
    kelvin: 3200,
    description: 'Ánh sáng sân khấu studio tiêu chuẩn',
  },
  {
    name: 'Daylight (5600K)',
    aliases: ['daylight', '5600k', 'trắng tự nhiên'],
    hex: '#f5f7ff',
    kelvin: 5600,
    description: 'Ánh sáng ban ngày tự nhiên',
  },
  {
    name: 'Cool White (6500K)',
    aliases: ['cool white', '6500k', 'trắng lạnh', 'led trắng'],
    hex: '#ffffff',
    kelvin: 6500,
    description: 'Ánh sáng trắng lạnh LED',
  },
  {
    name: 'Amber',
    aliases: ['amber', 'hổ phách', 'vàng cam'],
    hex: '#ff9900',
    description: 'Ánh sáng hổ phách ấm áp rực rỡ',
  },
  {
    name: 'CTO (Color Temperature Orange)',
    aliases: ['cto', 'full cto', 'cam lọc nhiệt'],
    hex: '#ff9e42',
    description: 'Kính lọc chuyển đổi sang ánh sáng ấm',
  },
  {
    name: 'CTB (Color Temperature Blue)',
    aliases: ['ctb', 'full ctb', 'xanh lọc nhiệt'],
    hex: '#70b5ff',
    description: 'Kính lọc chuyển đổi sang ánh sáng lạnh',
  },
  {
    name: 'Đỏ Sân Khấu (Stage Red)',
    aliases: ['đỏ', 'red', 'đỏ rực', 'crimson'],
    hex: '#ef4444',
    description: 'Màu đỏ kịch tính, cao trào',
  },
  {
    name: 'Xanh Lá (Stage Green)',
    aliases: ['xanh lá', 'green', 'lục'],
    hex: '#10b981',
    description: 'Màu xanh lá tươi sáng',
  },
  {
    name: 'Xanh Dương (Primary Blue)',
    aliases: ['xanh dương', 'blue', 'xanh đậm', 'cobalt', 'xanh biển', 'xanh'],
    hex: '#2563eb',
    description: 'Màu xanh dương sâu thẳm',
  },
  {
    name: 'Vàng Sân Khấu (Stage Yellow)',
    aliases: ['vàng', 'yellow', 'vàng tươi'],
    hex: '#eab308',
    description: 'Màu vàng sân khấu rực rỡ',
  },
  {
    name: 'Cam (Stage Orange)',
    aliases: ['cam', 'orange', 'màu cam'],
    hex: '#f97316',
    description: 'Màu cam ấm áp',
  },
  {
    name: 'Tím Sân Khấu (Stage Violet)',
    aliases: ['tím', 'purple', 'violet', 'tím huế'],
    hex: '#a855f7',
    description: 'Màu tím huyền ảo kịch tính',
  },
  {
    name: 'Trắng Sân Khấu (Stage White)',
    aliases: ['trắng', 'white', 'bạch'],
    hex: '#ffffff',
    kelvin: 6500,
    description: 'Ánh sáng trắng sân khấu',
  },
  {
    name: 'Magenta / Hồng Tím',
    aliases: ['magenta', 'hồng', 'tím hồng', 'pink'],
    hex: '#d946ef',
    description: 'Màu hồng tím rực rỡ phong cách festival',
  },
  {
    name: 'Cyan / Xanh Lơ',
    aliases: ['cyan', 'xanh lơ', 'sky'],
    hex: '#06b6d4',
    description: 'Màu xanh lơ hiện đại',
  },
];

/**
 * Resolves any LightingColor or legacy string to a LinearRgbColor
 */
export function resolveLightingColorToLinear(color?: LightingColor | string): LinearRgbColor {
  if (!color) {
    // Default cyan-sky
    return srgbToLinear({ r: 56, g: 189, b: 248 });
  }

  if (typeof color === 'string') {
    return srgbToLinear(hexToRgb(color));
  }

  switch (color.mode) {
    case 'rgb': {
      if (color.hex) {
        return srgbToLinear(hexToRgb(color.hex));
      }
      return srgbToLinear({
        r: color.r ?? 0,
        g: color.g ?? 0,
        b: color.b ?? 0,
      });
    }
    case 'kelvin': {
      const rgb = kelvinToRgb(color.kelvin);
      return srgbToLinear(rgb);
    }
    case 'cmy': {
      return cmyToLinearRgb(color.c, color.m, color.y);
    }
    case 'rgbw': {
      return rgbwToLinearRgb(color.r, color.g, color.b, color.w);
    }
    case 'rgba': {
      return rgbaToLinearRgb(color.r, color.g, color.b, color.a);
    }
    case 'gel': {
      const gel = GEL_DATABASE[color.code.toUpperCase()];
      if (gel) {
        return xyToLinearRgb(gel.xy.x, gel.xy.y, gel.xy.Y ?? 1.0);
      }
      return srgbToLinear({ r: 255, g: 200, b: 120 });
    }
    case 'name': {
      const lower = color.name.toLowerCase().trim();
      const match = NAMED_STAGE_COLORS.find(
        (c) => c.name.toLowerCase().includes(lower) || c.aliases.some((a) => lower.includes(a))
      );
      if (match) {
        if (match.kelvin) {
          return srgbToLinear(kelvinToRgb(match.kelvin));
        }
        return srgbToLinear(hexToRgb(match.hex));
      }
      return srgbToLinear({ r: 56, g: 189, b: 248 });
    }
    default:
      return srgbToLinear({ r: 56, g: 189, b: 248 });
  }
}

/**
 * Resolves any LightingColor to a standard display hex string (#rrggbb)
 */
export function resolveLightingColorToHex(color?: LightingColor | string): string {
  if (typeof color === 'string') {
    return color.startsWith('#') ? color : `#${color}`;
  }
  const lin = resolveLightingColorToLinear(color);
  const srgb = linearToSrgb(lin);
  return rgbToHex(srgb);
}

/**
 * Returns a human-friendly short badge text for the color (e.g. "3200K", "L201", "Amber", "#ff0000")
 */
export function getLightingColorLabel(color?: LightingColor | string): string {
  if (!color) return 'Cyan';
  if (typeof color === 'string') return color.toUpperCase();

  switch (color.mode) {
    case 'kelvin':
      return `${color.kelvin}K`;
    case 'gel':
      return color.code.toUpperCase();
    case 'name':
      return color.name;
    case 'cmy':
      return `C${color.c} M${color.m} Y${color.y}`;
    case 'rgbw':
      return `RGBW(${color.r},${color.g},${color.b},${color.w})`;
    case 'rgba':
      return `RGBA(${color.r},${color.g},${color.b},${color.a})`;
    case 'rgb':
    default:
      return color.hex ? color.hex.toUpperCase() : `R${color.r ?? 0} G${color.g ?? 0} B${color.b ?? 0}`;
  }
}
