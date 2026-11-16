import {
  StageConfig,
  Fixture,
  FixtureType,
  RigPosition,
  DEFAULT_BEAM_ANGLES,
  DEFAULT_FIXTURE_WATTS,
  DEFAULT_FIXTURE_ROLES,
  migrateLegacyStageConfig,
} from '../types/virtualStage';
import { LightingCue } from '../types/stage';

export interface CueFixtureRequirement {
  type: FixtureType;
  count: number;
  preferredPosition?: RigPosition | string;
  subType?: string;
  target?: string;
  raw?: string;
  /** True when the source type could not be recognized (drawn at a default slot). */
  unclassified?: boolean;
}

export interface PlacedFixture extends Fixture {
  isActive: boolean;
  isVirtualExpanded?: boolean;
  assignedRequirement?: string;
}

export interface PlacementResult {
  placements: PlacedFixture[];
  activeCount: number;
  requestedCount: number;
  byType: Record<string, { requested: number; placed: number; active: number }>;
  warnings: string[];
  isOverflown: boolean;
  totalLoadWatts: number;
}

/**
 * Professional Placement Rules by Fixture Type:
 * - Follow -> FOH (Center)
 * - Wash -> FOH + Mid truss
 * - Spot -> Mid truss + FOH
 * - Beam -> Back truss + Floor
 * - Blinder -> Floor (front stage) + Back truss
 * - Strobe -> Back truss + Floor
 * - Par -> FOH + Mid truss
 * - Laser -> Back truss + Floor
 */
export const DEFAULT_PLACEMENT_RULES: Record<FixtureType, RigPosition[]> = {
  Follow: ['FOH'],
  Wash: ['FOH', 'Truss', 'SideBoom'],
  Spot: ['Truss', 'FOH', 'SideBoom'],
  Beam: ['Truss', 'Floor'],
  Blinder: ['Floor', 'Truss'],
  Strobe: ['Truss', 'Floor'],
  Par: ['FOH', 'Truss'],
  Laser: ['Truss', 'Floor'],
  Smoke: ['Floor', 'Truss'],
};

/** Maps a cue device sub-type (or freeform name) onto a Stage 2D fixture type. */
export function mapSubTypeToFixtureType(subType?: string): FixtureType {
  const lower = String(subType || '').toLowerCase();
  if (lower.includes('beam')) return 'Beam';
  if (lower.includes('follow')) return 'Follow';
  if (lower.includes('wash')) return 'Wash';
  if (lower.includes('blinder')) return 'Blinder';
  if (lower.includes('strobe')) return 'Strobe';
  if (lower.includes('laser')) return 'Laser';
  if (lower.includes('smoke') || lower.includes('haze') || lower.includes('fog')) return 'Smoke';
  if (lower.includes('par')) return 'Par';
  if (lower.includes('spot')) return 'Spot';
  return 'Par';
}

/** Maps a freeform position label (e.g. 'Back-L', 'back', 'sân khấu') onto a rig position. */
export function mapPositionToRigPosition(position?: string): RigPosition | undefined {
  if (!position) return undefined;
  const lower = position.toLowerCase();
  if (lower.includes('foh') || lower.includes('front')) return 'FOH';
  if (lower.includes('floor')) return 'Floor';
  if (lower.includes('boom') || lower.includes('side') || lower.includes('cánh')) return 'SideBoom';
  if (lower.includes('ladder')) return 'Ladder';
  if (lower.includes('box')) return 'BoxBoom';
  if (lower.includes('mid')) return 'Mid';
  if (lower.includes('back')) return 'Back';
  if (lower.includes('truss')) return 'Truss';
  return undefined;
}

/**
 * Parse manual override syntax:
 * Examples:
 * - "Spot x4 @FOH"
 * - "4 Beam 350W @Back + 2 Follow @FOH"
 * - "8x Blinder @Floor"
 * - "Wash 6 @SideBoom"
 * - "12 Spot"
 */
