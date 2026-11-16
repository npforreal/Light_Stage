/**
 * Stage 2D symbols, USITT-lite numbering, meter rulers and non-blocking warnings.
 * Pure helpers — no React, no store access.
 */
import { Fixture, FixtureType, StageConfig } from '../types/virtualStage';

export type FixtureSymbolShape =
  | 'circle'
  | 'circle-dot'
  | 'hex'
  | 'square'
  | 'diamond'
  | 'triangle'
  | 'cross'
  | 'ring'
  | 'chevron'
  | 'smoke';

export interface FixtureSymbolSpec {
  shape: FixtureSymbolShape;
  label: string;
  /** Optional short glyph used in the compact legend. */
  glyph: string;
}

/**
 * Distinct symbols per fixture type so a light plot can be read without colour.
 * Shape is the primary differentiator (colour-blind safe); the lit colour only
 * fills the symbol when the fixture is active.
 */
export const FIXTURE_SYMBOLS: Record<FixtureType, FixtureSymbolSpec> = {
  Beam: { shape: 'triangle', label: 'Beam', glyph: '▲' },
  Spot: { shape: 'circle-dot', label: 'Spot', glyph: '◎' },
  Wash: { shape: 'hex', label: 'Wash', glyph: '⬡' },
  Follow: { shape: 'ring', label: 'Follow', glyph: '◌' },
  Blinder: { shape: 'square', label: 'Blinder', glyph: '■' },
  Strobe: { shape: 'cross', label: 'Strobe', glyph: '✚' },
  Par: { shape: 'diamond', label: 'Par', glyph: '◆' },
  Laser: { shape: 'chevron', label: 'Laser', glyph: '▷' },
  Smoke: { shape: 'smoke', label: 'Smoke', glyph: '≈' },
};

export interface NumberableFixture {
  id: string;
  x: number;
  y: number;
  z?: number;
  position?: string;
  isActive?: boolean;
}

function isBoomFixture(fixture: NumberableFixture): boolean {
  return /boom|ladder/i.test(String(fixture.position || ''));
}

/**
 * USITT-lite numbering: downstage → upstage, then Stage Left → Stage Right.
 * (x < 0 is SL, y < 0 is downstage / FOH.) Side booms are numbered top-down
 * by trim height. Only active fixtures are numbered.
 */
export function assignFixtureNumbers(fixtures: NumberableFixture[]): Record<string, number> {
  const ordered = fixtures
    .filter((fixture) => fixture.isActive !== false)
    .slice()
    .sort((a, b) => {
      if (isBoomFixture(a) && isBoomFixture(b)) {
        const az = a.z ?? 0;
        const bz = b.z ?? 0;
        if (Math.abs(az - bz) > 0.01) return bz - az;
      }
      if (Math.abs(a.y - b.y) > 0.01) return a.y - b.y;
      if (Math.abs(a.x - b.x) > 0.01) return a.x - b.x;
      return a.id.localeCompare(b.id);
    });

  const numbers: Record<string, number> = {};
  ordered.forEach((fixture, index) => {
    numbers[fixture.id] = index + 1;
  });
  return numbers;
}

export interface RulerTick {
  meters: number;
  major: boolean;
  label: string;
}

/** Meter ruler ticks across the stage width (0 at centerline). */
export function computeRulerTicks(widthMeters: number): RulerTick[] {
  const width = Math.max(5, widthMeters);
  const step = width <= 12 ? 1 : width <= 24 ? 2 : 4;
  const half = width / 2;
  const ticks: RulerTick[] = [];
  for (let meters = -Math.floor(half / step) * step; meters <= half + 0.001; meters += step) {
    const rounded = Math.round(meters * 10) / 10;
    const major = Math.abs(rounded % (step * 2)) < 0.001 || rounded === 0;
    ticks.push({
      meters: rounded,
      major,
      label: major ? `${rounded > 0 ? '+' : ''}${rounded}m` : '',
    });
  }
  return ticks;
}

export function formatMeters(value: number, digits = 1): string {
  return `${value.toFixed(digits)} m`;
}

