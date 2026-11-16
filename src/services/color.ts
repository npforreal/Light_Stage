/**
 * Color Science Engine for Light Stage
 * Pure mathematical functions for color conversion, gamut mapping, Kelvin, gel, and linear lighting synthesis.
 * Refer to docs/COLOR_COURSE.md
 */

export interface RgbColor {
  r: number; // 0 - 255
  g: number; // 0 - 255
  b: number; // 0 - 255
}

export interface LinearRgbColor {
  r: number; // 0.0 - 1.0 (or > 1.0 in HDR/additive light)
  g: number;
  b: number;
}

export interface OklchColor {
  l: number; // 0.0 - 1.0 (perceptual lightness)
  c: number; // >= 0.0 (chroma)
  h: number; // 0 - 360 (hue angle in degrees)
}

export interface GamutMapResult {
  color: RgbColor;
  linear: LinearRgbColor;
  oklch: OklchColor;
  outOfGamut: boolean;
}

export type DimmerCurve = 'linear' | 'square' | 'cube';

// ==========================================
// 1. sRGB <-> Linear Transfer Functions
// ==========================================

export function srgbChannelToLinear(c: number): number {
  const norm = Math.max(0, Math.min(1, c / 255));
  if (norm <= 0.04045) {
    return norm / 12.92;
  }
  return Math.pow((norm + 0.055) / 1.055, 2.4);
}

export function linearChannelToSrgb(cLin: number): number {
  const clamped = Math.max(0, Math.min(1, cLin));
  let srgbNorm: number;
  if (clamped <= 0.0031308) {
    srgbNorm = clamped * 12.92;
  } else {
    srgbNorm = 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  }
  return Math.round(Math.max(0, Math.min(255, srgbNorm * 255)));
}

export function srgbToLinear(rgb: RgbColor): LinearRgbColor {
  return {
    r: srgbChannelToLinear(rgb.r),
    g: srgbChannelToLinear(rgb.g),
    b: srgbChannelToLinear(rgb.b),
  };
}

export function linearToSrgb(lin: LinearRgbColor): RgbColor {
  return {
    r: linearChannelToSrgb(lin.r),
    g: linearChannelToSrgb(lin.g),
    b: linearChannelToSrgb(lin.b),
  };
}