export function parseFixtureSyntax(text: string): CueFixtureRequirement[] {
  if (!text || typeof text !== 'string') return [];

  // Split multiple clauses by '+' or ';' or ','
  const clauses = text.split(/[+;,]/).map((c) => c.trim()).filter(Boolean);
  const requirements: CueFixtureRequirement[] = [];

  for (const clause of clauses) {
    // Check for @position override
    const atMatch = clause.match(/@([\w-]+)/i);
    const positionRaw = atMatch ? atMatch[1].trim() : undefined;
    const cleanClause = clause.replace(/@[\w-]+/i, '').trim();

    // Match count: "x4", "4x", "4", "4 Beam"
    const countMatch = cleanClause.match(/(?:x\s*(\d+)|(\d+)\s*x|(\d+))/i);
    const count = countMatch ? parseInt(countMatch[1] || countMatch[2] || countMatch[3], 10) : 1;

    // Normalize fixture type
    const lower = cleanClause.toLowerCase();
    const knownType = /(beam|spot|wash|par|blinder|follow|laser|strobe|smoke|haze|fog)/i.test(lower);
    const type: FixtureType = mapSubTypeToFixtureType(lower);

    // Normalize preferred position
    let preferredPosition: RigPosition | undefined;
    if (positionRaw) {
      preferredPosition = mapPositionToRigPosition(positionRaw);
    }

    requirements.push({
      type,
      count: Math.max(1, count),
      preferredPosition: preferredPosition || positionRaw,
      raw: clause,
      unclassified: !knownType,
    });
  }

  return requirements;
}

/**
 * Extract fixture requirements from a LightingCue or cue input.
 */
export function extractCueRequirements(cue: LightingCue | any): CueFixtureRequirement[] {
  if (!cue) return [];

  // 1. If explicit fixtures array (DeviceSpecification[]) exists — authoritative source
  if (Array.isArray(cue.fixtures) && cue.fixtures.length > 0) {
    return cue.fixtures
      .filter((spec: any) => Number(spec.count) > 0)
      .map((spec: any) => {
        const subType = String(spec.subType || spec.name || '');
        const known = /(beam|spot|wash|par|blinder|follow|laser|strobe|smoke|haze|fog)/i.test(subType);
        return {
          type: mapSubTypeToFixtureType(subType),
          count: Math.max(1, Math.floor(Number(spec.count))),
          preferredPosition: spec.position
            ? (mapPositionToRigPosition(String(spec.position)) ?? String(spec.position))
            : undefined,
          subType,
          raw: `${spec.name || subType} x${spec.count}${spec.position ? ` @${spec.position}` : ''}`,
          unclassified: !known,
        };
      });
  }

  // 2. If fixtureSummary text is provided
  if (typeof cue.fixtureSummary === 'string' && cue.fixtureSummary.trim()) {
    const parsed = parseFixtureSyntax(cue.fixtureSummary);
    if (parsed.length > 0) return parsed;
  }

  // 3. If only fixtureCount is provided (legacy)
  if (typeof cue.fixtureCount === 'number' && cue.fixtureCount > 0) {
    return [{ type: 'Spot', count: cue.fixtureCount, unclassified: true }];
  }

  return [];
}

/**
 * Pure function placeFixtures:
 * Deterministically assigns cue fixture requirements to rig positions with:
 * - Rule table by fixture type
 * - Symmetrical left/right distribution across SL/SR
 * - Capacity overflow handling (auto-expand slots, NEVER drop fixtures)
 * - Manual override parsing (@position)
 */
