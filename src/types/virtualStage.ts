/**
 * Professional Virtual Stage Schema (2D & Physics-accurate Model)
 * Conforms to USITT standards and theater rigging physics.
 * Axes:
 *   x: meters from centerline (x=0). Negative = Stage Left (SL), Positive = Stage Right (SR)
 *   y: meters from plaster line (y=0). Positive = Upstage (US), Negative = Audience / FOH (DS)
 *   z: trim height in meters above stage floor (z=0)
 */

export type StagePreset = 'EndStage' | 'Festival' | 'Thrust';

export type CameraView = 'front' | 'topDown';

export type ScreenPositionType = 'Main' | 'LeftWing' | 'RightWing' | 'Floor' | 'Banner' | 'Other';

export type RigPosition =
  | 'FOH'
  | 'Truss'
  | 'SideBoom'
  | 'Ladder'
  | 'Floor'
  | 'BoxBoom'
  | 'Mid'
  | 'Back';

export type FixtureType =
  | 'Beam'
  | 'Spot'
  | 'Wash'
  | 'Follow'
  | 'Blinder'
  | 'Strobe'
  | 'Par'
  | 'Laser';

export type FixtureRole =
  | 'front'
  | 'back'
  | 'side'
  | 'wash'
  | 'effect'
  | 'aerial';

export interface FixtureAim {
  pan?: number; // degrees
  tilt?: number; // degrees
  azimuth?: number; // degrees (-180 to 180)
  elevation?: number; // degrees (-90 to 90)
  targetZone?: 'UL' | 'UC' | 'UR' | 'C' | 'L' | 'R' | 'DL' | 'DC' | 'DR' | 'Audience' | 'StageCenter';
  targetX?: number; // meters from centerline
  targetY?: number; // meters from plaster line
  targetZ?: number; // target height in meters
}

export interface Fixture {
  id: string;
  type: FixtureType;
  position: RigPosition;
  slot: number;
  x: number; // meters from centerline (SL < 0 < SR)
  y: number; // meters from plaster line (Audience < 0 < Upstage)
  z: number; // trim height in meters
  beamAngle: number; // beam cone spread angle in degrees
  aim?: FixtureAim;
  role?: FixtureRole;
  loadWatts: number;
  label?: string;
  enabled?: boolean;
}

export const DEFAULT_BEAM_ANGLES: Record<FixtureType, number> = {
  Beam: 3.5,
  Spot: 15,
  Wash: 35,
  Follow: 8,
  Blinder: 60,
  Strobe: 70,
  Par: 25,
  Laser: 1.5,
};

export const DEFAULT_FIXTURE_WATTS: Record<FixtureType, number> = {
  Beam: 350,
  Spot: 1000,
  Wash: 500,
  Follow: 1500,
  Blinder: 800,
  Strobe: 1200,
  Par: 300,
  Laser: 150,
};

export const DEFAULT_FIXTURE_ROLES: Record<FixtureType, FixtureRole> = {
  Follow: 'front',
  Wash: 'wash',
  Spot: 'front',
  Beam: 'aerial',
  Blinder: 'effect',
  Strobe: 'effect',
  Par: 'wash',
  Laser: 'effect',
};

export interface VirtualScreen {
  id: string;
  name: string;
  type: ScreenPositionType;
  x: number; // Percentage (0 - 100) for legacy/rendering fallback
  y: number; // Percentage (0 - 100) for legacy/rendering fallback
  width: number; // Percentage
  height: number; // Percentage
  enabled: boolean;
  xMeters?: number; // from centerline
  yMeters?: number; // from plaster line (depth into stage)
  zMeters?: number; // bottom trim height
  widthMeters?: number;
  heightMeters?: number;
}

export interface VirtualTruss {
  id: string;
  name: string;
  position: RigPosition;
  fixtureType: string;
  fixtureCount: number;
  x: number; // Percentage (0 - 100)
  y: number; // Percentage (0 - 100)
  width: number; // Percentage
  enabled: boolean;
  xMeters?: number;
  yMeters?: number;
  zMeters?: number; // trim height
  widthMeters?: number;
  loadLimitWatts?: number;
  fixtures?: Fixture[];
}