/** Compact "legend" of the fixture types actually present in the rig or cue. */
export function getLegendTypes(
  fixtures: { type: FixtureType }[],
  requestedTypes: string[] = []
): FixtureType[] {
  const present = new Set<FixtureType>(fixtures.map((fixture) => fixture.type));
  for (const type of requestedTypes) {
    if (type in FIXTURE_SYMBOLS) present.add(type as FixtureType);
  }
  return Array.from(present).sort((a, b) => a.localeCompare(b));
}

export interface StageWarning {
  code: 'asymmetry' | 'missing-front' | 'missing-back' | 'truss-overload' | 'cue-exceeds-rig';
  severity: 'info' | 'warn';
  message: string;
}

export const STAGE_WARNING_LABELS: Record<StageWarning['code'], string> = {
  asymmetry: 'Lệch SL/SR',
  'missing-front': 'Thiếu front light',
  'missing-back': 'Thiếu back light',
  'truss-overload': 'Vượt tải truss',
  'cue-exceeds-rig': 'Cue vượt rig',
};

export interface StageWarningInput {
  config: StageConfig;
  placements: (Fixture & { isActive?: boolean; loadWatts?: number })[];
  requestedCount?: number;
}

/**
 * Non-blocking stage layout warnings. These never prevent a show from running;
 * they surface rigging/design issues the operator may want to fix.
 */
export function analyzeStageWarnings({
  config,
  placements,
  requestedCount = 0,
}: StageWarningInput): StageWarning[] {
  const warnings: StageWarning[] = [];
  const active = placements.filter((fixture) => fixture.isActive);
  if (active.length === 0) return warnings;

  // 1. Left/right imbalance (more than one fixture difference, or >20% skew)
  const left = active.filter((fixture) => fixture.x < -0.1).length;
  const right = active.filter((fixture) => fixture.x > 0.1).length;
  const imbalance = Math.abs(left - right);
  if (imbalance > 1 && imbalance / Math.max(left, right) > 0.2) {
    warnings.push({
      code: 'asymmetry',
      severity: 'warn',
      message: `Bố cục lệch trái/phải: SL ${left} · SR ${right} đèn đang sáng.`,
    });
  }

  // 2. Front light for the main acting area (FOH or a front-role fixture)
  const hasFrontLight = active.some(
    (fixture) => fixture.position === 'FOH' || fixture.role === 'front'
  );
  if (!hasFrontLight) {
    warnings.push({
      code: 'missing-front',
      severity: 'warn',
      message: 'Thiếu front light cho khu vực diễn chính (không có đèn FOH/front đang sáng).',
    });
  }

  // 3. Back light
  const hasBackLight = active.some(
    (fixture) => fixture.position === 'Back' || fixture.role === 'back'
  );
  if (!hasBackLight) {
    warnings.push({
      code: 'missing-back',
      severity: 'info',
      message: 'Thiếu back light: không có đèn Back/back-role đang sáng.',
    });
  }

  // 4. Truss load limit (sum of active fixture watts per position)
  for (const truss of config.trusses ?? []) {
    if (!truss.enabled || !truss.loadLimitWatts) continue;
    const load = active
      .filter((fixture) => fixture.position === truss.position)
      .reduce((sum, fixture) => sum + (fixture.loadWatts || 0), 0);
    if (load > truss.loadLimitWatts) {
      warnings.push({
        code: 'truss-overload',
        severity: 'warn',
        message: `${truss.name} vượt tải: ${(load / 1000).toFixed(1)} kW > giới hạn ${(
          truss.loadLimitWatts / 1000
        ).toFixed(1)} kW.`,
      });
    }
  }

  // 5. Cue uses more fixtures than the rig declares
  const rigCount = (config.fixtures ?? []).filter((fixture) => fixture.enabled !== false).length;
  if (requestedCount > 0 && rigCount > 0 && requestedCount > rigCount) {
    warnings.push({
      code: 'cue-exceeds-rig',
      severity: 'warn',
      message: `Cue yêu cầu ${requestedCount} đèn nhưng rig chỉ có ${rigCount} — đã mở rộng slot ảo.`,
    });
  }

  return warnings;
}