export function placeFixtures(
  rigConfig: StageConfig | any,
  cueUsage: LightingCue | CueFixtureRequirement[] | string | any
): PlacementResult {
  const config = migrateLegacyStageConfig(rigConfig);
  const baseFixtures: Fixture[] = config.fixtures ?? [];

  // Resolve requirements
  let requirements: CueFixtureRequirement[] = [];
  if (Array.isArray(cueUsage)) {
    requirements = cueUsage;
  } else if (typeof cueUsage === 'string') {
    requirements = parseFixtureSyntax(cueUsage);
  } else if (cueUsage && typeof cueUsage === 'object') {
    requirements = extractCueRequirements(cueUsage);
  }

  const requestedCount = requirements.reduce((acc, r) => acc + r.count, 0);
  const byType: Record<string, { requested: number; placed: number; active: number }> = {};
  for (const req of requirements) {
    if (!byType[req.type]) {
      byType[req.type] = { requested: 0, placed: 0, active: 0 };
    }
    byType[req.type].requested += req.count;
  }

  const warnings: string[] = [];
  let isOverflown = false;

  const unclassifiedCount = requirements
    .filter((req) => req.unclassified)
    .reduce((acc, req) => acc + req.count, 0);
  if (unclassifiedCount > 0) {
    warnings.push(
      `Có ${unclassifiedCount} đèn chưa phân loại — đã đặt ở vị trí mặc định (Par).`
    );
  }

  // Track availability of base rig fixtures
  const usedFixtureIds = new Set<string>();
  const activePlacedFixtures: PlacedFixture[] = [];

  // Helper to score candidate fixtures for a given requirement
  for (const req of requirements) {
    let remaining = req.count;
    const preferredPosList = req.preferredPosition
      ? [req.preferredPosition as RigPosition]
      : DEFAULT_PLACEMENT_RULES[req.type] ?? ['Truss', 'FOH'];

    // Symmetrical assignment loop across preferred positions
    for (const pos of preferredPosList) {
      if (remaining <= 0) break;

      // Filter available fixtures matching this position
      const candidates = baseFixtures.filter(
        (f) => !usedFixtureIds.has(f.id) && f.position === pos
      );

      if (candidates.length === 0) continue;

      // Prefer fixtures with matching type first, then others
      const typeMatching = candidates.filter((c) => c.type === req.type);
      const pool = typeMatching.length >= remaining ? typeMatching : candidates;

      // Group pool symmetrically by absolute distance from centerline
      // Sort so center (x=0) is first, then pairs with equal/close |x|
      pool.sort((a, b) => {
        const distA = Math.abs(a.x);
        const distB = Math.abs(b.x);
        if (Math.abs(distA - distB) < 0.01) {
          return a.x - b.x; // SL (-x) before SR (+x)
        }
        return distA - distB;
      });

      // If remaining count is odd, assign center fixture (x=0) if present
      if (remaining % 2 === 1) {
        const centerIdx = pool.findIndex((f) => Math.abs(f.x) < 0.5);
        if (centerIdx !== -1) {
          const centerFix = pool.splice(centerIdx, 1)[0];
          usedFixtureIds.add(centerFix.id);
          activePlacedFixtures.push({
            ...centerFix,
            type: req.type, // Adopt requested type characteristics
            beamAngle: DEFAULT_BEAM_ANGLES[req.type] ?? centerFix.beamAngle,
            loadWatts: DEFAULT_FIXTURE_WATTS[req.type] ?? centerFix.loadWatts,
            isActive: true,
            assignedRequirement: req.raw,
          });
          remaining--;
          byType[req.type].placed++;
          byType[req.type].active++;
        }
      }

      // Assign in symmetrical pairs (SL, SR)
      while (remaining >= 2 && pool.length >= 2) {
        const slIdx = pool.findIndex((f) => f.x < 0);
        const srIdx = pool.findIndex((f) => f.x > 0);

        if (slIdx !== -1 && srIdx !== -1) {
          const slFix = pool[slIdx];
          const srFix = pool[srIdx];

          // Remove both
          usedFixtureIds.add(slFix.id);
          usedFixtureIds.add(srFix.id);
          pool.splice(Math.max(slIdx, srIdx), 1);
          pool.splice(Math.min(slIdx, srIdx), 1);

          activePlacedFixtures.push(
            {
              ...slFix,
              type: req.type,
              beamAngle: DEFAULT_BEAM_ANGLES[req.type] ?? slFix.beamAngle,
              loadWatts: DEFAULT_FIXTURE_WATTS[req.type] ?? slFix.loadWatts,
              isActive: true,
              assignedRequirement: req.raw,
            },
            {
              ...srFix,
              type: req.type,
              beamAngle: DEFAULT_BEAM_ANGLES[req.type] ?? srFix.beamAngle,
              loadWatts: DEFAULT_FIXTURE_WATTS[req.type] ?? srFix.loadWatts,
              isActive: true,
              assignedRequirement: req.raw,
            }
          );

          remaining -= 2;
          byType[req.type].placed += 2;
          byType[req.type].active += 2;
        } else {
          // Take any 2 candidates
          const fix1 = pool.shift()!;
          const fix2 = pool.shift()!;
          usedFixtureIds.add(fix1.id);
          usedFixtureIds.add(fix2.id);
          activePlacedFixtures.push(
            {
              ...fix1,
              type: req.type,
              beamAngle: DEFAULT_BEAM_ANGLES[req.type] ?? fix1.beamAngle,
              loadWatts: DEFAULT_FIXTURE_WATTS[req.type] ?? fix1.loadWatts,
              isActive: true,
              assignedRequirement: req.raw,
            },
            {
              ...fix2,
              type: req.type,
              beamAngle: DEFAULT_BEAM_ANGLES[req.type] ?? fix2.beamAngle,
              loadWatts: DEFAULT_FIXTURE_WATTS[req.type] ?? fix2.loadWatts,
              isActive: true,
              assignedRequirement: req.raw,
            }
          );
          remaining -= 2;
          byType[req.type].placed += 2;
          byType[req.type].active += 2;
        }
      }

      // If 1 remaining, pick closest available
      if (remaining === 1 && pool.length >= 1) {
        const fix = pool.shift()!;
        usedFixtureIds.add(fix.id);
        activePlacedFixtures.push({
          ...fix,
          type: req.type,
          beamAngle: DEFAULT_BEAM_ANGLES[req.type] ?? fix.beamAngle,
          loadWatts: DEFAULT_FIXTURE_WATTS[req.type] ?? fix.loadWatts,
          isActive: true,
          assignedRequirement: req.raw,
        });
        remaining--;
        byType[req.type].placed++;
        byType[req.type].active++;
      }
    }

    // CAPACITY OVERFLOW HANDLING:
    // If remaining > 0, auto-expand virtual slots so NO fixtures are dropped!
    if (remaining > 0) {
      isOverflown = true;
      const targetPos = preferredPosList[0] || 'Truss';
      warnings.push(
        `Vượt sức chứa rig: thiếu ${remaining} đèn ${req.type} tại vị trí ${targetPos}. Đã tự động mở rộng slot.`
      );

      const span = config.widthMeters * 0.8;
      const step = span / (remaining + 1);
      const halfSpan = span / 2;
      const defaultY = targetPos === 'FOH' ? -3 : targetPos === 'Floor' ? 0.5 : 6;
      const defaultZ = targetPos === 'FOH' ? 8 : targetPos === 'Floor' ? 0.2 : 7;

      for (let i = 0; i < remaining; i++) {
        const slot = i + 1;
        const x = -halfSpan + slot * step;
        activePlacedFixtures.push({
          id: `expanded-${req.type.toLowerCase()}-${slot}-${Math.random().toString(36).slice(2, 6)}`,
          type: req.type,
          position: targetPos,
          slot: 99 + slot,
          x: Math.round(x * 100) / 100,
          y: defaultY,
          z: defaultZ,
          beamAngle: DEFAULT_BEAM_ANGLES[req.type] ?? 15,
          loadWatts: DEFAULT_FIXTURE_WATTS[req.type] ?? 500,
          role: DEFAULT_FIXTURE_ROLES[req.type] ?? 'wash',
          aim: {
            elevation: defaultY < 0 ? -45 : -60,
            azimuth: x < 0 ? 15 : x > 0 ? -15 : 0,
            targetZone: 'C',
          },
          isActive: true,
          isVirtualExpanded: true,
          assignedRequirement: req.raw,
        });
        byType[req.type].placed++;
        byType[req.type].active++;
      }
    }
  }

  // Combine active fixtures with unlit base rig fixtures
  const inactiveFixtures: PlacedFixture[] = baseFixtures
    .filter((f) => !usedFixtureIds.has(f.id))
    .map((f) => ({
      ...f,
      isActive: false,
    }));

  const allPlacements = [...activePlacedFixtures, ...inactiveFixtures];

  // Calculate total power
  const totalLoadWatts = activePlacedFixtures.reduce((sum, f) => sum + (f.loadWatts || 0), 0);

  return {
    placements: allPlacements,
    activeCount: activePlacedFixtures.length,
    requestedCount,
    byType,
    warnings,
    isOverflown,
    totalLoadWatts,
  };
}