export interface StageConfig {
  preset: StagePreset;
  widthMeters: number;
  depthMeters: number;
  screens: VirtualScreen[];
  trusses: VirtualTruss[];
  fixtures?: Fixture[];
  haze?: boolean;
  dimmerCurve?: 'square' | 'linear' | 's-curve';
}

/**
 * Coordinate Conversion Helpers (Percentage <-> Real-world Meters)
 * Centerline (x=0m) corresponds to xPercent = 50.
 * Plaster line (y=0m) corresponds to yPercent = 70 (leaving 30% for audience/FOH at y < 0).
 */
export function convertMetersToPercent(
  xMeters: number,
  yMeters: number,
  widthMeters: number,
  depthMeters: number,
  plasterLinePercent = 70
): { x: number; y: number } {
  const x = 50 + (xMeters / (widthMeters || 1)) * 100;
  // y > 0 is upstage (towards 0% top), y < 0 is downstage / FOH (towards 100% bottom)
  const y = plasterLinePercent - (yMeters / (depthMeters || 1)) * plasterLinePercent;
  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
  };
}

export function convertPercentToMeters(
  xPercent: number,
  yPercent: number,
  widthMeters: number,
  depthMeters: number,
  plasterLinePercent = 70
): { x: number; y: number } {
  const xMeters = ((xPercent - 50) / 100) * widthMeters;
  const yMeters = ((plasterLinePercent - yPercent) / plasterLinePercent) * depthMeters;
  return {
    x: Math.round(xMeters * 100) / 100,
    y: Math.round(yMeters * 100) / 100,
  };
}

/**
 * Symmetrically populate fixtures along a line/truss.
 */
function createSymmetricFixtures(
  trussId: string,
  position: RigPosition,
  type: FixtureType,
  count: number,
  yMeters: number,
  zMeters: number,
  spanMeters: number,
  aim?: FixtureAim,
  role?: FixtureRole
): Fixture[] {
  const fixtures: Fixture[] = [];
  const beamAngle = DEFAULT_BEAM_ANGLES[type] ?? 15;
  const loadWatts = DEFAULT_FIXTURE_WATTS[type] ?? 500;
  const resolvedRole = role ?? DEFAULT_FIXTURE_ROLES[type] ?? 'wash';

  if (count <= 0) return fixtures;

  if (count === 1) {
    fixtures.push({
      id: `${trussId}-fix-1`,
      type,
      position,
      slot: 1,
      x: 0,
      y: yMeters,
      z: zMeters,
      beamAngle,
      aim: aim ?? { elevation: -45, targetZone: 'C' },
      role: resolvedRole,
      loadWatts,
      enabled: true,
    });
    return fixtures;
  }

  // Spacing across span
  const spacing = spanMeters / (count + 1);
  const halfSpan = spanMeters / 2;

  for (let i = 0; i < count; i++) {
    const slot = i + 1;
    // x from -halfSpan to +halfSpan
    const x = -halfSpan + slot * spacing;
    fixtures.push({
      id: `${trussId}-fix-${slot}`,
      type,
      position,
      slot,
      x: Math.round(x * 100) / 100,
      y: yMeters,
      z: zMeters,
      beamAngle,
      aim: aim ?? {
        elevation: yMeters < 0 ? -45 : -60,
        azimuth: x < 0 ? 15 : x > 0 ? -15 : 0,
        targetZone: 'C',
      },
      role: resolvedRole,
      loadWatts,
      enabled: true,
    });
  }

  return fixtures;
}

/**
 * Presets with realistic USITT symmetry and distinct architectures:
 * - EndStage: Proscenium stage with audience on 1 side. FOH at y < 0, Mid truss, Back truss, Side Booms.
 * - Thrust: Catwalk thrust extending into audience with surrounding view.
 * - Festival: Multi-truss stadium rig with delay towers, heavy floor package, wing screens.
 */