export function hexToRgb(hex: string): RgbColor {
  let clean = hex.replace(/^#/, '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 0, g: 0, b: 0 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(rgb: RgbColor): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

// ==========================================
// 2. Linear sRGB <-> Oklab & OKLCH (Ottosson)
// ==========================================

export function linearToOklab(lin: LinearRgbColor): { l: number; a: number; b: number } {
  // Linear RGB to LMS
  const l_ = 0.4122214708 * lin.r + 0.5363325363 * lin.g + 0.0514459929 * lin.b;
  const m_ = 0.2119034982 * lin.r + 0.6806995451 * lin.g + 0.1073969566 * lin.b;
  const s_ = 0.0883024619 * lin.r + 0.2817188376 * lin.g + 0.6299787005 * lin.b;

  const cbrt = (x: number) => (x < 0 ? -Math.cbrt(-x) : Math.cbrt(x));
  const l = cbrt(l_);
  const m = cbrt(m_);
  const s = cbrt(s_);

  return {
    l: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  };
}

export function oklabToLinear(lab: { l: number; a: number; b: number }): LinearRgbColor {
  const l_ = lab.l + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
  const m_ = lab.l - 0.1055613458 * lab.a - 0.0638541728 * lab.b;
  const s_ = lab.l - 0.0894841775 * lab.a - 1.2914855480 * lab.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return {
    r: +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  };
}

export function oklabToOklch(lab: { l: number; a: number; b: number }): OklchColor {
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: lab.l, c, h };
}

export function oklchToOklab(lch: OklchColor): { l: number; a: number; b: number } {
  const rad = (lch.h * Math.PI) / 180;
  return {
    l: lch.l,
    a: lch.c * Math.cos(rad),
    b: lch.c * Math.sin(rad),
  };
}

export function hexToOklch(hex: string): OklchColor {
  const rgb = hexToRgb(hex);
  const lin = srgbToLinear(rgb);
  const lab = linearToOklab(lin);
  return oklabToOklch(lab);
}

export function oklchToHex(lch: OklchColor): string {
  const mapped = gamutMap(lch);
  return rgbToHex(mapped.color);
}

// ==========================================
// 3. Gamut Mapping (Preserve L & H, reduce C)
// ==========================================

export function isLinearInGamut(lin: LinearRgbColor, eps = 1e-4): boolean {
  return (
    lin.r >= -eps &&
    lin.r <= 1 + eps &&
    lin.g >= -eps &&
    lin.g <= 1 + eps &&
    lin.b >= -eps &&
    lin.b <= 1 + eps
  );
}

export function gamutMap(lch: OklchColor): GamutMapResult {
  const initialLab = oklchToOklab(lch);
  const initialLin = oklabToLinear(initialLab);

  if (isLinearInGamut(initialLin)) {
    const srgb = linearToSrgb(initialLin);
    return {
      color: srgb,
      linear: initialLin,
      oklch: lch,
      outOfGamut: false,
    };
  }

  // Binary search to find highest Chroma inside sRGB gamut
  let low = 0;
  let high = lch.c;
  let bestLin = initialLin;
  let bestC = 0;

  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const testLab = oklchToOklab({ l: lch.l, c: mid, h: lch.h });
    const testLin = oklabToLinear(testLab);

    if (isLinearInGamut(testLin)) {
      bestC = mid;
      bestLin = testLin;
      low = mid;
    } else {
      high = mid;
    }
  }

  const clampedLin: LinearRgbColor = {
    r: Math.max(0, Math.min(1, bestLin.r)),
    g: Math.max(0, Math.min(1, bestLin.g)),
    b: Math.max(0, Math.min(1, bestLin.b)),
  };

  return {
    color: linearToSrgb(clampedLin),
    linear: clampedLin,
    oklch: { l: lch.l, c: bestC, h: lch.h },
    outOfGamut: true,
  };
}

// ==========================================
// 4. Color Physics: Kelvin, CMY, RGBW, xy
// ==========================================

/**
 * Kelvin to sRGB using Tanner Helland algorithm (1000K - 40000K)
 */
export function kelvinToRgb(kelvin: number): RgbColor {
  const k = Math.max(1000, Math.min(40000, kelvin));
  const t = k / 100;

  let r = 0;
  let g = 0;
  let b = 0;

  // Calculate Red
  if (t <= 66) {
    r = 255;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
  }

  // Calculate Green
  if (t <= 66) {
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
  } else {
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  }

  // Calculate Blue
  if (t >= 66) {
    b = 255;
  } else if (t <= 19) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  }

  return {
    r: Math.max(0, Math.min(255, Math.round(r))),
    g: Math.max(0, Math.min(255, Math.round(g))),
    b: Math.max(0, Math.min(255, Math.round(b))),
  };
}

/**
 * Subtractive CMY to Linear RGB
 * c, m, y in range 0 - 100
 */
export function cmyToLinearRgb(c: number, m: number, y: number): LinearRgbColor {
  const normC = Math.max(0, Math.min(100, c)) / 100;
  const normM = Math.max(0, Math.min(100, m)) / 100;
  const normY = Math.max(0, Math.min(100, y)) / 100;

  // Subtractive white light filter
  return {
    r: 1 - normC,
    g: 1 - normM,
    b: 1 - normY,
  };
}

/**
 * Additive RGBW to Linear RGB
 * r, g, b, w in range 0 - 255
 */
export function rgbwToLinearRgb(r: number, g: number, b: number, w: number): LinearRgbColor {
  const linR = srgbChannelToLinear(r);
  const linG = srgbChannelToLinear(g);
  const linB = srgbChannelToLinear(b);
  const linW = srgbChannelToLinear(w);

  return {
    r: linR + linW,
    g: linG + linW,
    b: linB + linW,
  };
}

/**
 * Additive RGBA (Red, Green, Blue, Amber) to Linear RGB
 * r, g, b, a in range 0 - 255
 */
