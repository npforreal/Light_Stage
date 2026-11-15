export type StagePreset = 'EndStage' | 'Festival' | 'Thrust';

export type CameraView = 'front' | 'topDown';

export type ScreenPositionType = 'Main' | 'LeftWing' | 'RightWing' | 'Floor' | 'Banner';

export interface VirtualScreen {
  id: string;
  name: string;
  type: ScreenPositionType;
  x: number; // Percentage (0 - 100)
  y: number; // Percentage (0 - 100)
  width: number; // Percentage
  height: number; // Percentage
  enabled: boolean;
}

export interface VirtualTruss {
  id: string;
  name: string;
  position: 'FOH' | 'Mid' | 'Back' | 'Floor';
  fixtureType: string;
  fixtureCount: number;
  x: number; // Percentage (0 - 100)
  y: number; // Percentage (0 - 100)
  width: number; // Percentage
  enabled: boolean;
}

export interface StageConfig {
  preset: StagePreset;
  widthMeters: number;
  depthMeters: number;
  screens: VirtualScreen[];
  trusses: VirtualTruss[];
}

export const STAGE_PRESETS: Record<StagePreset, StageConfig> = {
  EndStage: {
    preset: 'EndStage',
    widthMeters: 14,
    depthMeters: 10,
    screens: [
      { id: 'scr-main', name: 'Main LED P3', type: 'Main', x: 25, y: 15, width: 50, height: 45, enabled: true },
      { id: 'scr-lw', name: 'Wing LED Left', type: 'LeftWing', x: 8, y: 22, width: 14, height: 35, enabled: true },
      { id: 'scr-rw', name: 'Wing LED Right', type: 'RightWing', x: 78, y: 22, width: 14, height: 35, enabled: true },
      { id: 'scr-floor', name: 'Floor LED', type: 'Floor', x: 25, y: 65, width: 50, height: 25, enabled: false },
    ],
    trusses: [
      { id: 'truss-back', name: 'Back Truss', position: 'Back', fixtureType: 'Beam 350W', fixtureCount: 12, x: 10, y: 10, width: 80, enabled: true },
      { id: 'truss-mid', name: 'Mid Truss', position: 'Mid', fixtureType: 'Spot 1000W', fixtureCount: 8, x: 15, y: 35, width: 70, enabled: true },
      { id: 'truss-foh', name: 'FOH Front Truss', position: 'FOH', fixtureType: 'Par LED / Wash', fixtureCount: 16, x: 5, y: 80, width: 90, enabled: true },
      { id: 'truss-floor', name: 'Floor Fixtures', position: 'Floor', fixtureType: 'Blinder / Beam', fixtureCount: 8, x: 20, y: 62, width: 60, enabled: true },
    ],
  },
  Festival: {
    preset: 'Festival',
    widthMeters: 24,
    depthMeters: 16,
    screens: [
      { id: 'scr-main', name: 'Mega Main LED', type: 'Main', x: 20, y: 10, width: 60, height: 50, enabled: true },
      { id: 'scr-lw', name: 'Outer Wing Left', type: 'LeftWing', x: 2, y: 15, width: 15, height: 45, enabled: true },
      { id: 'scr-rw', name: 'Outer Wing Right', type: 'RightWing', x: 83, y: 15, width: 15, height: 45, enabled: true },
      { id: 'scr-banner', name: 'Truss Banner', type: 'Banner', x: 20, y: 62, width: 60, height: 8, enabled: true },
      { id: 'scr-floor', name: 'Interactive Floor', type: 'Floor', x: 25, y: 70, width: 50, height: 25, enabled: true },
    ],
    trusses: [
      { id: 'truss-back', name: 'High Back Truss', position: 'Back', fixtureType: 'Beam 350W', fixtureCount: 24, x: 5, y: 5, width: 90, enabled: true },
      { id: 'truss-mid', name: 'Mid Festival Truss', position: 'Mid', fixtureType: 'Spot / Strobe', fixtureCount: 16, x: 10, y: 30, width: 80, enabled: true },
      { id: 'truss-foh', name: 'FOH Concert Truss', position: 'FOH', fixtureType: 'Blinder & Follow', fixtureCount: 20, x: 2, y: 85, width: 96, enabled: true },
      { id: 'truss-floor', name: 'Front Stage Edge', position: 'Floor', fixtureType: 'Atomic Strobe', fixtureCount: 12, x: 15, y: 65, width: 70, enabled: true },
    ],
  },
  Thrust: {
    preset: 'Thrust',
    widthMeters: 18,
    depthMeters: 20,
    screens: [
      { id: 'scr-main', name: 'Backdrop LED', type: 'Main', x: 25, y: 10, width: 50, height: 40, enabled: true },
      { id: 'scr-floor', name: 'Catwalk Runway LED', type: 'Floor', x: 38, y: 50, width: 24, height: 45, enabled: true },
    ],
    trusses: [
      { id: 'truss-back', name: 'Back Arch', position: 'Back', fixtureType: 'Wash 19x40W', fixtureCount: 10, x: 15, y: 8, width: 70, enabled: true },
      { id: 'truss-mid', name: 'Stage Center Truss', position: 'Mid', fixtureType: 'Spot 1000W', fixtureCount: 8, x: 25, y: 35, width: 50, enabled: true },
      { id: 'truss-foh', name: 'Catwalk Overhead', position: 'FOH', fixtureType: 'Follow & Spot', fixtureCount: 12, x: 30, y: 70, width: 40, enabled: true },
    ],
  },
};