export const STAGE_PRESETS: Record<StagePreset, StageConfig> = {
  EndStage: {
    preset: 'EndStage',
    widthMeters: 14,
    depthMeters: 10,
    haze: true,
    dimmerCurve: 'square',
    screens: [
      {
        id: 'scr-main',
        name: 'Main LED P3',
        type: 'Main',
        x: 25,
        y: 15,
        width: 50,
        height: 45,
        enabled: true,
        xMeters: 0,
        yMeters: 8.5,
        zMeters: 1.5,
        widthMeters: 7,
        heightMeters: 4,
      },
      {
        id: 'scr-lw',
        name: 'Wing LED Left',
        type: 'LeftWing',
        x: 8,
        y: 22,
        width: 14,
        height: 35,
        enabled: true,
        xMeters: -5.5,
        yMeters: 7,
        zMeters: 1.5,
        widthMeters: 2,
        heightMeters: 3.5,
      },
      {
        id: 'scr-rw',
        name: 'Wing LED Right',
        type: 'RightWing',
        x: 78,
        y: 22,
        width: 14,
        height: 35,
        enabled: true,
        xMeters: 5.5,
        yMeters: 7,
        zMeters: 1.5,
        widthMeters: 2,
        heightMeters: 3.5,
      },
      {
        id: 'scr-floor',
        name: 'Floor LED',
        type: 'Floor',
        x: 25,
        y: 65,
        width: 50,
        height: 25,
        enabled: false,
        xMeters: 0,
        yMeters: 2,
        zMeters: 0.1,
        widthMeters: 6,
        heightMeters: 3,
      },
    ],
    trusses: [
      {
        id: 'truss-back',
        name: 'Back Truss',
        position: 'Back',
        fixtureType: 'Beam 350W',
        fixtureCount: 12,
        x: 10,
        y: 10,
        width: 80,
        enabled: true,
        xMeters: 0,
        yMeters: 9,
        zMeters: 7.5,
        widthMeters: 12,
        loadLimitWatts: 10000,
      },
      {
        id: 'truss-mid',
        name: 'Mid Truss',
        position: 'Mid',
        fixtureType: 'Spot 1000W',
        fixtureCount: 8,
        x: 15,
        y: 35,
        width: 70,
        enabled: true,
        xMeters: 0,
        yMeters: 5,
        zMeters: 6.5,
        widthMeters: 10,
        loadLimitWatts: 12000,
      },
      {
        id: 'truss-foh',
        name: 'FOH Front Truss',
        position: 'FOH',
        fixtureType: 'Par LED / Wash',
        fixtureCount: 16,
        x: 5,
        y: 80,
        width: 90,
        enabled: true,
        xMeters: 0,
        yMeters: -3.5, // Outside stage boundary in audience area
        zMeters: 8,
        widthMeters: 13,
        loadLimitWatts: 15000,
      },
      {
        id: 'truss-floor',
        name: 'Floor Fixtures',
        position: 'Floor',
        fixtureType: 'Blinder / Beam',
        fixtureCount: 8,
        x: 20,
        y: 62,
        width: 60,
        enabled: true,
        xMeters: 0,
        yMeters: 0.5,
        zMeters: 0.2,
        widthMeters: 8,
        loadLimitWatts: 8000,
      },
    ],
    fixtures: [
      ...createSymmetricFixtures('truss-back', 'Truss', 'Beam', 12, 9, 7.5, 12, { elevation: -45, azimuth: 0 }),
      ...createSymmetricFixtures('truss-mid', 'Truss', 'Spot', 8, 5, 6.5, 10, { elevation: -60, targetZone: 'C' }),
      ...createSymmetricFixtures('truss-foh', 'FOH', 'Wash', 16, -3.5, 8, 13, { elevation: -45, targetZone: 'C' }),
      ...createSymmetricFixtures('truss-floor', 'Floor', 'Blinder', 8, 0.5, 0.2, 8, { elevation: 30, targetZone: 'Audience' }),
    ],
  },

  Festival: {
    preset: 'Festival',
    widthMeters: 24,
    depthMeters: 16,
    haze: true,
    dimmerCurve: 'square',
    screens: [
      {
        id: 'scr-main',
        name: 'Mega Main LED',
        type: 'Main',
        x: 20,
        y: 10,
        width: 60,
        height: 50,
        enabled: true,
        xMeters: 0,
        yMeters: 14,
        zMeters: 2,
        widthMeters: 14,
        heightMeters: 7,
      },
      {
        id: 'scr-lw',
        name: 'Outer Wing Left',
        type: 'LeftWing',
        x: 2,
        y: 15,
        width: 15,
        height: 45,
        enabled: true,
        xMeters: -10,
        yMeters: 11,
        zMeters: 2,
        widthMeters: 3.5,
        heightMeters: 6,
      },
      {
        id: 'scr-rw',
        name: 'Outer Wing Right',
        type: 'RightWing',
        x: 83,
        y: 15,
        width: 15,
        height: 45,
        enabled: true,
        xMeters: 10,
        yMeters: 11,
        zMeters: 2,
        widthMeters: 3.5,
        heightMeters: 6,
      },
      {
        id: 'scr-banner',
        name: 'Truss Banner',
        type: 'Banner',
        x: 20,
        y: 62,
        width: 60,
        height: 8,
        enabled: true,
        xMeters: 0,
        yMeters: 3,
        zMeters: 8,
        widthMeters: 14,
        heightMeters: 1.5,
      },
      {
        id: 'scr-floor',
        name: 'Interactive Floor',
        type: 'Floor',
        x: 25,
        y: 70,
        width: 50,
        height: 25,
        enabled: true,
        xMeters: 0,
        yMeters: 4,
        zMeters: 0.1,
        widthMeters: 10,
        heightMeters: 5,
      },
    ],
    trusses: [
      {
        id: 'truss-back',
        name: 'High Back Truss',
        position: 'Back',
        fixtureType: 'Beam 350W',
        fixtureCount: 24,
        x: 5,
        y: 5,
        width: 90,
        enabled: true,
        xMeters: 0,
        yMeters: 15,
        zMeters: 10,
        widthMeters: 22,
        loadLimitWatts: 25000,
      },
      {
        id: 'truss-mid',
        name: 'Mid Festival Truss',
        position: 'Mid',
        fixtureType: 'Spot / Strobe',
        fixtureCount: 16,
        x: 10,
        y: 30,
        width: 80,
        enabled: true,
        xMeters: 0,
        yMeters: 8,
        zMeters: 9,
        widthMeters: 18,
        loadLimitWatts: 20000,
      },
      {
        id: 'truss-foh',
        name: 'FOH Concert Truss',
        position: 'FOH',
        fixtureType: 'Blinder & Follow',
        fixtureCount: 20,
        x: 2,
        y: 85,
        width: 96,
        enabled: true,
        xMeters: 0,
        yMeters: -6, // Outside in audience zone
        zMeters: 11,
        widthMeters: 23,
        loadLimitWatts: 25000,
      },
      {
        id: 'truss-floor',
        name: 'Front Stage Edge',
        position: 'Floor',
        fixtureType: 'Atomic Strobe',
        fixtureCount: 12,
        x: 15,
        y: 65,
        width: 70,
        enabled: true,
        xMeters: 0,
        yMeters: 1,
        zMeters: 0.2,
        widthMeters: 16,
        loadLimitWatts: 15000,
      },
    ],
    fixtures: [
      ...createSymmetricFixtures('truss-back', 'Truss', 'Beam', 24, 15, 10, 22, { elevation: -35 }),
      ...createSymmetricFixtures('truss-mid', 'Truss', 'Spot', 16, 8, 9, 18, { elevation: -55 }),
      ...createSymmetricFixtures('truss-foh', 'FOH', 'Follow', 4, -6, 11, 8, { elevation: -40 }, 'front'),
      ...createSymmetricFixtures('truss-foh', 'FOH', 'Wash', 16, -6, 11, 23, { elevation: -45 }, 'wash'),
      ...createSymmetricFixtures('truss-floor', 'Floor', 'Strobe', 12, 1, 0.2, 16, { elevation: 20 }, 'effect'),
    ],
  },

  Thrust: {
    preset: 'Thrust',
    widthMeters: 18,
    depthMeters: 20,
    haze: true,
    dimmerCurve: 'square',
    screens: [
      {
        id: 'scr-main',
        name: 'Backdrop LED',
        type: 'Main',
        x: 25,
        y: 10,
        width: 50,
        height: 40,
        enabled: true,
        xMeters: 0,
        yMeters: 18,
        zMeters: 2,
        widthMeters: 9,
        heightMeters: 5,
      },
      {
        id: 'scr-floor',
        name: 'Catwalk Runway LED',
        type: 'Floor',
        x: 38,
        y: 50,
        width: 24,
        height: 45,
        enabled: true,
        xMeters: 0,
        yMeters: 5,
        zMeters: 0.1,
        widthMeters: 3,
        heightMeters: 10,
      },
    ],
    trusses: [
      {
        id: 'truss-back',
        name: 'Back Arch',
        position: 'Back',
        fixtureType: 'Wash 19x40W',
        fixtureCount: 10,
        x: 15,
        y: 8,
        width: 70,
        enabled: true,
        xMeters: 0,
        yMeters: 18.5,
        zMeters: 7,
        widthMeters: 12,
        loadLimitWatts: 10000,
      },
      {
        id: 'truss-mid',
        name: 'Stage Center Truss',
        position: 'Mid',
        fixtureType: 'Spot 1000W',
        fixtureCount: 8,
        x: 25,
        y: 35,
        width: 50,
        enabled: true,
        xMeters: 0,
        yMeters: 11,
        zMeters: 6.5,
        widthMeters: 8,
        loadLimitWatts: 10000,
      },
      {
        id: 'truss-foh',
        name: 'Catwalk Overhead',
        position: 'FOH',
        fixtureType: 'Follow & Spot',
        fixtureCount: 12,
        x: 30,
        y: 70,
        width: 40,
        enabled: true,
        xMeters: 0,
        yMeters: -2, // In audience area facing thrust runway
        zMeters: 8,
        widthMeters: 7,
        loadLimitWatts: 15000,
      },
    ],
    fixtures: [
      ...createSymmetricFixtures('truss-back', 'Truss', 'Wash', 10, 18.5, 7, 12, { elevation: -45 }),
      ...createSymmetricFixtures('truss-mid', 'Truss', 'Spot', 8, 11, 6.5, 8, { elevation: -60 }),
      ...createSymmetricFixtures('truss-foh', 'FOH', 'Spot', 12, -2, 8, 7, { elevation: -50 }, 'front'),
    ],
  },
};