export function rgbaToLinearRgb(r: number, g: number, b: number, a: number): LinearRgbColor {
  const linR = srgbChannelToLinear(r);
  const linG = srgbChannelToLinear(g);
  const linB = srgbChannelToLinear(b);
  const linA = srgbChannelToLinear(a);

  // Amber LED emitter peak ~590nm (warm golden yellow)
  const amberLinearWeight = { r: 1.0, g: 0.45, b: 0.02 };

  return {
    r: linR + linA * amberLinearWeight.r,
    g: linG + linA * amberLinearWeight.g,
    b: linB + linA * amberLinearWeight.b,
  };
}

/**
 * CIE 1931 xy Chromaticity Coordinates to Linear sRGB
 */
export function xyToLinearRgb(x: number, y: number, Y = 1.0): LinearRgbColor {
  if (y <= 0) return { r: 0, g: 0, b: 0 };

  const X = (Y / y) * x;
  const Z = (Y / y) * (1 - x - y);

  // XYZ to sRGB Linear matrix (D65)
  return {
    r: +3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z,
    g: -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z,
    b: +0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z,
  };
}

// ==========================================
// 5. Light Synthesis: Dimmer & Linear Beam Mixing
// ==========================================

export function applyDimmer(intensity: number, curve: DimmerCurve = 'square'): number {
  const v = Math.max(0, Math.min(100, intensity)) / 100;
  switch (curve) {
    case 'linear':
      return v;
    case 'cube':
      return v * v * v;
    case 'square':
    default:
      return v * v;
  }
}

/**
 * Mix multiple overlapping light beams in linear optical space with soft tone mapping
 */
export function mixLinear(beams: { color: LinearRgbColor; intensity: number }[]): LinearRgbColor {
  let accR = 0;
  let accG = 0;
  let accB = 0;

  for (const b of beams) {
    accR += b.color.r * b.intensity;
    accG += b.color.g * b.intensity;
    accB += b.color.b * b.intensity;
  }

  // Soft Reinhard tone mapping for stage lights (preserves highlights without harsh clipping)
  const toneMap = (v: number) => v / (1 + 0.25 * v);

  return {
    r: toneMap(accR),
    g: toneMap(accG),
    b: toneMap(accB),
  };
}

// ==========================================
// 6. Contrast Analysis (WCAG 2.2 & APCA)
// ==========================================

export function getRelativeLuminance(rgb: RgbColor): number {
  const r = srgbChannelToLinear(rgb.r);
  const g = srgbChannelToLinear(rgb.g);
  const b = srgbChannelToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastWcag(fg: RgbColor | string, bg: RgbColor | string): number {
  const fgRgb = typeof fg === 'string' ? hexToRgb(fg) : fg;
  const bgRgb = typeof bg === 'string' ? hexToRgb(bg) : bg;

  const l1 = getRelativeLuminance(fgRgb);
  const l2 = getRelativeLuminance(bgRgb);

  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (brighter + 0.05) / (darker + 0.05);
}

/**
 * APCA Lightness Contrast (Lc) approximation for dark-theme UI
 * Positive Lc indicates light text on dark background
 */
export function contrastApca(fg: RgbColor | string, bg: RgbColor | string): number {
  const fgRgb = typeof fg === 'string' ? hexToRgb(fg) : fg;
  const bgRgb = typeof bg === 'string' ? hexToRgb(bg) : bg;

  const yTxt = 0.2126729 * srgbChannelToLinear(fgRgb.r) + 0.7151522 * srgbChannelToLinear(fgRgb.g) + 0.072175 * srgbChannelToLinear(fgRgb.b);
  const yBg = 0.2126729 * srgbChannelToLinear(bgRgb.r) + 0.7151522 * srgbChannelToLinear(bgRgb.g) + 0.072175 * srgbChannelToLinear(bgRgb.b);

  // Dark background polarity (light text on dark surface)
  if (yTxt >= yBg) {
    const sTxt = Math.pow(yTxt, 0.62);
    const sBg = Math.pow(yBg, 0.56);
    return (sTxt - sBg) * 100;
  } else {
    const sTxt = Math.pow(yTxt, 0.56);
    const sBg = Math.pow(yBg, 0.62);
    return -(sBg - sTxt) * 100;
  }
}
