/**
 * Core Domain Schema for Light Stage
 * Professional Stage Cue, Act, Show, Department Models (.lightstage)
 */

export type CueStatus = 'Pending' | 'Standby' | 'Go' | 'Hold' | 'Skip' | 'Completed';

export type DepartmentType = 'LX' | 'VX' | 'SQ' | 'ST';

export type LightingFixtureType =
  | 'Beam'
  | 'Spot'
  | 'Wash'
  | 'ParLED'
  | 'Blinder'
  | 'Follow'
  | 'Laser'
  | 'Strobe'
  | 'Smoke'
  | 'Other';

export type VisualScreenType =
  | 'MainScreen'
  | 'WingScreen'
  | 'FloorScreen'
  | 'Banner'
  | 'Other';

export interface DeviceSpecification {
  id: string;
  name: string;
  category: 'Lighting' | 'Visual';
  subType: LightingFixtureType | VisualScreenType | string;
  count: number;
  /** Optional rig position, e.g. 'FOH', 'Back', 'Back-L', 'Mid', 'Floor'. */
  position?: string;
  notes?: string;
  color?: LightingColor;
}

export type LightingColorMode = 'rgb' | 'rgbw' | 'rgba' | 'cmy' | 'kelvin' | 'gel' | 'name';

export type LightingColor =
  | { mode: 'rgb'; hex?: string; r?: number; g?: number; b?: number }
  | { mode: 'rgbw'; r: number; g: number; b: number; w: number }
  | { mode: 'rgba'; r: number; g: number; b: number; a: number }
  | { mode: 'cmy'; c: number; m: number; y: number }
  | { mode: 'kelvin'; kelvin: number }
  | { mode: 'gel'; code: string; brand?: 'Rosco' | 'Lee' | 'GamColor'; approx?: boolean }
  | { mode: 'name'; name: string };

export interface LightingCue {
  sceneName?: string;
  intensity?: number; // 0 - 100
  colorPreset?: string; // Legacy fallback hex
  color?: LightingColor; // Structured color specification
  fixtureSummary?: string;
  /** Derived cache: always equals the sum of `fixtures`. Never edit independently. */
  fixtureCount?: number;
  fixtures?: DeviceSpecification[];
  notes?: string;
}

export interface VisualCue {
  contentName?: string;
  screenTarget?: string; // e.g. 'Main LED', 'Left Wing', 'Right Wing', 'All'
  screenCount: number;
  loop?: boolean;
  screens?: DeviceSpecification[];
  notes?: string;
}

export interface SoundCue {
  trackName?: string;
  micChannels?: string[];
  volume?: number; // 0 - 100
  fadeDurationSec?: number;
  notes?: string;
}

export interface StageActionCue {
  actionDescription?: string;
  castMembers?: string[];
  props?: string[];
  notes?: string;
}

export interface DepartmentCues {
  lx?: LightingCue;
  vx?: VisualCue;
  sq?: SoundCue;
  st?: StageActionCue;
}

export interface Cue {
  id: string;
  actId: string;
  cueNumber: string;
  title: string;
  status: CueStatus;
  durationMs: number;
  scheduledTime?: string;
  notes?: string;
  departments: DepartmentCues;
  totalLightingFixtures: number;
  totalScreens: number;
}

export interface Act {
  id: string;
  title: string;
  order: number;
  cues: Cue[];
  notes?: string;
}

export interface ShowMetadata {
  title: string;
  venue?: string;
  director?: string;
  lightingDirector?: string;
  soundEngineer?: string;
  visualOperator?: string;
  date?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShowSettings {
  autoStandbyNext: boolean;
  countdownWarningSec: number;
  defaultCueDurationMs: number;
}

export interface Show {
  id: string;
  schemaVersion: number;
  metadata: ShowMetadata;
  acts: Act[];
  settings: ShowSettings;
}

export interface LightStageFile {
  fileType: 'lightstage_project';
  schemaVersion: number;
  exportedAt: string;
  show: Show;
}

/**
 * Sums the instance counts of a device specification list.
 * Negative / non-finite / fractional counts are sanitized to whole numbers.
 */
export function sumDeviceCounts(devices?: DeviceSpecification[]): number {
  if (!Array.isArray(devices)) return 0;
  return devices.reduce((sum, device) => {
    const count = Number(device?.count);
    if (!Number.isFinite(count) || count <= 0) return sum;
    return sum + Math.floor(count);
  }, 0);
}

/**
 * Calculates fixture and screen counts from department cues.
 * The device list (`fixtures` / `screens`) is the single source of truth;
 * `fixtureCount` / `screenCount` are only a legacy fallback when no list exists.
 */
export function calculateCueDeviceCounts(departments: DepartmentCues): {
  lightingCount: number;
  screenCount: number;
} {
  const lx = departments.lx;
  const vx = departments.vx;
  const hasFixtureList = Array.isArray(lx?.fixtures) && lx.fixtures.length > 0;
  const hasScreenList = Array.isArray(vx?.screens) && vx.screens.length > 0;
  const lightingCount = hasFixtureList ? sumDeviceCounts(lx?.fixtures) : (lx?.fixtureCount ?? 0);
  const screenCount = hasScreenList ? sumDeviceCounts(vx?.screens) : (vx?.screenCount ?? 0);
  return { lightingCount, screenCount };
}

/**
 * Factory helper: creates a fresh blank Show
 */
export function createDefaultShow(title = 'Untitled Show'): Show {
  const now = new Date().toISOString();
  const defaultActId = `act-${Date.now()}-1`;

  const defaultCue: Cue = {
    id: `cue-${Date.now()}-1`,
    actId: defaultActId,
    cueNumber: '1.0',
    title: 'Pre-Show / Walk-in',
    status: 'Pending',
    durationMs: 300000, // 5 mins
    departments: {
      lx: {
        sceneName: 'Walk-in Ambience',
        fixtureCount: 12,
        fixtures: [
          {
            id: 'dev-default-wash-1',
            name: 'Wash',
            category: 'Lighting',
            subType: 'Wash',
            count: 8,
            position: 'FOH',
          },
          {
            id: 'dev-default-spot-1',
            name: 'Spot',
            category: 'Lighting',
            subType: 'Spot',
            count: 4,
            position: 'Truss',
          },
        ],
        intensity: 60,
      },
      vx: { contentName: 'Event Logo Loop', screenCount: 1, loop: true },
      sq: { trackName: 'BGM Lounge Playlist', volume: 70 },
      st: { actionDescription: 'House doors open, audience seating' },
    },
    totalLightingFixtures: 12,
    totalScreens: 1,
  };

  return {
    id: `show-${Date.now()}`,
    schemaVersion: 1,
    metadata: {
      title,
      venue: 'Main Stage',
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
    },
    acts: [
      {
        id: defaultActId,
        title: 'Act 1',
        order: 1,
        cues: [defaultCue],
      },
    ],
    settings: {
      autoStandbyNext: true,
      countdownWarningSec: 10,
      defaultCueDurationMs: 60000,
    },
  };
}

/**
 * Factory helper: creates a new Cue
 */
export function createCue(
  actId: string,
  cueNumber: string,
  title: string,
  durationMs = 60000,
  departments: DepartmentCues = {}
): Cue {
  const counts = calculateCueDeviceCounts(departments);
  return {
    id: `cue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    actId,
    cueNumber,
    title,
    status: 'Pending',
    durationMs,
    departments,
    totalLightingFixtures: counts.lightingCount,
    totalScreens: counts.screenCount,
  };
}