/**
 * Migration helper to ensure legacy stage configurations seamlessly upgrade
 * to real-world meters, trim heights, and fixture arrays without losing custom user settings.
 */
export function migrateLegacyStageConfig(rawConfig: any): StageConfig {
  const presetKey: StagePreset =
    rawConfig && rawConfig.preset && STAGE_PRESETS[rawConfig.preset as StagePreset]
      ? (rawConfig.preset as StagePreset)
      : 'EndStage';

  const defaultPreset = STAGE_PRESETS[presetKey];
  const widthMeters = Number(rawConfig?.widthMeters) || defaultPreset.widthMeters;
  const depthMeters = Number(rawConfig?.depthMeters) || defaultPreset.depthMeters;

  const screens: VirtualScreen[] = Array.isArray(rawConfig?.screens)
    ? rawConfig.screens.map((scr: any) => {
        const xPercent = scr.x ?? 50;
        const yPercent = scr.y ?? 20;
        const coords = convertPercentToMeters(xPercent, yPercent, widthMeters, depthMeters);
        return {
          id: String(scr.id || 'scr-' + Math.random().toString(36).slice(2, 7)),
          name: String(scr.name || 'Screen'),
          type: scr.type || 'Main',
          x: xPercent,
          y: yPercent,
          width: scr.width ?? 30,
          height: scr.height ?? 20,
          enabled: scr.enabled !== false,
          xMeters: scr.xMeters ?? coords.x,
          yMeters: scr.yMeters ?? coords.y,
          zMeters: scr.zMeters ?? 1.5,
          widthMeters: scr.widthMeters ?? Math.round(((scr.width ?? 30) / 100) * widthMeters * 10) / 10,
          heightMeters: scr.heightMeters ?? Math.round(((scr.height ?? 20) / 100) * (depthMeters / 2) * 10) / 10,
        };
      })
    : JSON.parse(JSON.stringify(defaultPreset.screens));

  const trusses: VirtualTruss[] = Array.isArray(rawConfig?.trusses)
    ? rawConfig.trusses.map((truss: any) => {
        const xPercent = truss.x ?? 10;
        const yPercent = truss.y ?? 20;
        const coords = convertPercentToMeters(xPercent, yPercent, widthMeters, depthMeters);
        const trussWidthMeters =
          truss.widthMeters ?? Math.round(((truss.width ?? 80) / 100) * widthMeters * 10) / 10;
        const position = truss.position || 'Truss';
        const fixtureCount = Number(truss.fixtureCount) || 8;
        const zMeters = truss.zMeters ?? (position === 'FOH' ? 8 : position === 'Floor' ? 0.2 : 7);

        return {
          id: String(truss.id || 'truss-' + Math.random().toString(36).slice(2, 7)),
          name: String(truss.name || 'Truss'),
          position,
          fixtureType: String(truss.fixtureType || 'Spot'),
          fixtureCount,
          x: xPercent,
          y: yPercent,
          width: truss.width ?? 80,
          enabled: truss.enabled !== false,
          xMeters: truss.xMeters ?? coords.x,
          yMeters: truss.yMeters ?? coords.y,
          zMeters,
          widthMeters: trussWidthMeters,
          loadLimitWatts: truss.loadLimitWatts ?? 15000,
        };
      })
    : JSON.parse(JSON.stringify(defaultPreset.trusses));

  // If fixtures array is not provided, populate from trusses or default preset
  let fixtures: Fixture[] = Array.isArray(rawConfig?.fixtures) && rawConfig.fixtures.length > 0
    ? rawConfig.fixtures
    : JSON.parse(JSON.stringify(defaultPreset.fixtures ?? []));

  if (fixtures.length === 0) {
    fixtures = trusses.flatMap((t) => {
      const type: FixtureType =
        t.fixtureType.toLowerCase().includes('beam')
          ? 'Beam'
          : t.fixtureType.toLowerCase().includes('wash')
          ? 'Wash'
          : t.fixtureType.toLowerCase().includes('blinder')
          ? 'Blinder'
          : t.fixtureType.toLowerCase().includes('strobe')
          ? 'Strobe'
          : t.fixtureType.toLowerCase().includes('follow')
          ? 'Follow'
          : 'Spot';
      const pos: RigPosition = t.position === 'Mid' || t.position === 'Back' ? 'Truss' : t.position;
      return createSymmetricFixtures(
        t.id,
        pos,
        type,
        t.fixtureCount,
        t.yMeters ?? 5,
        t.zMeters ?? 7,
        t.widthMeters ?? 10
      );
    });
  }

  return {
    preset: presetKey,
    widthMeters,
    depthMeters,
    screens,
    trusses,
    fixtures,
    haze: rawConfig?.haze ?? defaultPreset.haze ?? true,
    dimmerCurve: rawConfig?.dimmerCurve ?? defaultPreset.dimmerCurve ?? 'square',
  };
}
