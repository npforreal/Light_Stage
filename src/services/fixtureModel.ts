/**
 * Fixture Model — Single source of truth for lighting fixture quantities.
 *
 * Rule: the structured device list (`LightingCue.fixtures`: type × count × position)
 * is authoritative. `fixtureCount` and `Cue.totalLightingFixtures` are derived
 * caches and must never be edited independently.
 *
 * Used by: useShowStore (writes), persistence (migration), RundownTable (editing),
 * VirtualStagePreview (placement), exporter (reports).
 */
import {
  Cue,
  DepartmentCues,
  DeviceSpecification,
  LightingCue,
  LightingFixtureType,
  Show,
  VisualCue,
  calculateCueDeviceCounts,
  sumDeviceCounts,
} from '../types/stage';
import { parseHardwareFromText } from './hardwareParser';

export const UNCLASSIFIED_LABEL = 'Chưa phân loại';

export const LIGHTING_FIXTURE_TYPES: LightingFixtureType[] = [
  'Beam',
  'Spot',
  'Wash',
  'ParLED',
  'Blinder',
  'Follow',
  'Laser',
  'Strobe',
  'Smoke',
  'Other',
];

let deviceSequence = 0;

/** Creates a device specification with a unique id. */
export function createDeviceSpec(partial: Partial<DeviceSpecification> = {}): DeviceSpecification {
  deviceSequence += 1;
  const id = `fix-${Date.now().toString(36)}-${deviceSequence}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    name: partial.name || partial.subType || 'Fixture',
    category: partial.category || 'Lighting',
    subType: partial.subType || 'Other',
    count: Math.max(1, Math.floor(Number(partial.count) || 1)),
    position: partial.position,
    notes: partial.notes,
    color: partial.color,
  };
}

/** A legacy cue with only a number becomes one explicit "Chưa phân loại × N" row. */
export function createUnclassifiedSpec(count: number): DeviceSpecification {
  return createDeviceSpec({
    name: UNCLASSIFIED_LABEL,
    subType: 'Other',
    count: Math.max(0, Math.floor(Number(count) || 0)),
  });
}

export function isUnclassifiedSpec(spec: DeviceSpecification): boolean {
  return spec.subType === 'Other' || spec.name === UNCLASSIFIED_LABEL;
}

function isValidSpec(spec: DeviceSpecification | undefined | null): spec is DeviceSpecification {
  return Boolean(spec) && Number.isFinite(Number(spec!.count)) && Number(spec!.count) > 0;
}

/** Parses a freeform fixture description into structured rows (positions included). */
export function parseFixtureText(text: string): DeviceSpecification[] {
  if (!text || typeof text !== 'string') return [];
  return parseHardwareFromText(text, 'Lighting')
    .filter((spec) => spec.category === 'Lighting')
    .map((spec) => ({ ...spec, count: Math.max(1, Math.floor(spec.count)) }));
}

/** Renders structured rows back into the quick-entry syntax, e.g. `Beam x8 @FOH`. */
export function formatFixtureSummary(fixtures: DeviceSpecification[]): string {
  return fixtures
    .filter(isValidSpec)
    .map((spec) => {
      const label = spec.name || spec.subType || UNCLASSIFIED_LABEL;
      const position = spec.position ? ` @${spec.position}` : '';
      return `${label} x${Math.floor(spec.count)}${position}`;
    })
    .join(', ');
}

/**
 * Normalizes a lighting cue so its derived fields match the device list.
 * Migration: legacy cues with only `fixtureCount` get a single unclassified row.
 */
export function normalizeLightingCue(lx?: LightingCue): LightingCue | undefined {
  if (!lx) return undefined;

  let fixtures = Array.isArray(lx.fixtures) ? lx.fixtures.filter(isValidSpec) : [];

  if (fixtures.length === 0 && typeof lx.fixtureSummary === 'string' && lx.fixtureSummary.trim()) {
    fixtures = parseFixtureText(lx.fixtureSummary);
  }

  if (fixtures.length === 0 && Number(lx.fixtureCount) > 0) {
    fixtures = [createUnclassifiedSpec(Number(lx.fixtureCount))];
  }

  const fixtureCount = sumDeviceCounts(fixtures);
  const summary = typeof lx.fixtureSummary === 'string' ? lx.fixtureSummary.trim() : '';

  return {
    ...lx,
    fixtures: fixtures.length > 0 ? fixtures : undefined,
    fixtureCount,
    fixtureSummary: summary || (fixtures.length > 0 ? formatFixtureSummary(fixtures) : undefined),
  };
}

/** Normalizes a visual cue so `screenCount` matches the screen list when present. */
export function normalizeVisualCue(vx?: VisualCue): VisualCue | undefined {
  if (!vx) return undefined;
  const screens = Array.isArray(vx.screens) ? vx.screens.filter(isValidSpec) : [];
  const screenCount = screens.length > 0 ? sumDeviceCounts(screens) : (vx.screenCount ?? 0);
  return { ...vx, screens: screens.length > 0 ? screens : undefined, screenCount };
}

export function normalizeDepartments(departments: DepartmentCues = {}): DepartmentCues {
  return {
    ...departments,
    lx: normalizeLightingCue(departments.lx),
    vx: normalizeVisualCue(departments.vx),
  };
}

/** Normalizes a cue and recomputes the cached totals from the device lists. */
export function normalizeCue(cue: Cue): Cue {
  const departments = normalizeDepartments(cue.departments);
  const counts = calculateCueDeviceCounts(departments);
  return {
    ...cue,
    departments,
    totalLightingFixtures: counts.lightingCount,
    totalScreens: counts.screenCount,
  };
}

/** Migrates a whole show (acts + cues) to the device-list source of truth. */
export function normalizeShow(show: Show): Show {
  return {
    ...show,
    acts: show.acts.map((act) => ({
      ...act,
      cues: act.cues.map(normalizeCue),
    })),
  };
}

/** Lighting fixture count for a cue, derived from the device list. */
export function getCueLightingCount(cue: Cue): number {
  return calculateCueDeviceCounts(cue.departments).lightingCount;
}

/** Screen count for a cue, derived from the screen list. */
export function getCueScreenCount(cue: Cue): number {
  return calculateCueDeviceCounts(cue.departments).screenCount;
}

/** Rows for the structured editor: never empty for a cue that declares fixtures. */
export function getEditableFixtures(lx?: LightingCue): DeviceSpecification[] {
  const normalized = normalizeLightingCue(lx);
  return normalized?.fixtures ?? [];
}

/** True when any row needs the "Chưa phân loại" chip + warning. */
export function hasUnclassifiedFixtures(fixtures: DeviceSpecification[]): boolean {
  return fixtures.some(isUnclassifiedSpec);
}

/** Aggregated count by sub-type, used by Stage 2D badges and reports. */
export function countFixturesByType(fixtures: DeviceSpecification[]): Record<string, number> {
  const byType: Record<string, number> = {};
  for (const spec of fixtures.filter(isValidSpec)) {
    const key = String(spec.subType || 'Other');
    byType[key] = (byType[key] ?? 0) + Math.floor(spec.count);
  }
  return byType;
}
